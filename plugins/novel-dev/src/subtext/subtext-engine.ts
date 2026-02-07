/**
 * Subtext Engine
 *
 * Core functionality for emotional subtext analysis:
 * - annotateDialogueSubtext: Main annotation function for dialogue analysis
 * - detectFlatDialogue: Find on-the-nose dialogue lacking subtext
 * - shouldHaveSubtext: Heuristic for emotionally significant moments
 *
 * @module subtext/subtext-engine
 */

import type {
  SubtextAnnotation,
  SubtextContext,
  EmotionLayer,
  PhysicalManifestations,
  NarrativeFunction,
  FlatDialogueLocation,
  SubtextAnalysisResult,
  SubtextCharacter,
  RelationshipDynamic,
} from './types.js';

import {
  buildSubtextPrompt,
  type DialogueForAnalysis,
  type SpeakerInfo,
  type ListenerInfo,
  type RelationshipInfo,
  type ContextInfo,
} from './subtext-prompts.js';

// ============================================================================
// Constants
// ============================================================================

/**
 * Korean emotional words that often indicate on-the-nose dialogue
 */
const EMOTIONAL_WORDS = [
  '사랑해', '사랑하', '미워', '미워하',
  '무서워', '무섭', '두려워', '두렵',
  '행복해', '행복하', '기뻐', '기쁘',
  '슬퍼', '슬프', '우울해', '우울하',
  '화나', '화가 나', '짜증나', '짜증이',
  '질투나', '질투가', '부러워', '부럽',
  '외로워', '외롭', '걱정돼', '걱정이',
  '후회해', '후회하', '미안해', '미안하',
  '고마워', '고맙', '감사해', '감사하',
];

/**
 * Intent declaration patterns that indicate flat dialogue
 */
const INTENT_PATTERNS = [
  /내가 원하는 건/,
  /내 목적은/,
  /내 계획은/,
  /난 (?:그|너|이것)(?:을|를) (?:원해|원한다)/,
  /(?:나는|난) .{1,10}(?:하려고|하고 싶어)/,
  /(?:내|나의) (?:목표|목적|의도)는/,
];

/**
 * Relationship declaration patterns
 */
const RELATIONSHIP_PATTERNS = [
  /우리는 (?:친구|연인|적|가족)/,
  /넌 내 (?:친구|연인|적|형제|자매)/,
  /난 너(?:를|를|한테) .{1,5}(?:사랑|미워|싫어)/,
  /우리 사이(?:는|가)/,
];

// ============================================================================
// Main Functions
// ============================================================================

/**
 * Annotate dialogue with emotional subtext
 *
 * This is the main function for subtext analysis.
 * It takes a dialogue and its context, and produces a complete
 * SubtextAnnotation capturing hidden emotions and physical manifestations.
 *
 * @param dialogue - The dialogue to analyze
 * @param context - Context for the analysis
 * @returns Promise resolving to SubtextAnalysisResult
 */
export async function annotateDialogueSubtext(
  dialogue: DialogueForAnalysis,
  context: SubtextContext
): Promise<SubtextAnalysisResult> {
  // Find speaker and listener from context
  const speakerChar = context.characters[0];
  const listenerChar = context.characters[1] || context.characters[0];

  // Find relationship
  const relationship = context.relationshipDynamics[0] || {
    char1: speakerChar?.id || 'unknown',
    char2: listenerChar?.id || 'unknown',
    description: '알 수 없는 관계',
  };

  // Build the analysis prompt
  const prompt = buildSubtextPrompt(
    dialogue,
    {
      name: speakerChar?.name || '화자',
      personality: speakerChar?.personality,
      currentState: speakerChar?.currentEmotionalState,
    },
    {
      name: listenerChar?.name || '청자',
      personality: listenerChar?.personality,
    },
    {
      description: relationship.description,
      powerDynamic: relationship.powerDynamic,
      tension: relationship.tensionLevel,
    },
    {
      sceneGoals: context.sceneGoals,
      emotionalStakes: context.emotionalStakes,
      emotionalArc: context.scene.emotionalArc,
    }
  );

  // For now, return a default annotation structure
  // In production, this would call an LLM with the prompt
  const annotation = createDefaultAnnotation(
    dialogue,
    speakerChar,
    listenerChar,
    context
  );

  return {
    annotation,
    confidence: 70,
    notes: ['기본 서브텍스트 분석 적용됨'],
  };
}

/**
 * Detect flat (on-the-nose) dialogue in content
 *
 * Scans content for dialogue that directly states emotions,
 * intentions, or relationships without subtext.
 *
 * @param content - Chapter content to analyze
 * @param existingAnnotations - Already annotated dialogues to skip
 * @returns Array of flat dialogue locations with suggestions
 */
export function detectFlatDialogue(
  content: string,
  existingAnnotations: SubtextAnnotation[] = []
): FlatDialogueLocation[] {
  const results: FlatDialogueLocation[] = [];

  // Extract dialogues with their positions
  const dialogues = extractDialogues(content);

  // Set of already annotated dialogue IDs
  const annotatedIds = new Set(existingAnnotations.map(a => a.dialogueId));

  // Check each dialogue for flatness
  for (const { text, position, paragraphIndex } of dialogues) {
    // Skip if already annotated
    if (annotatedIds.has(`dialogue_${position}`)) {
      continue;
    }

    const flatness = assessFlatness(text);
    if (flatness.isFlat) {
      results.push({
        location: position,
        paragraphIndex,
        currentText: text,
        reason: flatness.reason,
        suggestedSubtext: flatness.suggestion,
      });
    }
  }

  return results;
}

/**
 * Determine if dialogue should have subtext
 *
 * Heuristic for identifying emotionally significant moments
 * that warrant subtext analysis.
 *
 * @param dialogueText - The dialogue text
 * @param context - Scene context (optional)
 * @returns Whether this dialogue should have subtext
 */
export function shouldHaveSubtext(
  dialogueText: string,
  context?: SubtextContext
): boolean {
  // Check context-based triggers FIRST (overrides length heuristic)
  if (context) {
    // High tension scenes need more subtext
    if (context.scene.tensionLevel === 'high' || context.scene.tensionLevel === 'climactic') {
      return true;
    }

    // Check relationship dynamics
    for (const rel of context.relationshipDynamics) {
      if (rel.tensionLevel === 'high') {
        return true;
      }
    }
  }

  // Check for emotional keywords (even in short dialogue)
  for (const word of EMOTIONAL_WORDS) {
    if (dialogueText.includes(word)) {
      return true;
    }
  }

  // Check for intent patterns
  for (const pattern of INTENT_PATTERNS) {
    if (pattern.test(dialogueText)) {
      return true;
    }
  }

  // Check for relationship patterns
  for (const pattern of RELATIONSHIP_PATTERNS) {
    if (pattern.test(dialogueText)) {
      return true;
    }
  }

  // Question marks in dialogue often indicate emotionally charged exchanges
  if (dialogueText.includes('?') && dialogueText.length > 15) {
    return true;
  }

  // Exclamations often carry emotional weight
  if ((dialogueText.match(/!/g) || []).length >= 2) {
    return true;
  }

  // Short dialogue without emotional content doesn't need subtext
  if (dialogueText.length < 10) {
    return false;
  }

  return false;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Extract dialogues from content with positions
 */
function extractDialogues(content: string): Array<{
  text: string;
  position: number;
  paragraphIndex: number;
}> {
  const results: Array<{
    text: string;
    position: number;
    paragraphIndex: number;
  }> = [];

  // Match Korean dialogue patterns (various quote styles)
  const dialoguePattern = /["""]([^"""]+)["""]/g;
  let match;

  while ((match = dialoguePattern.exec(content)) !== null) {
    const text = match[1];
    const position = match.index;

    // Calculate paragraph index
    const textBefore = content.slice(0, position);
    const paragraphIndex = (textBefore.match(/\n\n/g) || []).length;

    results.push({ text, position, paragraphIndex });
  }

  return results;
}

/**
 * Assess if dialogue is flat (on-the-nose)
 */
function assessFlatness(text: string): {
  isFlat: boolean;
  reason: string;
  suggestion: string;
} {
  // Check for direct emotional statements
  for (const word of EMOTIONAL_WORDS) {
    if (text.includes(word)) {
      return {
        isFlat: true,
        reason: `감정("${word}")을 직접 언급합니다`,
        suggestion: '행동, 비유, 또는 간접적 표현으로 감정을 암시하세요',
      };
    }
  }

  // Check for intent declarations
  for (const pattern of INTENT_PATTERNS) {
    if (pattern.test(text)) {
      return {
        isFlat: true,
        reason: '의도를 직접적으로 선언합니다',
        suggestion: '의도를 행동이나 선택을 통해 보여주세요',
      };
    }
  }

  // Check for relationship declarations
  for (const pattern of RELATIONSHIP_PATTERNS) {
    if (pattern.test(text)) {
      return {
        isFlat: true,
        reason: '관계를 직접적으로 정의합니다',
        suggestion: '관계의 본질을 상호작용을 통해 드러내세요',
      };
    }
  }

  return {
    isFlat: false,
    reason: '',
    suggestion: '',
  };
}

/**
 * Create a default annotation structure
 */
function createDefaultAnnotation(
  dialogue: DialogueForAnalysis,
  speaker: SubtextCharacter | undefined,
  listener: SubtextCharacter | undefined,
  context: SubtextContext
): SubtextAnnotation {
  const flatness = assessFlatness(dialogue.text);

  // Determine narrative function based on context
  let narrativeFunction: NarrativeFunction = 'reveal';
  if (context.scene.tensionLevel === 'high') {
    narrativeFunction = 'test';
  } else if (context.scene.tensionLevel === 'climactic') {
    narrativeFunction = 'reveal';
  }

  // Create a basic emotion layer
  const layer: EmotionLayer = {
    level: 1,
    actualIntention: flatness.isFlat
      ? '표면적 감정 전달'
      : '숨겨진 의도 탐색 필요',
    underlyingEmotion: speaker?.currentEmotionalState || '분석 필요',
    hiddenContext: '맥락 분석 필요',
    tellSigns: ['말투 변화', '시선 회피'],
  };

  const manifestations: PhysicalManifestations = {
    bodyLanguage: ['긴장된 자세'],
    actionBeats: ['말하는 동안 손 움직임'],
    vocalCues: ['목소리 톤 변화'],
  };

  return {
    dialogueId: dialogue.id || `dialogue_${Date.now()}`,
    speakerId: speaker?.id || 'unknown',
    listenerId: listener?.id || 'unknown',
    surfaceLevel: {
      text: dialogue.text,
      topic: extractTopic(dialogue.text),
    },
    subtextLayers: [layer],
    physicalManifestations: manifestations,
    narrativeFunction,
  };
}

/**
 * Extract apparent topic from dialogue text
 */
function extractTopic(text: string): string {
  // Simple heuristic: use first noun phrase or verb
  if (text.length < 20) {
    return text;
  }

  // Check for common topic indicators
  const questionMatch = text.match(/(.+?)\?/);
  if (questionMatch) {
    return questionMatch[1].slice(0, 30) + '에 대한 질문';
  }

  // Default: truncate
  return text.slice(0, 30) + '...';
}

// ============================================================================
// Utility Exports
// ============================================================================

/**
 * Get list of emotional words used for detection
 */
export function getEmotionalWords(): readonly string[] {
  return EMOTIONAL_WORDS;
}

/**
 * Check if text contains direct emotional expression
 */
export function containsDirectEmotion(text: string): boolean {
  return EMOTIONAL_WORDS.some(word => text.includes(word));
}

// Re-export buildSubtextPrompt for convenience
export { buildSubtextPrompt } from './subtext-prompts.js';
