/**
 * Character Voice Management
 *
 * Functions for creating and managing character voice profiles:
 * - createVoiceProfile: Initialize profile from character description
 * - updateVoiceProfile: Refine profile from actual dialogue samples
 * - buildVoiceConstraintPrompt: Generate prompt constraints for generation
 *
 * @module voice/character-voice
 */

import type {
  VoiceProfile,
  SpeechPatterns,
  SentenceStructure,
  VocabularyProfile,
  VerbalHabits,
  SpeechRhythm,
  InternalMonologue,
  LinguisticMarkers,
  VoiceFingerprint,
  HonorificDefault,
} from './types.js';

import { computeVoiceFingerprint, analyzeDialogueSample } from './voice-metrics.js';

// ============================================================================
// Profile Creation
// ============================================================================

/**
 * Create a voice profile from character description
 *
 * Initializes a VoiceProfile with reasonable defaults based on
 * a character description. The profile should be refined with
 * actual dialogue samples using updateVoiceProfile.
 *
 * @param characterId - Unique character identifier
 * @param name - Character name
 * @param initialDescription - Text description of the character
 * @returns Initialized VoiceProfile
 */
export function createVoiceProfile(
  characterId: string,
  name: string,
  initialDescription: string
): VoiceProfile {
  // Parse description for clues
  const analysis = analyzeDescription(initialDescription);

  // Build speech patterns from analysis
  const speechPatterns = buildSpeechPatterns(analysis);

  // Build internal monologue style
  const internalMonologue = buildInternalMonologue(analysis);

  // Build linguistic markers
  const linguisticMarkers = buildLinguisticMarkers(analysis);

  // Initialize fingerprint with defaults (will be refined later)
  const voiceFingerprint = createDefaultFingerprint(analysis);

  return {
    characterId,
    characterName: name,
    speechPatterns,
    internalMonologue,
    linguisticMarkers,
    voiceFingerprint,
  };
}

/**
 * Update voice profile from dialogue samples
 *
 * Refines an existing voice profile using actual dialogue from
 * the character. This helps calibrate the quantitative fingerprint
 * and may reveal patterns not apparent from description alone.
 *
 * @param profile - Existing voice profile
 * @param dialogueSamples - Array of dialogue strings from this character
 * @returns Updated VoiceProfile
 */
export function updateVoiceProfile(
  profile: VoiceProfile,
  dialogueSamples: string[]
): VoiceProfile {
  if (dialogueSamples.length === 0) {
    return profile;
  }

  // Compute new fingerprint from actual dialogue
  const newFingerprint = computeVoiceFingerprint(dialogueSamples);

  // Analyze samples for speech patterns
  const sampleAnalysis = analyzeDialogueSample(dialogueSamples);

  // Update verbal habits if new patterns detected
  const updatedHabits = updateVerbalHabits(
    profile.speechPatterns.verbalHabits,
    sampleAnalysis
  );

  // Update vocabulary if new expressions detected
  const updatedVocabulary = updateVocabulary(
    profile.speechPatterns.vocabulary,
    sampleAnalysis
  );

  return {
    ...profile,
    speechPatterns: {
      ...profile.speechPatterns,
      verbalHabits: updatedHabits,
      vocabulary: updatedVocabulary,
    },
    voiceFingerprint: blendFingerprints(
      profile.voiceFingerprint,
      newFingerprint,
      dialogueSamples.length
    ),
  };
}

/**
 * Build prompt constraints for generating dialogue in character voice
 *
 * Creates a text block that can be included in LLM prompts to ensure
 * generated dialogue matches the character's voice profile.
 *
 * @param profile - Character voice profile
 * @returns Formatted constraint string for LLM prompt
 */
export function buildVoiceConstraintPrompt(profile: VoiceProfile): string {
  const lines: string[] = [];

  lines.push(`## ${profile.characterName}의 말투 가이드`);
  lines.push('');

  // Speech structure
  lines.push('### 문장 구조');
  const struct = profile.speechPatterns.sentenceStructure;
  lines.push(`- 선호 문장 길이: ${translateLength(struct.preferredLength)}`);
  lines.push(`- 복잡도: ${translateComplexity(struct.complexityLevel)}`);
  if (struct.fragmentUsage !== 'never') {
    lines.push(`- 불완전 문장: ${translateFrequency(struct.fragmentUsage)}`);
  }
  lines.push('');

  // Vocabulary
  lines.push('### 어휘');
  const vocab = profile.speechPatterns.vocabulary;
  lines.push(`- 말투 수준: ${translateRegister(vocab.register)}`);
  if (vocab.favoredExpressions.length > 0) {
    lines.push(`- 자주 쓰는 표현: "${vocab.favoredExpressions.join('", "')}"`);
  }
  if (vocab.avoidedWords && vocab.avoidedWords.length > 0) {
    lines.push(`- 피해야 할 단어: "${vocab.avoidedWords.join('", "')}"`);
  }
  if (vocab.technicalTerms && vocab.technicalTerms.length > 0) {
    lines.push(`- 전문 용어: "${vocab.technicalTerms.join('", "')}"`);
  }
  lines.push('');

  // Verbal habits
  lines.push('### 언어 습관');
  const habits = profile.speechPatterns.verbalHabits;
  if (habits.fillers.length > 0) {
    lines.push(`- 말버릇/추임새: "${habits.fillers.join('", "')}"`);
  }
  if (habits.catchphrases.length > 0) {
    lines.push(`- 특징적 표현: "${habits.catchphrases.join('", "')}"`);
  }
  if (habits.exclamations.length > 0) {
    lines.push(`- 감탄사: "${habits.exclamations.join('", "')}"`);
  }
  lines.push(`- 완곡 표현: ${translateHedging(habits.hedging)}`);
  lines.push('');

  // Rhythm
  lines.push('### 말의 리듬');
  const rhythm = profile.speechPatterns.rhythm;
  lines.push(`- 말 속도: ${translateTempo(rhythm.tempo)}`);
  if (rhythm.pauseUsage !== 'rare') {
    lines.push(`- 끊어 말하기: ${translateFrequency(rhythm.pauseUsage)}`);
  }
  lines.push('');

  // Korean-specific
  lines.push('### 존댓말');
  const ling = profile.linguisticMarkers;
  lines.push(`- 기본 어투: ${translateHonorific(ling.honorificDefault)}`);
  if (ling.dialectFeatures && ling.dialectFeatures.length > 0) {
    lines.push(`- 사투리 특징: ${ling.dialectFeatures.join(', ')}`);
  }
  lines.push('');

  // Key constraints summary
  lines.push('### 핵심 제약');
  lines.push('이 캐릭터의 대화를 쓸 때:');
  lines.push(`1. 문장은 ${translateLength(struct.preferredLength)} 유지`);
  lines.push(`2. ${translateRegister(vocab.register)} 수준 유지`);
  if (habits.catchphrases.length > 0) {
    lines.push(`3. 특징적 표현 "${habits.catchphrases[0]}" 적절히 사용`);
  }

  return lines.join('\n');
}

// ============================================================================
// Analysis Helpers
// ============================================================================

interface DescriptionAnalysis {
  age: 'young' | 'middle' | 'old' | 'unknown';
  formality: 'casual' | 'standard' | 'formal';
  education: 'low' | 'medium' | 'high' | 'unknown';
  personality: string[];
  gender: 'male' | 'female' | 'unknown';
}

function analyzeDescription(description: string): DescriptionAnalysis {
  const desc = description.toLowerCase();

  // Age detection
  let age: DescriptionAnalysis['age'] = 'unknown';
  if (desc.includes('젊') || desc.includes('청년') || desc.includes('20대') || desc.includes('학생')) {
    age = 'young';
  } else if (desc.includes('중년') || desc.includes('40대') || desc.includes('50대')) {
    age = 'middle';
  } else if (desc.includes('노인') || desc.includes('할머니') || desc.includes('할아버지') || desc.includes('60대')) {
    age = 'old';
  }

  // Formality detection
  let formality: DescriptionAnalysis['formality'] = 'standard';
  if (desc.includes('격식') || desc.includes('예의') || desc.includes('품위')) {
    formality = 'formal';
  } else if (desc.includes('편하') || desc.includes('편한') || desc.includes('캐주얼') || desc.includes('자유로') || desc.includes('자유롭')) {
    formality = 'casual';
  }

  // Education detection
  let education: DescriptionAnalysis['education'] = 'unknown';
  if (desc.includes('교수') || desc.includes('박사') || desc.includes('지식인') || desc.includes('학자')) {
    education = 'high';
  } else if (desc.includes('대학') || desc.includes('회사원') || desc.includes('직장인')) {
    education = 'medium';
  }

  // Personality traits
  const personality: string[] = [];
  if (desc.includes('내성적') || desc.includes('조용')) personality.push('introverted');
  if (desc.includes('외향적') || desc.includes('활발')) personality.push('extroverted');
  if (desc.includes('신중') || desc.includes('조심')) personality.push('cautious');
  if (desc.includes('충동') || desc.includes('즉흥')) personality.push('impulsive');

  // Gender detection
  let gender: DescriptionAnalysis['gender'] = 'unknown';
  if (desc.includes('남성') || desc.includes('남자') || desc.includes('아버지') || desc.includes('형')) {
    gender = 'male';
  } else if (desc.includes('여성') || desc.includes('여자') || desc.includes('어머니') || desc.includes('언니')) {
    gender = 'female';
  }

  return { age, formality, education, personality, gender };
}

function buildSpeechPatterns(analysis: DescriptionAnalysis): SpeechPatterns {
  // Sentence structure based on personality and age
  const sentenceStructure: SentenceStructure = {
    preferredLength: analysis.education === 'high' ? 'long' : 'medium',
    complexityLevel: analysis.education === 'high' ? 'complex' : 'moderate',
    fragmentUsage: analysis.personality.includes('impulsive') ? 'occasional' : 'rare',
  };

  // Vocabulary based on formality and education
  const vocabulary: VocabularyProfile = {
    register: analysis.formality === 'formal' ? 'formal' :
              analysis.formality === 'casual' ? 'colloquial' : 'standard',
    favoredExpressions: [],
    technicalTerms: [],
    avoidedWords: [],
  };

  // Verbal habits based on age and personality
  const verbalHabits: VerbalHabits = {
    fillers: analysis.age === 'young' ? ['음', '그니까', '뭐지'] :
             analysis.age === 'old' ? ['그래', '음', '있잖아'] : ['음', '저기'],
    catchphrases: [],
    exclamations: analysis.personality.includes('extroverted') ?
                  ['와!', '진짜?', '대박!'] : ['아', '음'],
    hedging: analysis.personality.includes('cautious') ? 'moderate' :
             analysis.personality.includes('impulsive') ? 'minimal' : 'minimal',
  };

  // Rhythm based on personality
  const rhythm: SpeechRhythm = {
    tempo: analysis.personality.includes('impulsive') ? 'fast' :
           analysis.personality.includes('cautious') ? 'slow' : 'moderate',
    pauseUsage: analysis.personality.includes('cautious') ? 'frequent' : 'occasional',
    interruption: analysis.personality.includes('impulsive') ? 'sometimes' : 'never',
  };

  return { sentenceStructure, vocabulary, verbalHabits, rhythm };
}

function buildInternalMonologue(analysis: DescriptionAnalysis): InternalMonologue {
  if (analysis.personality.includes('introverted')) {
    return {
      style: 'analytical',
      selfAddressing: 'first-person',
      tangentFrequency: 'medium',
    };
  }

  if (analysis.personality.includes('impulsive')) {
    return {
      style: 'stream-of-consciousness',
      selfAddressing: 'first-person',
      tangentFrequency: 'high',
    };
  }

  return {
    style: 'emotional',
    selfAddressing: 'first-person',
    tangentFrequency: 'low',
  };
}

function buildLinguisticMarkers(analysis: DescriptionAnalysis): LinguisticMarkers {
  let honorificDefault: HonorificDefault = 'haeyoche';

  if (analysis.formality === 'formal' || analysis.age === 'old') {
    honorificDefault = 'hapsyoche';
  } else if (analysis.formality === 'casual' && analysis.age === 'young') {
    honorificDefault = 'haeche';
  }

  const educationSignals: string[] = [];
  if (analysis.education === 'high') {
    educationSignals.push('전문 용어 사용', '정확한 표현');
  }

  return {
    honorificDefault,
    educationSignals,
  };
}

function createDefaultFingerprint(analysis: DescriptionAnalysis): VoiceFingerprint {
  return {
    avgSentenceLength: analysis.education === 'high' ? 45 : 30,
    vocabularyComplexity: analysis.education === 'high' ? 0.7 :
                         analysis.education === 'medium' ? 0.5 : 0.3,
    dialogueToNarrationRatio: 0.5,
    exclamationFrequency: analysis.personality.includes('extroverted') ? 3 : 1,
    questionFrequency: 2,
    fillerWordDensity: analysis.age === 'young' ? 4 : 2,
  };
}

// ============================================================================
// Update Helpers
// ============================================================================

interface SampleAnalysis {
  detectedFillers: string[];
  detectedExpressions: string[];
  detectedExclamations: string[];
}

function updateVerbalHabits(
  current: VerbalHabits,
  sampleAnalysis: SampleAnalysis
): VerbalHabits {
  // Merge detected fillers with existing
  const fillers = [...new Set([...current.fillers, ...sampleAnalysis.detectedFillers])];

  // Merge detected exclamations
  const exclamations = [...new Set([...current.exclamations, ...sampleAnalysis.detectedExclamations])];

  return {
    ...current,
    fillers: fillers.slice(0, 5), // Keep top 5
    exclamations: exclamations.slice(0, 5),
  };
}

function updateVocabulary(
  current: VocabularyProfile,
  sampleAnalysis: SampleAnalysis
): VocabularyProfile {
  // Merge detected expressions
  const expressions = [...new Set([...current.favoredExpressions, ...sampleAnalysis.detectedExpressions])];

  return {
    ...current,
    favoredExpressions: expressions.slice(0, 10), // Keep top 10
  };
}

function blendFingerprints(
  current: VoiceFingerprint,
  newSample: VoiceFingerprint,
  sampleWeight: number
): VoiceFingerprint {
  // Weight new sample based on number of dialogues
  const weight = Math.min(0.7, sampleWeight * 0.1);
  const currentWeight = 1 - weight;

  return {
    avgSentenceLength: current.avgSentenceLength * currentWeight + newSample.avgSentenceLength * weight,
    vocabularyComplexity: current.vocabularyComplexity * currentWeight + newSample.vocabularyComplexity * weight,
    dialogueToNarrationRatio: current.dialogueToNarrationRatio * currentWeight + newSample.dialogueToNarrationRatio * weight,
    exclamationFrequency: current.exclamationFrequency * currentWeight + newSample.exclamationFrequency * weight,
    questionFrequency: current.questionFrequency * currentWeight + newSample.questionFrequency * weight,
    fillerWordDensity: current.fillerWordDensity * currentWeight + newSample.fillerWordDensity * weight,
  };
}

// ============================================================================
// Translation Helpers
// ============================================================================

function translateLength(length: SentenceStructure['preferredLength']): string {
  const map = {
    'short': '짧게',
    'medium': '보통',
    'long': '길게',
    'varied': '다양하게',
  };
  return map[length];
}

function translateComplexity(complexity: SentenceStructure['complexityLevel']): string {
  const map = {
    'simple': '단순',
    'moderate': '보통',
    'complex': '복잡',
  };
  return map[complexity];
}

function translateFrequency(freq: 'never' | 'rare' | 'occasional' | 'frequent'): string {
  const map = {
    'never': '사용 안 함',
    'rare': '드물게',
    'occasional': '가끔',
    'frequent': '자주',
  };
  return map[freq];
}

function translateRegister(register: VocabularyProfile['register']): string {
  const map = {
    'colloquial': '구어체',
    'standard': '표준어',
    'formal': '격식체',
    'literary': '문어체',
  };
  return map[register];
}

function translateHedging(hedging: VerbalHabits['hedging']): string {
  const map = {
    'none': '직설적',
    'minimal': '약간',
    'moderate': '보통',
    'heavy': '매우 많음',
  };
  return map[hedging];
}

function translateTempo(tempo: SpeechRhythm['tempo']): string {
  const map = {
    'slow': '느림',
    'moderate': '보통',
    'fast': '빠름',
    'variable': '변화무쌍',
  };
  return map[tempo];
}

function translateHonorific(hon: HonorificDefault): string {
  const map = {
    'haeche': '해체 (반말)',
    'haeyoche': '해요체',
    'hapsyoche': '하십시오체',
  };
  return map[hon];
}
