/**
 * Overflow Handler Module
 *
 * Handles context budget overflow situations with multi-level strategies:
 * - Level 1: Remove low-priority optional items
 * - Level 2: Compress/truncate summaries and profiles
 * - Level 3: User intervention required
 */

import {
  ContextBudget,
  ContextItem as _ContextItem,
  ContextType as _ContextType,
  ContextOverflowError,
} from './types.js';

// Re-export for potential future use
export type { _ContextItem as ContextItem, _ContextType as ContextType };
import { estimateTokens, detectContentType } from './estimator.js';
import { PRIORITY_THRESHOLDS, getDroppableItems } from './priorities.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Result of overflow handling attempt
 */
export interface OverflowResult {
  /** Whether overflow was successfully resolved */
  resolved: boolean;

  /** Updated budget after handling */
  budget: ContextBudget;

  /** Tokens freed by the operation */
  freedTokens: number;

  /** Level of intervention used (1, 2, or 3) */
  level: 1 | 2 | 3;

  /** Description of actions taken */
  actions: string[];

  /** If Level 3, user choices available */
  userChoices?: UserChoice[];
}

/**
 * User choice option for Level 3 overflow
 */
export interface UserChoice {
  /** Choice identifier */
  id: string;

  /** Human-readable label */
  label: string;

  /** Description of what this choice does */
  description: string;

  /** Estimated tokens to be freed */
  freedTokens: number;

  /** Items affected by this choice */
  affectedItems: string[];
}

/**
 * Options for compression
 */
export interface CompressionOptions {
  /** Maximum length for summaries (in characters) */
  maxSummaryLength?: number;

  /** Maximum length for character profiles */
  maxCharacterLength?: number;

  /** Whether to strip examples and details */
  stripDetails?: boolean;
}

const DEFAULT_COMPRESSION_OPTIONS: Required<CompressionOptions> = {
  maxSummaryLength: 200,
  maxCharacterLength: 300,
  stripDetails: true,
};

// ============================================================================
// Main Handler
// ============================================================================

/**
 * Attempts to resolve context budget overflow
 *
 * Strategy levels:
 * 1. Remove low-priority optional items (priority < 5)
 * 2. Compress summaries and profiles
 * 3. Present user with choices
 *
 * @param budget - Current context budget
 * @param overflowAmount - How many tokens over budget
 * @param options - Compression options
 * @returns Result of overflow handling
 *
 * @example
 * ```typescript
 * const result = await handleOverflow(budget, 5000);
 * if (result.resolved) {
 *   console.log(`Freed ${result.freedTokens} tokens at level ${result.level}`);
 * } else {
 *   // Present user choices
 *   console.log('Please select:', result.userChoices);
 * }
 * ```
 */
export async function handleOverflow(
  budget: ContextBudget,
  overflowAmount: number,
  options: CompressionOptions = {}
): Promise<OverflowResult> {
  const opts: Required<CompressionOptions> = {
    ...DEFAULT_COMPRESSION_OPTIONS,
    ...options,
  };

  const actions: string[] = [];
  let totalFreed = 0;

  // Clone budget to avoid mutation
  const workingBudget: ContextBudget = {
    ...budget,
    items: [...budget.items],
    overflow: [...budget.overflow],
  };

  // Level 1: Remove low-priority items
  const level1Result = await handleLevel1(workingBudget, overflowAmount);
  totalFreed += level1Result.freedTokens;
  actions.push(...level1Result.actions);

  if (totalFreed >= overflowAmount) {
    return {
      resolved: true,
      budget: workingBudget,
      freedTokens: totalFreed,
      level: 1,
      actions,
    };
  }

  // Level 2: Compress items
  const remainingOverflow = overflowAmount - totalFreed;
  const level2Result = await handleLevel2(workingBudget, remainingOverflow, opts);
  totalFreed += level2Result.freedTokens;
  actions.push(...level2Result.actions);

  if (totalFreed >= overflowAmount) {
    return {
      resolved: true,
      budget: workingBudget,
      freedTokens: totalFreed,
      level: 2,
      actions,
    };
  }

  // Level 3: User intervention required
  const level3Result = generateUserChoices(workingBudget, overflowAmount - totalFreed);

  return {
    resolved: false,
    budget: workingBudget,
    freedTokens: totalFreed,
    level: 3,
    actions: [...actions, 'User intervention required'],
    userChoices: level3Result,
  };
}

// ============================================================================
// Level 1: Remove Low-Priority Items
// ============================================================================

/**
 * Level 1: Remove low-priority optional items
 */
async function handleLevel1(
  budget: ContextBudget,
  targetFreed: number
): Promise<{ freedTokens: number; actions: string[] }> {
  const actions: string[] = [];
  let freed = 0;

  // Get items that can be dropped (low priority, not required)
  const droppable = getDroppableItems(budget.items, PRIORITY_THRESHOLDS.LEVEL_1_MIN);

  for (const item of droppable) {
    if (freed >= targetFreed) break;

    // Move item from items to overflow
    budget.items = budget.items.filter(i => i.id !== item.id);
    budget.overflow.push(item);
    budget.currentTokens -= item.estimatedTokens;

    freed += item.estimatedTokens;
    actions.push(`Removed ${item.id} (${item.estimatedTokens} tokens, priority ${item.priority})`);
  }

  return { freedTokens: freed, actions };
}

// ============================================================================
// Level 2: Compression
// ============================================================================

/**
 * Level 2: Compress summaries and character profiles
 */
async function handleLevel2(
  budget: ContextBudget,
  targetFreed: number,
  options: Required<CompressionOptions>
): Promise<{ freedTokens: number; actions: string[] }> {
  const actions: string[] = [];
  let freed = 0;

  // Compress summaries first
  const summaries = budget.items.filter(i => i.type === 'summary');
  for (const summary of summaries) {
    if (freed >= targetFreed) break;
    if (!summary.content) continue;

    const compressed = compressSummary(summary.content, options.maxSummaryLength);
    const originalTokens = summary.estimatedTokens;
    const newTokens = estimateTokens(compressed, detectContentType(compressed));

    if (newTokens < originalTokens) {
      const savedTokens = originalTokens - newTokens;
      summary.content = compressed;
      summary.estimatedTokens = newTokens;
      budget.currentTokens -= savedTokens;

      freed += savedTokens;
      actions.push(`Compressed ${summary.id}: saved ${savedTokens} tokens`);
    }
  }

  // Compress character profiles
  const characters = budget.items.filter(i => i.type === 'character');
  for (const char of characters) {
    if (freed >= targetFreed) break;
    if (!char.content) continue;

    const compressed = compressCharacter(char.content, options.maxCharacterLength, options.stripDetails);
    const originalTokens = char.estimatedTokens;
    const newTokens = estimateTokens(compressed, detectContentType(compressed));

    if (newTokens < originalTokens) {
      const savedTokens = originalTokens - newTokens;
      char.content = compressed;
      char.estimatedTokens = newTokens;
      budget.currentTokens -= savedTokens;

      freed += savedTokens;
      actions.push(`Compressed ${char.id}: saved ${savedTokens} tokens`);
    }
  }

  return { freedTokens: freed, actions };
}

/**
 * Compresses a summary to target length
 */
function compressSummary(content: string, maxLength: number): string {
  if (content.length <= maxLength) {
    return content;
  }

  // For markdown summaries, try to keep the first paragraph
  const paragraphs = content.split(/\n\n+/);
  let result = '';

  for (const para of paragraphs) {
    if ((result + para).length > maxLength) {
      break;
    }
    result += (result ? '\n\n' : '') + para;
  }

  // If still too long, truncate
  if (result.length > maxLength) {
    result = result.substring(0, maxLength - 3) + '...';
  }

  return result || content.substring(0, maxLength - 3) + '...';
}

/**
 * Compresses a character profile to essentials
 */
function compressCharacter(
  content: string,
  maxLength: number,
  stripDetails: boolean
): string {
  try {
    const char = JSON.parse(content);

    // Create compressed version with essentials only
    const compressed: Record<string, unknown> = {
      id: char.id,
      name: char.name,
      role: char.role,
    };

    // Keep basic info
    if (char.basic) {
      compressed.basic = {
        age: char.basic.age,
        gender: char.basic.gender,
      };

      if (char.basic.appearance && !stripDetails) {
        compressed.basic = {
          ...compressed.basic as object,
          appearance: char.basic.appearance.features?.slice(0, 2),
        };
      }
    }

    // Keep inner motivation (important for consistency)
    if (char.inner) {
      compressed.inner = {
        want: char.inner.want,
        need: char.inner.need,
        fatal_flaw: char.inner.fatal_flaw,
      };
    }

    const result = JSON.stringify(compressed, null, 2);

    // If still too long, strip more
    if (result.length > maxLength) {
      const minimal = {
        id: char.id,
        name: char.name,
        role: char.role,
        summary: `${char.basic?.age || '?'}세 ${char.basic?.gender || '?'}, ${char.inner?.fatal_flaw || ''}`,
      };
      return JSON.stringify(minimal, null, 2);
    }

    return result;
  } catch {
    // Not JSON, truncate as text
    return content.substring(0, maxLength - 3) + '...';
  }
}

// ============================================================================
// Level 3: User Choices
// ============================================================================

/**
 * Generates user choice options for Level 3 overflow
 */
function generateUserChoices(
  budget: ContextBudget,
  _remainingOverflow: number
): UserChoice[] {
  const choices: UserChoice[] = [];

  // Choice A: Remove all summaries older than 2 chapters
  const oldSummaries = budget.items.filter(
    i => i.type === 'summary' && i.priority < 7
  );
  if (oldSummaries.length > 0) {
    const tokens = oldSummaries.reduce((sum, i) => sum + i.estimatedTokens, 0);
    choices.push({
      id: 'remove-old-summaries',
      label: '[A] Remove older summaries',
      description: 'Remove summaries from 3+ chapters ago',
      freedTokens: tokens,
      affectedItems: oldSummaries.map(i => i.id),
    });
  }

  // Choice B: Remove non-essential characters
  const nonEssentialChars = budget.items.filter(
    i => i.type === 'character' && !i.required
  );
  if (nonEssentialChars.length > 0) {
    const tokens = nonEssentialChars.reduce((sum, i) => sum + i.estimatedTokens, 0);
    choices.push({
      id: 'remove-non-essential-chars',
      label: '[B] Remove non-appearing characters',
      description: 'Remove characters not in current chapter',
      freedTokens: tokens,
      affectedItems: nonEssentialChars.map(i => i.id),
    });
  }

  // Choice C: Remove foreshadowing
  const foreshadowing = budget.items.filter(
    i => i.type === 'foreshadowing' && !i.required
  );
  if (foreshadowing.length > 0) {
    const tokens = foreshadowing.reduce((sum, i) => sum + i.estimatedTokens, 0);
    choices.push({
      id: 'remove-foreshadowing',
      label: '[C] Remove non-active foreshadowing',
      description: 'Remove foreshadowing not paying off soon',
      freedTokens: tokens,
      affectedItems: foreshadowing.map(i => i.id),
    });
  }

  // Choice D: Remove world/location info
  const world = budget.items.filter(
    i => i.type === 'world' && !i.required
  );
  if (world.length > 0) {
    const tokens = world.reduce((sum, i) => sum + i.estimatedTokens, 0);
    choices.push({
      id: 'remove-world',
      label: '[D] Remove location details',
      description: 'Remove world-building information',
      freedTokens: tokens,
      affectedItems: world.map(i => i.id),
    });
  }

  return choices;
}

// ============================================================================
// Apply User Choice
// ============================================================================

/**
 * Applies a user's choice to resolve overflow
 *
 * @param budget - Current context budget
 * @param choiceId - ID of the chosen option
 * @param availableChoices - List of available choices
 * @returns Updated budget
 */
export function applyUserChoice(
  budget: ContextBudget,
  choiceId: string,
  availableChoices: UserChoice[]
): ContextBudget {
  const choice = availableChoices.find(c => c.id === choiceId);
  if (!choice) {
    throw new Error(`Invalid choice: ${choiceId}`);
  }

  const result: ContextBudget = {
    ...budget,
    items: [...budget.items],
    overflow: [...budget.overflow],
  };

  for (const itemId of choice.affectedItems) {
    const item = result.items.find(i => i.id === itemId);
    if (item) {
      result.items = result.items.filter(i => i.id !== itemId);
      result.overflow.push(item);
      result.currentTokens -= item.estimatedTokens;
    }
  }

  return result;
}

// ============================================================================
// Validation
// ============================================================================

/**
 * Validates that a budget is within limits
 *
 * @param budget - Budget to validate
 * @returns Validation result
 */
export function validateBudget(budget: ContextBudget): {
  valid: boolean;
  overBy: number;
  utilizationPercent: number;
} {
  const overBy = Math.max(0, budget.currentTokens - budget.maxTokens);
  const utilizationPercent = (budget.currentTokens / budget.maxTokens) * 100;

  return {
    valid: overBy === 0,
    overBy,
    utilizationPercent,
  };
}

/**
 * Throws if budget has required items that exceed limits
 *
 * @param budget - Budget to check
 * @throws ContextOverflowError if required items exceed budget
 */
export function assertRequiredItemsFit(budget: ContextBudget): void {
  const requiredItems = budget.items.filter(i => i.required);
  const requiredTokens = requiredItems.reduce((sum, i) => sum + i.estimatedTokens, 0);

  if (requiredTokens > budget.maxTokens) {
    throw new ContextOverflowError(
      `Required items (${requiredTokens} tokens) exceed budget (${budget.maxTokens} tokens). ` +
        `Consider using smaller chapter plots or splitting content.`,
      requiredTokens,
      budget.maxTokens,
      requiredItems
    );
  }
}
