/**
 * Quality Module
 *
 * Multi-stage revision pipeline for progressive prose improvement.
 *
 * The 4-stage approach:
 * 1. Draft: Fix structural issues (scenes, beats, transitions)
 * 2. Tone: Align emotional arc (mood, subtext, voice)
 * 3. Style: Polish prose craft (filter words, rhythm, texture)
 * 4. Final: Proofread (grammar, honorifics, punctuation)
 *
 * @module quality
 */

// ============================================================================
// Type Exports
// ============================================================================

export type {
  RevisionStageName,
  StageEvaluator,
  RevisionStage,
  StageResult,
  MultiStageResult,
  MultiStageOptions,
} from './types.js';

export {
  DRAFT_DIRECTIVE_TYPES,
  TONE_DIRECTIVE_TYPES,
  STYLE_DIRECTIVE_TYPES,
  FINAL_DIRECTIVE_TYPES,
} from './types.js';

// ============================================================================
// Stage Evaluator Exports
// ============================================================================

export {
  DraftStageEvaluator,
  ToneStageEvaluator,
  StyleStageEvaluator,
  FinalStageEvaluator,
  STAGE_EVALUATORS,
} from './stage-evaluators.js';

// ============================================================================
// Revision Stage Exports
// ============================================================================

export {
  REVISION_STAGES,
  runMultiStageRevision,
} from './revision-stages.js';
