/**
 * Tiered Context Assembly Engine
 *
 * Implements hot/warm/cold tier assignment and budget enforcement
 * with sandwich pattern for exemplar placement.
 *
 * LOCKED DECISION: Character profiles are NEVER compressed.
 * All scene characters get full ~2000 tokens regardless of budget pressure.
 */

import type {
  ContextItem,
  ContextType,
  ContextTier,
  TierBudget,
  TieredContextBundle,
  ItemMetadata,
  SandwichSplit,
} from './types.js';
import { DEFAULT_TIER_BUDGET } from './types.js';
import { getPriority } from './priorities.js';
import { estimateTokens } from './estimator.js';

// ============================================================================
// Constants
// ============================================================================

/** Number of chapters in the warm tier sliding window */
const WARM_WINDOW_CHAPTERS = 5;

// ============================================================================
// Tier Assignment
// ============================================================================

/**
 * Assigns a context item to a tier based on its type and metadata
 *
 * Hot tier (highest attention):
 * - exemplar: style exemplars
 * - scene_plan: current scene plan
 * - emotional_directive: emotional arc directives
 * - character: when appearsInCurrentScene is true
 *
 * Warm tier (narrative continuity):
 * - summary: within 5-chapter window
 * - relationship_state: active relationships
 * - foreshadowing: when isActive is true
 * - plot: chapter plot
 * - style: style guide
 *
 * Cold tier (reference):
 * - world: locations, settings
 * - act_summary: act-level summaries
 * - character: when not in current scene
 * - foreshadowing: when not active
 * - summary: outside 5-chapter window
 *
 * @param type - The context type
 * @param metadata - Item metadata including current chapter info
 * @returns The assigned tier
 */
export function assignTier(type: ContextType, metadata: ItemMetadata): ContextTier {
  // Hot tier: scene-critical items
  if (type === 'exemplar') return 'hot';
  if (type === 'scene_plan') return 'hot';
  if (type === 'emotional_directive') return 'hot';

  // Character: hot if in current scene, cold otherwise
  if (type === 'character') {
    return metadata.appearsInCurrentScene ? 'hot' : 'cold';
  }

  // Warm tier: narrative continuity
  if (type === 'relationship_state') return 'warm';
  if (type === 'style') return 'warm';
  if (type === 'plot') return 'warm';

  // Summary: warm if within 5-chapter window, cold otherwise
  if (type === 'summary') {
    if (metadata.summaryChapter !== undefined) {
      const distance = metadata.currentChapter - metadata.summaryChapter;
      if (distance >= 1 && distance <= WARM_WINDOW_CHAPTERS) {
        return 'warm';
      }
    }
    return 'cold';
  }

  // Foreshadowing: warm if active, cold otherwise
  if (type === 'foreshadowing') {
    return metadata.isActive ? 'warm' : 'cold';
  }

  // Cold tier: reference material
  if (type === 'world') return 'cold';
  if (type === 'act_summary') return 'cold';

  // Default to cold for unknown types
  return 'cold';
}

// ============================================================================
// Tiered Assembly
// ============================================================================

/**
 * Internal item with tier and priority for sorting
 */
interface TieredItem {
  item: ContextItem;
  tier: ContextTier;
  priority: number;
}

/**
 * Assembles a tiered context bundle from a flat list of context items
 *
 * CRITICAL: Character profiles are NEVER compressed or dropped.
 * If hot tier exceeds budget, we drop in this order:
 * 1. emotional_directive items (lowest priority first)
 * 2. relationship_state items promoted to hot
 * 3. Allow slight budget overshoot rather than compress characters
 *
 * @param items - Flat list of context items to assemble
 * @param metadata - Metadata for priority and tier calculations
 * @param budget - Optional partial budget override (merged with defaults)
 * @returns Tiered context bundle with sandwich split
 */
export function assembleTieredContext(
  items: ContextItem[],
  metadata: ItemMetadata,
  budget: Partial<TierBudget> = {}
): TieredContextBundle {
  // Merge with default budget
  const effectiveBudget: TierBudget = {
    ...DEFAULT_TIER_BUDGET,
    ...budget,
  };

  // Assign tiers and calculate priorities
  const tieredItems: TieredItem[] = items.map((item) => ({
    item,
    tier: assignTier(item.type, { ...metadata, ...item }),
    priority: getPriority(item.type, { ...metadata, ...item }),
  }));

  // Separate by tier
  const hotItems = tieredItems.filter((ti) => ti.tier === 'hot');
  const warmItems = tieredItems.filter((ti) => ti.tier === 'warm');
  const coldItems = tieredItems.filter((ti) => ti.tier === 'cold');

  // Sort each tier by priority descending
  hotItems.sort((a, b) => b.priority - a.priority);
  warmItems.sort((a, b) => b.priority - a.priority);
  coldItems.sort((a, b) => b.priority - a.priority);

  // Apply budget enforcement
  const finalHot = enforceHotBudget(hotItems, effectiveBudget.hot);
  const finalWarm = enforceWarmBudget(warmItems, effectiveBudget.warm, metadata.currentChapter);
  const finalCold = enforceColdBudget(coldItems, effectiveBudget.cold);

  // Build sandwich split
  const sandwichSplit = buildSandwichSplit(finalHot);

  // Calculate token breakdowns
  const hotTokens = calculateTierTokens(finalHot);
  const warmTokens = calculateTierTokens(finalWarm);
  const coldTokens = calculateTierTokens(finalCold);

  return {
    hot: finalHot.map((ti) => ti.item),
    warm: finalWarm.map((ti) => ti.item),
    cold: finalCold.map((ti) => ti.item),
    totalTokens: hotTokens + warmTokens + coldTokens,
    tierBreakdown: {
      hot: hotTokens,
      warm: warmTokens,
      cold: coldTokens,
    },
    sandwichSplit,
  };
}

// ============================================================================
// Budget Enforcement
// ============================================================================

/**
 * Calculates total tokens for a list of tiered items
 */
function calculateTierTokens(items: TieredItem[]): number {
  return items.reduce((sum, ti) => sum + ti.item.estimatedTokens, 0);
}

/**
 * Enforces hot tier budget by dropping non-essential items
 *
 * LOCKED DECISION: Characters are NEVER compressed or dropped.
 * Drop order:
 * 1. emotional_directive (lowest priority first)
 * 2. relationship_state promoted to hot
 * 3. Allow overshoot rather than touch characters
 */
function enforceHotBudget(items: TieredItem[], budget: number): TieredItem[] {
  let currentTokens = calculateTierTokens(items);

  if (currentTokens <= budget) {
    return items;
  }

  // Separate items by type for selective dropping
  const result: TieredItem[] = [];
  const emotionalDirectives: TieredItem[] = [];
  const relationshipStates: TieredItem[] = [];

  for (const ti of items) {
    if (ti.item.type === 'emotional_directive') {
      emotionalDirectives.push(ti);
    } else if (ti.item.type === 'relationship_state') {
      relationshipStates.push(ti);
    } else {
      // Characters, exemplars, scene_plan - never dropped
      result.push(ti);
    }
  }

  // Sort droppables by priority ascending (drop lowest first)
  emotionalDirectives.sort((a, b) => a.priority - b.priority);
  relationshipStates.sort((a, b) => a.priority - b.priority);

  // Drop emotional_directives first (lowest priority first)
  for (const ti of emotionalDirectives) {
    currentTokens = calculateTierTokens(result) +
      calculateTierTokens(emotionalDirectives.filter((ed) => ed !== ti)) +
      calculateTierTokens(relationshipStates);

    if (currentTokens <= budget) {
      // Add remaining emotional_directives (excluding the one we're dropping)
      result.push(...emotionalDirectives.filter((ed) => ed !== ti));
      result.push(...relationshipStates);
      return result.sort((a, b) => b.priority - a.priority);
    }
  }

  // All emotional_directives dropped, now try relationship_states
  for (const ti of relationshipStates) {
    currentTokens = calculateTierTokens(result) +
      calculateTierTokens(relationshipStates.filter((rs) => rs !== ti));

    if (currentTokens <= budget) {
      result.push(...relationshipStates.filter((rs) => rs !== ti));
      return result.sort((a, b) => b.priority - a.priority);
    }
  }

  // All droppables dropped, still over budget
  // LOCKED DECISION: Allow slight overshoot rather than compress characters
  // Log warning but keep all characters and exemplars intact
  const finalTokens = calculateTierTokens(result);
  if (finalTokens > budget) {
    console.warn(
      `[tiers] Hot tier over budget: ${finalTokens}/${budget} tokens. ` +
      `Keeping all characters and exemplars intact per locked decision.`
    );
  }

  return result.sort((a, b) => b.priority - a.priority);
}

/**
 * Enforces warm tier budget by dropping lowest priority items
 * Summaries outside 5-chapter window should already be in cold tier
 */
function enforceWarmBudget(
  items: TieredItem[],
  budget: number,
  _currentChapter: number
): TieredItem[] {
  let currentTokens = calculateTierTokens(items);

  if (currentTokens <= budget) {
    return items;
  }

  // Sort by priority ascending to drop lowest first
  const sorted = [...items].sort((a, b) => a.priority - b.priority);
  const result: TieredItem[] = [];
  let resultTokens = 0;

  // Keep items from highest priority down until budget exceeded
  for (let i = sorted.length - 1; i >= 0; i--) {
    const ti = sorted[i];
    if (resultTokens + ti.item.estimatedTokens <= budget) {
      result.push(ti);
      resultTokens += ti.item.estimatedTokens;
    }
    // Drop items that don't fit
  }

  return result.sort((a, b) => b.priority - a.priority);
}

/**
 * Enforces cold tier budget by dropping lowest priority items
 */
function enforceColdBudget(items: TieredItem[], budget: number): TieredItem[] {
  let currentTokens = calculateTierTokens(items);

  if (currentTokens <= budget) {
    return items;
  }

  // Sort by priority ascending to drop lowest first
  const sorted = [...items].sort((a, b) => a.priority - b.priority);
  const result: TieredItem[] = [];
  let resultTokens = 0;

  // Keep items from highest priority down until budget exceeded
  for (let i = sorted.length - 1; i >= 0; i--) {
    const ti = sorted[i];
    if (resultTokens + ti.item.estimatedTokens <= budget) {
      result.push(ti);
      resultTokens += ti.item.estimatedTokens;
    }
  }

  return result.sort((a, b) => b.priority - a.priority);
}

// ============================================================================
// Sandwich Split
// ============================================================================

/**
 * Builds the sandwich split for hot tier items
 *
 * Sandwich pattern positions exemplars at BOTH beginning and end of prompt
 * to counter "lost in the middle" attention degradation.
 *
 * hotPrefix: scene_plan (always first) + first exemplar
 * hotSuffix: remaining exemplars + emotional_directive + character profiles
 */
function buildSandwichSplit(hotItems: TieredItem[]): SandwichSplit {
  const hotPrefix: ContextItem[] = [];
  const hotSuffix: ContextItem[] = [];

  // Find scene_plan (always first in prefix)
  const scenePlan = hotItems.find((ti) => ti.item.type === 'scene_plan');
  if (scenePlan) {
    hotPrefix.push(scenePlan.item);
  }

  // Find all exemplars
  const exemplars = hotItems.filter((ti) => ti.item.type === 'exemplar');

  // First exemplar goes to prefix (for beginning sandwich)
  if (exemplars.length > 0) {
    hotPrefix.push(exemplars[0].item);
  }

  // Remaining exemplars go to suffix (for end sandwich)
  for (let i = 1; i < exemplars.length; i++) {
    hotSuffix.push(exemplars[i].item);
  }

  // Emotional directives go to suffix
  const emotionalDirectives = hotItems.filter((ti) => ti.item.type === 'emotional_directive');
  for (const ti of emotionalDirectives) {
    hotSuffix.push(ti.item);
  }

  // Character profiles go to suffix
  const characters = hotItems.filter((ti) => ti.item.type === 'character');
  for (const ti of characters) {
    hotSuffix.push(ti.item);
  }

  return { hotPrefix, hotSuffix };
}

// ============================================================================
// Prompt Order Formatting
// ============================================================================

/**
 * Returns items in the prompt assembly order
 *
 * Order:
 * 1. hotPrefix (scene plan + exemplar 1) - beginning of prompt
 * 2. cold (reference material)
 * 3. warm (narrative continuity)
 * 4. hotSuffix (exemplars 2-3 + characters + emotional directive) - end of prompt
 *
 * This creates the "sandwich" pattern where exemplars appear at both ends.
 *
 * @param bundle - Tiered context bundle
 * @returns Items in prompt assembly order
 */
export function formatPromptOrder(bundle: TieredContextBundle): ContextItem[] {
  return [
    ...bundle.sandwichSplit.hotPrefix,
    ...bundle.cold,
    ...bundle.warm,
    ...bundle.sandwichSplit.hotSuffix,
  ];
}

// ============================================================================
// Statistics
// ============================================================================

/**
 * Returns a human-readable summary of tier statistics
 *
 * @param bundle - Tiered context bundle
 * @returns Formatted stats string
 */
export function getTierStats(bundle: TieredContextBundle): string {
  const { tierBreakdown, totalTokens } = bundle;
  const hotCount = bundle.hot.length;
  const warmCount = bundle.warm.length;
  const coldCount = bundle.cold.length;

  return (
    `Hot: ${tierBreakdown.hot}/${DEFAULT_TIER_BUDGET.hot} tokens (${hotCount} items) | ` +
    `Warm: ${tierBreakdown.warm}/${DEFAULT_TIER_BUDGET.warm} (${warmCount} items) | ` +
    `Cold: ${tierBreakdown.cold}/${DEFAULT_TIER_BUDGET.cold} (${coldCount} items) | ` +
    `Total: ${totalTokens}/80000`
  );
}
