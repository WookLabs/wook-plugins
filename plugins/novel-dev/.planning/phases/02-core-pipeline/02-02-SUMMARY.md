---
phase: 02-core-pipeline
plan: 02
subsystem: revision-pipeline
tags: [quality-oracle, prose-surgeon, revision-loop, surgical-directives, circuit-breaker]

dependency-graph:
  requires: ["02-01"]
  provides: ["Quality Oracle analysis", "Prose Surgeon execution", "Revision loop orchestration"]
  affects: ["02-03", "03-*"]

tech-stack:
  added: []
  patterns:
    - "Surgical directive pattern (Oracle -> Surgeon)"
    - "Circuit breaker pattern (3 failures threshold)"
    - "Model routing by task complexity"
    - "Scope validation (pre and post execution)"

key-files:
  created:
    - src/pipeline/quality-oracle.ts
    - src/pipeline/prose-surgeon.ts
    - src/pipeline/revision-loop.ts
    - agents/quality-oracle.md
    - agents/prose-surgeon.md
    - tests/pipeline/quality-oracle.test.ts
    - tests/pipeline/prose-surgeon.test.ts
    - tests/pipeline/revision-loop.test.ts
  modified:
    - src/pipeline/index.ts

decisions:
  - id: oracle-heuristics
    summary: "Use keyword-based detection (no ML) for filter words, sensory, rhythm"
  - id: scope-hard-limits
    summary: "ABSOLUTE_MAX_SCOPE = 3, type-specific limits (1-3)"
  - id: circuit-breaker-threshold
    summary: "Trip after 3 consecutive failures per directive location"
  - id: model-routing
    summary: "Opus for creative tasks, Sonnet for mechanical fixes"

metrics:
  duration: "12 min"
  completed: "2026-02-05"
---

# Phase 2 Plan 2: Quality Oracle & Prose Surgeon Summary

**One-liner:** Passage-level surgical revision system with Quality Oracle directive generation, Prose Surgeon scope-limited execution, and circuit-breaker-protected revision loop

## What Was Built

### Task 1: Quality Oracle Module and Agent
- **quality-oracle.ts**: Analyzes chapter prose and produces surgical directives
  - Filter word detection (outside dialogue only): 느꼈다, 보였다, 생각했다 등
  - 5-category sensory grounding: visual, auditory, tactile, olfactory, gustatory
  - Rhythm monotony detection (5+ consecutive same endings)
  - Directive generation with ID pattern `dir_{type}_{NNN}`
  - Maximum 5 directives per evaluation pass
- **agents/quality-oracle.md**: Opus-based evaluator with READ-ONLY constraint
  - References schemas/surgical-directive.schema.json
  - Includes explicit Agent Invocation Workflow section
  - DEPRECATION NOTE for critic.md

### Task 2: Prose Surgeon Module and Agent
- **prose-surgeon.ts**: Executes surgical directives with scope constraints
  - MODEL_ROUTING: Opus for creative, Sonnet for mechanical
  - MAX_SCOPE_LIMITS: Hard limits per directive type (1-3 paragraphs)
  - Pre-execution scope validation
  - Post-execution output validation (paragraph count, unauthorized changes)
  - Circuit breaker: 3 failures threshold
- **agents/prose-surgeon.md**: Opus/Sonnet surgeon with HARD RULES
  - Korean prose technique examples
  - DEPRECATION NOTE for editor.md

### Task 3: Revision Loop Orchestrator
- **revision-loop.ts**: Connects Oracle -> Surgeon in feedback loop
  - RevisionLoopConfig: maxIterations (5), maxDirectivesPerPass (5)
  - RevisionLoopResult: full execution tracking
  - Per-directive failure tracking for circuit breaker
  - Testing helpers: createPassthroughCallback, createSimpleFixCallback
  - Metrics: calculateLoopMetrics, getFailedDirectiveTypes

## Key Implementation Details

### Directive Types and Scope Limits
| Type | Max Scope | Model | Temperature |
|------|-----------|-------|-------------|
| show-not-tell | 2 | opus | 0.8 |
| filter-word-removal | 1 | sonnet | 0.4 |
| sensory-enrichment | 3 | opus | 0.7 |
| rhythm-variation | 3 | opus | 0.6 |
| dialogue-subtext | 2 | opus | 0.8 |
| cliche-replacement | 1 | opus | 0.7 |
| transition-smoothing | 2 | sonnet | 0.5 |
| voice-consistency | 2 | sonnet | 0.5 |
| proofreading | 1 | sonnet | 0.2 |

### Korean Filter Words Detected
```
느꼈다, 느껴졌다, 느낀다, 보였다, 보이는, 보인다, 생각했다, 생각한다,
들렸다, 들린다, 알 수 있었다, 알았다, 깨달았다, 것 같았다, 처럼 보였다
```

### Sensory Categories
- Visual: 보, 빛, 색, 눈, 어둠, 밝, 반짝
- Auditory: 소리, 들, 목소리, 속삭, 조용
- Tactile: 만지, 닿, 차갑, 뜨거, 따뜻
- Olfactory: 냄새, 향기, 향, 맡
- Gustatory: 맛, 달, 쓴, 짠, 매운

## Verification Results

### Tests Added
- quality-oracle.test.ts: 53 tests
- prose-surgeon.test.ts: 48 tests
- revision-loop.test.ts: 28 tests
- **Total new tests: 129 tests**

### All Tests Pass
```
Test Files  13 passed (13)
Tests       332 passed (332)
```

### TypeScript Compilation
```
npx tsc --noEmit  # No errors
```

### Import Verification
```javascript
import('./dist/pipeline/index.js').then(m => console.log('runRevisionLoop' in m))
// true
```

## Success Criteria Verification

- [x] Quality Oracle produces passage-level surgical directives
- [x] Directives capped at 5 per evaluation
- [x] Prose Surgeon validates maxScope before execution
- [x] Prose Surgeon validates output doesn't exceed scope
- [x] Circuit breaker prevents infinite loops (3 failures threshold)
- [x] Revision loop orchestrates Oracle -> Surgeon -> Oracle cycles
- [x] Korean filter words detected outside dialogue
- [x] Agent prompts created with READ-ONLY/surgical constraints
- [x] Agent prompts include explicit invocation workflows
- [x] DEPRECATION notes added for critic.md and editor.md
- [x] All tests pass

## Deviations from Plan

None - plan executed exactly as written.

## Decisions Made

| ID | Decision | Rationale |
|----|----------|-----------|
| oracle-heuristics | Use keyword-based detection (no ML) | Simple, predictable, no external dependencies |
| scope-hard-limits | ABSOLUTE_MAX_SCOPE = 3 | Balance between targeted fixes and meaningful changes |
| circuit-breaker-threshold | 3 failures before trip | Enough retries for transient failures, prevent infinite loops |
| model-routing | Opus for creative, Sonnet for mechanical | Cost optimization while maintaining quality where needed |

## Artifacts Produced

### Source Files
- `src/pipeline/quality-oracle.ts` - 450 lines
- `src/pipeline/prose-surgeon.ts` - 400 lines
- `src/pipeline/revision-loop.ts` - 320 lines

### Agent Files
- `agents/quality-oracle.md` - READ-ONLY evaluator
- `agents/prose-surgeon.md` - Surgical executor

### Test Files
- `tests/pipeline/quality-oracle.test.ts` - 53 tests
- `tests/pipeline/prose-surgeon.test.ts` - 48 tests
- `tests/pipeline/revision-loop.test.ts` - 28 tests

## Commits

| Hash | Type | Description |
|------|------|-------------|
| 8d8ba03 | feat | Quality Oracle module and agent |
| c9ab839 | feat | Prose Surgeon module and agent |
| 5886233 | feat | Revision loop orchestrator |

## Next Phase Readiness

### Ready For
- Plan 02-03: Chapter generation workflow integration
- Phase 3: Korean-specific quality rules

### Dependencies Provided
- `analyzeChapter()` for quality evaluation
- `runRevisionLoop()` for complete revision cycles
- `SurgicalDirective` type for Oracle -> Surgeon communication

### Open Questions
- None

## Performance Notes

- Execution time: 12 minutes
- Test count: 129 new tests (332 total)
- All tasks autonomous (no checkpoints)
