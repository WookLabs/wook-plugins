/**
 * Voice Prompts
 *
 * LLM prompt templates for voice analysis and generation:
 * - buildVoiceAnalysisPrompt: Extract voice patterns from dialogue samples
 * - buildVoiceGenerationPrompt: Generate dialogue in character voice
 *
 * @module voice/voice-prompts
 */

import type { VoiceProfile, SpeechPatterns } from './types.js';

// ============================================================================
// Voice Analysis Prompts
// ============================================================================

/**
 * Character information for voice analysis
 */
export interface CharacterInfoForAnalysis {
  /** Character name */
  name: string;
  /** Character description (optional) */
  description?: string;
  /** Age range (optional) */
  age?: string;
  /** Occupation (optional) */
  occupation?: string;
  /** Personality traits (optional) */
  personalityTraits?: string[];
}

/**
 * Build LLM prompt for extracting voice patterns from dialogue samples
 *
 * @param dialogueSamples - Array of dialogue strings from the character
 * @param characterInfo - Information about the character
 * @returns Formatted prompt string
 */
export function buildVoiceAnalysisPrompt(
  dialogueSamples: string[],
  characterInfo: CharacterInfoForAnalysis
): string {
  const lines: string[] = [];

  // Header
  lines.push('# 캐릭터 음성 패턴 분석');
  lines.push('');
  lines.push('아래 대화 샘플에서 캐릭터의 음성 패턴을 추출해주세요.');
  lines.push('');

  // Character info
  lines.push('## 캐릭터 정보');
  lines.push(`**이름:** ${characterInfo.name}`);
  if (characterInfo.description) {
    lines.push(`**설명:** ${characterInfo.description}`);
  }
  if (characterInfo.age) {
    lines.push(`**나이대:** ${characterInfo.age}`);
  }
  if (characterInfo.occupation) {
    lines.push(`**직업:** ${characterInfo.occupation}`);
  }
  if (characterInfo.personalityTraits && characterInfo.personalityTraits.length > 0) {
    lines.push(`**성격 특성:** ${characterInfo.personalityTraits.join(', ')}`);
  }
  lines.push('');

  // Dialogue samples
  lines.push('## 대화 샘플');
  lines.push('');
  for (let i = 0; i < dialogueSamples.length; i++) {
    lines.push(`${i + 1}. "${dialogueSamples[i]}"`);
  }
  lines.push('');

  // Analysis instructions
  lines.push('## 분석 요청');
  lines.push('');
  lines.push('다음 항목들을 분석해주세요:');
  lines.push('');
  lines.push('### 1. 문장 구조 (Sentence Structure)');
  lines.push('- 선호하는 문장 길이 (short/medium/long/varied)');
  lines.push('- 복잡도 수준 (simple/moderate/complex)');
  lines.push('- 불완전 문장 사용 빈도 (never/rare/occasional/frequent)');
  lines.push('');
  lines.push('### 2. 어휘 (Vocabulary)');
  lines.push('- 말투 수준 (colloquial/standard/formal/literary)');
  lines.push('- 자주 사용하는 표현');
  lines.push('- 피하는 단어/표현');
  lines.push('');
  lines.push('### 3. 언어 습관 (Verbal Habits)');
  lines.push('- 말버릇/추임새 (예: "음", "저기")');
  lines.push('- 특징적 표현 (catchphrase)');
  lines.push('- 감탄사 사용 패턴');
  lines.push('- 완곡 표현 정도 (none/minimal/moderate/heavy)');
  lines.push('');
  lines.push('### 4. 말의 리듬 (Speech Rhythm)');
  lines.push('- 말 속도 (slow/moderate/fast/variable)');
  lines.push('- 끊어 말하기 빈도 (rare/occasional/frequent)');
  lines.push('');
  lines.push('### 5. 한국어 특성');
  lines.push('- 기본 존댓말 수준 (해체/해요체/하십시오체)');
  lines.push('- 사투리 특징 (있다면)');
  lines.push('');

  // Output format
  lines.push('## 출력 형식');
  lines.push('');
  lines.push('JSON 형식으로 응답해주세요:');
  lines.push('```json');
  lines.push('{');
  lines.push('  "sentenceStructure": {');
  lines.push('    "preferredLength": "medium",');
  lines.push('    "complexityLevel": "moderate",');
  lines.push('    "fragmentUsage": "rare"');
  lines.push('  },');
  lines.push('  "vocabulary": {');
  lines.push('    "register": "standard",');
  lines.push('    "favoredExpressions": ["...", "..."],');
  lines.push('    "avoidedWords": ["..."]');
  lines.push('  },');
  lines.push('  "verbalHabits": {');
  lines.push('    "fillers": ["음", "저기"],');
  lines.push('    "catchphrases": ["..."],');
  lines.push('    "exclamations": ["..."],');
  lines.push('    "hedging": "minimal"');
  lines.push('  },');
  lines.push('  "rhythm": {');
  lines.push('    "tempo": "moderate",');
  lines.push('    "pauseUsage": "occasional"');
  lines.push('  },');
  lines.push('  "honorificDefault": "haeyoche"');
  lines.push('}');
  lines.push('```');

  return lines.join('\n');
}

/**
 * Build LLM prompt for generating dialogue in character voice
 *
 * @param profile - Character voice profile
 * @returns Formatted prompt for dialogue generation
 */
export function buildVoiceGenerationPrompt(profile: VoiceProfile): string {
  const lines: string[] = [];

  // Header
  lines.push(`# ${profile.characterName} 캐릭터 대화 생성 가이드`);
  lines.push('');
  lines.push('이 가이드에 따라 캐릭터의 대화를 작성해주세요.');
  lines.push('');

  // Core voice characteristics
  lines.push('## 핵심 특성');
  lines.push('');

  const sp = profile.speechPatterns;

  // Sentence structure
  lines.push('### 문장 구조');
  lines.push(`- **길이:** ${describeLengthPreference(sp.sentenceStructure.preferredLength)}`);
  lines.push(`- **복잡도:** ${describeComplexity(sp.sentenceStructure.complexityLevel)}`);
  if (sp.sentenceStructure.fragmentUsage !== 'never') {
    lines.push(`- **불완전 문장:** ${describeFrequency(sp.sentenceStructure.fragmentUsage)}`);
  }
  lines.push('');

  // Vocabulary
  lines.push('### 어휘');
  lines.push(`- **말투 수준:** ${describeRegister(sp.vocabulary.register)}`);
  if (sp.vocabulary.favoredExpressions.length > 0) {
    lines.push(`- **자주 쓰는 표현:** "${sp.vocabulary.favoredExpressions.join('", "')}"`);
  }
  if (sp.vocabulary.avoidedWords && sp.vocabulary.avoidedWords.length > 0) {
    lines.push(`- **피해야 할 단어:** "${sp.vocabulary.avoidedWords.join('", "')}"`);
  }
  lines.push('');

  // Verbal habits
  lines.push('### 언어 습관');
  if (sp.verbalHabits.fillers.length > 0) {
    lines.push(`- **말버릇:** "${sp.verbalHabits.fillers.join('", "')}"`);
  }
  if (sp.verbalHabits.catchphrases.length > 0) {
    lines.push(`- **특징적 표현:** "${sp.verbalHabits.catchphrases.join('", "')}"`);
  }
  if (sp.verbalHabits.exclamations.length > 0) {
    lines.push(`- **감탄사:** "${sp.verbalHabits.exclamations.join('", "')}"`);
  }
  lines.push(`- **완곡 표현:** ${describeHedging(sp.verbalHabits.hedging)}`);
  lines.push('');

  // Rhythm
  lines.push('### 말의 리듬');
  lines.push(`- **속도:** ${describeTempo(sp.rhythm.tempo)}`);
  lines.push(`- **끊어 말하기:** ${describeFrequency(sp.rhythm.pauseUsage)}`);
  lines.push('');

  // Korean-specific
  lines.push('### 한국어 특성');
  lines.push(`- **기본 존댓말:** ${describeHonorific(profile.linguisticMarkers.honorificDefault)}`);
  if (profile.linguisticMarkers.dialectFeatures && profile.linguisticMarkers.dialectFeatures.length > 0) {
    lines.push(`- **사투리:** ${profile.linguisticMarkers.dialectFeatures.join(', ')}`);
  }
  lines.push('');

  // Do's and Don'ts
  lines.push('## 작성 시 주의사항');
  lines.push('');
  lines.push('### DO (해야 할 것)');
  const dos = generateDos(profile);
  for (const d of dos) {
    lines.push(`- ${d}`);
  }
  lines.push('');

  lines.push('### DON\'T (하지 말아야 할 것)');
  const donts = generateDonts(profile);
  for (const d of donts) {
    lines.push(`- ${d}`);
  }
  lines.push('');

  // Example transformation
  lines.push('## 예시');
  lines.push('');
  lines.push('**일반적인 대화:**');
  lines.push('"네, 알겠습니다."');
  lines.push('');
  lines.push(`**${profile.characterName} 스타일:**`);
  lines.push(generateExampleDialogue(profile));

  return lines.join('\n');
}

// ============================================================================
// Helper Functions
// ============================================================================

function describeLengthPreference(length: SpeechPatterns['sentenceStructure']['preferredLength']): string {
  const descriptions = {
    short: '짧은 문장 선호 (10-20자). 간결하고 직접적으로.',
    medium: '보통 길이 (20-40자). 자연스러운 대화체.',
    long: '긴 문장 선호 (40자 이상). 설명적이고 상세하게.',
    varied: '길이가 다양함. 상황에 따라 짧거나 길게.',
  };
  return descriptions[length];
}

function describeComplexity(complexity: SpeechPatterns['sentenceStructure']['complexityLevel']): string {
  const descriptions = {
    simple: '단순한 구조. 주어-목적어-서술어 기본형.',
    moderate: '적당한 복잡도. 접속사, 부사절 적절히 사용.',
    complex: '복잡한 구조. 종속절, 삽입절 자주 사용.',
  };
  return descriptions[complexity];
}

function describeFrequency(freq: 'never' | 'rare' | 'occasional' | 'frequent'): string {
  const descriptions = {
    never: '사용 안 함',
    rare: '거의 사용 안 함',
    occasional: '가끔 사용',
    frequent: '자주 사용',
  };
  return descriptions[freq];
}

function describeRegister(register: SpeechPatterns['vocabulary']['register']): string {
  const descriptions = {
    colloquial: '구어체/일상 대화. 은어, 줄임말 사용 가능.',
    standard: '표준어. 일반적인 대화체.',
    formal: '격식체. 정중한 표현, 완전한 문장.',
    literary: '문어체. 고급 어휘, 문학적 표현.',
  };
  return descriptions[register];
}

function describeHedging(hedging: SpeechPatterns['verbalHabits']['hedging']): string {
  const descriptions = {
    none: '직설적으로 말함',
    minimal: '약간의 완곡 표현',
    moderate: '보통 수준의 완곡 표현',
    heavy: '매우 우회적으로 말함',
  };
  return descriptions[hedging];
}

function describeTempo(tempo: SpeechPatterns['rhythm']['tempo']): string {
  const descriptions = {
    slow: '천천히. 생각하며 말하는 느낌.',
    moderate: '보통 속도. 자연스러운 대화.',
    fast: '빠르게. 급하거나 열정적인 느낌.',
    variable: '상황에 따라 다름.',
  };
  return descriptions[tempo];
}

function describeHonorific(hon: 'haeche' | 'haeyoche' | 'hapsyoche'): string {
  const descriptions = {
    haeche: '해체 (반말). 예: "그래", "알았어"',
    haeyoche: '해요체. 예: "그래요", "알겠어요"',
    hapsyoche: '하십시오체. 예: "그렇습니다", "알겠습니다"',
  };
  return descriptions[hon];
}

function generateDos(profile: VoiceProfile): string[] {
  const dos: string[] = [];
  const sp = profile.speechPatterns;

  if (sp.verbalHabits.fillers.length > 0) {
    dos.push(`"${sp.verbalHabits.fillers[0]}" 같은 말버릇 자연스럽게 넣기`);
  }

  if (sp.sentenceStructure.preferredLength === 'short') {
    dos.push('문장을 짧게 끊어서 쓰기');
  } else if (sp.sentenceStructure.preferredLength === 'long') {
    dos.push('설명을 충분히 붙여 긴 문장으로 쓰기');
  }

  if (sp.vocabulary.favoredExpressions.length > 0) {
    dos.push(`"${sp.vocabulary.favoredExpressions[0]}" 같은 표현 적절히 사용하기`);
  }

  dos.push(`${describeRegister(sp.vocabulary.register)} 유지하기`);

  return dos;
}

function generateDonts(profile: VoiceProfile): string[] {
  const donts: string[] = [];
  const sp = profile.speechPatterns;

  if (sp.vocabulary.avoidedWords && sp.vocabulary.avoidedWords.length > 0) {
    donts.push(`"${sp.vocabulary.avoidedWords[0]}" 같은 단어 사용하기`);
  }

  if (sp.sentenceStructure.preferredLength === 'short') {
    donts.push('불필요하게 긴 문장 쓰기');
  }

  if (sp.vocabulary.register === 'formal') {
    donts.push('은어나 줄임말 사용하기');
  } else if (sp.vocabulary.register === 'colloquial') {
    donts.push('너무 딱딱한 문어체 사용하기');
  }

  donts.push('캐릭터 음성에서 벗어난 표현 사용하기');

  return donts;
}

function generateExampleDialogue(profile: VoiceProfile): string {
  const sp = profile.speechPatterns;
  let example = '';

  // Build example based on profile characteristics
  if (sp.verbalHabits.fillers.length > 0) {
    example += `"${sp.verbalHabits.fillers[0]}... `;
  } else {
    example += '"';
  }

  if (profile.linguisticMarkers.honorificDefault === 'haeche') {
    example += '그래, 알았어';
  } else if (profile.linguisticMarkers.honorificDefault === 'hapsyoche') {
    example += '네, 알겠습니다';
  } else {
    example += '네, 알겠어요';
  }

  if (sp.sentenceStructure.fragmentUsage === 'frequent' || sp.sentenceStructure.fragmentUsage === 'occasional') {
    example += '... 근데';
  }

  example += '."';

  return example;
}
