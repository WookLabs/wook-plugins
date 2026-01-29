import { describe, it, expect } from 'vitest';
import {
  determineRetryStrategy,
  getLowestScoringSection,
  buildRetryPrompt,
  shouldContinueRetry,
} from '../../src/retry/quality-gate.js';
import type { QualityScore, RetryContext } from '../../src/retry/quality-gate.js';

const makeScore = (total: number, breakdown: { category: string; score: number; feedback: string }[] = []): QualityScore => ({
  total,
  breakdown,
});

const makeContext = (overrides: Partial<RetryContext> = {}): RetryContext => ({
  chapterNumber: 5,
  attemptNumber: 1,
  maxRetries: 3,
  lastScore: makeScore(60, [
    { category: '플롯', score: 70, feedback: '괜찮음' },
    { category: '캐릭터', score: 50, feedback: '개선 필요' },
    { category: '문체', score: 60, feedback: '보통' },
  ]),
  threshold: 70,
  ...overrides,
});

describe('determineRetryStrategy', () => {
  it('should return revise for attempt 1', () => {
    expect(determineRetryStrategy(makeContext({ attemptNumber: 1 }))).toBe('revise');
  });

  it('should return revise_with_feedback for attempt 2', () => {
    expect(determineRetryStrategy(makeContext({ attemptNumber: 2 }))).toBe('revise_with_feedback');
  });

  it('should return partial_rewrite for attempt 3', () => {
    expect(determineRetryStrategy(makeContext({ attemptNumber: 3 }))).toBe('partial_rewrite');
  });

  it('should return user_intervention for attempt 4+', () => {
    expect(determineRetryStrategy(makeContext({ attemptNumber: 4 }))).toBe('user_intervention');
    expect(determineRetryStrategy(makeContext({ attemptNumber: 10 }))).toBe('user_intervention');
  });
});

describe('getLowestScoringSection', () => {
  it('should return the lowest scoring category', () => {
    const score = makeScore(60, [
      { category: '플롯', score: 70, feedback: '' },
      { category: '캐릭터', score: 50, feedback: '' },
      { category: '문체', score: 80, feedback: '' },
    ]);
    expect(getLowestScoringSection(score)).toBe('캐릭터');
  });

  it('should return unknown for empty breakdown', () => {
    expect(getLowestScoringSection(makeScore(0, []))).toBe('unknown');
  });

  it('should handle single item breakdown', () => {
    const score = makeScore(60, [{ category: '플롯', score: 60, feedback: '' }]);
    expect(getLowestScoringSection(score)).toBe('플롯');
  });
});

describe('buildRetryPrompt', () => {
  it('should build revise prompt with chapter number', () => {
    const prompt = buildRetryPrompt('revise', makeContext());
    expect(prompt).toContain('5화');
    expect(prompt).toContain('수정');
  });

  it('should build revise_with_feedback prompt with feedback', () => {
    const prompt = buildRetryPrompt('revise_with_feedback', makeContext());
    expect(prompt).toContain('5화');
    expect(prompt).toContain('피드백');
    expect(prompt).toContain('캐릭터');
  });

  it('should build partial_rewrite prompt with lowest section', () => {
    const prompt = buildRetryPrompt('partial_rewrite', makeContext());
    expect(prompt).toContain('5화');
    expect(prompt).toContain('캐릭터');
    expect(prompt).toContain('다시 작성');
  });

  it('should build user_intervention prompt with retry count and threshold', () => {
    const prompt = buildRetryPrompt('user_intervention', makeContext());
    expect(prompt).toContain('5화');
    expect(prompt).toContain('3'); // maxRetries
    expect(prompt).toContain('70'); // threshold
    expect(prompt).toContain('수동 개입');
  });
});

describe('shouldContinueRetry', () => {
  it('should return true when under max retries and below threshold', () => {
    expect(shouldContinueRetry(makeContext({ attemptNumber: 1, maxRetries: 3 }))).toBe(true);
  });

  it('should return false when at max retries', () => {
    expect(shouldContinueRetry(makeContext({ attemptNumber: 3, maxRetries: 3 }))).toBe(false);
  });

  it('should return false when score meets threshold', () => {
    expect(shouldContinueRetry(makeContext({ lastScore: makeScore(70), threshold: 70 }))).toBe(false);
  });

  it('should return false when score exceeds threshold', () => {
    expect(shouldContinueRetry(makeContext({ lastScore: makeScore(90), threshold: 70 }))).toBe(false);
  });

  it('should return true when exactly one below threshold', () => {
    expect(shouldContinueRetry(makeContext({
      attemptNumber: 1,
      lastScore: makeScore(69),
      threshold: 70
    }))).toBe(true);
  });
});
