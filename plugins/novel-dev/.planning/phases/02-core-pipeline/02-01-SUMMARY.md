---
phase: 02-core-pipeline
plan: 01
subsystem: pipeline
tags: [scene-writer, assembler, directive, quality-oracle, exemplar-injection]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: Style Library (queryExemplars), Context Manager (assembleTieredContext), SceneV5 types
provides:
  - SurgicalDirective type system for Quality Oracle communication
  - Scene writer orchestration with fresh exemplar injection per scene
  - Assembler with transition gap detection (temporal, spatial, emotional)
  - Pipeline module ready for Quality Oracle integration
affects: [02-02, 02-03, 03-korean-prose]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Virtual ContextItem paths for scene-generated context (virtual://scene_plan/N)
    - Scene type mapping from freeform tags to fixed enum
    - Transition gap detection using emotional arc chaining

key-files:
  created:
    - src/pipeline/types.ts
    - src/pipeline/scene-writer.ts
    - src/pipeline/assembler.ts
    - src/pipeline/index.ts
    - schemas/surgical-directive.schema.json
    - tests/pipeline/scene-writer.test.ts
  modified: []

key-decisions:
  - "Virtual paths (virtual://scene_plan/N) for dynamically generated context items"
  - "Scene plan priority=10 required=true, exemplars priority=9 required=false"
  - "mapSceneTypeFromTags fallback to 'transition' for unrecognized scenes"
  - "Emotional gap detection uses intensity mapping (high: fear/rage/despair, low: calm/neutral)"

patterns-established:
  - "Scene-by-scene context preparation before LLM drafting"
  - "Fresh exemplar injection per scene (not per chapter)"
  - "Transition gap detection based on SceneV5 metadata analysis"
  - "Assembly validation with min/max length and severe gap checking"

# Metrics
duration: 8min
completed: 2026-02-05
---

# Phase 2 Plan 01: Pipeline Infrastructure Summary

**Scene-based writing pipeline with surgical directive types, scene writer orchestration, and transition-aware assembler**

## Performance

- **Duration:** 8 min
- **Started:** 2026-02-05T12:20:39Z
- **Completed:** 2026-02-05T12:28:28Z
- **Tasks:** 2
- **Files modified:** 6 created

## Accomplishments

- Defined SurgicalDirective type system with 9 directive types for Quality Oracle -> Prose Surgeon communication
- Implemented scene writer orchestration that prepares per-scene context with fresh exemplar injection
- Integrated Phase 1 infrastructure: queryExemplars (Style Library) and assembleTieredContext (Context Manager)
- Implemented assembler with transition gap detection (temporal, spatial, emotional) and severity classification
- Created JSON Schema for surgical directive validation (draft-07, ajv-compatible)
- Added 34 comprehensive tests covering all orchestration and assembly functions

## Task Commits

Each task was committed atomically:

1. **Task 1: Pipeline types and surgical directive schema** - `cbe419d` (feat)
2. **Task 2: Scene writer orchestration and assembler modules** - `17d049c` (feat)

## Files Created/Modified

- `src/pipeline/types.ts` - Directive types, SceneWriterConfig, SceneDraftResult, AssemblyResult, QualityOracleResult
- `src/pipeline/scene-writer.ts` - prepareSceneDraft, prepareChapterScenes, mapSceneTypeFromTags, buildExemplarQuery
- `src/pipeline/assembler.ts` - assembleScenes, detectTransitionGaps, validateAssembly
- `src/pipeline/index.ts` - Module exports for pipeline public API
- `schemas/surgical-directive.schema.json` - JSON Schema for directive validation
- `tests/pipeline/scene-writer.test.ts` - 34 tests for scene writer and assembler

## Decisions Made

1. **Virtual paths for dynamic context**: Scene-generated ContextItems use `virtual://scene_plan/N` and `virtual://exemplar/ID` paths since they don't come from files
2. **Priority assignments**: Scene plan gets priority=10 (required=true), exemplars get priority=9 (required=false) allowing budget pressure to drop exemplars while keeping scene plan
3. **Scene type mapping fallback**: When scene tags don't match any known type, default to 'transition' rather than failing
4. **Emotional intensity mapping**: Gap detection uses predefined high-intensity (fear, rage, despair) and low-intensity (calm, neutral) emotion lists

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

1. **ContextItem required fields**: Initial implementation missed `path`, `priority`, `required` fields that ContextItem interface requires. Fixed by adding virtual paths and appropriate priority/required values.
2. **ItemMetadata genre access**: The `genre` field needed explicit type cast since ItemMetadata uses index signature `[key: string]: unknown`. Fixed with `(metadata.genre as string)`.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Pipeline types and orchestration ready for Quality Oracle integration (Plan 02)
- Scene writer can prepare contexts; orchestrator will call LLM for actual drafting
- Assembler ready to combine drafts with gap detection
- All Phase 1 integrations verified working (queryExemplars, assembleTieredContext)

---
*Phase: 02-core-pipeline*
*Completed: 2026-02-05*
