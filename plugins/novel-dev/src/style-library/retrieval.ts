/**
 * Style Exemplar Retrieval Module
 *
 * Provides query-based retrieval of style exemplars with multi-dimensional scoring.
 */

import type {
  StyleLibrary,
  StyleExemplar,
  ExemplarQuery,
  ExemplarResult,
} from './types.js';
import { estimateTokens } from '../context/estimator.js';

// ============================================================================
// Constants
// ============================================================================

/** Maximum total exemplars to return (2-3 good + 0-1 anti) per RESEARCH.md */
const MAX_TOTAL_EXEMPLARS = 4;

/** Default number of good exemplars to return */
const DEFAULT_LIMIT = 3;

/** Scoring weights for different match dimensions */
const SCORE_WEIGHTS = {
  /** Points per matching genre (can match multiple) */
  GENRE_MATCH: 10,
  /** Points for exact scene_type match */
  SCENE_TYPE_MATCH: 20,
  /** Points per matching emotional_tone (can match multiple) */
  EMOTIONAL_TONE_MATCH: 5,
  /** Points for exact pov match */
  POV_MATCH: 8,
  /** Points for exact pacing match */
  PACING_MATCH: 5,
};

// ============================================================================
// Main Query Function
// ============================================================================

/**
 * Queries the style library for exemplars matching the given criteria.
 *
 * Scoring algorithm:
 * - genre match: +10 per matching genre
 * - scene_type exact match: +20
 * - emotional_tone match: +5 per matching tone
 * - pov match: +8
 * - pacing match: +5
 *
 * Returns top N good exemplars (default 3) plus at most 1 anti-exemplar.
 * Total capped at 4 exemplars per RESEARCH.md guidance (to avoid diluting style signal).
 *
 * @param library - The style library to query
 * @param query - Query parameters specifying desired attributes
 * @returns ExemplarResult with matched exemplars, optional anti-exemplar, and token count
 *
 * @example
 * ```typescript
 * const result = queryExemplars(library, {
 *   genre: 'romance',
 *   scene_type: 'dialogue',
 *   emotional_tone: 'warmth',
 *   limit: 2,
 *   include_anti: true
 * });
 * // result.exemplars: top 2 matching good exemplars
 * // result.anti_exemplar: highest-scoring anti-exemplar (if available)
 * ```
 */
export function queryExemplars(
  library: StyleLibrary,
  query: ExemplarQuery
): ExemplarResult {
  // Handle empty library
  if (!library.exemplars || library.exemplars.length === 0) {
    return {
      exemplars: [],
      anti_exemplar: undefined,
      total_tokens: 0,
    };
  }

  // Separate good exemplars from anti-exemplars
  const goodExemplars = library.exemplars.filter((e) => !e.is_anti_exemplar);
  const antiExemplars = library.exemplars.filter((e) => e.is_anti_exemplar);

  // Score and sort good exemplars
  const scoredGoodExemplars = goodExemplars
    .map((exemplar) => ({
      exemplar,
      score: calculateScore(exemplar, query),
    }))
    .filter((item) => item.score > 0) // Only include items with at least some match
    .sort((a, b) => b.score - a.score);

  // Get top N good exemplars
  const limit = Math.min(query.limit ?? DEFAULT_LIMIT, MAX_TOTAL_EXEMPLARS - 1);
  const selectedGoodExemplars = scoredGoodExemplars.slice(0, limit).map((item) => item.exemplar);

  // Select anti-exemplar if requested (default: true)
  let selectedAntiExemplar: StyleExemplar | undefined;
  if (query.include_anti !== false && antiExemplars.length > 0) {
    selectedAntiExemplar = selectAntiExemplar(antiExemplars, selectedGoodExemplars, query);
  }

  // Calculate total tokens
  const allContent = [
    ...selectedGoodExemplars.map((e) => e.content),
    ...(selectedAntiExemplar ? [selectedAntiExemplar.content] : []),
  ].join('\n\n');
  const totalTokens = estimateTokens(allContent, 'korean');

  return {
    exemplars: selectedGoodExemplars,
    anti_exemplar: selectedAntiExemplar,
    total_tokens: totalTokens,
  };
}

// ============================================================================
// Scoring Functions
// ============================================================================

/**
 * Calculates match score for an exemplar against the query
 */
function calculateScore(exemplar: StyleExemplar, query: ExemplarQuery): number {
  let score = 0;

  // Genre match: +10 per matching genre
  if (exemplar.genre && exemplar.genre.length > 0) {
    const queryGenreLower = query.genre.toLowerCase();
    for (const genre of exemplar.genre) {
      if (genre.toLowerCase() === queryGenreLower) {
        score += SCORE_WEIGHTS.GENRE_MATCH;
      }
    }
  }

  // Scene type exact match: +20
  if (exemplar.scene_type === query.scene_type) {
    score += SCORE_WEIGHTS.SCENE_TYPE_MATCH;
  }

  // Emotional tone match: +5 per matching tone
  if (query.emotional_tone && exemplar.emotional_tone) {
    const queryToneLower = query.emotional_tone.toLowerCase();
    for (const tone of exemplar.emotional_tone) {
      if (tone.toLowerCase() === queryToneLower) {
        score += SCORE_WEIGHTS.EMOTIONAL_TONE_MATCH;
      }
    }
  }

  // POV match: +8
  if (query.pov && exemplar.pov === query.pov) {
    score += SCORE_WEIGHTS.POV_MATCH;
  }

  // Pacing match: +5
  if (query.pacing && exemplar.pacing === query.pacing) {
    score += SCORE_WEIGHTS.PACING_MATCH;
  }

  return score;
}

/**
 * Selects the best anti-exemplar to pair with the results.
 *
 * Preference order:
 * 1. Anti-exemplar whose anti_exemplar_pair points to one of the selected good exemplars
 * 2. Highest-scoring anti-exemplar based on query criteria
 */
function selectAntiExemplar(
  antiExemplars: StyleExemplar[],
  selectedGoodExemplars: StyleExemplar[],
  query: ExemplarQuery
): StyleExemplar | undefined {
  // First, look for anti-exemplars paired with selected good exemplars
  const selectedIds = new Set(selectedGoodExemplars.map((e) => e.id));
  const pairedAnti = antiExemplars.find(
    (e) => e.anti_exemplar_pair && selectedIds.has(e.anti_exemplar_pair)
  );
  if (pairedAnti) {
    return pairedAnti;
  }

  // Otherwise, score anti-exemplars and return the highest match
  const scoredAntiExemplars = antiExemplars
    .map((exemplar) => ({
      exemplar,
      score: calculateScore(exemplar, query),
    }))
    .sort((a, b) => b.score - a.score);

  return scoredAntiExemplars.length > 0 ? scoredAntiExemplars[0].exemplar : undefined;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Gets library statistics useful for debugging
 */
export function getLibraryStats(library: StyleLibrary): {
  total: number;
  good: number;
  anti: number;
  byGenre: Record<string, number>;
  bySceneType: Record<string, number>;
} {
  const exemplars = library.exemplars || [];
  const good = exemplars.filter((e) => !e.is_anti_exemplar);
  const anti = exemplars.filter((e) => e.is_anti_exemplar);

  const byGenre: Record<string, number> = {};
  const bySceneType: Record<string, number> = {};

  for (const e of exemplars) {
    for (const genre of e.genre) {
      byGenre[genre] = (byGenre[genre] || 0) + 1;
    }
    bySceneType[e.scene_type] = (bySceneType[e.scene_type] || 0) + 1;
  }

  return {
    total: exemplars.length,
    good: good.length,
    anti: anti.length,
    byGenre,
    bySceneType,
  };
}
