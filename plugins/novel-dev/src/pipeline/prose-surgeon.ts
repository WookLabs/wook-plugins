/**
 * Prose Surgeon Module
 *
 * Executes surgical directives with strict scope constraints.
 * The Surgeon applies only the specific fixes identified by the Quality Oracle,
 * never rewriting more than the allowed paragraph range.
 *
 * DEPRECATION NOTE: This module supersedes agents/editor.md for the prose refinement function.
 * The legacy agent remains for backward compatibility but new code should use this module.
 *
 * @module pipeline/prose-surgeon
 */

import type { DirectiveType, SurgicalDirective } from './types.js';

// ============================================================================
// Model Routing Configuration
// ============================================================================

/**
 * Model and temperature routing by directive type
 *
 * Higher creativity tasks use Opus with higher temperature.
 * Mechanical tasks use Sonnet with lower temperature.
 */
export const MODEL_ROUTING: Record<DirectiveType, { model: 'opus' | 'sonnet'; temperature: number }> = {
  'show-not-tell': { model: 'opus', temperature: 0.8 },
  'filter-word-removal': { model: 'sonnet', temperature: 0.4 },
  'sensory-enrichment': { model: 'opus', temperature: 0.7 },
  'rhythm-variation': { model: 'opus', temperature: 0.6 },
  'dialogue-subtext': { model: 'opus', temperature: 0.8 },
  'cliche-replacement': { model: 'opus', temperature: 0.7 },
  'transition-smoothing': { model: 'sonnet', temperature: 0.5 },
  'voice-consistency': { model: 'sonnet', temperature: 0.5 },
  'proofreading': { model: 'sonnet', temperature: 0.2 },
  // Korean specialization (Phase 3)
  'honorific-violation': { model: 'sonnet', temperature: 0.3 },
  'banned-expression': { model: 'sonnet', temperature: 0.4 },
  'texture-enrichment': { model: 'opus', temperature: 0.7 },
  // Advanced quality (Phase 4)
  'style-alignment': { model: 'opus', temperature: 0.6 },
  'subtext-injection': { model: 'opus', temperature: 0.7 },
  'voice-drift': { model: 'opus', temperature: 0.5 },
  'arc-alignment': { model: 'opus', temperature: 0.6 },
};

// ============================================================================
// Scope Limits
// ============================================================================

/**
 * Maximum paragraphs the surgeon can modify per directive type
 * Hard limits that MUST NOT be exceeded
 */
export const MAX_SCOPE_LIMITS: Record<DirectiveType, number> = {
  'show-not-tell': 2,
  'filter-word-removal': 1,
  'sensory-enrichment': 3,
  'rhythm-variation': 3,
  'dialogue-subtext': 2,
  'cliche-replacement': 1,
  'transition-smoothing': 2,
  'voice-consistency': 2,
  'proofreading': 1,
  // Korean specialization (Phase 3)
  'honorific-violation': 1,
  'banned-expression': 1,
  'texture-enrichment': 2,
  // Advanced quality (Phase 4)
  'style-alignment': 2,
  'subtext-injection': 2,
  'voice-drift': 2,
  'arc-alignment': 2,
};

/**
 * Absolute maximum paragraphs for any operation
 */
export const ABSOLUTE_MAX_SCOPE = 3;

// ============================================================================
// Circuit Breaker Configuration
// ============================================================================

/**
 * Maximum failures before circuit breaker trips
 */
export const CIRCUIT_BREAKER_THRESHOLD = 3;

// ============================================================================
// Types
// ============================================================================

/**
 * Result of a surgical fix application
 */
export interface SurgicalFixResult {
  /** Whether the fix was successfully applied */
  success: boolean;
  /** The modified content (full chapter with fix applied) */
  modifiedContent: string;
  /** Paragraphs that were modified (indices) */
  modifiedParagraphs: number[];
  /** Error message if failed */
  error?: string;
  /** Whether scope was exceeded (validation failure) */
  scopeExceeded?: boolean;
}

/**
 * Execution record for tracking directive processing
 */
export interface DirectiveExecutionRecord {
  /** Directive ID */
  directiveId: string;
  /** Type of directive */
  type: DirectiveType;
  /** Whether execution succeeded */
  success: boolean;
  /** Number of paragraphs modified */
  paragraphsModified: number;
  /** Timestamp of execution */
  timestamp: string;
  /** Error if failed */
  error?: string;
  /** Number of failed attempts */
  failureCount: number;
}

/**
 * Callback type for external surgeon agent invocation
 */
export type SurgeonCallback = (
  prompt: string,
  directive: SurgicalDirective,
  config: { model: 'opus' | 'sonnet'; temperature: number }
) => Promise<string>;

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validate that directive scope doesn't exceed limits
 *
 * @param directive - The directive to validate
 * @returns Validation result with reason if invalid
 */
export function validateScopeCompliance(directive: SurgicalDirective): {
  valid: boolean;
  reason?: string;
} {
  const typeLimit = MAX_SCOPE_LIMITS[directive.type];
  const requestedScope = directive.maxScope;

  // Check against type-specific limit
  if (requestedScope > typeLimit) {
    return {
      valid: false,
      reason: `Directive ${directive.id} requests ${requestedScope} paragraphs but ${directive.type} allows max ${typeLimit}`,
    };
  }

  // Check against absolute limit
  if (requestedScope > ABSOLUTE_MAX_SCOPE) {
    return {
      valid: false,
      reason: `Directive ${directive.id} requests ${requestedScope} paragraphs but absolute max is ${ABSOLUTE_MAX_SCOPE}`,
    };
  }

  // Check location consistency
  const locationRange = directive.location.paragraphEnd - directive.location.paragraphStart + 1;
  if (locationRange > requestedScope) {
    return {
      valid: false,
      reason: `Directive ${directive.id} location spans ${locationRange} paragraphs but maxScope is ${requestedScope}`,
    };
  }

  return { valid: true };
}

/**
 * Validate that surgeon output doesn't exceed allowed scope
 *
 * @param originalContent - Original chapter content
 * @param modifiedContent - Modified chapter content
 * @param allowedParagraphs - Paragraph indices that can be modified
 * @returns Validation result with details
 */
export function validateSurgeonOutput(
  originalContent: string,
  modifiedContent: string,
  allowedParagraphs: number[]
): {
  valid: boolean;
  modifiedParagraphs: number[];
  unauthorizedParagraphs: number[];
  reason?: string;
} {
  const originalParas = splitIntoParagraphs(originalContent);
  const modifiedParas = splitIntoParagraphs(modifiedContent);

  // Check paragraph count
  if (originalParas.length !== modifiedParas.length) {
    return {
      valid: false,
      modifiedParagraphs: [],
      unauthorizedParagraphs: [],
      reason: `Paragraph count changed from ${originalParas.length} to ${modifiedParas.length}. Surgeon must not add or remove paragraphs.`,
    };
  }

  // Find modified paragraphs
  const modifiedParagraphs: number[] = [];
  const unauthorizedParagraphs: number[] = [];

  for (let i = 0; i < originalParas.length; i++) {
    if (originalParas[i] !== modifiedParas[i]) {
      modifiedParagraphs.push(i);
      if (!allowedParagraphs.includes(i)) {
        unauthorizedParagraphs.push(i);
      }
    }
  }

  if (unauthorizedParagraphs.length > 0) {
    return {
      valid: false,
      modifiedParagraphs,
      unauthorizedParagraphs,
      reason: `Surgeon modified unauthorized paragraphs: ${unauthorizedParagraphs.join(', ')}. Allowed: ${allowedParagraphs.join(', ')}`,
    };
  }

  return {
    valid: true,
    modifiedParagraphs,
    unauthorizedParagraphs: [],
  };
}

// ============================================================================
// Paragraph Utilities
// ============================================================================

/**
 * Split content into paragraphs
 */
export function splitIntoParagraphs(content: string): string[] {
  return content.split(/\n\n+/).filter(p => p.trim());
}

/**
 * Join paragraphs back into content
 */
export function joinParagraphs(paragraphs: string[]): string {
  return paragraphs.join('\n\n');
}

/**
 * Extract target paragraphs from content
 *
 * @param content - Full chapter content
 * @param startIndex - Starting paragraph index (0-based)
 * @param endIndex - Ending paragraph index (0-based, inclusive)
 * @returns Extracted paragraphs joined
 */
export function extractTargetParagraphs(
  content: string,
  startIndex: number,
  endIndex: number
): {
  paragraphs: string;
  indices: number[];
  allParagraphs: string[];
} {
  const allParagraphs = splitIntoParagraphs(content);
  const indices: number[] = [];

  for (let i = startIndex; i <= Math.min(endIndex, allParagraphs.length - 1); i++) {
    indices.push(i);
  }

  const targetParagraphs = indices.map(i => allParagraphs[i]).join('\n\n');

  return {
    paragraphs: targetParagraphs,
    indices,
    allParagraphs,
  };
}

// ============================================================================
// Fix Application
// ============================================================================

/**
 * Apply a surgical fix to chapter content
 *
 * @param originalContent - Full chapter content
 * @param fixedParagraphs - The fixed paragraph text (to replace target range)
 * @param startIndex - Starting paragraph index
 * @param endIndex - Ending paragraph index
 * @returns Result with modified content
 */
export function applySurgicalFix(
  originalContent: string,
  fixedParagraphs: string,
  startIndex: number,
  endIndex: number
): SurgicalFixResult {
  const allParagraphs = splitIntoParagraphs(originalContent);

  // Validate indices
  if (startIndex < 0 || endIndex >= allParagraphs.length || startIndex > endIndex) {
    return {
      success: false,
      modifiedContent: originalContent,
      modifiedParagraphs: [],
      error: `Invalid paragraph range: ${startIndex}-${endIndex} for content with ${allParagraphs.length} paragraphs`,
    };
  }

  // Split fixed paragraphs
  const fixedParas = splitIntoParagraphs(fixedParagraphs);
  const expectedCount = endIndex - startIndex + 1;

  if (fixedParas.length !== expectedCount) {
    return {
      success: false,
      modifiedContent: originalContent,
      modifiedParagraphs: [],
      error: `Fixed paragraphs count (${fixedParas.length}) doesn't match target range (${expectedCount})`,
      scopeExceeded: fixedParas.length > expectedCount,
    };
  }

  // Apply fix
  const modifiedParagraphs: string[] = [...allParagraphs];
  const modifiedIndices: number[] = [];

  for (let i = 0; i < fixedParas.length; i++) {
    const targetIndex = startIndex + i;
    if (modifiedParagraphs[targetIndex] !== fixedParas[i]) {
      modifiedParagraphs[targetIndex] = fixedParas[i];
      modifiedIndices.push(targetIndex);
    }
  }

  return {
    success: true,
    modifiedContent: joinParagraphs(modifiedParagraphs),
    modifiedParagraphs: modifiedIndices,
  };
}

// ============================================================================
// Prompt Building
// ============================================================================

/**
 * Build prompt for surgeon agent
 *
 * @param directive - The surgical directive
 * @param targetParagraphs - The paragraphs to fix
 * @returns Prompt string for the surgeon agent
 */
export function buildSurgeonPrompt(
  directive: SurgicalDirective,
  targetParagraphs: string
): string {
  const exemplarSection = directive.exemplarContent
    ? `
## 참고 예제 (Exemplar)
좋은 문장의 예시입니다. 스타일을 참고하되 그대로 복사하지 마세요.

\`\`\`
${directive.exemplarContent}
\`\`\`
`
    : '';

  return `# 수술 지시 (Surgical Directive)

## 지시 정보
- ID: ${directive.id}
- 유형: ${directive.type}
- 우선순위: ${directive.priority}

## 문제점
${directive.issue}

## 현재 텍스트 (수정 대상)
\`\`\`
${targetParagraphs}
\`\`\`

## 수정 지침
${directive.instruction}
${exemplarSection}
## HARD RULES (절대 준수)

1. **범위 제한**: 정확히 ${directive.maxScope}개 이하의 문단만 수정하세요.
2. **문단 수 유지**: 문단을 추가하거나 삭제하지 마세요.
3. **최소 변경**: 문제를 해결하는 최소한의 변경만 하세요.
4. **문맥 보존**: 전후 문맥과 캐릭터 음성을 유지하세요.
5. **한국어 자연스러움**: 번역체 표현을 피하세요.

## 출력 형식
수정된 문단만 출력하세요. 설명이나 주석 없이 수정된 텍스트만 반환합니다.
`;
}

// ============================================================================
// Execution
// ============================================================================

/**
 * Execute a single directive using the provided surgeon callback
 *
 * @param directive - The surgical directive
 * @param content - Full chapter content
 * @param surgeonCallback - Callback to invoke the surgeon agent
 * @returns Execution record with results
 */
export async function executeDirective(
  directive: SurgicalDirective,
  content: string,
  surgeonCallback: SurgeonCallback
): Promise<{
  record: DirectiveExecutionRecord;
  result: SurgicalFixResult;
}> {
  const timestamp = new Date().toISOString();

  // Validate scope before execution
  const scopeValidation = validateScopeCompliance(directive);
  if (!scopeValidation.valid) {
    return {
      record: {
        directiveId: directive.id,
        type: directive.type,
        success: false,
        paragraphsModified: 0,
        timestamp,
        error: scopeValidation.reason,
        failureCount: 1,
      },
      result: {
        success: false,
        modifiedContent: content,
        modifiedParagraphs: [],
        error: scopeValidation.reason,
      },
    };
  }

  // Extract target paragraphs
  const { paragraphs: targetParagraphs, indices: allowedIndices } = extractTargetParagraphs(
    content,
    directive.location.paragraphStart,
    directive.location.paragraphEnd
  );

  // Build prompt
  const prompt = buildSurgeonPrompt(directive, targetParagraphs);
  const config = MODEL_ROUTING[directive.type];

  try {
    // Invoke surgeon
    const fixedText = await surgeonCallback(prompt, directive, config);

    // Apply fix
    const fixResult = applySurgicalFix(
      content,
      fixedText,
      directive.location.paragraphStart,
      directive.location.paragraphEnd
    );

    if (!fixResult.success) {
      return {
        record: {
          directiveId: directive.id,
          type: directive.type,
          success: false,
          paragraphsModified: 0,
          timestamp,
          error: fixResult.error,
          failureCount: 1,
        },
        result: fixResult,
      };
    }

    // Validate output scope
    const outputValidation = validateSurgeonOutput(content, fixResult.modifiedContent, allowedIndices);
    if (!outputValidation.valid) {
      return {
        record: {
          directiveId: directive.id,
          type: directive.type,
          success: false,
          paragraphsModified: outputValidation.modifiedParagraphs.length,
          timestamp,
          error: outputValidation.reason,
          failureCount: 1,
        },
        result: {
          ...fixResult,
          success: false,
          error: outputValidation.reason,
          scopeExceeded: true,
        },
      };
    }

    return {
      record: {
        directiveId: directive.id,
        type: directive.type,
        success: true,
        paragraphsModified: fixResult.modifiedParagraphs.length,
        timestamp,
        failureCount: 0,
      },
      result: fixResult,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      record: {
        directiveId: directive.id,
        type: directive.type,
        success: false,
        paragraphsModified: 0,
        timestamp,
        error: `Surgeon callback failed: ${errorMessage}`,
        failureCount: 1,
      },
      result: {
        success: false,
        modifiedContent: content,
        modifiedParagraphs: [],
        error: `Surgeon callback failed: ${errorMessage}`,
      },
    };
  }
}

// ============================================================================
// Circuit Breaker
// ============================================================================

/**
 * Check if circuit breaker should trip
 *
 * @param records - Previous execution records for a directive
 * @returns Whether to stop retrying
 */
export function shouldCircuitBreak(records: DirectiveExecutionRecord[]): boolean {
  const failures = records.filter(r => !r.success).length;
  return failures >= CIRCUIT_BREAKER_THRESHOLD;
}

/**
 * Get model routing for a directive type
 */
export function getModelRouting(type: DirectiveType): { model: 'opus' | 'sonnet'; temperature: number } {
  return MODEL_ROUTING[type];
}
