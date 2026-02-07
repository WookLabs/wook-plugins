/**
 * Subtext Types
 *
 * Type definitions for emotional subtext engine:
 * - EmotionLayer: Hidden emotion beneath surface dialogue
 * - PhysicalManifestations: Body language, action beats, vocal cues
 * - SubtextAnnotation: Complete annotation for a dialogue
 * - SubtextContext: Context for subtext analysis
 *
 * @module subtext/types
 */

// ============================================================================
// Emotion Layer Types
// ============================================================================

/**
 * A layer of hidden emotion beneath the surface dialogue
 *
 * Characters often say one thing while meaning another.
 * EmotionLayer captures this gap between words and intention.
 *
 * @example
 * Surface: "괜찮아요. 신경 쓰지 마세요."
 * Layer 1: { actualIntention: "거리를 두려 함", underlyingEmotion: "상처받음" }
 * Layer 2: { actualIntention: "자존심 지키기", underlyingEmotion: "취약함" }
 */
export interface EmotionLayer {
  /** Layer depth: 1 = primary, 2 = deeper, 3 = deepest */
  level: number;

  /** What character is really trying to accomplish */
  actualIntention: string;

  /** The underlying emotion driving the behavior */
  underlyingEmotion: string;

  /** What the character is deliberately NOT saying */
  hiddenContext: string;

  /** Subtle tells that reveal this layer (behavior, tone, word choice) */
  tellSigns: string[];
}

// ============================================================================
// Physical Manifestation Types
// ============================================================================

/**
 * Physical expressions that accompany emotional subtext
 *
 * Good prose shows emotion through:
 * - Body language: involuntary physical responses
 * - Action beats: deliberate movements during dialogue
 * - Vocal cues: changes in voice, pace, volume
 */
export interface PhysicalManifestations {
  /**
   * Involuntary body language
   * @example ["clenched jaw", "avoided eye contact", "shoulders tensed"]
   */
  bodyLanguage: string[];

  /**
   * Deliberate actions during or around dialogue
   * @example ["fidgeted with ring", "turned away", "picked at sleeve"]
   */
  actionBeats: string[];

  /**
   * Voice quality and speech pattern changes
   * @example ["voice dropped", "words came too fast", "forced lightness"]
   */
  vocalCues: string[];
}

// ============================================================================
// Subtext Annotation Types
// ============================================================================

/**
 * Narrative function of the dialogue
 *
 * - reveal: Subtext hints at truth character is hiding
 * - conceal: Character actively masks true feelings
 * - deflect: Changing subject to avoid emotional territory
 * - test: Probing the other character's reaction
 * - manipulate: Using subtext to influence behavior
 */
export type NarrativeFunction = 'reveal' | 'conceal' | 'deflect' | 'test' | 'manipulate';

/**
 * Complete subtext annotation for a dialogue exchange
 *
 * Captures everything needed to understand the gap between
 * what characters say and what they mean.
 */
export interface SubtextAnnotation {
  /** Reference ID linking to dialogue in scene */
  dialogueId: string;

  /** Character speaking */
  speakerId: string;

  /** Character being spoken to */
  listenerId: string;

  /** Surface-level content */
  surfaceLevel: {
    /** The literal words spoken */
    text: string;
    /** Apparent topic of discussion */
    topic: string;
  };

  /**
   * Layers of hidden meaning (1-3 layers)
   *
   * Most dialogue has 1-2 layers.
   * 3 layers reserved for climactic emotional moments.
   */
  subtextLayers: EmotionLayer[];

  /** Physical expressions accompanying the subtext */
  physicalManifestations: PhysicalManifestations;

  /** What narrative work this dialogue performs */
  narrativeFunction: NarrativeFunction;
}

// ============================================================================
// Subtext Context Types
// ============================================================================

/**
 * Character information for subtext analysis
 */
export interface SubtextCharacter {
  /** Character identifier */
  id: string;
  /** Character name */
  name: string;
  /** Personality traits (optional) */
  personality?: string;
  /** Current emotional state (optional) */
  currentEmotionalState?: string;
}

/**
 * Relationship dynamics between characters
 */
export interface RelationshipDynamic {
  /** First character ID */
  char1: string;
  /** Second character ID */
  char2: string;
  /** Description of the relationship and its current state */
  description: string;
  /** Power dynamic (optional) */
  powerDynamic?: 'equal' | 'char1-dominant' | 'char2-dominant';
  /** Relationship tension level (optional) */
  tensionLevel?: 'low' | 'medium' | 'high';
}

/**
 * Context required for accurate subtext analysis
 *
 * Subtext depends heavily on:
 * - Who the characters are
 * - Their relationship history
 * - What's at stake in this scene
 */
export interface SubtextContext {
  /** Scene information */
  scene: {
    /** Scene identifier */
    id: string;
    /** Emotional arc of the scene (optional) */
    emotionalArc?: string;
    /** Scene tension level (optional) */
    tensionLevel?: 'low' | 'medium' | 'high' | 'climactic';
  };

  /** Characters involved in the dialogue */
  characters: SubtextCharacter[];

  /** Relationship dynamics between characters */
  relationshipDynamics: RelationshipDynamic[];

  /** Goals for this scene */
  sceneGoals: string[];

  /** What's emotionally at stake */
  emotionalStakes: string;
}

// ============================================================================
// Flat Dialogue Detection Types
// ============================================================================

/**
 * Result from detecting flat (on-the-nose) dialogue
 */
export interface FlatDialogueLocation {
  /** Location in the content (character offset) */
  location: number;

  /** Paragraph index */
  paragraphIndex: number;

  /** The current flat dialogue text */
  currentText: string;

  /** Speaker if identifiable */
  speaker?: string;

  /** Why this dialogue is considered flat */
  reason: string;

  /** Suggested approach for adding subtext */
  suggestedSubtext: string;
}

// ============================================================================
// Subtext Analysis Result Types
// ============================================================================

/**
 * Result from subtext analysis operation
 */
export interface SubtextAnalysisResult {
  /** The generated annotation */
  annotation: SubtextAnnotation;

  /** Confidence score (0-100) */
  confidence: number;

  /** Analysis notes */
  notes: string[];
}
