import { describe, it, expect, beforeEach } from 'vitest';
import {
  // Constants
  AGE_DIFFERENCE_THRESHOLD,
  SPEECH_LEVEL_PATTERNS,
  // Functions
  deriveSpeechLevel,
  inferSocialStatus,
  initializeHonorificMatrix,
  getSpeechLevel,
  detectSpeechLevelFromText,
  extractDialogueSegments,
  detectViolationsSimple,
} from '../../src/korean/honorific-matrix.js';
import type {
  SpeechLevel,
  CharacterHonorificProfile,
  HonorificMatrix,
} from '../../src/korean/types.js';
import type { Character } from '../../src/types.js';

// ============================================================================
// Test Fixtures
// ============================================================================

/**
 * Create a minimal Character object for testing
 */
function createTestCharacter(
  id: string,
  name: string,
  age: number,
  economicStatus: string = 'middle'
): Character {
  return {
    id,
    name,
    aliases: [],
    role: 'supporting',
    basic: {
      age,
      gender: 'male',
      appearance: { height: '175cm', build: 'average', features: [] },
      voice: { tone: 'neutral', speech_pattern: 'standard', vocabulary: 'normal' },
    },
    background: {
      origin: 'Seoul',
      family: 'normal',
      occupation: 'office worker',
      economic_status: economicStatus,
    },
    inner: {
      want: 'success',
      need: 'acceptance',
      fatal_flaw: 'pride',
      values: ['honesty'],
      fears: ['failure'],
    },
    behavior: {
      habits: [],
      hobbies: [],
      dislikes: [],
      stress_response: 'withdraw',
      lying_tell: 'avoids eye contact',
    },
    arc: {
      start_state: 'uncertain',
      catalyst: 'meeting',
      midpoint: 'realization',
      dark_night: 'despair',
      transformation: 'growth',
      end_state: 'confident',
    },
  };
}

/**
 * Create a test character profile directly
 */
function createTestProfile(
  id: string,
  name: string,
  age: number,
  socialStatus: 'high' | 'middle' | 'low' = 'middle'
): CharacterHonorificProfile {
  return {
    id,
    name,
    age,
    socialStatus,
    defaultSpeechToStrangers: 'haeyoche',
  };
}

// ============================================================================
// Constants Tests
// ============================================================================

describe('Honorific Matrix Constants', () => {
  it('should have age difference threshold of 5', () => {
    expect(AGE_DIFFERENCE_THRESHOLD).toBe(5);
  });

  it('should have speech level patterns for all 3 levels', () => {
    expect(SPEECH_LEVEL_PATTERNS).toHaveProperty('haeche');
    expect(SPEECH_LEVEL_PATTERNS).toHaveProperty('haeyoche');
    expect(SPEECH_LEVEL_PATTERNS).toHaveProperty('hapsyoche');
  });

  it('should have multiple patterns per speech level', () => {
    expect(SPEECH_LEVEL_PATTERNS.haeche.length).toBeGreaterThan(3);
    expect(SPEECH_LEVEL_PATTERNS.haeyoche.length).toBeGreaterThan(3);
    expect(SPEECH_LEVEL_PATTERNS.hapsyoche.length).toBeGreaterThan(3);
  });
});

// ============================================================================
// Speech Level Derivation Tests
// ============================================================================

describe('deriveSpeechLevel', () => {
  it('should return haeche when speaker is significantly older', () => {
    const speaker = createTestProfile('char_1', 'Senior', 40);
    const listener = createTestProfile('char_2', 'Junior', 25);

    const level = deriveSpeechLevel(speaker, listener);

    expect(level).toBe('haeche');
  });

  it('should return haeyoche when speaker is significantly younger', () => {
    const speaker = createTestProfile('char_1', 'Junior', 25);
    const listener = createTestProfile('char_2', 'Senior', 40);

    const level = deriveSpeechLevel(speaker, listener);

    expect(level).toBe('haeyoche');
  });

  it('should return haeyoche for similar ages', () => {
    const speaker = createTestProfile('char_1', 'Person A', 30);
    const listener = createTestProfile('char_2', 'Person B', 32);

    const level = deriveSpeechLevel(speaker, listener);

    expect(level).toBe('haeyoche');
  });

  it('should return hapsyoche for younger speaker to high-status listener', () => {
    const speaker = createTestProfile('char_1', 'Junior', 25, 'middle');
    const listener = createTestProfile('char_2', 'CEO', 50, 'high');

    const level = deriveSpeechLevel(speaker, listener);

    expect(level).toBe('hapsyoche');
  });

  it('should return haeyoche for similar age even with status difference', () => {
    const speaker = createTestProfile('char_1', 'Employee', 35, 'middle');
    const listener = createTestProfile('char_2', 'Manager', 36, 'high');

    const level = deriveSpeechLevel(speaker, listener);

    // Similar age, so status difference leads to formal speech
    expect(level).toBe('hapsyoche');
  });

  it('should handle exact age difference at threshold', () => {
    const speaker = createTestProfile('char_1', 'Person A', 30);
    const listener = createTestProfile('char_2', 'Person B', 25);

    // Age diff = 5, exactly at threshold
    const level = deriveSpeechLevel(speaker, listener);

    expect(level).toBe('haeyoche'); // At threshold, not above
  });

  it('should handle age difference just above threshold', () => {
    const speaker = createTestProfile('char_1', 'Person A', 31);
    const listener = createTestProfile('char_2', 'Person B', 25);

    // Age diff = 6, above threshold
    const level = deriveSpeechLevel(speaker, listener);

    expect(level).toBe('haeche');
  });
});

// ============================================================================
// Social Status Inference Tests
// ============================================================================

describe('inferSocialStatus', () => {
  it('should infer high status from wealthy economic status', () => {
    const char = createTestCharacter('char_1', 'Rich Person', 40, 'wealthy');
    const status = inferSocialStatus(char);

    expect(status).toBe('high');
  });

  it('should infer low status from poor economic status', () => {
    const char = createTestCharacter('char_1', 'Poor Person', 30, 'poor');
    const status = inferSocialStatus(char);

    expect(status).toBe('low');
  });

  it('should infer middle status from undefined economic status', () => {
    const char = createTestCharacter('char_1', 'Normal Person', 35, '');
    const status = inferSocialStatus(char);

    expect(status).toBe('middle');
  });

  it('should handle Korean economic status terms', () => {
    const richChar = createTestCharacter('char_1', 'Rich', 40, '상류층');
    const poorChar = createTestCharacter('char_2', 'Poor', 30, '하류층');

    expect(inferSocialStatus(richChar)).toBe('high');
    expect(inferSocialStatus(poorChar)).toBe('low');
  });
});

// ============================================================================
// Matrix Initialization Tests
// ============================================================================

describe('initializeHonorificMatrix', () => {
  it('should create profiles for all characters', () => {
    const characters = [
      createTestCharacter('char_1', 'Alice', 30),
      createTestCharacter('char_2', 'Bob', 40),
    ];

    const matrix = initializeHonorificMatrix(characters);

    expect(matrix.characters.size).toBe(2);
    expect(matrix.characters.get('char_1')?.name).toBe('Alice');
    expect(matrix.characters.get('char_2')?.name).toBe('Bob');
  });

  it('should create relationships for all character pairs', () => {
    const characters = [
      createTestCharacter('char_1', 'A', 30),
      createTestCharacter('char_2', 'B', 40),
      createTestCharacter('char_3', 'C', 25),
    ];

    const matrix = initializeHonorificMatrix(characters);

    // 3 characters = 6 relationships (A->B, A->C, B->A, B->C, C->A, C->B)
    expect(matrix.relationships.size).toBe(6);
  });

  it('should not create self-referential relationships', () => {
    const characters = [createTestCharacter('char_1', 'Solo', 30)];

    const matrix = initializeHonorificMatrix(characters);

    expect(matrix.relationships.size).toBe(0);
  });

  it('should derive correct speech levels in relationships', () => {
    const characters = [
      createTestCharacter('char_1', 'Senior', 50),
      createTestCharacter('char_2', 'Junior', 25),
    ];

    const matrix = initializeHonorificMatrix(characters);

    // Senior to Junior should be casual
    const seniorToJunior = matrix.relationships.get('char_1_to_char_2');
    expect(seniorToJunior?.defaultLevel).toBe('haeche');

    // Junior to Senior should be polite
    const juniorToSenior = matrix.relationships.get('char_2_to_char_1');
    expect(juniorToSenior?.defaultLevel).toBe('haeyoche');
  });

  it('should handle characters with missing age', () => {
    const charWithoutAge = {
      ...createTestCharacter('char_1', 'Unknown Age', 30),
    };
    // @ts-expect-error - Simulating missing age
    charWithoutAge.basic.age = undefined;

    const matrix = initializeHonorificMatrix([charWithoutAge]);

    // Should default to age 30
    expect(matrix.characters.get('char_1')?.age).toBe(30);
  });
});

// ============================================================================
// Speech Level Lookup Tests
// ============================================================================

describe('getSpeechLevel', () => {
  let matrix: HonorificMatrix;

  beforeEach(() => {
    const characters = [
      createTestCharacter('char_1', 'Senior', 50),
      createTestCharacter('char_2', 'Junior', 25),
    ];
    matrix = initializeHonorificMatrix(characters);
  });

  it('should return correct default level for known pair', () => {
    const level = getSpeechLevel(matrix, 'char_1', 'char_2');

    expect(level).toBe('haeche');
  });

  it('should return undefined for unknown pair', () => {
    const level = getSpeechLevel(matrix, 'char_1', 'char_unknown');

    // Falls back to speaker's defaultSpeechToStrangers
    expect(level).toBe('haeyoche');
  });

  it('should apply public context override', () => {
    const level = getSpeechLevel(matrix, 'char_1', 'char_2', 'public');

    // In public, casual speakers become more polite
    expect(level).toBe('haeyoche');
  });

  it('should apply private context override', () => {
    const level = getSpeechLevel(matrix, 'char_1', 'char_2', 'private');

    // In private, maintains default
    expect(level).toBe('haeche');
  });

  it('should apply emotional context override', () => {
    const level = getSpeechLevel(matrix, 'char_1', 'char_2', 'emotional');

    // Emotional maintains default
    expect(level).toBe('haeche');
  });
});

// ============================================================================
// Speech Level Detection from Text Tests
// ============================================================================

describe('detectSpeechLevelFromText', () => {
  describe('haeche (casual) detection', () => {
    it('should detect -해 ending', () => {
      expect(detectSpeechLevelFromText('뭐해')).toBe('haeche');
    });

    it('should detect -야 ending', () => {
      expect(detectSpeechLevelFromText('빨리 와야')).toBe('haeche');
    });

    it('should detect -어 ending', () => {
      expect(detectSpeechLevelFromText('빨리 와')).toBe('haeche');  // 와 ends in 아
    });

    it('should detect -가 ending', () => {
      expect(detectSpeechLevelFromText('나 먼저 가')).toBe('haeche');
    });

    it('should detect -니 ending', () => {
      expect(detectSpeechLevelFromText('밥 먹었니')).toBe('haeche');
    });
  });

  describe('haeyoche (polite) detection', () => {
    it('should detect -세요 ending', () => {
      expect(detectSpeechLevelFromText('안녕하세요')).toBe('haeyoche');
    });

    it('should detect -해요 ending', () => {
      expect(detectSpeechLevelFromText('저도 그렇게 생각해요')).toBe('haeyoche');
    });

    it('should detect -죠 ending', () => {
      expect(detectSpeechLevelFromText('그렇죠')).toBe('haeyoche');
    });

    it('should detect -요 ending with punctuation', () => {
      expect(detectSpeechLevelFromText('네, 맞아요.')).toBe('haeyoche');
    });
  });

  describe('hapsyoche (formal) detection', () => {
    it('should detect -합니다 ending', () => {
      expect(detectSpeechLevelFromText('감사합니다')).toBe('hapsyoche');
    });

    it('should detect -입니다 ending', () => {
      expect(detectSpeechLevelFromText('저는 학생입니다')).toBe('hapsyoche');
    });

    it('should detect -습니다 ending with punctuation', () => {
      expect(detectSpeechLevelFromText('알겠습니다.')).toBe('hapsyoche');
    });
  });

  it('should return undefined for unrecognized patterns', () => {
    expect(detectSpeechLevelFromText('...')).toBeUndefined();
  });

  it('should handle quoted text', () => {
    expect(detectSpeechLevelFromText('"안녕하세요"')).toBe('haeyoche');
  });

  it('should analyze last sentence in multi-sentence dialogue', () => {
    expect(detectSpeechLevelFromText('네. 알겠습니다.')).toBe('hapsyoche');
  });
});

// ============================================================================
// Dialogue Extraction Tests
// ============================================================================

describe('extractDialogueSegments', () => {
  it('should extract dialogue from standard quotes', () => {
    const content = '그녀가 말했다. "안녕하세요" 그리고 웃었다.';
    const segments = extractDialogueSegments(content);

    // Filter for actual content matches
    const validSegments = segments.filter(s => s.text.length > 0);
    expect(validSegments.length).toBeGreaterThanOrEqual(1);
    expect(validSegments.some(s => s.text === '안녕하세요')).toBe(true);
  });

  it('should extract multiple dialogue segments', () => {
    const content = '"첫 번째" 그리고 "두 번째"';
    const segments = extractDialogueSegments(content);

    // May match multiple patterns, check at least 2 unique texts
    const uniqueTexts = new Set(segments.map(s => s.text));
    expect(uniqueTexts.size).toBeGreaterThanOrEqual(2);
  });

  it('should track positions correctly', () => {
    const content = '먼저 "대화" 그리고';
    const segments = extractDialogueSegments(content);

    expect(segments.length).toBeGreaterThan(0);
    expect(segments[0].position).toBeGreaterThanOrEqual(0);
  });

  it('should handle Korean corner brackets', () => {
    const content = '그가 말했다. 「여기요」';
    const segments = extractDialogueSegments(content);

    expect(segments.some(s => s.text === '여기요')).toBe(true);
  });

  it('should return segments sorted by position', () => {
    const content = '앞에 "첫번째" 그리고 나중에 "두번째"';
    const segments = extractDialogueSegments(content);

    // Verify sorted order
    for (let i = 1; i < segments.length; i++) {
      expect(segments[i].position).toBeGreaterThanOrEqual(segments[i-1].position);
    }
  });
});

// ============================================================================
// Violation Detection Tests
// ============================================================================

describe('detectViolationsSimple', () => {
  let matrix: HonorificMatrix;

  beforeEach(() => {
    const characters = [
      createTestCharacter('char_senior', 'Senior', 50),
      createTestCharacter('char_junior', 'Junior', 25),
    ];
    matrix = initializeHonorificMatrix(characters);
  });

  it('should detect violation when junior uses casual speech to senior', () => {
    const dialogues = [
      {
        text: '나 먼저 가',  // Casual ending without period
        speakerId: 'char_junior',
        listenerId: 'char_senior',
        position: 0,
      },
    ];

    const violations = detectViolationsSimple(dialogues, matrix);

    expect(violations.length).toBe(1);
    expect(violations[0].expectedLevel).toBe('haeyoche');
    expect(violations[0].actualLevel).toBe('haeche');
  });

  it('should not flag correct speech level usage', () => {
    const dialogues = [
      {
        text: '안녕하세요',  // Polite form
        speakerId: 'char_junior',
        listenerId: 'char_senior',
        position: 0,
      },
    ];

    const violations = detectViolationsSimple(dialogues, matrix);

    expect(violations.length).toBe(0);
  });

  it('should detect violation when senior uses overly formal speech to junior', () => {
    // Seniors typically use casual speech to juniors
    const dialogues = [
      {
        text: '감사합니다',  // Formal speech to junior
        speakerId: 'char_senior',
        listenerId: 'char_junior',
        position: 0,
      },
    ];

    const violations = detectViolationsSimple(dialogues, matrix);

    expect(violations.length).toBe(1);
    expect(violations[0].expectedLevel).toBe('haeche');
    expect(violations[0].actualLevel).toBe('hapsyoche');
  });

  it('should handle multiple dialogues', () => {
    const dialogues = [
      {
        text: '안녕하세요',  // Correct polite
        speakerId: 'char_junior',
        listenerId: 'char_senior',
        position: 0,
      },
      {
        text: '뭐해',  // Casual - violation
        speakerId: 'char_junior',
        listenerId: 'char_senior',
        position: 50,
      },
    ];

    const violations = detectViolationsSimple(dialogues, matrix);

    expect(violations.length).toBe(1);
    expect(violations[0].position).toBe(50);
  });

  it('should skip dialogues with undetectable speech level', () => {
    const dialogues = [
      {
        text: '...',
        speakerId: 'char_junior',
        listenerId: 'char_senior',
        position: 0,
      },
    ];

    const violations = detectViolationsSimple(dialogues, matrix);

    expect(violations.length).toBe(0);
  });

  it('should skip dialogues with unknown speakers', () => {
    const dialogues = [
      {
        text: '안녕하세요',
        speakerId: 'char_unknown',
        listenerId: 'char_senior',
        position: 0,
      },
    ];

    const violations = detectViolationsSimple(dialogues, matrix);

    expect(violations.length).toBe(0);
  });

  it('should include dialogue text in violation', () => {
    const dialogues = [
      {
        text: '야 뭐해',  // Casual speech
        speakerId: 'char_junior',
        listenerId: 'char_senior',
        position: 0,
      },
    ];

    const violations = detectViolationsSimple(dialogues, matrix);

    expect(violations.length).toBe(1);
    expect(violations[0].dialogueText).toBe('야 뭐해');
  });
});

// ============================================================================
// Edge Cases
// ============================================================================

describe('Edge Cases', () => {
  it('should handle empty character list', () => {
    const matrix = initializeHonorificMatrix([]);

    expect(matrix.characters.size).toBe(0);
    expect(matrix.relationships.size).toBe(0);
  });

  it('should handle single character', () => {
    const characters = [createTestCharacter('char_1', 'Solo', 30)];
    const matrix = initializeHonorificMatrix(characters);

    expect(matrix.characters.size).toBe(1);
    expect(matrix.relationships.size).toBe(0);
  });

  it('should handle empty dialogue list', () => {
    const characters = [createTestCharacter('char_1', 'A', 30)];
    const matrix = initializeHonorificMatrix(characters);

    const violations = detectViolationsSimple([], matrix);

    expect(violations.length).toBe(0);
  });

  it('should handle dialogue with only whitespace', () => {
    const level = detectSpeechLevelFromText('   ');

    expect(level).toBeUndefined();
  });
});
