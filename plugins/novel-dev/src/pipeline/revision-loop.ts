/**
 * Revision Loop Orchestrator
 *
 * Connects Quality Oracle analysis to Prose Surgeon execution in a
 * feedback loop that continues until quality passes or max iterations reached.
 *
 * The loop:
 * 1. Calls analyzeChapter to get directives
 * 2. For each directive, builds surgeon prompt and invokes callback
 * 3. Applies surgical fixes to chapter
 * 4. Re-analyzes until PASS or max iterations
 * 5. Triggers circuit breaker after 3 failures per directive
 *
 * @module pipeline/revision-loop
 */

import { analyzeChapter, type AnalyzeChapterOptions } from './quality-oracle.js';
import {
  executeDirective,
  shouldCircuitBreak,
  getModelRouting,
} from './prose-surgeon.js';

import type { QualityOracleResult, SurgicalDirective } from './types.js';
import type {
  DirectiveExecutionRecord,
  SurgeonCallback,
} from './prose-surgeon.js';

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * Configuration for the revision loop
 */
export interface RevisionLoopConfig {
  /** Maximum revision iterations (default: 5) */
  maxIterations: number;
  /** Maximum directives to process per pass (default: 5) */
  maxDirectivesPerPass: number;
  /** Whether to stop immediately when circuit breaker trips (default: true) */
  stopOnCircuitBreak: boolean;
  /** Number of scenes in the chapter (for location mapping) */
  sceneCount: number;
}

/**
 * Default revision loop configuration
 */
export const DEFAULT_REVISION_LOOP_CONFIG: RevisionLoopConfig = {
  maxIterations: 5,
  maxDirectivesPerPass: 5,
  stopOnCircuitBreak: true,
  sceneCount: 1,
};

// ============================================================================
// Result Types
// ============================================================================

/**
 * Summary of a single revision iteration
 */
export interface RevisionIterationSummary {
  /** Iteration number (1-indexed) */
  iteration: number;
  /** Directives processed in this iteration */
  directivesProcessed: number;
  /** Successful fixes applied */
  successfulFixes: number;
  /** Failed fixes */
  failedFixes: number;
  /** Quality verdict after this iteration */
  verdictAfter: 'PASS' | 'REVISE';
  /** Whether circuit breaker tripped */
  circuitBreakerTripped: boolean;
}

/**
 * Result of the complete revision loop
 */
export interface RevisionLoopResult {
  /** Final revised content */
  finalContent: string;
  /** Number of iterations completed */
  iterations: number;
  /** Final quality verdict */
  finalVerdict: 'PASS' | 'REVISE';
  /** All execution records */
  executionRecords: DirectiveExecutionRecord[];
  /** Per-iteration summaries */
  iterationSummaries: RevisionIterationSummary[];
  /** Total directives processed */
  totalDirectivesProcessed: number;
  /** Total successful fixes */
  totalSuccessfulFixes: number;
  /** Whether loop was stopped by circuit breaker */
  stoppedByCircuitBreaker: boolean;
  /** IDs of directives that hit circuit breaker */
  circuitBrokenDirectives: string[];
  /** Final quality assessment */
  finalAssessment: QualityOracleResult;
}

// ============================================================================
// State Tracking
// ============================================================================

/**
 * Per-directive failure tracking
 */
interface DirectiveFailureMap {
  [directiveType: string]: DirectiveExecutionRecord[];
}

// ============================================================================
// Main Orchestration
// ============================================================================

/**
 * Run the revision loop: Quality Oracle -> Prose Surgeon cycles
 *
 * @param content - Initial chapter content
 * @param surgeonCallback - Callback to invoke the surgeon agent
 * @param config - Revision loop configuration
 * @returns Complete revision result
 */
export async function runRevisionLoop(
  content: string,
  surgeonCallback: SurgeonCallback,
  config: Partial<RevisionLoopConfig> = {}
): Promise<RevisionLoopResult> {
  const fullConfig: RevisionLoopConfig = {
    ...DEFAULT_REVISION_LOOP_CONFIG,
    ...config,
  };

  let currentContent = content;
  const executionRecords: DirectiveExecutionRecord[] = [];
  const iterationSummaries: RevisionIterationSummary[] = [];
  const failureMap: DirectiveFailureMap = {};
  const circuitBrokenDirectives: string[] = [];
  let stoppedByCircuitBreaker = false;

  let iteration = 0;
  let finalAssessment: QualityOracleResult;

  while (iteration < fullConfig.maxIterations) {
    iteration++;

    // 1. Analyze current content
    finalAssessment = analyzeChapter(currentContent, fullConfig.sceneCount);

    // 2. Check if we're done
    if (finalAssessment.verdict === 'PASS') {
      iterationSummaries.push({
        iteration,
        directivesProcessed: 0,
        successfulFixes: 0,
        failedFixes: 0,
        verdictAfter: 'PASS',
        circuitBreakerTripped: false,
      });
      break;
    }

    // 3. Process directives
    const directives = finalAssessment.directives.slice(0, fullConfig.maxDirectivesPerPass);
    let successfulFixes = 0;
    let failedFixes = 0;
    let circuitBreakerTripped = false;

    for (const directive of directives) {
      // Check circuit breaker for this directive type
      const typeKey = `${directive.type}_${directive.location.paragraphStart}_${directive.location.paragraphEnd}`;
      if (!failureMap[typeKey]) {
        failureMap[typeKey] = [];
      }

      if (shouldCircuitBreak(failureMap[typeKey])) {
        if (!circuitBrokenDirectives.includes(typeKey)) {
          circuitBrokenDirectives.push(typeKey);
        }
        circuitBreakerTripped = true;

        if (fullConfig.stopOnCircuitBreak) {
          stoppedByCircuitBreaker = true;
          break;
        }
        continue;
      }

      // Execute directive
      const { record, result } = await executeDirective(
        directive,
        currentContent,
        surgeonCallback
      );

      executionRecords.push(record);
      failureMap[typeKey].push(record);

      if (result.success) {
        currentContent = result.modifiedContent;
        successfulFixes++;
      } else {
        failedFixes++;
      }
    }

    iterationSummaries.push({
      iteration,
      directivesProcessed: directives.length,
      successfulFixes,
      failedFixes,
      verdictAfter: 'REVISE',
      circuitBreakerTripped,
    });

    if (stoppedByCircuitBreaker) {
      break;
    }

    // If no fixes were successful, stop to prevent infinite loop
    if (successfulFixes === 0 && directives.length > 0) {
      break;
    }
  }

  // Final analysis if we haven't done one yet this iteration
  if (!finalAssessment! || iterationSummaries[iterationSummaries.length - 1]?.verdictAfter !== 'PASS') {
    finalAssessment = analyzeChapter(currentContent, fullConfig.sceneCount);
  }

  // Update last iteration summary if needed
  if (iterationSummaries.length > 0) {
    const lastSummary = iterationSummaries[iterationSummaries.length - 1];
    lastSummary.verdictAfter = finalAssessment.verdict;
  }

  return {
    finalContent: currentContent,
    iterations: iteration,
    finalVerdict: finalAssessment.verdict,
    executionRecords,
    iterationSummaries,
    totalDirectivesProcessed: executionRecords.length,
    totalSuccessfulFixes: executionRecords.filter(r => r.success).length,
    stoppedByCircuitBreaker,
    circuitBrokenDirectives,
    finalAssessment,
  };
}

// ============================================================================
// Synchronous Testing Helper
// ============================================================================

/**
 * Simple synchronous analysis without LLM calls
 * Suitable for unit testing the orchestration logic
 *
 * @param content - Chapter content
 * @param sceneCount - Number of scenes
 * @returns Analysis report
 */
export function analyzeAndReport(
  content: string,
  sceneCount: number = 1,
  options?: AnalyzeChapterOptions
): {
  verdict: 'PASS' | 'REVISE';
  directiveCount: number;
  directiveTypes: string[];
  assessment: QualityOracleResult;
} {
  const result = analyzeChapter(content, sceneCount, options);

  return {
    verdict: result.verdict,
    directiveCount: result.directives.length,
    directiveTypes: result.directives.map(d => d.type),
    assessment: result,
  };
}

// ============================================================================
// Iteration Control Helpers
// ============================================================================

/**
 * Create a mock surgeon callback for testing
 * Returns the input unchanged (for testing loop termination)
 */
export function createPassthroughCallback(): SurgeonCallback {
  return async (prompt, directive, config) => {
    // Extract target text from prompt and return unchanged
    // This allows testing the loop without actual LLM calls
    const match = prompt.match(/```\n([\s\S]*?)\n```/);
    return match ? match[1] : '';
  };
}

/**
 * Create a mock surgeon callback that applies simple fixes
 * Used for integration testing
 */
export function createSimpleFixCallback(): SurgeonCallback {
  return async (prompt, directive, config) => {
    // Extract target text from prompt
    const match = prompt.match(/## 현재 텍스트 \(수정 대상\)\n```\n([\s\S]*?)\n```/);
    const targetText = match ? match[1] : '';

    // Apply simple transformation based on directive type
    switch (directive.type) {
      case 'filter-word-removal':
        return targetText
          .replace(/느꼈다/g, '떨렸다')
          .replace(/보였다/g, '나타났다')
          .replace(/생각했다/g, '했다');

      case 'sensory-enrichment':
        return targetText + ' 차가운 바람이 불었다. 빛이 눈부셨다.';

      case 'rhythm-variation':
        // Add variety by changing some endings
        return targetText
          .replace(/다\. /g, '다. 과연 그랬을까? ')
          .replace(/했다\.$/, '했다!');

      default:
        return targetText;
    }
  };
}

/**
 * Calculate progress metrics from loop result
 */
export function calculateLoopMetrics(result: RevisionLoopResult): {
  successRate: number;
  fixesPerIteration: number;
  circuitBreakRate: number;
  convergenceSpeed: number;
} {
  const totalFixes = result.totalDirectivesProcessed;
  const successfulFixes = result.totalSuccessfulFixes;
  const iterations = result.iterations;

  return {
    successRate: totalFixes > 0 ? successfulFixes / totalFixes : 1,
    fixesPerIteration: iterations > 0 ? successfulFixes / iterations : 0,
    circuitBreakRate: result.circuitBrokenDirectives.length > 0
      ? result.circuitBrokenDirectives.length / totalFixes
      : 0,
    convergenceSpeed: result.finalVerdict === 'PASS' ? iterations : -1,
  };
}

/**
 * Check if a specific directive type consistently failed
 */
export function getFailedDirectiveTypes(result: RevisionLoopResult): string[] {
  const failuresByType: Record<string, number> = {};
  const successesByType: Record<string, number> = {};

  for (const record of result.executionRecords) {
    if (record.success) {
      successesByType[record.type] = (successesByType[record.type] || 0) + 1;
    } else {
      failuresByType[record.type] = (failuresByType[record.type] || 0) + 1;
    }
  }

  // Return types with more failures than successes
  return Object.keys(failuresByType).filter(type =>
    (failuresByType[type] || 0) > (successesByType[type] || 0)
  );
}
