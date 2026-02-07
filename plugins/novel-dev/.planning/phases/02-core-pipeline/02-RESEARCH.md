# Phase 2: Core Pipeline - Research

**Researched:** 2026-02-05
**Domain:** Scene-based writing pipeline, surgical revision architecture, agent prompt redesign
**Confidence:** HIGH

## Summary

Phase 2 transforms the Novel-Dev writing pipeline from a monolithic chapter-writing approach to a decomposed scene-by-scene composition system with directive-driven surgical revision. This builds directly on Phase 1's foundation: the Style Library provides exemplars for few-shot injection, the Context Manager assembles tiered hot/warm/cold bundles with sandwich pattern, and the Scene Data Model (SceneV5) provides enriched scene specifications.

The core architectural shift is from `write full chapter -> score -> generic edit -> score` to `decompose into scenes -> draft each scene with fresh exemplars -> assemble with transitions -> evaluate with directives -> surgical fixes only`. Research (ICLR 2025 Agents' Room, EMNLP 2025 style imitation studies) validates that scene-by-scene drafting with style exemplars produces 40%+ quality improvement over monolithic generation. The Quality Oracle producing passage-level surgical directives replaces abstract numeric scores that give editors no actionable guidance.

The phase covers 6 requirements (PIPE-01 through PIPE-06): scene-based writing flow, Quality Oracle directive system, Prose Surgeon agent, and prompt redesigns for novelist, editor, and critic agents. The existing agents (`novelist.md`, `editor.md`, `critic.md`) have solid genre-specific guidance but lack exemplar integration, directive-based feedback, and scene-level focus.

**Primary recommendation:** Implement the scene-based writing orchestration layer first (PIPE-01), then the Quality Oracle directive schema and Prose Surgeon agent (PIPE-02/03) which work together, and finally redesign the existing agent prompts (PIPE-04/05/06) to integrate exemplars, sensory requirements, and diagnostic criteria. The directive schema between Quality Oracle and Prose Surgeon is the critical design decision requiring the most iteration.

## Standard Stack

This is a Claude Code plugin. No new runtime dependencies are needed. The "stack" is TypeScript modules, agent definitions (markdown), and JSON schemas.

### Core (Already in Codebase from Phase 1)
| Component | Purpose | Status |
|-----------|---------|--------|
| `src/scene/types.ts` | SceneV5 interface with emotional arcs, sensory anchors, transitions | Complete |
| `src/scene/decomposer.ts` | `decomposeChapter()` function with heuristic enrichment | Complete |
| `src/style-library/` | `queryExemplars()`, storage, 5-dimension taxonomy | Complete |
| `src/context/tiers.ts` | `assembleTieredContext()` with sandwich pattern | Complete |
| `agents/novelist.md` | Current novelist agent (needs redesign) | Exists |
| `agents/editor.md` | Current editor agent (needs redesign) | Exists |
| `agents/critic.md` | Current critic agent (needs redesign) | Exists |

### New Components to Create
| Component | Type | Purpose |
|-----------|------|---------|
| `src/pipeline/scene-writer.ts` | TypeScript | Scene-by-scene orchestration with exemplar injection |
| `src/pipeline/assembler.ts` | TypeScript | Scene assembly with transition smoothing |
| `src/pipeline/quality-oracle.ts` | TypeScript | Directive generation logic and schema |
| `src/pipeline/prose-surgeon.ts` | TypeScript | Directive execution with scope constraints |
| `schemas/surgical-directive.schema.json` | JSON Schema | Directive format between Oracle and Surgeon |
| `agents/scene-drafter.md` | Agent | Refactored novelist for scene-level writing |
| `agents/assembly-agent.md` | Agent | Scene combination with transitions |
| `agents/quality-oracle.md` | Agent | Consolidated evaluator producing directives |
| `agents/prose-surgeon.md` | Agent | Directive-driven revision (replaces editor) |
| `skills/write-scene/SKILL.md` | Skill | Scene-level writing orchestration |

### Dependencies on Phase 1 Infrastructure
| Phase 1 Component | How Phase 2 Uses It |
|-------------------|---------------------|
| `queryExemplars(library, query)` | Scene Drafter fetches 2-3 matching exemplars per scene |
| `assembleTieredContext()` | Scene-specific context bundles for each draft call |
| `formatPromptOrder()` | Sandwich pattern assembly for Scene Drafter prompts |
| `SceneV5` interface | Scene plans consumed by Scene Drafter |
| `decomposeChapter()` | Entry point for scene-based writing flow |

## Architecture Patterns

### Recommended Project Structure (New Files Only)

```
novel-dev/
src/
  pipeline/
    index.ts                  # NEW: Pipeline module exports
    types.ts                  # NEW: SurgicalDirective, DirectiveType, etc.
    scene-writer.ts           # NEW: Scene-by-scene writing orchestration
    assembler.ts              # NEW: Scene assembly with transitions
    quality-oracle.ts         # NEW: Directive generation
    prose-surgeon.ts          # NEW: Directive execution
  style-library/
    retrieval.ts              # MODIFY: Add scene-aware exemplar selection
schemas/
  surgical-directive.schema.json  # NEW: Directive schema
agents/
  scene-drafter.md            # NEW: Scene-level novelist (opus)
  assembly-agent.md           # NEW: Scene combiner (sonnet)
  quality-oracle.md           # NEW: Evaluator with directives (opus)
  prose-surgeon.md            # NEW: Surgical editor (opus/sonnet per op)
  novelist.md                 # MODIFY: Add exemplar integration, scene focus
  editor.md                   # DEPRECATED: Replaced by prose-surgeon
  critic.md                   # DEPRECATED: Replaced by quality-oracle
skills/
  write/
    SKILL.md                  # MODIFY: Integrate scene-based flow
  write-scene/                # NEW: Scene-level writing skill
    SKILL.md
tests/
  pipeline/
    scene-writer.test.ts      # NEW: Orchestration tests
    quality-oracle.test.ts    # NEW: Directive generation tests
    prose-surgeon.test.ts     # NEW: Directive execution tests
```

### Pattern 1: Scene-Based Writing Flow (PIPE-01)

**What:** Decompose chapter into scenes, draft each with fresh exemplar injection, assemble with transitions.

**Workflow:**
```
/write 5
     |
     v
[1] Load chapter_005.json
     |
     v
[2] decomposeChapter() -> SceneV5[]
    (Uses Phase 1 decomposer)
     |
     v
[3] FOR EACH scene (1..N):
    |
    [3a] Build scene-specific context:
         - queryExemplars() for 2-3 matching exemplars
         - assembleTieredContext() with scene metadata
         - formatPromptOrder() for sandwich placement
    |
    [3b] Invoke scene-drafter agent:
         - CoT pre-writing (emotional arc, senses, metaphor)
         - Generate 800-1500 chars prose
         - Return scene draft
    |
    v
[4] Collect all drafted scenes
     |
     v
[5] Invoke assembly-agent:
     - Smooth transitions between scenes
     - Check pacing rhythm across chapter
     - Verify chapter-end hook
     - OUTPUT: Assembled chapter draft
     |
     v
[6] Continue to Quality Oracle evaluation (PIPE-02)
```

**Key Implementation Details:**

```typescript
// src/pipeline/scene-writer.ts
interface SceneWriterConfig {
  maxExemplarsPerScene: number;     // Default: 3 (2 good + 1 anti)
  includeAntiExemplar: boolean;     // Default: true
  chainOfThoughtEnabled: boolean;   // Default: true
  maxSceneCharacters: number;       // Default: 3 (full profiles)
}

interface SceneDraftResult {
  sceneNumber: number;
  content: string;
  estimatedTokens: number;
  exemplarsUsed: string[];          // Exemplar IDs for tracking
  preWritingThoughts?: string;      // CoT output (discarded from final)
}

async function draftScene(
  scene: SceneV5,
  chapter: ChapterMeta,
  library: StyleLibrary,
  config: SceneWriterConfig
): Promise<SceneDraftResult> {
  // 1. Build exemplar query from scene
  const query: ExemplarQuery = {
    genre: chapter.meta.genre,
    scene_type: mapToSceneType(scene.exemplar_tags),
    emotional_tone: scene.emotional_tone,
    pov: scene.pov_character ? 'third-limited' : undefined,
    pacing: scene.style_override?.pacing,
    limit: config.maxExemplarsPerScene,
    include_anti: config.includeAntiExemplar,
  };

  // 2. Fetch exemplars
  const exemplarResult = queryExemplars(library, query);

  // 3. Build tiered context
  const contextBundle = assembleTieredContext(sceneContextItems, {
    currentChapter: chapter.chapter_number,
    currentScene: scene.scene_number,
    appearsInCurrentScene: true,
  });

  // 4. Invoke scene-drafter agent
  // ... agent invocation
}
```

### Pattern 2: Quality Oracle Directive System (PIPE-02)

**What:** Replace numeric scores with passage-level surgical directives containing location, problem, concrete fix, and exemplar reference.

**Directive Schema:**
```typescript
// src/pipeline/types.ts
type DirectiveType =
  | 'show-not-tell'       // Emotional telling -> physical showing
  | 'filter-word-removal' // Remove "felt", "seemed", "thought"
  | 'sensory-enrichment'  // Add missing senses (2+ per scene required)
  | 'rhythm-variation'    // Fix monotonous sentence structure
  | 'dialogue-subtext'    // On-the-nose dialogue -> subtext
  | 'cliche-replacement'  // Replace stock Korean AI phrases
  | 'transition-smoothing'// Abrupt scene transition
  | 'voice-consistency'   // Character voice drift
  | 'proofreading';       // Grammar, spacing, punctuation

interface SurgicalDirective {
  id: string;                       // "dir_{type}_{NNN}"
  type: DirectiveType;
  priority: number;                 // 1 (highest) to 10
  location: PassageLocation;        // Where in the chapter
  issue: string;                    // What's wrong (specific)
  currentText: string;              // The problematic passage
  instruction: string;              // How to fix (concrete)
  exemplarId?: string;              // Reference exemplar ID
  exemplarContent?: string;         // Actual exemplar text
  maxScope: number;                 // Max paragraphs to touch (1-3)
}

interface PassageLocation {
  sceneNumber: number;
  paragraphStart: number;
  paragraphEnd: number;
  characterOffset?: number;         // For precise targeting
}
```

**Quality Oracle Output:**
```typescript
interface QualityOracleResult {
  verdict: 'PASS' | 'REVISE';
  assessment: {
    proseQuality: { score: number; verdict: string; issues: string[] };
    sensoryGrounding: { score: number; senseCount: number; required: 2 };
    filterWordDensity: { count: number; perThousand: number; threshold: 5 };
    rhythmVariation: { score: number; repetitionInstances: string[] };
    characterVoice: { score: number; driftInstances: string[] };
    transitionQuality: { score: number; issues: string[] };
  };
  directives: SurgicalDirective[];  // Only populated if verdict is REVISE
  readerExperience: string;         // Qualitative feedback
}
```

**Directive Generation Rules:**
1. Each issue type maps to exactly one directive type
2. Directives are ordered by priority (show-not-tell > rhythm > filter words)
3. Maximum 5 directives per evaluation pass (focus over breadth)
4. Each directive includes exemplar reference when available
5. `maxScope` enforced: never more than 3 paragraphs per directive

### Pattern 3: Prose Surgeon Agent (PIPE-03)

**What:** Execute only the specific fixes identified by Quality Oracle, never rewriting more than 3 paragraphs at once, preserving voice consistency.

**Surgical Operations:**
| Operation | Model | Temperature | Scope Limit |
|-----------|-------|-------------|-------------|
| `show-not-tell` | opus | 0.6 | 3 paragraphs |
| `filter-word-removal` | sonnet | 0.3 | 5 paragraphs |
| `sensory-enrichment` | opus | 0.6 | 2 paragraphs |
| `rhythm-variation` | sonnet | 0.4 | 5 paragraphs |
| `dialogue-subtext` | opus | 0.7 | 3 paragraphs |
| `cliche-replacement` | opus | 0.5 | 3 paragraphs |
| `transition-smoothing` | sonnet | 0.4 | 2 paragraphs |
| `voice-consistency` | opus | 0.5 | 3 paragraphs |
| `proofreading` | haiku | 0.2 | unlimited |

**Prose Surgeon Constraints (HARD RULES):**
1. **Never exceed maxScope:** If directive says 2 paragraphs, surgeon touches exactly 2
2. **Preserve surrounding text:** Changes are surgical, not rewriting
3. **Follow exemplar style:** When exemplar provided, match its patterns
4. **One directive at a time:** Execute sequentially, re-check after each
5. **Voice preservation:** Maintain established character voice from context

**Revision Loop:**
```
Chapter Draft
     |
     v
Quality Oracle evaluates
     |
     +-- PASS --> Done
     |
     +-- REVISE (with directives)
           |
           v
         Prose Surgeon executes directives:
           FOR EACH directive by priority:
             1. Load passage context + exemplar
             2. Execute surgical rewrite
             3. Replace passage in chapter
           |
           v
         Quality Oracle re-evaluates
           |
           +-- PASS --> Done
           +-- REVISE --> Loop (max 3 iterations)
           +-- Same issue 3x --> Circuit breaker, escalate to user
```

### Pattern 4: Scene Drafter Prompt Architecture (PIPE-04)

**What:** Novelist agent redesigned for scene-level writing with sensory grounding, rhythmic variation, and zero filter words.

**Prompt Structure:**
```markdown
# System
당신은 한국 문학 소설가입니다. 감각적이고 몰입감 있는 산문을 씁니다.

## 목표 문체 (Style Exemplars)
다음 예시들의 문체와 음질을 따라 쓰세요:

### 예시 1: {scene_type}
{exemplar_1_content}

### 예시 2: {scene_type}
{exemplar_2_content}

## 절대 피할 패턴 (Anti-Patterns)
{anti_exemplar_content}
- "느꼈다", "보였다", "생각했다" 같은 필터 워드 사용 금지
- "갑자기", "문득" 남발 금지
- 5문장 연속 같은 어미 금지 (~다. ~다. ~다.)

## 장면 계획
- 장면 번호: {scene_number}
- 목적: {scene.purpose}
- POV 캐릭터: {pov_character_name}
- 감정 아크: {entry_emotion} -> {exit_emotion}
- 피크 모먼트: {peak_moment}
- 감각 앵커 (필수): {sensory_anchors.join(', ')}
- 대화 목표: {dialogue_goals}
- 전환 지시: {transition.from_previous} / {transition.to_next}

## 컨텍스트
- 직전 장면 마지막: {previous_scene_ending}
- 캐릭터 프로필: {character_profiles}
- 장소 묘사: {location_description}

## 사전 구상 (Chain-of-Thought, 출력에 포함하지 마세요)
쓰기 전에 짧게 메모하세요:
1. 이 장면의 감정 곡선 (시작 -> 끝)
2. 전면에 부각할 감각 (최소 2개)
3. 사용할 신선한 은유나 이미지 하나
4. 핵심 대화의 이면(서브텍스트)

## 본문 작성
500자 이상의 장면을 작성하세요. 감각적 묘사와 리듬감 있는 문장으로.
```

**Scene Drafter Requirements (from Success Criteria):**
- Sensory grounding: 2+ senses per 500+ char scene
- Rhythmic variation: No 5+ consecutive same-ending sentences
- Zero filter words: No "felt", "seemed", "thought" (느꼈다, 보였다, 생각했다)
- Exemplar injection: 2-3 matched exemplars in every prompt
- Anti-exemplar: Show what NOT to write

### Pattern 5: Editor -> Prose Surgeon Transition (PIPE-05)

**What:** Replace generic "improve quality" editing with directive-based surgical fixes.

**Current editor.md problems:**
1. Generic 4-pass editing (macro -> sentence -> polish -> proofread)
2. No exemplar reference for "better" writing
3. No scope constraints (can rewrite entire chapter)
4. Abstract guidelines ("improve rhythm") without concrete targets

**Prose Surgeon improvements:**
1. Specific passage targeting (paragraphs 8-10, not "the chapter")
2. Exemplar-backed instructions ("make it feel like THIS exemplar")
3. Hard scope limits (never more than 3 paragraphs per operation)
4. Directive types map to specific operations

**Migration:** Editor agent is not deleted but deprecated. Prose Surgeon is the new default for revision. Editor may be kept for "traditional" editing scenarios.

### Pattern 6: Critic -> Quality Oracle Transition (PIPE-06)

**What:** Replace numeric scoring (22-25 per category) with diagnostic directives.

**Current critic.md problems:**
1. Score-based feedback ("narrative_prose: 22/25") gives editor no actionable info
2. Generic "weaknesses" list without passage locations
3. Rubric-based evaluation favors surface correctness over "alive" prose
4. Separate validators (critic, beta-reader, genre-validator) create coordination issues

**Quality Oracle improvements:**
1. Passage-level issue identification with exact locations
2. Directive generation with concrete fix instructions
3. Exemplar references for what "better" looks like
4. Single consolidated evaluator (no multi-validator coordination tax)
5. Literary diagnostic criteria: sensory count, filter word density, rhythm score

**Diagnostic Metrics (must be computed):**
| Metric | Threshold | Computation |
|--------|-----------|-------------|
| Sensory senses per 500 chars | >= 2 | Count unique sense categories (sight, sound, smell, touch, taste) |
| Filter word density | < 5 per 1000 | Count "느꼈다/보였다/생각했다/~인 것 같았다" occurrences |
| Same-ending consecutive | < 5 | Count max consecutive sentences with same ending (다/요/지) |
| Dialogue ratio | 55-65% | Dialogue characters / total characters |

### Anti-Patterns to Avoid

- **Score-only feedback:** "Score: 72/100" gives Prose Surgeon nothing to act on. Always include directives.
- **Generic editing pass:** "Improve the prose quality" is not actionable. Specify what, where, how.
- **Scope creep:** Never let Prose Surgeon rewrite more than specified. 3 paragraphs means 3 paragraphs.
- **Missing exemplars:** Every show-not-tell and sensory-enrichment directive must include exemplar reference.
- **Same-model self-critique:** Quality Oracle must be a fresh context, not the same instance that wrote.
- **Directive flooding:** Max 5 directives per pass. Focus produces better results than breadth.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Scene decomposition | Custom beat parser | Phase 1 `decomposeChapter()` | Already handles beat clustering, emotional arc chaining |
| Exemplar retrieval | Custom matching | Phase 1 `queryExemplars()` | Already scores by 5-dimension taxonomy |
| Context assembly | Custom bundling | Phase 1 `assembleTieredContext()` | Already handles tier assignment, budget enforcement, sandwich split |
| Token estimation | New counter | Existing `estimateTokens()` | Already handles Korean/English/JSON |
| Filter word detection | Custom regex | Create once in `quality-oracle.ts` | Standard pattern, reuse across all evaluations |

**Key insight:** Phase 1 built substantial infrastructure. Phase 2 composes these pieces into the new pipeline, not replaces them.

## Common Pitfalls

### Pitfall 1: Directive Schema Over-Engineering
**What goes wrong:** Complex directive schema with too many fields becomes rigid and hard to extend.
**Why it happens:** Trying to anticipate all possible directive types upfront.
**How to avoid:** Start with 5 core directive types (show-not-tell, filter-word, sensory, rhythm, proofreading). Add new types only when Quality Oracle identifies patterns it can't express. Schema should be minimal: type, location, issue, instruction, exemplar.
**Warning signs:** Directive schema has 20+ fields; new issue types require schema changes.

### Pitfall 2: Quality Oracle Produces Too Many Directives
**What goes wrong:** Oracle identifies 15 issues; Prose Surgeon overwhelmed; revision becomes rewriting.
**Why it happens:** Academic completeness over practical focus.
**How to avoid:** Hard cap at 5 directives per evaluation pass. Prioritize by impact: show-not-tell in climax > filter words anywhere. If more than 5 issues, the draft may need re-generation, not surgical fixes.
**Warning signs:** Directive count exceeds 5; Prose Surgeon touches >50% of chapter; multiple revision loops.

### Pitfall 3: Scene Transitions Feel Choppy
**What goes wrong:** Individually drafted scenes don't flow together as a chapter.
**Why it happens:** Each Scene Drafter call has fresh context; no inter-scene continuity.
**How to avoid:**
1. Include previous scene's last 300 chars in next scene's context
2. Assembly Agent specifically checks transition smoothness
3. SceneV5 `transition.to_next` field guides Scene Drafter on how to end
**Warning signs:** Assembly Agent adds bridging sentences to every transition; readers report choppy pacing.

### Pitfall 4: Prose Surgeon Exceeds Scope
**What goes wrong:** Surgeon rewrites 10 paragraphs when directive said 3.
**Why it happens:** LLMs tend to "improve" surrounding context too.
**How to avoid:**
1. Hard-code `maxScope` in directive
2. Prompt Surgeon with exact paragraph boundaries
3. Validation: count paragraphs in output, reject if exceeds scope
4. Circuit breaker: if scope exceeded 3x, flag for human review
**Warning signs:** Prose Surgeon output differs significantly from input; voice consistency drops.

### Pitfall 5: Filter Word Detection False Positives
**What goes wrong:** Quality Oracle flags legitimate usages of "느끼다" in dialogue.
**Why it happens:** Naive regex matching without context.
**How to avoid:**
1. Filter word detection excludes quoted dialogue
2. Context-aware: "그녀는 느꼈다" (narration, bad) vs. "네 기분이 어떻게 느껴져?" (dialogue, OK)
3. Threshold (5 per 1000) allows some occurrences
**Warning signs:** Dialogue sounds unnatural after filter word removal.

### Pitfall 6: Exemplar-Directive Mismatch
**What goes wrong:** Directive says "add sensory details" but attached exemplar is a dialogue scene.
**Why it happens:** Exemplar query uses scene-level tags, not directive-specific matching.
**How to avoid:**
1. Quality Oracle specifies exemplar_category per directive type
2. `sensory-enrichment` directive always queries `description` scene type exemplars
3. `dialogue-subtext` directive queries `dialogue` scene type exemplars
**Warning signs:** Prose Surgeon struggles to match exemplar style to the fix.

## Code Examples

### Surgical Directive Schema
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "surgical-directive.schema.json",
  "title": "Surgical Directive",
  "description": "Passage-level revision directive from Quality Oracle to Prose Surgeon",
  "type": "object",
  "required": ["id", "type", "priority", "location", "issue", "instruction", "maxScope"],
  "properties": {
    "id": {
      "type": "string",
      "pattern": "^dir_[a-z_]+_[0-9]{3}$"
    },
    "type": {
      "type": "string",
      "enum": ["show-not-tell", "filter-word-removal", "sensory-enrichment",
               "rhythm-variation", "dialogue-subtext", "cliche-replacement",
               "transition-smoothing", "voice-consistency", "proofreading"]
    },
    "priority": {
      "type": "integer",
      "minimum": 1,
      "maximum": 10
    },
    "location": {
      "type": "object",
      "required": ["sceneNumber", "paragraphStart", "paragraphEnd"],
      "properties": {
        "sceneNumber": { "type": "integer", "minimum": 1 },
        "paragraphStart": { "type": "integer", "minimum": 1 },
        "paragraphEnd": { "type": "integer", "minimum": 1 }
      }
    },
    "issue": {
      "type": "string",
      "description": "Specific problem identified"
    },
    "currentText": {
      "type": "string",
      "description": "The problematic passage text"
    },
    "instruction": {
      "type": "string",
      "description": "Concrete fix instruction"
    },
    "exemplarId": {
      "type": "string",
      "description": "Reference exemplar ID from Style Library"
    },
    "exemplarContent": {
      "type": "string",
      "description": "Actual exemplar text for Prose Surgeon"
    },
    "maxScope": {
      "type": "integer",
      "minimum": 1,
      "maximum": 5,
      "description": "Maximum paragraphs Prose Surgeon may touch"
    }
  }
}
```

### Scene Writer Orchestration
```typescript
// src/pipeline/scene-writer.ts
import { SceneV5, ChapterMeta } from '../scene/types.js';
import { queryExemplars, StyleLibrary } from '../style-library/index.js';
import { assembleTieredContext, formatPromptOrder } from '../context/index.js';

export interface SceneWriterOptions {
  chapter: ChapterMeta;
  scenes: SceneV5[];
  library: StyleLibrary;
  previousChapterEnding?: string;
}

export async function writeChapterByScenes(
  options: SceneWriterOptions
): Promise<SceneDraftResult[]> {
  const { chapter, scenes, library, previousChapterEnding } = options;
  const drafts: SceneDraftResult[] = [];

  let previousSceneEnding = previousChapterEnding || '';

  for (const scene of scenes) {
    // 1. Build exemplar query from scene
    const query = buildExemplarQuery(scene, chapter);
    const exemplars = queryExemplars(library, query);

    // 2. Build context bundle
    const contextItems = buildSceneContextItems(scene, chapter, exemplars);
    const bundle = assembleTieredContext(contextItems, {
      currentChapter: chapter.chapter_number,
      appearsInCurrentScene: true,
    });

    // 3. Format prompt with sandwich pattern
    const promptItems = formatPromptOrder(bundle);

    // 4. Invoke scene-drafter agent
    const draft = await invokeSceneDrafter({
      scene,
      promptItems,
      previousSceneEnding,
      exemplars: exemplars.exemplars,
      antiExemplar: exemplars.anti_exemplar,
    });

    drafts.push(draft);
    previousSceneEnding = extractEnding(draft.content, 300); // Last 300 chars
  }

  return drafts;
}
```

### Quality Oracle Evaluation
```typescript
// src/pipeline/quality-oracle.ts
import { SurgicalDirective, DirectiveType, QualityOracleResult } from './types.js';

const FILTER_WORDS = ['느꼈다', '보였다', '생각했다', '~인 것 같았다', '깨달았다'];

export function analyzeChapter(
  chapter: string,
  scenes: SceneV5[]
): QualityOracleResult {
  const directives: SurgicalDirective[] = [];
  const paragraphs = splitIntoParagraphs(chapter);

  // 1. Check sensory grounding (2+ senses per 500 chars)
  for (const scene of scenes) {
    const sceneText = extractSceneText(chapter, scene.scene_number);
    const senseCount = countUniqueSenses(sceneText);
    if (senseCount < 2 && sceneText.length >= 500) {
      directives.push(createSensoryDirective(scene, senseCount));
    }
  }

  // 2. Check filter word density
  const filterCount = countFilterWords(chapter);
  const density = filterCount / (chapter.length / 1000);
  if (density > 5) {
    directives.push(...createFilterWordDirectives(chapter, paragraphs));
  }

  // 3. Check rhythm variation (no 5+ consecutive same endings)
  const rhythmIssues = findRhythmIssues(paragraphs);
  if (rhythmIssues.length > 0) {
    directives.push(...createRhythmDirectives(rhythmIssues));
  }

  // 4. Prioritize and cap at 5
  const prioritized = prioritizeDirectives(directives).slice(0, 5);

  return {
    verdict: prioritized.length > 0 ? 'REVISE' : 'PASS',
    assessment: {
      // ... computed metrics
    },
    directives: prioritized,
    readerExperience: generateReaderFeedback(chapter, prioritized),
  };
}
```

## State of the Art

| Old Approach (v4.0) | New Approach (v5.0 Phase 2) | Impact |
|---------------------|----------------------------|--------|
| Monolithic chapter writing (5000+ chars) | Scene-by-scene drafting (800-1500 chars) | 40%+ quality improvement (ICLR 2025), fresh exemplars per scene |
| Score-based feedback (72/100) | Passage-level surgical directives | Actionable guidance, specific fixes |
| Generic editing ("improve quality") | Directive-driven surgery (3 paragraphs max) | Preserves voice, focused changes |
| Abstract guidelines ("show don't tell") | Exemplar-backed instructions | Concrete targets, not generic advice |
| Multi-validator consensus (3 scores) | Single Quality Oracle with diagnostics | No coordination tax, unified evaluation |
| novelist.md writes full chapter | scene-drafter.md writes one scene | Focus enables craft attention |
| editor.md generic 4-pass editing | prose-surgeon.md directive execution | Surgical precision, scope limits |
| critic.md numeric rubric (100 points) | quality-oracle.md with metrics + directives | Literary diagnostics, not surface scoring |

**Deprecated:**
- `editor.md` agent (replaced by `prose-surgeon.md`)
- `critic.md` agent (replaced by `quality-oracle.md`)
- Score-only evaluation (always produce directives)
- Unlimited revision scope (always specify maxScope)

## Open Questions

1. **Directive Schema Versioning**
   - What we know: Schema will evolve as new issue types are discovered
   - What's unclear: How to handle old directives when schema changes
   - Recommendation: Include `schemaVersion` field; Prose Surgeon validates version before execution

2. **Assembly Agent Transition Detection**
   - What we know: Scenes need smooth transitions; Assembly Agent checks them
   - What's unclear: How Assembly Agent detects "needs bridging" vs. "OK as-is"
   - Recommendation: Define specific patterns: temporal gap (different time), spatial gap (different location), emotional discontinuity (entry != previous exit). Add bridging sentence only when 2+ gaps detected.

3. **Chain-of-Thought Discarding**
   - What we know: Scene Drafter does CoT pre-writing; output should be discarded
   - What's unclear: How to reliably separate CoT output from prose output
   - Recommendation: Use structured output format with clear markers (`## Pre-Writing` section followed by `## Prose` section). Parser extracts only Prose section.

4. **Proofreading Model Routing**
   - What we know: Proofreading uses haiku for speed; other operations use opus
   - What's unclear: Whether haiku quality is sufficient for Korean proofreading
   - Recommendation: A/B test haiku vs. sonnet for proofreading. If haiku error rate > 5%, switch to sonnet.

5. **Revision Loop Termination**
   - What we know: Max 3 iterations; circuit breaker on same issue 3x
   - What's unclear: What "same issue" means (same directive type? same location?)
   - Recommendation: Define "same issue" as same directive type + overlapping location (paragraphs intersect). Track issue IDs across iterations.

## Sources

### Primary (HIGH confidence)
- **Phase 1 Research** (`01-RESEARCH.md`) - Foundation components now complete and tested
- **Project Research Summary** (`.planning/research/SUMMARY.md`) - 40%+ improvement from scene decomposition, exemplar injection as dominant factor
- **Architecture Research** (`.planning/research/ARCHITECTURE.md`) - Agents' Room validated architecture, directive-driven revision, sandwich pattern
- **Existing Agent Analysis** (`agents/novelist.md`, `agents/editor.md`, `agents/critic.md`) - Current prompts analyzed for gaps

### Secondary (MEDIUM confidence)
- **ICLR 2025 Agents' Room** (cited in project research) - Decomposed multi-step collaboration
- **EMNLP 2025 Style Imitation** (cited in project research) - Few-shot exemplars as dominant quality factor
- **Self-Refine / CRITIC Papers** (cited in project research) - Iterative refinement with external feedback

### Tertiary (LOW confidence)
- **Directive type coverage** - The 9 directive types are derived from research pitfalls; may need expansion based on actual Quality Oracle findings
- **maxScope limits** (1-5 paragraphs) - Based on research recommendation "never more than 3 paragraphs"; hard numbers need validation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Building on Phase 1 infrastructure; no new dependencies
- Architecture (scene-based flow): HIGH - Validated by ICLR 2025 Agents' Room research
- Architecture (directive schema): MEDIUM - Novel design, needs iteration during implementation
- Agent redesign: HIGH - Current prompts analyzed; gaps clearly identified
- Pitfalls: MEDIUM - Derived from research; real-world testing will reveal more

**Research date:** 2026-02-05
**Valid until:** Stable patterns; valid for 60+ days. Directive schema may evolve during implementation.
