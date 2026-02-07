# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-05)

**Core value:** AI가 썼다는 것을 모를 수준의 자연스럽고 몰입감 있는 한국어 소설 원고를 생성한다.
**Current focus:** Phase 5 - Self-Improvement (complete)

## Current Position

Phase: 5 of 5 (Self-Improvement)
Plan: 2 of 2 in current phase
Status: Phase complete - ALL PHASES COMPLETE
Last activity: 2026-02-06 -- Completed 05-02-PLAN.md

Progress: [██████████] 100% (14/14 plans complete)

## Performance Metrics

**Velocity:**
- Total plans completed: 14
- Average duration: 10.7 min
- Total execution time: 150 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation | 3/3 | 44 min | 14.7 min |
| 02-core-pipeline | 3/3 | 25 min | 8.3 min |
| 03-korean-specialization | 3/3 | 35 min | 11.7 min |
| 04-advanced-quality | 3/3 | 32 min | 10.7 min |
| 05-self-improvement | 2/2 | 11 min | 5.5 min |

**Recent Trend:**
- Last 5 plans: 05-02 (6 min), 05-01 (5 min), 04-03 (12 min), 04-02 (12 min), 04-01 (8 min)
- Trend: Accelerating -- Phase 5 plans fastest (integration-heavy, well-established patterns)

*Updated after each plan completion*

## Accumulated Context

### Decisions

- [03-01]: 3-level speech system: 해체, 해요체, 하십시오체 (modern Korean only)
- [03-01]: Context overrides: public, private, emotional (for situation-based shifts)
- [03-02]: 5 banned expression categories: ai-tell, archaic-verb, translationese, punctuation, pronoun-overuse
- [03-02]: 4 severity levels: critical, high, medium, low
- [03-02]: Skip narration patterns inside dialogue (intentional character voice)
- [03-03]: 73 texture entries (의성어/의태어) across 5 categories: emotion, sound, movement, visual, nature
- [03-03]: Texture density target: 2-5 per 1000 chars (below 1.5 triggers enrichment)
- [04-01]: Stage thresholds: 70 (draft), 75 (tone), 80 (style), 95 (final)
- [04-01]: Model routing: sonnet for draft/final, opus for tone/style
- [04-01]: Temperature gradient: 0.2 (final) -> 0.5 (draft) -> 0.6 (tone) -> 0.7 (style)
- [04-02]: TTR via Korean word regex /[가-힣]+/g, MTLD with FACTOR_THRESHOLD=0.72
- [04-02]: Style score blending: 70% prose quality + 30% style alignment when profile provided
- [04-02]: Style-alignment directives generated when match < threshold
- [04-03]: Context-first ordering: climactic/high-tension overrides length heuristic for subtext
- [04-03]: Voice fingerprint: 6 quantitative metrics for consistency checking
- [04-03]: ToneStageEvaluator blending: 40% emotional depth + 30% subtext + 30% voice
- [04-03]: Korean formality detection handles conjugated forms (편한, 자유롭)
- [05-01]: Combined score formula: 0.6 * qualityScore + 0.4 * styleMatchScore, threshold 85
- [05-01]: Stylometric dedup: 5 normalized metrics (TTR, MTLD, sentenceLen, dialogueRatio, sensoryDensity), Euclidean distance, similarity 0.85
- [05-01]: Per scene_type cap 50, evict lowest-scoring auto-accumulated only, never curated
- [05-01]: Top 10% filter post-threshold to prevent library inflation
- [05-02]: EWMA lambda 0.2, z-score warning -1.5, critical -2.0 (research-based thresholds)
- [05-02]: Trend arrows: threshold 3 points for visual indicators
- [05-02]: Dimension trend declining threshold -0.5 slope
- [05-02]: Korean dimension names in alert messages for user comprehension

### Blockers/Concerns

- [Resolved]: Reference style learning implemented without external NLP libraries (pure TypeScript)
- [Pre-existing]: arc.template.json and hook.template.json have no matching schemas

## Session Continuity

Last session: 2026-02-06T14:00:45Z
Stopped at: Completed 05-02-PLAN.md -- ALL PHASES COMPLETE
Resume file: None

## Phase 5 Progress

**Goal:** Self-improving quality through exemplar accumulation and regression detection

**Status:** Complete (2/2 plans)

| Plan | Name | Duration | Tests | Status |
|------|------|----------|-------|--------|
| 05-01 | Exemplar Auto-Accumulation | 5 min | 21 | Complete |
| 05-02 | Quality Trend Tracking | 6 min | 37 | Complete |

**Total Phase 5:** 11 min, 58 new tests, 58 self-improvement tests passing

**05-01 Key Deliverables:**
- `src/self-improvement/types.ts` - ExemplarCandidate, CollectorConfig, QualitySnapshot, TrendAnalysis, RegressionConfig, TrendData
- `src/self-improvement/exemplar-collector.ts` - extractCandidates, isDuplicate, evictLowestScoring, promoteCandidates
- `src/self-improvement/index.ts` - Public re-exports

**05-02 Key Deliverables:**
- `src/self-improvement/quality-tracker.ts` - recordSnapshot, loadTrendData, saveTrendData, getLatestSnapshots, renderTrendTable, recalculateTrends
- `src/self-improvement/regression-detector.ts` - detectRegression, computeEWMA, computeDimensionTrends, buildAlertMessage, DEFAULT_REGRESSION_CONFIG
- `schemas/quality-trend.schema.json` - Persistent trend data validation schema

## Phase 4 Progress

**Goal:** Sophisticated writing features for professional-grade prose

**Status:** Complete (3/3 plans)

| Plan | Name | Duration | Tests | Status |
|------|------|----------|-------|--------|
| 04-01 | Multi-Stage Revision | 8 min | 52 | Complete |
| 04-02 | Reference Style Learning | 12 min | 56 | Complete |
| 04-03 | Emotion Subtext + Voice | 12 min | 65 | Complete |

**Total Phase 4:** 32 min, 173 new tests, 626 total tests passing

**04-02 Key Deliverables:**
- `src/style-library/style-profile.ts` - StyleProfile, Stylometrics, StyleConstraint types
- `src/style-library/style-analyzer.ts` - TTR, MTLD, Korean sentence/vocabulary analysis
- `schemas/style-profile.schema.json` - StyleProfile validation schema
- StyleStageEvaluator integration (computeStyleMatch + style-alignment directives)

**04-03 Key Deliverables:**
- `src/subtext/` - EmotionLayer, SubtextAnnotation, detectFlatDialogue, shouldHaveSubtext
- `src/voice/` - VoiceProfile, VoiceFingerprint, analyzeVoiceConsistency, createVoiceProfile
- `schemas/subtext-annotation.schema.json`, `schemas/voice-profile.schema.json`
- ToneStageEvaluator integration (subtext-injection + voice-drift directives)
