/**
 * Pipeline Module
 *
 * Scene-based writing pipeline for decomposed chapter composition.
 *
 * This module provides:
 * - Types for surgical directives (Quality Oracle -> Prose Surgeon)
 * - Scene writer orchestration with exemplar injection
 * - Scene assembly with transition gap detection
 *
 * @module pipeline
 *
 * @example
 * ```typescript
 * import {
 *   prepareChapterScenes,
 *   assembleScenesWithGaps,
 *   validateAssembly,
 *   DEFAULT_SCENE_WRITER_CONFIG,
 * } from './pipeline';
 *
 * // Prepare contexts for all scenes in a chapter
 * const contexts = prepareChapterScenes(
 *   scenes,
 *   chapterNumber,
 *   styleLibrary,
 *   baseContextItems,
 *   metadata
 * );
 *
 * // After drafting each scene with LLM, assemble
 * const result = assembleScenesWithGaps(scenes, drafts);
 *
 * // Validate the assembly
 * const validation = validateAssembly(result, scenes.length);
 * ```
 */

// ============================================================================
// Type Exports
// ============================================================================

export type {
  // Directive types
  DirectiveType,
  PassageLocation,
  SurgicalDirective,
  // Scene writer types
  SceneWriterConfig,
  SceneDraftResult,
  // Assembly types
  TransitionGapType,
  TransitionSeverity,
  TransitionGap,
  AssemblyResult,
  // Quality oracle types
  QualityAssessment,
  QualityOracleResult,
} from './types.js';

export { DEFAULT_SCENE_WRITER_CONFIG } from './types.js';

// ============================================================================
// Scene Writer Exports
// ============================================================================

export type {
  SceneDraftContext,
  ChapterSceneContexts,
} from './scene-writer.js';

export {
  // Main functions
  prepareSceneDraft,
  prepareChapterScenes,
  createSceneDraftResult,
  // Utility functions
  mapSceneTypeFromTags,
  buildExemplarQuery,
  buildSceneContextItems,
  extractEnding,
} from './scene-writer.js';

// ============================================================================
// Assembler Exports
// ============================================================================

export type { AssemblyValidation } from './assembler.js';

export {
  // Main functions
  assembleScenes,
  assembleScenesWithGaps,
  detectTransitionGaps,
  validateAssembly,
} from './assembler.js';

// ============================================================================
// Quality Oracle Exports
// ============================================================================

export {
  // Constants
  FILTER_WORDS,
  SENSORY_CATEGORIES,
  MAX_DIRECTIVES_PER_PASS,
  MIN_SENSES_PER_500_CHARS,
  MAX_CONSECUTIVE_SAME_ENDINGS,
  SENTENCE_ENDING_PATTERNS,
  // ID generation
  resetDirectiveCounter,
  generateDirectiveId,
  // Detection functions
  countFilterWords,
  getFilterWordsOutsideDialogue,
  countUniqueSenses,
  assessSensoryGrounding,
  findRhythmIssues,
  // Paragraph utilities
  getParagraphs,
  findParagraphForPosition,
  // Directive creation
  createDirective,
  // Main analysis
  analyzeChapter,
  analyzeAndReport,
} from './quality-oracle.js';

// ============================================================================
// Prose Surgeon Exports
// ============================================================================

export type {
  SurgicalFixResult,
  DirectiveExecutionRecord,
  SurgeonCallback,
} from './prose-surgeon.js';

export {
  // Constants
  MODEL_ROUTING,
  MAX_SCOPE_LIMITS,
  ABSOLUTE_MAX_SCOPE,
  CIRCUIT_BREAKER_THRESHOLD,
  // Validation functions
  validateScopeCompliance,
  validateSurgeonOutput,
  // Paragraph utilities
  splitIntoParagraphs,
  joinParagraphs,
  extractTargetParagraphs,
  // Fix application
  applySurgicalFix,
  // Prompt building
  buildSurgeonPrompt,
  // Execution
  executeDirective,
  shouldCircuitBreak,
  getModelRouting,
} from './prose-surgeon.js';

// ============================================================================
// Revision Loop Exports
// ============================================================================

export type {
  RevisionLoopConfig,
  RevisionIterationSummary,
  RevisionLoopResult,
} from './revision-loop.js';

export {
  // Default config
  DEFAULT_REVISION_LOOP_CONFIG,
  // Main orchestration
  runRevisionLoop,
  // Testing helpers
  analyzeAndReport as analyzeAndReportSync,
  createPassthroughCallback,
  createSimpleFixCallback,
  // Metrics
  calculateLoopMetrics,
  getFailedDirectiveTypes,
} from './revision-loop.js';
