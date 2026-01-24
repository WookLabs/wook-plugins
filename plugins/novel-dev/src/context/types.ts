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
  | 'style'           // style-guide.json
  | 'plot'            // chapter_N.json
  | 'summary'         // chapter summaries
  | 'character'       // character profiles
  | 'world'           // locations, world settings
  | 'foreshadowing'   // active foreshadowing
  | 'act_summary';    // act-level summary

/**
 * Content type for token estimation
 */
export type ContentType = 'korean' | 'json' | 'mixed';

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
}

/**
 * Default budget configuration values
 */
export const DEFAULT_BUDGET_CONFIG: Required<BudgetConfig> = {
  maxTokens: 80000,
  summaryDepth: 3,
  includeAllCharacters: false,
  includeAllForeshadowing: false,
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
