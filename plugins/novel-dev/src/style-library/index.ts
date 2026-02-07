/**
 * Style Library Module
 *
 * Public API for style exemplar storage, retrieval, classification,
 * and style profile analysis.
 *
 * @module style-library
 */

// ============================================================================
// Exemplar Types
// ============================================================================

export type {
  StyleExemplar,
  StyleLibrary,
  StyleLibraryMetadata,
  ExemplarCategory,
  ExemplarQuery,
  ExemplarResult,
  NewExemplarInput,
  SceneType,
  POV,
  PacingSpeed,
} from './types.js';

// ============================================================================
// Style Profile Types (Phase 4)
// ============================================================================

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

export {
  createStyleProfile,
  buildStyleConstraints,
} from './style-profile.js';

// ============================================================================
// Style Analyzer (Phase 4)
// ============================================================================

export {
  analyzeStyleFromReference,
  computeStyleMatch,
  computeTTR,
  computeMTLD,
  extractSentences,
  computeDialogueRatio,
  countSensoryWords,
  computeStylometrics,
  extractWords,
  extractDialogues,
  extractParagraphs,
  countDialogueTransitions,
} from './style-analyzer.js';

export type { AnalyzeStyleOptions } from './style-analyzer.js';

// ============================================================================
// Analysis Prompts (Phase 4)
// ============================================================================

export {
  buildQualitativeAnalysisPrompt,
  buildStyleComparisonPrompt,
  buildStyleInstructionPrompt,
  buildDeviationFeedbackPrompt,
} from './analysis-prompts.js';

// ============================================================================
// Storage Operations
// ============================================================================

export {
  loadLibrary,
  saveLibrary,
  addExemplar,
  removeExemplar,
  updateExemplar,
  findExemplarById,
} from './storage.js';

// ============================================================================
// Classification
// ============================================================================

export { classifyExemplar, extractLanguageFeatures } from './classifier.js';

// ============================================================================
// Retrieval
// ============================================================================

export { queryExemplars, getLibraryStats } from './retrieval.js';
