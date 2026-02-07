/**
 * Style Analysis Prompts
 *
 * Prompt templates for LLM-based qualitative style analysis.
 * Used to extract tone descriptors, narrative voice, and other
 * patterns that require semantic understanding.
 *
 * @module style-library/analysis-prompts
 */

import type { StyleProfile, Stylometrics, QualitativePatterns } from './style-profile.js';

// ============================================================================
// Qualitative Analysis Prompt
// ============================================================================

/**
 * Build prompt for extracting qualitative style patterns
 *
 * This prompt asks the LLM to analyze tone, voice, pacing, and
 * other semantic patterns that can't be computed algorithmically.
 *
 * @param text - Reference text to analyze (recommend 2000-5000 chars)
 * @returns Prompt string for LLM
 */
export function buildQualitativeAnalysisPrompt(text: string): string {
  const sampleText = text.slice(0, 5000);

  return `다음 한국어 소설 텍스트의 문체적 특성을 분석해주세요.

<텍스트>
${sampleText}
</텍스트>

다음 형식으로 JSON 응답을 제공해주세요:

{
  "toneDescriptors": ["형용사1", "형용사2", "형용사3"],
  "narrativeVoice": "first-person" | "third-person-limited" | "third-person-omniscient",
  "paceDescriptor": "slow" | "moderate" | "fast" | "variable",
  "dialogueStyle": "minimal" | "balanced" | "dialogue-heavy",
  "analysis": "간단한 분석 설명 (2-3문장)"
}

분석 기준:
1. toneDescriptors: 텍스트의 전체적인 톤을 나타내는 형용사 3-5개 (예: "서정적", "긴장감 있는", "담담한", "우울한", "경쾌한")
2. narrativeVoice: 서술 시점
   - "first-person": 1인칭 (나, 저)
   - "third-person-limited": 3인칭 제한 시점 (특정 인물의 시점에서 서술)
   - "third-person-omniscient": 3인칭 전지적 시점 (모든 인물의 내면 서술)
3. paceDescriptor: 전체적인 서술 속도
   - "slow": 묘사가 많고 천천히 진행
   - "moderate": 적절한 속도
   - "fast": 빠르게 전개, 간결한 문장
   - "variable": 속도 변화가 큼
4. dialogueStyle: 대화 사용 스타일
   - "minimal": 대화가 거의 없음
   - "balanced": 서술과 대화가 균형
   - "dialogue-heavy": 대화 중심

JSON 형식으로만 응답하세요.`;
}

// ============================================================================
// Style Comparison Prompt
// ============================================================================

/**
 * Build prompt for detailed style comparison
 *
 * This prompt compares content against a target style profile and
 * provides specific feedback for alignment.
 *
 * @param content - Content to evaluate
 * @param profile - Target StyleProfile
 * @returns Prompt string for LLM
 */
export function buildStyleComparisonPrompt(content: string, profile: StyleProfile): string {
  const sampleContent = content.slice(0, 3000);
  const styleDesc = formatStyleProfileDescription(profile);

  return `다음 텍스트가 목표 문체 프로필과 얼마나 일치하는지 분석해주세요.

<목표 문체>
${styleDesc}
</목표 문체>

<분석할 텍스트>
${sampleContent}
</분석할 텍스트>

다음 형식으로 JSON 응답을 제공해주세요:

{
  "overallAlignment": 0-100,
  "toneMatch": {
    "score": 0-100,
    "feedback": "톤 일치도에 대한 피드백"
  },
  "voiceMatch": {
    "score": 0-100,
    "feedback": "서술 시점 일치도에 대한 피드백"
  },
  "paceMatch": {
    "score": 0-100,
    "feedback": "속도감 일치도에 대한 피드백"
  },
  "suggestions": [
    "개선 제안 1",
    "개선 제안 2"
  ]
}

분석 시 고려사항:
1. 정량적 지표(TTR, 문장 길이 등)보다 질적인 느낌에 집중
2. 목표 문체의 톤 묘사자와 실제 텍스트의 느낌 비교
3. 구체적이고 실행 가능한 개선 제안 제공

JSON 형식으로만 응답하세요.`;
}

/**
 * Format StyleProfile into human-readable description
 *
 * @param profile - StyleProfile to describe
 * @returns Formatted description string
 */
function formatStyleProfileDescription(profile: StyleProfile): string {
  const { stylometrics, qualitativePatterns } = profile;

  const voiceNames = {
    'first-person': '1인칭',
    'third-person-limited': '3인칭 제한 시점',
    'third-person-omniscient': '3인칭 전지적 시점',
  };

  const paceNames = {
    slow: '느린',
    moderate: '보통',
    fast: '빠른',
    variable: '가변적',
  };

  const dialogueNames = {
    minimal: '대화 최소',
    balanced: '대화-서술 균형',
    'dialogue-heavy': '대화 중심',
  };

  const lines: string[] = [
    `프로필 이름: ${profile.name}`,
    ``,
    `[정량적 특성]`,
    `- 어휘 다양성: TTR ${(stylometrics.lexicalDiversity.ttr * 100).toFixed(0)}%, MTLD ${stylometrics.lexicalDiversity.mtld.toFixed(0)}`,
    `- 평균 문장 길이: ${stylometrics.sentenceStatistics.meanLength.toFixed(1)}단어`,
    `- 대화 비율: ${(stylometrics.dialogueMetrics.dialogueRatio * 100).toFixed(0)}%`,
    `- 감각 밀도: ${stylometrics.sensoryMetrics.sensoryDensity.toFixed(1)}/1000자`,
    ``,
    `[질적 특성]`,
    `- 톤: ${qualitativePatterns.toneDescriptors.join(', ') || '미지정'}`,
    `- 시점: ${voiceNames[qualitativePatterns.narrativeVoice]}`,
    `- 속도감: ${paceNames[qualitativePatterns.paceDescriptor]}`,
    `- 대화 스타일: ${dialogueNames[qualitativePatterns.dialogueStyle]}`,
  ];

  if (profile.constraints.length > 0) {
    lines.push('');
    lines.push('[스타일 제약]');
    for (const constraint of profile.constraints) {
      lines.push(`- ${constraint.target}`);
    }
  }

  return lines.join('\n');
}

// ============================================================================
// Style Constraint Prompt
// ============================================================================

/**
 * Build prompt for generating style-aware writing instructions
 *
 * Creates instructions that can be injected into generation prompts
 * to guide the LLM toward matching the target style.
 *
 * @param profile - Target StyleProfile
 * @returns Style instruction string for prompt injection
 */
export function buildStyleInstructionPrompt(profile: StyleProfile): string {
  const { stylometrics, qualitativePatterns, constraints } = profile;

  const voiceInstructions = {
    'first-person': '1인칭(나/저) 시점으로 서술하세요.',
    'third-person-limited': '3인칭 제한 시점으로, 주인공의 시점에서만 서술하세요.',
    'third-person-omniscient': '3인칭 전지적 시점으로, 필요시 여러 인물의 내면을 서술하세요.',
  };

  const paceInstructions = {
    slow: '천천히 묘사에 공을 들여 서술하세요. 분위기와 디테일을 살리세요.',
    moderate: '적절한 속도로 서술하세요. 묘사와 행동의 균형을 유지하세요.',
    fast: '간결하고 빠르게 서술하세요. 불필요한 묘사를 줄이세요.',
    variable: '장면에 따라 속도를 조절하세요. 긴장감 있는 장면은 빠르게, 감정적 장면은 천천히.',
  };

  const lines: string[] = [
    `## 문체 가이드라인`,
    ``,
    `다음 문체 특성을 준수하세요:`,
    ``,
    `### 서술 시점`,
    voiceInstructions[qualitativePatterns.narrativeVoice],
    ``,
    `### 톤`,
  ];

  if (qualitativePatterns.toneDescriptors.length > 0) {
    lines.push(`전체적으로 ${qualitativePatterns.toneDescriptors.join(', ')} 느낌을 유지하세요.`);
  } else {
    lines.push(`일관된 톤을 유지하세요.`);
  }

  lines.push('');
  lines.push('### 속도감');
  lines.push(paceInstructions[qualitativePatterns.paceDescriptor]);

  lines.push('');
  lines.push('### 대화 사용');
  const dialoguePercent = Math.round(stylometrics.dialogueMetrics.dialogueRatio * 100);
  if (dialoguePercent < 20) {
    lines.push('대화를 절제하여 사용하세요. 서술 중심으로 진행하세요.');
  } else if (dialoguePercent > 50) {
    lines.push('대화를 적극적으로 활용하세요. 캐릭터 간 상호작용을 통해 이야기를 전개하세요.');
  } else {
    lines.push('대화와 서술을 균형 있게 사용하세요.');
  }

  lines.push('');
  lines.push('### 문장 구조');
  const meanLen = stylometrics.sentenceStatistics.meanLength;
  if (meanLen < 12) {
    lines.push('짧고 간결한 문장을 사용하세요. 평균 10단어 내외.');
  } else if (meanLen > 20) {
    lines.push('비교적 긴 문장을 사용하세요. 복문과 묘사를 풍부하게.');
  } else {
    lines.push('중간 길이의 문장을 사용하세요. 12-18단어 내외.');
  }

  if (constraints.length > 0) {
    lines.push('');
    lines.push('### 스타일 제약');
    for (const constraint of constraints) {
      lines.push(`- ${constraint.target}`);
    }
  }

  return lines.join('\n');
}

// ============================================================================
// Style Deviation Feedback Prompt
// ============================================================================

/**
 * Build prompt for generating detailed feedback on style deviations
 *
 * @param content - Content that deviated from style
 * @param deviations - List of identified deviations
 * @returns Prompt for generating detailed feedback
 */
export function buildDeviationFeedbackPrompt(
  content: string,
  deviations: Array<{ aspect: string; expected: string; actual: string; suggestion: string }>
): string {
  const deviationList = deviations
    .map(d => `- ${d.aspect}: 목표 ${d.expected}, 실제 ${d.actual}`)
    .join('\n');

  return `다음 텍스트에서 발견된 문체 이탈에 대해 구체적인 수정 제안을 해주세요.

<텍스트>
${content.slice(0, 2000)}
</텍스트>

<발견된 이탈>
${deviationList}
</발견된 이탈>

각 이탈에 대해:
1. 텍스트에서 구체적인 예시를 찾아 인용하세요
2. 어떻게 수정하면 좋을지 구체적으로 제안하세요
3. 수정 예시를 제공하세요

JSON 형식으로 응답하세요:
{
  "corrections": [
    {
      "aspect": "이탈 항목",
      "originalText": "원문 인용",
      "suggestion": "수정 제안",
      "revisedText": "수정된 예시"
    }
  ]
}`;
}
