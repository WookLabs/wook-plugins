/**
 * Quality Oracle Module
 *
 * Analyzes chapter prose and produces passage-level surgical directives.
 * The Oracle evaluates quality dimensions and generates actionable directives
 * for the Prose Surgeon to execute.
 *
 * DEPRECATION NOTE: This module supersedes agents/critic.md for the evaluation function.
 * The legacy agent remains for backward compatibility but new code should use this module.
 *
 * @module pipeline/quality-oracle
 */

import type {
  DirectiveType,
  PassageLocation,
  SurgicalDirective,
  QualityAssessment,
  QualityOracleResult,
} from './types.js';
import {
  detectViolationsSimple,
  type HonorificMatrix,
  type HonorificViolation,
} from '../korean/honorific-matrix.js';
import {
  assessTexturePresence,
  suggestTexture,
  type TextureContext,
  type TextureAssessmentResult,
} from '../korean/texture-library.js';
import {
  detectBannedExpressions,
  getSuggestedReplacement,
  getBannedReason,
  countBySeverity,
  getUniqueCategories,
  type BannedExpressionMatch,
  type Severity as BannedSeverity,
} from '../korean/banned-expressions.js';

// ============================================================================
// Constants
// ============================================================================

/**
 * Korean filter words that should be avoided outside dialogue
 * These weaken prose by telling instead of showing
 */
export const FILTER_WORDS = [
  '느꼈다', '느껴졌다', '느낀다',
  '보였다', '보이는', '보인다',
  '생각했다', '생각한다', '생각이',
  '들렸다', '들린다', '들리는',
  '알 수 있었다', '알았다',
  '깨달았다', '깨달음',
  '것 같았다', '같았다',
  '처럼 보였다', '듯 보였다', '듯했다',
  '분명했다', '확실했다',
  '느끼며', '느끼면서',
];

/**
 * Sensory categories for detection
 */
export const SENSORY_CATEGORIES = {
  visual: ['보', '빛', '색', '눈', '어둠', '밝', '빨', '파랗', '노랗', '하얗', '검', '반짝', '흐릿', '선명'],
  auditory: ['소리', '들', '목소리', '속삭', '외', '울', '조용', '시끄', '귀', '말', '노래', '웃음', '한숨'],
  tactile: ['만지', '닿', '차갑', '뜨거', '따뜻', '부드', '거칠', '손', '피부', '감촉', '떨'],
  olfactory: ['냄새', '향기', '향', '맡', '코', '악취', '상쾌', '훈훈'],
  gustatory: ['맛', '달', '쓴', '짠', '매운', '입', '혀', '삼키', '씹'],
} as const;

/**
 * Maximum directives per evaluation pass
 */
export const MAX_DIRECTIVES_PER_PASS = 5;

/**
 * Minimum senses required per 500 characters
 */
export const MIN_SENSES_PER_500_CHARS = 2;

/**
 * Maximum consecutive same sentence endings before flagging
 */
export const MAX_CONSECUTIVE_SAME_ENDINGS = 5;

/**
 * Sentence ending patterns in Korean
 * Note: No 'g' flag - we test each sentence independently
 */
export const SENTENCE_ENDING_PATTERNS = [
  { pattern: /다\.$/, name: '-다' },
  { pattern: /요\.$/, name: '-요' },
  { pattern: /죠\.$/, name: '-죠' },
  { pattern: /네\.$/, name: '-네' },
  { pattern: /지\.$/, name: '-지' },
  { pattern: /나\?$/, name: '-나?' },
  { pattern: /까\?$/, name: '-까?' },
];

// ============================================================================
// Directive ID Generation
// ============================================================================

let directiveCounter = 0;

/**
 * Reset the directive counter (for testing)
 */
export function resetDirectiveCounter(): void {
  directiveCounter = 0;
}

/**
 * Generate a unique directive ID
 * Format: dir_{type}_{NNN}
 */
export function generateDirectiveId(type: DirectiveType): string {
  directiveCounter++;
  const paddedNum = String(directiveCounter).padStart(3, '0');
  return `dir_${type}_${paddedNum}`;
}

// ============================================================================
// Filter Word Detection
// ============================================================================

/**
 * Count filter words outside of dialogue
 *
 * @param content - Chapter content
 * @returns Array of found filter words with their locations
 */
export function countFilterWords(content: string): Array<{
  word: string;
  position: number;
  inDialogue: boolean;
}> {
  const results: Array<{ word: string; position: number; inDialogue: boolean }> = [];

  // Simple dialogue detection: text within quotes
  const dialogueRanges: Array<{ start: number; end: number }> = [];
  const quotePattern = /["""]([^"""]*)["""]/g;
  let match;
  while ((match = quotePattern.exec(content)) !== null) {
    dialogueRanges.push({ start: match.index, end: match.index + match[0].length });
  }

  const isInDialogue = (pos: number): boolean => {
    return dialogueRanges.some(range => pos >= range.start && pos <= range.end);
  };

  for (const filterWord of FILTER_WORDS) {
    let searchPos = 0;
    let idx: number;
    while ((idx = content.indexOf(filterWord, searchPos)) !== -1) {
      const inDialogue = isInDialogue(idx);
      results.push({
        word: filterWord,
        position: idx,
        inDialogue,
      });
      searchPos = idx + filterWord.length;
    }
  }

  return results;
}

/**
 * Get filter words outside dialogue only
 */
export function getFilterWordsOutsideDialogue(content: string): Array<{
  word: string;
  position: number;
}> {
  return countFilterWords(content)
    .filter(fw => !fw.inDialogue)
    .map(({ word, position }) => ({ word, position }));
}

// ============================================================================
// Sensory Detection
// ============================================================================

/**
 * Count unique sensory categories present in content
 *
 * @param content - Text to analyze
 * @returns Object with detected categories and count
 */
export function countUniqueSenses(content: string): {
  categories: string[];
  count: number;
  details: Record<string, string[]>;
} {
  const details: Record<string, string[]> = {};

  for (const [category, keywords] of Object.entries(SENSORY_CATEGORIES)) {
    const found: string[] = [];
    for (const keyword of keywords) {
      if (content.includes(keyword)) {
        found.push(keyword);
      }
    }
    if (found.length > 0) {
      details[category] = found;
    }
  }

  const categories = Object.keys(details);
  return {
    categories,
    count: categories.length,
    details,
  };
}

/**
 * Check if content has adequate sensory grounding
 *
 * @param content - Text to analyze
 * @returns Assessment with score and issues
 */
export function assessSensoryGrounding(content: string): {
  score: number;
  adequate: boolean;
  categories: string[];
  issueSegments: Array<{ start: number; end: number }>;
} {
  const charCount = content.length;
  const segments = Math.ceil(charCount / 500);
  const issueSegments: Array<{ start: number; end: number }> = [];

  // Check each 500-char segment
  for (let i = 0; i < segments; i++) {
    const start = i * 500;
    const end = Math.min(start + 500, charCount);
    const segment = content.slice(start, end);
    const senses = countUniqueSenses(segment);

    if (senses.count < MIN_SENSES_PER_500_CHARS) {
      issueSegments.push({ start, end });
    }
  }

  const overall = countUniqueSenses(content);
  const issueRatio = issueSegments.length / Math.max(segments, 1);
  const score = Math.round((1 - issueRatio) * 100 * (overall.count / 5));

  return {
    score: Math.min(100, score),
    adequate: issueSegments.length === 0,
    categories: overall.categories,
    issueSegments,
  };
}

// ============================================================================
// Rhythm Analysis
// ============================================================================

/**
 * Find rhythm issues (consecutive same sentence endings)
 *
 * @param content - Text to analyze
 * @returns Array of rhythm issues with locations
 */
export function findRhythmIssues(content: string): Array<{
  pattern: string;
  count: number;
  startPosition: number;
  endPosition: number;
}> {
  const issues: Array<{
    pattern: string;
    count: number;
    startPosition: number;
    endPosition: number;
  }> = [];

  // Split into sentences
  const sentences = content.split(/(?<=[.!?。])\s*/);
  const sentencePositions: Array<{ text: string; start: number }> = [];
  let currentPos = 0;

  for (const sentence of sentences) {
    if (sentence.trim()) {
      sentencePositions.push({ text: sentence, start: currentPos });
      currentPos += sentence.length + 1; // +1 for separator
    }
  }

  // Detect ending patterns for each sentence
  const getEnding = (text: string): string | null => {
    for (const { pattern, name } of SENTENCE_ENDING_PATTERNS) {
      if (pattern.test(text)) {
        return name;
      }
    }
    return null;
  };

  // Find consecutive same endings
  let consecutiveCount = 1;
  let currentEnding: string | null = null;
  let startIdx = 0;

  for (let i = 0; i < sentencePositions.length; i++) {
    const ending = getEnding(sentencePositions[i].text);

    if (ending === currentEnding && currentEnding !== null) {
      consecutiveCount++;
    } else {
      // Check if previous run was too long
      if (consecutiveCount >= MAX_CONSECUTIVE_SAME_ENDINGS && currentEnding !== null) {
        issues.push({
          pattern: currentEnding,
          count: consecutiveCount,
          startPosition: sentencePositions[startIdx].start,
          endPosition: sentencePositions[i - 1].start + sentencePositions[i - 1].text.length,
        });
      }
      currentEnding = ending;
      consecutiveCount = 1;
      startIdx = i;
    }
  }

  // Check final run
  if (consecutiveCount >= MAX_CONSECUTIVE_SAME_ENDINGS && currentEnding !== null && sentencePositions.length > 0) {
    issues.push({
      pattern: currentEnding,
      count: consecutiveCount,
      startPosition: sentencePositions[startIdx].start,
      endPosition: sentencePositions[sentencePositions.length - 1].start +
        sentencePositions[sentencePositions.length - 1].text.length,
    });
  }

  return issues;
}

// ============================================================================
// Paragraph Utilities
// ============================================================================

/**
 * Split content into paragraphs and get their positions
 */
export function getParagraphs(content: string): Array<{
  text: string;
  index: number;
  startChar: number;
  endChar: number;
}> {
  const paragraphs = content.split(/\n\n+/);
  const result: Array<{
    text: string;
    index: number;
    startChar: number;
    endChar: number;
  }> = [];

  let currentPos = 0;
  for (let i = 0; i < paragraphs.length; i++) {
    const text = paragraphs[i];
    if (text.trim()) {
      result.push({
        text,
        index: result.length,
        startChar: currentPos,
        endChar: currentPos + text.length,
      });
    }
    currentPos += text.length + 2; // +2 for \n\n
  }

  return result;
}

/**
 * Find which paragraph contains a given character position
 */
export function findParagraphForPosition(
  paragraphs: Array<{ index: number; startChar: number; endChar: number }>,
  position: number
): number {
  for (const para of paragraphs) {
    if (position >= para.startChar && position < para.endChar) {
      return para.index;
    }
  }
  return paragraphs.length > 0 ? paragraphs[paragraphs.length - 1].index : 0;
}

// ============================================================================
// Directive Creation
// ============================================================================

/**
 * Create a surgical directive
 */
export function createDirective(
  type: DirectiveType,
  priority: number,
  location: PassageLocation,
  issue: string,
  currentText: string,
  instruction: string,
  maxScope: number,
  exemplar?: { id: string; content: string }
): SurgicalDirective {
  return {
    id: generateDirectiveId(type),
    type,
    priority,
    location,
    issue,
    currentText,
    instruction,
    maxScope,
    ...(exemplar && {
      exemplarId: exemplar.id,
      exemplarContent: exemplar.content,
    }),
  };
}

// ============================================================================
// Main Analysis Function
// ============================================================================

/**
 * Options for chapter analysis
 */
export interface AnalyzeChapterOptions {
  /** Honorific matrix for Korean speech level validation (optional) */
  honorificMatrix?: HonorificMatrix;
  /**
   * Dialogue attributions for honorific checking
   * Array of {text, speakerId, listenerId} for each dialogue
   */
  dialogueAttributions?: Array<{
    text: string;
    speakerId: string;
    listenerId: string;
    position?: number;
  }>;
  /** Whether to assess Korean texture (default: true) */
  assessKoreanTexture?: boolean;
  /** Texture context for better suggestions (optional) */
  textureContext?: TextureContext;
  /** Whether to detect banned AI expressions (default: true) */
  detectBannedExpressions?: boolean;
  /** Minimum severity for banned expression detection (default: 'medium') */
  bannedExpressionMinSeverity?: BannedSeverity;
}

/**
 * Analyze chapter content and produce quality assessment with directives
 *
 * @param content - Chapter prose content
 * @param sceneCount - Number of scenes in the chapter (for location mapping)
 * @param options - Optional analysis options including honorific matrix
 * @returns Quality Oracle result with assessment and directives
 */
export function analyzeChapter(
  content: string,
  sceneCount: number = 1,
  options?: AnalyzeChapterOptions
): QualityOracleResult {
  // Reset counter for consistent IDs within a single analysis
  resetDirectiveCounter();

  const directives: SurgicalDirective[] = [];
  const paragraphs = getParagraphs(content);

  // 1. Filter word analysis
  const filterWords = getFilterWordsOutsideDialogue(content);
  const filterWordDensity = (filterWords.length / content.length) * 1000;
  const filterWordIssues: string[] = [];

  for (const fw of filterWords.slice(0, 3)) { // Limit to first 3 for issues list
    const paraIdx = findParagraphForPosition(paragraphs, fw.position);
    filterWordIssues.push(`"${fw.word}" at paragraph ${paraIdx}`);
  }

  // Create filter word directives (up to 2)
  for (const fw of filterWords.slice(0, 2)) {
    if (directives.length >= MAX_DIRECTIVES_PER_PASS) break;

    const paraIdx = findParagraphForPosition(paragraphs, fw.position);
    const para = paragraphs[paraIdx];

    directives.push(createDirective(
      'filter-word-removal',
      2, // High priority
      {
        sceneNumber: Math.min(Math.ceil((paraIdx + 1) / Math.max(1, paragraphs.length / sceneCount)), sceneCount),
        paragraphStart: paraIdx,
        paragraphEnd: paraIdx,
      },
      `필터 워드 "${fw.word}"가 대화 밖에서 사용됨`,
      para?.text || '',
      `"${fw.word}"를 제거하고 직접적인 묘사로 대체하세요. 감정이나 인식을 telling 대신 showing으로 표현하세요.`,
      1
    ));
  }

  // 1b. Banned expression analysis (AI-tell patterns)
  const bannedMinSeverity = options?.bannedExpressionMinSeverity ?? 'medium';
  const shouldDetectBanned = options?.detectBannedExpressions !== false;
  const bannedMatches = shouldDetectBanned
    ? detectBannedExpressions(content, 'narration', bannedMinSeverity)
    : [];

  const bannedCounts = countBySeverity(bannedMatches);
  const bannedCategories = getUniqueCategories(bannedMatches);

  // Create banned-expression directives (up to 2 critical/high, 1 medium)
  const criticalHighMatches = bannedMatches.filter(
    m => m.severity === 'critical' || m.severity === 'high'
  );
  const mediumMatchesBanned = bannedMatches.filter(m => m.severity === 'medium');

  for (const match of criticalHighMatches.slice(0, 2)) {
    if (directives.length >= MAX_DIRECTIVES_PER_PASS) break;

    const paraIdx = findParagraphForPosition(paragraphs, match.position);
    const para = paragraphs[paraIdx];
    const replacement = getSuggestedReplacement(match);
    const reason = getBannedReason(match);

    directives.push(createDirective(
      'banned-expression',
      1, // Highest priority for AI-tell
      {
        sceneNumber: Math.min(Math.ceil((paraIdx + 1) / Math.max(1, paragraphs.length / sceneCount)), sceneCount),
        paragraphStart: paraIdx,
        paragraphEnd: paraIdx,
      },
      `AI체 표현 "${match.matchedText}" 발견 (${match.category}: ${reason})`,
      para?.text || '',
      `"${match.matchedText}"를 "${replacement}"(으)로 대체하거나 문장을 자연스럽게 재구성하세요.`,
      1
    ));
  }

  for (const match of mediumMatchesBanned.slice(0, 1)) {
    if (directives.length >= MAX_DIRECTIVES_PER_PASS) break;

    const paraIdx = findParagraphForPosition(paragraphs, match.position);
    const para = paragraphs[paraIdx];
    const replacement = getSuggestedReplacement(match);
    const reason = getBannedReason(match);

    directives.push(createDirective(
      'banned-expression',
      3, // Lower priority for medium severity
      {
        sceneNumber: Math.min(Math.ceil((paraIdx + 1) / Math.max(1, paragraphs.length / sceneCount)), sceneCount),
        paragraphStart: paraIdx,
        paragraphEnd: paraIdx,
      },
      `AI체 표현 "${match.matchedText}" 발견 (${match.category}: ${reason})`,
      para?.text || '',
      `"${match.matchedText}"를 "${replacement}"(으)로 대체하세요.`,
      1
    ));
  }

  // 2. Sensory analysis
  const sensory = assessSensoryGrounding(content);

  // Create sensory enrichment directives (up to 2)
  for (const segment of sensory.issueSegments.slice(0, 2)) {
    if (directives.length >= MAX_DIRECTIVES_PER_PASS) break;

    const startPara = findParagraphForPosition(paragraphs, segment.start);
    const endPara = findParagraphForPosition(paragraphs, segment.end);
    const targetParas = paragraphs.slice(startPara, endPara + 1);
    const currentText = targetParas.map(p => p.text).join('\n\n');

    directives.push(createDirective(
      'sensory-enrichment',
      4,
      {
        sceneNumber: Math.min(Math.ceil((startPara + 1) / Math.max(1, paragraphs.length / sceneCount)), sceneCount),
        paragraphStart: startPara,
        paragraphEnd: Math.min(endPara, startPara + 2), // Max 3 paragraphs
      },
      `이 구간에 감각적 묘사가 부족합니다 (${MIN_SENSES_PER_500_CHARS}가지 이상 필요)`,
      currentText.slice(0, 500),
      `시각, 청각, 촉각, 후각, 미각 중 2가지 이상의 감각을 자연스럽게 추가하세요.`,
      3
    ));
  }

  // 3. Rhythm analysis
  const rhythmIssues = findRhythmIssues(content);
  const rhythmProblems: string[] = rhythmIssues.map(
    issue => `${issue.count}회 연속 "${issue.pattern}" 종결`
  );

  // Create rhythm directives (up to 1)
  for (const issue of rhythmIssues.slice(0, 1)) {
    if (directives.length >= MAX_DIRECTIVES_PER_PASS) break;

    const startPara = findParagraphForPosition(paragraphs, issue.startPosition);
    const endPara = findParagraphForPosition(paragraphs, issue.endPosition);
    const targetParas = paragraphs.slice(startPara, endPara + 1);
    const currentText = targetParas.map(p => p.text).join('\n\n');

    directives.push(createDirective(
      'rhythm-variation',
      5,
      {
        sceneNumber: Math.min(Math.ceil((startPara + 1) / Math.max(1, paragraphs.length / sceneCount)), sceneCount),
        paragraphStart: startPara,
        paragraphEnd: Math.min(endPara, startPara + 2),
      },
      `${issue.count}개의 문장이 연속으로 "${issue.pattern}"로 끝남`,
      currentText.slice(0, 500),
      `문장 종결 패턴을 다양화하세요. 의문문, 감탄문, 다양한 종결어미를 사용하세요.`,
      3
    ));
  }

  // 4. Honorific analysis (if matrix provided)
  let honorificViolations: HonorificViolation[] = [];
  let honorificScore = 100;
  const honorificViolationDescriptions: string[] = [];

  if (options?.honorificMatrix && options?.dialogueAttributions) {
    honorificViolations = detectViolationsSimple(
      options.dialogueAttributions,
      options.honorificMatrix
    );

    // Create honorific violation directives (up to 2)
    for (const violation of honorificViolations.slice(0, 2)) {
      if (directives.length >= MAX_DIRECTIVES_PER_PASS) break;

      // Find paragraph containing the violation
      const paraIdx = findParagraphForPosition(paragraphs, violation.position);
      const para = paragraphs[paraIdx];

      const speakerName = options.honorificMatrix.characters.get(violation.speakerId)?.name ?? violation.speakerId;
      const listenerName = options.honorificMatrix.characters.get(violation.listenerId)?.name ?? violation.listenerId;

      const levelNames: Record<string, string> = {
        haeche: '해체 (반말)',
        haeyoche: '해요체',
        hapsyoche: '하십시오체',
      };

      const expectedName = levelNames[violation.expectedLevel] ?? violation.expectedLevel;
      const actualName = levelNames[violation.actualLevel] ?? violation.actualLevel;

      directives.push(createDirective(
        'honorific-violation',
        2, // High priority - honorific consistency is important
        {
          sceneNumber: Math.min(Math.ceil((paraIdx + 1) / Math.max(1, paragraphs.length / sceneCount)), sceneCount),
          paragraphStart: paraIdx,
          paragraphEnd: paraIdx,
        },
        `캐릭터 ${speakerName}가 ${listenerName}에게 ${expectedName} 대신 ${actualName} 사용`,
        violation.dialogueText.slice(0, 200),
        `대화 종결어미를 ${expectedName}로 수정하세요. 문맥상 의도적 변화가 아니라면 일관성 유지.`,
        1
      ));

      honorificViolationDescriptions.push(
        `${speakerName} -> ${listenerName}: ${actualName} (expected: ${expectedName})`
      );
    }

    // Calculate honorific score (deduct points for violations)
    honorificScore = Math.max(0, 100 - (honorificViolations.length * 15));
  }

  // 5. Korean texture assessment
  let textureAssessment: TextureAssessmentResult = {
    score: 100,
    textureCount: 0,
    foundTextures: [],
    deficientSegments: [],
  };

  if (options?.assessKoreanTexture !== false) {
    textureAssessment = assessTexturePresence(content);

    // Create texture-enrichment directive for first deficient segment (max 1 per pass, lowest priority)
    if (textureAssessment.deficientSegments.length > 0 && directives.length < MAX_DIRECTIVES_PER_PASS) {
      const segment = textureAssessment.deficientSegments[0];
      const startPara = findParagraphForPosition(paragraphs, segment.start);
      const endPara = findParagraphForPosition(paragraphs, segment.end);
      const targetParas = paragraphs.slice(startPara, endPara + 1);
      const currentText = targetParas.map(p => p.text).join('\n\n').slice(0, 500);

      // Get contextual suggestions if context provided
      const suggestions = options?.textureContext
        ? suggestTexture(options.textureContext, 2)
        : [];

      const suggestionText = suggestions.length > 0
        ? `추천 의성어/의태어: ${suggestions.map(s => s.useVerbForm && s.texture.verbForm ? s.texture.verbForm : s.texture.korean).join(', ')}`
        : '장면 감정/동작에 맞는 의성어/의태어를 자연스럽게 추가하세요';

      directives.push(createDirective(
        'texture-enrichment',
        6, // Lowest priority (enhancement not fix)
        {
          sceneNumber: Math.min(Math.ceil((startPara + 1) / Math.max(1, paragraphs.length / sceneCount)), sceneCount),
          paragraphStart: startPara,
          paragraphEnd: Math.min(endPara, startPara + 1), // Max 2 paragraphs
        },
        `이 구간에 한국어 고유 텍스처(의성어/의태어)가 부족합니다`,
        currentText,
        `${suggestionText}. 주의: 장식적이 아닌 자연스러운 삽입이 중요합니다. 500자당 1-2개 이하.`,
        2
      ));
    }
  }

  // 6. Calculate scores
  const proseScore = Math.max(0, 100 - (filterWords.length * 5) - (rhythmIssues.length * 10));
  const proseIssues = [...filterWordIssues, ...rhythmProblems];

  const assessment: QualityAssessment = {
    proseQuality: {
      score: proseScore,
      verdict: proseScore >= 70 ? '양호' : '개선 필요',
      issues: proseIssues,
    },
    sensoryGrounding: {
      score: sensory.score,
      senseCount: sensory.categories.length,
      required: MIN_SENSES_PER_500_CHARS,
    },
    filterWordDensity: {
      count: filterWords.length,
      perThousand: Math.round(filterWordDensity * 100) / 100,
      threshold: 3.0, // Max 3 per 1000 chars
    },
    rhythmVariation: {
      score: Math.max(0, 100 - rhythmIssues.length * 20),
      repetitionInstances: rhythmProblems,
    },
    characterVoice: {
      score: 80, // Placeholder - requires character profile analysis
      driftInstances: [],
    },
    transitionQuality: {
      score: 80, // Placeholder - requires scene boundary analysis
      issues: [],
    },
    // Include honorific consistency only if matrix was provided
    ...(options?.honorificMatrix && {
      honorificConsistency: {
        score: honorificScore,
        violations: honorificViolationDescriptions,
      },
    }),
    // Include Korean texture assessment
    ...(options?.assessKoreanTexture !== false && {
      koreanTexture: {
        score: textureAssessment.score,
        textureCount: textureAssessment.textureCount,
        foundTextures: textureAssessment.foundTextures,
      },
    }),
    // Include banned expression count if detected
    ...(shouldDetectBanned && bannedMatches.length > 0 && {
      bannedExpressions: {
        count: bannedMatches.length,
        criticalCount: bannedCounts.critical + bannedCounts.high,
        categories: bannedCategories,
      },
    }),
  };

  // 6. Determine verdict
  // Include honorific score in average if present
  const baseScores = [
    assessment.proseQuality.score,
    assessment.sensoryGrounding.score,
    assessment.rhythmVariation.score,
    assessment.characterVoice.score,
    assessment.transitionQuality.score,
  ];

  if (assessment.honorificConsistency) {
    baseScores.push(assessment.honorificConsistency.score);
  }

  const avgScore = baseScores.reduce((a, b) => a + b, 0) / baseScores.length;

  // Check for honorific violations as a pass/fail condition
  const honorificPasses = !assessment.honorificConsistency ||
    assessment.honorificConsistency.violations.length <= 2;

  // Check for critical banned expressions (any critical = must revise)
  const bannedExpressionPasses = bannedCounts.critical === 0 && bannedCounts.high <= 2;

  const verdict: 'PASS' | 'REVISE' = (
    avgScore >= 70 &&
    filterWords.length <= 5 &&
    rhythmIssues.length === 0 &&
    sensory.adequate &&
    honorificPasses &&
    bannedExpressionPasses
  ) ? 'PASS' : 'REVISE';

  // 7. Generate reader experience feedback
  const readerExperience = generateReaderExperience(assessment, verdict);

  return {
    verdict,
    assessment,
    directives: directives.slice(0, MAX_DIRECTIVES_PER_PASS),
    readerExperience,
  };
}

/**
 * Generate qualitative reader experience feedback
 */
function generateReaderExperience(assessment: QualityAssessment, verdict: 'PASS' | 'REVISE'): string {
  const strengths: string[] = [];
  const weaknesses: string[] = [];

  if (assessment.sensoryGrounding.score >= 80) {
    strengths.push('감각적 묘사가 풍부하여 장면에 몰입할 수 있습니다');
  } else if (assessment.sensoryGrounding.score < 50) {
    weaknesses.push('감각적 묘사가 부족하여 장면이 평면적으로 느껴집니다');
  }

  if (assessment.filterWordDensity.perThousand <= 2) {
    strengths.push('직접적인 문체로 독자에게 강렬하게 전달됩니다');
  } else if (assessment.filterWordDensity.perThousand > 4) {
    weaknesses.push('필터 워드가 많아 감정 전달이 약해집니다');
  }

  if (assessment.rhythmVariation.score >= 80) {
    strengths.push('문장 리듬이 다양하여 읽는 맛이 있습니다');
  } else if (assessment.rhythmVariation.score < 60) {
    weaknesses.push('문장 종결이 단조로워 읽는 흐름이 끊깁니다');
  }

  if (verdict === 'PASS') {
    return `전반적으로 읽기 좋은 원고입니다. ${strengths.slice(0, 2).join('. ')}.`;
  } else {
    return `개선이 필요합니다. ${weaknesses.slice(0, 2).join('. ')}.`;
  }
}

/**
 * Simple synchronous analysis for testing (no LLM calls)
 * Returns assessment only, suitable for unit testing
 */
export function analyzeAndReport(content: string, sceneCount?: number): {
  filterWordCount: number;
  sensoryCategories: string[];
  rhythmIssues: number;
  overallVerdict: 'PASS' | 'REVISE';
} {
  const result = analyzeChapter(content, sceneCount);

  return {
    filterWordCount: result.assessment.filterWordDensity.count,
    sensoryCategories: ['visual', 'auditory', 'tactile', 'olfactory', 'gustatory']
      .filter(cat => result.assessment.sensoryGrounding.senseCount > 0),
    rhythmIssues: result.assessment.rhythmVariation.repetitionInstances.length,
    overallVerdict: result.verdict,
  };
}
