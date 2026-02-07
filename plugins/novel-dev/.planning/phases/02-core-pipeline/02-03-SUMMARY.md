---
phase: 02
plan: 03
subsystem: agents-and-skills
tags: [scene-drafter, assembly-agent, novelist, write-scene, revision-loop]
dependency-graph:
  requires: ["02-01", "02-02"]
  provides: ["scene-drafter agent", "assembly-agent", "updated novelist", "write-scene skill"]
  affects: ["03-01", "03-02"]
tech-stack:
  added: []
  patterns: ["chain-of-thought pre-writing", "exemplar injection", "quality gate enforcement"]
key-files:
  created:
    - agents/scene-drafter.md
    - agents/assembly-agent.md
    - skills/write-scene/SKILL.md
  modified:
    - agents/novelist.md
decisions:
  - id: "02-03-01"
    description: "Scene drafter uses chain-of-thought pre-writing section"
    rationale: "CoT improves scene quality by forcing explicit planning before prose generation"
  - id: "02-03-02"
    description: "Assembly agent limited to maximum 2-sentence bridges"
    rationale: "Minimal intervention preserves scene quality; larger gaps need human review"
  - id: "02-03-03"
    description: "Novelist updated with scene-by-scene mode quality gates"
    rationale: "Allows novelist to work in both full-chapter and scene-level modes"
  - id: "02-03-04"
    description: "write-scene skill is primary revision loop orchestrator"
    rationale: "Single entry point for scene-based pipeline with quality control"
metrics:
  duration: 5min
  completed: 2026-02-05
---

# Phase 2 Plan 03: Scene-Drafter, Assembly Agent, and Write-Scene Skill Summary

Agent layer for scene-based writing pipeline with exemplar injection, sensory grounding requirements, and revision loop orchestration via write-scene skill.

## One-Liner

Scene-drafter (800-1500 char, 2+ senses, zero filter words) + assembly-agent (transition gap smoothing) + write-scene skill (Quality Oracle -> Prose Surgeon loop orchestration).

## What Was Built

### Task 1: Scene-Drafter and Assembly-Agent Prompts

**agents/scene-drafter.md**
- Purpose: Scene-level novelist for focused prose generation
- Model: Opus
- Key constraints:
  - Minimum 2 unique senses per scene (ABSOLUTE REQUIREMENT)
  - Zero filter words outside dialogue (ZERO TOLERANCE)
  - No 5+ consecutive sentences with same ending
  - 800-1500 character output range
- Features:
  - Chain-of-thought pre-writing protocol (internal)
  - Exemplar integration section with "예시 1:" format
  - Anti-pattern avoidance section with "ANTI-PATTERN" format
  - SceneV5 field integration (sensory_anchors mandatory)
  - Quality self-check checklist

**agents/assembly-agent.md**
- Purpose: Combine scenes with minimal intervention
- Model: Sonnet
- Key constraints:
  - Maximum 2 sentences per transition bridge
  - Preserves original scene content (no rewrites)
  - Detects temporal, spatial, emotional gaps
- Features:
  - Gap detection heuristics table
  - Severity-based handling (minor/moderate/severe)
  - Bridge sentence templates
  - Assembly report output

### Task 2: Novelist Agent Update

**agents/novelist.md** (modified)
- Added "Style Exemplar Integration" section after Role
- Added EXEMPLAR REQUIREMENTS section with integration checklist
- Added SENSORY GROUNDING section:
  - 500자 이상 = 2개 감각 필수
  - 1000자 이상 = 3개 권장
- Added "필터 워드 금지" section with alternatives table
- Added "Scene-by-Scene Mode" section:
  - Per-scene sensory checklist
  - Exemplar application log
  - Scene quality gate criteria
  - Revision loop integration reference

### Task 3: Write-Scene Skill

**skills/write-scene/SKILL.md**
- Version: 1.0.0
- 6-step pipeline:
  1. Load chapter and decompose into SceneV5 scenes
  2. Prepare scene contexts with fresh exemplars (prepareSceneDraft)
  3. Draft each scene via scene-drafter agent
  4. Assemble scenes via assembly-agent (assembleScenes)
  5. **CRITICAL**: Run revision loop (runRevisionLoop)
  6. Save final output

- Revision loop orchestration:
  - Imports `runRevisionLoop` from `src/pipeline/revision-loop.ts`
  - Defines `SurgeonCallback` implementation
  - ASCII flow diagram showing Oracle -> Surgeon loop
  - Circuit breaker handling documented (3x failure threshold)

- Integration points:
  - `src/pipeline/scene-writer.ts`: prepareSceneDraft, prepareChapterScenes
  - `src/pipeline/assembler.ts`: assembleScenes, assembleScenesWithGaps
  - `src/pipeline/revision-loop.ts`: runRevisionLoop
  - `src/pipeline/quality-oracle.ts`: analyzeChapter
  - `src/pipeline/prose-surgeon.ts`: executeDirective

## Key Decisions

| ID | Decision | Rationale |
|----|----------|-----------|
| 02-03-01 | CoT pre-writing in scene-drafter | Explicit planning improves scene quality |
| 02-03-02 | Max 2-sentence bridges in assembly | Minimal intervention; larger gaps need review |
| 02-03-03 | Novelist scene-by-scene mode | Supports both full-chapter and scene-level modes |
| 02-03-04 | write-scene as primary orchestrator | Single entry point with quality control |

## Files Changed

| File | Change | LOC |
|------|--------|-----|
| agents/scene-drafter.md | Created | ~250 |
| agents/assembly-agent.md | Created | ~200 |
| agents/novelist.md | Modified | +90 |
| skills/write-scene/SKILL.md | Created | ~345 |

## Verification Results

All success criteria verified:
- [x] Scene drafter requires 2+ senses per scene
- [x] Scene drafter bans filter words explicitly
- [x] Scene drafter includes exemplar and anti-exemplar sections
- [x] Scene drafter includes CoT pre-writing
- [x] Assembly agent detects temporal/spatial/emotional gaps
- [x] Assembly agent limits bridging to 1-2 sentences
- [x] Novelist agent updated with exemplar integration
- [x] Novelist agent has SENSORY GROUNDING section
- [x] Novelist agent has filter word ban section
- [x] write-scene skill created with full workflow
- [x] write-scene explicitly orchestrates revision loop
- [x] Skill references runRevisionLoop from revision-loop.ts
- [x] Revision loop flow diagram included

## Deviations from Plan

None - plan executed exactly as written.

## Commits

| Hash | Message |
|------|---------|
| 232fd74 | feat(02-03): add scene-drafter and assembly-agent prompts |
| 99c505d | feat(02-03): update novelist agent with exemplar integration and sensory grounding |
| e2be1c1 | feat(02-03): create write-scene skill with revision loop orchestration |

## Next Phase Readiness

Phase 2 is now complete. The scene-based writing pipeline has:
- TypeScript modules (02-01): scene-writer, assembler, types
- Quality control modules (02-02): quality-oracle, prose-surgeon, revision-loop
- Agent prompts (02-03): scene-drafter, assembly-agent, updated novelist
- Orchestration skill (02-03): write-scene

**Ready for Phase 3**: Korean Language Enhancement
- Filter word detection can be extended with more comprehensive lists
- Sensory grounding validation can be refined with native writer input
- Style exemplar library needs population with quality examples

**No blockers** for Phase 3 initiation.
