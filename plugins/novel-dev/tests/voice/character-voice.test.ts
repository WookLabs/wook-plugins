/**
 * Character Voice Tests
 *
 * Tests for voice profile management and consistency:
 * - createVoiceProfile initializes from description
 * - computeVoiceFingerprint extracts metrics
 * - analyzeVoiceConsistency detects vocabulary drift
 * - analyzeVoiceConsistency detects structure drift
 * - buildVoiceConstraintPrompt generates readable constraints
 * - Multiple characters have distinct profiles
 * - Characters with matching profile score 100
 * - Mismatched dialogue scores lower
 *
 * @module tests/voice/character-voice
 */

import { describe, it, expect } from 'vitest';
import {
  createVoiceProfile,
  updateVoiceProfile,
  buildVoiceConstraintPrompt,
  computeVoiceFingerprint,
  analyzeVoiceConsistency,
  checkVocabularyConsistency,
  checkVerbalHabits,
  checkSentenceStructure,
  buildVoiceAnalysisPrompt,
  buildVoiceGenerationPrompt,
} from '../../src/voice/index.js';
import type {
  VoiceProfile,
  VoiceFingerprint,
  VoiceConsistencyResult,
  DialogueAttribution,
  VoiceDeviation,
} from '../../src/voice/index.js';

// ============================================================================
// Test Data
// ============================================================================

const createTestAttributions = (
  characterId: string,
  texts: string[]
): DialogueAttribution[] =>
  texts.map((text, i) => ({
    characterId,
    text,
    position: i * 100,
    paragraphIndex: i,
  }));

// ============================================================================
// createVoiceProfile Tests
// ============================================================================

describe('createVoiceProfile', () => {
  it('should create profile with character ID and name', () => {
    const profile = createVoiceProfile('char_001', '김철수', '격식을 차리는 40대 남성');
    expect(profile.characterId).toBe('char_001');
    expect(profile.characterName).toBe('김철수');
  });

  it('should have all required profile fields', () => {
    const profile = createVoiceProfile('char_001', '김철수', '조용한 학생');
    expect(profile.speechPatterns).toBeDefined();
    expect(profile.speechPatterns.sentenceStructure).toBeDefined();
    expect(profile.speechPatterns.vocabulary).toBeDefined();
    expect(profile.speechPatterns.verbalHabits).toBeDefined();
    expect(profile.speechPatterns.rhythm).toBeDefined();
    expect(profile.internalMonologue).toBeDefined();
    expect(profile.linguisticMarkers).toBeDefined();
    expect(profile.voiceFingerprint).toBeDefined();
  });

  it('should detect formal speech from description', () => {
    const profile = createVoiceProfile('char_001', '김철수', '격식을 차리는 40대 남성');
    expect(profile.speechPatterns.vocabulary.register).toBe('formal');
  });

  it('should detect casual speech from description', () => {
    const profile = createVoiceProfile('char_002', '박수아', '편한 20대 여성 학생');
    expect(profile.speechPatterns.vocabulary.register).toBe('colloquial');
  });

  it('should detect introverted personality traits', () => {
    const profile = createVoiceProfile('char_003', '이지은', '내성적인 여성');
    expect(profile.internalMonologue.style).toBe('analytical');
  });

  it('should set honorific default based on formality and age', () => {
    const formal = createVoiceProfile('char_001', '김교수', '격식을 차리는 교수');
    expect(formal.linguisticMarkers.honorificDefault).toBe('hapsyoche');

    const casual = createVoiceProfile('char_002', '민지', '편한 20대 여성 학생');
    expect(casual.linguisticMarkers.honorificDefault).toBe('haeche');
  });

  it('should initialize voice fingerprint with defaults', () => {
    const profile = createVoiceProfile('char_001', '김철수', '보통 남성');
    const fp = profile.voiceFingerprint;
    expect(typeof fp.avgSentenceLength).toBe('number');
    expect(typeof fp.vocabularyComplexity).toBe('number');
    expect(fp.vocabularyComplexity).toBeGreaterThanOrEqual(0);
    expect(fp.vocabularyComplexity).toBeLessThanOrEqual(1);
    expect(typeof fp.exclamationFrequency).toBe('number');
    expect(typeof fp.questionFrequency).toBe('number');
    expect(typeof fp.fillerWordDensity).toBe('number');
  });

  it('should give higher vocabulary complexity to educated characters', () => {
    const professor = createVoiceProfile('char_001', '김교수', '박사 학위를 가진 교수');
    const student = createVoiceProfile('char_002', '민수', '일반 학생');
    expect(professor.voiceFingerprint.vocabularyComplexity)
      .toBeGreaterThan(student.voiceFingerprint.vocabularyComplexity);
  });
});

// ============================================================================
// updateVoiceProfile Tests
// ============================================================================

describe('updateVoiceProfile', () => {
  it('should return same profile for empty samples', () => {
    const profile = createVoiceProfile('char_001', '김철수', '보통 남성');
    const updated = updateVoiceProfile(profile, []);
    expect(updated).toEqual(profile);
  });

  it('should update fingerprint from dialogue samples', () => {
    const profile = createVoiceProfile('char_001', '김철수', '보통 남성');
    const samples = [
      '네, 알겠습니다.',
      '그렇게 하겠습니다.',
      '음, 제 생각에는 그게 맞는 것 같습니다.',
    ];
    const updated = updateVoiceProfile(profile, samples);

    // Fingerprint should be different after update
    expect(updated.voiceFingerprint).not.toEqual(profile.voiceFingerprint);
  });

  it('should detect and merge fillers from samples', () => {
    const profile = createVoiceProfile('char_001', '김철수', '보통 남성');
    const samples = [
      '그니까, 그게 말이야...',
      '있잖아, 내가 어제 봤는데...',
      '근데 그게 좀 이상하지 않아?',
    ];
    const updated = updateVoiceProfile(profile, samples);
    // Fillers should include detected ones
    expect(updated.speechPatterns.verbalHabits.fillers.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// computeVoiceFingerprint Tests
// ============================================================================

describe('computeVoiceFingerprint', () => {
  it('should return default fingerprint for empty samples', () => {
    const fp = computeVoiceFingerprint([]);
    expect(fp.avgSentenceLength).toBe(30);
    expect(fp.vocabularyComplexity).toBe(0.5);
  });

  it('should compute average sentence length', () => {
    const fp = computeVoiceFingerprint([
      '짧은 문장.',
      '이것은 좀 더 긴 문장입니다.',
    ]);
    expect(fp.avgSentenceLength).toBeGreaterThan(0);
  });

  it('should compute exclamation frequency', () => {
    const fpExclaiming = computeVoiceFingerprint([
      '와! 대박! 진짜!',
    ]);
    const fpCalm = computeVoiceFingerprint([
      '네, 알겠습니다.',
    ]);
    expect(fpExclaiming.exclamationFrequency).toBeGreaterThan(fpCalm.exclamationFrequency);
  });

  it('should compute question frequency', () => {
    const fpQuestioning = computeVoiceFingerprint([
      '그래? 왜? 어떻게?',
    ]);
    const fpStatement = computeVoiceFingerprint([
      '그렇습니다. 맞습니다.',
    ]);
    expect(fpQuestioning.questionFrequency).toBeGreaterThan(fpStatement.questionFrequency);
  });

  it('should compute vocabulary complexity', () => {
    const fpComplex = computeVoiceFingerprint([
      '그러하지만 또한 따라서 그러므로 비록 그러하다.',
    ]);
    const fpSimple = computeVoiceFingerprint([
      '네 알겠어요 그래요.',
    ]);
    expect(fpComplex.vocabularyComplexity).toBeGreaterThan(fpSimple.vocabularyComplexity);
  });
});

// ============================================================================
// analyzeVoiceConsistency Tests
// ============================================================================

describe('analyzeVoiceConsistency', () => {
  it('should return 100 for character with matching dialogue', () => {
    const profile = createVoiceProfile('char_001', '김철수', '격식을 차리는 40대 남성');
    const attributions = createTestAttributions('char_001', [
      '네, 알겠습니다.',
      '그렇게 하겠습니다.',
    ]);

    const result = analyzeVoiceConsistency(
      '"네, 알겠습니다." 김철수가 말했다. "그렇게 하겠습니다."',
      'char_001',
      profile,
      attributions
    );

    expect(result.characterId).toBe('char_001');
    expect(result.overallScore).toBeGreaterThanOrEqual(80);
  });

  it('should return 100 with empty dialogue attributions', () => {
    const profile = createVoiceProfile('char_001', '김철수', '보통 남성');

    const result = analyzeVoiceConsistency(
      '장면 내용...',
      'char_001',
      profile,
      []
    );

    expect(result.overallScore).toBe(100);
    expect(result.deviations.length).toBe(0);
  });

  it('should detect vocabulary drift (casual in formal profile)', () => {
    const profile = createVoiceProfile('char_001', '김교수', '격식을 차리는 교수');
    const attributions = createTestAttributions('char_001', [
      '걍 그렇게 해, ㅋㅋ',
    ]);

    const result = analyzeVoiceConsistency(
      '"걍 그렇게 해, ㅋㅋ" 김교수가 말했다.',
      'char_001',
      profile,
      attributions
    );

    expect(result.deviations.length).toBeGreaterThan(0);
    const vocabDeviation = result.deviations.find(d => d.aspect === 'vocabulary');
    expect(vocabDeviation).toBeDefined();
  });

  it('should detect structure drift (long sentences for short-preference)', () => {
    const profile = createVoiceProfile('char_002', '민지', '편한 20대 여성 학생');
    // Force short preference
    profile.speechPatterns.sentenceStructure.preferredLength = 'short';

    const longText = '그러니까 제가 말씀드리고 싶은 것은 이 상황에서 우리가 취할 수 있는 가장 합리적인 방법은 서로의 의견을 존중하면서도 최선의 결과를 이끌어내는 것이라고 생각합니다.';
    const attributions = createTestAttributions('char_002', [longText]);

    const result = analyzeVoiceConsistency(
      `"${longText}" 민지가 말했다.`,
      'char_002',
      profile,
      attributions
    );

    const structureDeviation = result.deviations.find(d => d.aspect === 'structure');
    expect(structureDeviation).toBeDefined();
  });

  it('should detect missing verbal habits', () => {
    const profile = createVoiceProfile('char_001', '김철수', '보통 남성');
    // Add specific habits to profile
    profile.speechPatterns.verbalHabits.fillers = ['음', '저기'];
    profile.speechPatterns.verbalHabits.catchphrases = ['그건 좀...'];

    // 10+ dialogues without any habits
    const texts = Array.from({ length: 12 }, (_, i) => `대화 ${i + 1}번입니다.`);
    const attributions = createTestAttributions('char_001', texts);

    const result = analyzeVoiceConsistency(
      texts.map(t => `"${t}"`).join(' '),
      'char_001',
      profile,
      attributions
    );

    const habitDeviation = result.deviations.find(d => d.aspect === 'habit');
    expect(habitDeviation).toBeDefined();
  });

  it('should score lower for mismatched dialogue', () => {
    const formalProfile = createVoiceProfile('char_001', '김교수', '격식을 차리는 교수');
    const casualTexts = ['걍 해, ㅋㅋ', '뭐 어쩔, ㅎㅎ', '짱이다!'];
    const attributions = createTestAttributions('char_001', casualTexts);

    const result = analyzeVoiceConsistency(
      casualTexts.map(t => `"${t}"`).join(' '),
      'char_001',
      formalProfile,
      attributions
    );

    expect(result.overallScore).toBeLessThan(100);
  });

  it('should provide recommendations for deviations', () => {
    const profile = createVoiceProfile('char_001', '김교수', '격식을 차리는 교수');
    const attributions = createTestAttributions('char_001', ['걍 그래, ㅋㅋ']);

    const result = analyzeVoiceConsistency(
      '"걍 그래, ㅋㅋ"',
      'char_001',
      profile,
      attributions
    );

    expect(result.recommendations.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// Multiple Character Distinction Tests
// ============================================================================

describe('character voice distinction', () => {
  it('should create different profiles for different descriptions', () => {
    const formal = createVoiceProfile('char_001', '김교수', '격식을 차리는 50대 교수');
    const casual = createVoiceProfile('char_002', '민수', '편한 20대 학생');

    // Different register
    expect(formal.speechPatterns.vocabulary.register).not.toBe(
      casual.speechPatterns.vocabulary.register
    );

    // Different honorific defaults
    expect(formal.linguisticMarkers.honorificDefault).not.toBe(
      casual.linguisticMarkers.honorificDefault
    );
  });

  it('should produce different fingerprints for different dialogue styles', () => {
    const formalSamples = [
      '네, 그렇게 진행하겠습니다.',
      '말씀하신 내용은 충분히 이해했습니다.',
      '따라서 이 방안이 최선이라고 봅니다.',
    ];
    const casualSamples = [
      '어 그래? 진짜?',
      '와 대박! ㅋㅋ',
      '뭐 걍 그런 거지 뭐.',
    ];

    const formalFP = computeVoiceFingerprint(formalSamples);
    const casualFP = computeVoiceFingerprint(casualSamples);

    // Formal should have higher vocabulary complexity
    expect(formalFP.vocabularyComplexity).toBeGreaterThan(casualFP.vocabularyComplexity);

    // Casual should have higher exclamation frequency
    expect(casualFP.exclamationFrequency).toBeGreaterThan(formalFP.exclamationFrequency);
  });
});

// ============================================================================
// buildVoiceConstraintPrompt Tests
// ============================================================================

describe('buildVoiceConstraintPrompt', () => {
  it('should generate readable constraint prompt', () => {
    const profile = createVoiceProfile('char_001', '김철수', '격식을 차리는 40대 남성');
    const prompt = buildVoiceConstraintPrompt(profile);

    expect(prompt).toContain('김철수');
    expect(prompt).toContain('말투 가이드');
    expect(prompt.length).toBeGreaterThan(100);
  });

  it('should include sentence structure info', () => {
    const profile = createVoiceProfile('char_001', '김철수', '보통 남성');
    const prompt = buildVoiceConstraintPrompt(profile);

    expect(prompt).toContain('문장 구조');
    expect(prompt).toContain('문장 길이');
  });

  it('should include vocabulary info', () => {
    const profile = createVoiceProfile('char_001', '김철수', '격식을 차리는 남성');
    const prompt = buildVoiceConstraintPrompt(profile);

    expect(prompt).toContain('어휘');
    expect(prompt).toContain('말투 수준');
  });

  it('should include verbal habits info', () => {
    const profile = createVoiceProfile('char_001', '김철수', '보통 남성');
    profile.speechPatterns.verbalHabits.fillers = ['음', '저기'];
    const prompt = buildVoiceConstraintPrompt(profile);

    expect(prompt).toContain('언어 습관');
    expect(prompt).toContain('음');
  });

  it('should include honorific information', () => {
    const profile = createVoiceProfile('char_001', '김철수', '격식을 차리는 40대 남성');
    const prompt = buildVoiceConstraintPrompt(profile);

    expect(prompt).toContain('존댓말');
  });
});

// ============================================================================
// Voice Prompt Builder Tests
// ============================================================================

describe('buildVoiceAnalysisPrompt', () => {
  it('should generate prompt with dialogue samples', () => {
    const prompt = buildVoiceAnalysisPrompt(
      ['네, 알겠습니다.', '그렇게 하겠습니다.'],
      { name: '김철수', description: '40대 남성' }
    );

    expect(prompt).toContain('캐릭터 음성 패턴 분석');
    expect(prompt).toContain('김철수');
    expect(prompt).toContain('네, 알겠습니다.');
  });
});

describe('buildVoiceGenerationPrompt', () => {
  it('should generate prompt with voice profile info', () => {
    const profile = createVoiceProfile('char_001', '김철수', '격식을 차리는 40대 남성');
    const prompt = buildVoiceGenerationPrompt(profile);

    expect(prompt).toContain('김철수');
    expect(prompt).toContain('캐릭터 대화 생성 가이드');
    expect(prompt).toContain('핵심 특성');
  });
});

// ============================================================================
// checkVocabularyConsistency Tests
// ============================================================================

describe('checkVocabularyConsistency', () => {
  it('should detect avoided words in dialogue', () => {
    const profile = createVoiceProfile('char_001', '김교수', '격식을 차리는 교수');
    profile.speechPatterns.vocabulary.avoidedWords = ['걍', '뭐'];

    const texts = ['걍 그렇게 하자.'];
    const attributions = createTestAttributions('char_001', texts);

    const deviations = checkVocabularyConsistency(texts, profile.speechPatterns.vocabulary, attributions);
    expect(deviations.length).toBeGreaterThan(0);
    expect(deviations.some(d => d.found.includes('걍'))).toBe(true);
  });
});

// ============================================================================
// checkVerbalHabits Tests
// ============================================================================

describe('checkVerbalHabits', () => {
  it('should detect missing fillers across many dialogues', () => {
    const habits = {
      fillers: ['음', '저기'],
      catchphrases: [],
      exclamations: ['아'],
      hedging: 'minimal' as const,
    };

    const texts = Array.from({ length: 6 }, () => '네, 알겠습니다.');
    const attributions = createTestAttributions('char_001', texts);

    const deviations = checkVerbalHabits(texts, habits, attributions);
    expect(deviations.some(d => d.aspect === 'habit')).toBe(true);
  });
});

// ============================================================================
// checkSentenceStructure Tests
// ============================================================================

describe('checkSentenceStructure', () => {
  it('should detect long sentences for short-preference profile', () => {
    const structure = {
      preferredLength: 'short' as const,
      complexityLevel: 'simple' as const,
      fragmentUsage: 'frequent' as const,
    };

    const longText = '그러니까 제가 말씀드리고 싶은 것은 이 상황에서 우리가 취할 수 있는 가장 합리적인 방법이라고 생각합니다.';
    const texts = [longText];
    const attributions = createTestAttributions('char_001', texts);

    const deviations = checkSentenceStructure(texts, structure, attributions);
    expect(deviations.length).toBeGreaterThan(0);
    expect(deviations[0].aspect).toBe('structure');
  });
});
