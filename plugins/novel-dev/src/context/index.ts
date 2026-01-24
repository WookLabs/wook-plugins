/**
 * Context Budget System
 *
 * Manages token budget for loading novel context files.
 * Ensures context stays within LLM token limits while prioritizing
 * the most relevant information for each chapter.
 *
 * @module context
 *
 * @example
 * ```typescript
 * import {
 *   loadContextWithBudget,
 *   handleOverflow,
 *   estimateTokens
 * } from './context';
 *
 * // Load context for chapter 50 with 80K token budget
 * const context = await loadContextWithBudget(50, '/path/to/novel', 80000);
 *
 * // Check if any items were excluded
 * if (context.overflow.length > 0) {
 *   console.log('Excluded:', context.overflow.map(i => i.id));
 * }
 *
 * // Estimate tokens for new content
 * const tokens = estimateTokens('새로운 내용입니다.', 'korean');
 * ```
 */

// ============================================================================
// Type Exports
// ============================================================================

export type {
  ContextType,
  ContentType,
  ContextItem,
  ContextBudget,
  ItemMetadata,
  BudgetConfig,
  LoadContextResult,
  LoadingStats,
} from './types.js';

export {
  DEFAULT_BUDGET_CONFIG,
  ContextOverflowError,
} from './types.js';

// ============================================================================
// Estimator Exports
// ============================================================================

export {
  estimateTokens,
  estimateTokensByPath,
  estimateTokensAuto,
  estimateTokensBatch,
  detectContentType,
  fitsInBudget,
  ESTIMATED_TOKENS_BY_FILE_TYPE,
  AVERAGE_TOKENS_BY_TYPE,
} from './estimator.js';

// ============================================================================
// Priority Exports
// ============================================================================

export {
  getPriority,
  isRequired,
  comparePriority,
  sortByPriority,
  getDroppableItems,
  calculateTotalPriority,
  basePriority,
  requiredByType,
  PRIORITY_THRESHOLDS,
} from './priorities.js';

// ============================================================================
// Loader Exports
// ============================================================================

export {
  loadContextWithBudget,
  loadContextWithStats,
  previewContextLoad,
} from './loader.js';

// ============================================================================
// Overflow Handler Exports
// ============================================================================

export type {
  OverflowResult,
  UserChoice,
  CompressionOptions,
} from './overflow-handler.js';

export {
  handleOverflow,
  applyUserChoice,
  validateBudget,
  assertRequiredItemsFit,
} from './overflow-handler.js';
