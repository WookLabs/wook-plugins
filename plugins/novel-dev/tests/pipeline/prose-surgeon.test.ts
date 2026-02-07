import { describe, it, expect, vi } from 'vitest';
import {
  // Constants
  MODEL_ROUTING,
  MAX_SCOPE_LIMITS,
  ABSOLUTE_MAX_SCOPE,
  CIRCUIT_BREAKER_THRESHOLD,
  // Validation functions
  validateScopeCompliance,
  validateSurgeonOutput,
  // Paragraph utilities
  splitIntoParagraphs,
  joinParagraphs,
  extractTargetParagraphs,
  // Fix application
  applySurgicalFix,
  // Prompt building
  buildSurgeonPrompt,
  // Execution
  executeDirective,
  shouldCircuitBreak,
  getModelRouting,
} from '../../src/pipeline/prose-surgeon.js';

import type { SurgicalDirective, DirectiveType } from '../../src/pipeline/types.js';
import type { DirectiveExecutionRecord, SurgeonCallback } from '../../src/pipeline/prose-surgeon.js';

// ============================================================================
// Test Utilities
// ============================================================================

const createMockDirective = (overrides: Partial<SurgicalDirective> = {}): SurgicalDirective => ({
  id: 'dir_filter-word-removal_001',
  type: 'filter-word-removal',
  priority: 2,
  location: {
    sceneNumber: 1,
    paragraphStart: 0,
    paragraphEnd: 0,
  },
  issue: '필터 워드 발견',
  currentText: '그녀는 느꼈다.',
  instruction: '느꼈다를 제거하세요',
  maxScope: 1,
  ...overrides,
});

// ============================================================================
// Constants Tests
// ============================================================================

describe('Prose Surgeon Constants', () => {
  it('should have model routing for all directive types', () => {
    const directiveTypes: DirectiveType[] = [
      'show-not-tell',
      'filter-word-removal',
      'sensory-enrichment',
      'rhythm-variation',
      'dialogue-subtext',
      'cliche-replacement',
      'transition-smoothing',
      'voice-consistency',
      'proofreading',
    ];

    for (const type of directiveTypes) {
      expect(MODEL_ROUTING[type]).toBeDefined();
      expect(MODEL_ROUTING[type].model).toMatch(/^(opus|sonnet)$/);
      expect(MODEL_ROUTING[type].temperature).toBeGreaterThanOrEqual(0);
      expect(MODEL_ROUTING[type].temperature).toBeLessThanOrEqual(1);
    }
  });

  it('should have scope limits for all directive types', () => {
    const directiveTypes: DirectiveType[] = [
      'show-not-tell',
      'filter-word-removal',
      'sensory-enrichment',
      'rhythm-variation',
      'dialogue-subtext',
      'cliche-replacement',
      'transition-smoothing',
      'voice-consistency',
      'proofreading',
    ];

    for (const type of directiveTypes) {
      expect(MAX_SCOPE_LIMITS[type]).toBeDefined();
      expect(MAX_SCOPE_LIMITS[type]).toBeGreaterThan(0);
      expect(MAX_SCOPE_LIMITS[type]).toBeLessThanOrEqual(ABSOLUTE_MAX_SCOPE);
    }
  });

  it('should have reasonable absolute max scope', () => {
    expect(ABSOLUTE_MAX_SCOPE).toBe(3);
  });

  it('should have circuit breaker threshold', () => {
    expect(CIRCUIT_BREAKER_THRESHOLD).toBe(3);
  });
});

// ============================================================================
// Scope Validation Tests
// ============================================================================

describe('validateScopeCompliance', () => {
  it('should pass valid directive', () => {
    const directive = createMockDirective({
      type: 'filter-word-removal',
      maxScope: 1,
    });

    const result = validateScopeCompliance(directive);

    expect(result.valid).toBe(true);
    expect(result.reason).toBeUndefined();
  });

  it('should fail if maxScope exceeds type limit', () => {
    const directive = createMockDirective({
      type: 'filter-word-removal',
      maxScope: 3, // filter-word-removal allows max 1
    });

    const result = validateScopeCompliance(directive);

    expect(result.valid).toBe(false);
    expect(result.reason).toContain('filter-word-removal');
    expect(result.reason).toContain('allows max 1');
  });

  it('should fail if maxScope exceeds absolute limit', () => {
    // Note: Since type-specific limit is checked first, we need a type
    // that allows the maxScope but absolute limit fails.
    // sensory-enrichment allows 3, so 5 fails type-specific first.
    // The type-specific limit matches ABSOLUTE_MAX_SCOPE (3) for most types,
    // so this test validates that some limit is enforced.
    const directive = createMockDirective({
      type: 'sensory-enrichment',
      maxScope: 5, // Both type limit (3) and absolute limit (3) are exceeded
    });

    const result = validateScopeCompliance(directive);

    expect(result.valid).toBe(false);
    // Type-specific check runs first, so the reason mentions the type limit
    expect(result.reason).toContain('sensory-enrichment');
    expect(result.reason).toContain('allows max');
  });

  it('should fail if location range exceeds maxScope', () => {
    const directive = createMockDirective({
      type: 'sensory-enrichment',
      maxScope: 2,
      location: {
        sceneNumber: 1,
        paragraphStart: 0,
        paragraphEnd: 3, // spans 4 paragraphs
      },
    });

    const result = validateScopeCompliance(directive);

    expect(result.valid).toBe(false);
    expect(result.reason).toContain('location spans');
  });

  it('should pass when location range equals maxScope', () => {
    const directive = createMockDirective({
      type: 'sensory-enrichment',
      maxScope: 2,
      location: {
        sceneNumber: 1,
        paragraphStart: 0,
        paragraphEnd: 1, // spans 2 paragraphs
      },
    });

    const result = validateScopeCompliance(directive);

    expect(result.valid).toBe(true);
  });
});

// ============================================================================
// Output Validation Tests
// ============================================================================

describe('validateSurgeonOutput', () => {
  it('should pass when only allowed paragraphs modified', () => {
    const original = '문단 1.\n\n문단 2.\n\n문단 3.';
    const modified = '수정된 문단 1.\n\n문단 2.\n\n문단 3.';

    const result = validateSurgeonOutput(original, modified, [0]);

    expect(result.valid).toBe(true);
    expect(result.modifiedParagraphs).toEqual([0]);
    expect(result.unauthorizedParagraphs).toHaveLength(0);
  });

  it('should fail when paragraph count changes', () => {
    const original = '문단 1.\n\n문단 2.';
    const modified = '문단 1.\n\n문단 2.\n\n문단 3.';

    const result = validateSurgeonOutput(original, modified, [0, 1]);

    expect(result.valid).toBe(false);
    expect(result.reason).toContain('Paragraph count changed');
  });

  it('should fail when unauthorized paragraphs modified', () => {
    const original = '문단 1.\n\n문단 2.\n\n문단 3.';
    const modified = '문단 1.\n\n수정된 문단 2.\n\n수정된 문단 3.';

    const result = validateSurgeonOutput(original, modified, [1]); // Only allowed to modify [1]

    expect(result.valid).toBe(false);
    expect(result.unauthorizedParagraphs).toContain(2);
    expect(result.reason).toContain('unauthorized paragraphs');
  });

  it('should pass when no paragraphs modified', () => {
    const original = '문단 1.\n\n문단 2.';
    const modified = '문단 1.\n\n문단 2.';

    const result = validateSurgeonOutput(original, modified, [0]);

    expect(result.valid).toBe(true);
    expect(result.modifiedParagraphs).toHaveLength(0);
  });

  it('should detect all modified paragraphs', () => {
    const original = '문단 1.\n\n문단 2.\n\n문단 3.';
    const modified = '수정 1.\n\n수정 2.\n\n문단 3.';

    const result = validateSurgeonOutput(original, modified, [0, 1]);

    expect(result.valid).toBe(true);
    expect(result.modifiedParagraphs).toEqual([0, 1]);
  });
});

// ============================================================================
// Paragraph Utility Tests
// ============================================================================

describe('splitIntoParagraphs', () => {
  it('should split on double newlines', () => {
    const content = '첫째.\n\n둘째.\n\n셋째.';
    const paragraphs = splitIntoParagraphs(content);

    expect(paragraphs).toEqual(['첫째.', '둘째.', '셋째.']);
  });

  it('should handle multiple newlines', () => {
    const content = '첫째.\n\n\n\n둘째.';
    const paragraphs = splitIntoParagraphs(content);

    expect(paragraphs).toEqual(['첫째.', '둘째.']);
  });

  it('should filter empty paragraphs', () => {
    const content = '첫째.\n\n   \n\n둘째.';
    const paragraphs = splitIntoParagraphs(content);

    expect(paragraphs).toEqual(['첫째.', '둘째.']);
  });

  it('should handle single paragraph', () => {
    const content = '단일 문단입니다.';
    const paragraphs = splitIntoParagraphs(content);

    expect(paragraphs).toEqual(['단일 문단입니다.']);
  });
});

describe('joinParagraphs', () => {
  it('should join with double newlines', () => {
    const paragraphs = ['첫째.', '둘째.', '셋째.'];
    const content = joinParagraphs(paragraphs);

    expect(content).toBe('첫째.\n\n둘째.\n\n셋째.');
  });

  it('should handle empty array', () => {
    const content = joinParagraphs([]);

    expect(content).toBe('');
  });
});

describe('extractTargetParagraphs', () => {
  it('should extract specified range', () => {
    const content = '문단 0.\n\n문단 1.\n\n문단 2.\n\n문단 3.';

    const result = extractTargetParagraphs(content, 1, 2);

    expect(result.paragraphs).toBe('문단 1.\n\n문단 2.');
    expect(result.indices).toEqual([1, 2]);
  });

  it('should handle single paragraph extraction', () => {
    const content = '문단 0.\n\n문단 1.\n\n문단 2.';

    const result = extractTargetParagraphs(content, 1, 1);

    expect(result.paragraphs).toBe('문단 1.');
    expect(result.indices).toEqual([1]);
  });

  it('should clamp to content boundaries', () => {
    const content = '문단 0.\n\n문단 1.';

    const result = extractTargetParagraphs(content, 1, 10); // 10 is beyond content

    expect(result.indices).toEqual([1]);
    expect(result.paragraphs).toBe('문단 1.');
  });
});

// ============================================================================
// Fix Application Tests
// ============================================================================

describe('applySurgicalFix', () => {
  it('should apply fix to single paragraph', () => {
    const original = '원본 문단.\n\n두 번째.\n\n세 번째.';
    const fixed = '수정된 문단.';

    const result = applySurgicalFix(original, fixed, 0, 0);

    expect(result.success).toBe(true);
    expect(result.modifiedContent).toBe('수정된 문단.\n\n두 번째.\n\n세 번째.');
    expect(result.modifiedParagraphs).toEqual([0]);
  });

  it('should apply fix to multiple paragraphs', () => {
    const original = '문단 0.\n\n문단 1.\n\n문단 2.\n\n문단 3.';
    const fixed = '수정 1.\n\n수정 2.';

    const result = applySurgicalFix(original, fixed, 1, 2);

    expect(result.success).toBe(true);
    expect(result.modifiedContent).toBe('문단 0.\n\n수정 1.\n\n수정 2.\n\n문단 3.');
    expect(result.modifiedParagraphs).toEqual([1, 2]);
  });

  it('should fail on invalid range', () => {
    const original = '문단 0.\n\n문단 1.';
    const fixed = '수정.';

    const result = applySurgicalFix(original, fixed, -1, 0);

    expect(result.success).toBe(false);
    expect(result.error).toContain('Invalid paragraph range');
  });

  it('should fail on out-of-bounds range', () => {
    const original = '문단 0.\n\n문단 1.';
    const fixed = '수정.';

    const result = applySurgicalFix(original, fixed, 0, 5);

    expect(result.success).toBe(false);
    expect(result.error).toContain('Invalid paragraph range');
  });

  it('should fail when fixed paragraph count mismatch', () => {
    const original = '문단 0.\n\n문단 1.\n\n문단 2.';
    const fixed = '수정 한개만.'; // Should be 2 paragraphs for range 1-2

    const result = applySurgicalFix(original, fixed, 1, 2);

    expect(result.success).toBe(false);
    expect(result.error).toContain("doesn't match");
  });

  it('should not flag as modified if content identical', () => {
    const original = '문단 0.\n\n문단 1.\n\n문단 2.';
    const fixed = '문단 1.'; // Same as original

    const result = applySurgicalFix(original, fixed, 1, 1);

    expect(result.success).toBe(true);
    expect(result.modifiedParagraphs).toEqual([]); // Nothing actually changed
  });
});

// ============================================================================
// Prompt Building Tests
// ============================================================================

describe('buildSurgeonPrompt', () => {
  it('should include all required sections', () => {
    const directive = createMockDirective();
    const targetParagraphs = '그녀는 느꼈다.';

    const prompt = buildSurgeonPrompt(directive, targetParagraphs);

    expect(prompt).toContain('# 수술 지시');
    expect(prompt).toContain(directive.id);
    expect(prompt).toContain(directive.type);
    expect(prompt).toContain(directive.issue);
    expect(prompt).toContain(targetParagraphs);
    expect(prompt).toContain(directive.instruction);
    expect(prompt).toContain('HARD RULES');
    expect(prompt).toContain(String(directive.maxScope));
  });

  it('should include exemplar when provided', () => {
    const directive = createMockDirective({
      exemplarId: 'exm_emotion_001',
      exemplarContent: '눈물이 볼을 타고 흘렀다.',
    });

    const prompt = buildSurgeonPrompt(directive, '그녀는 슬펐다.');

    expect(prompt).toContain('## 참고 예제');
    expect(prompt).toContain('눈물이 볼을 타고 흘렀다.');
  });

  it('should not include exemplar section when not provided', () => {
    const directive = createMockDirective();

    const prompt = buildSurgeonPrompt(directive, '테스트');

    expect(prompt).not.toContain('## 참고 예제');
  });

  it('should specify output format', () => {
    const directive = createMockDirective();

    const prompt = buildSurgeonPrompt(directive, '테스트');

    expect(prompt).toContain('출력 형식');
    expect(prompt).toContain('수정된 문단만 출력');
  });
});

// ============================================================================
// Execution Tests
// ============================================================================

describe('executeDirective', () => {
  it('should execute directive with callback', async () => {
    const directive = createMockDirective();
    const content = '그녀는 느꼈다.\n\n두 번째 문단.';
    const mockCallback: SurgeonCallback = vi.fn().mockResolvedValue('손이 떨렸다.');

    const { record, result } = await executeDirective(directive, content, mockCallback);

    expect(record.success).toBe(true);
    expect(record.directiveId).toBe(directive.id);
    expect(record.failureCount).toBe(0);
    expect(result.success).toBe(true);
    expect(result.modifiedContent).toContain('손이 떨렸다.');
    expect(mockCallback).toHaveBeenCalled();
  });

  it('should fail on scope validation error', async () => {
    const directive = createMockDirective({
      maxScope: 5, // Exceeds limit
    });
    const content = '테스트 문단.';
    const mockCallback: SurgeonCallback = vi.fn();

    const { record, result } = await executeDirective(directive, content, mockCallback);

    expect(record.success).toBe(false);
    expect(record.error).toContain('allows max');
    expect(result.success).toBe(false);
    expect(mockCallback).not.toHaveBeenCalled();
  });

  it('should fail when callback throws error', async () => {
    const directive = createMockDirective();
    const content = '그녀는 느꼈다.';
    const mockCallback: SurgeonCallback = vi.fn().mockRejectedValue(new Error('API Error'));

    const { record, result } = await executeDirective(directive, content, mockCallback);

    expect(record.success).toBe(false);
    expect(record.error).toContain('Surgeon callback failed');
    expect(record.failureCount).toBe(1);
    expect(result.success).toBe(false);
  });

  it('should fail when output validation fails', async () => {
    const directive = createMockDirective();
    const content = '문단 1.\n\n문단 2.';
    // Callback returns different paragraph count
    const mockCallback: SurgeonCallback = vi.fn().mockResolvedValue('문단 A.\n\n문단 B.');

    const { record, result } = await executeDirective(directive, content, mockCallback);

    // Should fail because we're trying to apply 2 paragraphs to range 0-0
    expect(record.success).toBe(false);
    expect(result.success).toBe(false);
  });
});

// ============================================================================
// Circuit Breaker Tests
// ============================================================================

describe('shouldCircuitBreak', () => {
  it('should not trip on fewer than threshold failures', () => {
    const records: DirectiveExecutionRecord[] = [
      { directiveId: 'd1', type: 'filter-word-removal', success: false, paragraphsModified: 0, timestamp: '', failureCount: 1 },
      { directiveId: 'd1', type: 'filter-word-removal', success: false, paragraphsModified: 0, timestamp: '', failureCount: 2 },
    ];

    expect(shouldCircuitBreak(records)).toBe(false);
  });

  it('should trip on threshold failures', () => {
    const records: DirectiveExecutionRecord[] = [
      { directiveId: 'd1', type: 'filter-word-removal', success: false, paragraphsModified: 0, timestamp: '', failureCount: 1 },
      { directiveId: 'd1', type: 'filter-word-removal', success: false, paragraphsModified: 0, timestamp: '', failureCount: 2 },
      { directiveId: 'd1', type: 'filter-word-removal', success: false, paragraphsModified: 0, timestamp: '', failureCount: 3 },
    ];

    expect(shouldCircuitBreak(records)).toBe(true);
  });

  it('should not trip if some succeeded', () => {
    const records: DirectiveExecutionRecord[] = [
      { directiveId: 'd1', type: 'filter-word-removal', success: false, paragraphsModified: 0, timestamp: '', failureCount: 1 },
      { directiveId: 'd1', type: 'filter-word-removal', success: true, paragraphsModified: 1, timestamp: '', failureCount: 0 },
      { directiveId: 'd1', type: 'filter-word-removal', success: false, paragraphsModified: 0, timestamp: '', failureCount: 2 },
    ];

    expect(shouldCircuitBreak(records)).toBe(false);
  });

  it('should trip regardless of success if failures exceed threshold', () => {
    const records: DirectiveExecutionRecord[] = [
      { directiveId: 'd1', type: 'filter-word-removal', success: false, paragraphsModified: 0, timestamp: '', failureCount: 1 },
      { directiveId: 'd1', type: 'filter-word-removal', success: true, paragraphsModified: 1, timestamp: '', failureCount: 0 },
      { directiveId: 'd1', type: 'filter-word-removal', success: false, paragraphsModified: 0, timestamp: '', failureCount: 2 },
      { directiveId: 'd1', type: 'filter-word-removal', success: false, paragraphsModified: 0, timestamp: '', failureCount: 3 },
    ];

    expect(shouldCircuitBreak(records)).toBe(true);
  });
});

// ============================================================================
// Model Routing Tests
// ============================================================================

describe('getModelRouting', () => {
  it('should return opus for creative tasks', () => {
    const routing = getModelRouting('show-not-tell');

    expect(routing.model).toBe('opus');
    expect(routing.temperature).toBeGreaterThan(0.5);
  });

  it('should return sonnet for mechanical tasks', () => {
    const routing = getModelRouting('proofreading');

    expect(routing.model).toBe('sonnet');
    expect(routing.temperature).toBeLessThan(0.5);
  });

  it('should return consistent results', () => {
    const routing1 = getModelRouting('filter-word-removal');
    const routing2 = getModelRouting('filter-word-removal');

    expect(routing1).toEqual(routing2);
  });
});

// ============================================================================
// Edge Cases
// ============================================================================

describe('Edge Cases', () => {
  it('should handle empty content', () => {
    const paragraphs = splitIntoParagraphs('');

    expect(paragraphs).toEqual([]);
  });

  it('should handle whitespace-only content', () => {
    const paragraphs = splitIntoParagraphs('   \n\n   \n\n   ');

    expect(paragraphs).toEqual([]);
  });

  it('should handle single character paragraphs', () => {
    const content = 'A\n\nB\n\nC';
    const paragraphs = splitIntoParagraphs(content);

    expect(paragraphs).toEqual(['A', 'B', 'C']);
  });

  it('should handle very long content', () => {
    const longParagraph = '가'.repeat(10000);
    const content = `${longParagraph}\n\n${longParagraph}`;
    const paragraphs = splitIntoParagraphs(content);

    expect(paragraphs).toHaveLength(2);
    expect(paragraphs[0].length).toBe(10000);
  });
});
