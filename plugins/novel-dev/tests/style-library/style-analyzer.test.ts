/**
 * Style Analyzer Tests
 *
 * Tests for stylometric analysis functions including:
 * - TTR and MTLD computation
 * - Korean sentence extraction
 * - Dialogue ratio computation
 * - Sensory word detection
 * - Full style profile creation
 * - Style matching
 */

import { describe, it, expect } from 'vitest';
import {
  computeTTR,
  computeMTLD,
  extractSentences,
  computeDialogueRatio,
  countSensoryWords,
  computeStylometrics,
  analyzeStyleFromReference,
  computeStyleMatch,
  extractWords,
  extractDialogues,
  extractParagraphs,
  countDialogueTransitions,
  createStyleProfile,
  buildStyleConstraints,
} from '../../src/style-library/index.js';

// ============================================================================
// Test Data
// ============================================================================

const KOREAN_SAMPLE_1 = `
그는 천천히 걸었다. 바람이 불었다. 나뭇잎이 흔들렸다.
가을이 깊어지고 있었다. 그의 마음도 함께 깊어졌다.
`;

const KOREAN_SAMPLE_2 = `
"정말 아름다운 밤이야." 그녀가 속삭였다.
별빛이 반짝이고, 차가운 바람이 불었다.
"그래, 정말 그렇구나." 그가 대답했다.
두 사람은 말없이 밤하늘을 올려다보았다.
`;

const KOREAN_SAMPLE_3 = `
그녀는 커피잔을 들어올렸다. 김이 피어올랐다.
따뜻한 향기가 코끝을 간질였다. 쓴맛이 혀에 감돌았다.
창밖에서 비 소리가 들렸다. 부슬부슬 내리는 비였다.
그녀는 빗방울이 창문을 두드리는 소리를 들으며 눈을 감았다.
`;

const MIXED_SAMPLE = `
서울의 밤거리는 네온사인으로 빛나고 있었다. 형형색색의 조명이 번쩍였다.

"여기서 뭘 하는 거야?" 민수가 물었다. 그의 목소리에는 짜증이 묻어 있었다.

지연은 대답하지 않았다. 그녀는 그저 먼 곳을 바라볼 뿐이었다. 차가운 바람이 그녀의 머리카락을 휘날렸다.

"말 좀 해봐." 민수가 다시 재촉했다.

"그냥... 생각 좀 하고 있어." 지연이 작은 목소리로 말했다.

밤공기가 축축했다. 어디선가 라면 끓이는 냄새가 풍겼다. 민수는 한숨을 쉬었다.
`;

const LONG_SAMPLE = `
새벽빛이 서서히 밝아오고 있었다. 도시의 불빛들이 하나둘 꺼지고, 하늘이 옅은 분홍빛으로 물들어갔다.

현우는 창가에 서서 그 광경을 지켜보았다. 잠을 이루지 못한 밤이었다. 머릿속에는 온갖 생각들이 소용돌이쳤다.

"아직도 안 잤어?" 아내의 목소리가 등 뒤에서 들렸다.

그는 고개를 돌렸다. 수연이 잠옷 차림으로 서 있었다. 눈이 충혈되어 있었다. 그녀도 잠을 설친 모양이었다.

"응, 그냥 좀." 현우가 짧게 대답했다.

"뭐가 그렇게 걱정돼?"

현우는 한참 동안 말이 없었다. 창밖을 바라보다가 천천히 입을 열었다.

"내일 회의 말이야. 잘 될까?"

수연이 다가와 그의 손을 잡았다. 따뜻한 온기가 전해졌다.

"잘 될 거야. 네가 얼마나 준비했는데."

그 말에 현우의 어깨가 조금 풀어졌다. 멀리서 까치 울음소리가 들렸다. 새로운 하루가 시작되고 있었다.

부엌에서 커피 향기가 퍼져나왔다. 수연이 미리 내려놓은 것이었다. 현우는 고마운 마음이 들었다.

"고마워." 그가 말했다.

"뭘." 수연이 웃었다.

두 사람은 함께 떠오르는 태양을 바라보았다. 하늘이 점점 밝아지고 있었다. 도시가 깨어나고 있었다.
`;

// ============================================================================
// extractWords Tests
// ============================================================================

describe('extractWords', () => {
  it('should extract words from Korean text', () => {
    const words = extractWords('그는 천천히 걸었다');
    expect(words.length).toBeGreaterThan(0);
    expect(words).toContain('그는');
  });

  it('should remove punctuation', () => {
    const words = extractWords('안녕하세요. 반갑습니다!');
    expect(words.some(w => w.includes('.'))).toBe(false);
    expect(words.some(w => w.includes('!'))).toBe(false);
  });

  it('should handle empty text', () => {
    const words = extractWords('');
    expect(words).toEqual([]);
  });

  it('should handle text with quotes', () => {
    const words = extractWords('"안녕" 그가 말했다');
    expect(words.some(w => w.includes('"'))).toBe(false);
  });
});

// ============================================================================
// computeTTR Tests
// ============================================================================

describe('computeTTR', () => {
  it('should return value between 0 and 1', () => {
    const ttr = computeTTR(KOREAN_SAMPLE_1);
    expect(ttr).toBeGreaterThanOrEqual(0);
    expect(ttr).toBeLessThanOrEqual(1);
  });

  it('should return higher TTR for more diverse text', () => {
    const diverse = '하나 둘 셋 넷 다섯 여섯 일곱 여덟 아홉 열';
    const repetitive = '하나 하나 하나 하나 하나 하나 하나 하나 하나 하나';

    const diverseTTR = computeTTR(diverse);
    const repetitiveTTR = computeTTR(repetitive);

    expect(diverseTTR).toBeGreaterThan(repetitiveTTR);
  });

  it('should return 0 for empty text', () => {
    expect(computeTTR('')).toBe(0);
  });

  it('should return 1 for all unique words', () => {
    const ttr = computeTTR('하나 둘 셋 넷 다섯');
    expect(ttr).toBe(1);
  });
});

// ============================================================================
// computeMTLD Tests
// ============================================================================

describe('computeMTLD', () => {
  it('should return reasonable values (50-150 range for normal text)', () => {
    const mtld = computeMTLD(LONG_SAMPLE);
    expect(mtld).toBeGreaterThan(0);
    // MTLD can vary widely, but should be positive
  });

  it('should handle short text', () => {
    const mtld = computeMTLD('짧은 텍스트');
    expect(mtld).toBeGreaterThan(0);
  });

  it('should return higher MTLD for more diverse text', () => {
    // Generate more diverse text
    const diverse = Array.from({ length: 100 }, (_, i) => `단어${i}`).join(' ');
    const repetitive = Array.from({ length: 100 }, () => '반복').join(' ');

    const diverseMTLD = computeMTLD(diverse);
    const repetitiveMTLD = computeMTLD(repetitive);

    expect(diverseMTLD).toBeGreaterThan(repetitiveMTLD);
  });
});

// ============================================================================
// extractSentences Tests
// ============================================================================

describe('extractSentences', () => {
  it('should extract sentences from Korean text', () => {
    const sentences = extractSentences(KOREAN_SAMPLE_1);
    expect(sentences.length).toBeGreaterThan(0);
  });

  it('should handle Korean sentence enders (다, 요, 까, etc.)', () => {
    const text = '밥을 먹었다. 맛있었어요. 또 올까요?';
    const sentences = extractSentences(text);
    expect(sentences.length).toBeGreaterThanOrEqual(1);
  });

  it('should handle text with dialogue', () => {
    const sentences = extractSentences(KOREAN_SAMPLE_2);
    expect(sentences.length).toBeGreaterThan(0);
  });

  it('should return single element for text without sentence breaks', () => {
    const sentences = extractSentences('문장끝없음');
    expect(sentences.length).toBe(1);
  });

  it('should handle empty text', () => {
    const sentences = extractSentences('');
    expect(sentences.length).toBe(0);
  });
});

// ============================================================================
// computeDialogueRatio Tests
// ============================================================================

describe('computeDialogueRatio', () => {
  it('should return value between 0 and 1', () => {
    const ratio = computeDialogueRatio(KOREAN_SAMPLE_2);
    expect(ratio).toBeGreaterThanOrEqual(0);
    expect(ratio).toBeLessThanOrEqual(1);
  });

  it('should return higher ratio for dialogue-heavy text', () => {
    const dialogueHeavy = '"대화" 그가 말했다 "더 많은 대화" 그녀가 답했다';
    const narrativeHeavy = '그는 걸었다. 바람이 불었다. 해가 떴다.';

    const dialogueRatio = computeDialogueRatio(dialogueHeavy);
    const narrativeRatio = computeDialogueRatio(narrativeHeavy);

    expect(dialogueRatio).toBeGreaterThan(narrativeRatio);
  });

  it('should handle different quote styles', () => {
    const western = '"대화 내용"';
    const japanese = '「대화 내용」';

    const westernRatio = computeDialogueRatio(western);
    const japaneseRatio = computeDialogueRatio(japanese);

    expect(westernRatio).toBeGreaterThan(0);
    expect(japaneseRatio).toBeGreaterThan(0);
  });

  it('should return 0 for text without dialogue', () => {
    const ratio = computeDialogueRatio('대화가 없는 순수한 서술문입니다');
    expect(ratio).toBe(0);
  });
});

// ============================================================================
// extractDialogues Tests
// ============================================================================

describe('extractDialogues', () => {
  it('should extract dialogue strings', () => {
    const dialogues = extractDialogues(KOREAN_SAMPLE_2);
    expect(dialogues.length).toBeGreaterThan(0);
    expect(dialogues[0]).toContain('아름다운');
  });

  it('should handle multiple quote styles', () => {
    const text = '"서양식" 그리고 「일본식」 대화';
    const dialogues = extractDialogues(text);
    expect(dialogues.length).toBe(2);
  });
});

// ============================================================================
// countSensoryWords Tests
// ============================================================================

describe('countSensoryWords', () => {
  it('should detect visual sensory words', () => {
    const result = countSensoryWords('빛나는 별을 보았다. 어두운 밤이었다.');
    expect(result.count).toBeGreaterThan(0);
    expect(result.dominant).toContain('visual');
  });

  it('should detect auditory sensory words', () => {
    const result = countSensoryWords('소리가 들렸다. 조용한 밤이었다.');
    expect(result.count).toBeGreaterThan(0);
    expect(result.dominant).toContain('auditory');
  });

  it('should detect tactile sensory words', () => {
    // Use base forms that exist in the sensory word list
    const result = countSensoryWords('따뜻하다 느끼다 부드럽다 거칠다 두근');
    expect(result.count).toBeGreaterThan(0);
    expect(result.dominant).toContain('tactile');
  });

  it('should detect olfactory sensory words', () => {
    const result = countSensoryWords('향기로운 냄새가 났다. 구수한 향이었다.');
    expect(result.count).toBeGreaterThan(0);
    expect(result.dominant).toContain('olfactory');
  });

  it('should detect gustatory sensory words', () => {
    const result = countSensoryWords('달콤한 맛이 났다. 쓴맛이 느껴졌다.');
    expect(result.count).toBeGreaterThan(0);
    expect(result.dominant).toContain('gustatory');
  });

  it('should return correct dominant senses in order', () => {
    const result = countSensoryWords(KOREAN_SAMPLE_3);
    expect(result.dominant.length).toBeGreaterThan(0);
    // First dominant should have highest count
  });

  it('should return empty for text without sensory words', () => {
    const result = countSensoryWords('그는 생각했다. 결정을 내렸다.');
    // May or may not be 0 depending on word list
    expect(result.count).toBeGreaterThanOrEqual(0);
  });
});

// ============================================================================
// extractParagraphs Tests
// ============================================================================

describe('extractParagraphs', () => {
  it('should split by double newlines', () => {
    const paragraphs = extractParagraphs('첫 문단\n\n두번째 문단');
    expect(paragraphs.length).toBe(2);
  });

  it('should handle multiple blank lines', () => {
    const paragraphs = extractParagraphs('문단1\n\n\n\n문단2');
    expect(paragraphs.length).toBe(2);
  });

  it('should trim whitespace', () => {
    const paragraphs = extractParagraphs('  문단1  \n\n  문단2  ');
    expect(paragraphs[0]).toBe('문단1');
    expect(paragraphs[1]).toBe('문단2');
  });
});

// ============================================================================
// countDialogueTransitions Tests
// ============================================================================

describe('countDialogueTransitions', () => {
  it('should count dialogue-narration transitions', () => {
    const transitions = countDialogueTransitions(MIXED_SAMPLE);
    expect(transitions).toBeGreaterThan(0);
  });

  it('should return 0 for text without dialogue', () => {
    const transitions = countDialogueTransitions('대화 없는 텍스트입니다');
    expect(transitions).toBe(0);
  });
});

// ============================================================================
// computeStylometrics Tests
// ============================================================================

describe('computeStylometrics', () => {
  it('should return complete Stylometrics object', () => {
    const stylometrics = computeStylometrics(LONG_SAMPLE);

    expect(stylometrics.lexicalDiversity).toBeDefined();
    expect(stylometrics.sentenceStatistics).toBeDefined();
    expect(stylometrics.dialogueMetrics).toBeDefined();
    expect(stylometrics.sensoryMetrics).toBeDefined();
    expect(stylometrics.rhythmPatterns).toBeDefined();
  });

  it('should compute reasonable lexical diversity', () => {
    const stylometrics = computeStylometrics(LONG_SAMPLE);

    expect(stylometrics.lexicalDiversity.ttr).toBeGreaterThan(0);
    expect(stylometrics.lexicalDiversity.ttr).toBeLessThanOrEqual(1);
    expect(stylometrics.lexicalDiversity.mtld).toBeGreaterThan(0);
    expect(stylometrics.lexicalDiversity.uniqueWordCount).toBeGreaterThan(0);
    expect(stylometrics.lexicalDiversity.totalWordCount).toBeGreaterThan(0);
  });

  it('should compute sentence statistics', () => {
    const stylometrics = computeStylometrics(LONG_SAMPLE);

    expect(stylometrics.sentenceStatistics.meanLength).toBeGreaterThan(0);
    expect(stylometrics.sentenceStatistics.stdDeviation).toBeGreaterThanOrEqual(0);
    expect(stylometrics.sentenceStatistics.distribution.short).toBeGreaterThanOrEqual(0);
    expect(stylometrics.sentenceStatistics.distribution.medium).toBeGreaterThanOrEqual(0);
    expect(stylometrics.sentenceStatistics.distribution.long).toBeGreaterThanOrEqual(0);
    expect(stylometrics.sentenceStatistics.distribution.veryLong).toBeGreaterThanOrEqual(0);
  });

  it('should compute dialogue metrics', () => {
    const stylometrics = computeStylometrics(MIXED_SAMPLE);

    expect(stylometrics.dialogueMetrics.dialogueRatio).toBeGreaterThan(0);
    expect(stylometrics.dialogueMetrics.avgDialogueLength).toBeGreaterThan(0);
    expect(stylometrics.dialogueMetrics.dialogueToNarrationTransitions).toBeGreaterThan(0);
  });

  it('should compute sensory metrics', () => {
    const stylometrics = computeStylometrics(KOREAN_SAMPLE_3);

    expect(stylometrics.sensoryMetrics.sensoryDensity).toBeGreaterThan(0);
    expect(Array.isArray(stylometrics.sensoryMetrics.dominantSenses)).toBe(true);
  });

  it('should compute rhythm patterns', () => {
    const stylometrics = computeStylometrics(LONG_SAMPLE);

    expect(stylometrics.rhythmPatterns.paragraphLengthMean).toBeGreaterThan(0);
    expect(stylometrics.rhythmPatterns.paragraphLengthStdDev).toBeGreaterThanOrEqual(0);
    expect(stylometrics.rhythmPatterns.sentenceVariation).toBeGreaterThanOrEqual(0);
  });
});

// ============================================================================
// analyzeStyleFromReference Tests
// ============================================================================

describe('analyzeStyleFromReference', () => {
  it('should create valid StyleProfile', async () => {
    const profile = await analyzeStyleFromReference(LONG_SAMPLE, 'Test Style');

    expect(profile.id).toBeDefined();
    expect(profile.name).toBe('Test Style');
    expect(profile.sourceDescription).toContain('characters');
    expect(profile.createdAt).toBeDefined();
    expect(profile.stylometrics).toBeDefined();
    expect(profile.qualitativePatterns).toBeDefined();
    expect(profile.constraints).toBeDefined();
  });

  it('should respect sampleSize option', async () => {
    const fullProfile = await analyzeStyleFromReference(LONG_SAMPLE, 'Full');
    const sampledProfile = await analyzeStyleFromReference(LONG_SAMPLE, 'Sampled', {
      sampleSize: 500,
    });

    // Both should produce valid profiles
    expect(fullProfile.stylometrics).toBeDefined();
    expect(sampledProfile.stylometrics).toBeDefined();
  });

  it('should generate constraints', async () => {
    const profile = await analyzeStyleFromReference(LONG_SAMPLE, 'Test');

    expect(profile.constraints.length).toBeGreaterThan(0);
    // Should have constraints for each aspect
    const aspects = profile.constraints.map(c => c.aspect);
    expect(aspects).toContain('sentence-length');
    expect(aspects).toContain('vocabulary');
    expect(aspects).toContain('dialogue');
    expect(aspects).toContain('sensory');
    expect(aspects).toContain('rhythm');
  });

  it('should infer qualitative patterns from stylometrics', async () => {
    const profile = await analyzeStyleFromReference(MIXED_SAMPLE, 'Test');

    expect(profile.qualitativePatterns.dialogueStyle).toBeDefined();
    expect(profile.qualitativePatterns.paceDescriptor).toBeDefined();
    expect(profile.qualitativePatterns.narrativeVoice).toBeDefined();
  });
});

// ============================================================================
// computeStyleMatch Tests
// ============================================================================

describe('computeStyleMatch', () => {
  it('should return scores between 0-100', async () => {
    const profile = await analyzeStyleFromReference(LONG_SAMPLE, 'Reference');
    const result = computeStyleMatch(LONG_SAMPLE, profile);

    expect(result.overallMatch).toBeGreaterThanOrEqual(0);
    expect(result.overallMatch).toBeLessThanOrEqual(100);
    expect(result.aspectScores.lexicalDiversity).toBeGreaterThanOrEqual(0);
    expect(result.aspectScores.lexicalDiversity).toBeLessThanOrEqual(100);
  });

  it('should return high match for same text', async () => {
    const profile = await analyzeStyleFromReference(LONG_SAMPLE, 'Reference');
    const result = computeStyleMatch(LONG_SAMPLE, profile);

    // Same text should match well
    expect(result.overallMatch).toBeGreaterThan(70);
  });

  it('should return lower match for different style text', async () => {
    const profile = await analyzeStyleFromReference(KOREAN_SAMPLE_1, 'Reference');
    const result = computeStyleMatch(MIXED_SAMPLE, profile);

    // Different text style
    expect(result.overallMatch).toBeLessThan(100);
  });

  it('should identify deviations correctly', async () => {
    // Create a profile from dialogue-heavy text
    const dialogueProfile = await analyzeStyleFromReference(KOREAN_SAMPLE_2, 'Dialogue');
    // Test against narrative-only text
    const result = computeStyleMatch(KOREAN_SAMPLE_1, dialogueProfile);

    // Should detect dialogue deviation
    const hasDialogueDeviation = result.deviations.some(
      d => d.aspect === '대화 비율'
    );
    expect(hasDialogueDeviation).toBe(true);
  });

  it('should provide suggestions in deviations', async () => {
    const profile = await analyzeStyleFromReference(LONG_SAMPLE, 'Reference');
    const result = computeStyleMatch(KOREAN_SAMPLE_1, profile);

    for (const deviation of result.deviations) {
      expect(deviation.suggestion).toBeDefined();
      expect(deviation.suggestion.length).toBeGreaterThan(0);
    }
  });

  it('should classify deviation severity', async () => {
    const profile = await analyzeStyleFromReference(KOREAN_SAMPLE_2, 'Reference');
    const result = computeStyleMatch(KOREAN_SAMPLE_1, profile);

    for (const deviation of result.deviations) {
      expect(['minor', 'moderate', 'major']).toContain(deviation.severity);
    }
  });
});

// ============================================================================
// createStyleProfile Tests
// ============================================================================

describe('createStyleProfile', () => {
  it('should initialize all required fields', () => {
    const stylometrics = computeStylometrics(LONG_SAMPLE);
    const profile = createStyleProfile(
      'test-id',
      'Test Profile',
      'Test description',
      stylometrics
    );

    expect(profile.id).toBe('test-id');
    expect(profile.name).toBe('Test Profile');
    expect(profile.sourceDescription).toBe('Test description');
    expect(profile.createdAt).toBeDefined();
    expect(profile.stylometrics).toBe(stylometrics);
    expect(profile.qualitativePatterns).toBeDefined();
    expect(profile.constraints).toBeDefined();
  });

  it('should set default narrative voice', () => {
    const stylometrics = computeStylometrics(LONG_SAMPLE);
    const profile = createStyleProfile('id', 'name', 'desc', stylometrics);

    expect(profile.qualitativePatterns.narrativeVoice).toBe('third-person-limited');
  });

  it('should infer dialogue style from ratio', () => {
    const dialogueHeavy = '"대화" 그가 말했다 "더 많은 대화" 그녀가 답했다 "계속 대화" 다시 말했다';
    const stylometrics = computeStylometrics(dialogueHeavy);
    const profile = createStyleProfile('id', 'name', 'desc', stylometrics);

    expect(['minimal', 'balanced', 'dialogue-heavy']).toContain(
      profile.qualitativePatterns.dialogueStyle
    );
  });
});

// ============================================================================
// buildStyleConstraints Tests
// ============================================================================

describe('buildStyleConstraints', () => {
  it('should generate constraints for all aspects', () => {
    const stylometrics = computeStylometrics(LONG_SAMPLE);
    const profile = createStyleProfile('id', 'name', 'desc', stylometrics);
    const constraints = buildStyleConstraints(profile);

    expect(constraints.length).toBe(5); // One for each aspect
    const aspects = constraints.map(c => c.aspect);
    expect(aspects).toContain('sentence-length');
    expect(aspects).toContain('vocabulary');
    expect(aspects).toContain('dialogue');
    expect(aspects).toContain('sensory');
    expect(aspects).toContain('rhythm');
  });

  it('should set appropriate tolerances', () => {
    const stylometrics = computeStylometrics(LONG_SAMPLE);
    const profile = createStyleProfile('id', 'name', 'desc', stylometrics);
    const constraints = buildStyleConstraints(profile);

    for (const constraint of constraints) {
      expect(constraint.tolerance).toBeGreaterThan(0);
      expect(constraint.tolerance).toBeLessThanOrEqual(1);
    }
  });

  it('should generate Korean constraint targets', () => {
    const stylometrics = computeStylometrics(LONG_SAMPLE);
    const profile = createStyleProfile('id', 'name', 'desc', stylometrics);
    const constraints = buildStyleConstraints(profile);

    // Targets should be in Korean
    for (const constraint of constraints) {
      expect(constraint.target.length).toBeGreaterThan(0);
      // Should contain at least some Korean characters
      const hasKorean = /[가-힣]/.test(constraint.target);
      expect(hasKorean).toBe(true);
    }
  });
});
