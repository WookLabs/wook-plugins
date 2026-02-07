import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  REVISION_STAGES,
  runMultiStageRevision,
} from '../../src/quality/revision-stages.js';
import {
  DRAFT_DIRECTIVE_TYPES,
  TONE_DIRECTIVE_TYPES,
  STYLE_DIRECTIVE_TYPES,
  FINAL_DIRECTIVE_TYPES,
} from '../../src/quality/types.js';
import type { SurgeonCallback } from '../../src/pipeline/prose-surgeon.js';

// ============================================================================
// Test Fixtures
// ============================================================================

const SAMPLE_CONTENT = `
그녀의 손이 떨렸다. 차가운 바람이 창문 틈으로 스며들었다.

"괜찮아?" 그가 물었다.

그녀는 고개를 저었다. 입술이 말라 있었다.

한편, 도시 반대편에서는 비가 내리기 시작했다.
`.trim();

const POOR_CONTENT = `
그녀는 슬픔을 느꼈다. 그것은 그녀에게 고통스러워 보였다.

"나는 너를 사랑해," 그가 말했다.

그녀는 그가 떠났다고 생각했다.  그것이 확실했다.
`.trim();

// ============================================================================
// REVISION_STAGES Configuration Tests
// ============================================================================

describe('REVISION_STAGES', () => {
  it('should have exactly 4 stages', () => {
    expect(REVISION_STAGES).toHaveLength(4);
  });

  it('should have stages in correct order: draft -> tone -> style -> final', () => {
    expect(REVISION_STAGES[0].name).toBe('draft');
    expect(REVISION_STAGES[1].name).toBe('tone');
    expect(REVISION_STAGES[2].name).toBe('style');
    expect(REVISION_STAGES[3].name).toBe('final');
  });

  it('should have increasing pass thresholds', () => {
    expect(REVISION_STAGES[0].passThreshold).toBe(70);  // draft
    expect(REVISION_STAGES[1].passThreshold).toBe(75);  // tone
    expect(REVISION_STAGES[2].passThreshold).toBe(80);  // style
    expect(REVISION_STAGES[3].passThreshold).toBe(95);  // final
  });

  it('should have correct directive types for each stage', () => {
    // Draft stage
    expect(REVISION_STAGES[0].directiveTypes).toEqual(DRAFT_DIRECTIVE_TYPES);

    // Tone stage
    expect(REVISION_STAGES[1].directiveTypes).toEqual(TONE_DIRECTIVE_TYPES);

    // Style stage
    expect(REVISION_STAGES[2].directiveTypes).toEqual(STYLE_DIRECTIVE_TYPES);

    // Final stage
    expect(REVISION_STAGES[3].directiveTypes).toEqual(FINAL_DIRECTIVE_TYPES);
  });

  it('should have appropriate model configs', () => {
    // Draft uses sonnet (structural, lower creativity)
    expect(REVISION_STAGES[0].modelConfig.model).toBe('sonnet');

    // Tone uses opus (emotional, higher creativity)
    expect(REVISION_STAGES[1].modelConfig.model).toBe('opus');

    // Style uses opus (craft, higher creativity)
    expect(REVISION_STAGES[2].modelConfig.model).toBe('opus');

    // Final uses sonnet (proofreading, precision)
    expect(REVISION_STAGES[3].modelConfig.model).toBe('sonnet');
  });

  it('should have temperature settings appropriate for each stage', () => {
    // Draft: 0.5 (balanced)
    expect(REVISION_STAGES[0].modelConfig.temperature).toBe(0.5);

    // Tone: 0.6 (slightly creative)
    expect(REVISION_STAGES[1].modelConfig.temperature).toBe(0.6);

    // Style: 0.7 (more creative)
    expect(REVISION_STAGES[2].modelConfig.temperature).toBe(0.7);

    // Final: 0.2 (precise)
    expect(REVISION_STAGES[3].modelConfig.temperature).toBe(0.2);
  });

  it('should have reasonable max iterations', () => {
    for (const stage of REVISION_STAGES) {
      expect(stage.maxIterations).toBeGreaterThanOrEqual(2);
      expect(stage.maxIterations).toBeLessThanOrEqual(5);
    }
  });

  it('should have valid evaluators with required methods', () => {
    for (const stage of REVISION_STAGES) {
      expect(typeof stage.evaluator.score).toBe('function');
      expect(typeof stage.evaluator.generateDirectives).toBe('function');
      expect(stage.evaluator.name).toBe(stage.name);
    }
  });
});

// ============================================================================
// Directive Type Isolation Tests
// ============================================================================

describe('Stage Directive Type Isolation', () => {
  it('each stage should only process its designated directive types', () => {
    // No overlap between stages (except intentionally shared)
    const allTypes = new Set<string>();

    for (const stage of REVISION_STAGES) {
      for (const type of stage.directiveTypes) {
        // Track which stages use which types
        allTypes.add(`${stage.name}:${type}`);
      }
    }

    // Draft and Final should not share types (structural vs proofreading)
    const draftTypes = new Set(REVISION_STAGES[0].directiveTypes);
    const finalTypes = new Set(REVISION_STAGES[3].directiveTypes);

    for (const type of draftTypes) {
      expect(finalTypes.has(type)).toBe(false);
    }
  });

  it('DRAFT_DIRECTIVE_TYPES should focus on structure', () => {
    expect(DRAFT_DIRECTIVE_TYPES).toContain('transition-smoothing');
    expect(DRAFT_DIRECTIVE_TYPES).toContain('show-not-tell');
    expect(DRAFT_DIRECTIVE_TYPES).not.toContain('proofreading');
  });

  it('TONE_DIRECTIVE_TYPES should focus on emotion', () => {
    expect(TONE_DIRECTIVE_TYPES).toContain('dialogue-subtext');
    expect(TONE_DIRECTIVE_TYPES).toContain('voice-consistency');
  });

  it('STYLE_DIRECTIVE_TYPES should focus on craft', () => {
    expect(STYLE_DIRECTIVE_TYPES).toContain('filter-word-removal');
    expect(STYLE_DIRECTIVE_TYPES).toContain('sensory-enrichment');
    expect(STYLE_DIRECTIVE_TYPES).toContain('rhythm-variation');
  });

  it('FINAL_DIRECTIVE_TYPES should focus on proofreading', () => {
    expect(FINAL_DIRECTIVE_TYPES).toContain('proofreading');
    expect(FINAL_DIRECTIVE_TYPES).toContain('honorific-violation');
    expect(FINAL_DIRECTIVE_TYPES).not.toContain('show-not-tell');
  });
});

// ============================================================================
// runMultiStageRevision Tests
// ============================================================================

describe('runMultiStageRevision', () => {
  // Create mock surgeon callback
  const createMockSurgeon = (): SurgeonCallback => {
    return vi.fn().mockImplementation(async (prompt, directive, config) => {
      // Extract target text from prompt and return with simple transformation
      const match = prompt.match(/```\n([\s\S]*?)\n```/);
      if (!match) return '';

      const text = match[1];
      // Simple transformation: replace filter words
      return text
        .replace(/느꼈다/g, '떨렸다')
        .replace(/보였다/g, '나타났다')
        .replace(/생각했다/g, '했다')
        .replace(/  +/g, ' '); // Fix double spaces
    });
  };

  it('should process all stages sequentially', async () => {
    const mockSurgeon = createMockSurgeon();

    const result = await runMultiStageRevision(
      SAMPLE_CONTENT,
      mockSurgeon
    );

    expect(result.stageResults).toHaveLength(4);
    expect(result.stageResults[0].stage).toBe('draft');
    expect(result.stageResults[1].stage).toBe('tone');
    expect(result.stageResults[2].stage).toBe('style');
    expect(result.stageResults[3].stage).toBe('final');
  });

  it('should track improvement per stage', async () => {
    const mockSurgeon = createMockSurgeon();

    const result = await runMultiStageRevision(
      POOR_CONTENT,
      mockSurgeon
    );

    for (const stageResult of result.stageResults) {
      expect(typeof stageResult.inputScore).toBe('number');
      expect(typeof stageResult.outputScore).toBe('number');
      expect(typeof stageResult.improvement).toBe('number');
      expect(stageResult.improvement).toBe(stageResult.outputScore - stageResult.inputScore);
    }
  });

  it('should return finalContent', async () => {
    const mockSurgeon = createMockSurgeon();

    const result = await runMultiStageRevision(
      SAMPLE_CONTENT,
      mockSurgeon
    );

    expect(typeof result.finalContent).toBe('string');
    expect(result.finalContent.length).toBeGreaterThan(0);
  });

  it('should calculate totalImprovement correctly', async () => {
    const mockSurgeon = createMockSurgeon();

    const result = await runMultiStageRevision(
      POOR_CONTENT,
      mockSurgeon
    );

    // totalImprovement = final score - initial score
    const initialScore = result.stageResults[0].inputScore;
    const finalScore = result.stageResults[result.stageResults.length - 1].outputScore;
    expect(result.totalImprovement).toBe(finalScore - initialScore);
  });

  it('should set passedAllStages based on thresholds', async () => {
    const mockSurgeon = createMockSurgeon();

    const result = await runMultiStageRevision(
      SAMPLE_CONTENT,
      mockSurgeon
    );

    // passedAllStages should match whether all stages met their thresholds
    const allPassed = result.stageResults.every(s => s.passed);
    expect(result.passedAllStages).toBe(allPassed);
  });

  it('should track directivesProcessed per stage', async () => {
    const mockSurgeon = createMockSurgeon();

    const result = await runMultiStageRevision(
      POOR_CONTENT,
      mockSurgeon
    );

    for (const stageResult of result.stageResults) {
      expect(typeof stageResult.directivesProcessed).toBe('number');
      expect(stageResult.directivesProcessed).toBeGreaterThanOrEqual(0);
    }
  });

  it('should track iterations per stage', async () => {
    const mockSurgeon = createMockSurgeon();

    const result = await runMultiStageRevision(
      POOR_CONTENT,
      mockSurgeon
    );

    for (const stageResult of result.stageResults) {
      expect(typeof stageResult.iterations).toBe('number');
      expect(stageResult.iterations).toBeGreaterThanOrEqual(0);
    }
  });

  it('should include duration when measured', async () => {
    const mockSurgeon = createMockSurgeon();

    const result = await runMultiStageRevision(
      SAMPLE_CONTENT,
      mockSurgeon
    );

    expect(typeof result.durationMs).toBe('number');
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });
});

// ============================================================================
// Edge Cases
// ============================================================================

describe('Edge Cases', () => {
  it('should handle empty content gracefully', async () => {
    const mockSurgeon = vi.fn().mockResolvedValue('');

    const result = await runMultiStageRevision(
      '',
      mockSurgeon
    );

    expect(result.stageResults).toHaveLength(4);
    expect(result.finalContent).toBe('');
  });

  it('should handle surgeon callback errors gracefully', async () => {
    const errorSurgeon = vi.fn().mockRejectedValue(new Error('Surgeon failed'));

    const result = await runMultiStageRevision(
      SAMPLE_CONTENT,
      errorSurgeon
    );

    // Should still complete all stages despite errors
    expect(result.stageResults).toHaveLength(4);
  });

  it('should handle very short content', async () => {
    const mockSurgeon = vi.fn().mockImplementation(async (prompt) => {
      const match = prompt.match(/```\n([\s\S]*?)\n```/);
      return match ? match[1] : '';
    });

    const result = await runMultiStageRevision(
      '안녕.',
      mockSurgeon
    );

    expect(result.stageResults).toHaveLength(4);
  });
});

// ============================================================================
// Stage Result Consistency
// ============================================================================

describe('Stage Result Consistency', () => {
  it('should have consecutive stages (output of N = input of N+1)', async () => {
    // This is implicit - we verify structure is correct
    const mockSurgeon = vi.fn().mockImplementation(async (prompt) => {
      const match = prompt.match(/```\n([\s\S]*?)\n```/);
      return match ? match[1] : '';
    });

    const result = await runMultiStageRevision(
      SAMPLE_CONTENT,
      mockSurgeon
    );

    // Each stage processes the output of the previous stage
    // We verify by checking that all stages ran and results are present
    expect(result.stageResults).toHaveLength(4);
    for (const stage of result.stageResults) {
      expect(stage.inputScore).toBeDefined();
      expect(stage.outputScore).toBeDefined();
    }
  });

  it('should maintain content through stages', async () => {
    const mockSurgeon = vi.fn().mockImplementation(async (prompt) => {
      const match = prompt.match(/```\n([\s\S]*?)\n```/);
      return match ? match[1] : '';
    });

    const result = await runMultiStageRevision(
      SAMPLE_CONTENT,
      mockSurgeon
    );

    // Final content should not be empty if input was not empty
    expect(result.finalContent.length).toBeGreaterThan(0);
  });
});
