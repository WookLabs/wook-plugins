/**
 * Stage Evaluators
 *
 * Per-stage evaluation functions for the 4-stage revision pipeline:
 * - DraftStageEvaluator: Scene coverage, beat completion, transition presence
 * - ToneStageEvaluator: Emotional arc alignment, mood consistency
 * - StyleStageEvaluator: Leverages analyzeChapter for prose quality + style matching
 * - FinalStageEvaluator: Proofreading issues, honorific consistency
 *
 * @module quality/stage-evaluators
 */

import {
  analyzeChapter,
  createDirective,
  resetDirectiveCounter,
  findRhythmIssues,
  getFilterWordsOutsideDialogue,
  assessSensoryGrounding,
  getParagraphs,
  findParagraphForPosition,
} from '../pipeline/quality-oracle.js';
import type { SurgicalDirective, DirectiveType } from '../pipeline/types.js';
import type {
  StageEvaluator,
  RevisionStageName,
  MultiStageOptions,
  DRAFT_DIRECTIVE_TYPES,
  TONE_DIRECTIVE_TYPES,
  STYLE_DIRECTIVE_TYPES,
  FINAL_DIRECTIVE_TYPES,
} from './types.js';
import {
  computeStyleMatch,
  type StyleProfile,
  type StyleMatchResult,
  type StyleDeviation,
} from '../style-library/index.js';
import {
  detectFlatDialogue,
  type SubtextAnnotation,
  type FlatDialogueLocation,
} from '../subtext/index.js';
import {
  analyzeVoiceConsistency,
  type VoiceProfile,
  type VoiceConsistencyResult,
  type DialogueAttribution,
} from '../voice/index.js';

// ============================================================================
// Draft Stage Evaluator
// ============================================================================

/**
 * Draft Stage Evaluator
 *
 * Evaluates and generates directives for structural issues:
 * - Scene coverage: Are all planned scenes adequately developed?
 * - Beat completion: Are story beats hitting their targets?
 * - Transition presence: Are scene transitions smooth?
 *
 * Model: sonnet, Temperature: 0.5, Threshold: 70
 */
export const DraftStageEvaluator: StageEvaluator = {
  name: 'draft',

  async score(content: string, options?: MultiStageOptions): Promise<number> {
    let score = 100;

    // 1. Check transition quality (major structural indicator)
    // Look for abrupt scene breaks without transitions
    const paragraphs = getParagraphs(content);
    const sceneBreakPattern = /^[#*-]{3,}$|^\s*$/;
    let abruptTransitions = 0;

    for (let i = 1; i < paragraphs.length; i++) {
      const prev = paragraphs[i - 1].text;
      const curr = paragraphs[i].text;

      // Check for scene break markers
      if (sceneBreakPattern.test(prev) || sceneBreakPattern.test(curr)) {
        // Check if there's any transition phrasing
        const transitionWords = ['한편', '그러나', '그때', '잠시 후', '얼마 후', '다음 날', '그날 밤'];
        const hasTransition = transitionWords.some(word => curr.includes(word));

        if (!hasTransition) {
          abruptTransitions++;
        }
      }
    }

    // Deduct for abrupt transitions
    score -= abruptTransitions * 10;

    // 2. Check scene coverage if scenes provided
    if (options?.scenes && options.scenes.length > 0) {
      const expectedScenes = options.scenes.length;
      // Simple heuristic: check if content length suggests all scenes are present
      // Assume ~500-1500 chars per scene
      const estimatedScenes = Math.floor(content.length / 800);
      const coverageRatio = Math.min(1, estimatedScenes / expectedScenes);
      score = score * coverageRatio;
    }

    // 3. Check for "telling" instead of "showing" (major draft issue)
    const filterWords = getFilterWordsOutsideDialogue(content);
    score -= Math.min(30, filterWords.length * 3);

    return Math.max(0, Math.min(100, Math.round(score)));
  },

  async generateDirectives(content: string, options?: MultiStageOptions): Promise<SurgicalDirective[]> {
    resetDirectiveCounter();
    const directives: SurgicalDirective[] = [];
    const paragraphs = getParagraphs(content);

    // 1. Detect abrupt transitions
    const sceneBreakPattern = /^[#*-]{3,}$|^\s*$/;

    for (let i = 1; i < paragraphs.length && directives.length < 2; i++) {
      const prev = paragraphs[i - 1].text;
      const curr = paragraphs[i].text;

      if (sceneBreakPattern.test(prev)) {
        const transitionWords = ['한편', '그러나', '그때', '잠시 후', '얼마 후', '다음 날', '그날 밤'];
        const hasTransition = transitionWords.some(word => curr.includes(word));

        if (!hasTransition) {
          directives.push(createDirective(
            'transition-smoothing',
            3,
            {
              sceneNumber: 1,
              paragraphStart: i,
              paragraphEnd: Math.min(i + 1, paragraphs.length - 1),
            },
            '장면 전환이 급작스럽습니다. 시간/공간/감정 연결이 필요합니다.',
            curr.slice(0, 300),
            '장면 전환 문구를 추가하세요: 시간 경과, 공간 이동, 또는 감정 연결을 자연스럽게 표현하세요.',
            2
          ));
        }
      }
    }

    // 2. Detect show-not-tell issues (prioritize over filter words in draft stage)
    const filterWords = getFilterWordsOutsideDialogue(content);
    for (const fw of filterWords.slice(0, 2)) {
      if (directives.length >= 3) break;

      const paraIdx = findParagraphForPosition(paragraphs, fw.position);
      const para = paragraphs[paraIdx];

      directives.push(createDirective(
        'show-not-tell',
        4,
        {
          sceneNumber: 1,
          paragraphStart: paraIdx,
          paragraphEnd: paraIdx,
        },
        `"${fw.word}"를 통해 감정을 설명하고 있습니다. 행동/대화/반응으로 보여주세요.`,
        para?.text.slice(0, 300) || '',
        '캐릭터의 감정을 직접 서술하지 말고, 신체 반응, 대화, 행동을 통해 간접적으로 표현하세요.',
        2
      ));
    }

    return directives;
  },
};

// ============================================================================
// Tone Stage Evaluator
// ============================================================================

/**
 * Tone Stage Evaluator
 *
 * Evaluates and generates directives for emotional alignment:
 * - Emotional arc alignment: Does mood progression match intended arc?
 * - Mood consistency: Are emotional beats consistent within scenes?
 * - Voice consistency: Do characters sound like themselves?
 *
 * Model: opus, Temperature: 0.6, Threshold: 75
 */
export const ToneStageEvaluator: StageEvaluator = {
  name: 'tone',

  async score(content: string, options?: MultiStageOptions): Promise<number> {
    // Score components with weights
    let emotionalDepthScore = 100;
    let subtextCoverageScore = 100;
    let voiceConsistencyScore = 100;

    // 1. Check dialogue for emotional depth (on-the-nose detection)
    const dialoguePattern = /["""\u201C\u201D]([^"""\u201C\u201D]+)["""\u201C\u201D]/g;
    const dialogues: string[] = [];
    let match;
    while ((match = dialoguePattern.exec(content)) !== null) {
      dialogues.push(match[1]);
    }

    const emotionalWords = ['사랑해', '미워', '무서워', '행복해', '슬퍼', '화나', '질투나'];
    let onTheNoseCount = 0;
    for (const dialogue of dialogues) {
      for (const word of emotionalWords) {
        if (dialogue.includes(word)) {
          onTheNoseCount++;
          break;
        }
      }
    }

    if (dialogues.length > 0) {
      const ratio = onTheNoseCount / dialogues.length;
      if (ratio > 0.3) {
        emotionalDepthScore -= (ratio - 0.3) * 50;
      }
    }

    // 2. Check subtext coverage if annotations provided
    if (options?.subtextAnnotations && dialogues.length > 0) {
      const annotatedCount = options.subtextAnnotations.length;
      const coverageRatio = annotatedCount / dialogues.length;

      // Target: 30-40% of dialogue should have subtext annotations
      if (coverageRatio < 0.3) {
        // Below target: deduct proportionally
        subtextCoverageScore -= (0.3 - coverageRatio) * 100;
      }
    } else if (dialogues.length > 0) {
      // No annotations provided - use flat dialogue detection as proxy
      const flatDialogues = detectFlatDialogue(content);
      if (flatDialogues.length > 0 && dialogues.length > 0) {
        const flatRatio = flatDialogues.length / dialogues.length;
        subtextCoverageScore -= flatRatio * 40;
      }
    }

    // 3. Check voice consistency if profiles provided
    if (options?.voiceProfiles && options.voiceProfiles.length > 0 && options?.voiceDialogueAttributions) {
      let totalVoiceScore = 0;
      let profileCount = 0;

      for (const profile of options.voiceProfiles) {
        const result = analyzeVoiceConsistency(
          content,
          profile.characterId,
          profile,
          options.voiceDialogueAttributions
        );
        totalVoiceScore += result.overallScore;
        profileCount++;
      }

      if (profileCount > 0) {
        voiceConsistencyScore = totalVoiceScore / profileCount;
      }
    } else if (dialogues.length === 0 && content.length > 500) {
      voiceConsistencyScore -= 20; // No dialogue in substantial content
    }

    // 4. Check emotional arc (intensifier density)
    const intensifiers = ['매우', '정말', '너무', '아주', '완전히'];
    let intensifierCount = 0;
    for (const word of intensifiers) {
      const regex = new RegExp(word, 'g');
      intensifierCount += (content.match(regex) || []).length;
    }

    const density = (intensifierCount / content.length) * 1000;
    if (density > 5) {
      emotionalDepthScore -= Math.min(20, (density - 5) * 5);
    }

    // Blend scores: 40% emotional depth + 30% subtext + 30% voice
    const blendedScore =
      emotionalDepthScore * 0.4 +
      subtextCoverageScore * 0.3 +
      voiceConsistencyScore * 0.3;

    return Math.max(0, Math.min(100, Math.round(blendedScore)));
  },

  async generateDirectives(content: string, options?: MultiStageOptions): Promise<SurgicalDirective[]> {
    resetDirectiveCounter();
    const directives: SurgicalDirective[] = [];
    const paragraphs = getParagraphs(content);

    // 1. Detect on-the-nose dialogue (existing behavior)
    const dialoguePattern = /["""\u201C\u201D]([^"""\u201C\u201D]+)["""\u201C\u201D]/g;
    let match;

    while ((match = dialoguePattern.exec(content)) !== null && directives.length < 2) {
      const dialogue = match[1];
      const emotionalWords = ['사랑해', '미워', '무서워', '행복해', '슬퍼', '화나', '질투나'];

      for (const word of emotionalWords) {
        if (dialogue.includes(word)) {
          const paraIdx = findParagraphForPosition(paragraphs, match.index);
          const para = paragraphs[paraIdx];

          directives.push(createDirective(
            'dialogue-subtext',
            3,
            {
              sceneNumber: 1,
              paragraphStart: paraIdx,
              paragraphEnd: paraIdx,
            },
            `대화에서 감정("${word}")을 직접 언급합니다. 서브텍스트를 통해 간접 표현하세요.`,
            para?.text.slice(0, 300) || '',
            '캐릭터가 감정을 직접 말하지 않고, 행동/억양/말투의 변화로 감정을 암시하세요.',
            2
          ));
          break;
        }
      }
    }

    // 2. Detect flat dialogue using subtext engine (dialogue-subtext directives)
    const flatDialogues = detectFlatDialogue(
      content,
      options?.subtextAnnotations ?? []
    );

    for (const flat of flatDialogues) {
      if (directives.length >= 4) break;

      const paraIdx = flat.paragraphIndex;
      const para = paragraphs[paraIdx];

      directives.push(createDirective(
        'dialogue-subtext',
        4,
        {
          sceneNumber: 1,
          paragraphStart: paraIdx,
          paragraphEnd: paraIdx,
        },
        `평면적 대화 감지: ${flat.reason}`,
        flat.currentText.slice(0, 300),
        flat.suggestedSubtext,
        2
      ));
    }

    // 3. Detect voice drift using voice metrics (voice-drift directives)
    if (options?.voiceProfiles && options.voiceProfiles.length > 0 && options?.voiceDialogueAttributions) {
      for (const profile of options.voiceProfiles) {
        if (directives.length >= 5) break;

        const result = analyzeVoiceConsistency(
          content,
          profile.characterId,
          profile,
          options.voiceDialogueAttributions
        );

        // Generate voice-drift directives for moderate/major deviations
        for (const deviation of result.deviations) {
          if (directives.length >= 5) break;
          if (deviation.severity === 'minor') continue;

          const paraIdx = deviation.location.paragraphStart;
          const para = paragraphs[paraIdx] || paragraphs[0];

          directives.push(createDirective(
            'voice-drift',
            deviation.severity === 'major' ? 2 : 4,
            {
              sceneNumber: 1,
              paragraphStart: deviation.location.paragraphStart,
              paragraphEnd: deviation.location.paragraphEnd,
            },
            `${profile.characterName}의 음성 이탈 (${deviation.aspect}): 기대=${deviation.expected}, 실제=${deviation.found}`,
            para?.text.slice(0, 300) || '',
            `${profile.characterName}의 캐릭터 음성 프로필에 맞게 ${deviation.aspect} 수정이 필요합니다.`,
            2
          ));
        }
      }
    }

    return directives;
  },
};

// ============================================================================
// Style Stage Evaluator
// ============================================================================

/**
 * Convert a StyleDeviation to a SurgicalDirective
 *
 * @param deviation - Style deviation from computeStyleMatch
 * @param paragraphs - Paragraphs from getParagraphs for location context
 * @returns SurgicalDirective for the style deviation
 */
function styleDeviationToDirective(
  deviation: StyleDeviation,
  paragraphs: Array<{ text: string; index: number; startChar: number; endChar: number }>
): SurgicalDirective {
  // Determine priority based on severity
  const priorityMap: Record<string, number> = {
    major: 2,
    moderate: 4,
    minor: 6,
  };
  const priority = priorityMap[deviation.severity] || 4;

  return createDirective(
    'style-alignment',
    priority,
    {
      sceneNumber: 1,
      paragraphStart: 0,
      paragraphEnd: Math.min(2, paragraphs.length - 1),
    },
    `스타일 이탈: ${deviation.aspect} - 목표: ${deviation.expected}, 실제: ${deviation.actual}`,
    paragraphs[0]?.text.slice(0, 300) || '',
    deviation.suggestion,
    3 // maxScope: affects up to 3 paragraphs
  );
}

/**
 * Style Stage Evaluator
 *
 * Leverages existing analyzeChapter for prose quality assessment.
 * When styleProfile is provided, also computes style alignment.
 *
 * Score blending when styleProfile provided:
 * - 70% prose quality (from Quality Oracle)
 * - 30% style alignment (from computeStyleMatch)
 *
 * Generates directives for:
 * - Filter word removal
 * - Sensory enrichment
 * - Rhythm variation
 * - Cliche replacement
 * - Banned expressions
 * - Texture enrichment
 * - Style alignment (when styleProfile provided)
 *
 * Model: opus, Temperature: 0.7, Threshold: 80
 */
export const StyleStageEvaluator: StageEvaluator = {
  name: 'style',

  async score(content: string, options?: MultiStageOptions): Promise<number> {
    // Leverage existing Quality Oracle analysis
    const result = analyzeChapter(content, 1, {
      honorificMatrix: options?.honorificMatrix,
      dialogueAttributions: options?.dialogueAttributions,
      assessKoreanTexture: options?.assessKoreanTexture,
      textureContext: options?.textureContext,
      detectBannedExpressions: options?.detectBannedExpressions,
      bannedExpressionMinSeverity: options?.bannedExpressionMinSeverity,
    });

    // Weight the scores: prose quality and sensory grounding are most important for style
    const proseWeight = 0.35;
    const sensoryWeight = 0.25;
    const rhythmWeight = 0.20;
    const textureWeight = 0.10;
    const filterWeight = 0.10;

    let proseScore =
      result.assessment.proseQuality.score * proseWeight +
      result.assessment.sensoryGrounding.score * sensoryWeight +
      result.assessment.rhythmVariation.score * rhythmWeight;

    // Add texture score if available
    if (result.assessment.koreanTexture) {
      proseScore += result.assessment.koreanTexture.score * textureWeight;
    } else {
      proseScore += 70 * textureWeight; // Neutral baseline
    }

    // Penalize for filter words
    const filterPenalty = Math.min(30, result.assessment.filterWordDensity.count * 3);
    proseScore += (100 - filterPenalty) * filterWeight;

    // If styleProfile is provided, blend with style alignment score
    if (options?.styleProfile) {
      const styleMatch = computeStyleMatch(content, options.styleProfile);

      // Blend: 70% prose quality + 30% style alignment
      const blendedScore = proseScore * 0.7 + styleMatch.overallMatch * 0.3;
      return Math.max(0, Math.min(100, Math.round(blendedScore)));
    }

    return Math.max(0, Math.min(100, Math.round(proseScore)));
  },

  async generateDirectives(content: string, options?: MultiStageOptions): Promise<SurgicalDirective[]> {
    resetDirectiveCounter();
    const directives: SurgicalDirective[] = [];
    const paragraphs = getParagraphs(content);

    // If styleProfile is provided, check for style deviations first
    if (options?.styleProfile) {
      const styleMatch = computeStyleMatch(content, options.styleProfile);

      // Generate style-alignment directives for moderate and major deviations
      for (const deviation of styleMatch.deviations) {
        if (deviation.severity === 'moderate' || deviation.severity === 'major') {
          const directive = styleDeviationToDirective(deviation, paragraphs);
          directives.push(directive);

          // Limit to 2 style-alignment directives per pass
          if (directives.filter(d => d.type === 'style-alignment').length >= 2) {
            break;
          }
        }
      }
    }

    // Leverage existing Quality Oracle for other directive generation
    const result = analyzeChapter(content, 1, {
      honorificMatrix: options?.honorificMatrix,
      dialogueAttributions: options?.dialogueAttributions,
      assessKoreanTexture: options?.assessKoreanTexture,
      textureContext: options?.textureContext,
      detectBannedExpressions: options?.detectBannedExpressions,
      bannedExpressionMinSeverity: options?.bannedExpressionMinSeverity,
    });

    // Filter to style-appropriate directive types
    const styleTypes: DirectiveType[] = [
      'filter-word-removal',
      'sensory-enrichment',
      'rhythm-variation',
      'cliche-replacement',
      'banned-expression',
      'texture-enrichment',
    ];

    // Add Quality Oracle directives (excluding style-alignment which we handle above)
    const oracleDirectives = result.directives.filter(d => styleTypes.includes(d.type));
    directives.push(...oracleDirectives);

    return directives;
  },
};

// ============================================================================
// Final Stage Evaluator
// ============================================================================

/**
 * Final Stage Evaluator
 *
 * Evaluates and generates directives for proofreading issues:
 * - Grammar and spacing
 * - Honorific consistency
 * - Punctuation
 *
 * Model: sonnet, Temperature: 0.2, Threshold: 95
 */
export const FinalStageEvaluator: StageEvaluator = {
  name: 'final',

  async score(content: string, options?: MultiStageOptions): Promise<number> {
    let score = 100;

    // 1. Check spacing issues
    // Double spaces
    const doubleSpaces = (content.match(/  +/g) || []).length;
    score -= doubleSpaces * 2;

    // Missing spaces after periods (except abbreviations)
    const missingSpaces = (content.match(/[가-힣다요죠]\.[가-힣]/g) || []).length;
    score -= missingSpaces * 3;

    // 2. Check punctuation issues
    // Multiple consecutive punctuation
    const multiPunct = (content.match(/[.?!]{3,}/g) || []).length;
    score -= multiPunct * 2;

    // Mismatched quotes
    const openQuotes = (content.match(/["'"]/g) || []).length;
    const closeQuotes = (content.match(/["'"]/g) || []).length;
    if (Math.abs(openQuotes - closeQuotes) > 2) {
      score -= 10;
    }

    // 3. Check honorific consistency if matrix provided
    if (options?.honorificMatrix && options?.dialogueAttributions) {
      const result = analyzeChapter(content, 1, {
        honorificMatrix: options.honorificMatrix,
        dialogueAttributions: options.dialogueAttributions,
      });

      if (result.assessment.honorificConsistency) {
        // Heavy penalty for honorific violations in final stage
        score -= result.assessment.honorificConsistency.violations.length * 5;
      }
    }

    return Math.max(0, Math.min(100, Math.round(score)));
  },

  async generateDirectives(content: string, options?: MultiStageOptions): Promise<SurgicalDirective[]> {
    resetDirectiveCounter();
    const directives: SurgicalDirective[] = [];
    const paragraphs = getParagraphs(content);

    // 1. Detect spacing/punctuation issues
    // Double spaces
    let searchPos = 0;
    let dsMatch;
    while ((dsMatch = content.indexOf('  ', searchPos)) !== -1 && directives.length < 2) {
      const paraIdx = findParagraphForPosition(paragraphs, dsMatch);
      const para = paragraphs[paraIdx];

      directives.push(createDirective(
        'proofreading',
        1,
        {
          sceneNumber: 1,
          paragraphStart: paraIdx,
          paragraphEnd: paraIdx,
        },
        '이중 공백이 감지되었습니다.',
        para?.text.slice(0, 200) || '',
        '이중 공백을 단일 공백으로 수정하세요.',
        1
      ));

      searchPos = dsMatch + 2;
    }

    // 2. Get honorific violations from Quality Oracle if matrix provided
    if (options?.honorificMatrix && options?.dialogueAttributions && directives.length < 3) {
      const result = analyzeChapter(content, 1, {
        honorificMatrix: options.honorificMatrix,
        dialogueAttributions: options.dialogueAttributions,
      });

      // Add honorific violation directives
      const honorificDirectives = result.directives.filter(d => d.type === 'honorific-violation');
      directives.push(...honorificDirectives.slice(0, 2));
    }

    return directives;
  },
};

// ============================================================================
// Export All Evaluators
// ============================================================================

/**
 * All stage evaluators in execution order
 */
export const STAGE_EVALUATORS: Record<RevisionStageName, StageEvaluator> = {
  draft: DraftStageEvaluator,
  tone: ToneStageEvaluator,
  style: StyleStageEvaluator,
  final: FinalStageEvaluator,
};
