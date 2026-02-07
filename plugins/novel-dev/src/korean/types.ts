/**
 * Korean Language Specialization Types
 *
 * Types for Korean-specific features including:
 * - Honorific speech levels (해체, 해요체, 하십시오체)
 * - Per-character-pair relationship tracking
 * - Honorific violation detection
 *
 * @module korean/types
 */

// ============================================================================
// Speech Level Types
// ============================================================================

/**
 * Korean speech levels (modern 3-level system)
 *
 * - haeche (해체): Casual/informal - used between close friends, to younger people
 * - haeyoche (해요체): Polite/standard - used in most situations
 * - hapsyoche (하십시오체): Formal/honorific - used in formal settings, to much older people
 */
export type SpeechLevel = 'haeche' | 'haeyoche' | 'hapsyoche';

/**
 * Context types that can override default speech levels
 */
export type SpeechContext = 'public' | 'private' | 'emotional';

// ============================================================================
// Character Honorific Profile
// ============================================================================

/**
 * Social status categories for speech level derivation
 */
export type SocialStatus = 'high' | 'middle' | 'low';

/**
 * Honorific profile for a single character
 */
export interface CharacterHonorificProfile {
  /** Character ID (matches Character.id from main types) */
  id: string;
  /** Character name for display */
  name: string;
  /** Character age in years */
  age: number;
  /** Social status for speech level derivation */
  socialStatus: SocialStatus;
  /** Default speech level when speaking to strangers */
  defaultSpeechToStrangers: SpeechLevel;
}

// ============================================================================
// Relationship Speech Levels
// ============================================================================

/**
 * Speech level relationship between two characters
 */
export interface RelationshipSpeechLevel {
  /** ID of the speaking character */
  speakerId: string;
  /** ID of the listening character */
  listenerId: string;
  /** Default speech level for this pair */
  defaultLevel: SpeechLevel;
  /** Context-specific overrides */
  contextOverrides?: {
    /** Speech level in public settings (may be more formal) */
    public?: SpeechLevel;
    /** Speech level in private settings (may be more casual) */
    private?: SpeechLevel;
    /** Speech level during emotional moments (may shift) */
    emotional?: SpeechLevel;
  };
}

// ============================================================================
// Honorific Matrix
// ============================================================================

/**
 * Complete honorific relationship matrix for a novel
 *
 * Tracks per-character profiles and per-pair speech levels
 */
export interface HonorificMatrix {
  /** Character profiles indexed by character ID */
  characters: Map<string, CharacterHonorificProfile>;
  /**
   * Relationship speech levels indexed by "{speakerId}_to_{listenerId}"
   */
  relationships: Map<string, RelationshipSpeechLevel>;
}

// ============================================================================
// Violation Types
// ============================================================================

/**
 * A detected honorific violation in dialogue
 */
export interface HonorificViolation {
  /** ID of the speaking character */
  speakerId: string;
  /** ID of the listening character */
  listenerId: string;
  /** Expected speech level based on relationship */
  expectedLevel: SpeechLevel;
  /** Actual speech level detected in dialogue */
  actualLevel: SpeechLevel;
  /** Character position in content where violation occurs */
  position: number;
  /** The actual dialogue text containing the violation */
  dialogueText: string;
}

// ============================================================================
// Extended Directive Types
// ============================================================================

/**
 * Korean-specific directive types extending the base DirectiveType
 *
 * - honorific-violation: Speech level mismatch in dialogue
 * - banned-expression: AI-typical banned expressions detected
 * - texture-enrichment: Korean prose texture improvements needed
 */
export type KoreanDirectiveType =
  | 'honorific-violation'
  | 'banned-expression'
  | 'texture-enrichment';
