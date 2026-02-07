/**
 * Regression Detector Tests
 *
 * Tests for the EWMA-based quality regression detection system:
 * - computeEWMA: empty, single, constant, declining sequences
 * - computeDimensionTrends: stable, declining, multi-dimension, window sizing
 * - detectRegression: minimum data, stable, declining, sharp drop, improving, identical
 * - buildAlertMessage: none, warning, critical, Korean dimension names
 */

import { describe, it, expect } from 'vitest';
import type { QualitySnapshot } from '../../src/self-improvement/types.js';
import {
  computeEWMA,
  computeDimensionTrends,
  detectRegression,
  buildAlertMessage,
  DEFAULT_REGRESSION_CONFIG,
} from '../../src/self-improvement/regression-detector.js';

// ============================================================================
// Helpers
// ============================================================================

/**
 * Factory function to create a QualitySnapshot with sensible defaults.
 */
function makeSnapshot(
  chapter: number,
  score: number,
  dims?: Partial<Record<string, number>>,
  overrides?: Partial<QualitySnapshot>
): QualitySnapshot {
  return {
    chapterNumber: chapter,
    timestamp: new Date().toISOString(),
    version: overrides?.version ?? 1,
    overallScore: score,
    dimensions: {
      proseQuality: dims?.proseQuality ?? score,
      sensoryGrounding: dims?.sensoryGrounding ?? score - 5,
      rhythmVariation: dims?.rhythmVariation ?? score - 2,
      characterVoice: dims?.characterVoice ?? score - 3,
      ...dims,
    },
    verdict: score >= 70 ? 'PASS' : 'REVISE',
    ...overrides,
  };
}

// ============================================================================
// computeEWMA Tests
// ============================================================================

describe('computeEWMA', () => {
  it('should return 0 for empty array', () => {
    expect(computeEWMA([], 0.2)).toBe(0);
  });

  it('should return the value itself for single-element array', () => {
    expect(computeEWMA([75], 0.2)).toBe(75);
  });

  it('should return the constant value for constant array', () => {
    const result = computeEWMA([80, 80, 80, 80, 80], 0.2);
    expect(result).toBeCloseTo(80, 5);
  });

  it('should be higher than last value for declining sequence (smoothed)', () => {
    const scores = [90, 85, 80, 75, 70];
    const ewma = computeEWMA(scores, 0.2);

    // EWMA should be between the last value (70) and the first (90)
    expect(ewma).toBeGreaterThan(70);
    expect(ewma).toBeLessThan(90);
  });

  it('should compute correct EWMA for known sequence with lambda 0.2', () => {
    // [80, 75, 70]
    // ewma_0 = 80
    // ewma_1 = 0.2 * 75 + 0.8 * 80 = 15 + 64 = 79
    // ewma_2 = 0.2 * 70 + 0.8 * 79 = 14 + 63.2 = 77.2
    const result = computeEWMA([80, 75, 70], 0.2);
    expect(result).toBeCloseTo(77.2, 5);
  });
});

// ============================================================================
// computeDimensionTrends Tests
// ============================================================================

describe('computeDimensionTrends', () => {
  it('should report stable slopes for consistent scores', () => {
    const snapshots = [
      makeSnapshot(1, 80, { proseQuality: 80, sensoryGrounding: 75 }),
      makeSnapshot(2, 81, { proseQuality: 81, sensoryGrounding: 76 }),
      makeSnapshot(3, 80, { proseQuality: 80, sensoryGrounding: 75 }),
      makeSnapshot(4, 81, { proseQuality: 81, sensoryGrounding: 76 }),
      makeSnapshot(5, 80, { proseQuality: 80, sensoryGrounding: 75 }),
    ];

    const trends = computeDimensionTrends(snapshots, 5);

    expect(trends.proseQuality).toBeDefined();
    expect(Math.abs(trends.proseQuality.slope)).toBeLessThan(0.5);
    expect(trends.proseQuality.declining).toBe(false);
  });

  it('should detect declining prose_quality', () => {
    const snapshots = [
      makeSnapshot(1, 90, { proseQuality: 90 }),
      makeSnapshot(2, 85, { proseQuality: 85 }),
      makeSnapshot(3, 78, { proseQuality: 78 }),
      makeSnapshot(4, 70, { proseQuality: 70 }),
      makeSnapshot(5, 62, { proseQuality: 62 }),
    ];

    const trends = computeDimensionTrends(snapshots, 5);

    expect(trends.proseQuality.slope).toBeLessThan(-0.5);
    expect(trends.proseQuality.declining).toBe(true);
  });

  it('should track each dimension independently', () => {
    const snapshots = [
      makeSnapshot(1, 80, { proseQuality: 90, sensoryGrounding: 70 }),
      makeSnapshot(2, 80, { proseQuality: 85, sensoryGrounding: 75 }),
      makeSnapshot(3, 80, { proseQuality: 80, sensoryGrounding: 80 }),
      makeSnapshot(4, 80, { proseQuality: 75, sensoryGrounding: 85 }),
      makeSnapshot(5, 80, { proseQuality: 70, sensoryGrounding: 90 }),
    ];

    const trends = computeDimensionTrends(snapshots, 5);

    // Prose declining, sensory improving
    expect(trends.proseQuality.declining).toBe(true);
    expect(trends.sensoryGrounding.declining).toBe(false);
    expect(trends.sensoryGrounding.slope).toBeGreaterThan(0);
  });

  it('should use all available data when window is larger than data length', () => {
    const snapshots = [
      makeSnapshot(1, 80, { proseQuality: 80 }),
      makeSnapshot(2, 82, { proseQuality: 82 }),
    ];

    // Window of 10 but only 2 data points
    const trends = computeDimensionTrends(snapshots, 10);

    expect(trends.proseQuality).toBeDefined();
    expect(trends.proseQuality.slope).toBeGreaterThanOrEqual(0);
  });
});

// ============================================================================
// detectRegression Tests
// ============================================================================

describe('detectRegression', () => {
  it('should return no regression with fewer than minDataPoints (5)', () => {
    const snapshots = [
      makeSnapshot(1, 80),
      makeSnapshot(2, 75),
      makeSnapshot(3, 70),
      makeSnapshot(4, 65),
    ];

    const result = detectRegression(snapshots);

    expect(result.regressionDetected).toBe(false);
    expect(result.alertLevel).toBe('none');
    expect(result.rollingAverage).toBe(0);
    expect(result.ewma).toBe(0);
    expect(result.trendSlope).toBe(0);
  });

  it('should detect no regression for stable scores [80, 82, 79, 81, 80]', () => {
    const snapshots = [
      makeSnapshot(1, 80),
      makeSnapshot(2, 82),
      makeSnapshot(3, 79),
      makeSnapshot(4, 81),
      makeSnapshot(5, 80),
    ];

    const result = detectRegression(snapshots);

    expect(result.regressionDetected).toBe(false);
    expect(result.alertLevel).toBe('none');
  });

  it('should detect regression for gradual decline [85, 80, 75, 70, 65]', () => {
    const snapshots = [
      makeSnapshot(1, 85),
      makeSnapshot(2, 80),
      makeSnapshot(3, 75),
      makeSnapshot(4, 70),
      makeSnapshot(5, 65),
    ];

    const result = detectRegression(snapshots);

    expect(result.regressionDetected).toBe(true);
    expect(['warning', 'critical']).toContain(result.alertLevel);
    expect(result.trendSlope).toBeLessThan(0);
  });

  it('should fire critical alert for sharp drop [80, 80, 80, 80, 40]', () => {
    const snapshots = [
      makeSnapshot(1, 80),
      makeSnapshot(2, 80),
      makeSnapshot(3, 80),
      makeSnapshot(4, 80),
      makeSnapshot(5, 40),
    ];

    const result = detectRegression(snapshots);

    expect(result.regressionDetected).toBe(true);
    expect(result.alertLevel).toBe('critical');
    expect(result.alertMessage).toContain('CRITICAL');
  });

  it('should detect no regression for improving scores [60, 65, 70, 75, 80]', () => {
    const snapshots = [
      makeSnapshot(1, 60),
      makeSnapshot(2, 65),
      makeSnapshot(3, 70),
      makeSnapshot(4, 75),
      makeSnapshot(5, 80),
    ];

    const result = detectRegression(snapshots);

    expect(result.regressionDetected).toBe(false);
    expect(result.alertLevel).toBe('none');
  });

  it('should handle all identical scores [80, 80, 80, 80, 80] without regression', () => {
    const snapshots = [
      makeSnapshot(1, 80),
      makeSnapshot(2, 80),
      makeSnapshot(3, 80),
      makeSnapshot(4, 80),
      makeSnapshot(5, 80),
    ];

    const result = detectRegression(snapshots);

    expect(result.regressionDetected).toBe(false);
    expect(result.alertLevel).toBe('none');
  });

  it('should respect custom config thresholds', () => {
    // Mild decline that would NOT trigger default thresholds
    const snapshots = [
      makeSnapshot(1, 80),
      makeSnapshot(2, 79),
      makeSnapshot(3, 78),
      makeSnapshot(4, 77),
      makeSnapshot(5, 76),
    ];

    // With default config this should NOT trigger (slope ~ -1.0, z-score mild)
    const defaultResult = detectRegression(snapshots);

    // With very sensitive custom thresholds, it should trigger warning
    // Set both slope thresholds to control which level fires
    const sensitiveResult = detectRegression(snapshots, {
      slopeWarningThreshold: -0.5,   // Very sensitive warning
      slopeCriticalThreshold: -5.0,  // Very high critical bar (won't trigger)
      criticalThreshold: -5.0,       // Very high z-score critical bar
    });

    expect(sensitiveResult.regressionDetected).toBe(true);
    expect(sensitiveResult.alertLevel).toBe('warning');
  });
});

// ============================================================================
// buildAlertMessage Tests
// ============================================================================

describe('buildAlertMessage', () => {
  it('should return undefined for "none" alert level', () => {
    const result = buildAlertMessage('none', 0, 0, 80, {});

    expect(result).toBeUndefined();
  });

  it('should include "Quality warning" text for warning level', () => {
    const result = buildAlertMessage('warning', -1.7, -0.8, 75.5, {
      proseQuality: { slope: -0.3, declining: false },
    });

    expect(result).toBeDefined();
    expect(result).toContain('Quality warning');
    expect(result).toContain('-1.7');
    expect(result).toContain('75.5');
  });

  it('should include "CRITICAL" text and declining dimensions in Korean for critical level', () => {
    const result = buildAlertMessage('critical', -2.5, -3.0, 65.0, {
      proseQuality: { slope: -2.0, declining: true },
      sensoryGrounding: { slope: -1.5, declining: true },
      rhythmVariation: { slope: 0.1, declining: false },
    });

    expect(result).toBeDefined();
    expect(result).toContain('CRITICAL');
    expect(result).toContain('-2.50');
    expect(result).toContain('-3.00');
    // Korean dimension names
    expect(result).toContain('문체 품질');
    expect(result).toContain('감각 묘사');
    // Non-declining dimension should NOT be listed
    expect(result).not.toContain('리듬 변화');
  });

  it('should list declining dimension names in Korean', () => {
    const result = buildAlertMessage('warning', -1.6, -0.5, 72.0, {
      characterVoice: { slope: -1.0, declining: true },
      koreanTexture: { slope: -0.8, declining: true },
    });

    expect(result).toContain('캐릭터 음성');
    expect(result).toContain('한국어 텍스처');
  });
});

// ============================================================================
// DEFAULT_REGRESSION_CONFIG Tests
// ============================================================================

describe('DEFAULT_REGRESSION_CONFIG', () => {
  it('should have expected default values', () => {
    expect(DEFAULT_REGRESSION_CONFIG.lambda).toBe(0.2);
    expect(DEFAULT_REGRESSION_CONFIG.minDataPoints).toBe(5);
    expect(DEFAULT_REGRESSION_CONFIG.windowSize).toBe(5);
    expect(DEFAULT_REGRESSION_CONFIG.warningThreshold).toBe(-1.5);
    expect(DEFAULT_REGRESSION_CONFIG.criticalThreshold).toBe(-2.0);
    expect(DEFAULT_REGRESSION_CONFIG.slopeWarningThreshold).toBe(-1.0);
    expect(DEFAULT_REGRESSION_CONFIG.slopeCriticalThreshold).toBe(-2.0);
  });
});
