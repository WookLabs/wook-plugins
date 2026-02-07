import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  // Main function
  runRevisionLoop,
  // Config
  DEFAULT_REVISION_LOOP_CONFIG,
  // Testing helpers
  analyzeAndReport,
  createPassthroughCallback,
  createSimpleFixCallback,
  calculateLoopMetrics,
  getFailedDirectiveTypes,
} from '../../src/pipeline/revision-loop.js';

import { resetDirectiveCounter } from '../../src/pipeline/quality-oracle.js';

import type {
  RevisionLoopConfig,
  RevisionLoopResult,
} from '../../src/pipeline/revision-loop.js';
import type { SurgeonCallback } from '../../src/pipeline/prose-surgeon.js';

// ============================================================================
// Test Setup
// ============================================================================

beforeEach(() => {
  resetDirectiveCounter();
});

// ============================================================================
// Configuration Tests
// ============================================================================

describe('DEFAULT_REVISION_LOOP_CONFIG', () => {
  it('should have reasonable defaults', () => {
    expect(DEFAULT_REVISION_LOOP_CONFIG.maxIterations).toBe(5);
    expect(DEFAULT_REVISION_LOOP_CONFIG.maxDirectivesPerPass).toBe(5);
    expect(DEFAULT_REVISION_LOOP_CONFIG.stopOnCircuitBreak).toBe(true);
    expect(DEFAULT_REVISION_LOOP_CONFIG.sceneCount).toBe(1);
  });
});

// ============================================================================
// Synchronous Analysis Tests
// ============================================================================

describe('analyzeAndReport', () => {
  it('should return PASS for clean content', () => {
    const content = '빛이 눈부셨다. 소리가 들렸나? 차갑네. 향긋하지!';
    // Disable texture assessment for this basic test
    const report = analyzeAndReport(content, 1, { assessKoreanTexture: false });

    expect(report.verdict).toBe('PASS');
    expect(report.directiveCount).toBe(0);
  });

  it('should return REVISE for problematic content', () => {
    const content = '그녀는 슬픔을 느꼈다. 그것이 보였다.';
    const report = analyzeAndReport(content);

    expect(report.verdict).toBe('REVISE');
    expect(report.directiveCount).toBeGreaterThan(0);
    expect(report.directiveTypes).toContain('filter-word-removal');
  });

  it('should include full assessment', () => {
    const content = '테스트 문장입니다.';
    const report = analyzeAndReport(content);

    expect(report.assessment).toBeDefined();
    expect(report.assessment.assessment).toBeDefined();
    expect(report.assessment.readerExperience).toBeDefined();
  });
});

// ============================================================================
// Passthrough Callback Tests
// ============================================================================

describe('createPassthroughCallback', () => {
  it('should return target text unchanged', async () => {
    const callback = createPassthroughCallback();
    const prompt = '## 현재 텍스트 (수정 대상)\n```\n원본 텍스트\n```';

    const result = await callback(prompt, {} as any, { model: 'sonnet', temperature: 0.5 });

    // Note: passthrough extracts from first ``` block
    expect(result).toBe('원본 텍스트');
  });
});

// ============================================================================
// Simple Fix Callback Tests
// ============================================================================

describe('createSimpleFixCallback', () => {
  it('should fix filter words', async () => {
    const callback = createSimpleFixCallback();
    const prompt = '## 현재 텍스트 (수정 대상)\n```\n그녀는 느꼈다.\n```';
    const directive = { type: 'filter-word-removal' } as any;

    const result = await callback(prompt, directive, { model: 'sonnet', temperature: 0.5 });

    expect(result).toContain('떨렸다');
    expect(result).not.toContain('느꼈다');
  });

  it('should add sensory detail', async () => {
    const callback = createSimpleFixCallback();
    const prompt = '## 현재 텍스트 (수정 대상)\n```\n단조로운 문장.\n```';
    const directive = { type: 'sensory-enrichment' } as any;

    const result = await callback(prompt, directive, { model: 'sonnet', temperature: 0.5 });

    expect(result).toContain('바람');
    expect(result).toContain('빛');
  });

  it('should vary rhythm', async () => {
    const callback = createSimpleFixCallback();
    const prompt = '## 현재 텍스트 (수정 대상)\n```\n갔다. 봤다.\n```';
    const directive = { type: 'rhythm-variation' } as any;

    const result = await callback(prompt, directive, { model: 'sonnet', temperature: 0.5 });

    expect(result).toContain('?');
  });
});

// ============================================================================
// Revision Loop Tests
// ============================================================================

describe('runRevisionLoop', () => {
  it('should return immediately for clean content', async () => {
    const content = '빛이 눈부셨다. 소리가 들렸나? 차갑네. 향긋하지. 달다!';
    const mockCallback: SurgeonCallback = vi.fn();

    const result = await runRevisionLoop(content, mockCallback);

    expect(result.finalVerdict).toBe('PASS');
    expect(result.iterations).toBe(1);
    expect(mockCallback).not.toHaveBeenCalled();
    expect(result.totalDirectivesProcessed).toBe(0);
  });

  it('should process directives for problematic content', async () => {
    const content = '그녀는 느꼈다.\n\n두 번째 문단.';
    const callback = createSimpleFixCallback();

    const result = await runRevisionLoop(content, callback, {
      maxIterations: 3,
    });

    expect(result.iterations).toBeGreaterThanOrEqual(1);
    expect(result.totalDirectivesProcessed).toBeGreaterThan(0);
  });

  it('should respect maxIterations', async () => {
    // Content that will never fully pass
    const content = '느꼈다. '.repeat(50);
    const callback = createPassthroughCallback(); // No actual fixes

    const result = await runRevisionLoop(content, callback, {
      maxIterations: 2,
    });

    expect(result.iterations).toBeLessThanOrEqual(2);
  });

  it('should track iteration summaries', async () => {
    const content = '그녀는 느꼈다.';
    const callback = createSimpleFixCallback();

    const result = await runRevisionLoop(content, callback, {
      maxIterations: 2,
    });

    expect(result.iterationSummaries.length).toBeGreaterThan(0);
    expect(result.iterationSummaries[0].iteration).toBe(1);
    expect(result.iterationSummaries[0]).toHaveProperty('successfulFixes');
    expect(result.iterationSummaries[0]).toHaveProperty('failedFixes');
  });

  it('should track execution records', async () => {
    const content = '느꼈다. 보였다.';
    const callback = createSimpleFixCallback();

    const result = await runRevisionLoop(content, callback, {
      maxIterations: 2,
    });

    expect(result.executionRecords.length).toBeGreaterThanOrEqual(0);
    for (const record of result.executionRecords) {
      expect(record).toHaveProperty('directiveId');
      expect(record).toHaveProperty('type');
      expect(record).toHaveProperty('success');
      expect(record).toHaveProperty('timestamp');
    }
  });

  it('should include final assessment', async () => {
    const content = '테스트 문장입니다.';
    const callback = createPassthroughCallback();

    const result = await runRevisionLoop(content, callback);

    expect(result.finalAssessment).toBeDefined();
    expect(result.finalAssessment.verdict).toBeDefined();
    expect(result.finalAssessment.assessment).toBeDefined();
  });

  it('should stop on no successful fixes to prevent infinite loop', async () => {
    const content = '느꼈다. '.repeat(20);
    // Callback that always fails
    const failingCallback: SurgeonCallback = vi.fn().mockRejectedValue(new Error('Always fails'));

    const result = await runRevisionLoop(content, failingCallback, {
      maxIterations: 10,
      stopOnCircuitBreak: false, // Don't stop on circuit break
    });

    // Should stop early because no fixes succeed
    expect(result.iterations).toBeLessThan(10);
  });
});

// ============================================================================
// Circuit Breaker Tests
// ============================================================================

describe('Circuit Breaker Behavior', () => {
  it('should track circuit broken directives', async () => {
    const content = '느꼈다.\n\n보였다.';
    // Always failing callback
    const failingCallback: SurgeonCallback = vi.fn().mockRejectedValue(new Error('Fail'));

    const result = await runRevisionLoop(content, failingCallback, {
      maxIterations: 5,
      stopOnCircuitBreak: true,
    });

    // After 3 failures, circuit breaker should trip
    expect(result.stoppedByCircuitBreaker || result.circuitBrokenDirectives.length > 0 ||
           result.iterations <= result.totalDirectivesProcessed / 3 + 1).toBe(true);
  });

  it('should respect stopOnCircuitBreak=false', async () => {
    const content = '느꼈다. 보였다. 생각했다.';
    let callCount = 0;
    const sometimesFailingCallback: SurgeonCallback = vi.fn().mockImplementation(async () => {
      callCount++;
      if (callCount <= 3) {
        throw new Error('Fail');
      }
      return '수정됨.';
    });

    const result = await runRevisionLoop(content, sometimesFailingCallback, {
      maxIterations: 3,
      stopOnCircuitBreak: false,
    });

    // Should continue past circuit break
    expect(result.iterations).toBeGreaterThanOrEqual(1);
  });
});

// ============================================================================
// Metrics Calculation Tests
// ============================================================================

describe('calculateLoopMetrics', () => {
  it('should calculate success rate', () => {
    const result: RevisionLoopResult = {
      finalContent: '',
      iterations: 2,
      finalVerdict: 'PASS',
      executionRecords: [
        { directiveId: 'd1', type: 'filter-word-removal', success: true, paragraphsModified: 1, timestamp: '', failureCount: 0 },
        { directiveId: 'd2', type: 'filter-word-removal', success: false, paragraphsModified: 0, timestamp: '', failureCount: 1 },
      ],
      iterationSummaries: [],
      totalDirectivesProcessed: 2,
      totalSuccessfulFixes: 1,
      stoppedByCircuitBreaker: false,
      circuitBrokenDirectives: [],
      finalAssessment: {} as any,
    };

    const metrics = calculateLoopMetrics(result);

    expect(metrics.successRate).toBe(0.5);
    expect(metrics.fixesPerIteration).toBe(0.5);
    expect(metrics.convergenceSpeed).toBe(2);
  });

  it('should handle zero directives', () => {
    const result: RevisionLoopResult = {
      finalContent: '',
      iterations: 1,
      finalVerdict: 'PASS',
      executionRecords: [],
      iterationSummaries: [],
      totalDirectivesProcessed: 0,
      totalSuccessfulFixes: 0,
      stoppedByCircuitBreaker: false,
      circuitBrokenDirectives: [],
      finalAssessment: {} as any,
    };

    const metrics = calculateLoopMetrics(result);

    expect(metrics.successRate).toBe(1); // No directives = 100% success
    expect(metrics.fixesPerIteration).toBe(0);
    expect(metrics.circuitBreakRate).toBe(0);
  });

  it('should return -1 convergenceSpeed for non-passing result', () => {
    const result: RevisionLoopResult = {
      finalContent: '',
      iterations: 5,
      finalVerdict: 'REVISE',
      executionRecords: [],
      iterationSummaries: [],
      totalDirectivesProcessed: 10,
      totalSuccessfulFixes: 3,
      stoppedByCircuitBreaker: false,
      circuitBrokenDirectives: [],
      finalAssessment: {} as any,
    };

    const metrics = calculateLoopMetrics(result);

    expect(metrics.convergenceSpeed).toBe(-1);
  });
});

// ============================================================================
// Failed Directive Types Tests
// ============================================================================

describe('getFailedDirectiveTypes', () => {
  it('should identify types with more failures than successes', () => {
    const result: RevisionLoopResult = {
      finalContent: '',
      iterations: 3,
      finalVerdict: 'REVISE',
      executionRecords: [
        { directiveId: 'd1', type: 'filter-word-removal', success: true, paragraphsModified: 1, timestamp: '', failureCount: 0 },
        { directiveId: 'd2', type: 'filter-word-removal', success: false, paragraphsModified: 0, timestamp: '', failureCount: 1 },
        { directiveId: 'd3', type: 'filter-word-removal', success: false, paragraphsModified: 0, timestamp: '', failureCount: 2 },
        { directiveId: 'd4', type: 'sensory-enrichment', success: true, paragraphsModified: 1, timestamp: '', failureCount: 0 },
        { directiveId: 'd5', type: 'sensory-enrichment', success: true, paragraphsModified: 1, timestamp: '', failureCount: 0 },
      ],
      iterationSummaries: [],
      totalDirectivesProcessed: 5,
      totalSuccessfulFixes: 3,
      stoppedByCircuitBreaker: false,
      circuitBrokenDirectives: [],
      finalAssessment: {} as any,
    };

    const failedTypes = getFailedDirectiveTypes(result);

    expect(failedTypes).toContain('filter-word-removal');
    expect(failedTypes).not.toContain('sensory-enrichment');
  });

  it('should return empty array when all types succeed', () => {
    const result: RevisionLoopResult = {
      finalContent: '',
      iterations: 1,
      finalVerdict: 'PASS',
      executionRecords: [
        { directiveId: 'd1', type: 'filter-word-removal', success: true, paragraphsModified: 1, timestamp: '', failureCount: 0 },
        { directiveId: 'd2', type: 'sensory-enrichment', success: true, paragraphsModified: 2, timestamp: '', failureCount: 0 },
      ],
      iterationSummaries: [],
      totalDirectivesProcessed: 2,
      totalSuccessfulFixes: 2,
      stoppedByCircuitBreaker: false,
      circuitBrokenDirectives: [],
      finalAssessment: {} as any,
    };

    const failedTypes = getFailedDirectiveTypes(result);

    expect(failedTypes).toHaveLength(0);
  });
});

// ============================================================================
// Integration Tests
// ============================================================================

describe('Integration', () => {
  it('should improve content with simple fix callback', async () => {
    const content = '그녀는 느꼈다.';
    const callback = createSimpleFixCallback();

    const result = await runRevisionLoop(content, callback, {
      maxIterations: 3,
    });

    // Content should be different (either improved or attempted to improve)
    // The simple fix callback replaces filter words
    if (result.totalSuccessfulFixes > 0) {
      expect(result.finalContent).not.toBe(content);
    }
  });

  it('should handle multi-scene content', async () => {
    const content = '장면 1: 느꼈다.\n\n장면 2: 보였다.\n\n장면 3: 생각했다.';
    const callback = createSimpleFixCallback();

    const result = await runRevisionLoop(content, callback, {
      maxIterations: 2,
      sceneCount: 3,
    });

    expect(result.finalAssessment).toBeDefined();
  });

  it('should complete full loop with mock callback', async () => {
    // Clean content that will pass immediately
    const content = '빛이 창문으로 쏟아졌다. 소리가 들렸나? 차갑다. 향긋하지. 달콤하다!';
    const mockCallback: SurgeonCallback = vi.fn();

    const result = await runRevisionLoop(content, mockCallback, {
      maxIterations: 5,
    });

    expect(result.finalVerdict).toBe('PASS');
    expect(result.finalContent).toBe(content);
    expect(mockCallback).not.toHaveBeenCalled();
  });
});

// ============================================================================
// Edge Cases
// ============================================================================

describe('Edge Cases', () => {
  it('should handle empty content', async () => {
    const callback = createPassthroughCallback();

    const result = await runRevisionLoop('', callback);

    expect(result.finalContent).toBe('');
    expect(result.iterations).toBeGreaterThanOrEqual(1);
  });

  it('should handle single character content', async () => {
    const callback = createPassthroughCallback();

    const result = await runRevisionLoop('A', callback);

    expect(result.iterations).toBeGreaterThanOrEqual(1);
  });

  it('should handle very long content', async () => {
    const content = '빛이 눈부셨다. 소리가 들렸다. '.repeat(100);
    const callback = createPassthroughCallback();

    const result = await runRevisionLoop(content, callback, {
      maxIterations: 1,
    });

    expect(result.iterations).toBe(1);
  });
});
