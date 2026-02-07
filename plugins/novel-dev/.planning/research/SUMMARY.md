# Project Research Summary

**Project:** Novel-Dev v5.0 — Korean Genre Fiction Quality Revolution
**Domain:** AI-assisted creative writing (Korean web novels)
**Researched:** 2026-02-05
**Confidence:** MEDIUM-HIGH

## Executive Summary

Novel-Dev v5.0 aims to solve the "AI체" problem — the distinctive artificial quality Korean readers instantly detect in AI-generated prose. Research reveals the core issue is structural, not just prompt engineering: the current 14-agent pipeline creates committee-written prose where each revision pass makes text more "correct" but less alive. Multi-agent coordination taxes (41-86% failure rates in NeurIPS 2025 data) compound through cascading errors as each agent's "improvements" overwrite the previous agent's voice.

The solution is counterintuitive: simplify the architecture while deepening the style guidance. Research consistently shows few-shot exemplar prompting outperforms all other techniques for prose quality — more impactful than model choice or evaluation sophistication. The recommended v5.0 approach is decomposed scene-by-scene writing (not monolithic chapters) with style exemplars sandwiching each generation, followed by targeted surgical revision (not iterative polishing). Korean-specific naturalization rules must be embedded at generation time, not patched afterward.

Key risks center on three areas: (1) honorific system collapse destroys Korean authenticity, (2) numeric evaluation theater creates false confidence while measuring the wrong qualities, (3) context window voice drift makes later chapters sound progressively generic. Mitigation requires Korean-native speech matrices, comparative (not rubric-based) evaluation, and voice anchors placed at both ends of the context window to overcome LLMs' "lost in the middle" attention patterns.

## Key Findings

### Recommended Stack

**Confidence: MEDIUM** — Model landscape shifts rapidly; Korean-specific benchmarks are sparse.

The stack is fundamentally about **model routing** and **prompt architecture**, not framework dependencies. Novel-Dev is a Claude Code plugin with no external runtime, so the "stack" is API selection + prompt design patterns.

**Core technologies:**
- **Claude Opus 4.5**: Main novelist agent — rated highest for "soul" in creative writing, excellent Korean quality (use temperature 0.7-0.8 for prose generation)
- **Claude Sonnet 4.5**: Evaluation/editing agents — best off-the-shelf judge (73% human agreement per LitBench), good Korean quality at lower cost (temperature 0.3 for evaluation, 0.5 for editing)
- **Claude Haiku**: Proofreading/summaries — adequate for mechanical tasks, fast and cheap (temperature 0.2)
- **Grok 4.1**: NSFW content ONLY — Korean quality is poor (requires Claude post-processing), keep as fallback not primary option
- **Style exemplar injection**: Research from EMNLP 2025 confirms few-shot examples are the dominant factor in output quality — 2-3 target prose samples per generation call outweigh model choice
- **Banned expression lists**: Korean-specific AI-che detection rules (filter words, stock phrases, translation patterns) embedded at generation time

**Architecture patterns (from academic research):**
- **Agents' Room architecture (ICLR 2025)**: Planning agents produce structure, writing agents produce prose — strict separation prevents quality degradation
- **Character simulation approach (ACL 2025)**: Characters improvise dialogue as role-play, then prose agent rewrites — produces more natural dialogue than cold generation
- **Directive-driven revision**: Quality Oracle produces passage-level surgical directives with exemplar references, not abstract scores

**Critical finding on Grok**: Despite top EQ-Bench rankings, Grok processes Korean through internal translation layer producing syllable-level errors and "very poor" literacy quality per Korean users. Use ONLY for adult/NSFW content where Claude policy blocks; always post-process with Claude for Korean quality fixes.

### Expected Features

**Confidence: MEDIUM-HIGH** — Synthesized from domain expertise, web research, and existing codebase analysis.

Research reveals the feature landscape has three tiers: Table Stakes (without which output sounds unmistakably AI), Differentiators (professional-grade quality), and Anti-Features (commonly attempted but actively harmful).

**Must have (table stakes):**
- **AI-che elimination engine** — Negative constraint system prohibiting translation patterns (번역체), synonym cycling, exposed subtext, formal register in narration, and stock AI phrases. Korean readers detect these instantly.
- **Filter word elimination** — Transform "느꼈다/보였다/생각했다" into direct sensory showing. AI overuses these 3-5x vs. human writers, creating reader distance.
- **Sentence rhythm system** — Enforce ending variety (no more than 5 consecutive ~다 endings), length variation (long-short-medium pattern), paragraph length mixing. Monotonous rhythm is a Korean AI tell.
- **Sensory grounding mandate** — Every scene 500+ chars must engage 2+ senses beyond sight. Korean's rich onomatopoeia/mimetic vocabulary (의성어/의태어) must be naturally integrated, not decorative.
- **Character voice fingerprinting** — Per-character speech profiles defining vocabulary level, sentence structure, speech habits, discourse style, honorific patterns, and internal monologue tone. Dialogue homogenization kills characterization.
- **Natural scene transitions** — Causal linking, sensory bridges, word echoes instead of explicit time/place markers ("한편, 그 시각..."). Abrupt transitions signal AI writing.

**Should have (competitive differentiators):**
- **Multi-stage revision pipeline** — 4-stage decomposition (raw draft → voice/tone pass → prose polish → proofreading) with distinct evaluation criteria per stage. Research shows 40%+ quality improvement vs. single-pass.
- **Reference style learning** — Extract quantifiable patterns from user-provided reference texts (sentence length distribution, dialogue ratio, sensory density, vocabulary complexity) as generation targets. Moves beyond generic "romance tone" to specific author emulation.
- **Emotional subtext engine** — Enforce gap between surface action and underlying emotion through subtext annotations in chapter plans. Professional fiction operates on two levels; AI collapses them into one.
- **Korean prose texture library** — Curated techniques catalog including 여백의 미 (beauty of empty space), 반복과 변주 (repetition and variation), 한/정 emotional vocabulary, 체언종결 (noun-endings), seasonal sensibility.
- **Adaptive quality gates** — Tiered thresholds (Draft 60, Serial 75, Premium 85, Literary 92) activating different pipeline strictness and revision loops. Fixed 70-point threshold doesn't distinguish speed vs. prize-worthy.
- **Dynamic pacing controller** — Scene-level pacing modes (breakneck, fast, normal, reflective, lingering) modulating sentence style, description density, dialogue ratio, and word budget. AI maintains flat pacing across all scenes.

**Defer (v2+ or never):**
- All Anti-Features from research: "AI humanizer" post-processor, synonym replacement enrichment, adjective/adverb injection, global style rewrite, emotion label injection, "literary device sprinkler." These approaches make writing objectively worse by amplifying AI tells.

### Architecture Approach

**Confidence: MEDIUM-HIGH** — Based on ICLR 2025, ACL 2025, EMNLP 2025 papers plus codebase analysis.

The fundamental architectural shift is from **pipeline** (write → evaluate → fix) to **composition** (plan → draft scene-by-scene → assemble → surgical revision). Current v4.0 forces the novelist agent to write 5000+ word chapters in one pass while juggling plot, character voice, sensory detail, rhythm, and foreshadowing simultaneously — degrading all dimensions. Research shows decomposed writing with shared memory produces stories preferred by expert evaluators.

**Major components:**

1. **Context Assembler (Tiered Memory Manager)** — NEW, critical foundation. Replaces current 120K token context dumping with stage-appropriate bundles. Writing agents get compact voice cards (200 tokens) + 2-3 style exemplars (1500 tokens) + scene plan (500 tokens) instead of full character JSONs (2000+ tokens) + world encyclopedia. Research shows style exemplars need proximity to generation point; encyclopedic data crowds out stylistic attention.

2. **Style Library (Exemplar Database)** — NEW, highest-impact change. Stores categorized prose exemplars (opening-hooks, dialogue-scenes, action-sequences, emotional-peaks, transitions, descriptions) plus anti-exemplars (what NOT to write) and quantified style-DNA. Few-shot examples are the dominant factor in prose quality per multiple 2025 papers — outweigh model choice.

3. **Chapter Planner** — Transforms chapter outline into scene-by-scene writing plans with emotional trajectories, sensory anchors, dialogue goals, pacing directives. Planning and writing are cognitively different tasks; forcing both into one prompt degrades both.

4. **Scene Drafter** — Refactored novelist agent writes ONE scene at a time (800-1500 words) with fresh exemplar injection per scene. Uses chain-of-thought pre-writing (emotional arc, key senses, fresh metaphor, dialogue subtext) then generates prose. CoT output discarded to prevent analytical language contamination.

5. **Assembly Agent** — NEW. Combines drafted scenes with smooth transitions, checks chapter-level pacing rhythm, verifies ending hook. Never rewrites scene content, only adds bridging sentences.

6. **Quality Oracle** — Consolidates current 3-validator consensus (critic, beta-reader, genre-validator) into single comprehensive evaluator producing passage-level surgical directives with exemplar references, not just scores. Score-only feedback (85/100) gives editors no actionable information.

7. **Prose Surgeon** — Replaces editor + proofreader with directive-driven revision. Executes specific operations (show-not-tell, filter-word-removal, sensory-enrichment, rhythm-variation) on 2-5 paragraph passages using exemplar-backed instructions. Never rewrites more than 3 paragraphs at once to preserve voice consistency.

8. **Lore-Keeper (Enhanced)** — Generates and maintains compact representations: character voice cards (200 tokens), location sensory palettes (50-100 tokens), relationship dynamic snapshots. These feed Context Assembler instead of full JSON profiles.

**Key patterns to follow:**
- **Decomposed writing**: Scene-by-scene drafting with assembly, never monolithic chapters
- **Style exemplar injection**: 2-3 target prose samples in every writing call, sandwiching the content
- **Directive-driven revision**: Passage-specific surgical fixes with exemplar references, not score-driven iteration
- **Context minimalism**: Writing agents get minimum needed for task, not everything available
- **Chain-of-thought pre-writing**: Brief planning before prose generation (CoT output discarded)

**Key anti-patterns to avoid:**
- Score-only feedback loops (produces technically correct but lifeless prose)
- Context maximalism (dilutes attention to stylistic signals)
- Same-model self-critique (shallow reasoning, self-preference bias)
- Monolithic chapter writing (quality degrades toward end of long generations)
- Generic prompts without exemplars (produces generic improvement)

### Critical Pitfalls

Research identified 13 pitfalls across severity tiers. Top 5 with highest impact:

1. **Multi-Agent Coordination Tax** — Adding more agents creates committee-written prose through cascading errors and voice fragmentation. UC Berkeley/DeepMind research shows 5% per-agent error compounds to 86% system error. Each revision pass makes text more "correct" but less alive as agents' improvements overwrite each other. **Prevention:** Reduce pipeline to writer → single evaluator → targeted fix. Never more than 1 revision pass.

2. **"Tell Don't Show" Trap** — LLMs statistically default to exposition ("She felt angry") over dramatization ("Her hands curled into fists"). This is fundamental to how language models generate text: they produce most probable next token, which for emotions is the label rather than the showing. Generic "show don't tell" instructions produce formulaic showing. **Prevention:** Provide concrete dramatization examples per emotion type in style guide; use anti-exemplars showing bad vs. good versions; require pre-writing sensory budget.

3. **Numeric Score Evaluation Theater** — Current 3-validator consensus (critic >= 85, beta-reader >= 80, genre-validator >= 95) creates false confidence while measuring wrong qualities. LLM judges favor length, formal correctness, surface genre compliance — cannot assess what makes prose feel alive vs. artificial. Research shows positional bias and stylistic preference over substance. **Prevention:** Replace numeric thresholds with comparative evaluation ("better than reference chapter?"); add dedicated "AI-detection" check identifying specific passages; validate automated scores against human preference rankings.

4. **Context Window Voice Drift** — AI loses established voice deeper into chapters and across chapters. Research shows LLMs effectively utilize only 10-20% of context window, with sharp degradation in middle 70-80% ("lost in the middle"). Current 120K token loading means style guide influence attenuates by mid-chapter as model's default AI-generic voice reasserts. **Prevention:** Place style exemplars at BOTH beginning AND end of context, sandwiching content; reduce total context to 60K well-curated vs. 120K everything; include voice anchors (3-5 short exemplary paragraphs) immediately before writing instruction.

5. **Korean Honorific System Collapse** — Korean's complex honorific system (존댓말/반말/높임말/하오체/하게체/해요체/해체) is difficult for LLMs to maintain consistently. Characters randomly shift speech registers mid-dialogue, breaking reader immersion. LLMs treat honorifics as vocabulary choices rather than relational markers. **Prevention:** Include explicit speech level matrix in character profiles (Character A speaks to Character B in [해체], to Character C in [존댓말]); place matrix in immediate context before dialogue-heavy scenes; add post-generation honorific consistency validation.

**Phase-specific warnings:**
- **Architecture Phase:** Multi-agent tax (#1), revision death spiral (iterative polishing degrading voice)
- **Prompt Architecture Phase:** Tell-don't-show (#2), cliche induction (generic creative writing instructions), voice drift (#4), temperature misuse (same setting for all scenes)
- **Evaluation Phase:** Score theater (#3), foreshadowing as checklist item (mechanical planting)
- **Character System Phase:** Dialogue homogenization (#9), honorific collapse (#5)

## Implications for Roadmap

Based on combined research, the logical phase structure follows a **foundation → pipeline → optimization** progression. The current v4.0 architecture must be restructured before prompt improvements yield benefits.

### Phase 1: Foundation (Must Build First)

**Rationale:** Style exemplars and context management are highest-impact changes per research. Even before new pipeline, injecting exemplars into current novelist agent will measurably improve prose quality. These components have no dependencies and enable all subsequent work.

**Delivers:**
- Style Library (data structure + exemplar storage + categorization)
- Context Assembler (tiered memory manager with stage-appropriate bundles)
- Lore-Keeper voice card generation (compact 200-token character speech profiles)
- Enhanced summarizer (Context Transfer format for inter-chapter continuity)

**Addresses table stakes features:**
- Groundwork for AI-che elimination (style exemplars provide positive targets)
- Foundation for character voice fingerprinting (voice cards)
- Enables sensory grounding (sensory palettes per location)

**Avoids pitfalls:**
- Context window voice drift (exemplar sandwiching + reduced token load)
- Generic prompt cliche induction (concrete exemplars replace abstract instructions)

**Research flags:** Standard architectural patterns, well-documented in academic papers. Skip phase-level research.

---

### Phase 2: Core Pipeline Reconstruction

**Rationale:** Cannot improve quality with current monolithic write-evaluate-patch pipeline. Research shows decomposed scene-by-scene writing outperforms single-pass by 40%+. This phase implements the composition model validated by ICLR 2025 Agents' Room architecture.

**Delivers:**
- Chapter Planner (scene-by-scene writing plans with emotional trajectories)
- Scene Drafter (refactored novelist agent, one scene per call with exemplar injection)
- Assembly Agent (scene combination with transition smoothing)
- Quality Oracle (consolidated evaluator producing surgical directives)
- Prose Surgeon (directive-driven revision with passage-level fixes)

**Addresses table stakes features:**
- AI-che elimination engine (embedded in Scene Drafter prompts)
- Filter word elimination (Prose Surgeon operation type)
- Sentence rhythm system (analyzer metrics + Prose Surgeon fixes)
- Natural scene transitions (Assembly Agent responsibility)

**Avoids pitfalls:**
- Multi-agent coordination tax (simplified to writer → single evaluator → targeted fix)
- Tell-don't-show trap (example-driven prompts in Scene Drafter)
- Score evaluation theater (Quality Oracle produces directives, not just numbers)
- Monolithic chapter writing (scene-by-scene decomposition)

**Research flags:** Needs deeper research on directive-passing format between Quality Oracle and Prose Surgeon. JSON schema design for surgical operations is non-trivial.

---

### Phase 3: Korean Language Specialization

**Rationale:** Korean-specific naturalization must be generation-time, not post-processing. This phase embeds linguistic rules that make or break authenticity for native readers.

**Delivers:**
- Korean AI-che banned expression lists (embedded in all writing prompts)
- Honorific speech matrices (per-character relationship specifications)
- Onomatopoeia/mimetic word curated libraries (genre-indexed)
- Korean prose texture library (여백의 미, 반복과 변주, 한/정, 체언종결 techniques)
- Post-generation honorific consistency validator

**Addresses table stakes features:**
- Character voice fingerprinting (completed with honorific profiles)
- Sensory grounding mandate (onomatopoeia integration requirements)

**Addresses differentiators:**
- Korean prose texture library (competitive edge feature)

**Avoids pitfalls:**
- Korean honorific collapse (explicit speech matrices + validation)
- Unnatural onomatopoeia usage (curated whitelist + variety enforcement)
- Korean sentence ending monotony (distribution targets in style guide)
- Western prose patterns in Korean text (naturalness checklist)

**Research flags:** Needs validation with native Korean readers during development. Curated expression lists require ongoing refinement based on output analysis.

---

### Phase 4: Advanced Quality Features

**Rationale:** With foundation and pipeline stable, add features that separate "good" from "great." These are polish features requiring the core system to function first.

**Delivers:**
- Multi-stage revision pipeline (4-stage: raw → voice → polish → proof)
- Reference style learning system (extract patterns from user-provided text)
- Emotional subtext engine (subtext annotations in chapter plans)
- Adaptive quality gates (tiered thresholds: Draft/Serial/Premium/Literary)
- Dynamic pacing controller (scene-level pacing modes)

**Addresses differentiators:**
- All five competitive edge features from research

**Avoids pitfalls:**
- Revision death spiral (revision budget: max 15% text change per pass)
- Prompt cliche induction (reference style provides project-specific patterns)
- Temperature misuse (scene-type-aware temperature profiles)

**Research flags:** Reference style learning pattern extraction needs research into statistical text analysis methods. May require external NLP libraries.

---

### Phase 5: Optimization & Self-Improvement

**Rationale:** System works end-to-end; now optimize for speed, cost, and self-improvement.

**Delivers:**
- Parallel scene drafting (independent scenes generated concurrently)
- Scene-level caching (reusable context bundles)
- Exemplar auto-generation (highest-scoring passages become new exemplars)
- Cross-chapter voice drift detection (statistical fingerprint tracking)
- Write-all loop integration (ralph loop uses new pipeline)

**Avoids pitfalls:**
- Context window voice drift (cross-chapter tracking catches regression)

**Research flags:** Parallel scene drafting coordination logic needs careful design to avoid introducing new coordination bugs. A/B testing framework required.

---

### Phase Ordering Rationale

**Dependency chain:**
```
Phase 1 (Foundation) → Phase 2 (Pipeline) → Phase 3 (Korean) → Phase 4 (Advanced) → Phase 5 (Optimize)
```

- **Phase 1 before 2**: Context management must exist before new agents can consume it
- **Phase 2 before 3**: Korean rules embed into Scene Drafter, which must exist first
- **Phase 3 before 4**: Multi-stage revision needs Korean validators to be effective
- **Phase 4 before 5**: Cannot optimize a pipeline that doesn't exist yet

**Grouping rationale:**
- Phase 1 groups "infrastructure" — changes to how agents receive context
- Phase 2 groups "execution flow" — changes to agent interaction topology
- Phase 3 groups "language quality" — Korean-specific naturalization
- Phase 4 groups "feature completeness" — differentiators that need base system
- Phase 5 groups "performance" — optimization of working system

**Pitfall avoidance:**
- Phases 1-2 directly address the top 3 critical pitfalls (coordination tax, tell-don't-show, score theater)
- Phase 3 addresses Korean-specific pitfalls before they accumulate
- Phase 4-5 avoid premature optimization (build it right before making it fast)

### Research Flags

**Needs deeper research during planning:**

- **Phase 2: Directive Schema Design** — The Quality Oracle → Prose Surgeon directive passing format is novel architecture. May need iteration on JSON schema. Consider: how to specify passage locations, how to attach exemplars, how to prioritize multiple directives.

- **Phase 3: Korean Linguistic Validation** — Banned expression lists and honorific matrices need native Korean writer review. Academic research on Korean AI writing is sparse; must supplement with practitioner validation.

- **Phase 4: Statistical Style Analysis** — Reference style learning requires extracting quantifiable patterns (sentence length distribution, ending pattern ratios, vocabulary complexity). May need external text analysis libraries or custom algorithms.

- **Phase 5: Parallel Coordination Logic** — Parallel scene drafting must handle shared state (character states evolving across scenes, foreshadowing plant tracking). Needs careful concurrency design.

**Standard patterns (skip phase research):**

- **Phase 1: Memory Management** — Tiered caching and context assembly are well-documented patterns. Apply standard techniques.

- **Phase 2: Agent Decomposition** — Agents' Room architecture (ICLR 2025) provides validated blueprint. Follow academic implementation.

- **Phase 3: Post-Generation Validation** — Rule-based consistency checking is straightforward. Grep patterns for honorific violations.

- **Phase 4: Pipeline Stages** — Multi-stage revision is standard editorial practice. Map to agent sequence.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM | Model landscape shifts rapidly; Claude Opus 4.5 and Sonnet 4.5 are current best for Korean creative writing per benchmarks, but GPT-5 series and open-source alternatives (DeepSeek V3.1, Qwen3-235B) are competitive. Grok's Korean weakness is well-documented. Few-shot exemplar prompting effectiveness is HIGH confidence (multiple independent 2025 papers confirm). |
| Features | MEDIUM-HIGH | Table stakes features are validated through Korean web novel community sources and AI writing research. Differentiators are extrapolated from academic papers (Agents' Room, character simulation) and editorial best practices. Anti-features are strongly supported by research on what makes AI prose generic. Korean-specific techniques have MEDIUM confidence (community sources, not peer-reviewed). |
| Architecture | HIGH | Decomposed multi-agent writing architecture validated by ICLR 2025 (Agents' Room), ACL 2025 (character simulation), EMNLP 2025 (creativity survey). Context management patterns validated by arXiv 2025 hybrid memory research (13.6% task completion improvement). Directive-driven revision validated by Self-Refine and CRITIC papers. Anti-patterns validated by UC Berkeley/DeepMind multi-agent failure research (NeurIPS 2025). |
| Pitfalls | MEDIUM-HIGH | Multi-agent coordination tax is HIGH confidence (NeurIPS 2025 data: 41-86% failure rates). Tell-don't-show trap is HIGH confidence (fundamental LLM behavior). Score evaluation theater is HIGH confidence (Nature 2025, LitBench, WritingBench papers). Context window voice drift is HIGH confidence ("lost in the middle" well-documented). Korean-specific pitfalls are MEDIUM confidence (community reports, limited academic coverage). |

**Overall confidence:** MEDIUM-HIGH

The architectural recommendations (decomposed writing, exemplar injection, directive-driven revision) are strongly supported by 2025-2026 academic research. The Korean language-specific techniques have less academic backing but strong community consensus. The primary uncertainty is whether the proposed architecture will perform as expected in practice — the research validates individual patterns, but their integration is Novel-Dev-specific.

### Gaps to Address

**During Phase 1-2 Planning:**
- **Exemplar curation workflow**: Research doesn't specify how users will provide/generate style exemplars. Need UX design for exemplar selection from existing novels or auto-generation from user's best passages.
- **Context Assembler token budgets**: The suggested budgets (30K planning, 40K scene drafting, 15K revision) need validation against actual Claude Code plugin memory limits and performance testing.

**During Phase 3 Planning:**
- **Korean banned expression completeness**: The lists in STACK.md are starting points, not exhaustive. Need mechanism for continuous refinement based on output analysis and user feedback.
- **Honorific matrix complexity**: Real Korean relationships have contextual speech level shifts (formal in public, casual in private). Simple character-to-character mappings may be insufficient. May need scene-level overrides.

**During Phase 4 Planning:**
- **Reference style learning accuracy**: Research confirms few-shot examples work, but extracting the RIGHT patterns from reference text is non-trivial. May need multiple iterations to identify which quantified metrics actually transfer.
- **Subtext annotation cognitive load**: Requiring users to annotate every scene with hidden emotions adds planning overhead. Need balance between annotation detail and user burden.

**Cross-Cutting Uncertainties:**
- **Model API stability**: Claude Opus 4.5 and Sonnet 4.5 availability, pricing, and rate limits may change. Roadmap should design for model abstraction (easy to swap alternatives).
- **Korean native validation**: Most research is English-centric. Each phase needs validation with Korean readers to ensure naturalness. Consider recruiting beta testers early.
- **Cost explosion risk**: Scene-by-scene drafting increases API calls. Phase 1-2 should include cost projections and optimization strategies (caching, model routing, parallel execution).

## Sources

### Stack Research (STACK.md)
**High confidence sources:**
- ICLR 2025: Agents' Room (multi-agent narrative generation architecture)
- ACL 2025: Multi-Agent Character Simulation (role-play then rewrite approach)
- EMNLP 2025: Creativity in LLM Multi-Agent Systems (survey)
- LitBench 2025: Reliable Evaluation of Creative Writing (Claude Sonnet as judge)
- EQ-Bench Creative Writing Leaderboard (model comparisons, slop scores)
- Lech Mazur's Writing Benchmark (8-dimension rubric)

**Medium confidence sources:**
- DC Inside AI Writer Gallery (Korean community prompt techniques, AI-che patterns)
- NamuWiki Grok assessment (Korean quality issues, community consensus)
- God of Prompt Grok vs Claude comparison
- Best LLMs for Writing 2025 compilation

### Features Research (FEATURES.md)
**High confidence sources:**
- arXiv: Can AI Writing Be Salvaged (AI writing flaws: 28% awkward word choice, 20% sentence structure)
- arXiv: Evaluating Novelty in AI-Generated Research Plans (decomposition-based pipelines 4.17/5 vs reflection 2.33/5)
- PMC: Generative AI Enhances Individual Creativity But Reduces Collective Diversity

**Medium confidence sources:**
- Author's Pathway: Character dialogue differentiation techniques
- Reedsy: Show-don't-tell sensory writing techniques
- FirstDraftPro: Scene transition techniques
- AI Recipe: Korean AI de-detection techniques (Korean source, community-validated)
- DC Inside AI Writer Gallery: Korean prompt sharing (community practices)

### Architecture Research (ARCHITECTURE.md)
**High confidence sources:**
- ICLR 2025: Agents' Room (decomposed multi-step collaboration, validated with expert evaluators)
- ACL 2025: Multi-Agent Character Simulation (director/character role-play approach)
- EMNLP 2025: Creativity in LLM Multi-Agent Systems (comprehensive survey)
- Self-Refine: Iterative Refinement with Self-Feedback (foundational work)
- CRITIC: LLMs Can Self-Correct with Tool-Interactive Critiquing (external feedback)
- EMNLP 2025: LLMs Still Struggle to Imitate Implicit Writing Styles (few-shot dominance)
- IEEE UEMCON 2025: How Well Do LLMs Imitate Human Writing Style (prompting > model choice)
- arXiv 2025: Memory Management and Contextual Consistency (hybrid memory 13.6% improvement)

**Medium confidence sources:**
- Intellectual Lead: Best LLMs for Writing 2025 (model comparison)
- Skywork: How to Use AI Editors 2025 (plan-verify-revise-polish workflow)
- K2view: Prompt Engineering Techniques 2026 (layered prompting)
- Medium: Reflective Loop Pattern (three-agent reflective architecture)

### Pitfalls Research (PITFALLS.md)
**High confidence sources:**
- NeurIPS 2025: Why Do Multi-Agent LLM Systems Fail (41-86.7% failure rates, cascading errors)
- LangChain: State of AI Agents (agent engineering challenges)
- IZA: AI Bias for Creative Writing Assessment (LLM judge biases)
- Stanford LitBench: Evaluation of Creative Writing (73% human agreement, evaluation metrics)
- arXiv WritingBench: Comprehensive Benchmark (evaluation approaches)
- Nature 2025: Stylometric Comparisons Human vs AI (dual-loop self-reflection shallow reasoning)
- IBM: What is LLM Temperature (technical parameter explanation)

**Medium confidence sources:**
- ImaginexDigital: Why Multi-Agent AI Systems Make Things Worse (industry perspective)
- CoyoteTracks: Creative Writing and AI's Failure Modes (practitioner analysis)
- Medium: Why AI Writing Still Sounds Robotic (solutions overview)
- LessWrong: Creative Writing with LLMs (prompting for fiction)
- Future Fiction Academy: AI Settings for Writers (temperature/sampling guide)

**Medium confidence Korean-specific sources:**
- earticle.net: 한국어 쓰기에서 생성형 AI 사용에 대한 학습자 인식 (learner perceptions)
- GitHub ko_novel_generator: Korean novel generation (dated 2019, historical reference)

---

*Research completed: 2026-02-05*

*Ready for roadmap: Yes*

**Next step:** Use this synthesis to inform roadmap creation. Phase structure (1: Foundation, 2: Pipeline, 3: Korean, 4: Advanced, 5: Optimize) provides starting point. Research flags identify which phases need deeper investigation during planning.
