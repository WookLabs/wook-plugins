/**
 * Voice Metrics
 *
 * Quantitative voice analysis and consistency measurement:
 * - computeVoiceFingerprint: Extract quantitative metrics from dialogue
 * - analyzeVoiceConsistency: Check voice consistency against profile
 * - checkVocabularyConsistency: Check vocabulary matches profile
 * - checkVerbalHabits: Check habit usage matches profile
 * - checkSentenceStructure: Check structure matches profile
 *
 * @module voice/voice-metrics
 */

import type {
  VoiceFingerprint,
  VoiceProfile,
  VoiceConsistencyResult,
  VoiceDeviation,
  VoiceAspect,
  DeviationSeverity,
  DialogueAttribution,
  SpeechPatterns,
  VocabularyProfile,
  VerbalHabits,
  SentenceStructure,
} from './types.js';

// ============================================================================
// Constants
// ============================================================================

/**
 * Common Korean filler words
 */
const COMMON_FILLERS = [
  '음', '저기', '그', '뭐', '그니까', '이제', '아', '어', '에',
  '근데', '그래서', '그러니까', '있잖아', '말이야', '걍', '그냥',
];

/**
 * Common Korean exclamations
 */
const COMMON_EXCLAMATIONS = [
  '와', '아이고', '세상에', '어머', '진짜', '대박', '헐', '이런',
  '아이', '에이', '오', '우와', '허', '흥',
];

/**
 * Complex vocabulary indicators (formal/literary words)
 */
const COMPLEX_WORDS = [
  '그러하', '이러하', '또한', '따라서', '그러므로', '왜냐하면', '비록',
  '그럼에도', '하지만', '그러나', '물론', '당연히', '분명히', '확실히',
];

// ============================================================================
// Fingerprint Computation
// ============================================================================

/**
 * Compute voice fingerprint from dialogue samples
 *
 * Extracts quantitative metrics that characterize a character's voice:
 * - Sentence length patterns
 * - Vocabulary complexity
 * - Punctuation usage
 * - Filler word density
 *
 * @param dialogueSamples - Array of dialogue strings from the character
 * @returns Computed VoiceFingerprint
 */
export function computeVoiceFingerprint(dialogueSamples: string[]): VoiceFingerprint {
  if (dialogueSamples.length === 0) {
    return createDefaultFingerprint();
  }

  const allText = dialogueSamples.join(' ');
  const totalChars = allText.length;

  // Calculate average sentence length
  const sentences = splitIntoSentences(allText);
  const avgSentenceLength = sentences.length > 0
    ? sentences.reduce((sum, s) => sum + s.length, 0) / sentences.length
    : 30;

  // Calculate vocabulary complexity
  const vocabularyComplexity = calculateVocabularyComplexity(allText);

  // Calculate dialogue-to-narration ratio (assuming these are pure dialogue)
  const dialogueToNarrationRatio = 1.0;

  // Calculate punctuation frequencies
  const exclamationCount = (allText.match(/!/g) || []).length;
  const questionCount = (allText.match(/\?/g) || []).length;
  const exclamationFrequency = totalChars > 0 ? (exclamationCount / totalChars) * 1000 : 0;
  const questionFrequency = totalChars > 0 ? (questionCount / totalChars) * 1000 : 0;

  // Calculate filler word density
  const fillerWordDensity = calculateFillerDensity(allText, totalChars);

  return {
    avgSentenceLength,
    vocabularyComplexity,
    dialogueToNarrationRatio,
    exclamationFrequency,
    questionFrequency,
    fillerWordDensity,
  };
}

/**
 * Analyze dialogue samples for speech patterns
 *
 * @param dialogueSamples - Array of dialogue strings
 * @returns Analysis of detected patterns
 */
export function analyzeDialogueSample(dialogueSamples: string[]): {
  detectedFillers: string[];
  detectedExpressions: string[];
  detectedExclamations: string[];
} {
  const allText = dialogueSamples.join(' ');

  // Detect fillers
  const detectedFillers: string[] = [];
  for (const filler of COMMON_FILLERS) {
    if (allText.includes(filler)) {
      detectedFillers.push(filler);
    }
  }

  // Detect exclamations
  const detectedExclamations: string[] = [];
  for (const excl of COMMON_EXCLAMATIONS) {
    if (allText.includes(excl)) {
      detectedExclamations.push(excl);
    }
  }

  // Detect repeated expressions (potential catchphrases)
  const detectedExpressions = detectRepeatedExpressions(dialogueSamples);

  return {
    detectedFillers: [...new Set(detectedFillers)],
    detectedExpressions,
    detectedExclamations: [...new Set(detectedExclamations)],
  };
}

// ============================================================================
// Voice Consistency Analysis
// ============================================================================

/**
 * Analyze voice consistency for a character
 *
 * Compares dialogue in content against the character's voice profile
 * and identifies deviations.
 *
 * @param content - Chapter content to analyze
 * @param characterId - Character to check
 * @param profile - Character's voice profile
 * @param dialogueAttributions - Which dialogue belongs to which character
 * @returns VoiceConsistencyResult with score and deviations
 */
export function analyzeVoiceConsistency(
  content: string,
  characterId: string,
  profile: VoiceProfile,
  dialogueAttributions: DialogueAttribution[]
): VoiceConsistencyResult {
  // Filter to this character's dialogue
  const characterDialogue = dialogueAttributions.filter(d => d.characterId === characterId);

  if (characterDialogue.length === 0) {
    return {
      characterId,
      overallScore: 100,
      deviations: [],
      recommendations: ['캐릭터 대화가 없습니다.'],
    };
  }

  const deviations: VoiceDeviation[] = [];

  // Check vocabulary consistency
  const vocabDeviations = checkVocabularyConsistency(
    characterDialogue.map(d => d.text),
    profile.speechPatterns.vocabulary,
    characterDialogue
  );
  deviations.push(...vocabDeviations);

  // Check verbal habits
  const habitDeviations = checkVerbalHabits(
    characterDialogue.map(d => d.text),
    profile.speechPatterns.verbalHabits,
    characterDialogue
  );
  deviations.push(...habitDeviations);

  // Check sentence structure
  const structureDeviations = checkSentenceStructure(
    characterDialogue.map(d => d.text),
    profile.speechPatterns.sentenceStructure,
    characterDialogue
  );
  deviations.push(...structureDeviations);

  // Calculate overall score
  const overallScore = calculateConsistencyScore(deviations);

  // Generate recommendations
  const recommendations = generateRecommendations(deviations, profile);

  return {
    characterId,
    overallScore,
    deviations,
    recommendations,
  };
}

/**
 * Check vocabulary consistency against profile
 *
 * @param dialogueTexts - Dialogue texts from the character
 * @param vocabProfile - Expected vocabulary profile
 * @param attributions - Dialogue attributions for location info
 * @returns Array of vocabulary deviations
 */
export function checkVocabularyConsistency(
  dialogueTexts: string[],
  vocabProfile: VocabularyProfile,
  attributions: DialogueAttribution[]
): VoiceDeviation[] {
  const deviations: VoiceDeviation[] = [];

  for (let i = 0; i < dialogueTexts.length; i++) {
    const text = dialogueTexts[i];
    const attr = attributions[i];

    // Check register mismatches
    const registerMismatch = checkRegisterMismatch(text, vocabProfile.register);
    if (registerMismatch) {
      deviations.push({
        location: {
          paragraphStart: attr.paragraphIndex,
          paragraphEnd: attr.paragraphIndex,
        },
        aspect: 'vocabulary',
        expected: `${vocabProfile.register} 수준의 어휘`,
        found: registerMismatch.found,
        severity: registerMismatch.severity,
      });
    }

    // Check avoided words
    if (vocabProfile.avoidedWords) {
      for (const avoided of vocabProfile.avoidedWords) {
        if (text.includes(avoided)) {
          deviations.push({
            location: {
              paragraphStart: attr.paragraphIndex,
              paragraphEnd: attr.paragraphIndex,
            },
            aspect: 'vocabulary',
            expected: `"${avoided}" 사용 안 함`,
            found: `"${avoided}" 발견`,
            severity: 'moderate',
          });
        }
      }
    }
  }

  return deviations;
}

/**
 * Check verbal habits against profile
 *
 * @param dialogueTexts - Dialogue texts from the character
 * @param habits - Expected verbal habits
 * @param attributions - Dialogue attributions for location info
 * @returns Array of habit deviations
 */
export function checkVerbalHabits(
  dialogueTexts: string[],
  habits: VerbalHabits,
  attributions: DialogueAttribution[]
): VoiceDeviation[] {
  const deviations: VoiceDeviation[] = [];
  const allText = dialogueTexts.join(' ');

  // Check if characteristic fillers are missing
  if (habits.fillers.length > 0 && dialogueTexts.length >= 5) {
    const hasFillers = habits.fillers.some(f => allText.includes(f));
    if (!hasFillers) {
      deviations.push({
        location: { paragraphStart: 0, paragraphEnd: attributions.length - 1 },
        aspect: 'habit',
        expected: `말버릇 "${habits.fillers[0]}" 등 사용`,
        found: '특징적 말버릇 없음',
        severity: 'minor',
      });
    }
  }

  // Check if catchphrases appear (should appear occasionally)
  if (habits.catchphrases.length > 0 && dialogueTexts.length >= 10) {
    const hasCatchphrase = habits.catchphrases.some(c => allText.includes(c));
    if (!hasCatchphrase) {
      deviations.push({
        location: { paragraphStart: 0, paragraphEnd: attributions.length - 1 },
        aspect: 'habit',
        expected: `특징적 표현 "${habits.catchphrases[0]}" 사용`,
        found: '특징적 표현 없음',
        severity: 'moderate',
      });
    }
  }

  return deviations;
}

/**
 * Check sentence structure against profile
 *
 * @param dialogueTexts - Dialogue texts from the character
 * @param structure - Expected sentence structure
 * @param attributions - Dialogue attributions for location info
 * @returns Array of structure deviations
 */
export function checkSentenceStructure(
  dialogueTexts: string[],
  structure: SentenceStructure,
  attributions: DialogueAttribution[]
): VoiceDeviation[] {
  const deviations: VoiceDeviation[] = [];

  for (let i = 0; i < dialogueTexts.length; i++) {
    const text = dialogueTexts[i];
    const attr = attributions[i];

    // Check sentence length
    const sentences = splitIntoSentences(text);
    const avgLength = sentences.length > 0
      ? sentences.reduce((sum, s) => sum + s.length, 0) / sentences.length
      : text.length;

    const lengthMismatch = checkLengthMismatch(avgLength, structure.preferredLength);
    if (lengthMismatch) {
      deviations.push({
        location: {
          paragraphStart: attr.paragraphIndex,
          paragraphEnd: attr.paragraphIndex,
        },
        aspect: 'structure',
        expected: lengthMismatch.expected,
        found: lengthMismatch.found,
        severity: lengthMismatch.severity,
      });
    }
  }

  return deviations;
}

// ============================================================================
// Helper Functions
// ============================================================================

function createDefaultFingerprint(): VoiceFingerprint {
  return {
    avgSentenceLength: 30,
    vocabularyComplexity: 0.5,
    dialogueToNarrationRatio: 0.5,
    exclamationFrequency: 1,
    questionFrequency: 2,
    fillerWordDensity: 2,
  };
}

function splitIntoSentences(text: string): string[] {
  // Split on Korean sentence endings
  return text.split(/[.!?。？！]/).filter(s => s.trim().length > 0);
}

function calculateVocabularyComplexity(text: string): number {
  let complexCount = 0;
  for (const word of COMPLEX_WORDS) {
    if (text.includes(word)) {
      complexCount++;
    }
  }
  // Normalize to 0-1 scale
  return Math.min(1, complexCount / 5);
}

function calculateFillerDensity(text: string, totalChars: number): number {
  if (totalChars === 0) return 0;

  let fillerCount = 0;
  for (const filler of COMMON_FILLERS) {
    const regex = new RegExp(filler, 'g');
    fillerCount += (text.match(regex) || []).length;
  }

  return (fillerCount / totalChars) * 1000;
}

function detectRepeatedExpressions(samples: string[]): string[] {
  // Simple n-gram detection for repeated phrases
  const phrases = new Map<string, number>();

  for (const sample of samples) {
    // Extract 2-4 word phrases
    const words = sample.split(/\s+/);
    for (let i = 0; i < words.length - 1; i++) {
      const phrase = words.slice(i, i + 2).join(' ');
      if (phrase.length > 3) {
        phrases.set(phrase, (phrases.get(phrase) || 0) + 1);
      }
    }
  }

  // Return phrases that appear multiple times
  return Array.from(phrases.entries())
    .filter(([_, count]) => count >= 2)
    .map(([phrase, _]) => phrase)
    .slice(0, 5);
}

function checkRegisterMismatch(
  text: string,
  expectedRegister: VocabularyProfile['register']
): { found: string; severity: DeviationSeverity } | null {
  // Check for formal markers in casual text or vice versa
  const hasFormalMarkers = /그러하|이러하|따라서|그러므로/.test(text);
  const hasCasualMarkers = /걍|뭐|짱|꿀잼|ㅋㅋ|ㅎㅎ/.test(text);

  if (expectedRegister === 'formal' && hasCasualMarkers) {
    return { found: '구어체/은어 발견', severity: 'moderate' };
  }

  if (expectedRegister === 'colloquial' && hasFormalMarkers) {
    return { found: '문어체 발견', severity: 'minor' };
  }

  return null;
}

function checkLengthMismatch(
  avgLength: number,
  expectedLength: SentenceStructure['preferredLength']
): { expected: string; found: string; severity: DeviationSeverity } | null {
  const thresholds = {
    short: { min: 0, max: 20, name: '짧은 문장' },
    medium: { min: 20, max: 50, name: '중간 길이 문장' },
    long: { min: 50, max: 200, name: '긴 문장' },
    varied: { min: 0, max: 200, name: '다양한 길이' },
  };

  const expected = thresholds[expectedLength];

  if (expectedLength === 'varied') {
    return null; // No mismatch possible for varied
  }

  if (avgLength < expected.min - 10 || avgLength > expected.max + 10) {
    const actualCategory = avgLength < 20 ? '짧은' : avgLength > 50 ? '긴' : '중간 길이';
    return {
      expected: expected.name,
      found: `${actualCategory} 문장 (평균 ${Math.round(avgLength)}자)`,
      severity: Math.abs(avgLength - (expected.min + expected.max) / 2) > 30 ? 'moderate' : 'minor',
    };
  }

  return null;
}

function calculateConsistencyScore(deviations: VoiceDeviation[]): number {
  let score = 100;

  for (const deviation of deviations) {
    switch (deviation.severity) {
      case 'major':
        score -= 15;
        break;
      case 'moderate':
        score -= 8;
        break;
      case 'minor':
        score -= 3;
        break;
    }
  }

  return Math.max(0, score);
}

function generateRecommendations(
  deviations: VoiceDeviation[],
  profile: VoiceProfile
): string[] {
  const recommendations: string[] = [];
  const aspects = new Set(deviations.map(d => d.aspect));

  if (aspects.has('vocabulary')) {
    recommendations.push(
      `어휘 수준을 ${profile.speechPatterns.vocabulary.register}에 맞춰주세요.`
    );
  }

  if (aspects.has('habit')) {
    if (profile.speechPatterns.verbalHabits.fillers.length > 0) {
      recommendations.push(
        `"${profile.speechPatterns.verbalHabits.fillers[0]}" 같은 말버릇을 추가해주세요.`
      );
    }
  }

  if (aspects.has('structure')) {
    const struct = profile.speechPatterns.sentenceStructure;
    recommendations.push(
      `문장 길이를 ${struct.preferredLength === 'short' ? '짧게' : struct.preferredLength === 'long' ? '길게' : '보통으로'} 조절해주세요.`
    );
  }

  if (recommendations.length === 0) {
    recommendations.push('음성 일관성이 좋습니다.');
  }

  return recommendations;
}
