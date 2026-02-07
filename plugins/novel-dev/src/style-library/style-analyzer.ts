/**
 * Style Analyzer
 *
 * Stylometric analysis engine for extracting quantifiable style patterns
 * from reference text and comparing content against style profiles.
 *
 * Core functions:
 * - analyzeStyleFromReference: Extract StyleProfile from reference text
 * - computeStyleMatch: Compare content against a StyleProfile
 *
 * @module style-library/style-analyzer
 */

import type {
  StyleProfile,
  Stylometrics,
  LexicalDiversity,
  SentenceStatistics,
  SentenceLengthDistribution,
  DialogueMetrics,
  SensoryMetrics,
  RhythmPatterns,
  SenseType,
  StyleMatchResult,
  StyleAspectScores,
  StyleDeviation,
  DeviationSeverity,
} from './style-profile.js';
import { createStyleProfile } from './style-profile.js';

// ============================================================================
// Sensory Word Lists (Korean)
// ============================================================================

/**
 * Korean sensory words by sense type
 */
const SENSORY_WORDS: Record<SenseType, string[]> = {
  visual: [
    '보이다', '빛나다', '반짝이다', '어둡다', '밝다', '흐릿하다', '선명하다',
    '붉다', '푸르다', '하얗다', '검다', '노랗다', '투명하다', '뿌옇다',
    '번쩍', '반짝', '희미하게', '눈부시다', '그림자', '빛', '색깔',
  ],
  auditory: [
    '들리다', '소리', '울리다', '속삭이다', '외치다', '조용하다', '시끄럽다',
    '웅성', '쿵', '탁', '철컥', '찰칵', '딸랑', '윙윙', '쉿', '아우성',
    '울음', '목소리', '기침', '발자국', '바람 소리',
  ],
  tactile: [
    '만지다', '느끼다', '따뜻하다', '차갑다', '뜨겁다', '부드럽다', '거칠다',
    '축축하다', '건조하다', '끈적이다', '미끄럽다', '딱딱하다', '말랑하다',
    '가렵다', '아프다', '얼얼하다', '저리다', '두근', '떨리다',
  ],
  olfactory: [
    '냄새', '향기', '악취', '구수하다', '고소하다', '비릿하다', '달콤하다',
    '퀴퀴하다', '역겹다', '상쾌하다', '코', '맡다', '풍기다', '냄새나다',
  ],
  gustatory: [
    '맛', '달다', '짜다', '쓰다', '시다', '맵다', '고소하다', '담백하다',
    '씹다', '삼키다', '음미하다', '혀', '입맛', '맛있다', '맛없다',
  ],
};

// ============================================================================
// Text Analysis Helpers
// ============================================================================

/**
 * Extract words from Korean text
 *
 * Handles Korean morphology by splitting on spaces and punctuation.
 * Note: This is a simplified tokenizer. For production, consider KoNLPy or similar.
 *
 * @param text - Korean text to tokenize
 * @returns Array of words
 */
export function extractWords(text: string): string[] {
  // Remove punctuation and split on whitespace
  const cleaned = text
    .replace(/[""''「」『』【】〈〉《》\[\]()（）「」『』]/g, ' ')
    .replace(/[.,!?;:…·—―-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return cleaned.split(' ').filter(word => word.length > 0);
}

/**
 * Compute Type-Token Ratio (TTR)
 *
 * TTR = unique words / total words
 * Range: 0-1 (higher = more diverse vocabulary)
 *
 * @param text - Text to analyze
 * @returns TTR value between 0 and 1
 */
export function computeTTR(text: string): number {
  const words = extractWords(text);
  if (words.length === 0) return 0;

  const uniqueWords = new Set(words);
  return uniqueWords.size / words.length;
}

/**
 * Compute MTLD (Measure of Textual Lexical Diversity)
 *
 * Simplified segment-based algorithm:
 * - Segment text until TTR drops below 0.72
 * - Average segment length = MTLD
 *
 * Typical range: 50-150 (higher = more diverse)
 *
 * @param text - Text to analyze
 * @returns MTLD value (typically 50-150)
 */
export function computeMTLD(text: string): number {
  const words = extractWords(text);
  if (words.length < 10) return words.length;

  const TTR_THRESHOLD = 0.72;
  let segmentCount = 0;
  let totalLength = 0;

  // Forward pass
  let segmentStart = 0;
  const uniqueInSegment = new Set<string>();

  for (let i = 0; i < words.length; i++) {
    uniqueInSegment.add(words[i]);
    const segmentLen = i - segmentStart + 1;
    const segmentTTR = uniqueInSegment.size / segmentLen;

    if (segmentTTR <= TTR_THRESHOLD) {
      segmentCount++;
      totalLength += segmentLen;
      segmentStart = i + 1;
      uniqueInSegment.clear();
    }
  }

  // Handle partial final segment
  if (segmentStart < words.length) {
    const remaining = words.length - segmentStart;
    const remainingUnique = new Set(words.slice(segmentStart));
    const remainingTTR = remainingUnique.size / remaining;

    if (remainingTTR <= TTR_THRESHOLD) {
      segmentCount++;
      totalLength += remaining;
    } else {
      // Partial factor
      const partialFactor = (1 - remainingTTR) / (1 - TTR_THRESHOLD);
      segmentCount += partialFactor;
      totalLength += remaining * partialFactor;
    }
  }

  return segmentCount > 0 ? totalLength / segmentCount : words.length;
}

/**
 * Korean sentence ending patterns
 * These regex patterns capture common Korean sentence enders
 */
const KOREAN_SENTENCE_ENDERS = /[.!?。？！]+|(?<=[다요죠까나네지요])[.。!！?？]?(?=\s|$)/g;

/**
 * Extract sentences from Korean text
 *
 * Handles Korean sentence enders: 다, 요, 죠, 까, 나, 네, 지요 etc.
 *
 * @param text - Korean text to segment
 * @returns Array of sentences
 */
export function extractSentences(text: string): string[] {
  // First, normalize newlines and multiple spaces
  const normalized = text.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim();

  // Split by Korean sentence patterns
  // Match sentences ending with: period, !, ?, or Korean verbal endings
  const sentences: string[] = [];
  let lastEnd = 0;

  // Use a simpler approach: split on sentence-ending patterns
  const sentencePattern = /[^.!?。？！]*[.!?。？！]+|[^.!?。？！]+(?=[다요죠까나네라])\s/g;

  // Alternative: split on common sentence ending patterns
  const parts = normalized.split(/(?<=[다요죠까나네지라][.!?。？！]?\s)|(?<=[.!?。？！]\s)/);

  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed.length > 0) {
      sentences.push(trimmed);
    }
  }

  // If no sentences found, return the whole text as one sentence
  if (sentences.length === 0 && normalized.length > 0) {
    return [normalized];
  }

  return sentences;
}

/**
 * Compute dialogue ratio
 *
 * Calculates the proportion of text that is dialogue (in quotes)
 *
 * @param text - Text to analyze
 * @returns Dialogue ratio (0-1)
 */
export function computeDialogueRatio(text: string): number {
  if (text.length === 0) return 0;

  // Match all dialogue patterns
  const dialoguePatterns = [
    /[""]([^""]+)[""]/g,  // Western double quotes
    /['']([^'']+)['']/g,  // Western single quotes
    /「([^」]+)」/g,       // Japanese-style quotes
    /『([^』]+)』/g,       // Double Japanese-style quotes
  ];

  let dialogueChars = 0;

  for (const pattern of dialoguePatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      dialogueChars += match[1].length;
    }
  }

  return dialogueChars / text.length;
}

/**
 * Extract dialogues from text
 *
 * @param text - Text to extract dialogues from
 * @returns Array of dialogue strings
 */
export function extractDialogues(text: string): string[] {
  const dialogues: string[] = [];
  const dialoguePatterns = [
    /[""]([^""]+)[""]/g,
    /['']([^'']+)['']/g,
    /「([^」]+)」/g,
    /『([^』]+)』/g,
  ];

  for (const pattern of dialoguePatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      dialogues.push(match[1]);
    }
  }

  return dialogues;
}

/**
 * Count sensory words in text
 *
 * @param text - Text to analyze
 * @returns Sensory count and dominant senses
 */
export function countSensoryWords(text: string): { count: number; dominant: SenseType[] } {
  const counts: Record<SenseType, number> = {
    visual: 0,
    auditory: 0,
    tactile: 0,
    olfactory: 0,
    gustatory: 0,
  };

  for (const [sense, words] of Object.entries(SENSORY_WORDS) as [SenseType, string[]][]) {
    for (const word of words) {
      const regex = new RegExp(word, 'g');
      const matches = text.match(regex);
      if (matches) {
        counts[sense] += matches.length;
      }
    }
  }

  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  // Sort senses by count to find dominant
  const sorted = (Object.entries(counts) as [SenseType, number][])
    .sort((a, b) => b[1] - a[1])
    .filter(([_, count]) => count > 0)
    .map(([sense, _]) => sense);

  return { count: total, dominant: sorted };
}

/**
 * Count dialogue-to-narration transitions
 *
 * Counts how often the text switches between dialogue and narration
 *
 * @param text - Text to analyze
 * @returns Transitions per 1000 characters
 */
export function countDialogueTransitions(text: string): number {
  if (text.length === 0) return 0;

  // Find all positions where quotes start or end
  let transitions = 0;
  let inDialogue = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const isQuoteStart = /["「『']/.test(char);
    const isQuoteEnd = /["」』']/.test(char);

    if (isQuoteStart && !inDialogue) {
      inDialogue = true;
      transitions++;
    } else if (isQuoteEnd && inDialogue) {
      inDialogue = false;
      transitions++;
    }
  }

  return (transitions / text.length) * 1000;
}

/**
 * Extract paragraphs from text
 *
 * @param text - Text to split
 * @returns Array of paragraphs
 */
export function extractParagraphs(text: string): string[] {
  return text
    .split(/\n\n+/)
    .map(p => p.trim())
    .filter(p => p.length > 0);
}

/**
 * Compute standard deviation
 *
 * @param values - Array of numbers
 * @param mean - Pre-computed mean (optional)
 * @returns Standard deviation
 */
function computeStdDev(values: number[], mean?: number): number {
  if (values.length === 0) return 0;
  const avg = mean ?? values.reduce((a, b) => a + b, 0) / values.length;
  const squareDiffs = values.map(v => Math.pow(v - avg, 2));
  return Math.sqrt(squareDiffs.reduce((a, b) => a + b, 0) / values.length);
}

// ============================================================================
// Stylometric Analysis
// ============================================================================

/**
 * Compute complete Stylometrics from text
 *
 * @param text - Text to analyze
 * @returns Complete Stylometrics object
 */
export function computeStylometrics(text: string): Stylometrics {
  const words = extractWords(text);
  const sentences = extractSentences(text);
  const paragraphs = extractParagraphs(text);
  const dialogues = extractDialogues(text);

  // Lexical Diversity
  const uniqueWords = new Set(words);
  const lexicalDiversity: LexicalDiversity = {
    ttr: words.length > 0 ? uniqueWords.size / words.length : 0,
    mtld: computeMTLD(text),
    uniqueWordCount: uniqueWords.size,
    totalWordCount: words.length,
  };

  // Sentence Statistics
  const sentenceLengths = sentences.map(s => extractWords(s).length);
  const meanLength =
    sentenceLengths.length > 0
      ? sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length
      : 0;
  const stdDeviation = computeStdDev(sentenceLengths, meanLength);

  // Distribution buckets
  const distribution: SentenceLengthDistribution = {
    short: 0,
    medium: 0,
    long: 0,
    veryLong: 0,
  };

  for (const len of sentenceLengths) {
    if (len < 10) distribution.short++;
    else if (len < 20) distribution.medium++;
    else if (len < 35) distribution.long++;
    else distribution.veryLong++;
  }

  const total = sentenceLengths.length || 1;
  distribution.short /= total;
  distribution.medium /= total;
  distribution.long /= total;
  distribution.veryLong /= total;

  const sentenceStatistics: SentenceStatistics = {
    meanLength,
    stdDeviation,
    distribution,
  };

  // Dialogue Metrics
  const dialogueRatio = computeDialogueRatio(text);
  const dialogueWords = dialogues.flatMap(d => extractWords(d));
  const avgDialogueLength =
    dialogues.length > 0 ? dialogueWords.length / dialogues.length : 0;

  const dialogueMetrics: DialogueMetrics = {
    dialogueRatio,
    avgDialogueLength,
    dialogueToNarrationTransitions: countDialogueTransitions(text),
  };

  // Sensory Metrics
  const sensoryAnalysis = countSensoryWords(text);
  const sensoryMetrics: SensoryMetrics = {
    sensoryDensity: text.length > 0 ? (sensoryAnalysis.count / text.length) * 1000 : 0,
    dominantSenses: sensoryAnalysis.dominant,
  };

  // Rhythm Patterns
  const paragraphLengths = paragraphs.map(p => extractWords(p).length);
  const paragraphLengthMean =
    paragraphLengths.length > 0
      ? paragraphLengths.reduce((a, b) => a + b, 0) / paragraphLengths.length
      : 0;
  const paragraphLengthStdDev = computeStdDev(paragraphLengths, paragraphLengthMean);

  const rhythmPatterns: RhythmPatterns = {
    paragraphLengthMean,
    paragraphLengthStdDev,
    sentenceVariation: meanLength > 0 ? stdDeviation / meanLength : 0,
  };

  return {
    lexicalDiversity,
    sentenceStatistics,
    dialogueMetrics,
    sensoryMetrics,
    rhythmPatterns,
  };
}

/**
 * Analysis options for style extraction
 */
export interface AnalyzeStyleOptions {
  /** Maximum characters to sample for analysis (default: entire text) */
  sampleSize?: number;
}

/**
 * Analyze style from reference text and create StyleProfile
 *
 * Main entry point for style extraction. Computes full Stylometrics
 * from reference text and creates a StyleProfile.
 *
 * @param text - Reference text to analyze
 * @param name - Name for the style profile
 * @param options - Analysis options
 * @returns StyleProfile with computed stylometrics
 */
export async function analyzeStyleFromReference(
  text: string,
  name: string = 'Reference Style',
  options: AnalyzeStyleOptions = {}
): Promise<StyleProfile> {
  // Sample text if requested
  let sampleText = text;
  if (options.sampleSize && text.length > options.sampleSize) {
    // Take from multiple positions for representative sample
    const chunkSize = Math.floor(options.sampleSize / 3);
    const start = text.slice(0, chunkSize);
    const middle = text.slice(
      Math.floor(text.length / 2) - chunkSize / 2,
      Math.floor(text.length / 2) + chunkSize / 2
    );
    const end = text.slice(-chunkSize);
    sampleText = start + '\n\n' + middle + '\n\n' + end;
  }

  // Compute stylometrics
  const stylometrics = computeStylometrics(sampleText);

  // Generate unique ID
  const id = `style_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  // Create profile (factory function handles constraint generation)
  const profile = createStyleProfile(
    id,
    name,
    `Extracted from ${text.length.toLocaleString()} characters of reference text`,
    stylometrics
  );

  return profile;
}

// ============================================================================
// Style Matching
// ============================================================================

/**
 * Compute match score for a single numeric metric
 *
 * @param actual - Actual value
 * @param target - Target value
 * @param tolerance - Tolerance as fraction (0-1)
 * @returns Score 0-100
 */
function computeMetricMatch(actual: number, target: number, tolerance: number): number {
  if (target === 0) return actual === 0 ? 100 : 0;

  const deviation = Math.abs(actual - target) / target;
  if (deviation <= tolerance) return 100;

  // Linearly decrease score beyond tolerance
  const excessDeviation = deviation - tolerance;
  const score = Math.max(0, 100 - excessDeviation * 100);
  return score;
}

/**
 * Determine severity of a deviation
 *
 * @param actual - Actual value
 * @param target - Target value
 * @param tolerance - Tolerance threshold
 * @returns Severity level
 */
function determineSeverity(actual: number, target: number, tolerance: number): DeviationSeverity {
  if (target === 0) return actual === 0 ? 'minor' : 'major';

  const deviation = Math.abs(actual - target) / target;

  if (deviation <= tolerance) return 'minor';
  if (deviation <= tolerance * 2) return 'moderate';
  return 'major';
}

/**
 * Compare content against a StyleProfile
 *
 * Computes per-aspect match scores and identifies deviations.
 *
 * @param content - Content to evaluate
 * @param profile - Target StyleProfile to match
 * @returns StyleMatchResult with scores and deviations
 */
export function computeStyleMatch(content: string, profile: StyleProfile): StyleMatchResult {
  const contentMetrics = computeStylometrics(content);
  const target = profile.stylometrics;
  const deviations: StyleDeviation[] = [];

  // Default tolerance for comparisons
  const DEFAULT_TOLERANCE = 0.25;

  // 1. Lexical Diversity Match
  const ttrMatch = computeMetricMatch(
    contentMetrics.lexicalDiversity.ttr,
    target.lexicalDiversity.ttr,
    DEFAULT_TOLERANCE
  );
  const mtldMatch = computeMetricMatch(
    contentMetrics.lexicalDiversity.mtld,
    target.lexicalDiversity.mtld,
    0.3
  );
  const lexicalScore = (ttrMatch + mtldMatch) / 2;

  if (lexicalScore < 70) {
    const severity = determineSeverity(
      contentMetrics.lexicalDiversity.ttr,
      target.lexicalDiversity.ttr,
      DEFAULT_TOLERANCE
    );
    deviations.push({
      aspect: '어휘 다양성',
      expected: `TTR ${(target.lexicalDiversity.ttr * 100).toFixed(0)}%, MTLD ${target.lexicalDiversity.mtld.toFixed(0)}`,
      actual: `TTR ${(contentMetrics.lexicalDiversity.ttr * 100).toFixed(0)}%, MTLD ${contentMetrics.lexicalDiversity.mtld.toFixed(0)}`,
      severity,
      suggestion:
        contentMetrics.lexicalDiversity.ttr < target.lexicalDiversity.ttr
          ? '더 다양한 어휘를 사용하세요. 반복되는 단어를 동의어로 대체하세요.'
          : '어휘 사용을 간결하게 하세요. 핵심 단어를 일관되게 사용하세요.',
    });
  }

  // 2. Sentence Structure Match
  const meanLenMatch = computeMetricMatch(
    contentMetrics.sentenceStatistics.meanLength,
    target.sentenceStatistics.meanLength,
    DEFAULT_TOLERANCE
  );
  const variationMatch = computeMetricMatch(
    contentMetrics.rhythmPatterns.sentenceVariation,
    target.rhythmPatterns.sentenceVariation,
    0.3
  );
  const sentenceScore = (meanLenMatch + variationMatch) / 2;

  if (sentenceScore < 70) {
    const severity = determineSeverity(
      contentMetrics.sentenceStatistics.meanLength,
      target.sentenceStatistics.meanLength,
      DEFAULT_TOLERANCE
    );
    deviations.push({
      aspect: '문장 구조',
      expected: `평균 ${target.sentenceStatistics.meanLength.toFixed(1)}단어/문장`,
      actual: `평균 ${contentMetrics.sentenceStatistics.meanLength.toFixed(1)}단어/문장`,
      severity,
      suggestion:
        contentMetrics.sentenceStatistics.meanLength < target.sentenceStatistics.meanLength
          ? '문장을 좀 더 길고 복잡하게 구성하세요.'
          : '문장을 더 짧고 간결하게 나누세요.',
    });
  }

  // 3. Dialogue Balance Match
  const dialogueMatch = computeMetricMatch(
    contentMetrics.dialogueMetrics.dialogueRatio,
    target.dialogueMetrics.dialogueRatio,
    0.3
  );
  const dialogueScore = dialogueMatch;

  if (dialogueScore < 70) {
    const severity = determineSeverity(
      contentMetrics.dialogueMetrics.dialogueRatio,
      target.dialogueMetrics.dialogueRatio,
      0.3
    );
    deviations.push({
      aspect: '대화 비율',
      expected: `${(target.dialogueMetrics.dialogueRatio * 100).toFixed(0)}%`,
      actual: `${(contentMetrics.dialogueMetrics.dialogueRatio * 100).toFixed(0)}%`,
      severity,
      suggestion:
        contentMetrics.dialogueMetrics.dialogueRatio < target.dialogueMetrics.dialogueRatio
          ? '대화를 더 추가하여 장면에 생동감을 불어넣으세요.'
          : '서술을 더 추가하여 대화와 균형을 맞추세요.',
    });
  }

  // 4. Sensory Density Match
  const sensoryMatch = computeMetricMatch(
    contentMetrics.sensoryMetrics.sensoryDensity,
    target.sensoryMetrics.sensoryDensity,
    0.3
  );
  const sensoryScore = sensoryMatch;

  if (sensoryScore < 70) {
    const severity = determineSeverity(
      contentMetrics.sensoryMetrics.sensoryDensity,
      target.sensoryMetrics.sensoryDensity,
      0.3
    );
    deviations.push({
      aspect: '감각 밀도',
      expected: `${target.sensoryMetrics.sensoryDensity.toFixed(1)}/1000자`,
      actual: `${contentMetrics.sensoryMetrics.sensoryDensity.toFixed(1)}/1000자`,
      severity,
      suggestion:
        contentMetrics.sensoryMetrics.sensoryDensity < target.sensoryMetrics.sensoryDensity
          ? '더 많은 감각적 묘사(시각, 청각, 촉각, 후각, 미각)를 추가하세요.'
          : '감각 묘사를 줄이고 행동이나 대화에 집중하세요.',
    });
  }

  // 5. Rhythm Match
  const paraMatch = computeMetricMatch(
    contentMetrics.rhythmPatterns.paragraphLengthMean,
    target.rhythmPatterns.paragraphLengthMean,
    0.3
  );
  const rhythmScore = (paraMatch + variationMatch) / 2;

  if (rhythmScore < 70) {
    const severity = determineSeverity(
      contentMetrics.rhythmPatterns.paragraphLengthMean,
      target.rhythmPatterns.paragraphLengthMean,
      0.3
    );
    deviations.push({
      aspect: '리듬',
      expected: `단락 평균 ${target.rhythmPatterns.paragraphLengthMean.toFixed(0)}단어`,
      actual: `단락 평균 ${contentMetrics.rhythmPatterns.paragraphLengthMean.toFixed(0)}단어`,
      severity,
      suggestion:
        contentMetrics.rhythmPatterns.sentenceVariation < target.rhythmPatterns.sentenceVariation
          ? '문장 길이에 더 변화를 주어 리듬감을 높이세요.'
          : '문장 길이를 좀 더 일정하게 유지하세요.',
    });
  }

  // Compute overall match (weighted average)
  const aspectScores: StyleAspectScores = {
    lexicalDiversity: Math.round(lexicalScore),
    sentenceStructure: Math.round(sentenceScore),
    dialogueBalance: Math.round(dialogueScore),
    sensoryDensity: Math.round(sensoryScore),
    rhythm: Math.round(rhythmScore),
  };

  // Weights: lexical 20%, sentence 25%, dialogue 20%, sensory 15%, rhythm 20%
  const overallMatch = Math.round(
    lexicalScore * 0.2 +
      sentenceScore * 0.25 +
      dialogueScore * 0.2 +
      sensoryScore * 0.15 +
      rhythmScore * 0.2
  );

  return {
    overallMatch,
    aspectScores,
    deviations,
  };
}
