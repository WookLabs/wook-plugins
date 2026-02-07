/**
 * Self-Improvement Type Definitions
 *
 * Types for:
 * - Plan 01: Exemplar auto-accumulation (ExemplarCandidate, CollectorConfig)
 * - Plan 02: Quality trend tracking (QualitySnapshot, TrendData, TrendAnalysis, RegressionConfig)
 *
 * @module self-improvement/types
 */

import type { ExemplarCategory } from '../style-library/types.js';

// ============================================================================
// Alert Level
// ============================================================================

/**
 * Alert severity for regression detection
 */
export type AlertLevel = 'none' | 'warning' | 'critical';

// ============================================================================
// Exemplar Candidate (Plan 01 - Collector)
// ============================================================================

/**
 * A candidate passage extracted from an evaluated chapter
 * for potential promotion to the Style Library.
 *
 * Passages must be 500-2000 chars (per StyleExemplar schema constraint).
 */
export interface ExemplarCandidate {
  /** Passage text (500-2000 chars) */
  content: string;

  /** Quality score from Quality Oracle assessment (0-100) */
  qualityScore: number;

  /** Style match score from computeStyleMatch or fallback to qualityScore (0-100) */
  styleMatchScore: number;

  /** Combined score: 0.6 * qualityScore + 0.4 * styleMatchScore (0-100) */
  combinedScore: number;

  /** Auto-classified category from classifyExemplar() */
  category: ExemplarCategory;

  /** Chapter number this passage was extracted from */
  sourceChapter: number;

  /** Start and end paragraph indices in original chapter */
  paragraphRange: [number, number];
}

// ============================================================================
// Collector Config (Plan 01)
// ============================================================================

/**
 * Configuration for the exemplar auto-accumulation pipeline
 */
export interface CollectorConfig {
  /** Minimum combinedScore for promotion (default: 85) */
  promotionThreshold: number;

  /** Top percentile of passages to consider (default: 0.1 = top 10%) */
  topPercentile: number;

  /** Maximum exemplars per scene_type in the library (default: 50) */
  maxPerSceneType: number;

  /** Stylometric similarity threshold for deduplication (default: 0.85) */
  deduplicationThreshold: number;

  /** Paragraph window sizes for sliding extraction (default: [2, 3, 4]) */
  windowSizes: number[];
}

/**
 * Default collector configuration
 */
export const DEFAULT_COLLECTOR_CONFIG: CollectorConfig = {
  promotionThreshold: 85,
  topPercentile: 0.1,
  maxPerSceneType: 50,
  deduplicationThreshold: 0.85,
  windowSizes: [2, 3, 4],
};

// ============================================================================
// Quality Snapshot (Plan 02 - Tracker)
// ============================================================================

/**
 * A per-chapter quality snapshot recording all dimension scores.
 *
 * Recorded after each chapter evaluation for trend tracking.
 */
export interface QualitySnapshot {
  /** Chapter number */
  chapterNumber: number;

  /** ISO 8601 timestamp of recording */
  timestamp: string;

  /** Revision version number */
  version: number;

  /** Overall quality score (0-100) */
  overallScore: number;

  /**
   * Flexible dimension score map.
   * Keys: proseQuality, sensoryGrounding, filterWordDensity,
   *        rhythmVariation, characterVoice, transitionQuality,
   *        honorificConsistency?, koreanTexture?, styleAlignment?
   */
  dimensions: Record<string, number>;

  /** Final verdict from Quality Oracle */
  verdict: 'PASS' | 'REVISE';

  /** Whether this snapshot has been superseded by a newer version */
  superseded?: boolean;
}

// ============================================================================
// Trend Analysis (Plan 02 - Regression Detector)
// ============================================================================

/**
 * Result of analyzing quality trends across chapters.
 *
 * Uses EWMA (Exponentially Weighted Moving Average) with z-score alerting.
 */
export interface TrendAnalysis {
  /** Rolling average of recent chapters */
  rollingAverage: number;

  /** EWMA value (lambda=0.2, 80% weight to history) */
  ewma: number;

  /** Linear regression slope over recent window */
  trendSlope: number;

  /** Whether regression is detected */
  regressionDetected: boolean;

  /** Alert severity level */
  alertLevel: AlertLevel;

  /** Human-readable alert message */
  alertMessage?: string;

  /** Per-dimension trend analysis */
  dimensionTrends: Record<string, { slope: number; declining: boolean }>;
}

// ============================================================================
// Regression Config (Plan 02)
// ============================================================================

/**
 * Configuration for the EWMA-based regression detector
 */
export interface RegressionConfig {
  /** EWMA smoothing factor (0-1, default: 0.2) */
  lambda: number;

  /** Minimum snapshots before alerting (default: 5) */
  minDataPoints: number;

  /** Rolling window size for moving average (default: 5) */
  windowSize: number;

  /** Z-score threshold for warning alert (default: -1.5) */
  warningThreshold: number;

  /** Z-score threshold for critical alert (default: -2.0) */
  criticalThreshold: number;

  /** Slope threshold for warning (default: -1.0) */
  slopeWarningThreshold: number;

  /** Slope threshold for critical (default: -2.0) */
  slopeCriticalThreshold: number;
}

// ============================================================================
// Trend Data (Persistent Storage)
// ============================================================================

/**
 * Persistent storage format for quality trend data.
 *
 * Stored as quality-trend.json in the project directory.
 */
export interface TrendData {
  /** Project identifier */
  projectId: string;

  /** All recorded quality snapshots */
  snapshots: QualitySnapshot[];

  /** Metadata about the trend data */
  metadata: {
    /** Total number of snapshots recorded */
    totalSnapshots: number;
    /** ISO 8601 timestamp of last update */
    lastUpdated: string;
    /** Count of auto-accumulated exemplars */
    autoExemplarsAdded: number;
    /** Count of regression alerts fired */
    regressionAlertsFired: number;
  };
}
