/**
 * Self-Improvement Module
 *
 * Public API for the self-improvement subsystem:
 * - Exemplar auto-accumulation (Plan 01)
 * - Quality trend tracking and regression detection (Plan 02)
 *
 * @module self-improvement
 */

// ============================================================================
// Types (Plan 01 + Plan 02)
// ============================================================================

export type {
  ExemplarCandidate,
  CollectorConfig,
  QualitySnapshot,
  TrendAnalysis,
  TrendData,
  RegressionConfig,
  AlertLevel,
} from './types.js';

export { DEFAULT_COLLECTOR_CONFIG } from './types.js';

// ============================================================================
// Exemplar Collector (Plan 01)
// ============================================================================

export {
  extractCandidates,
  isDuplicate,
  evictLowestScoring,
  promoteCandidates,
} from './exemplar-collector.js';

// ============================================================================
// Quality Tracker (Plan 02)
// ============================================================================

export {
  recordSnapshot,
  loadTrendData,
  saveTrendData,
  getLatestSnapshots,
  renderTrendTable,
  recalculateTrends,
} from './quality-tracker.js';

// ============================================================================
// Regression Detector (Plan 02)
// ============================================================================

export {
  detectRegression,
  computeEWMA,
  computeDimensionTrends,
  buildAlertMessage,
  DEFAULT_REGRESSION_CONFIG,
} from './regression-detector.js';
