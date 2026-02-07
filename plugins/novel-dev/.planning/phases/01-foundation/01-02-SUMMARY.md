---
phase: 01-foundation
plan: 02
subsystem: context-manager
tags: [tiered-context, hot-warm-cold, sandwich-pattern, token-budget, character-protection]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: StyleExemplar and queryExemplars for hot tier exemplar retrieval
  - phase: 01-foundation
    provides: SceneV5 type for scene plan context in hot tier
provides:
  - ContextTier (hot/warm/cold) and TierBudget types
  - TieredContextBundle with sandwich split for prompt assembly
  - assembleTieredContext() for tiered context assembly with budget enforcement
  - assignTier() for automatic tier assignment by type and metadata
  - formatPromptOrder() for sandwich-pattern prompt construction
  - DEFAULT_TIER_BUDGET: hot 15K, warm 25K, cold 40K
  - Character profiles NEVER compressed (locked decision enforced)
  - 5-chapter sliding window for warm tier summaries
affects: [02-core-pipeline, prose-surgeon, chapter-drafter, quality-oracle]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Tiered context assembly: hot/warm/cold with budget enforcement"
    - "Sandwich pattern: exemplars at both prompt beginning and end"
    - "Character protection: NEVER compress, allow budget overshoot"
    - "5-chapter sliding window for warm tier summaries"

key-files:
  created:
    - schemas/context-bundle.schema.json
    - src/context/tiers.ts
    - tests/context/tiers.test.ts
  modified:
    - src/context/types.ts
    - src/context/priorities.ts
    - src/context/estimator.ts
    - src/context/loader.ts
    - src/context/index.ts

key-decisions:
  - "Character profiles NEVER compressed - all scene characters get full ~2000 tokens"
  - "Hot tier overflow drops emotional_directives first, then relationship_states"
  - "Allow slight budget overshoot rather than compress characters"
  - "Sandwich split: scene_plan + first exemplar in prefix, remaining in suffix"
  - "5-chapter sliding window for warm tier (expanded from 3 per CONTEXT.md)"

patterns-established:
  - "TieredContextBundle: hot/warm/cold arrays + sandwichSplit + tierBreakdown"
  - "assignTier() for automatic tier assignment based on type and metadata"
  - "Hot tier budget enforcement with character protection priority"
  - "formatPromptOrder() for sandwich-pattern prompt assembly"

# Metrics
duration: 9min
completed: 2026-02-05
---

# Phase 1 Plan 2: Context Manager Summary

**Tiered context assembly with hot/warm/cold tiers, sandwich pattern for exemplar positioning, and locked character protection (never compress ~2000 token profiles)**

## Performance

- **Duration:** 9 min
- **Started:** 2026-02-05T06:57:31Z
- **Completed:** 2026-02-05T07:06:55Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments

- Extended ContextType with exemplar, scene_plan, emotional_directive, relationship_state
- Created TieredContextBundle type with hot/warm/cold arrays and sandwich split
- Implemented assembleTieredContext() with budget enforcement per tier
- LOCKED: Character profiles are NEVER compressed - all scene characters get full ~2000 tokens
- Sandwich pattern positions exemplars at both prompt beginning and end
- 5-chapter sliding window for warm tier summaries (CONTEXT.md decision)
- 25 comprehensive tests for tier assembly covering budget enforcement and character protection
- All 91 context tests pass (39 priorities + 27 estimator + 25 tiers)

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend context types and priorities for v5 context types** - `01a41b1` (feat)
2. **Task 2: Tiered assembly engine with sandwich pattern and tests** - `bb0c79a` (feat)

## Files Created/Modified

- `schemas/context-bundle.schema.json` - JSON Schema for TieredContextBundle output
- `src/context/types.ts` - Extended with ContextTier, TierBudget, TieredContextBundle, SandwichSplit
- `src/context/priorities.ts` - Extended basePriority/requiredByType for new context types
- `src/context/estimator.ts` - Extended AVERAGE_TOKENS_BY_TYPE for new types
- `src/context/loader.ts` - Extended tokensByType for new context types
- `src/context/tiers.ts` - New tiered assembly engine with assignTier, assembleTieredContext
- `src/context/index.ts` - Export new tier functions and types
- `tests/context/tiers.test.ts` - 25 tests covering tier assignment, budget enforcement, sandwich split

## Decisions Made

1. **Character profiles NEVER compressed** - LOCKED DECISION from CONTEXT.md enforced in budget enforcement
2. **Hot tier overflow priority** - Drop emotional_directives first, then relationship_states, never touch characters
3. **Allow budget overshoot** - If dropping all droppables still exceeds budget, allow overshoot rather than compress
4. **Sandwich split structure** - hotPrefix (scene_plan + first exemplar), hotSuffix (remaining exemplars + characters)
5. **5-chapter sliding window** - Warm tier summaries within 5 chapters of current (from CONTEXT.md, expanded from 3)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Extended AVERAGE_TOKENS_BY_TYPE for new context types**
- **Found during:** Task 1 verification (TypeScript compilation)
- **Issue:** Record<ContextType, number> missing new types caused TS error
- **Fix:** Added exemplar (1500), scene_plan (800), emotional_directive (300), relationship_state (500)
- **Files modified:** src/context/estimator.ts
- **Verification:** TypeScript compilation passes
- **Committed in:** 01a41b1 (Task 1 commit)

**2. [Rule 3 - Blocking] Extended tokensByType in loader for new context types**
- **Found during:** Task 1 verification (TypeScript compilation)
- **Issue:** Record<ContextType, number> in loadContextWithStats missing new types
- **Fix:** Added exemplar, scene_plan, emotional_directive, relationship_state initialized to 0
- **Files modified:** src/context/loader.ts
- **Verification:** TypeScript compilation passes
- **Committed in:** 01a41b1 (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both fixes necessary for TypeScript type correctness. No scope creep.

## Issues Encountered

- **Pre-existing schema validation failures** - arc.template.json and hook.template.json have no matching schemas (not part of this plan, documented in STATE.md)
- **npm run build fails** - Due to pre-existing schema validation issues, not caused by this plan

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Ready for Phase 2:**
- Tiered context assembly complete and tested
- assembleTieredContext() ready for prompt builder integration
- formatPromptOrder() returns items in correct sandwich-pattern order
- Character protection enforced at assembly level
- 5-chapter sliding window for warm tier summaries

**Dependencies for Phase 2:**
- Prompt builder (02-01) can use formatPromptOrder() for sandwich placement
- Quality Oracle (02-02) can leverage tier breakdown for diagnostics
- Writing agents receive tiered bundles instead of flat priority dumps

**Blockers/Concerns:**
- None specific to Context Manager
- Pre-existing schema validation issues remain (arc.template, hook.template)

---
*Phase: 01-foundation*
*Plan: 02*
*Completed: 2026-02-05*
