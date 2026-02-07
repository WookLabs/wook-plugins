---
phase: 01-foundation
plan: 03
subsystem: scene-pipeline
tags: [scene, decomposition, sceneV5, emotional-arc, foreshadowing, validation]

# Dependency graph
requires:
  - phase: none
    provides: (builds on existing chapter.schema.json and src/types.ts)
provides:
  - SceneV5 enriched scene data model with 8 new field groups
  - scene.schema.json backward-compatible superset of chapter scenes
  - decomposeChapter() heuristic enrichment function
  - validateScenes() constraint checking
  - Emotional arc continuity (exit->entry chaining)
  - Sensory anchor detection from Korean keywords
affects: [02-scene-pipeline, prose-surgeon, chapter-drafter]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Scene decomposition uses heuristics not LLM
    - Emotional arc continuity enforced across scenes
    - Sensory anchors derived from Korean keywords

key-files:
  created:
    - schemas/scene.schema.json
    - src/scene/types.ts
    - src/scene/decomposer.ts
    - src/scene/validator.ts
    - src/scene/index.ts
    - tests/scene/decomposer.test.ts
  modified:
    - src/types.ts

key-decisions:
  - "SceneV5 extends Scene (backward compatible)"
  - "All new fields optional in schema for chapter.scenes compatibility"
  - "Decomposer uses heuristics (keyword detection), no LLM calls"
  - "Emotional arc chains exit->entry across scenes"
  - "Default 2+ sensory anchors per scene"
  - "Merge scenes under 800 chars, cap at 5 per chapter"

patterns-established:
  - "Scene module exports: types.ts (interfaces) + decomposer.ts (logic) + validator.ts (checks) + index.ts (barrel)"
  - "Korean keyword detection for sensory/emotion classification"
  - "Validation returns {valid, errors, warnings} tuple"

# Metrics
duration: 10min
completed: 2026-02-05
---

# Phase 1 Plan 3: Scene Data Model Summary

**SceneV5 enriched scene model with POV, sensory anchors, emotional arcs, foreshadowing mapping, and transitions - decomposable from chapter plot beats via heuristics**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-02-05T06:31:32Z
- **Completed:** 2026-02-05T06:41:02Z
- **Tasks:** 2
- **Files created:** 6
- **Files modified:** 1

## Accomplishments

- Created scene.schema.json as backward-compatible superset of chapter.scenes
- Implemented SceneV5 interface with 8 new field groups (POV, sensory anchors, emotional arc, dialogue goals, foreshadowing, transition, style override, exemplar tags)
- Built decomposeChapter() that enriches existing scenes using Korean keyword heuristics
- Built validateScenes() for constraint checking (sequential numbers, 2+ sensory anchors, tension 1-10, fore_xxx pattern)
- Achieved 29 tests covering all decomposer and validator functionality

## Task Commits

Each task was committed atomically:

1. **Task 1: Scene schema, types, and decomposition module** - `9531d5d` (feat)
   - Note: This was committed in a previous execution but files match plan specification
2. **Task 2: Decomposer tests and schema validation** - `3006f83` (test)
   - 29 tests covering decomposition and validation

## Files Created/Modified

- `schemas/scene.schema.json` - JSON Schema for SceneV5 (backward-compatible superset)
- `src/scene/types.ts` - SceneV5, EmotionalArc, SceneForeshadowing, SceneTransition, SceneStyleOverride interfaces
- `src/scene/decomposer.ts` - decomposeChapter() with Korean keyword heuristics
- `src/scene/validator.ts` - validateScenes() constraint checking
- `src/scene/index.ts` - Module barrel export
- `src/types.ts` - Added Scene.emotional_tone?, Scene.estimated_words?, re-export SceneV5
- `tests/scene/decomposer.test.ts` - 29 tests for decomposer and validator

## Decisions Made

1. **SceneV5 extends Scene interface** - All existing Scene fields preserved, new fields added as extension
2. **All new fields optional in schema** - Ensures existing chapter.scenes JSONs remain valid (backward compatible)
3. **Decomposer uses heuristics, not LLM** - Keyword detection for sensory/emotion/scene-type classification enables deterministic enrichment
4. **Emotional arc continuity** - Scene N's exit_emotion must match Scene N+1's entry_emotion
5. **Sensory anchor defaults** - Minimum 2 per scene; defaults to sight+sound if not detected
6. **Scene merging logic** - Scenes under 800 chars merged with adjacent; cap at 5 scenes per chapter

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed Scene interface missing optional fields**
- **Found during:** Task 1 verification
- **Issue:** Base Scene interface lacked `emotional_tone` and `estimated_words` which exist in chapter.schema.json
- **Fix:** Added optional `emotional_tone?: string` and `estimated_words?: number` to Scene interface
- **Files modified:** src/types.ts
- **Verification:** TypeScript compilation passes
- **Committed in:** 9531d5d (previous execution)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Necessary for type correctness. No scope creep.

## Issues Encountered

- **Pre-existing TypeScript errors:** Node.js type declarations not installed (@types/node issues in unrelated files). Does not affect scene module functionality.
- **Pre-existing schema validation failure:** arc.template.json and hook.template.json have no matching schemas. Not related to this plan.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Scene data model complete and ready for Phase 2 scene-based writing pipeline
- decomposeChapter() can transform any ChapterMeta into SceneV5 array
- validateScenes() ensures scene constraints before drafting
- No blockers for Phase 2

---
*Phase: 01-foundation*
*Plan: 03*
*Completed: 2026-02-05*
