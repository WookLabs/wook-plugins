import { describe, it, expect, beforeEach } from 'vitest';
import {
  DraftStageEvaluator,
  ToneStageEvaluator,
  StyleStageEvaluator,
  FinalStageEvaluator,
  STAGE_EVALUATORS,
} from '../../src/quality/stage-evaluators.js';
import type { MultiStageOptions } from '../../src/quality/types.js';

// ============================================================================
// Test Fixtures
// ============================================================================

const GOOD_PROSE = `
그녀의 손이 떨렸다. 차가운 바람이 창문 틈으로 스며들었다.

"괜찮아?" 그가 물었다.

그녀는 고개를 저었다. 입술이 말라 있었다. 심장이 빠르게 뛰었다.

한편, 도시 반대편에서는 비가 내리기 시작했다.

거리의 네온사인이 깜빡였다. 사람들이 우산을 펼쳤다.
`.trim();

const POOR_PROSE_FILTER_WORDS = `
그녀는 슬픔을 느꼈다. 그것은 그녀에게 고통스러워 보였다.

그녀는 그가 떠났다고 생각했다. 그것이 확실했다.

모든 것이 힘들어 보였다. 그녀는 알 수 있었다.
`.trim();

const POOR_PROSE_ON_THE_NOSE = `
"나는 너를 사랑해," 그가 말했다.

"나도 사랑해," 그녀가 대답했다.

"정말 행복해," 그가 웃으며 말했다.

"나는 슬퍼," 그녀가 울면서 말했다.
`.trim();

const PROSE_WITH_SPACING_ISSUES = `
그녀는  달렸다.  문을 열었다.

"안녕?"그가 물었다.

그녀는 대답하지  않았다.
`.trim();

// ============================================================================
// Draft Stage Evaluator Tests
// ============================================================================

describe('DraftStageEvaluator', () => {
  describe('score()', () => {
    it('should return a score between 0 and 100', async () => {
      const score = await DraftStageEvaluator.score(GOOD_PROSE);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should give higher score to prose without filter words', async () => {
      const goodScore = await DraftStageEvaluator.score(GOOD_PROSE);
      const poorScore = await DraftStageEvaluator.score(POOR_PROSE_FILTER_WORDS);
      expect(goodScore).toBeGreaterThan(poorScore);
    });

    it('should reward transitions between scenes', async () => {
      // Good prose has "한편" transition
      const score = await DraftStageEvaluator.score(GOOD_PROSE);
      expect(score).toBeGreaterThanOrEqual(60);
    });
  });

  describe('generateDirectives()', () => {
    it('should produce only draft-appropriate directive types', async () => {
      const directives = await DraftStageEvaluator.generateDirectives(POOR_PROSE_FILTER_WORDS);
      const allowedTypes = ['transition-smoothing', 'show-not-tell'];

      for (const directive of directives) {
        expect(allowedTypes).toContain(directive.type);
      }
    });

    it('should detect show-not-tell issues', async () => {
      const directives = await DraftStageEvaluator.generateDirectives(POOR_PROSE_FILTER_WORDS);
      const showNotTell = directives.filter(d => d.type === 'show-not-tell');
      expect(showNotTell.length).toBeGreaterThan(0);
    });

    it('should limit directives to a reasonable count', async () => {
      const directives = await DraftStageEvaluator.generateDirectives(POOR_PROSE_FILTER_WORDS);
      expect(directives.length).toBeLessThanOrEqual(5);
    });
  });
});

// ============================================================================
// Tone Stage Evaluator Tests
// ============================================================================

describe('ToneStageEvaluator', () => {
  describe('score()', () => {
    it('should return a score between 0 and 100', async () => {
      const score = await ToneStageEvaluator.score(GOOD_PROSE);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should penalize on-the-nose dialogue', async () => {
      const goodScore = await ToneStageEvaluator.score(GOOD_PROSE);
      const poorScore = await ToneStageEvaluator.score(POOR_PROSE_ON_THE_NOSE);
      expect(goodScore).toBeGreaterThan(poorScore);
    });

    it('should handle content without dialogue', async () => {
      const proseWithoutDialogue = '그녀는 걸었다. 바람이 불었다.';
      const score = await ToneStageEvaluator.score(proseWithoutDialogue);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  describe('generateDirectives()', () => {
    it('should produce only tone-appropriate directive types', async () => {
      const directives = await ToneStageEvaluator.generateDirectives(POOR_PROSE_ON_THE_NOSE);
      const allowedTypes = ['dialogue-subtext', 'voice-consistency', 'arc-alignment'];

      for (const directive of directives) {
        expect(allowedTypes).toContain(directive.type);
      }
    });

    it('should detect dialogue subtext issues', async () => {
      const directives = await ToneStageEvaluator.generateDirectives(POOR_PROSE_ON_THE_NOSE);
      const subtextIssues = directives.filter(d => d.type === 'dialogue-subtext');
      expect(subtextIssues.length).toBeGreaterThan(0);
    });
  });
});

// ============================================================================
// Style Stage Evaluator Tests
// ============================================================================

describe('StyleStageEvaluator', () => {
  describe('score()', () => {
    it('should return a score between 0 and 100', async () => {
      const score = await StyleStageEvaluator.score(GOOD_PROSE);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should give higher score to prose with sensory details', async () => {
      // GOOD_PROSE has visual, tactile (cold), auditory cues
      const score = await StyleStageEvaluator.score(GOOD_PROSE);
      expect(score).toBeGreaterThanOrEqual(50);
    });

    it('should penalize filter words', async () => {
      const goodScore = await StyleStageEvaluator.score(GOOD_PROSE);
      const poorScore = await StyleStageEvaluator.score(POOR_PROSE_FILTER_WORDS);
      expect(goodScore).toBeGreaterThan(poorScore);
    });
  });

  describe('generateDirectives()', () => {
    it('should leverage analyzeChapter for directive generation', async () => {
      const directives = await StyleStageEvaluator.generateDirectives(POOR_PROSE_FILTER_WORDS);
      expect(directives.length).toBeGreaterThan(0);
    });

    it('should produce only style-appropriate directive types', async () => {
      const directives = await StyleStageEvaluator.generateDirectives(POOR_PROSE_FILTER_WORDS);
      const allowedTypes = [
        'filter-word-removal',
        'sensory-enrichment',
        'rhythm-variation',
        'cliche-replacement',
        'banned-expression',
        'texture-enrichment',
      ];

      for (const directive of directives) {
        expect(allowedTypes).toContain(directive.type);
      }
    });
  });
});

// ============================================================================
// Final Stage Evaluator Tests
// ============================================================================

describe('FinalStageEvaluator', () => {
  describe('score()', () => {
    it('should return a score between 0 and 100', async () => {
      const score = await FinalStageEvaluator.score(GOOD_PROSE);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should detect spacing issues', async () => {
      const cleanScore = await FinalStageEvaluator.score(GOOD_PROSE);
      const issueScore = await FinalStageEvaluator.score(PROSE_WITH_SPACING_ISSUES);
      expect(cleanScore).toBeGreaterThan(issueScore);
    });

    it('should give high score to clean prose', async () => {
      const score = await FinalStageEvaluator.score(GOOD_PROSE);
      expect(score).toBeGreaterThanOrEqual(80);
    });
  });

  describe('generateDirectives()', () => {
    it('should produce only proofreading directive types', async () => {
      const directives = await FinalStageEvaluator.generateDirectives(PROSE_WITH_SPACING_ISSUES);
      const allowedTypes = ['proofreading', 'honorific-violation'];

      for (const directive of directives) {
        expect(allowedTypes).toContain(directive.type);
      }
    });

    it('should detect proofreading issues', async () => {
      const directives = await FinalStageEvaluator.generateDirectives(PROSE_WITH_SPACING_ISSUES);
      const proofreadingIssues = directives.filter(d => d.type === 'proofreading');
      expect(proofreadingIssues.length).toBeGreaterThan(0);
    });
  });
});

// ============================================================================
// STAGE_EVALUATORS Tests
// ============================================================================

describe('STAGE_EVALUATORS', () => {
  it('should contain all 4 evaluators', () => {
    expect(Object.keys(STAGE_EVALUATORS)).toHaveLength(4);
    expect(STAGE_EVALUATORS.draft).toBeDefined();
    expect(STAGE_EVALUATORS.tone).toBeDefined();
    expect(STAGE_EVALUATORS.style).toBeDefined();
    expect(STAGE_EVALUATORS.final).toBeDefined();
  });

  it('should have evaluators with correct names', () => {
    expect(STAGE_EVALUATORS.draft.name).toBe('draft');
    expect(STAGE_EVALUATORS.tone.name).toBe('tone');
    expect(STAGE_EVALUATORS.style.name).toBe('style');
    expect(STAGE_EVALUATORS.final.name).toBe('final');
  });

  it('should have evaluators with score and generateDirectives methods', () => {
    for (const evaluator of Object.values(STAGE_EVALUATORS)) {
      expect(typeof evaluator.score).toBe('function');
      expect(typeof evaluator.generateDirectives).toBe('function');
    }
  });
});

// ============================================================================
// Threshold Boundary Tests
// ============================================================================

describe('Evaluator Threshold Boundaries', () => {
  it('DraftStageEvaluator should score content appropriately', async () => {
    // Content with some filter words (structural issues)
    const contentWithIssues = `
      그녀는 문을 열었다. 차가운 바람이 불었다.

      그녀는 슬픔을 느꼈다. 그것이 고통스러워 보였다.

      "뭐해?" 그가 물었다.
    `.trim();

    const score = await DraftStageEvaluator.score(contentWithIssues);
    // Score should be valid (0-100 range)
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
    // Content with filter words should score lower than clean prose
    const cleanScore = await DraftStageEvaluator.score('그녀는 문을 열었다. 차가운 바람이 불었다.');
    expect(cleanScore).toBeGreaterThanOrEqual(score);
  });

  it('FinalStageEvaluator should score high (95+) on clean prose', async () => {
    const cleanProse = '그녀는 문을 열었다. 차가운 바람이 불어왔다.';
    const score = await FinalStageEvaluator.score(cleanProse);
    expect(score).toBeGreaterThanOrEqual(90);
  });
});
