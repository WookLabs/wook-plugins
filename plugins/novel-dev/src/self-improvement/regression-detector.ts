/**
 * Regression Detector
 *
 * Detects quality regression across chapters using EWMA (Exponentially
 * Weighted Moving Average) with z-score alerting and per-dimension
 * trend analysis via linear regression.
 *
 * Alert thresholds:
 * - Warning: z-score <= -1.5 OR slope <= -1.0
 * - Critical: z-score <= -2.0 OR slope <= -2.0
 * - Minimum 5 data points before any alerting
 *
 * @module self-improvement/regression-detector
 */

import {
  mean,
  standardDeviation,
  linearRegression,
} from 'simple-statistics';
import type {
  QualitySnapshot,
  TrendAnalysis,
  RegressionConfig,
  AlertLevel,
} from './types.js';

// ============================================================================
// Default Configuration
// ============================================================================

/**
 * Default regression detection configuration.
 *
 * Research-based defaults from 05-RESEARCH.md:
 * - Lambda 0.2: 80% weight to history, responsive to recent drops
 * - Window 5: balances noise reduction with responsiveness
 * - z-score thresholds: statistical standard for anomaly detection
 */
export const DEFAULT_REGRESSION_CONFIG: RegressionConfig = {
  lambda: 0.2,
  minDataPoints: 5,
  windowSize: 5,
  warningThreshold: -1.5,
  criticalThreshold: -2.0,
  slopeWarningThreshold: -1.0,
  slopeCriticalThreshold: -2.0,
};

// ============================================================================
// Dimension Name Mapping (Korean)
// ============================================================================

/** Korean names for quality dimension keys */
const DIMENSION_KOREAN_NAMES: Record<string, string> = {
  proseQuality: '문체 품질',
  sensoryGrounding: '감각 묘사',
  filterWordDensity: '필터워드 밀도',
  rhythmVariation: '리듬 변화',
  characterVoice: '캐릭터 음성',
  transitionQuality: '전환 품질',
  honorificConsistency: '경어 일관성',
  koreanTexture: '한국어 텍스처',
  styleAlignment: '문체 정합성',
};

// ============================================================================
// EWMA Computation
// ============================================================================

/**
 * Compute Exponentially Weighted Moving Average.
 *
 * EWMA = lambda * current + (1 - lambda) * previous_ewma
 *
 * @param scores - Array of scores in chronological order
 * @param lambda - Smoothing factor (0-1). Higher = more weight to recent values.
 * @returns Final EWMA value, or 0 for empty input
 */
export function computeEWMA(scores: number[], lambda: number): number {
  if (scores.length === 0) return 0;

  let ewma = scores[0];
  for (let i = 1; i < scores.length; i++) {
    ewma = lambda * scores[i] + (1 - lambda) * ewma;
  }
  return ewma;
}

// ============================================================================
// Per-Dimension Trend Analysis
// ============================================================================

/**
 * Compute linear regression trends for each quality dimension.
 *
 * For each dimension key present in the snapshots, extracts the last
 * windowSize values and computes the slope. Marks as declining if
 * the slope drops below -0.5.
 *
 * @param snapshots - Quality snapshots (chronological)
 * @param windowSize - Number of recent snapshots to analyze
 * @returns Per-dimension trend analysis
 */
export function computeDimensionTrends(
  snapshots: QualitySnapshot[],
  windowSize: number
): Record<string, { slope: number; declining: boolean }> {
  const result: Record<string, { slope: number; declining: boolean }> = {};

  if (snapshots.length === 0) return result;

  // Use the last windowSize snapshots (or all if fewer)
  const window = snapshots.slice(-windowSize);

  // Collect all dimension keys across the window
  const dimensionKeys = new Set<string>();
  for (const snap of window) {
    for (const key of Object.keys(snap.dimensions)) {
      dimensionKeys.add(key);
    }
  }

  for (const key of dimensionKeys) {
    // Extract values for this dimension, building [index, value] pairs
    const pairs: Array<[number, number]> = [];
    for (let i = 0; i < window.length; i++) {
      const value = window[i].dimensions[key];
      if (value !== undefined) {
        pairs.push([i, value]);
      }
    }

    if (pairs.length < 2) {
      // Cannot compute regression with fewer than 2 points
      result[key] = { slope: 0, declining: false };
      continue;
    }

    const regression = linearRegression(pairs);
    const slope = regression.m;

    result[key] = {
      slope,
      declining: slope < -0.5,
    };
  }

  return result;
}

// ============================================================================
// Alert Message Builder
// ============================================================================

/**
 * Build a human-readable alert message based on regression analysis.
 *
 * @param alertLevel - Severity level
 * @param zScoreValue - Computed z-score of latest score
 * @param slope - Linear regression slope over recent window
 * @param rollingAvg - Rolling average of recent scores
 * @param dimensionTrends - Per-dimension trend analysis
 * @returns Alert message string, or undefined for 'none' level
 */
export function buildAlertMessage(
  alertLevel: AlertLevel,
  zScoreValue: number,
  slope: number,
  rollingAvg: number,
  dimensionTrends: Record<string, { slope: number; declining: boolean }>
): string | undefined {
  if (alertLevel === 'none') return undefined;

  // Collect declining dimension names in Korean
  const decliningDimensions: string[] = [];
  for (const [key, trend] of Object.entries(dimensionTrends)) {
    if (trend.declining) {
      decliningDimensions.push(DIMENSION_KOREAN_NAMES[key] ?? key);
    }
  }

  const decliningText = decliningDimensions.length > 0
    ? decliningDimensions.join(', ')
    : '';

  if (alertLevel === 'warning') {
    const parts = [
      `Quality warning: current score is ${zScoreValue.toFixed(1)} standard deviations below average (${rollingAvg.toFixed(1)}).`,
    ];
    if (decliningText) {
      parts.push(`Declining dimensions: ${decliningText}.`);
    }
    return parts.join(' ');
  }

  if (alertLevel === 'critical') {
    const parts = [
      `CRITICAL quality regression: score dropped significantly (z-score: ${zScoreValue.toFixed(2)}, trend slope: ${slope.toFixed(2)}).`,
    ];
    if (decliningText) {
      parts.push(`Declining dimensions: ${decliningText}.`);
    } else {
      parts.push('No individual dimension trends declining.');
    }
    parts.push('Consider reviewing recent chapters.');
    return parts.join(' ');
  }

  return undefined;
}

// ============================================================================
// Main Regression Detection
// ============================================================================

/**
 * Detect quality regression from a series of quality snapshots.
 *
 * Algorithm:
 * 1. If fewer than minDataPoints, return no regression (insufficient data)
 * 2. Compute rolling average over last windowSize scores
 * 3. Compute EWMA with configured lambda
 * 4. Compute linear regression slope over last windowSize scores
 * 5. Compute z-score of latest score against historical distribution
 * 6. Determine alert level from z-score and slope thresholds
 * 7. Compute per-dimension trends
 * 8. Build alert message
 *
 * @param snapshots - Quality snapshots in chronological order
 * @param config - Optional regression configuration overrides
 * @returns TrendAnalysis with regression detection results
 */
export function detectRegression(
  snapshots: QualitySnapshot[],
  config?: Partial<RegressionConfig>
): TrendAnalysis {
  const cfg = { ...DEFAULT_REGRESSION_CONFIG, ...config };

  // Insufficient data guard
  if (snapshots.length < cfg.minDataPoints) {
    return {
      regressionDetected: false,
      alertLevel: 'none',
      rollingAverage: 0,
      ewma: 0,
      trendSlope: 0,
      dimensionTrends: {},
    };
  }

  const scores = snapshots.map(s => s.overallScore);

  // Rolling average: mean of last windowSize scores
  const windowScores = scores.slice(-cfg.windowSize);
  const rollingAverage = mean(windowScores);

  // EWMA
  const ewma = computeEWMA(scores, cfg.lambda);

  // Linear regression slope over last windowSize scores
  const regressionPairs: Array<[number, number]> = windowScores.map(
    (score, i) => [i, score]
  );
  const slope = linearRegression(regressionPairs).m;

  // Z-score: latest score vs historical distribution (all but latest)
  const historicalScores = scores.slice(0, -1);
  const latestScore = scores[scores.length - 1];

  let zScoreValue = 0;
  if (historicalScores.length >= 2) {
    const histMean = mean(historicalScores);
    const histStdDev = standardDeviation(historicalScores);

    if (histStdDev > 0) {
      zScoreValue = (latestScore - histMean) / histStdDev;
    }
    // If stdDev is 0 (all identical), z-score stays 0
  }

  // Determine alert level
  let alertLevel: AlertLevel = 'none';
  if (zScoreValue <= cfg.criticalThreshold || slope <= cfg.slopeCriticalThreshold) {
    alertLevel = 'critical';
  } else if (zScoreValue <= cfg.warningThreshold || slope <= cfg.slopeWarningThreshold) {
    alertLevel = 'warning';
  }

  // Per-dimension trends
  const dimensionTrends = computeDimensionTrends(snapshots, cfg.windowSize);

  // Build alert message
  const alertMessage = buildAlertMessage(
    alertLevel,
    zScoreValue,
    slope,
    rollingAverage,
    dimensionTrends
  );

  return {
    rollingAverage,
    ewma,
    trendSlope: slope,
    regressionDetected: alertLevel !== 'none',
    alertLevel,
    alertMessage,
    dimensionTrends,
  };
}
