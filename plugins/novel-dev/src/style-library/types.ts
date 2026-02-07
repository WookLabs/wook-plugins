/**
 * Style Library Type Definitions
 *
 * TypeScript interfaces for the style exemplar storage and retrieval system.
 * These types mirror the JSON Schema at schemas/style-library.schema.json.
 */

// ============================================================================
// Scene Type Enum
// ============================================================================

/**
 * Scene type classification for exemplars
 */
export type SceneType =
  | 'opening-hook'
  | 'dialogue'
  | 'action'
  | 'emotional-peak'
  | 'transition'
  | 'description'
  | 'climax'
  | 'denouement';

/**
 * Point of view options
 */
export type POV = 'first-person' | 'third-limited' | 'third-omniscient';

/**
 * Pacing speed options
 */
export type PacingSpeed = 'fast' | 'medium' | 'slow';

// ============================================================================
// Style Exemplar
// ============================================================================

/**
 * A single style exemplar for few-shot learning.
 *
 * Exemplars are scene-length (500-1500 chars) prose samples that demonstrate
 * desired writing style. Anti-exemplars show what NOT to write.
 *
 * 14 fields total matching the JSON schema.
 */
export interface StyleExemplar {
  /** Unique identifier in format exm_{genre}_{NNN} */
  id: string;

  /** Scene-length prose content (500-2000 chars) */
  content: string;

  /** Genre tags (multi-genre tagging supported) */
  genre: string[];

  /** Primary scene type classification */
  scene_type: SceneType;

  /** Emotional dimension tags */
  emotional_tone?: string[];

  /** Narrative point of view */
  pov?: POV;

  /** Pacing speed */
  pacing?: PacingSpeed;

  /** True if this is an anti-exemplar (what NOT to write) */
  is_anti_exemplar: boolean;

  /** ID of the corresponding good exemplar (only for anti-exemplars) */
  anti_exemplar_pair?: string;

  /** Attribution or 'curated' for original content */
  source: string;

  /** Explanation of why this exemplar is good/bad */
  quality_notes?: string;

  /** Notable Korean language techniques used */
  language_features?: string[];

  /** ISO 8601 timestamp of creation */
  created_at?: string;
}

// ============================================================================
// Style Library
// ============================================================================

/**
 * Metadata about the style library
 */
export interface StyleLibraryMetadata {
  /** Schema version */
  version: string;

  /** Total number of exemplars in library */
  total_exemplars: number;

  /** List of genres covered by exemplars */
  genres_covered: string[];

  /** ISO 8601 timestamp of last update */
  last_updated: string;
}

/**
 * The complete style library structure
 */
export interface StyleLibrary {
  /** Collection of style exemplars */
  exemplars: StyleExemplar[];

  /** Library metadata and statistics */
  metadata: StyleLibraryMetadata;
}

// ============================================================================
// Exemplar Category (5-Dimension Taxonomy)
// ============================================================================

/**
 * The 5-dimension taxonomy for exemplar classification.
 *
 * Each dimension corresponds to a classification axis:
 * - genre: Content genre (romance, fantasy, etc.)
 * - scene_type: Scene function (dialogue, action, etc.)
 * - emotional_tone: Emotional quality (tension, warmth, etc.)
 * - pov: Point of view (first-person, third-limited, etc.)
 * - pacing: Rhythm speed (fast, medium, slow)
 */
export interface ExemplarCategory {
  /** Primary genre */
  genre: string;

  /** Scene type */
  scene_type: SceneType;

  /** Emotional tone */
  emotional_tone?: string;

  /** Point of view */
  pov?: POV;

  /** Pacing speed */
  pacing?: PacingSpeed;
}

// ============================================================================
// Query Types
// ============================================================================

/**
 * Query parameters for exemplar retrieval
 */
export interface ExemplarQuery {
  /** Required: Genre to match */
  genre: string;

  /** Required: Scene type to match */
  scene_type: SceneType;

  /** Optional: Emotional tone to prefer */
  emotional_tone?: string;

  /** Optional: POV to prefer */
  pov?: POV;

  /** Optional: Pacing to prefer */
  pacing?: PacingSpeed;

  /** Maximum number of exemplars to return (default: 3) */
  limit?: number;

  /** Whether to include an anti-exemplar (default: true) */
  include_anti?: boolean;
}

/**
 * Result of an exemplar query
 */
export interface ExemplarResult {
  /** Matched good exemplars (2-3 typically) */
  exemplars: StyleExemplar[];

  /** Optional anti-exemplar for contrast */
  anti_exemplar?: StyleExemplar;

  /** Total estimated tokens for all returned content */
  total_tokens: number;
}

// ============================================================================
// Storage Types
// ============================================================================

/**
 * Input for adding a new exemplar (id and created_at are auto-generated)
 */
export type NewExemplarInput = Omit<StyleExemplar, 'id' | 'created_at'>;

// ============================================================================
// Style Profile Re-exports (Phase 4 - Reference Style Learning)
// ============================================================================

/**
 * Re-export StyleProfile and related types from style-profile module.
 *
 * The canonical definitions live in style-profile.ts. These re-exports
 * provide convenient access through the main types module and satisfy
 * import patterns like `import { StyleProfile } from './types.js'`.
 */
export type {
  StyleProfile,
  Stylometrics,
  LexicalDiversity,
  SentenceStatistics,
  SentenceLengthDistribution,
  DialogueMetrics,
  SensoryMetrics,
  RhythmPatterns,
  SenseType,
  QualitativePatterns,
  NarrativeVoice,
  PaceDescriptor,
  DialogueStyle,
  StyleConstraint,
  StyleConstraintAspect,
  StyleMatchResult,
  StyleAspectScores,
  StyleDeviation,
  DeviationSeverity,
} from './style-profile.js';

/**
 * StyleMetrics is an alias for Stylometrics (the comprehensive metric set).
 * Provides backward compatibility with the planned interface name.
 */
export type { Stylometrics as StyleMetrics } from './style-profile.js';

// ============================================================================
// Style Match Options
// ============================================================================

/**
 * Options for style matching behavior
 */
export interface StyleMatchOptions {
  /** Reference style profile to match against */
  referenceProfile?: import('./style-profile.js').StyleProfile;
  /** Tolerance overrides for metric comparisons */
  tolerances?: {
    /** Default: 0.3 - How much sentence length can deviate */
    sentenceLengthVariance: number;
    /** Default: 0.1 - How much vocabulary complexity can deviate */
    vocabularyComplexity: number;
    /** Default: 0.1 - How much dialogue ratio can deviate */
    dialogueRatioTolerance: number;
  };
}
