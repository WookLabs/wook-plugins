/**
 * Voice Types
 *
 * Type definitions for character voice differentiation:
 * - SpeechPatterns: Vocabulary, structure, habits
 * - VoiceFingerprint: Quantitative voice metrics
 * - VoiceProfile: Complete character voice definition
 * - VoiceConsistencyResult: Voice drift analysis
 *
 * @module voice/types
 */

// ============================================================================
// Speech Pattern Types
// ============================================================================

/**
 * Sentence structure preferences
 */
export interface SentenceStructure {
  /** Preferred sentence length */
  preferredLength: 'short' | 'medium' | 'long' | 'varied';

  /** Complexity level of sentence construction */
  complexityLevel: 'simple' | 'moderate' | 'complex';

  /** Use of sentence fragments */
  fragmentUsage: 'never' | 'rare' | 'occasional' | 'frequent';
}

/**
 * Vocabulary characteristics
 */
export interface VocabularyProfile {
  /** Register of speech */
  register: 'colloquial' | 'standard' | 'formal' | 'literary';

  /** Domain-specific terms the character uses */
  technicalTerms?: string[];

  /** Words the character avoids */
  avoidedWords?: string[];

  /** Characteristic expressions and phrases */
  favoredExpressions: string[];
}

/**
 * Verbal habits and speech patterns
 */
export interface VerbalHabits {
  /**
   * Filler words and sounds
   * @example ["음", "저기", "그러니까"]
   */
  fillers: string[];

  /**
   * Signature expressions or catchphrases
   * @example ["그건 좀...", "진짜?"]
   */
  catchphrases: string[];

  /**
   * Exclamations
   * @example ["이런!", "세상에"]
   */
  exclamations: string[];

  /** Level of hedging in speech */
  hedging: 'none' | 'minimal' | 'moderate' | 'heavy';
}

/**
 * Speech rhythm characteristics
 */
export interface SpeechRhythm {
  /** Speaking tempo */
  tempo: 'slow' | 'moderate' | 'fast' | 'variable';

  /** Use of pauses in speech */
  pauseUsage: 'rare' | 'occasional' | 'frequent';

  /** Tendency to interrupt or be interrupted */
  interruption: 'never' | 'sometimes' | 'often';
}

/**
 * Complete speech patterns for a character
 */
export interface SpeechPatterns {
  /** Sentence structure preferences */
  sentenceStructure: SentenceStructure;

  /** Vocabulary characteristics */
  vocabulary: VocabularyProfile;

  /** Verbal habits and mannerisms */
  verbalHabits: VerbalHabits;

  /** Speech rhythm */
  rhythm: SpeechRhythm;
}

// ============================================================================
// Internal Monologue Types
// ============================================================================

/**
 * Internal monologue style for POV characters
 */
export interface InternalMonologue {
  /** Style of internal thought */
  style: 'stream-of-consciousness' | 'analytical' | 'emotional' | 'sparse';

  /** How the character addresses themselves in thought */
  selfAddressing: 'first-person' | 'second-person' | 'none';

  /** Frequency of tangential thoughts */
  tangentFrequency: 'low' | 'medium' | 'high';
}

// ============================================================================
// Voice Fingerprint Types
// ============================================================================

/**
 * Quantitative voice metrics for objective comparison
 *
 * These metrics allow programmatic voice consistency checking.
 */
export interface VoiceFingerprint {
  /** Average sentence length in characters */
  avgSentenceLength: number;

  /** Vocabulary complexity on 0-1 scale */
  vocabularyComplexity: number;

  /** Ratio of dialogue to narration for this character */
  dialogueToNarrationRatio: number;

  /** Exclamation frequency per 1000 characters */
  exclamationFrequency: number;

  /** Question frequency per 1000 characters */
  questionFrequency: number;

  /** Filler word density per 1000 characters */
  fillerWordDensity: number;
}

// ============================================================================
// Voice Profile Types
// ============================================================================

/**
 * Korean honorific level default
 */
export type HonorificDefault = 'haeche' | 'haeyoche' | 'hapsyoche';

/**
 * Linguistic markers specific to Korean
 */
export interface LinguisticMarkers {
  /** Default honorific level */
  honorificDefault: HonorificDefault;

  /** Dialect features if any */
  dialectFeatures?: string[];

  /** Education/background indicators in speech */
  educationSignals: string[];
}

/**
 * Complete voice profile for a character
 *
 * Captures everything needed to maintain consistent character voice
 * across chapters and scenes.
 */
export interface VoiceProfile {
  /** Character identifier */
  characterId: string;

  /** Character name */
  characterName: string;

  /** Complete speech patterns */
  speechPatterns: SpeechPatterns;

  /** Internal monologue style (for POV characters) */
  internalMonologue: InternalMonologue;

  /** Korean-specific linguistic markers */
  linguisticMarkers: LinguisticMarkers;

  /** Quantitative voice fingerprint */
  voiceFingerprint: VoiceFingerprint;
}

// ============================================================================
// Voice Deviation Types
// ============================================================================

/**
 * Aspect of voice that deviated
 */
export type VoiceAspect = 'vocabulary' | 'structure' | 'habit' | 'rhythm' | 'monologue';

/**
 * Severity of voice deviation
 */
export type DeviationSeverity = 'minor' | 'moderate' | 'major';

/**
 * A detected deviation from established voice profile
 */
export interface VoiceDeviation {
  /** Location in the content */
  location: {
    /** Starting paragraph index */
    paragraphStart: number;
    /** Ending paragraph index */
    paragraphEnd: number;
  };

  /** Which aspect of voice deviated */
  aspect: VoiceAspect;

  /** What was expected based on profile */
  expected: string;

  /** What was actually found */
  found: string;

  /** How severe the deviation is */
  severity: DeviationSeverity;
}

// ============================================================================
// Voice Consistency Result Types
// ============================================================================

/**
 * Result from voice consistency analysis
 */
export interface VoiceConsistencyResult {
  /** Character being analyzed */
  characterId: string;

  /** Overall consistency score (0-100) */
  overallScore: number;

  /** List of detected deviations */
  deviations: VoiceDeviation[];

  /** Recommendations for improvement */
  recommendations: string[];
}

// ============================================================================
// Dialogue Attribution Types
// ============================================================================

/**
 * Attribution of dialogue to a character
 */
export interface DialogueAttribution {
  /** Character ID speaking */
  characterId: string;

  /** The dialogue text */
  text: string;

  /** Position in content (character offset) */
  position: number;

  /** Paragraph index */
  paragraphIndex: number;
}
