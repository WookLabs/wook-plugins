/**
 * Voice Module
 *
 * Character voice differentiation and consistency management.
 *
 * Key features:
 * - VoiceProfile: Complete character voice definition
 * - SpeechPatterns: Vocabulary, structure, habits, rhythm
 * - VoiceFingerprint: Quantitative metrics for comparison
 * - Voice consistency checking and drift detection
 *
 * Usage:
 * ```typescript
 * import {
 *   createVoiceProfile,
 *   updateVoiceProfile,
 *   analyzeVoiceConsistency,
 *   buildVoiceConstraintPrompt
 * } from './voice';
 *
 * // Create profile from description
 * const profile = createVoiceProfile('char_001', '김철수', '격식을 차리는 40대 남성');
 *
 * // Update profile from actual dialogue
 * const updated = updateVoiceProfile(profile, dialogueSamples);
 *
 * // Check consistency
 * const result = analyzeVoiceConsistency(content, 'char_001', profile, attributions);
 *
 * // Get generation constraints
 * const prompt = buildVoiceConstraintPrompt(profile);
 * ```
 *
 * @module voice
 */

// ============================================================================
// Type Exports
// ============================================================================

export type {
  // Speech pattern types
  SentenceStructure,
  VocabularyProfile,
  VerbalHabits,
  SpeechRhythm,
  SpeechPatterns,

  // Internal monologue types
  InternalMonologue,

  // Fingerprint types
  VoiceFingerprint,

  // Profile types
  HonorificDefault,
  LinguisticMarkers,
  VoiceProfile,

  // Deviation types
  VoiceAspect,
  DeviationSeverity,
  VoiceDeviation,

  // Result types
  VoiceConsistencyResult,

  // Attribution types
  DialogueAttribution,
} from './types.js';

// ============================================================================
// Character Voice Management Exports
// ============================================================================

export {
  createVoiceProfile,
  updateVoiceProfile,
  buildVoiceConstraintPrompt,
} from './character-voice.js';

// ============================================================================
// Voice Metrics Exports
// ============================================================================

export {
  computeVoiceFingerprint,
  analyzeDialogueSample,
  analyzeVoiceConsistency,
  checkVocabularyConsistency,
  checkVerbalHabits,
  checkSentenceStructure,
} from './voice-metrics.js';

// ============================================================================
// Voice Prompts Exports
// ============================================================================

export {
  buildVoiceAnalysisPrompt,
  buildVoiceGenerationPrompt,
} from './voice-prompts.js';

export type {
  CharacterInfoForAnalysis,
} from './voice-prompts.js';
