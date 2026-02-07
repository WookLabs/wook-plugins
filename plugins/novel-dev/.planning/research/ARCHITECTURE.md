# Architecture Patterns: Multi-Agent Creative Writing System for Maximum Prose Quality

**Domain:** AI-assisted novel writing (Korean web novels), Claude Code plugin
**Researched:** 2026-02-05
**Overall Confidence:** MEDIUM-HIGH (synthesized from academic papers, industry benchmarks, and codebase analysis)

---

## Executive Summary

The current Novel-Dev v4.0 architecture has the right agents but the wrong interaction topology. It treats writing as a **pipeline problem** (write -> evaluate -> fix) when research shows it should be treated as a **composition problem** (plan -> draft partial -> reflect -> draft more -> revise holistically). The fundamental issue is that the novelist agent writes an entire chapter in a single pass, receives a score from critics, and then the editor patches it. This produces technically correct but lifeless prose because:

1. **Single-pass generation** forces the LLM to juggle plot, character voice, sensory detail, rhythm, and foreshadowing simultaneously, degrading all of them.
2. **Score-based feedback** (85/100) tells the editor *that* something is wrong but not *how* to fix it at the sentence level.
3. **Context flooding** (120K tokens of JSON schemas) crowds out the stylistic "taste" the model needs to write well.
4. **No style exemplars** are fed to the writing agent, so it defaults to generic LLM prose patterns.

The recommended v5.0 architecture decomposes writing into separable concerns, introduces style exemplar injection, and replaces score-driven revision with passage-level rewrite directives.

---

## Recommended Architecture

### High-Level System Diagram

```
                         +-----------------------+
                         |   CONTEXT ASSEMBLER   |
                         |  (Tiered Memory Mgr)  |
                         +----------+------------+
                                    |
                                    v
+----------------+     +-----------+-----------+     +------------------+
| STYLE LIBRARY  |---->|   CHAPTER PLANNER     |---->| SCENE DRAFTER    |
| (Exemplars DB) |     |   (Plot -> Scenes)    |     | (One scene/call) |
+----------------+     +-----------+-----------+     +--------+---------+
                                                              |
                                    +-------------------------+
                                    v
                         +----------+------------+
                         |   ASSEMBLY AGENT      |
                         | (Scenes -> Chapter)   |
                         +----------+------------+
                                    |
                                    v
                         +----------+------------+
                         |   PROSE SURGEON       |
                         | (Passage-level fixes) |
                         +----------+------------+
                                    |
                                    v
                         +----------+------------+
                         |   QUALITY ORACLE      |
                         | (Multi-aspect eval)   |
                         +----------+------------+
                                    |
                          +---------+---------+
                          |                   |
                       PASS               FAIL (with directives)
                          |                   |
                          v                   v
                       FINALIZE        PROSE SURGEON (loop)
```

---

## Component Boundaries

### 1. Context Assembler (Tiered Memory Manager)

| Attribute | Value |
|-----------|-------|
| **Responsibility** | Build the right context payload for each agent at each stage |
| **Communicates With** | All agents (provides context); Lore-Keeper (reads canonical data) |
| **Model** | None (pure logic layer, TypeScript) |
| **Build Priority** | Phase 1 (foundation) |

**What it does:**

The single biggest architectural change. Instead of dumping 120K tokens into every agent call, the Context Assembler builds **stage-appropriate context bundles**:

| Stage | Context Needed | Token Budget |
|-------|---------------|-------------|
| Chapter Planning | Plot structure, act position, prev 3 summaries, foreshadowing queue | ~30K |
| Scene Drafting | Scene-specific plot beat, active character profiles (2-3), location, style exemplars, prev scene ending | ~40K |
| Assembly | All drafted scenes, chapter plot, transition notes | ~50K |
| Prose Surgery | Target passage (2-5 paragraphs), style guide, specific directive, 2-3 exemplar passages | ~15K |
| Quality Evaluation | Full chapter, plot requirements, character profiles, style rubric | ~60K |

**Why this matters:** Research on LLM creative writing consistently shows that **style exemplars and focused context outperform comprehensive context**. A novelist agent given 3 paragraphs of target prose style + 1 scene's worth of plot beats writes better than one given the entire novel's world-building JSON. The model's "attention budget" for stylistic nuance is finite.

**Memory Tiers (inspired by hybrid memory research):**

```
Tier 1: HOT (always loaded)
  - Style guide core rules (500 tokens)
  - Current chapter plot beat
  - Active character voice cards (compact)

Tier 2: WARM (loaded per-scene)
  - Previous scene ending (500 tokens)
  - Relevant foreshadowing items
  - Location sensory palette
  - Style exemplar passages (2-3)

Tier 3: COLD (loaded on demand)
  - Full character backstories
  - World-building encyclopedia
  - Historical summaries beyond N-3
  - Relationship evolution logs

Tier 4: ARCHIVAL (never loaded into writing prompts)
  - Review history JSON
  - Validation scores
  - State management data
```

**Key Insight from Research:** The "Memory Management and Contextual Consistency" paper (arXiv 2509.25250) demonstrates that a hybrid memory system with intelligent decay outperforms both sliding windows and basic RAG by 13.6% on task completion. Apply this principle: do not load full character JSONs; instead, maintain **compact "voice cards"** (200 tokens each) that capture only what the writer needs: speech patterns, current emotional state, key mannerisms.

---

### 2. Style Library (Exemplar Database)

| Attribute | Value |
|-----------|-------|
| **Responsibility** | Store, index, and retrieve prose exemplars that define the target writing quality |
| **Communicates With** | Context Assembler (provides exemplars); User (curation interface) |
| **Model** | None (data layer) |
| **Build Priority** | Phase 1 (foundation, critical for quality) |

**What it does:**

This is the single most impactful new component. Research from EMNLP 2025 ("Catch Me If You Can?") and IEEE UEMCON 2025 ("How Well Do LLMs Imitate Human Writing Style?") both confirm that **few-shot style examples are the dominant factor in prose quality**, outweighing model choice. The current system has zero style exemplars.

**Structure:**

```
novels/{novel_id}/style/
  exemplars/
    opening-hooks/          # 3-5 exemplar opening paragraphs
    dialogue-scenes/        # 3-5 exemplar dialogue exchanges
    action-sequences/       # 3-5 exemplar action passages
    emotional-peaks/        # 3-5 exemplar emotional moments
    transitions/            # 3-5 exemplar scene transitions
    descriptions/           # 3-5 exemplar sensory passages
  anti-exemplars/
    ai-sounding.md          # Examples of what NOT to write
    cliche-patterns.md      # Overused patterns to avoid
  voice-cards/
    {char_id}-voice.md      # 200-token compact voice reference per character
  style-dna.json            # Quantified style fingerprint
```

**style-dna.json** (quantified style profile):
```json
{
  "avg_sentence_length": 14,
  "sentence_length_variance": "high",
  "dialogue_ratio": 0.55,
  "sensory_density": "2_per_paragraph",
  "filter_word_tolerance": "< 5_per_1000_words",
  "ending_variety_target": "< 60%_same_ending",
  "metaphor_freshness": "avoid_top_50_korean_web_novel_cliches",
  "pov_distance": "close_third",
  "emotional_showing_ratio": 0.8
}
```

**How exemplars are used:**

1. User curates or generates exemplars at project init (from published novels they admire, or from their best-written passages)
2. Context Assembler selects 2-3 exemplars matching the current scene type
3. These are injected into the Scene Drafter prompt as few-shot examples with explicit instruction: "Write in this voice and style"
4. Anti-exemplars are injected into the Prose Surgeon prompt: "Rewrite passages that resemble these patterns"

**Confidence:** HIGH. Multiple independent research papers confirm few-shot exemplars as the primary lever for style quality. This is the highest-ROI change.

---

### 3. Chapter Planner

| Attribute | Value |
|-----------|-------|
| **Responsibility** | Transform a chapter-level plot outline into scene-by-scene writing plans with emotional beats |
| **Communicates With** | Context Assembler (receives plot + summaries); Scene Drafter (outputs scene plans) |
| **Model** | opus (reasoning-heavy task) |
| **Build Priority** | Phase 1 |

**What it does:**

Replaces the current approach where the novelist gets a `chapter_N.json` and writes everything at once. The Chapter Planner produces a **scene-by-scene writing plan** that the Scene Drafter executes one scene at a time.

**Output per scene:**

```json
{
  "scene_number": 1,
  "scene_purpose": "Establish tension between leads after last chapter's revelation",
  "pov_character": "char_001",
  "location": "loc_003",
  "emotional_trajectory": "awkward -> confrontational -> vulnerable",
  "key_beat": "She finally asks about the contract's real terms",
  "sensory_anchors": ["cold coffee", "rain on windows", "his cologne"],
  "dialogue_goal": "Subtext: she's hurt but hiding it",
  "foreshadowing_to_plant": ["fore_007"],
  "target_word_count": 1200,
  "pacing": "slow-build to emotional peak",
  "scene_ending": "She walks out mid-sentence (feeds into scene 2)",
  "style_exemplar_category": "emotional-peaks"
}
```

**Why decompose into scenes?** The Agents' Room paper (ICLR 2025) demonstrates that planning agents that produce intermediate artifacts (via a shared scratchpad) generate stories preferred by expert evaluators. The key insight: **planning and writing are cognitively different tasks**. A model in "planning mode" (structured reasoning) activates different capabilities than one in "writing mode" (creative generation). Forcing both into one prompt degrades both.

---

### 4. Scene Drafter

| Attribute | Value |
|-----------|-------|
| **Responsibility** | Write a single scene of prose from a scene plan + style exemplars |
| **Communicates With** | Context Assembler (receives focused context); Chapter Planner (receives scene plan) |
| **Model** | opus (creative generation) |
| **Build Priority** | Phase 2 |

**What it does:**

This is the **renamed and refocused novelist agent**. The critical difference: it writes ONE scene at a time (800-1500 words), not an entire chapter (5000+ words). This focus allows:

1. **Full attention on craft**: With only one scene to write, the model can focus on sensory detail, dialogue subtext, and rhythm
2. **Style exemplar proximity**: The 2-3 exemplars are close in the context window and directly relevant
3. **Chain-of-thought pre-writing**: Before writing prose, the drafter performs a brief internal planning step

**Prompt Architecture:**

```
SYSTEM: You are a Korean literary fiction writer. Your prose should match
the voice and style of the following exemplars.

[2-3 STYLE EXEMPLARS: ~1500 tokens total]

CONTEXT:
- Previous scene ending: [last 300 words of previous scene]
- Character voice card: [200 tokens]
- Location sensory palette: [100 tokens]

SCENE PLAN: [structured plan from Chapter Planner]

ANTI-PATTERNS TO AVOID:
- [3-5 specific patterns from anti-exemplars]

CHAIN-OF-THOUGHT: Before writing, briefly note:
1. The emotional arc of this scene (opening feeling -> closing feeling)
2. Which senses you will foreground
3. One fresh metaphor or image you plan to use
4. The subtext of the key dialogue exchange

Now write the scene.
```

**Why Chain-of-Thought for creative writing?** Research shows CoT improves complex reasoning tasks. Creative writing IS a reasoning task -- the writer reasons about character motivation, emotional trajectory, and narrative strategy. Explicitly requiring this reasoning step before prose generation produces more intentional, less generic writing. The key: the CoT output is discarded; only the prose is kept. This prevents the "reasoning bleed" where analytical language infects creative output.

---

### 5. Assembly Agent

| Attribute | Value |
|-----------|-------|
| **Responsibility** | Combine individually drafted scenes into a cohesive chapter with smooth transitions |
| **Communicates With** | Scene Drafter (receives scenes); Prose Surgeon (hands off assembled chapter) |
| **Model** | sonnet (editing task, not creative generation) |
| **Build Priority** | Phase 2 |

**What it does:**

A new agent that solves the "seam problem" -- when scenes are drafted independently, transitions between them can feel abrupt. The Assembly Agent:

1. Reads all drafted scenes in sequence
2. Smooths transitions between scenes (adds bridging sentences, not rewrites)
3. Ensures pacing rhythm across the full chapter (fast scene after slow, etc.)
4. Verifies the chapter-end hook is compelling
5. Checks for inadvertent repetition across scenes (same metaphor used twice, etc.)

**Scope constraint:** The Assembly Agent NEVER rewrites scene content. It only adds transition sentences, adjusts paragraph ordering within scene boundaries, and flags issues for the Prose Surgeon.

---

### 6. Prose Surgeon (Replaces Editor + Proofreader)

| Attribute | Value |
|-----------|-------|
| **Responsibility** | Execute specific, passage-level prose improvements based on directives |
| **Communicates With** | Quality Oracle (receives directives); Assembly Agent (receives chapter); Style Library (receives anti-exemplars) |
| **Model** | opus for substantive rewrites, sonnet for mechanical fixes |
| **Build Priority** | Phase 2 |

**What it does:**

This is the architectural replacement for the current editor and proofreader agents. The fundamental design change: instead of "edit this chapter for quality," the Prose Surgeon receives **specific surgical directives**:

```json
{
  "directive_type": "rewrite",
  "location": "paragraphs 8-10",
  "issue": "Emotional climax told rather than shown",
  "current_text": "유나는 배신감을 느꼈다. 분노가 치밀어 올랐다.",
  "instruction": "Replace with physical reactions and sensory details showing betrayal. Reference exemplar passage #3 from emotional-peaks/.",
  "exemplar": "[specific exemplar text]",
  "max_scope": "3 paragraphs"
}
```

**Why this matters:** The Self-Refine paper (Madaan et al.) shows iterative refinement works, but the Cross-Refine extension shows it works BETTER with a separate critic and generator. The current system's failure mode is the editor receiving "score: 72, needs improvement in prose quality" and not knowing what specifically to change. Passage-level directives with exemplar references give the surgeon concrete targets.

**Surgical operation types:**

| Operation | Trigger | Model |
|-----------|---------|-------|
| `show-not-tell` | Emotional telling detected in important scene | opus |
| `filter-word-removal` | Filter word density > 10/1000 words | sonnet |
| `sensory-enrichment` | Scene has < 2 senses represented | opus |
| `rhythm-variation` | > 5 consecutive sentences same length/ending | sonnet |
| `dialogue-subtext` | Dialogue is on-the-nose expository | opus |
| `cliche-replacement` | Known cliche pattern detected | opus |
| `transition-smoothing` | Abrupt scene transition | sonnet |
| `proofreading` | Grammar, spacing, punctuation | haiku |

---

### 7. Quality Oracle (Replaces Critic + Beta-Reader + Genre-Validator)

| Attribute | Value |
|-----------|-------|
| **Responsibility** | Evaluate chapter quality and generate specific surgical directives (not just scores) |
| **Communicates With** | Prose Surgeon (outputs directives); Assembly Agent (receives chapter); Context Assembler (receives reference data) |
| **Model** | opus (evaluation requires deep reasoning) |
| **Build Priority** | Phase 2 |

**What it does:**

Consolidates the three current validators (critic, beta-reader, genre-validator) into a single, more powerful evaluation that produces **actionable directives instead of just scores**. The current multi-validator consensus system has a fundamental problem: three agents give three numbers, and the system checks if they exceed thresholds. This tells you pass/fail but not what to do about failure.

**The Quality Oracle outputs two things:**

1. **Quality Assessment** (for pass/fail gate):

```json
{
  "overall_verdict": "REVISE",
  "dimensions": {
    "prose_craft": { "score": 72, "verdict": "below_target" },
    "narrative_engagement": { "score": 85, "verdict": "good" },
    "character_voice": { "score": 68, "verdict": "below_target" },
    "world_consistency": { "score": 90, "verdict": "excellent" },
    "genre_fulfillment": { "score": 88, "verdict": "good" }
  }
}
```

2. **Surgical Directives** (for Prose Surgeon):

```json
{
  "directives": [
    {
      "priority": 1,
      "type": "show-not-tell",
      "location": "Scene 2, paragraphs 8-10",
      "issue": "Climactic emotional moment uses telling...",
      "instruction": "Rewrite using physical reactions...",
      "exemplar_category": "emotional-peaks"
    },
    {
      "priority": 2,
      "type": "character-voice",
      "location": "Scene 1, dialogue lines 3-7",
      "issue": "Min-jun speaks too formally for established voice...",
      "instruction": "Adjust to match voice card...",
      "voice_card_ref": "char_002"
    }
  ]
}
```

**Why consolidate?** Running three separate validators creates a coordination problem: they might identify the same issue differently, or miss issues that fall between their jurisdictions. A single comprehensive oracle with a well-structured evaluation framework is more reliable and token-efficient. The trade-off is losing the parallel execution benefit, but the quality of feedback improves substantially.

**Optional: Keep parallel validators for write-all loop** where throughput matters, but ensure each validator outputs directives, not just scores.

---

### 8. Lore-Keeper (Retained, Enhanced)

| Attribute | Value |
|-----------|-------|
| **Responsibility** | Maintain canonical data integrity; generate voice cards and sensory palettes |
| **Communicates With** | Context Assembler (provides canonical data and compact representations); all writing agents (indirectly, via Context Assembler) |
| **Model** | sonnet |
| **Build Priority** | Phase 1 (voice card generation is critical path) |

**Enhanced role:** In addition to current consistency checking, the Lore-Keeper now generates and maintains:

- **Character Voice Cards** (200-token compressed voice reference per character)
- **Location Sensory Palettes** (50-100 tokens of sensory anchors per location)
- **Relationship Dynamic Snapshots** (current state of key relationships)

These compact representations are what the Context Assembler loads into writing prompts instead of full JSON profiles.

---

### 9. Plot Architect (Retained)

| Attribute | Value |
|-----------|-------|
| **Responsibility** | Design macro plot structure (acts, arcs, foreshadowing schedule) |
| **Communicates With** | Chapter Planner (provides act/arc context); Lore-Keeper (character arcs) |
| **Model** | opus |
| **Build Priority** | Phase 1 (existing, needs minor updates) |

Retained as-is. The current plot architecture system is well-designed. The only change: ensure chapter-level plot data includes the new fields that the Chapter Planner needs (emotional trajectory, sensory anchors, pacing directives).

---

### 10. Summarizer (Retained, Enhanced)

| Attribute | Value |
|-----------|-------|
| **Responsibility** | Generate chapter summaries for context continuity |
| **Communicates With** | Context Assembler (provides summaries for sliding window) |
| **Model** | haiku (fast) |
| **Build Priority** | Phase 1 (existing, needs output format update) |

**Enhanced output format:** Summaries now include a structured section for the Context Assembler:

```markdown
## Summary
[Narrative summary as before]

## Context Transfer
- **Character States**: Yuna: hurt but hopeful; Min-jun: guarded, secret weighing on him
- **Open Threads**: Contract terms still hidden; Jisu suspects something
- **Emotional Residue**: Chapter ended on vulnerability, next should open with either continuation or contrast
- **Physical State**: Both at Min-jun's apartment; it's late evening
- **Planted Foreshadowing**: fore_007 planted (the locked room)
```

---

## Data Flow

### Writing Pipeline Data Flow

```
User: "Write chapter 5"
  |
  v
[1] Context Assembler loads Tier 1 (hot) context
  |
  v
[2] Chapter Planner receives:
    - Chapter 5 plot (from chapters/chapter_005.json)
    - Previous 3 summaries (with Context Transfer sections)
    - Act position and arc requirements
    - Foreshadowing queue
    Outputs: Scene plans (3-4 scenes)
  |
  v
[3] FOR EACH scene plan:
    |
    [3a] Context Assembler builds scene-specific bundle:
         - Scene plan
         - Matched style exemplars (2-3)
         - Active character voice cards
         - Location sensory palette
         - Previous scene ending
    |
    [3b] Scene Drafter writes one scene (~1200 words)
         Uses CoT pre-writing then prose generation
  |
  v
[4] Assembly Agent receives all drafted scenes
    - Smooths transitions
    - Checks chapter-level pacing
    - Verifies ending hook
    Outputs: Assembled chapter draft
  |
  v
[5] Quality Oracle evaluates assembled chapter
    - Multi-dimension assessment
    - Generates surgical directives (if needed)
    |
    +-- PASS --> [7] Finalize
    |
    +-- FAIL --> [6] Prose Surgeon
  |
  v
[6] Prose Surgeon executes directives:
    - Each directive targets specific passages
    - Exemplars provided for each rewrite
    - Operations are atomic (one passage at a time)
    After all directives applied --> [5] Re-evaluate
    (Max 3 loops, then circuit breaker)
  |
  v
[7] Finalize:
    - Save chapter markdown
    - Generate summary (Summarizer)
    - Update state
    - Update voice cards if character evolved
```

### Context Flow Direction (Critical)

```
                    READS FROM                   WRITES TO
                    ----------                   ---------

Style Library  --[exemplars]--> Context Assembler
Lore-Keeper    --[voice cards, sensory palettes]--> Context Assembler
Plot Architect --[chapter plots]--> Context Assembler
Summarizer     --[summaries]--> Context Assembler

Context Assembler --[stage-appropriate bundles]--> Chapter Planner
Context Assembler --[scene-specific bundles]--> Scene Drafter
Context Assembler --[passage + exemplar]--> Prose Surgeon
Context Assembler --[full chapter + references]--> Quality Oracle

Chapter Planner --[scene plans]--> Scene Drafter
Scene Drafter --[drafted scenes]--> Assembly Agent
Assembly Agent --[assembled chapter]--> Quality Oracle
Quality Oracle --[directives]--> Prose Surgeon
Prose Surgeon --[revised passages]--> Assembly Agent (recompose)
```

**Uni-directional flow** is critical. Writing agents never read validation scores directly. The Quality Oracle's feedback flows through the Prose Surgeon as concrete directives, not abstract numbers.

---

## Patterns to Follow

### Pattern 1: Decomposed Writing (Plan -> Draft Per Scene -> Assemble)

**What:** Never ask an LLM to write an entire chapter in one pass. Decompose into scene-level drafting with assembly.

**When:** All chapter writing.

**Why:** The Agents' Room paper (ICLR 2025) shows that decomposed multi-agent writing with a shared scratchpad produces stories preferred by expert evaluators. Single-pass generation forces the model to juggle too many concerns simultaneously, degrading prose quality.

### Pattern 2: Style Exemplar Injection

**What:** Always include 2-3 passages of target prose style in the writing prompt, close to the generation instruction.

**When:** Every Scene Drafter call; every Prose Surgeon rewrite.

**Why:** Research confirms few-shot style examples are the dominant factor in output quality -- more impactful than model choice. Zero-shot writing accuracy for style imitation is below 7%; one-shot improves drastically.

### Pattern 3: Directive-Driven Revision (Not Score-Driven)

**What:** Quality feedback must be passage-specific directives with exemplar references, not abstract scores.

**When:** Every revision loop.

**Why:** Self-Refine research shows iterative refinement works, but Cross-Refine shows separate critic + generator with specific feedback outperforms self-critique. The current score-based system (85/100) gives the editor no actionable information about what to change or how.

### Pattern 4: Context Minimalism for Writing Agents

**What:** Writing agents receive the minimum context needed for their specific task, not everything available.

**When:** All agent calls.

**Why:** Every token of world-building JSON in the context window is a token not available for the model's "stylistic attention." Research on context window utilization shows models attend less carefully to information that is far from the generation point. Keep style exemplars and scene-specific context close; push encyclopedic data to the Context Assembler layer.

### Pattern 5: Chain-of-Thought Pre-Writing

**What:** Before generating prose, require the writing agent to briefly plan the emotional arc, key sensory details, and dialogue subtext for the scene.

**When:** Every Scene Drafter call.

**Why:** CoT improves reasoning tasks. Creative writing is a reasoning task about character motivation, emotional trajectory, and narrative strategy. The CoT output is discarded (not included in the final chapter) to prevent analytical language from contaminating creative output.

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Score-Only Feedback Loops

**What:** Validators return numeric scores; writer/editor tries to "improve the score."

**Why bad:** The editor has no idea what "improve narrative quality from 72 to 85" means concretely. It makes generic improvements that often make prose more technically correct but less alive. This is exactly the "over-polishing" problem identified in editorial practice: AI-revised text is technically cleaner but weaker than the original.

**Instead:** Quality Oracle produces passage-level surgical directives with exemplar references.

### Anti-Pattern 2: Context Maximalism

**What:** Loading all available context (world JSON, full character profiles, all summaries) into every agent call.

**Why bad:** Dilutes the model's attention to stylistic signals. The 120K token budget is spent on JSON schemas instead of prose style examples. Models attend less carefully to information far from the generation point.

**Instead:** Tiered context with stage-appropriate bundles. Writing agents get compact voice cards (200 tokens) instead of full character JSONs (2000+ tokens).

### Anti-Pattern 3: Same-Model Self-Critique

**What:** Having the same model instance write and then critique its own output in the same context.

**Why bad:** The Nature 2025 paper on dual-loop self-reflection identifies "shallow reasoning" where the model produces polished-looking but substantively hollow critiques of its own work. Models are biased toward finding their own output acceptable.

**Instead:** Use separate agent instances for writing and evaluation. The Quality Oracle never shares a context window with the Scene Drafter.

### Anti-Pattern 4: Monolithic Chapter Writing

**What:** Asking an LLM to write a 5000+ word chapter in a single generation call.

**Why bad:** Quality degrades toward the end of long generations. The model "forgets" style guidance, character voice details, and sensory density targets as it gets further from the prompt. This is the primary cause of the "AI-sounding" problem.

**Instead:** Scene-by-scene drafting (800-1500 words per call) with fresh context injection for each scene.

### Anti-Pattern 5: Generic Agent Prompts Without Exemplars

**What:** System prompts that describe good writing in the abstract ("Use sensory details," "Show don't tell") without showing what this looks like in practice.

**Why bad:** The model "knows" these principles from training but defaults to its own patterns when generating. Abstract instruction produces abstract improvement. Concrete exemplars produce concrete improvement.

**Instead:** Replace 50% of abstract writing guidelines with concrete exemplar passages. "Write like THIS" is stronger than "Write well."

---

## Quality Feedback Loop Architecture

### The Revision Loop (Detailed)

```
Chapter Draft
  |
  v
Quality Oracle evaluates (single pass, all dimensions):
  |
  +-- ALL dimensions pass thresholds --> DONE
  |
  +-- Some dimensions fail:
      |
      v
      Generate prioritized directive list:
        Priority 1: show-not-tell in climax (paragraphs 8-10)
        Priority 2: character voice drift (dialogue lines 3-7)
        Priority 3: filter words in scene 3 (minor)
      |
      v
      Prose Surgeon executes directives in priority order:
        - Each directive: load passage + exemplar + instruction
        - Surgeon rewrites the specific passage
        - Passage reinserted into chapter
      |
      v
      Quality Oracle re-evaluates (focus on previously-failing dimensions):
        |
        +-- PASS --> DONE
        +-- FAIL --> Generate new directives (max 3 total loops)
        +-- Circuit breaker (same issue 3x) --> Escalate to user
```

### Key Design Decisions

1. **Directive Priority Ordering**: Higher-impact issues first. Show-not-tell in a climax is more important than a filter word in a transition.

2. **Focused Re-evaluation**: After revision, the Oracle only re-checks dimensions that failed, not the entire chapter. This prevents the "whack-a-mole" problem where fixing one thing breaks another.

3. **Passage-Scoped Rewrites**: The Surgeon never rewrites more than 3 paragraphs at once. Larger scope rewrites risk losing voice consistency.

4. **Exemplar-Backed Directives**: Every rewrite directive includes a concrete style exemplar showing what the revised passage should feel like.

5. **Circuit Breaker Enhancement**: Current system triggers on repeated failure. Enhanced system also triggers when the Oracle detects quality regression (revision made things worse). This addresses the Self-Refine finding of diminishing returns.

---

## Reference Material Integration

### How Style Exemplars Flow Through the System

```
Project Init (/init or /design-style)
  |
  v
User provides reference novels/passages
OR system generates exemplars from user's best writing
  |
  v
Style Library stores categorized exemplars:
  novels/{id}/style/exemplars/{category}/
  |
  v
Per scene draft:
  Context Assembler matches scene type -> exemplar category
  Loads 2-3 matching exemplars (~500 tokens each)
  |
  v
Scene Drafter prompt includes exemplars as few-shot examples
  "Write in this voice and style: [exemplar 1] [exemplar 2]"
  |
  v
Per revision directive:
  Prose Surgeon receives directive + relevant exemplar
  "Rewrite this passage to feel like: [exemplar]"
```

### Exemplar Categories (Recommended)

| Category | When Used | Description |
|----------|-----------|-------------|
| `opening-hooks` | Chapter opening, first scene | Strong first paragraphs that grab readers |
| `dialogue-scenes` | Scenes heavy on dialogue | Natural dialogue with subtext |
| `action-sequences` | Fight scenes, chases, urgency | Fast-paced, short-sentence prose |
| `emotional-peaks` | Confession, betrayal, revelation | High-emotion scenes with showing |
| `transitions` | Between scenes, time jumps | Smooth bridging passages |
| `descriptions` | World-building, location intro | Sensory-rich environmental writing |
| `internal-monologue` | Character reflection, decision | Interior voice with personality |
| `humor` | Comic relief scenes | Natural Korean humor style |

---

## Prompt Architecture

### System Prompt Design Principles

1. **Role + Exemplars > Role + Rules**: Replace abstract rules with concrete examples wherever possible.

2. **Layered Prompts**: Combine role instruction, few-shot exemplars, and chain-of-thought scaffolding in a single prompt.

3. **Negative Examples**: Include anti-exemplars ("Do NOT write like this") alongside positive ones. Research shows negative examples are highly effective at suppressing LLM default patterns.

4. **Korean Language Specific**: All system prompts in Korean. Writing agent prompts especially should be entirely in Korean to keep the model in "Korean creative mode" rather than "English-instruction-following mode."

5. **Temperature Calibration**:
   - Chapter Planner: 0.3 (structured, logical)
   - Scene Drafter: 0.7-0.85 (creative, varied)
   - Assembly Agent: 0.3 (conservative editing)
   - Prose Surgeon: 0.5-0.7 (creative but constrained)
   - Quality Oracle: 0.2 (analytical, consistent)

### Example: Scene Drafter System Prompt Structure

```
[SECTION 1: Identity - 100 tokens]
당신은 한국 문학 소설가입니다. 감각적이고 몰입감 있는 산문을 씁니다.

[SECTION 2: Style Exemplars - 1500 tokens]
## 목표 문체
다음 예시들의 문체와 음질을 따라 쓰세요:

### 예시 1: 감정 장면
[exemplar passage]

### 예시 2: 대화 장면
[exemplar passage]

[SECTION 3: Anti-Patterns - 300 tokens]
## 절대 피할 패턴
- "느꼈다", "보였다", "생각했다" 같은 필터 워드 사용 금지
- "갑자기", "문득" 남발 금지
- [anti-exemplar passage with annotation]

[SECTION 4: Scene Plan - 500 tokens]
## 이번 장면 계획
[structured scene plan from Chapter Planner]

[SECTION 5: Context - 1000 tokens]
## 컨텍스트
- 직전 장면 마지막: [ending text]
- 캐릭터 보이스: [voice card]
- 장소 감각: [sensory palette]

[SECTION 6: Pre-Writing CoT - instruction only, 100 tokens]
## 사전 구상 (출력에 포함하지 마세요)
쓰기 전에 짧게 메모하세요:
1. 이 장면의 감정 곡선 (시작 감정 -> 끝 감정)
2. 전면에 부각할 감각 (시각/청각/촉각/후각/미각)
3. 사용할 신선한 은유나 이미지 하나
4. 핵심 대화의 이면(서브텍스트)

## 본문 작성
```

---

## Suggested Build Order

### Phase 1: Foundation (Must Build First)

| Component | Dependency | Rationale |
|-----------|-----------|-----------|
| **Style Library** (data structure + curation UI) | None | Highest-impact change; exemplars needed by all writing agents |
| **Context Assembler** (tiered memory manager) | Style Library | All agents depend on it; current context loading is the bottleneck |
| **Lore-Keeper Enhancement** (voice cards, sensory palettes) | None | Generates compact representations needed by Context Assembler |
| **Summarizer Enhancement** (Context Transfer format) | None | Improved summaries needed for better inter-chapter continuity |

**Phase 1 Deliverable:** Existing agents with better context. Even before the new pipeline, injecting style exemplars and voice cards into the current novelist agent will measurably improve prose quality.

### Phase 2: New Pipeline

| Component | Dependency | Rationale |
|-----------|-----------|-----------|
| **Chapter Planner** | Context Assembler | Decomposes chapter into scene plans |
| **Scene Drafter** (refactored novelist) | Chapter Planner, Style Library, Context Assembler | Scene-by-scene writing with exemplars |
| **Assembly Agent** | Scene Drafter | Combines scenes into chapters |
| **Prose Surgeon** (replaces editor + proofreader) | Style Library | Directive-driven revision |
| **Quality Oracle** (replaces critic + beta-reader + genre-validator) | Prose Surgeon | Produces directives, not just scores |

**Phase 2 Deliverable:** Complete new writing pipeline. Old agents deprecated.

### Phase 3: Optimization

| Component | Dependency | Rationale |
|-----------|-----------|-----------|
| **Write-All Loop Integration** | Phase 2 complete | Ralph loop uses new pipeline |
| **Parallel Scene Drafting** | Scene Drafter stable | Draft independent scenes in parallel for speed |
| **Adaptive Quality Thresholds** | Quality Oracle stable | Adjust thresholds based on chapter position (climax vs. transition) |
| **Exemplar Auto-Generation** | Style Library, Quality Oracle | Generate new exemplars from highest-scoring passages |
| **Cross-Chapter Voice Drift Detection** | Lore-Keeper, Summarizer | Detect when character voice changes unintentionally over many chapters |

**Phase 3 Deliverable:** Optimized system with self-improving exemplar library.

---

## Migration Strategy

### Backward Compatibility

The Phase 1 changes (Style Library, Context Assembler, enhanced Lore-Keeper and Summarizer) can be integrated into the existing pipeline without breaking changes. The current agents continue to work but receive better context.

Phase 2 introduces new agents that replace old ones. The transition can be gradual:

1. Deploy Chapter Planner alongside existing system
2. Deploy Scene Drafter, A/B test against current novelist
3. Deploy Quality Oracle with directive output alongside existing validators
4. Once quality confirmed, deprecate old agents
5. Remove old agents after one full novel cycle

### Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Scene-by-scene drafting produces inconsistent voice across scenes | Assembly Agent specifically checks for voice consistency; voice cards enforce baseline |
| Style exemplars cause the model to over-imitate specific passages | Use 2-3 diverse exemplars per call; rotate exemplars across chapters |
| Quality Oracle consolidation loses multi-perspective benefit | Keep parallel validators as optional in write-all loop; default to single oracle for interactive writing |
| CoT pre-writing leaks analytical language into prose | CoT output explicitly discarded; clear prompt boundary between planning and writing sections |
| Increased agent calls increase latency and cost | Parallel scene drafting (Phase 3); scene-level caching; smaller context per call offsets cost |

---

## Sources

### Academic Papers (HIGH confidence)
- [Agents' Room: Narrative Generation through Multi-step Collaboration (ICLR 2025)](https://openreview.net/pdf?id=HfWcFs7XLR) - Multi-agent decomposed writing with planning and writing agents
- [Multi-Agent Based Character Simulation for Story Writing (ACL 2025)](https://aclanthology.org/2025.in2writing-1.9.pdf) - Director/character agent role-play approach
- [Creativity in LLM-based Multi-Agent Systems: A Survey (EMNLP 2025)](https://arxiv.org/pdf/2505.21116) - Survey of multi-agent creative collaboration
- [Self-Refine: Iterative Refinement with Self-Feedback](https://arxiv.org/abs/2303.17651) - Foundational work on LLM self-improvement loops
- [CRITIC: LLMs Can Self-Correct with Tool-Interactive Critiquing](https://arxiv.org/abs/2305.11738) - External feedback for LLM self-correction
- [LLMs Still Struggle to Imitate Implicit Writing Styles (EMNLP 2025)](https://arxiv.org/html/2509.14543v1) - Few-shot style examples as dominant factor
- [How Well Do LLMs Imitate Human Writing Style? (IEEE UEMCON 2025)](https://arxiv.org/pdf/2509.24930) - Prompting strategy > model choice for style
- [Memory Management and Contextual Consistency (arXiv 2025)](https://arxiv.org/abs/2509.25250) - Hybrid memory outperforms sliding windows and RAG

### Industry & Practice (MEDIUM confidence)
- [Best LLMs for Writing in 2025 (Intellectual Lead)](https://intellectualead.com/best-llm-writing/) - Model comparison for creative writing
- [How to Use AI Editors in 2025 (Skywork)](https://skywork.ai/blog/how-to-ai-editor-writing-guide-2025/) - Plan-verify-revise-polish workflow
- [Prompt Engineering Techniques 2026 (K2view)](https://www.k2view.com/blog/prompt-engineering-techniques/) - Layered prompting for complex tasks
- [Reflective Loop Pattern (Medium)](https://medium.com/@vpatil_80538/reflective-loop-pattern-the-llm-powered-self-improving-ai-architecture-7b41b7eacf69) - Three-agent reflective architecture

### Codebase Analysis (HIGH confidence)
- Existing Novel-Dev v4.0 agents, commands, skills, and pipeline definitions
- Current context loading system (120K token budget)
- Current multi-validator consensus mechanism
- Current revision pipeline (critic -> editor -> proofreader)
