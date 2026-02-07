/**
 * Exemplar Auto-Accumulation Collector
 *
 * Extracts the best passages from evaluated chapters, scores them,
 * deduplicates against existing exemplars, and promotes them to
 * the Style Library.
 *
 * Pipeline: Extract -> Score -> Filter -> Classify -> Deduplicate -> Promote
 *
 * @module self-improvement/exemplar-collector
 */

import type { ExemplarCandidate, CollectorConfig } from './types.js';
import { DEFAULT_COLLECTOR_CONFIG } from './types.js';
import type {
  StyleExemplar,
  StyleLibrary,
  NewExemplarInput,
  ExemplarCategory,
  SceneType,
} from '../style-library/types.js';
import type { StyleProfile } from '../style-library/style-profile.js';
import type { QualityAssessment } from '../pipeline/types.js';
import { getParagraphs } from '../pipeline/quality-oracle.js';
import { classifyExemplar } from '../style-library/classifier.js';
import {
  computeStylometrics,
  computeStyleMatch,
} from '../style-library/style-analyzer.js';
import {
  addExemplar,
  removeExemplar,
  loadLibrary,
  saveLibrary,
} from '../style-library/storage.js';

// ============================================================================
// Candidate Extraction
// ============================================================================

/**
 * Extract exemplar candidates from chapter content.
 *
 * Uses a sliding window over paragraphs to find passages within
 * the 500-2000 char range, scores them using quality assessment
 * and optional style profile, and filters by promotion threshold.
 *
 * @param content - Full chapter content
 * @param chapterNumber - Chapter number for provenance tracking
 * @param qualityAssessment - Quality Oracle assessment for scoring
 * @param styleProfile - Optional style profile for style match scoring
 * @param config - Optional collector configuration overrides
 * @returns ExemplarCandidate[] sorted by combinedScore descending
 */
export function extractCandidates(
  content: string,
  chapterNumber: number,
  qualityAssessment: QualityAssessment,
  styleProfile?: StyleProfile,
  config?: Partial<CollectorConfig>
): ExemplarCandidate[] {
  const cfg = { ...DEFAULT_COLLECTOR_CONFIG, ...config };
  const paragraphs = getParagraphs(content);
  const candidates: ExemplarCandidate[] = [];

  // Calculate chapter-level quality score from assessment dimensions
  const qualityScore = computeQualityScore(qualityAssessment);

  // Sliding window over paragraphs
  for (const windowSize of cfg.windowSizes) {
    for (let i = 0; i + windowSize <= paragraphs.length; i++) {
      const windowParagraphs = paragraphs.slice(i, i + windowSize);
      const passage = windowParagraphs.map(p => p.text).join('\n\n');

      // Length constraint: 500-2000 chars (per StyleExemplar schema)
      if (passage.length < 500 || passage.length > 2000) continue;

      // Calculate style match score
      const styleMatchScore = styleProfile
        ? computeStyleMatch(passage, styleProfile).overallMatch
        : qualityScore; // Fallback to quality score when no profile

      // Combined score formula: 60% quality + 40% style
      const combinedScore = 0.6 * qualityScore + 0.4 * styleMatchScore;

      // Filter by promotion threshold
      if (combinedScore < cfg.promotionThreshold) continue;

      // Classify the passage
      const category = classifyExemplar(passage);

      candidates.push({
        content: passage,
        qualityScore,
        styleMatchScore,
        combinedScore,
        category,
        sourceChapter: chapterNumber,
        paragraphRange: [i, i + windowSize - 1],
      });
    }
  }

  // Sort by combinedScore descending
  candidates.sort((a, b) => b.combinedScore - a.combinedScore);

  // Apply top percentile filter: keep only top N%
  const topCount = Math.max(1, Math.ceil(candidates.length * cfg.topPercentile));
  return candidates.slice(0, topCount);
}

/**
 * Compute quality score from QualityAssessment dimensions.
 *
 * Averages: proseQuality, sensoryGrounding, rhythmVariation,
 * characterVoice, transitionQuality scores.
 */
function computeQualityScore(assessment: QualityAssessment): number {
  const scores = [
    assessment.proseQuality.score,
    assessment.sensoryGrounding.score,
    assessment.rhythmVariation.score,
    assessment.characterVoice.score,
    assessment.transitionQuality.score,
  ];
  return scores.reduce((sum, s) => sum + s, 0) / scores.length;
}

// ============================================================================
// Deduplication
// ============================================================================

/**
 * Normalization ranges for stylometric metrics.
 * Used to normalize metrics to 0-1 range for distance computation.
 */
const METRIC_RANGES = {
  ttr: { min: 0, max: 1 },
  mtld: { min: 10, max: 200 },
  meanSentenceLength: { min: 3, max: 50 },
  dialogueRatio: { min: 0, max: 1 },
  sensoryDensity: { min: 0, max: 30 },
};

/**
 * Check if a candidate passage is a duplicate of an existing exemplar.
 *
 * Uses stylometric fingerprinting: computes 5 key metrics for both
 * candidate and each existing exemplar, normalizes to 0-1, computes
 * Euclidean distance, and converts to similarity score.
 *
 * @param candidateContent - Content of the candidate passage
 * @param existingExemplars - Existing exemplars to check against
 * @param threshold - Similarity threshold (default: 0.85)
 * @returns true if candidate is a duplicate (similarity > threshold)
 */
export function isDuplicate(
  candidateContent: string,
  existingExemplars: StyleExemplar[],
  threshold: number = 0.85
): boolean {
  if (existingExemplars.length === 0) return false;

  const candidateMetrics = computeStylometrics(candidateContent);

  for (const existing of existingExemplars) {
    const existingMetrics = computeStylometrics(existing.content);

    // Normalize and compare 5 key metrics
    const candidateNormalized = [
      normalize(candidateMetrics.lexicalDiversity.ttr, METRIC_RANGES.ttr),
      normalize(candidateMetrics.lexicalDiversity.mtld, METRIC_RANGES.mtld),
      normalize(candidateMetrics.sentenceStatistics.meanLength, METRIC_RANGES.meanSentenceLength),
      normalize(candidateMetrics.dialogueMetrics.dialogueRatio, METRIC_RANGES.dialogueRatio),
      normalize(candidateMetrics.sensoryMetrics.sensoryDensity, METRIC_RANGES.sensoryDensity),
    ];

    const existingNormalized = [
      normalize(existingMetrics.lexicalDiversity.ttr, METRIC_RANGES.ttr),
      normalize(existingMetrics.lexicalDiversity.mtld, METRIC_RANGES.mtld),
      normalize(existingMetrics.sentenceStatistics.meanLength, METRIC_RANGES.meanSentenceLength),
      normalize(existingMetrics.dialogueMetrics.dialogueRatio, METRIC_RANGES.dialogueRatio),
      normalize(existingMetrics.sensoryMetrics.sensoryDensity, METRIC_RANGES.sensoryDensity),
    ];

    // Euclidean distance
    let sumSquaredDiffs = 0;
    for (let i = 0; i < candidateNormalized.length; i++) {
      const diff = candidateNormalized[i] - existingNormalized[i];
      sumSquaredDiffs += diff * diff;
    }
    const distance = Math.sqrt(sumSquaredDiffs);

    // Max possible distance in 5D unit hypercube = sqrt(5) ~ 2.236
    const maxDistance = Math.sqrt(candidateNormalized.length);
    const normalizedDistance = distance / maxDistance;
    const similarity = 1 - normalizedDistance;

    if (similarity > threshold) return true;
  }

  return false;
}

/**
 * Normalize a value to 0-1 range given min/max bounds.
 * Clamps to [0, 1].
 */
function normalize(value: number, range: { min: number; max: number }): number {
  if (range.max === range.min) return 0.5;
  const normalized = (value - range.min) / (range.max - range.min);
  return Math.max(0, Math.min(1, normalized));
}

// ============================================================================
// Eviction
// ============================================================================

/**
 * Evict lowest-scoring auto-accumulated exemplars when scene_type cap is exceeded.
 *
 * Rules:
 * - Only evict exemplars with source === 'auto-accumulated'
 * - Never evict curated exemplars (any other source value)
 * - Sort auto-accumulated by score (extracted from quality_notes), evict lowest
 *
 * @param library - Current style library
 * @param sceneType - Scene type to check cap for
 * @param maxPerType - Maximum exemplars per scene type
 * @returns Updated library with excess exemplars evicted
 */
export function evictLowestScoring(
  library: StyleLibrary,
  sceneType: SceneType,
  maxPerType: number
): StyleLibrary {
  const matchingExemplars = library.exemplars.filter(
    e => e.scene_type === sceneType
  );

  if (matchingExemplars.length <= maxPerType) {
    return library;
  }

  // Separate curated vs auto-accumulated
  const curated = matchingExemplars.filter(e => e.source !== 'auto-accumulated');
  const autoAccumulated = matchingExemplars.filter(e => e.source === 'auto-accumulated');

  // If curated alone exceeds cap, cannot evict - return unchanged
  if (curated.length >= maxPerType) {
    return library;
  }

  // How many auto-accumulated can we keep?
  const autoSlotsAvailable = maxPerType - curated.length;

  // Sort auto-accumulated by score (highest first)
  autoAccumulated.sort((a, b) => {
    const scoreA = extractScoreFromNotes(a.quality_notes);
    const scoreB = extractScoreFromNotes(b.quality_notes);
    return scoreB - scoreA;
  });

  // IDs to remove (the lowest-scoring ones beyond the cap)
  const toRemove = autoAccumulated.slice(autoSlotsAvailable);

  let updatedLibrary = library;
  for (const exemplar of toRemove) {
    updatedLibrary = removeExemplar(updatedLibrary, exemplar.id);
  }

  return updatedLibrary;
}

/**
 * Extract numeric score from quality_notes string.
 *
 * Looks for pattern "combinedScore: XX.X" in quality_notes.
 * Returns 0 if no score found.
 */
function extractScoreFromNotes(notes?: string): number {
  if (!notes) return 0;
  const match = notes.match(/combinedScore:\s*([\d.]+)/);
  if (match) return parseFloat(match[1]);
  return 0;
}

// ============================================================================
// Promotion Pipeline
// ============================================================================

/**
 * Promote exemplar candidates to the Style Library.
 *
 * For each candidate (already sorted by score):
 * 1. Check for duplicates against existing library
 * 2. Enforce scene_type cap with eviction
 * 3. Create NewExemplarInput with proper metadata
 * 4. Add to library via addExemplar()
 * 5. Save final library to disk
 *
 * @param candidates - Candidates sorted by combinedScore descending
 * @param projectDir - Project directory for library I/O
 * @param genre - Genre tag for promoted exemplars
 * @param config - Optional collector configuration overrides
 * @returns Number of candidates successfully promoted
 */
export async function promoteCandidates(
  candidates: ExemplarCandidate[],
  projectDir: string,
  genre: string,
  config?: Partial<CollectorConfig>
): Promise<number> {
  const cfg = { ...DEFAULT_COLLECTOR_CONFIG, ...config };
  let library = await loadLibrary(projectDir);
  let promotedCount = 0;

  for (const candidate of candidates) {
    // Check for duplicates
    if (isDuplicate(candidate.content, library.exemplars, cfg.deduplicationThreshold)) {
      continue;
    }

    // Enforce scene_type cap with eviction
    library = evictLowestScoring(library, candidate.category.scene_type, cfg.maxPerSceneType);

    // Build NewExemplarInput
    const input: NewExemplarInput = {
      content: candidate.content,
      genre: [genre],
      scene_type: candidate.category.scene_type,
      emotional_tone: candidate.category.emotional_tone
        ? [candidate.category.emotional_tone]
        : undefined,
      pov: candidate.category.pov,
      pacing: candidate.category.pacing,
      is_anti_exemplar: false,
      source: 'auto-accumulated',
      quality_notes: `Auto-collected from chapter ${candidate.sourceChapter}, combinedScore: ${candidate.combinedScore.toFixed(1)}`,
    };

    // Add to library
    library = addExemplar(library, input);
    promotedCount++;
  }

  // Save final library to disk
  await saveLibrary(projectDir, library);

  return promotedCount;
}
