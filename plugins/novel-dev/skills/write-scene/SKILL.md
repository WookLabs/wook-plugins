---
name: write-scene
description: |
  장면 단위로 챕터를 집필합니다. 각 장면에 스타일 예시를 주입하고, 품질 검증 후 수술적 수정을 거쳐 조합합니다.
  <example>이 챕터를 장면 단위로 써줘</example>
  <example>/write-scene chapter 3</example>
  <example>/write-scene --no-revision</example>
version: 1.0.0
user-invocable: true
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Task
---

# Write-Scene Skill

장면 단위 집필 파이프라인을 조율하는 스킬입니다. SceneV5 계획을 기반으로 각 장면을 독립적으로 작성하고, 품질 검증 및 수술적 수정을 거쳐 최종 챕터를 조합합니다.

## Overview

6-step pipeline:
1. **Load** - 챕터 계획 및 장면 분해
2. **Prepare** - 장면별 컨텍스트 및 예시 준비
3. **Draft** - scene-drafter로 각 장면 초안 작성
4. **Assemble** - assembly-agent로 장면 조합
5. **Revise** - Quality Oracle -> Prose Surgeon 루프 (CRITICAL)
6. **Save** - 최종 원고 저장

## Prerequisites

- SceneV5 compatible chapter plan (`chapters/chapter_{N}.json`)
- Style library with exemplars (`meta/style-library.json`)
- Character profiles (`characters/*.json`)
- Pipeline modules installed (`src/pipeline/`)

## Usage

```
/write-scene chapter <N>                 # 챕터 N 집필
/write-scene chapter <N> --no-revision   # 수정 루프 없이 초안만
/write-scene chapter <N> --max-iter <M>  # 최대 M회 수정 반복
/write-scene chapter <N> --draft-only    # 장면 초안만 출력 (조합 X)
```

### Flags

| Flag | Default | Description |
|------|---------|-------------|
| `--no-revision` | false | 품질 검증 및 수정 루프 건너뛰기 |
| `--max-iter` | 5 | 최대 수정 반복 횟수 |
| `--draft-only` | false | 개별 장면 초안만 출력, 조합하지 않음 |
| `--verbose` | false | 상세 진행 로그 출력 |
| `--skip-assembly` | false | 조합 단계 건너뛰기 (개별 장면 파일 유지) |

## Workflow

### Step 1: Load Chapter and Decompose

```typescript
import { loadScenes, decomposeChapter } from '../scene/decomposer.js';

// Load chapter plan
const chapterPath = `chapters/chapter_${N}.json`;
const chapter = JSON.parse(await Read(chapterPath));

// Get SceneV5 scenes
const scenes: SceneV5[] = chapter.scenes;
```

**Output**: Array of SceneV5 objects ready for drafting

### Step 2: Prepare Scene Contexts (prepareSceneDraft)

```typescript
import { prepareChapterScenes, prepareSceneDraft } from '../pipeline/scene-writer.js';
import { loadStyleLibrary } from '../style-library/storage.js';

// Load style library
const library = await loadStyleLibrary('meta/style-library.json');

// Prepare all scene contexts with fresh exemplars
const chapterContexts = prepareChapterScenes(
  scenes,
  chapterNumber,
  library,
  baseContextItems,  // characters, plot, world
  { genre, currentChapter: chapterNumber }
);
```

**Key Function**: `prepareSceneDraft` injects fresh exemplars per scene via `queryExemplars()`.

**Output**: `ChapterSceneContexts` with tiered context and exemplars for each scene

### Step 3: Draft Each Scene (scene-drafter agent)

```typescript
// For each scene, delegate to scene-drafter agent
for (const ctx of chapterContexts.sceneContexts) {
  const draft = await Task({
    subagent_type: 'novel-dev:scene-drafter',
    prompt: buildSceneDraftPrompt(ctx),
    model: 'opus'
  });

  drafts.push(createSceneDraftResult(
    ctx.sceneNumber,
    draft,
    ctx.exemplars.exemplars.map(e => e.id)
  ));
}
```

**Agent**: `scene-drafter` (see `agents/scene-drafter.md`)

**Output**: Array of `SceneDraftResult` objects

### Step 4: Assemble Scenes (assembleScenes, assembly-agent)

```typescript
import { assembleScenesWithGaps } from '../pipeline/assembler.js';

// Assemble scenes with gap detection
const assemblyResult = assembleScenesWithGaps(scenes, drafts, true);

// If moderate+ gaps detected, invoke assembly-agent
if (assemblyResult.transitionGaps.some(g => g.severity !== 'minor')) {
  const smoothedContent = await Task({
    subagent_type: 'novel-dev:assembly-agent',
    prompt: buildAssemblyPrompt(assemblyResult),
    model: 'sonnet'
  });
  assemblyResult.assembledContent = smoothedContent;
}
```

**Agent**: `assembly-agent` (see `agents/assembly-agent.md`)

**Output**: `AssemblyResult` with combined chapter content

### Step 5: Revision Loop (CRITICAL ORCHESTRATION)

```typescript
import { runRevisionLoop, RevisionLoopConfig } from '../pipeline/revision-loop.js';
import type { SurgeonCallback } from '../pipeline/prose-surgeon.js';

// Define surgeon callback - invokes prose-surgeon agent
const surgeonCallback: SurgeonCallback = async (prompt, directive, config) => {
  return await Task({
    subagent_type: 'novel-dev:prose-surgeon',
    prompt: prompt,
    model: config.model,  // Opus or Sonnet based on directive type
    temperature: config.temperature
  });
};

// Run revision loop
const revisionConfig: Partial<RevisionLoopConfig> = {
  maxIterations: flags.maxIter || 5,
  maxDirectivesPerPass: 5,
  stopOnCircuitBreak: true,
  sceneCount: scenes.length
};

const revisionResult = await runRevisionLoop(
  assemblyResult.assembledContent,
  surgeonCallback,
  revisionConfig
);
```

**CRITICAL**: This step is the Quality Oracle -> Prose Surgeon loop.

```
┌─────────────────────────────────────────────────────────────────┐
│                    REVISION LOOP FLOW                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐    ┌─────────────────┐    ┌──────────────┐   │
│  │   Chapter    │───>│  Quality Oracle │───>│  Directives  │   │
│  │   Content    │    │  (analyzeChapter)│    │  Generated   │   │
│  └──────────────┘    └─────────────────┘    └──────┬───────┘   │
│                              │                      │           │
│                      verdict │                      │           │
│                              │                      │           │
│                    ┌─────────▼─────────┐            │           │
│                    │   PASS or REVISE  │            │           │
│                    └─────────┬─────────┘            │           │
│                              │                      │           │
│         ┌────────────────────┼───────────┐          │           │
│         │ PASS               │ REVISE    │          │           │
│         ▼                    ▼           │          │           │
│  ┌──────────────┐   ┌────────────────┐   │          │           │
│  │    DONE      │   │  For each      │   │          │           │
│  │   Return     │   │  directive:    │<──┼──────────┘           │
│  │   Content    │   └───────┬────────┘   │                      │
│  └──────────────┘           │            │                      │
│                             ▼            │                      │
│                    ┌────────────────┐    │                      │
│                    │ Prose Surgeon  │    │                      │
│                    │(SurgeonCallback)│    │                      │
│                    └───────┬────────┘    │                      │
│                            │             │                      │
│                   Apply fix│             │                      │
│                            │             │                      │
│                   ┌────────▼────────┐    │                      │
│                   │ Circuit Breaker │    │                      │
│                   │   Check (3x)    │    │                      │
│                   └────────┬────────┘    │                      │
│                            │             │                      │
│          ┌─────────────────┴─────────────┤                      │
│          │ OK              │ TRIP        │                      │
│          ▼                 ▼             │                      │
│   ┌─────────────┐   ┌─────────────┐      │                      │
│   │ Next iter   │   │ CIRCUIT_    │      │                      │
│   │ (loop back) │   │   BREAK     │      │                      │
│   └─────────────┘   └─────────────┘      │                      │
│                                          │                      │
│   Max iterations: 5 (configurable)       │                      │
│   Max directives/pass: 5                 │                      │
│                                          │                      │
└─────────────────────────────────────────────────────────────────┘
```

**Circuit Breaker Handling:**
- If same directive type fails 3 times at same location, circuit breaker trips
- When `CIRCUIT_BREAK` occurs, loop stops and flags manual review needed
- Result includes `circuitBrokenDirectives` array for debugging

**Output**: `RevisionLoopResult` with final content and iteration history

### Step 5: Save Output

```typescript
const outputPath = `manuscripts/chapter_${N}.md`;
await Write(outputPath, revisionResult.finalContent);

// Save revision report
const reportPath = `manuscripts/chapter_${N}_revision_report.json`;
await Write(reportPath, JSON.stringify({
  verdict: revisionResult.finalVerdict,
  iterations: revisionResult.iterations,
  totalDirectives: revisionResult.totalDirectivesProcessed,
  successfulFixes: revisionResult.totalSuccessfulFixes,
  circuitBreaks: revisionResult.circuitBrokenDirectives
}, null, 2));
```

**Output Files**:
- `manuscripts/chapter_{N}.md` - Final chapter prose
- `manuscripts/chapter_{N}_revision_report.json` - Revision loop report

## Integration Points

| Module | Import | Purpose |
|--------|--------|---------|
| `src/pipeline/scene-writer.ts` | `prepareSceneDraft`, `prepareChapterScenes` | Scene context preparation |
| `src/pipeline/assembler.ts` | `assembleScenes`, `assembleScenesWithGaps` | Scene combination |
| `src/pipeline/revision-loop.ts` | `runRevisionLoop` | Quality Oracle -> Prose Surgeon orchestration |
| `src/pipeline/quality-oracle.ts` | `analyzeChapter` | Prose quality analysis |
| `src/pipeline/prose-surgeon.ts` | `executeDirective` | Surgical prose fixes |
| `src/pipeline/types.ts` | `SceneV5`, `SurgicalDirective`, etc. | Type definitions |
| `src/style-library/index.ts` | `queryExemplars` | Exemplar retrieval |
| `src/context/index.ts` | `assembleTieredContext` | Context assembly |

## Agents Used

| Agent | File | Role | Model |
|-------|------|------|-------|
| scene-drafter | `agents/scene-drafter.md` | Draft individual scenes | Opus |
| assembly-agent | `agents/assembly-agent.md` | Combine scenes, smooth transitions | Sonnet |
| quality-oracle | `agents/quality-oracle.md` | Analyze prose quality, generate directives | Opus |
| prose-surgeon | `agents/prose-surgeon.md` | Execute surgical fixes | Opus/Sonnet |
| novelist | `agents/novelist.md` | Full chapter writing (alternative mode) | Opus |

## Quality Gates

Enforced throughout the pipeline:

| Gate | Threshold | Enforced By |
|------|-----------|-------------|
| Sensory grounding | 2+ senses per 500+ char segment | Quality Oracle |
| Filter words | 0 outside dialogue | Quality Oracle |
| Rhythm variation | No 5+ consecutive same endings | Quality Oracle |
| Scene length | 800-1500 chars per scene | Scene Drafter |
| Transition smoothness | No severe gaps | Assembly Agent |

## Revision Loop Configuration

| Parameter | Default | Description |
|-----------|---------|-------------|
| `maxIterations` | 5 | Maximum Quality Oracle -> Surgeon cycles |
| `maxDirectivesPerPass` | 5 | Directives processed per iteration |
| `stopOnCircuitBreak` | true | Halt on 3x failure at same location |
| `sceneCount` | auto | Number of scenes (for location mapping) |

## Error Handling

| Error | Handling |
|-------|----------|
| Missing chapter file | Error with path suggestion |
| Empty style library | Warning, proceed without exemplars |
| Scene draft failure | Retry once, then flag |
| Assembly failure | Return drafts without assembly |
| Circuit breaker trip | Stop loop, return partial result |
| Max iterations | Return best result so far |

## Output

### Success Output
```
## Chapter {N} Complete

**Verdict**: {PASS | REVISE}
**Scenes**: {N} drafted, assembled
**Revisions**: {M} iterations, {K} fixes applied
**Output**: manuscripts/chapter_{N}.md

### Quality Summary
- Sensory grounding: {score}/100
- Filter word density: {N} per 1000 chars
- Rhythm variation: {score}/100

### Files Created
- manuscripts/chapter_{N}.md
- manuscripts/chapter_{N}_revision_report.json
```

### Error Output
```
## Chapter {N} Error

**Stage**: {stage name}
**Error**: {error message}
**Partial Output**: {path if available}
```

## Related Skills

- `/write` - Full chapter writing without scene decomposition
- `/revise` - Manual revision pass on existing chapter
- `/style-library` - Manage exemplars for writing
