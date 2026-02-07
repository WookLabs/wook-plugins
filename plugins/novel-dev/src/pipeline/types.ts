/**
 * Pipeline Type Definitions
 *
 * Types for the scene-based writing pipeline including:
 * - Surgical directives (Quality Oracle -> Prose Surgeon communication)
 * - Scene writer configuration and results
 * - Assembly types for scene combination
 * - Quality Oracle result types
 */

// ============================================================================
// Directive Types (Quality Oracle -> Prose Surgeon)
// ============================================================================

/**
 * Types of surgical directives for prose revision
 *
 * Each directive type targets a specific prose quality issue:
 * - show-not-tell: Emotional telling -> physical showing
 * - filter-word-removal: Remove filter words (느꼈다, 보였다, 생각했다)
 * - sensory-enrichment: Add missing senses (2+ per 500 chars required)
 * - rhythm-variation: Fix monotonous sentence structure
 * - dialogue-subtext: On-the-nose dialogue -> subtext
 * - cliche-replacement: Replace stock Korean AI phrases
 * - transition-smoothing: Abrupt scene transition
 * - voice-consistency: Character voice drift
 * - proofreading: Grammar, spacing, punctuation
 */
export type DirectiveType =
  | 'show-not-tell'
  | 'filter-word-removal'
  | 'sensory-enrichment'
  | 'rhythm-variation'
  | 'dialogue-subtext'
  | 'cliche-replacement'
  | 'transition-smoothing'
  | 'voice-consistency'
  | 'proofreading'
  // Korean specialization (Phase 3)
  | 'honorific-violation'
  | 'banned-expression'
  | 'texture-enrichment'
  // Advanced quality (Phase 4)
  | 'style-alignment'
  | 'subtext-injection'
  | 'voice-drift'
  | 'arc-alignment';

/**
 * Location of a passage within chapter content
 */
export interface PassageLocation {
  /** Scene number (1-indexed) */
  sceneNumber: number;
  /** Starting paragraph number (0-indexed) */
  paragraphStart: number;
  /** Ending paragraph number (0-indexed, inclusive) */
  paragraphEnd: number;
  /** Optional character offset within paragraph for precise targeting */
  characterOffset?: number;
}

/**
 * A surgical directive from Quality Oracle to Prose Surgeon
 *
 * Directives specify exactly what to fix and how, enabling
 * targeted revisions without full chapter rewrites.
 */
export interface SurgicalDirective {
  /** Unique identifier in format: dir_{type}_{NNN} */
  id: string;
  /** Type of prose quality issue */
  type: DirectiveType;
  /** Priority from 1 (highest) to 10 (lowest) */
  priority: number;
  /** Location of the problematic passage */
  location: PassageLocation;
  /** Specific description of the problem */
  issue: string;
  /** The current problematic text */
  currentText: string;
  /** Concrete instruction for fixing the issue */
  instruction: string;
  /** Reference exemplar ID from style library (optional) */
  exemplarId?: string;
  /** Actual exemplar text for context (optional) */
  exemplarContent?: string;
  /** Maximum number of paragraphs this fix should touch (1-5) */
  maxScope: number;
}

// ============================================================================
// Scene Writer Types
// ============================================================================

/**
 * Configuration for scene-by-scene writing
 */
export interface SceneWriterConfig {
  /** Maximum exemplars to inject per scene (default: 3, as 2 good + 1 anti) */
  maxExemplarsPerScene: number;
  /** Whether to include an anti-exemplar (default: true) */
  includeAntiExemplar: boolean;
  /** Enable chain-of-thought pre-writing (default: true) */
  chainOfThoughtEnabled: boolean;
  /** Target character count range for each scene */
  targetSceneLength: { min: number; max: number };
}

/**
 * Result of drafting a single scene
 */
export interface SceneDraftResult {
  /** Scene number (1-indexed) */
  sceneNumber: number;
  /** The drafted prose content */
  content: string;
  /** Estimated token count for the content */
  estimatedTokens: number;
  /** IDs of exemplars used for this scene draft */
  exemplarsUsed: string[];
  /** Chain-of-thought pre-writing output (discarded from final) */
  preWritingThoughts?: string;
}

// ============================================================================
// Assembly Types
// ============================================================================

/**
 * Types of transition gaps between scenes
 */
export type TransitionGapType = 'temporal' | 'spatial' | 'emotional';

/**
 * Severity of a transition gap
 */
export type TransitionSeverity = 'minor' | 'moderate' | 'severe';

/**
 * A gap detected between adjacent scenes
 */
export interface TransitionGap {
  /** Source scene number */
  fromScene: number;
  /** Target scene number */
  toScene: number;
  /** Type of the gap */
  gapType: TransitionGapType;
  /** Severity of the gap */
  severity: TransitionSeverity;
  /** Suggested bridge text to smooth the transition (optional) */
  suggestedBridge?: string;
}

/**
 * Result of assembling multiple scene drafts
 */
export interface AssemblyResult {
  /** Combined content from all scenes */
  assembledContent: string;
  /** Detected transition gaps between scenes */
  transitionGaps: TransitionGap[];
  /** Total character count of assembled content */
  totalCharacters: number;
  /** Character positions where scene breaks occur */
  sceneBreakPositions: number[];
}

// ============================================================================
// Quality Oracle Types
// ============================================================================

/**
 * Individual assessment dimensions
 */
export interface QualityAssessment {
  /** Prose quality score and analysis */
  proseQuality: {
    /** Score from 0-100 */
    score: number;
    /** Overall verdict */
    verdict: string;
    /** List of specific issues found */
    issues: string[];
  };
  /** Sensory grounding analysis */
  sensoryGrounding: {
    /** Score from 0-100 */
    score: number;
    /** Number of senses engaged */
    senseCount: number;
    /** Required minimum senses per 500 chars */
    required: number;
  };
  /** Filter word density analysis */
  filterWordDensity: {
    /** Total count of filter words */
    count: number;
    /** Density per thousand characters */
    perThousand: number;
    /** Maximum acceptable threshold */
    threshold: number;
  };
  /** Sentence rhythm variation analysis */
  rhythmVariation: {
    /** Score from 0-100 */
    score: number;
    /** Specific repetition patterns found */
    repetitionInstances: string[];
  };
  /** Character voice consistency analysis */
  characterVoice: {
    /** Score from 0-100 */
    score: number;
    /** Instances of voice drift */
    driftInstances: string[];
  };
  /** Scene transition quality analysis */
  transitionQuality: {
    /** Score from 0-100 */
    score: number;
    /** Specific transition issues */
    issues: string[];
  };
  /** Honorific consistency analysis (Korean-specific, optional) */
  honorificConsistency?: {
    /** Score from 0-100 */
    score: number;
    /** List of violation descriptions */
    violations: string[];
  };
  /** Korean texture analysis (의성어/의태어, optional) */
  koreanTexture?: {
    /** Score from 0-100 */
    score: number;
    /** Number of texture words found */
    textureCount: number;
    /** Texture words found */
    foundTextures: string[];
  };
}

/**
 * Result from Quality Oracle evaluation
 */
export interface QualityOracleResult {
  /** Final verdict: PASS or REVISE */
  verdict: 'PASS' | 'REVISE';
  /** Detailed assessment breakdown */
  assessment: QualityAssessment;
  /** Surgical directives for revision (only populated if verdict is REVISE) */
  directives: SurgicalDirective[];
  /** Qualitative reader experience feedback */
  readerExperience: string;
}

// ============================================================================
// Default Configuration
// ============================================================================

/**
 * Default scene writer configuration
 *
 * Based on RESEARCH.md guidance:
 * - 3 exemplars max (2 good + 1 anti) per RESEARCH.md
 * - 800-1500 char target per scene
 * - Chain-of-thought enabled for improved quality
 */
export const DEFAULT_SCENE_WRITER_CONFIG: SceneWriterConfig = {
  maxExemplarsPerScene: 3,
  includeAntiExemplar: true,
  chainOfThoughtEnabled: true,
  targetSceneLength: { min: 800, max: 1500 },
};
