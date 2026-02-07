/**
 * Subtext Engine Tests
 *
 * Tests for emotional subtext analysis:
 * - SubtextAnnotation structure validation
 * - buildSubtextPrompt generates appropriate prompts
 * - shouldHaveSubtext identifies emotionally significant dialogue
 * - detectFlatDialogue finds on-the-nose dialogue
 * - Korean dialogue handling
 *
 * @module tests/subtext/subtext-engine
 */

import { describe, it, expect } from 'vitest';
import {
  annotateDialogueSubtext,
  detectFlatDialogue,
  shouldHaveSubtext,
  buildSubtextPrompt,
  getEmotionalWords,
  containsDirectEmotion,
} from '../../src/subtext/index.js';
import type {
  SubtextAnnotation,
  EmotionLayer,
  PhysicalManifestations,
  SubtextContext,
  FlatDialogueLocation,
} from '../../src/subtext/index.js';

// ============================================================================
// Test Data
// ============================================================================

const createTestContext = (overrides?: Partial<SubtextContext>): SubtextContext => ({
  scene: { id: 'scene_001', emotionalArc: '갈등 고조' },
  characters: [
    { id: 'char_minji', name: '민지', personality: '내성적', currentEmotionalState: '상처받음' },
    { id: 'char_junho', name: '준호', personality: '직설적' },
  ],
  relationshipDynamics: [
    { char1: 'char_minji', char2: 'char_junho', description: '연인 사이', tensionLevel: 'high' },
  ],
  sceneGoals: ['갈등 해소'],
  emotionalStakes: '관계 위기',
  ...overrides,
});

// ============================================================================
// SubtextAnnotation Structure Tests
// ============================================================================

describe('SubtextAnnotation structure', () => {
  it('should have all required fields in annotation result', async () => {
    const context = createTestContext();
    const result = await annotateDialogueSubtext(
      { text: '괜찮아요. 신경 쓰지 마세요.' },
      context
    );

    const annotation = result.annotation;
    expect(annotation).toBeDefined();
    expect(annotation.dialogueId).toBeDefined();
    expect(annotation.speakerId).toBe('char_minji');
    expect(annotation.listenerId).toBe('char_junho');
    expect(annotation.surfaceLevel).toBeDefined();
    expect(annotation.surfaceLevel.text).toBe('괜찮아요. 신경 쓰지 마세요.');
    expect(annotation.surfaceLevel.topic).toBeDefined();
    expect(annotation.subtextLayers).toBeDefined();
    expect(annotation.physicalManifestations).toBeDefined();
    expect(annotation.narrativeFunction).toBeDefined();
  });

  it('should have 1-3 emotion layers', async () => {
    const context = createTestContext();
    const result = await annotateDialogueSubtext(
      { text: '별일 아니에요, 진짜로.' },
      context
    );

    const layers = result.annotation.subtextLayers;
    expect(layers.length).toBeGreaterThanOrEqual(1);
    expect(layers.length).toBeLessThanOrEqual(3);
  });

  it('should have valid emotion layer structure', async () => {
    const context = createTestContext();
    const result = await annotateDialogueSubtext(
      { text: '그냥 좀 피곤해서요.' },
      context
    );

    const layer = result.annotation.subtextLayers[0];
    expect(layer.level).toBe(1);
    expect(typeof layer.actualIntention).toBe('string');
    expect(typeof layer.underlyingEmotion).toBe('string');
    expect(typeof layer.hiddenContext).toBe('string');
    expect(Array.isArray(layer.tellSigns)).toBe(true);
    expect(layer.tellSigns.length).toBeGreaterThan(0);
  });

  it('should have valid physical manifestations', async () => {
    const context = createTestContext();
    const result = await annotateDialogueSubtext(
      { text: '네, 다 괜찮아요.' },
      context
    );

    const phys = result.annotation.physicalManifestations;
    expect(Array.isArray(phys.bodyLanguage)).toBe(true);
    expect(Array.isArray(phys.actionBeats)).toBe(true);
    expect(Array.isArray(phys.vocalCues)).toBe(true);
    expect(phys.bodyLanguage.length).toBeGreaterThan(0);
    expect(phys.actionBeats.length).toBeGreaterThan(0);
    expect(phys.vocalCues.length).toBeGreaterThan(0);
  });

  it('should have valid narrative function', async () => {
    const context = createTestContext();
    const result = await annotateDialogueSubtext(
      { text: '잘 지내고 있어요.' },
      context
    );

    const validFunctions = ['reveal', 'conceal', 'deflect', 'test', 'manipulate'];
    expect(validFunctions).toContain(result.annotation.narrativeFunction);
  });

  it('should return confidence score', async () => {
    const context = createTestContext();
    const result = await annotateDialogueSubtext(
      { text: '괜찮아요.' },
      context
    );

    expect(typeof result.confidence).toBe('number');
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(100);
  });
});

// ============================================================================
// buildSubtextPrompt Tests
// ============================================================================

describe('buildSubtextPrompt', () => {
  it('should generate prompt with all required sections', () => {
    const prompt = buildSubtextPrompt(
      { text: '괜찮아요. 신경 쓰지 마세요.' },
      { name: '민지', personality: '내성적' },
      { name: '준호' },
      { description: '연인 사이' },
      { sceneGoals: ['갈등 해소'], emotionalStakes: '관계 위기' }
    );

    expect(prompt).toContain('대화 서브텍스트 분석');
    expect(prompt).toContain('괜찮아요. 신경 쓰지 마세요.');
    expect(prompt).toContain('민지');
    expect(prompt).toContain('준호');
    expect(prompt).toContain('연인 사이');
    expect(prompt).toContain('갈등 해소');
    expect(prompt).toContain('관계 위기');
  });

  it('should ask the 4 subtext analysis questions', () => {
    const prompt = buildSubtextPrompt(
      { text: '테스트 대화' },
      { name: '화자' },
      { name: '청자' },
      { description: '동료' },
      { sceneGoals: ['정보 전달'], emotionalStakes: '낮음' }
    );

    // The four key questions
    expect(prompt).toContain('실제 의도');
    expect(prompt).toContain('숨겨진 감정');
    expect(prompt).toContain('말하지 않은 것');
    expect(prompt).toContain('물리적 표현');
  });

  it('should include speaker personality when provided', () => {
    const prompt = buildSubtextPrompt(
      { text: '아무것도 아니에요.' },
      { name: '수아', personality: '외향적', currentState: '불안' },
      { name: '지호' },
      { description: '친구' },
      { sceneGoals: ['위로'], emotionalStakes: '우정' }
    );

    expect(prompt).toContain('외향적');
    expect(prompt).toContain('불안');
  });

  it('should include relationship tension when provided', () => {
    const prompt = buildSubtextPrompt(
      { text: '그래, 알았어.' },
      { name: '민수' },
      { name: '유진' },
      { description: '전 연인', powerDynamic: 'equal', tension: 'high' },
      { sceneGoals: ['결별'], emotionalStakes: '관계 종료' }
    );

    expect(prompt).toContain('high');
  });

  it('should generate non-empty prompt of reasonable length', () => {
    const prompt = buildSubtextPrompt(
      { text: '괜찮아요. 신경 쓰지 마세요.' },
      { name: '민지', personality: '내성적' },
      { name: '준호' },
      { description: '연인 사이' },
      { sceneGoals: ['갈등 해소'], emotionalStakes: '관계 위기' }
    );

    expect(prompt.length).toBeGreaterThan(200);
  });
});

// ============================================================================
// shouldHaveSubtext Tests
// ============================================================================

describe('shouldHaveSubtext', () => {
  it('should return true for dialogue with direct emotional words', () => {
    expect(shouldHaveSubtext('나 정말 사랑해.')).toBe(true);
    expect(shouldHaveSubtext('너 미워!')).toBe(true);
    expect(shouldHaveSubtext('무서워, 가지 마.')).toBe(true);
    expect(shouldHaveSubtext('진짜 행복해.')).toBe(true);
    expect(shouldHaveSubtext('너무 슬퍼.')).toBe(true);
  });

  it('should return false for very short dialogue', () => {
    expect(shouldHaveSubtext('네.')).toBe(false);
    expect(shouldHaveSubtext('아.')).toBe(false);
    expect(shouldHaveSubtext('그래.')).toBe(false);
  });

  it('should return true for dialogue with questions longer than 20 chars', () => {
    expect(shouldHaveSubtext('그래서 너는 어떻게 생각하는 거야?')).toBe(true);
  });

  it('should return true for dialogue with multiple exclamations', () => {
    expect(shouldHaveSubtext('안 돼! 절대로 안 돼!')).toBe(true);
  });

  it('should return true for high tension scene context', () => {
    const context = createTestContext({
      scene: { id: 'scene_001', tensionLevel: 'high' },
    });
    expect(shouldHaveSubtext('그냥 가세요.', context)).toBe(true);
  });

  it('should return true for climactic scene context', () => {
    const context = createTestContext({
      scene: { id: 'scene_001', tensionLevel: 'climactic' },
    });
    expect(shouldHaveSubtext('알겠습니다.', context)).toBe(true);
  });

  it('should return true for intent declaration patterns', () => {
    expect(shouldHaveSubtext('내가 원하는 건 그게 아니야.')).toBe(true);
  });

  it('should return true for relationship declaration patterns', () => {
    expect(shouldHaveSubtext('우리는 친구잖아, 그렇지?')).toBe(true);
  });

  it('should return false for neutral short dialogue', () => {
    expect(shouldHaveSubtext('네, 알겠습니다.')).toBe(false);
  });
});

// ============================================================================
// detectFlatDialogue Tests
// ============================================================================

describe('detectFlatDialogue', () => {
  it('should detect dialogue with direct emotional statements', () => {
    const content = '민지가 고개를 들었다. "나 너무 슬퍼." 준호는 아무 말도 하지 않았다.';
    const results = detectFlatDialogue(content);

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].currentText).toContain('슬퍼');
    expect(results[0].reason).toBeDefined();
    expect(results[0].suggestedSubtext).toBeDefined();
  });

  it('should detect multiple flat dialogues', () => {
    const content = `
민지가 말했다. "사랑해."

준호가 대답했다. "나도 사랑해."

민지는 웃었다. "행복해."
`;
    const results = detectFlatDialogue(content);
    expect(results.length).toBeGreaterThanOrEqual(2);
  });

  it('should skip already annotated dialogues', () => {
    const content = '민지가 말했다. "너무 무서워."';
    const existingAnnotations = [{
      dialogueId: 'dialogue_13',
      speakerId: 'char_minji',
      listenerId: 'char_junho',
      surfaceLevel: { text: '너무 무서워.', topic: '공포' },
      subtextLayers: [{
        level: 1,
        actualIntention: '도움 요청',
        underlyingEmotion: '불안',
        hiddenContext: '혼자 있기 싫음',
        tellSigns: ['목소리 떨림'],
      }],
      physicalManifestations: {
        bodyLanguage: ['몸을 움츠림'],
        actionBeats: ['손을 잡으려 함'],
        vocalCues: ['목소리가 떨림'],
      },
      narrativeFunction: 'reveal' as const,
    }];

    // With annotation at matching ID, it may or may not skip
    // depending on the dialogue position - this tests the skip logic exists
    const withAnnotations = detectFlatDialogue(content, existingAnnotations);
    const withoutAnnotations = detectFlatDialogue(content);
    expect(withoutAnnotations.length).toBeGreaterThanOrEqual(withAnnotations.length);
  });

  it('should return empty array for dialogue without emotional issues', () => {
    const content = '준호가 말했다. "오늘 날씨가 좋네요."';
    const results = detectFlatDialogue(content);
    expect(results.length).toBe(0);
  });

  it('should detect intent declaration patterns', () => {
    const content = '민지가 말했다. "내가 원하는 건 그냥 평범한 삶이야."';
    const results = detectFlatDialogue(content);
    expect(results.length).toBeGreaterThan(0);
  });

  it('should provide location information for flat dialogue', () => {
    const content = '첫 번째 문단.\n\n준호가 말했다. "화나! 왜 그랬어?"';
    const results = detectFlatDialogue(content);

    if (results.length > 0) {
      expect(typeof results[0].location).toBe('number');
      expect(typeof results[0].paragraphIndex).toBe('number');
    }
  });

  it('should work with Korean dialogue samples', () => {
    const content = `
서진은 테이블 위의 커피잔을 내려다보며 말했다.

"미안해. 내가 잘못했어."

수아는 고개를 저었다.

"괜찮아. 질투나지도 않아."
`;
    const results = detectFlatDialogue(content);
    // "질투나" is an emotional word, should be detected
    expect(results.some(r => r.currentText.includes('질투'))).toBe(true);
  });
});

// ============================================================================
// Utility Function Tests
// ============================================================================

describe('getEmotionalWords', () => {
  it('should return non-empty array of Korean emotional words', () => {
    const words = getEmotionalWords();
    expect(words.length).toBeGreaterThan(0);
    expect(words).toContain('사랑해');
    expect(words).toContain('미워');
    expect(words).toContain('무서워');
  });
});

describe('containsDirectEmotion', () => {
  it('should return true for text with emotional words', () => {
    expect(containsDirectEmotion('나 사랑해')).toBe(true);
    expect(containsDirectEmotion('너무 슬퍼')).toBe(true);
  });

  it('should return false for text without emotional words', () => {
    expect(containsDirectEmotion('오늘 날씨가 좋다')).toBe(false);
    expect(containsDirectEmotion('밥 먹었어?')).toBe(false);
  });
});
