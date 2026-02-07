---
phase: 05-self-improvement
plan: 01
subsystem: self-improvement
tags: [exemplar-collection, style-library, auto-accumulation, deduplication, stylometrics]
dependency-graph:
  requires: [04-02, 04-03]
  provides: [exemplar-auto-accumulation-pipeline, self-improvement-types]
  affects: [05-02]
tech-stack:
  added: []
  patterns: [sliding-window-extraction, stylometric-fingerprinting, euclidean-distance-dedup, score-weighted-eviction]
key-files:
  created:
    - src/self-improvement/types.ts
    - src/self-improvement/exemplar-collector.ts
    - src/self-improvement/index.ts
    - tests/self-improvement/exemplar-collector.test.ts
  modified: []
decisions:
  - id: "05-01-scoring"
    decision: "Combined score formula: 0.6 * qualityScore + 0.4 * styleMatchScore, threshold 85"
  - id: "05-01-dedup"
    decision: "Stylometric fingerprinting with 5 normalized metrics, Euclidean distance, similarity threshold 0.85"
  - id: "05-01-eviction"
    decision: "Per scene_type cap of 50, evict lowest-scoring auto-accumulated only, never curated"
  - id: "05-01-toppercentile"
    decision: "Top 10% filter applied after threshold to prevent library inflation"
metrics:
  duration: "5 min"
  completed: "2026-02-06"
  tasks: 2/2
  tests: 21
  test-time: "44ms"
---

# Phase 5 Plan 1: Exemplar Auto-Accumulation Summary

**One-liner:** Sliding-window passage extraction from evaluated chapters with dual-score filtering (quality + style), stylometric dedup, and auto-promotion to Style Library with per-scene-type eviction caps.

## What Was Built

### Types Module (`src/self-improvement/types.ts`)
Complete type definitions for both Plan 01 and Plan 02:
- **ExemplarCandidate**: Passage with quality/style/combined scores, category, provenance
- **CollectorConfig**: Thresholds, percentile, caps, window sizes with sensible defaults
- **QualitySnapshot**: Per-chapter dimensional quality recording for trend tracking
- **TrendAnalysis**: EWMA + z-score regression detection result
- **RegressionConfig**: Lambda, thresholds, window size for regression detector
- **TrendData**: Persistent storage format with metadata counters
- **AlertLevel**: 'none' | 'warning' | 'critical'

### Exemplar Collector (`src/self-improvement/exemplar-collector.ts`)
Four exported functions implementing the full pipeline:

1. **`extractCandidates(content, chapterNumber, qualityAssessment, styleProfile?, config?)`**
   - Uses `getParagraphs()` for paragraph splitting
   - Sliding window with configurable sizes [2, 3, 4]
   - 500-2000 char length constraint per StyleExemplar schema
   - Quality score from 5-dimension average of QualityAssessment
   - Style match via `computeStyleMatch()` with quality fallback
   - Combined score: 0.6 * quality + 0.4 * style
   - Top 10% percentile filter after threshold

2. **`isDuplicate(candidateContent, existingExemplars, threshold?)`**
   - Stylometric fingerprinting via `computeStylometrics()`
   - 5 key metrics: TTR, MTLD, meanSentenceLength, dialogueRatio, sensoryDensity
   - Normalize to 0-1, Euclidean distance, convert to similarity
   - Default threshold 0.85

3. **`evictLowestScoring(library, sceneType, maxPerType)`**
   - Separates curated vs auto-accumulated
   - Never evicts curated exemplars
   - Sorts auto-accumulated by score extracted from quality_notes
   - Removes excess via `removeExemplar()`

4. **`promoteCandidates(candidates, projectDir, genre, config?)`**
   - Loads library, dedup-checks each candidate, evicts if needed
   - Creates NewExemplarInput with auto-accumulated source and score notes
   - Saves final library to disk

### Index Module (`src/self-improvement/index.ts`)
Re-exports all public types and functions with Plan 02 placeholder comments.

### Tests (`tests/self-improvement/exemplar-collector.test.ts`)
21 test cases across 4 groups with Korean prose fixtures (12 paragraphs):
- **extractCandidates** (6 tests): range, filtering, fallback, formula, provenance, sorting
- **isDuplicate** (5 tests): identical, different, empty, threshold, boundary
- **evictLowestScoring** (4 tests): under cap, over cap, curated protection, count
- **promoteCandidates** (6 tests): promotion, dedup skip, source, notes, file I/O, cap

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Combined score 0.6/0.4 weighting | Quality matters more than style alignment; style is fallback-tolerant |
| 5-metric Euclidean distance for dedup | Covers lexical, structural, dialogue, sensory dimensions without over-fitting |
| Top 10% filter post-threshold | Prevents library inflation (Pitfall 1 from RESEARCH.md) |
| Never evict curated exemplars | Manual curation represents human editorial judgment |
| Score extraction from quality_notes | Enables scoring without storing extra fields on StyleExemplar schema |

## Deviations from Plan

None -- plan executed exactly as written.

## Next Phase Readiness

**Plan 02 dependencies satisfied:**
- All types for QualitySnapshot, TrendAnalysis, RegressionConfig, TrendData are defined
- Index.ts has placeholder comments for Plan 02 exports
- No blockers for quality-tracker and regression-detector implementation

## Commits

| Hash | Message |
|------|---------|
| 340e97f | feat(05-01): create self-improvement types and exemplar collector module |
| 94e73e0 | test(05-01): add comprehensive tests for exemplar collector |
