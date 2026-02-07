/**
 * Subtext Prompts
 *
 * LLM prompt templates for subtext analysis:
 * - buildSubtextPrompt: Generate prompts for analyzing dialogue subtext
 *
 * @module subtext/subtext-prompts
 */

import type {
  SubtextContext,
  SubtextCharacter,
  RelationshipDynamic,
} from './types.js';

// ============================================================================
// Prompt Building Functions
// ============================================================================

/**
 * Dialogue information for subtext analysis
 */
export interface DialogueForAnalysis {
  /** The dialogue text */
  text: string;
  /** Dialogue ID (optional) */
  id?: string;
}

/**
 * Speaker information for subtext analysis
 */
export interface SpeakerInfo {
  /** Character name */
  name: string;
  /** Personality description (optional) */
  personality?: string;
  /** Current emotional state (optional) */
  currentState?: string;
}

/**
 * Listener information for subtext analysis
 */
export interface ListenerInfo {
  /** Character name */
  name: string;
  /** Personality description (optional) */
  personality?: string;
}

/**
 * Relationship information for subtext analysis
 */
export interface RelationshipInfo {
  /** Description of the relationship */
  description: string;
  /** Power dynamic (optional) */
  powerDynamic?: string;
  /** Current tension (optional) */
  tension?: string;
}

/**
 * Context information for subtext analysis
 */
export interface ContextInfo {
  /** Scene goals */
  sceneGoals: string[];
  /** Emotional stakes */
  emotionalStakes: string;
  /** Scene emotional arc (optional) */
  emotionalArc?: string;
}

/**
 * Build LLM prompt for subtext analysis
 *
 * The prompt guides the LLM to identify:
 * 1. What the speaker is ACTUALLY trying to communicate
 * 2. What emotion they are hiding or suppressing
 * 3. What they are deliberately NOT saying
 * 4. How this would manifest physically
 *
 * @param dialogue - The dialogue to analyze
 * @param speaker - Information about the speaker
 * @param listener - Information about the listener
 * @param relationship - Their relationship context
 * @param context - Scene and emotional context
 * @returns Formatted prompt string
 */
export function buildSubtextPrompt(
  dialogue: DialogueForAnalysis,
  speaker: SpeakerInfo,
  listener: ListenerInfo,
  relationship: RelationshipInfo,
  context: ContextInfo
): string {
  const lines: string[] = [];

  // Header
  lines.push('# 대화 서브텍스트 분석');
  lines.push('');
  lines.push('아래 대화의 숨겨진 감정과 의도를 분석해주세요.');
  lines.push('');

  // Dialogue section
  lines.push('## 분석 대상 대화');
  lines.push('```');
  lines.push(dialogue.text);
  lines.push('```');
  lines.push('');

  // Character section
  lines.push('## 캐릭터 정보');
  lines.push('');
  lines.push(`**화자:** ${speaker.name}`);
  if (speaker.personality) {
    lines.push(`- 성격: ${speaker.personality}`);
  }
  if (speaker.currentState) {
    lines.push(`- 현재 감정 상태: ${speaker.currentState}`);
  }
  lines.push('');

  lines.push(`**청자:** ${listener.name}`);
  if (listener.personality) {
    lines.push(`- 성격: ${listener.personality}`);
  }
  lines.push('');

  // Relationship section
  lines.push('## 관계');
  lines.push(`${relationship.description}`);
  if (relationship.powerDynamic) {
    lines.push(`- 권력 관계: ${relationship.powerDynamic}`);
  }
  if (relationship.tension) {
    lines.push(`- 현재 긴장도: ${relationship.tension}`);
  }
  lines.push('');

  // Context section
  lines.push('## 장면 맥락');
  if (context.sceneGoals.length > 0) {
    lines.push(`**장면 목표:**`);
    for (const goal of context.sceneGoals) {
      lines.push(`- ${goal}`);
    }
  }
  lines.push(`**감정적 stakes:** ${context.emotionalStakes}`);
  if (context.emotionalArc) {
    lines.push(`**감정 아크:** ${context.emotionalArc}`);
  }
  lines.push('');

  // Analysis instructions
  lines.push('## 분석 요청');
  lines.push('');
  lines.push('다음 질문에 답해주세요:');
  lines.push('');
  lines.push('### 1. 실제 의도 (Actual Intention)');
  lines.push('화자가 이 대화를 통해 실제로 달성하려는 것은 무엇인가요?');
  lines.push('표면적인 말 뒤에 숨겨진 진짜 목적을 파악해주세요.');
  lines.push('');
  lines.push('### 2. 숨겨진 감정 (Hidden Emotion)');
  lines.push('화자가 억누르거나 숨기고 있는 감정은 무엇인가요?');
  lines.push('말하는 방식, 단어 선택, 회피하는 주제 등에서 드러나는 감정을 찾아주세요.');
  lines.push('');
  lines.push('### 3. 말하지 않은 것 (What\'s NOT Said)');
  lines.push('화자가 의도적으로 말하지 않는 것은 무엇인가요?');
  lines.push('대화에서 빠진 것, 피하는 주제, 암시만 하는 것을 파악해주세요.');
  lines.push('');
  lines.push('### 4. 물리적 표현 (Physical Manifestations)');
  lines.push('이 서브텍스트가 어떻게 물리적으로 드러날 수 있나요?');
  lines.push('- 신체 언어 (body language): 무의식적 반응');
  lines.push('- 행동 비트 (action beats): 대화 중 동작');
  lines.push('- 목소리 단서 (vocal cues): 억양, 속도, 음량 변화');
  lines.push('');

  // Output format
  lines.push('## 출력 형식');
  lines.push('');
  lines.push('JSON 형식으로 응답해주세요:');
  lines.push('```json');
  lines.push('{');
  lines.push('  "subtextLayers": [');
  lines.push('    {');
  lines.push('      "level": 1,');
  lines.push('      "actualIntention": "...",');
  lines.push('      "underlyingEmotion": "...",');
  lines.push('      "hiddenContext": "...",');
  lines.push('      "tellSigns": ["...", "..."]');
  lines.push('    }');
  lines.push('  ],');
  lines.push('  "physicalManifestations": {');
  lines.push('    "bodyLanguage": ["...", "..."],');
  lines.push('    "actionBeats": ["...", "..."],');
  lines.push('    "vocalCues": ["...", "..."]');
  lines.push('  },');
  lines.push('  "narrativeFunction": "reveal|conceal|deflect|test|manipulate"');
  lines.push('}');
  lines.push('```');

  return lines.join('\n');
}

/**
 * Build prompt for detecting flat dialogue
 *
 * @param content - Chapter content to analyze
 * @returns Formatted prompt for flat dialogue detection
 */
export function buildFlatDialogueDetectionPrompt(content: string): string {
  const lines: string[] = [];

  lines.push('# 평면적 대화 감지');
  lines.push('');
  lines.push('아래 텍스트에서 "on-the-nose" 대화를 찾아주세요.');
  lines.push('On-the-nose 대화란 캐릭터가 감정이나 의도를 직접적으로 말하는 것입니다.');
  lines.push('');
  lines.push('## 텍스트');
  lines.push('```');
  lines.push(content.slice(0, 5000)); // Limit content length
  lines.push('```');
  lines.push('');
  lines.push('## 감지 기준');
  lines.push('');
  lines.push('다음 패턴을 찾아주세요:');
  lines.push('1. 감정을 직접 언급하는 대화 ("사랑해", "미워", "무서워" 등)');
  lines.push('2. 의도를 설명하는 대화 ("내가 원하는 건...", "내 목적은...")');
  lines.push('3. 관계를 정의하는 대화 ("우리는 친구야", "넌 내 적이야")');
  lines.push('4. 플롯을 설명하는 대화 ("그래서 계획은 이거야...")');
  lines.push('');
  lines.push('## 출력 형식');
  lines.push('');
  lines.push('JSON 배열로 응답해주세요:');
  lines.push('```json');
  lines.push('[');
  lines.push('  {');
  lines.push('    "text": "대화 텍스트",');
  lines.push('    "reason": "평면적인 이유",');
  lines.push('    "suggestion": "서브텍스트 추가 방향"');
  lines.push('  }');
  lines.push(']');
  lines.push('```');

  return lines.join('\n');
}

/**
 * Build prompt for generating subtext suggestions
 *
 * @param flatDialogue - The flat dialogue to improve
 * @param context - Scene context
 * @returns Prompt for generating subtext alternatives
 */
export function buildSubtextSuggestionPrompt(
  flatDialogue: string,
  context: ContextInfo
): string {
  const lines: string[] = [];

  lines.push('# 서브텍스트 대화 생성');
  lines.push('');
  lines.push('아래의 직접적인 대화를 서브텍스트가 담긴 대화로 바꿔주세요.');
  lines.push('');
  lines.push('## 원본 대화');
  lines.push('```');
  lines.push(flatDialogue);
  lines.push('```');
  lines.push('');
  lines.push('## 장면 맥락');
  if (context.sceneGoals.length > 0) {
    lines.push(`**목표:** ${context.sceneGoals.join(', ')}`);
  }
  lines.push(`**감정적 stakes:** ${context.emotionalStakes}`);
  lines.push('');
  lines.push('## 요구사항');
  lines.push('');
  lines.push('1. 감정을 직접 말하지 않기');
  lines.push('2. 행동이나 반응으로 감정 보여주기');
  lines.push('3. 말하지 않은 것으로 의미 전달하기');
  lines.push('4. 독자가 "행간을 읽을" 수 있도록 하기');
  lines.push('');
  lines.push('## 출력');
  lines.push('');
  lines.push('개선된 대화와 함께 다음을 포함해주세요:');
  lines.push('- 수정된 대화문');
  lines.push('- 추가할 행동 비트');
  lines.push('- 숨겨진 의미 설명');

  return lines.join('\n');
}
