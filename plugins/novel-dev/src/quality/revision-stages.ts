/**
 * Multi-Stage Revision Orchestrator
 *
 * Orchestrates the 4-stage revision pipeline, connecting stage evaluators
 * to the revision loop with stage-specific filtering.
 *
 * @module quality/revision-stages
 */

import type {
  RevisionStage,
  StageResult,
  MultiStageResult,
  MultiStageOptions,
  RevisionStageName,
} from './types.js';
import {
  DRAFT_DIRECTIVE_TYPES,
  TONE_DIRECTIVE_TYPES,
  STYLE_DIRECTIVE_TYPES,
  FINAL_DIRECTIVE_TYPES,
} from './types.js';
import {
  DraftStageEvaluator,
  ToneStageEvaluator,
  StyleStageEvaluator,
  FinalStageEvaluator,
} from './stage-evaluators.js';
import type { SurgeonCallback } from '../pipeline/prose-surgeon.js';

// ============================================================================
// Revision Stage Configuration
// ============================================================================

/**
 * The 4 revision stages in execution order
 *
 * Thresholds from RESEARCH.md:
 * - Draft: 70 (structural completeness)
 * - Tone: 75 (emotional alignment)
 * - Style: 80 (prose craft)
 * - Final: 95 (proofreading cleanliness)
 */
export const REVISION_STAGES: RevisionStage[] = [
  {
    name: 'draft',
    evaluator: DraftStageEvaluator,
    directiveTypes: DRAFT_DIRECTIVE_TYPES,
    modelConfig: { model: 'sonnet', temperature: 0.5 },
    maxIterations: 3,
    passThreshold: 70,
  },
  {
    name: 'tone',
    evaluator: ToneStageEvaluator,
    directiveTypes: TONE_DIRECTIVE_TYPES,
    modelConfig: { model: 'opus', temperature: 0.6 },
    maxIterations: 3,
    passThreshold: 75,
  },
  {
    name: 'style',
    evaluator: StyleStageEvaluator,
    directiveTypes: STYLE_DIRECTIVE_TYPES,
    modelConfig: { model: 'opus', temperature: 0.7 },
    maxIterations: 5,
    passThreshold: 80,
  },
  {
    name: 'final',
    evaluator: FinalStageEvaluator,
    directiveTypes: FINAL_DIRECTIVE_TYPES,
    modelConfig: { model: 'sonnet', temperature: 0.2 },
    maxIterations: 2,
    passThreshold: 95,
  },
];

// ============================================================================
// Multi-Stage Revision Orchestrator
// ============================================================================

/**
 * Run the multi-stage revision pipeline
 *
 * Processes content through all 4 stages sequentially:
 * 1. Evaluate input score for each stage
 * 2. Generate stage-specific directives
 * 3. Filter directives to only include stage-appropriate types
 * 4. Apply fixes using the surgeon callback
 * 5. Evaluate output score
 * 6. Track improvement per stage
 *
 * @param content - Initial chapter content
 * @param surgeonCallback - Callback to invoke the prose surgeon
 * @param options - Multi-stage options including scenes, style profile, etc.
 * @returns Multi-stage result with stage-by-stage breakdown
 */
export async function runMultiStageRevision(
  content: string,
  surgeonCallback: SurgeonCallback,
  options?: MultiStageOptions
): Promise<MultiStageResult> {
  const startTime = Date.now();
  let currentContent = content;
  const stageResults: StageResult[] = [];
  let passedAllStages = true;

  // Calculate initial score (first stage input)
  const initialScore = await REVISION_STAGES[0].evaluator.score(content, options);

  for (const stage of REVISION_STAGES) {
    // 1. Evaluate input score
    const inputScore = await stage.evaluator.score(currentContent, options);

    // 2. Generate directives
    const allDirectives = await stage.evaluator.generateDirectives(currentContent, options);

    // 3. Filter to stage-appropriate directives
    const stageDirectives = allDirectives.filter(d =>
      stage.directiveTypes.includes(d.type)
    );

    // 4. Apply fixes (simplified - in real implementation would use revision loop)
    let iterations = 0;
    let directivesProcessed = 0;

    for (const directive of stageDirectives) {
      if (iterations >= stage.maxIterations) break;

      try {
        // Build prompt for surgeon
        const targetText = directive.currentText;
        const prompt = buildStagePrompt(directive, stage);

        // Call surgeon
        const fixedText = await surgeonCallback(prompt, directive, stage.modelConfig);

        // Apply fix to content (simplified - would use applySurgicalFix in real implementation)
        if (fixedText && fixedText !== targetText) {
          currentContent = currentContent.replace(targetText, fixedText);
          directivesProcessed++;
        }
      } catch (error) {
        // Continue with next directive on error
      }

      iterations++;
    }

    // 5. Evaluate output score
    const outputScore = await stage.evaluator.score(currentContent, options);

    // 6. Track results
    const passed = outputScore >= stage.passThreshold;
    if (!passed) {
      passedAllStages = false;
    }

    stageResults.push({
      stage: stage.name,
      inputScore,
      outputScore,
      improvement: outputScore - inputScore,
      directivesProcessed,
      iterations,
      passed,
    });
  }

  // Calculate final score and total improvement
  const finalScore = stageResults[stageResults.length - 1]?.outputScore ?? initialScore;
  const totalImprovement = finalScore - initialScore;

  return {
    finalContent: currentContent,
    stageResults,
    totalImprovement,
    passedAllStages,
    durationMs: Date.now() - startTime,
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Build a stage-specific prompt for the surgeon
 */
function buildStagePrompt(
  directive: { id: string; type: string; issue: string; currentText: string; instruction: string; maxScope: number },
  stage: RevisionStage
): string {
  return `# ${stage.name.toUpperCase()} 단계 수정

## 지시 정보
- ID: ${directive.id}
- 유형: ${directive.type}
- 단계: ${stage.name}

## 문제점
${directive.issue}

## 현재 텍스트 (수정 대상)
\`\`\`
${directive.currentText}
\`\`\`

## 수정 지침
${directive.instruction}

## 단계별 주의사항
${getStageGuidance(stage.name)}

## 출력 형식
수정된 텍스트만 출력하세요. 설명 없이.
`;
}

/**
 * Get stage-specific guidance for the surgeon
 */
function getStageGuidance(stageName: RevisionStageName): string {
  switch (stageName) {
    case 'draft':
      return '- 구조적 문제에만 집중하세요\n- 세부 문체는 다음 단계에서 다룹니다\n- 장면 전환과 흐름이 핵심입니다';
    case 'tone':
      return '- 감정적 일관성에 집중하세요\n- 서브텍스트와 캐릭터 음성이 핵심입니다\n- 명시적 감정 표현을 암시적으로 바꾸세요';
    case 'style':
      return '- 문체 품질에 집중하세요\n- 필터 워드, 리듬, 감각 묘사가 핵심입니다\n- 한국어 자연스러움을 유지하세요';
    case 'final':
      return '- 교정에만 집중하세요\n- 맞춤법, 띄어쓰기, 문장부호가 핵심입니다\n- 내용을 변경하지 마세요';
  }
}
