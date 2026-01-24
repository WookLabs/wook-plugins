/**
 * Quality Gate Retry Logic
 *
 * Retry strategy:
 * - Retry 1: /revise only
 * - Retry 2: /revise with Critic feedback
 * - Retry 3: Partial rewrite of lowest-scoring section
 * - Retry 4+: User intervention required
 */

export interface QualityScore {
  total: number;
  breakdown: {
    category: string;
    score: number;
    feedback: string;
  }[];
}

export interface RetryContext {
  chapterNumber: number;
  attemptNumber: number;
  maxRetries: number;
  lastScore: QualityScore;
  threshold: number;
}

export type RetryStrategy = 'revise' | 'revise_with_feedback' | 'partial_rewrite' | 'user_intervention';

export function determineRetryStrategy(context: RetryContext): RetryStrategy {
  if (context.attemptNumber === 1) return 'revise';
  if (context.attemptNumber === 2) return 'revise_with_feedback';
  if (context.attemptNumber === 3) return 'partial_rewrite';
  return 'user_intervention';
}

export function getLowestScoringSection(score: QualityScore): string {
  const sorted = [...score.breakdown].sort((a, b) => a.score - b.score);
  return sorted[0]?.category || 'unknown';
}

export function buildRetryPrompt(strategy: RetryStrategy, context: RetryContext): string {
  switch (strategy) {
    case 'revise':
      return `${context.chapterNumber}화를 수정해주세요.`;
    case 'revise_with_feedback':
      const feedback = context.lastScore.breakdown
        .map(b => `- ${b.category}: ${b.feedback}`)
        .join('\n');
      return `${context.chapterNumber}화를 다음 피드백을 반영하여 수정해주세요:\n${feedback}`;
    case 'partial_rewrite':
      const section = getLowestScoringSection(context.lastScore);
      return `${context.chapterNumber}화의 "${section}" 섹션을 다시 작성해주세요.`;
    case 'user_intervention':
      return `${context.chapterNumber}화가 ${context.maxRetries}회 재시도 후에도 품질 기준(${context.threshold}점)을 통과하지 못했습니다. 수동 개입이 필요합니다.`;
  }
}

export function shouldContinueRetry(context: RetryContext): boolean {
  return context.attemptNumber < context.maxRetries &&
         context.lastScore.total < context.threshold;
}
