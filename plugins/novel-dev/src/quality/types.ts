/**
 * Multi-Stage Revision Types
 *
 * Types for the 4-stage revision pipeline:
 * - Draft stage: Structural issues (scene coverage, beat completion, transitions)
 * - Tone stage: Emotional alignment (mood consistency, arc alignment)
 * - Style stage: Craft polish (prose quality via existing analyzeChapter)
 * - Final stage: Proofreading (grammar, honorifics, punctuation)
 *
 * @module quality/types
 */

import type { SurgicalDirective, DirectiveType } from '../pipeline/types.js';
import type { AnalyzeChapterOptions } from '../pipeline/quality-oracle.js';
import type { Scene } from '../types.js';
import type { StyleProfile } from '../style-library/style-profile.js';
import type { SubtextAnnotation } from '../subtext/types.js';
import type { VoiceProfile } from '../voice/types.js';
import type { DialogueAttribution } from '../voice/types.js';

// ============================================================================
// Stage Names
// ============================================================================

/**
 * Names of the 4 revision stages in order
 */
export type RevisionStageName = 'draft' | 'tone' | 'style' | 'final';

// ============================================================================
// Stage Evaluator Interface
// ============================================================================

/**
 * Interface for stage-specific evaluators
 *
 * Each evaluator has:
 * - score(): Evaluate content quality for this stage (0-100)
 * - generateDirectives(): Produce stage-specific directives
 */
export interface StageEvaluator {
  /** Stage name */
  name: RevisionStageName;

  /**
   * Score content quality for this stage
   * @param content - Chapter content to evaluate
   * @param options - Evaluation options
   * @returns Score from 0-100
   */
  score(content: string, options?: MultiStageOptions): Promise<number>;

  /**
   * Generate directives for this stage
   * @param content - Chapter content to analyze
   * @param options - Analysis options
   * @returns Array of surgical directives
   */
  generateDirectives(content: string, options?: MultiStageOptions): Promise<SurgicalDirective[]>;
}

// ============================================================================
// Revision Stage Configuration
// ============================================================================

/**
 * Configuration for a single revision stage
 */
export interface RevisionStage {
  /** Stage name */
  name: RevisionStageName;

  /** Evaluator for this stage */
  evaluator: StageEvaluator;

  /**
   * Directive types this stage processes
   * Other directive types are filtered out during this stage
   */
  directiveTypes: DirectiveType[];

  /**
   * Model configuration for this stage
   */
  modelConfig: {
    model: 'opus' | 'sonnet';
    temperature: number;
  };

  /** Maximum iterations for this stage */
  maxIterations: number;

  /** Score threshold to pass this stage (0-100) */
  passThreshold: number;
}

// ============================================================================
// Stage Result Types
// ============================================================================

/**
 * Result from a single stage execution
 */
export interface StageResult {
  /** Stage name */
  stage: RevisionStageName;

  /** Score before this stage ran */
  inputScore: number;

  /** Score after this stage ran */
  outputScore: number;

  /** Improvement from this stage (outputScore - inputScore) */
  improvement: number;

  /** Number of directives processed in this stage */
  directivesProcessed: number;

  /** Number of iterations used */
  iterations: number;

  /** Whether this stage passed its threshold */
  passed: boolean;
}

/**
 * Result from the complete multi-stage revision pipeline
 */
export interface MultiStageResult {
  /** Final revised content */
  finalContent: string;

  /** Results from each stage */
  stageResults: StageResult[];

  /**
   * Total improvement across all stages
   * Calculated as final score - initial score
   */
  totalImprovement: number;

  /** Whether all stages passed their thresholds */
  passedAllStages: boolean;

  /** Total duration in milliseconds */
  durationMs?: number;
}

// ============================================================================
// Multi-Stage Options
// ============================================================================

/**
 * Extended options for multi-stage revision
 * Extends AnalyzeChapterOptions with Phase 4 additions
 */
export interface MultiStageOptions extends AnalyzeChapterOptions {
  /** Scenes in the chapter for structural analysis */
  scenes?: Scene[];

  /**
   * Reference style profile for style alignment
   * Phase 4 feature - use StyleProfile from style-library
   *
   * When provided, StyleStageEvaluator will:
   * - Compute style match against the profile
   * - Blend style score with prose quality (70% prose + 30% style)
   * - Generate 'style-alignment' directives for deviations
   */
  styleProfile?: StyleProfile;

  /**
   * Subtext annotations for dialogue analysis
   * Phase 4 feature - uses SubtextAnnotation from subtext module
   *
   * When provided, ToneStageEvaluator will:
   * - Check subtext coverage (target 30-40% of dialogue)
   * - Generate 'subtext-injection' directives for flat dialogue
   */
  subtextAnnotations?: SubtextAnnotation[];

  /**
   * Voice profiles for character consistency checking
   * Phase 4 feature - uses VoiceProfile from voice module
   *
   * When provided, ToneStageEvaluator will:
   * - Check voice consistency per character
   * - Generate 'voice-drift' directives for deviations
   */
  voiceProfiles?: VoiceProfile[];

  /**
   * Dialogue attributions mapping dialogue to characters
   * Required for voice consistency checking
   */
  voiceDialogueAttributions?: DialogueAttribution[];
}

// ============================================================================
// Directive Type Groups by Stage
// ============================================================================

/**
 * Directive types for Draft stage
 * Focus: Structural issues
 */
export const DRAFT_DIRECTIVE_TYPES: DirectiveType[] = [
  'transition-smoothing',
  'show-not-tell',
];

/**
 * Directive types for Tone stage
 * Focus: Emotional alignment
 */
export const TONE_DIRECTIVE_TYPES: DirectiveType[] = [
  'dialogue-subtext',
  'voice-consistency',
  'arc-alignment',
];

/**
 * Directive types for Style stage
 * Focus: Prose craft polish
 */
export const STYLE_DIRECTIVE_TYPES: DirectiveType[] = [
  'filter-word-removal',
  'sensory-enrichment',
  'rhythm-variation',
  'cliche-replacement',
  'banned-expression',
  'texture-enrichment',
  'style-alignment',
  'subtext-injection',
  'voice-drift',
];

/**
 * Directive types for Final stage
 * Focus: Proofreading
 */
export const FINAL_DIRECTIVE_TYPES: DirectiveType[] = [
  'proofreading',
  'honorific-violation',
];
