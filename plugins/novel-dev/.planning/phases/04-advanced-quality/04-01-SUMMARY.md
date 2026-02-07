---
phase: 04-advanced-quality
plan: 01
subsystem: quality
tags: [multi-stage-revision, evaluators, pipeline, prose-quality]

# Dependency graph
requires:
  - phase: 02-core-pipeline
    provides: Quality Oracle, Prose Surgeon, Revision Loop
  - phase: 03-korean-specialization
    provides: Korean-specific directive types and evaluators
provides:
  - 4-stage revision framework (Draft, Tone, Style, Final)
  - Per-stage evaluators with score() and generateDirectives()
  - Multi-stage orchestration with improvement tracking
  - Extended DirectiveType union for Phase 4 features
affects: [04-02-reference-style, 04-03-subtext-layers, 04-04-voice-consistency]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Stage evaluator interface for pluggable evaluation
    - Sequential stage processing with improvement tracking
    - Directive type filtering per stage

key-files:
  created:
    - src/quality/types.ts
    - src/quality/stage-evaluators.ts
    - src/quality/revision-stages.ts
    - src/quality/index.ts
    - tests/quality/stage-evaluators.test.ts
    - tests/quality/revision-stages.test.ts
  modified:
    - src/pipeline/types.ts
    - src/pipeline/prose-surgeon.ts

key-decisions:
  - "Stage thresholds: 70 (draft), 75 (tone), 80 (style), 95 (final)"
  - "Model routing: sonnet for draft/final, opus for tone/style"
  - "Temperature gradient: 0.2 (final) -> 0.5 (draft) -> 0.6 (tone) -> 0.7 (style)"
  - "Directive type isolation: each stage only processes designated types"

patterns-established:
  - "StageEvaluator interface: { name, score(), generateDirectives() }"
  - "Multi-stage result tracking: inputScore, outputScore, improvement per stage"
  - "Stage-specific prompt building with getStageGuidance()"

# Metrics
duration: 8min
completed: 2026-02-05
---

# Phase 4 Plan 1: Multi-Stage Revision Pipeline Summary

**4-stage revision framework with Draft/Tone/Style/Final evaluators and sequential orchestration for progressive prose improvement**

## Performance

- **Duration:** 8 min
- **Started:** 2026-02-05T14:41:35Z
- **Completed:** 2026-02-05T14:49:06Z
- **Tasks:** 3
- **Files created:** 6
- **Files modified:** 2

## Accomplishments
- Created src/quality/ module with complete 4-stage revision framework
- Implemented 4 stage evaluators (Draft, Tone, Style, Final) with distinct evaluation criteria
- Built runMultiStageRevision orchestrator that tracks improvement per stage
- Extended DirectiveType with 4 new Phase 4 types (style-alignment, subtext-injection, voice-drift, arc-alignment)
- Added comprehensive test suite with 52 passing tests

## Task Commits

Each task was committed atomically:

1. **Task 1+2: Create quality module types, evaluators, and extend pipeline** - `06032cf` (feat)
2. **Task 3: Create comprehensive test suite** - `287c2c5` (test)

## Files Created/Modified

**Created:**
- `src/quality/types.ts` - RevisionStage, StageResult, MultiStageResult interfaces and directive type groups
- `src/quality/stage-evaluators.ts` - DraftStageEvaluator, ToneStageEvaluator, StyleStageEvaluator, FinalStageEvaluator
- `src/quality/revision-stages.ts` - REVISION_STAGES config and runMultiStageRevision orchestrator
- `src/quality/index.ts` - Module re-exports
- `tests/quality/stage-evaluators.test.ts` - 26 tests for evaluators
- `tests/quality/revision-stages.test.ts` - 26 tests for orchestration

**Modified:**
- `src/pipeline/types.ts` - Extended DirectiveType with Phase 4 types
- `src/pipeline/prose-surgeon.ts` - Added MODEL_ROUTING and MAX_SCOPE_LIMITS for new types

## Decisions Made

1. **Stage thresholds per RESEARCH.md:** Draft 70, Tone 75, Style 80, Final 95 - increasing strictness
2. **Model routing strategy:** Sonnet for mechanical tasks (draft structure, final proofreading), Opus for creative tasks (tone, style)
3. **Temperature gradient:** Final stage uses 0.2 (precision), style stage uses 0.7 (creativity)
4. **Directive isolation:** Each stage only processes its designated directive types to prevent cross-contamination

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Multi-stage framework ready for Phase 4 features to plug into
- Style stage can accept reference style profiles (04-02)
- Tone stage can accept subtext annotations (04-03)
- Voice profiles can be passed through MultiStageOptions (04-04)

**Blockers:** None

---
*Phase: 04-advanced-quality*
*Completed: 2026-02-05*
