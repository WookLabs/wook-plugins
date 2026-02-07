/**
 * Context Budget System Type Definitions
 *
 * Manages token budget for loading novel context files.
 * Ensures context stays within LLM token limits.
 */

// ============================================================================
// Context Types
// ============================================================================

/**
 * Types of context that can be loaded for novel generation
 */
export type ContextType =
  | 'style'               // style-guide.json
  | 'plot'                // chapter_N.json
  | 'summary'             // chapter summaries
  | 'character'           // character profiles
  | 'world'               // locations, world settings
  | 'foreshadowing'       // active foreshadowing
  | 'act_summary'         // act-level summary
  // V5 context types for tiered assembly
  | 'exemplar'            // style exemplars (hot tier)
  | 'scene_plan'          // current scene plan (hot tier)
  | 'emotional_directive' // emotional arc directives (hot tier)
  | 'relationship_state'; // active relationship dynamics (warm tier)

/**
 * Content type for token estimation
 */
export type ContentType = 'korean' | 'json' | 'mixed';

// ============================================================================
// V5 Tiered Context Types
// ============================================================================

/**
 * Context tier assignment for tiered assembly
 * - hot: Maximum attention items (scene plan, exemplars, characters)
 * - warm: Narrative continuity (5-chapter window, foreshadowing)
 * - cold: Reference material (world, distant content)
 */
export type ContextTier = 'hot' | 'warm' | 'cold';

/**
 * Token budget allocation per tier
 */
export interface TierBudget {
  /** Hot tier budget (scene plan, exemplars, characters) */
  hot: number;
  /** Warm tier budget (5-chapter window, active foreshadowing) */
  warm: number;
  /** Cold tier budget (reference material) */
  cold: number;
}

/**
 * Default token budget per tier
 * - Hot: 15K for scene essentials (plan, exemplars, characters)
 * - Warm: 25K for narrative continuity (5-chapter summaries, relationships)
 * - Cold: 40K for reference material (world, distant history)
 */
export const DEFAULT_TIER_BUDGET: TierBudget = {
  hot: 15000,
  warm: 25000,
  cold: 40000,
};

/**
 * Sandwich split for hot tier items
 * Positions exemplars at both beginning and end of prompt
 * to counter "lost in the middle" attention degradation
 */
export interface SandwichSplit {
  /** Items placed at prompt beginning (scene plan + first exemplar) */
  hotPrefix: ContextItem[];
  /** Items placed after warm/cold (remaining exemplars + characters + emotional directives) */
  hotSuffix: ContextItem[];
}

/**
 * Result of tiered context assembly
 */
export interface TieredContextBundle {
  /** Hot tier items (scene plan, exemplars, characters) */
  hot: ContextItem[];
  /** Warm tier items (5-chapter summaries, relationships, active foreshadowing) */
  warm: ContextItem[];
  /** Cold tier items (world, distant history) */
  cold: ContextItem[];
  /** Total estimated token count across all tiers */
  totalTokens: number;
  /** Token breakdown by tier */
  tierBreakdown: Record<ContextTier, number>;
  /** Sandwich split for prompt assembly */
  sandwichSplit: SandwichSplit;
}

// ============================================================================
// Context Item
// ============================================================================

/**
 * Represents a single item in the context budget
 */
export interface ContextItem {
  /** Unique identifier for the context item */
  id: string;

  /** Type of context */
  type: ContextType;

  /** File path to the context file */
  path: string;

  /** Loaded content (lazy loaded) */
  content?: string;

  /** Estimated token count */
  estimatedTokens: number;

  /** Priority level (1-10, higher is more important) */
  priority: number;

  /** Whether this item is required (cannot be dropped) */
  required: boolean;
}

// ============================================================================
// Context Budget
// ============================================================================

/**
 * Represents the overall context budget state
 */
export interface ContextBudget {
  /** Maximum allowed tokens (default: 80,000) */
  maxTokens: number;

  /** Currently used tokens */
  currentTokens: number;

  /** Items included in the budget */
  items: ContextItem[];

  /** Items excluded due to budget overflow */
  overflow: ContextItem[];
}

// ============================================================================
// Item Metadata
// ============================================================================

/**
 * Metadata used for calculating dynamic priorities
 */
export interface ItemMetadata {
  /** Current chapter being written */
  currentChapter: number;

  /** Chapter number this summary is for (for summary type) */
  summaryChapter?: number;

  /** Whether the character appears in the current chapter */
  appearsInCurrentChapter?: boolean;

  /** Chapter where foreshadowing pays off */
  payoffChapter?: number;

  // V5 metadata fields for tiered assembly

  /** Whether character/item appears in the current scene (more specific than chapter) */
  appearsInCurrentScene?: boolean;

  /** Whether foreshadowing/relationship is currently active */
  isActive?: boolean;

  /** Whether this is the POV character (for character budget priority) */
  isPovCharacter?: boolean;

  /** Whether scene has emotional_arc defined (for emotional_directive priority) */
  hasEmotionalArc?: boolean;

  /** Whether characters have evolving relationship in current chapter */
  hasEvolvingRelationship?: boolean;

  /** Additional metadata for specific context types */
  [key: string]: unknown;
}

// ============================================================================
// Budget Configuration
// ============================================================================

/**
 * Configuration options for the context budget system
 */
export interface BudgetConfig {
  /** Maximum token budget (default: 80,000) */
  maxTokens?: number;

  /** Number of previous chapter summaries to include */
  summaryDepth?: number;

  /** Whether to include non-appearing characters */
  includeAllCharacters?: boolean;

  /** Whether to include all foreshadowing or only active ones */
  includeAllForeshadowing?: boolean;

  /** Number of chapters per act (default: 10) */
  chaptersPerAct?: number;
}

/**
 * Default budget configuration values
 */
export const DEFAULT_BUDGET_CONFIG: Required<BudgetConfig> = {
  maxTokens: 80000,
  summaryDepth: 3,
  includeAllCharacters: false,
  includeAllForeshadowing: false,
  chaptersPerAct: 10,
};

// ============================================================================
// Error Types
// ============================================================================

/**
 * Error thrown when context budget is exceeded by required items
 */
export class ContextOverflowError extends Error {
  constructor(
    message: string,
    public readonly requiredTokens: number,
    public readonly availableTokens: number,
    public readonly overflowItems: ContextItem[]
  ) {
    super(message);
    this.name = 'ContextOverflowError';
  }
}

// ============================================================================
// Loader Types
// ============================================================================

/**
 * Result of loading context with budget management
 */
export interface LoadContextResult {
  /** The loaded context budget */
  budget: ContextBudget;

  /** Warnings generated during loading */
  warnings: string[];

  /** Statistics about the loading process */
  stats: LoadingStats;
}

/**
 * Statistics from the context loading process
 */
export interface LoadingStats {
  /** Total candidates considered */
  totalCandidates: number;

  /** Items successfully loaded */
  loadedItems: number;

  /** Items excluded due to budget */
  excludedItems: number;

  /** Time taken to load in milliseconds */
  loadTimeMs: number;

  /** Token usage by type */
  tokensByType: Record<ContextType, number>;
}
