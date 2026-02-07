/**
 * Scene Data Model Types
 *
 * SceneV5 extends the base Scene interface with enriched fields for
 * scene-based writing pipeline. Enables independent scene drafting
 * while maintaining narrative coherence.
 */

import { Scene, Pacing } from '../types.js';

// ============================================================================
// Component Interfaces
// ============================================================================

/**
 * Emotional trajectory within a scene
 */
export interface EmotionalArc {
  /** Character's emotional state entering the scene */
  entry_emotion: string;
  /** Character's emotional state leaving the scene */
  exit_emotion: string;
  /** Description of the emotional peak moment */
  peak_moment: string;
  /** Target tension level (1-10 scale) */
  tension_target: number;
}

/**
 * Foreshadowing elements mapped to a scene
 */
export interface SceneForeshadowing {
  /** Foreshadowing IDs to plant (fore_XXX format) */
  plant: string[];
  /** Foreshadowing IDs to pay off */
  payoff: string[];
  /** Foreshadowing IDs to hint at */
  hint: string[];
}

/**
 * Scene transition directives
 */
export interface SceneTransition {
  /** How this scene connects from the previous scene (or 'chapter opening' for first) */
  from_previous: string;
  /** How this scene connects to the next scene (or 'chapter ending hook' for last) */
  to_next: string;
}

/**
 * Scene-specific style overrides
 */
export interface SceneStyleOverride {
  /** Pacing directive for this scene */
  pacing: Pacing;
  /** Primary focus (e.g., action, dialogue, introspection) */
  focus: string;
  /** Specific tone for this scene */
  tone: string;
}

// ============================================================================
// SceneV5 Interface
// ============================================================================

/**
 * Enriched scene data model (V5)
 *
 * Extends the base Scene interface with POV, sensory anchors,
 * emotional arcs, foreshadowing mapping, and transition directives.
 * All new fields are optional for backward compatibility.
 */
export interface SceneV5 extends Scene {
  /** Character ID for scene point-of-view */
  pov_character: string;

  /** Required sensory details to ground the scene (at least 2) */
  sensory_anchors: string[];

  /** Emotional trajectory within the scene */
  emotional_arc: EmotionalArc;

  /** What dialogue must accomplish in this scene */
  dialogue_goals?: string[];

  /** Foreshadowing elements for this scene */
  foreshadowing: SceneForeshadowing;

  /** Scene transition directives */
  transition: SceneTransition;

  /** Scene-specific style overrides */
  style_override?: SceneStyleOverride;

  /** Tags for matching style exemplars */
  exemplar_tags?: string[];
}

// ============================================================================
// Decomposition Types
// ============================================================================

/**
 * Configuration for chapter decomposition
 */
export interface DecompositionConfig {
  /** Minimum characters per scene (scenes under this trigger merging) */
  min_scene_chars: number;
  /** Maximum scenes per chapter */
  max_scenes: number;
  /** Character threshold for merging (scenes under this with adjacent) */
  merge_threshold: number;
}

/**
 * Default decomposition configuration
 */
export const DEFAULT_DECOMPOSITION_CONFIG: DecompositionConfig = {
  min_scene_chars: 800,
  max_scenes: 5,
  merge_threshold: 600,
};

/**
 * Result of chapter decomposition into scenes
 */
export interface DecompositionResult {
  /** Enriched scene array */
  scenes: SceneV5[];
  /** Warnings generated during decomposition */
  warnings: string[];
  /** Number of beats in original chapter */
  original_beat_count: number;
}

// ============================================================================
// Validation Types
// ============================================================================

/**
 * Result of scene validation
 */
export interface ValidationResult {
  /** Whether all scenes are valid */
  valid: boolean;
  /** Critical errors that must be fixed */
  errors: string[];
  /** Non-critical warnings */
  warnings: string[];
}
