---
phase: 05-self-improvement
plan: 02
subsystem: self-improvement
tags: [quality-tracking, regression-detection, ewma, z-score, trend-visualization, simple-statistics]
depends_on:
  requires: ["05-01"]
  provides: ["quality-trend-tracker", "regression-detector", "trend-visualization"]
  affects: []
tech_stack:
  added: ["simple-statistics@7.8.8"]
  patterns: ["EWMA regression detection", "z-score alerting", "immutable state updates", "withStateBackup persistence"]
key_files:
  created:
    - src/self-improvement/quality-tracker.ts
    - src/self-improvement/regression-detector.ts
    - schemas/quality-trend.schema.json
    - tests/self-improvement/quality-tracker.test.ts
    - tests/self-improvement/regression-detector.test.ts
  modified:
    - src/self-improvement/index.ts
    - src/self-improvement/types.ts
    - package.json
    - package-lock.json
decisions:
  - id: "05-02-01"
    description: "EWMA lambda 0.2 with z-score alerting: warning at -1.5, critical at -2.0"
  - id: "05-02-02"
    description: "Trend arrows: ^ for +3, v for -3, - for stable (threshold 3 points)"
  - id: "05-02-03"
    description: "Dimension trends via linear regression slope, declining threshold -0.5"
  - id: "05-02-04"
    description: "Korean dimension names in alert messages (문체 품질, 감각 묘사, etc.)"
metrics:
  duration: "6 min"
  completed: "2026-02-06"
  tests_added: 37
  tests_total_passing: 58
  lines_of_code: ~600
---

# Phase 5 Plan 2: Quality Trend Tracking Summary

**EWMA + z-score regression detection with markdown trend visualization using simple-statistics**

## What Was Built

### Quality Tracker (`src/self-improvement/quality-tracker.ts`)
- **`createEmptyTrendData(projectId)`** - Initialize empty trend structure
- **`loadTrendData(projectDir, projectId)`** - Load from `meta/quality-trend.json`, returns empty default if missing
- **`saveTrendData(projectDir, trendData)`** - Persist with `withStateBackup()` protection, auto-updates metadata
- **`recordSnapshot(trendData, snapshot)`** - Idempotent recording: same chapter+version skips, older versions get `superseded: true`
- **`getLatestSnapshots(trendData)`** - Filter superseded, keep highest-version per chapter, sort ascending
- **`renderTrendTable(trendData)`** - Markdown table with columns: Chapter, Score, Verdict, Prose, Sensory, Rhythm, Voice, Trend (arrows)
- **`recalculateTrends(trendData)`** - Recompute metadata counters from snapshot state

### Regression Detector (`src/self-improvement/regression-detector.ts`)
- **`DEFAULT_REGRESSION_CONFIG`** - lambda 0.2, minDataPoints 5, windowSize 5, warning -1.5, critical -2.0
- **`computeEWMA(scores, lambda)`** - Exponentially Weighted Moving Average
- **`computeDimensionTrends(snapshots, windowSize)`** - Per-dimension linear regression slopes, declining flag at -0.5
- **`buildAlertMessage(alertLevel, zScore, slope, avg, trends)`** - Human-readable alerts with Korean dimension names
- **`detectRegression(snapshots, config?)`** - Full pipeline: rolling avg, EWMA, slope, z-score, dimension trends, alert level

### Schema (`schemas/quality-trend.schema.json`)
- JSON Schema draft-07 for persistent quality trend data
- Snapshot properties: chapter_number, timestamp, version, overall_score, dimensions (9 optional numeric fields), verdict, superseded
- Metadata: total_snapshots, last_updated, auto_exemplars_added, regression_alerts_fired

## Test Coverage

**37 new tests across 2 files (669 lines total)**

### quality-tracker.test.ts (16 tests, 324 lines)
- recordSnapshot: new chapter, idempotency, superseding, timestamp format (4)
- getLatestSnapshots: filtering, sorting, empty (3)
- loadTrendData/saveTrendData: round-trip, missing file, backup integration (3)
- renderTrendTable: empty, single chapter, arrows, summary row, valid markdown (5)
- recalculateTrends: metadata recalculation (1)

### regression-detector.test.ts (21 tests, 345 lines)
- computeEWMA: empty, single, constant, declining, known calculation (5)
- computeDimensionTrends: stable, declining, independent tracking, window overflow (4)
- detectRegression: min data guard, stable, gradual decline, sharp drop, improving, identical, custom config (7)
- buildAlertMessage: none, warning, critical with Korean names, declining dimensions (4)
- DEFAULT_REGRESSION_CONFIG: default values (1)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added `superseded` field to QualitySnapshot type**
- **Found during:** Task 1
- **Issue:** `QualitySnapshot` in `types.ts` lacked `superseded?: boolean` field needed by quality-tracker.ts for version tracking
- **Fix:** Added optional `superseded?: boolean` property to the `QualitySnapshot` interface
- **Files modified:** `src/self-improvement/types.ts`
- **Commit:** 5ffb52c

## Decisions Made

| ID | Decision | Rationale |
|----|----------|-----------|
| 05-02-01 | EWMA lambda 0.2, z-score warning -1.5, critical -2.0 | Research-based: 80% history weight balances noise vs responsiveness |
| 05-02-02 | Trend arrows: threshold 3 points | Prevents noise from triggering visual indicators |
| 05-02-03 | Dimension trend declining threshold -0.5 slope | Catches meaningful decline without false positives from rounding |
| 05-02-04 | Korean dimension names in alerts | User-facing alerts in project language for immediate comprehension |

## Architecture Notes

- All functions use immutable patterns (return new objects, never mutate input)
- `simple-statistics` provides `mean`, `standardDeviation`, `linearRegression` (zero-dependency, TS types included)
- `withStateBackup()` from `src/state/backup.ts` protects trend data writes with automatic rollback
- Z-score computation guards against stdDev === 0 (all identical scores)
- Minimum 5 data points before any alerting to prevent false positives

## Phase 5 Completion

Phase 5 (Self-Improvement) is now complete with both plans delivered:
- **05-01**: Exemplar auto-accumulation (extract, deduplicate, promote passages to Style Library)
- **05-02**: Quality trend tracking and regression detection (EWMA, z-score, markdown visualization)

Together they form the autonomous self-improvement loop: quality is tracked per-chapter, regressions are detected and alerted, and the best passages are automatically accumulated as exemplars for future writing.
