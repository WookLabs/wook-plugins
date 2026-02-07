/**
 * Honorific Matrix Module
 *
 * Manages Korean honorific/speech level relationships between characters.
 * Provides initialization, lookup, and violation detection functionality.
 *
 * @module korean/honorific-matrix
 */

import type { Character } from '../types.js';
import type {
  SpeechLevel,
  SpeechContext,
  SocialStatus,
  CharacterHonorificProfile,
  RelationshipSpeechLevel,
  HonorificMatrix,
  HonorificViolation,
} from './types.js';

// Re-export types for convenience
export type {
  SpeechLevel,
  SpeechContext,
  SocialStatus,
  CharacterHonorificProfile,
  RelationshipSpeechLevel,
  HonorificMatrix,
  HonorificViolation,
};

// ============================================================================
// Constants
// ============================================================================

/**
 * Age difference threshold for speech level derivation
 * If speaker is 5+ years older, they use casual speech
 * If speaker is 5+ years younger, they use polite speech
 */
export const AGE_DIFFERENCE_THRESHOLD = 5;

/**
 * Speech level detection patterns by verb endings
 * Each pattern maps to a speech level
 *
 * Note: Korean verb endings attach directly to stems without hyphen
 * Patterns match end of sentence with optional punctuation
 */
export const SPEECH_LEVEL_PATTERNS: Record<SpeechLevel, RegExp[]> = {
  // 해체 (casual): 해, 야, 어, 아, 냐, 니, 지, 네, 와
  haeche: [
    /해[.!?]?$/,
    /야[.!?]?$/,
    /어[.!?]?$/,
    /아[.!?]?$/,
    /냐[.!?]?$/,
    /니[.!?]?$/,
    /지[.!?]?$/,
    /네[.!?]?$/,
    /래[.!?]?$/,
    /게[.!?]?$/,
    /가[.!?]?$/,  // 가 ending (나 먼저 가)
    /와[.!?]?$/,  // 와 ending (오다 -> 와, 빨리 와)
  ],
  // 해요체 (polite): 해요, 요, 어요, 아요, 죠
  haeyoche: [
    /해요[.!?]?$/,
    /세요[.!?]?$/,  // 안녕하세요 - polite request form
    /어요[.!?]?$/,
    /아요[.!?]?$/,
    /죠[.!?]?$/,
    /네요[.!?]?$/,
    /래요[.!?]?$/,
    /게요[.!?]?$/,
    /요[.!?]?$/,   // General -요 ending (must be last to check after specific patterns)
  ],
  // 하십시오체 (formal): 합니다, 습니다, 입니다, 십시오
  hapsyoche: [
    /합니다[.!?]?$/,
    /습니다[.!?]?$/,
    /입니다[.!?]?$/,
    /십시오[.!?]?$/,
    /겠습니다[.!?]?$/,
  ],
};

/**
 * Korean quote marks for dialogue extraction
 */
export const KOREAN_QUOTE_MARKS = {
  open: ['\u201C', '\u201D', '\u2018', '\u300C', '\u300E'],  // ", ", ', 「, 『
  close: ['\u201D', '\u201C', '\u2019', '\u300D', '\u300F'], // ", ", ', 」, 』
};

// ============================================================================
// Speech Level Derivation
// ============================================================================

/**
 * Derive the appropriate speech level based on speaker and listener characteristics
 *
 * Rules:
 * - Age diff > threshold (speaker older): casual (haeche)
 * - Age diff > threshold (speaker younger): polite (haeyoche)
 * - Similar age: polite (haeyoche) as default
 * - Social status can influence (high status listeners get more formal speech)
 *
 * @param speaker - The speaking character's profile
 * @param listener - The listening character's profile
 * @returns Derived speech level
 */
export function deriveSpeechLevel(
  speaker: CharacterHonorificProfile,
  listener: CharacterHonorificProfile
): SpeechLevel {
  const ageDiff = speaker.age - listener.age;

  // Speaker significantly older -> can use casual speech
  if (ageDiff > AGE_DIFFERENCE_THRESHOLD) {
    return 'haeche';
  }

  // Speaker significantly younger -> should use polite speech
  if (ageDiff < -AGE_DIFFERENCE_THRESHOLD) {
    // If listener has high social status, may need formal speech
    if (listener.socialStatus === 'high') {
      return 'hapsyoche';
    }
    return 'haeyoche';
  }

  // Similar age - default to polite
  // But high-status listeners may warrant formal speech
  if (listener.socialStatus === 'high' && speaker.socialStatus !== 'high') {
    return 'hapsyoche';
  }

  return 'haeyoche';
}

/**
 * Convert Character basic.age to social status based on occupation/economic_status
 *
 * @param character - Character from main types
 * @returns Inferred social status
 */
export function inferSocialStatus(character: Character): SocialStatus {
  const economicStatus = character.background?.economic_status?.toLowerCase() ?? '';

  if (economicStatus.includes('상류') || economicStatus.includes('부유') ||
      economicStatus.includes('high') || economicStatus.includes('wealthy')) {
    return 'high';
  }

  if (economicStatus.includes('하류') || economicStatus.includes('빈곤') ||
      economicStatus.includes('low') || economicStatus.includes('poor')) {
    return 'low';
  }

  return 'middle';
}

// ============================================================================
// Matrix Initialization
// ============================================================================

/**
 * Initialize an honorific matrix from a list of characters
 *
 * Creates profiles for each character and derives speech levels for all pairs.
 *
 * @param characters - Array of Character objects from the novel
 * @returns Initialized HonorificMatrix
 */
export function initializeHonorificMatrix(characters: Character[]): HonorificMatrix {
  const characterProfiles = new Map<string, CharacterHonorificProfile>();
  const relationships = new Map<string, RelationshipSpeechLevel>();

  // Create profiles for each character
  for (const char of characters) {
    const profile: CharacterHonorificProfile = {
      id: char.id,
      name: char.name,
      age: char.basic?.age ?? 30, // Default age if not specified
      socialStatus: inferSocialStatus(char),
      defaultSpeechToStrangers: 'haeyoche', // Default polite to strangers
    };
    characterProfiles.set(char.id, profile);
  }

  // Create relationships for all pairs
  for (const speaker of characters) {
    for (const listener of characters) {
      if (speaker.id === listener.id) continue; // Skip self

      const speakerProfile = characterProfiles.get(speaker.id)!;
      const listenerProfile = characterProfiles.get(listener.id)!;

      const key = `${speaker.id}_to_${listener.id}`;
      const defaultLevel = deriveSpeechLevel(speakerProfile, listenerProfile);

      const relationship: RelationshipSpeechLevel = {
        speakerId: speaker.id,
        listenerId: listener.id,
        defaultLevel,
        // Context overrides can be customized per relationship
        contextOverrides: {
          // In public, tend to be more formal
          public: defaultLevel === 'haeche' ? 'haeyoche' : defaultLevel,
          // In private, can be more casual if close
          private: defaultLevel,
          // Emotional moments might shift speech levels
          emotional: defaultLevel,
        },
      };

      relationships.set(key, relationship);
    }
  }

  return {
    characters: characterProfiles,
    relationships,
  };
}

// ============================================================================
// Speech Level Lookup
// ============================================================================

/**
 * Get the speech level for a speaker-listener pair, with optional context
 *
 * @param matrix - The honorific matrix
 * @param speakerId - ID of the speaking character
 * @param listenerId - ID of the listening character
 * @param context - Optional context override (public, private, emotional)
 * @returns The appropriate speech level, or undefined if pair not found
 */
export function getSpeechLevel(
  matrix: HonorificMatrix,
  speakerId: string,
  listenerId: string,
  context?: SpeechContext
): SpeechLevel | undefined {
  const key = `${speakerId}_to_${listenerId}`;
  const relationship = matrix.relationships.get(key);

  if (!relationship) {
    // Fall back to stranger default if speaker exists
    const speaker = matrix.characters.get(speakerId);
    return speaker?.defaultSpeechToStrangers;
  }

  // Apply context override if available
  if (context && relationship.contextOverrides) {
    const override = relationship.contextOverrides[context];
    if (override) {
      return override;
    }
  }

  return relationship.defaultLevel;
}

// ============================================================================
// Speech Level Detection
// ============================================================================

/**
 * Detect the speech level used in a dialogue text
 *
 * Analyzes verb endings to determine speech level.
 * Returns undefined if no recognizable pattern found.
 *
 * @param dialogueText - The dialogue text to analyze
 * @returns Detected speech level or undefined
 */
export function detectSpeechLevelFromText(dialogueText: string): SpeechLevel | undefined {
  // Remove quotes and trim
  const cleaned = dialogueText
    .replace(/[""''「」『』]/g, '')
    .trim();

  // Split into sentences and analyze the last one (most indicative of speech level)
  const sentences = cleaned.split(/[.!?]+/).filter(s => s.trim());
  const lastSentence = sentences[sentences.length - 1]?.trim() ?? cleaned;

  // Check patterns in order of specificity (formal first, then polite, then casual)
  for (const pattern of SPEECH_LEVEL_PATTERNS.hapsyoche) {
    if (pattern.test(lastSentence)) {
      return 'hapsyoche';
    }
  }

  for (const pattern of SPEECH_LEVEL_PATTERNS.haeyoche) {
    if (pattern.test(lastSentence)) {
      return 'haeyoche';
    }
  }

  for (const pattern of SPEECH_LEVEL_PATTERNS.haeche) {
    if (pattern.test(lastSentence)) {
      return 'haeche';
    }
  }

  return undefined;
}

/**
 * Extract dialogue segments from content with positions
 *
 * @param content - Chapter content
 * @returns Array of dialogue segments with positions
 */
export function extractDialogueSegments(content: string): Array<{
  text: string;
  position: number;
}> {
  const segments: Array<{ text: string; position: number }> = [];

  // Match various Korean quote patterns
  const patterns = [
    /"([^"]+)"/g,    // Standard double quotes
    /"([^"]+)"/g,    // Curly double quotes
    /'([^']+)'/g,    // Single quotes
    /「([^」]+)」/g,  // Corner brackets
    /『([^』]+)』/g,  // Double corner brackets
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      segments.push({
        text: match[1],
        position: match.index,
      });
    }
  }

  // Sort by position
  segments.sort((a, b) => a.position - b.position);

  return segments;
}

// ============================================================================
// Violation Detection
// ============================================================================

/**
 * Detect honorific violations in chapter content
 *
 * Compares actual speech levels in dialogue against expected levels from matrix.
 *
 * @param content - Chapter prose content
 * @param matrix - Honorific matrix with character relationships
 * @param dialogueAttributions - Map of character position to speaker ID
 * @returns Array of detected violations
 */
export function detectHonorificViolations(
  content: string,
  matrix: HonorificMatrix,
  dialogueAttributions: Map<number, { speakerId: string; listenerId?: string }>
): HonorificViolation[] {
  const violations: HonorificViolation[] = [];
  const dialogues = extractDialogueSegments(content);

  for (const dialogue of dialogues) {
    // Find attribution for this dialogue position
    // Check for closest attribution before or at this position
    let attribution: { speakerId: string; listenerId?: string } | undefined;

    for (const [pos, attr] of dialogueAttributions.entries()) {
      if (pos <= dialogue.position + 50) { // Allow some tolerance
        if (!attribution || pos > (attribution as any).pos) {
          attribution = attr;
          (attribution as any).pos = pos;
        }
      }
    }

    if (!attribution || !attribution.listenerId) {
      continue; // Can't verify without knowing both speaker and listener
    }

    const { speakerId, listenerId } = attribution;

    // Detect actual speech level
    const actualLevel = detectSpeechLevelFromText(dialogue.text);
    if (!actualLevel) {
      continue; // Can't determine speech level
    }

    // Get expected speech level
    const expectedLevel = getSpeechLevel(matrix, speakerId, listenerId);
    if (!expectedLevel) {
      continue; // Pair not in matrix
    }

    // Compare and record violations
    if (actualLevel !== expectedLevel) {
      violations.push({
        speakerId,
        listenerId,
        expectedLevel,
        actualLevel,
        position: dialogue.position,
        dialogueText: dialogue.text,
      });
    }
  }

  return violations;
}

/**
 * Simple version of violation detection that uses position-based attribution
 *
 * For simpler use cases where dialogue attribution is already done
 *
 * @param dialogues - Array of {text, speakerId, listenerId} objects
 * @param matrix - Honorific matrix
 * @returns Array of violations
 */
export function detectViolationsSimple(
  dialogues: Array<{
    text: string;
    speakerId: string;
    listenerId: string;
    position?: number;
  }>,
  matrix: HonorificMatrix
): HonorificViolation[] {
  const violations: HonorificViolation[] = [];

  for (const dialogue of dialogues) {
    const actualLevel = detectSpeechLevelFromText(dialogue.text);
    if (!actualLevel) continue;

    const expectedLevel = getSpeechLevel(matrix, dialogue.speakerId, dialogue.listenerId);
    if (!expectedLevel) continue;

    if (actualLevel !== expectedLevel) {
      violations.push({
        speakerId: dialogue.speakerId,
        listenerId: dialogue.listenerId,
        expectedLevel,
        actualLevel,
        position: dialogue.position ?? 0,
        dialogueText: dialogue.text,
      });
    }
  }

  return violations;
}
