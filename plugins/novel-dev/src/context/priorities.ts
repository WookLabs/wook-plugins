/**
 * Priority Calculation Module
 *
 * Calculates dynamic priorities for context items based on their type
 * and relevance to the current writing context.
 */

import { ContextType, ItemMetadata } from './types.js';

// ============================================================================
// Base Priorities
// ============================================================================

/**
 * Base priority values for each context type (1-10 scale)
 * Higher values indicate higher priority
 */
export const basePriority: Record<ContextType, number> = {
  style: 10,           // Style guide is always required
  plot: 9,             // Current chapter plot is essential
  summary: 8,          // Recent summaries provide continuity
  character: 7,        // Character profiles for consistency
  world: 6,            // World/location details
  foreshadowing: 5,    // Active foreshadowing elements
  act_summary: 4,      // Act-level summaries for big picture
};

/**
 * Required status by context type
 * Some types are always required, others are optional
 */
export const requiredByType: Record<ContextType, boolean> = {
  style: true,         // Always required
  plot: true,          // Current chapter plot always required
  summary: false,      // Can be dropped if far from current
  character: false,    // Only appearing characters required
  world: false,        // Can be dropped if not used
  foreshadowing: false,// Can be dropped if not active
  act_summary: false,  // Optional context
};

// ============================================================================
// Priority Calculation
// ============================================================================

/**
 * Calculates the dynamic priority for a context item
 *
 * Priority adjustments based on:
 * - Summary: Higher priority for more recent chapters
 * - Character: Higher priority if appearing in current chapter
 * - Foreshadowing: Higher priority if payoff in current chapter
 *
 * @param type - The context type
 * @param metadata - Metadata about the item and current context
 * @returns Calculated priority (1-10)
 *
 * @example
 * ```typescript
 * // Summary from previous chapter gets high priority
 * getPriority('summary', { currentChapter: 10, summaryChapter: 9 }); // 9
 *
 * // Character appearing in current chapter
 * getPriority('character', { currentChapter: 10, appearsInCurrentChapter: true }); // 8
 * ```
 */
export function getPriority(type: ContextType, metadata: ItemMetadata): number {
  let priority = basePriority[type];

  // Adjust summary priority based on distance from current chapter
  if (type === 'summary' && metadata.summaryChapter !== undefined) {
    const distance = metadata.currentChapter - metadata.summaryChapter;

    if (distance === 1) {
      // Previous chapter summary - highest priority
      priority = 9;
    } else if (distance === 2) {
      // 2 chapters ago
      priority = 7;
    } else if (distance === 3) {
      // 3 chapters ago
      priority = 5;
    } else if (distance <= 5) {
      // 4-5 chapters ago
      priority = 3;
    } else {
      // More than 5 chapters ago - low priority
      priority = 2;
    }
  }

  // Adjust character priority based on appearance
  if (type === 'character') {
    if (metadata.appearsInCurrentChapter) {
      // Character appears in current chapter - high priority
      priority = 8;
    } else {
      // Non-appearing character - low priority
      priority = 2;
    }
  }

  // Adjust foreshadowing priority based on payoff timing
  if (type === 'foreshadowing') {
    if (metadata.payoffChapter === metadata.currentChapter) {
      // Foreshadowing pays off in current chapter - highest priority
      priority = 9;
    } else if (
      metadata.payoffChapter !== undefined &&
      metadata.payoffChapter > metadata.currentChapter &&
      metadata.payoffChapter <= metadata.currentChapter + 3
    ) {
      // Payoff coming soon (within 3 chapters)
      priority = 7;
    } else {
      // Distant payoff or already paid
      priority = 4;
    }
  }

  // Adjust world priority based on location usage
  if (type === 'world') {
    if (metadata.appearsInCurrentChapter) {
      priority = 7;
    } else {
      priority = 3;
    }
  }

  // Adjust act_summary priority based on act boundary proximity
  if (type === 'act_summary') {
    // Higher priority at act transitions
    const isActBoundary = metadata.currentChapter !== undefined &&
      (metadata.currentChapter % 10 === 0 || metadata.currentChapter % 10 === 1);

    if (isActBoundary) {
      priority = 6;
    }
  }

  return priority;
}

/**
 * Determines if a context item should be marked as required
 *
 * @param type - The context type
 * @param metadata - Item metadata
 * @returns Whether the item is required
 */
export function isRequired(type: ContextType, metadata: ItemMetadata): boolean {
  // Base required status
  let required = requiredByType[type];

  // Characters appearing in current chapter become required
  if (type === 'character' && metadata.appearsInCurrentChapter) {
    required = true;
  }

  // Foreshadowing with payoff in current chapter is required
  if (type === 'foreshadowing' && metadata.payoffChapter === metadata.currentChapter) {
    required = true;
  }

  return required;
}

// ============================================================================
// Priority Sorting
// ============================================================================

/**
 * Compares two items for sorting by priority
 * Required items always come first, then sorted by priority descending
 *
 * @param a - First item
 * @param b - Second item
 * @returns Comparison result for sorting
 */
export function comparePriority(
  a: { priority: number; required: boolean },
  b: { priority: number; required: boolean }
): number {
  // Required items come first
  if (a.required !== b.required) {
    return a.required ? -1 : 1;
  }

  // Then sort by priority (descending)
  return b.priority - a.priority;
}

/**
 * Sorts an array of items by priority
 *
 * @param items - Items to sort
 * @returns Sorted array (original not modified)
 */
export function sortByPriority<T extends { priority: number; required: boolean }>(
  items: T[]
): T[] {
  return [...items].sort(comparePriority);
}

// ============================================================================
// Priority Thresholds
// ============================================================================

/**
 * Priority thresholds for overflow handling
 */
export const PRIORITY_THRESHOLDS = {
  /** Minimum priority for Level 1 retention */
  LEVEL_1_MIN: 5,

  /** Minimum priority for Level 2 retention (compressed) */
  LEVEL_2_MIN: 3,

  /** Priority below which items can be freely dropped */
  DROPPABLE: 3,
};

/**
 * Gets items that can be safely dropped (low priority, not required)
 *
 * @param items - Items to filter
 * @param threshold - Priority threshold (items below this can be dropped)
 * @returns Array of droppable items sorted by priority ascending
 */
export function getDroppableItems<T extends { priority: number; required: boolean }>(
  items: T[],
  threshold: number = PRIORITY_THRESHOLDS.DROPPABLE
): T[] {
  return items
    .filter(item => !item.required && item.priority < threshold)
    .sort((a, b) => a.priority - b.priority);
}

/**
 * Calculates total priority score for a set of items
 * Useful for comparing context configurations
 *
 * @param items - Items to score
 * @returns Total priority score
 */
export function calculateTotalPriority<T extends { priority: number }>(items: T[]): number {
  return items.reduce((sum, item) => sum + item.priority, 0);
}
