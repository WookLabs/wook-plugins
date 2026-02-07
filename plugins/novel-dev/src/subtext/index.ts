/**
 * Subtext Module
 *
 * Emotional subtext engine for dialogue analysis and improvement.
 *
 * Key features:
 * - SubtextAnnotation: Capture hidden emotions beneath surface dialogue
 * - EmotionLayer: Multi-level emotion analysis (primary, deeper, deepest)
 * - PhysicalManifestations: Body language, action beats, vocal cues
 * - Flat dialogue detection: Find on-the-nose dialogue needing subtext
 *
 * Usage:
 * ```typescript
 * import { annotateDialogueSubtext, detectFlatDialogue, buildSubtextPrompt } from './subtext';
 *
 * // Annotate a specific dialogue
 * const result = await annotateDialogueSubtext(dialogue, context);
 *
 * // Find flat dialogues in chapter
 * const flatDialogues = detectFlatDialogue(chapterContent);
 *
 * // Build analysis prompt for LLM
 * const prompt = buildSubtextPrompt(dialogue, speaker, listener, relationship, context);
 * ```
 *
 * @module subtext
 */

// ============================================================================
// Type Exports
// ============================================================================

export type {
  // Core types
  EmotionLayer,
  PhysicalManifestations,
  NarrativeFunction,
  SubtextAnnotation,

  // Context types
  SubtextCharacter,
  RelationshipDynamic,
  SubtextContext,

  // Detection types
  FlatDialogueLocation,

  // Result types
  SubtextAnalysisResult,
} from './types.js';

// ============================================================================
// Function Exports
// ============================================================================

export {
  // Main functions
  annotateDialogueSubtext,
  detectFlatDialogue,
  shouldHaveSubtext,

  // Utility functions
  getEmotionalWords,
  containsDirectEmotion,

  // Prompt building
  buildSubtextPrompt,
} from './subtext-engine.js';

// ============================================================================
// Prompt Builder Exports
// ============================================================================

export {
  buildFlatDialogueDetectionPrompt,
  buildSubtextSuggestionPrompt,
} from './subtext-prompts.js';

export type {
  DialogueForAnalysis,
  SpeakerInfo,
  ListenerInfo,
  RelationshipInfo,
  ContextInfo,
} from './subtext-prompts.js';
