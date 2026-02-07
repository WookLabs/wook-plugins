---
phase: 03-korean-specialization
plan: 01
subsystem: korean
tags: [honorifics, speech-levels, haeche, haeyoche, hapsyoche, quality-oracle]

# Dependency graph
requires:
  - phase: 02-core-pipeline
    provides: Quality Oracle, DirectiveType, SurgicalDirective, Prose Surgeon
provides:
  - Korean types module (SpeechLevel, HonorificMatrix, HonorificViolation)
  - Honorific matrix initialization from Character array
  - Per-pair speech level derivation based on age/status
  - Context overrides (public, private, emotional)
  - Speech level detection from Korean verb endings
  - Honorific violation detection for dialogue consistency
  - Quality Oracle integration for honorific-violation directives
affects: [03-korean-specialization, 04-advanced-quality]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Per-character-pair relationship tracking in Map structures"
    - "Regex-based Korean speech level detection"
    - "Context-aware speech level overrides"

key-files:
  created:
    - src/korean/types.ts
    - src/korean/honorific-matrix.ts
    - tests/korean/honorific-matrix.test.ts
  modified:
    - src/pipeline/types.ts
    - src/pipeline/quality-oracle.ts
    - src/pipeline/prose-surgeon.ts

key-decisions:
  - "Modern 3-level speech system only (haeche, haeyoche, hapsyoche)"
  - "Age difference threshold of 5 years for speech level derivation"
  - "High social status listeners get formal speech from lower-status speakers"
  - "Public context makes casual speakers more polite"
  - "Honorific violations limited to 2 directives per pass"

patterns-established:
  - "Map<string, T> for relationship tracking with key format: {speakerId}_to_{listenerId}"
  - "Optional honorificMatrix parameter in Quality Oracle for Korean-specific analysis"
  - "Korean directive types extend base DirectiveType union"

# Metrics
duration: 12min
completed: 2026-02-05
---

# Phase 3 Plan 1: Honorific Matrix Summary

**Korean speech level tracking system with per-character-pair relationships, age/status-based derivation, context overrides, and Quality Oracle integration for honorific-violation directives**

## Performance

- **Duration:** 12 min
- **Started:** 2026-02-05T13:45:03Z
- **Completed:** 2026-02-05T13:57:33Z
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments
- Implemented Korean types module with SpeechLevel, HonorificMatrix, HonorificViolation types
- Built honorific matrix system that derives speech levels from age differences and social status
- Integrated honorific violation detection into Quality Oracle with Korean-language directives
- Added 55 comprehensive tests covering all honorific matrix functionality

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Korean types and honorific matrix module** - `d0a5f07` (feat)
2. **Task 2: Extend DirectiveType and integrate with Quality Oracle** - `9f8dc16` (feat)
3. **Task 3: Add tests for honorific matrix functionality** - `d6e5611` (test)

## Files Created/Modified
- `src/korean/types.ts` - Korean-specific type definitions (SpeechLevel, HonorificMatrix, etc.)
- `src/korean/honorific-matrix.ts` - Honorific tracking with initialization, lookup, detection
- `src/pipeline/types.ts` - Extended DirectiveType with honorific-violation, banned-expression, texture-enrichment
- `src/pipeline/quality-oracle.ts` - Added honorific analysis with optional matrix parameter
- `src/pipeline/prose-surgeon.ts` - Added MODEL_ROUTING and MAX_SCOPE_LIMITS for Korean directive types
- `tests/korean/honorific-matrix.test.ts` - Comprehensive test suite (55 tests)

## Decisions Made
- Used modern 3-level speech system (haeche/haeyoche/hapsyoche) - older 6-level system is archaic
- Age difference threshold of 5 years for automatic speech level derivation
- High social status listeners warrant formal speech (hapsyoche) from lower-status speakers
- Context overrides: public settings make casual speakers more polite
- Limited to 2 honorific-violation directives per Quality Oracle pass to prevent directive bloat
- Added honorificConsistency as optional field in QualityAssessment for backward compatibility

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed Korean quote marks in TypeScript**
- **Found during:** Task 1 (honorific-matrix.ts creation)
- **Issue:** Unicode curly quotes caused TypeScript parser errors
- **Fix:** Used Unicode escape sequences (\u201C, \u201D, etc.) for quote mark constants
- **Files modified:** src/korean/honorific-matrix.ts
- **Verification:** TypeScript compilation passed
- **Committed in:** d0a5f07

**2. [Rule 1 - Bug] Fixed speech level detection patterns**
- **Found during:** Task 3 (test failures)
- **Issue:** Regex patterns incorrectly required hyphen before endings (-해, -요)
- **Fix:** Removed hyphen requirement, added 와 pattern for 오다 conjugation
- **Files modified:** src/korean/honorific-matrix.ts
- **Verification:** All 55 tests pass
- **Committed in:** d6e5611

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** Both fixes were necessary for correct functionality. No scope creep.

## Issues Encountered
- Pre-existing banned-expressions.ts file in src/korean/ was using deprecated import assertion syntax (`assert` instead of `with`) - noted but not blocking for this plan
- Pre-existing pipeline types already had banned-expression but prose-surgeon lacked corresponding routing - fixed as part of Task 2

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- HonorificMatrix can be initialized from Character array and passed to analyzeChapter
- Quality Oracle now generates 'honorific-violation' directives with Korean instructions
- Ready for Phase 3 Plan 2 (banned expression detection) and Plan 3 (texture enrichment)
- Korean specialization foundation complete for building additional Korean-specific quality checks

---
*Phase: 03-korean-specialization*
*Completed: 2026-02-05*
