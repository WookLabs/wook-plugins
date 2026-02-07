# Roadmap: Novel-Dev v5.0

## Overview

Novel-Dev v5.0 redesigns the writing pipeline (stages 5-6) to eliminate AI-sounding prose and achieve human-indistinguishable Korean genre fiction. The journey progresses from style infrastructure and context management, through a decomposed scene-based writing pipeline, Korean language naturalization, advanced quality features, and finally self-improvement mechanisms. Stages 0-4 (brainstorming, init, worldbuilding, character design, plot generation) are preserved as-is.

## Phases

- [x] **Phase 1: Foundation** - Style exemplar infrastructure and tiered context management
- [x] **Phase 2: Core Pipeline** - Scene-based writing architecture with surgical revision
- [x] **Phase 3: Korean Specialization** - Language-specific naturalization rules and texture
- [x] **Phase 4: Advanced Quality** - Multi-stage revision, reference learning, and emotional depth
- [x] **Phase 5: Self-Improvement** - Autonomous quality accumulation and regression detection

## Phase Details

### Phase 1: Foundation
**Goal**: Writers have the building blocks for quality prose -- style exemplars are available during generation and context is managed without flooding
**Depends on**: Nothing (first phase)
**Requirements**: FOUN-01, FOUN-02, FOUN-03
**Success Criteria** (what must be TRUE):
  1. User can store, categorize, and retrieve prose exemplars per genre and scene type (opening-hooks, dialogue, action, emotional-peaks, transitions, descriptions)
  2. Writing agents receive a compact, tiered context bundle (hot: current scene + voice cards; warm: 3-chapter window; cold: world/plot summaries) instead of raw 120K token dumps
  3. Chapters can be decomposed into a sequence of scene objects with defined boundaries, emotional arcs, and sensory anchors via the scene data model
  4. Style exemplars placed in the context window are positioned to sandwich generation content (beginning and end) to counter "lost in the middle" attention degradation
**Plans**: 3 plans

Plans:
- [x] 01-01-PLAN.md — Style Library schema, types, storage, retrieval, agent, command, and default exemplars
- [x] 01-02-PLAN.md — Context Manager tiered assembly (hot/warm/cold) with sandwich pattern and budget enforcement
- [x] 01-03-PLAN.md — Scene data model schema, SceneV5 types, chapter decomposer, and validator

### Phase 2: Core Pipeline
**Goal**: The writing pipeline produces prose through scene-by-scene composition with exemplar injection, evaluated by surgical directives rather than scores
**Depends on**: Phase 1
**Requirements**: PIPE-01, PIPE-02, PIPE-03, PIPE-04, PIPE-05, PIPE-06
**Success Criteria** (what must be TRUE):
  1. User can write a chapter that is automatically decomposed into scenes, each drafted individually with fresh exemplar injection, then assembled with smooth transitions
  2. Quality evaluation produces passage-level surgical directives (location, problem, concrete fix with exemplar reference) instead of numeric scores alone
  3. The Prose Surgeon agent executes only the specific fixes identified by the Quality Oracle, never rewriting more than 3 paragraphs at once, preserving voice consistency
  4. The novelist agent prompt produces prose with sensory grounding (2+ senses per 500+ char scene), rhythmic sentence variation, and zero filter words ("felt", "seemed", "thought")
  5. The editor and critic agents operate with concrete style directives and literary diagnostic criteria, not generic improvement suggestions
**Plans**: 3 plans

Plans:
- [x] 02-01-PLAN.md — Pipeline types, scene writer orchestration, and assembler module
- [x] 02-02-PLAN.md — Quality Oracle directive system and Prose Surgeon agent
- [x] 02-03-PLAN.md — Scene-drafter, assembly-agent, novelist update, and write-scene skill

### Phase 3: Korean Specialization
**Goal**: Generated prose reads as naturally Korean to native readers -- correct honorifics, zero AI-tell expressions, and rich Korean linguistic texture
**Depends on**: Phase 2
**Requirements**: KORE-01, KORE-02, KORE-03
**Success Criteria** (what must be TRUE):
  1. Characters maintain consistent honorific/speech level based on their relationship matrix (e.g., Character A uses 해체 to B, 존댓말 to C) across all scenes including context-dependent shifts (formal in public, casual in private)
  2. Generated prose contains zero instances of AI-banned expressions from the curated list (no "한편", "그러나", "~하였다", filter words, translation patterns) -- violations are caught and replaced at generation time
  3. Korean onomatopoeia (의성어/의태어), genre-appropriate metaphors, and prose texture techniques (여백의 미, 체언종결, 반복과 변주) appear naturally in output without feeling decorative or forced
**Plans**: 3 plans

Plans:
- [x] 03-01-PLAN.md — Honorific matrix system with per-character relationship rules and Quality Oracle integration
- [x] 03-02-PLAN.md — AI banned expression detection and replacement engine with categorized severity
- [x] 03-03-PLAN.md — Korean texture library (onomatopoeia, metaphor patterns) with context-based suggestions

### Phase 4: Advanced Quality
**Goal**: Prose achieves literary-grade quality through multi-stage revision, author-specific style emulation, emotional depth beneath surface, and distinct character voices
**Depends on**: Phase 3
**Requirements**: ADVQ-01, ADVQ-02, ADVQ-03, ADVQ-04
**Success Criteria** (what must be TRUE):
  1. Each chapter passes through 4 distinct revision stages (Draft -> Tone -> Style -> Final proofread), each with separate evaluation criteria, and the output measurably improves at each stage
  2. User can provide a reference novel/author, the system extracts quantifiable style patterns (sentence length distribution, dialogue ratio, sensory density, vocabulary complexity), and subsequent prose generation reflects those patterns
  3. Dialogue scenes contain observable emotional subtext -- characters say one thing while meaning another, with hidden emotion layers annotated in chapter plans and reflected in body language, action beats, and word choice
  4. Each character speaks with a distinct, recognizable voice pattern -- unique vocabulary, sentence structure, speech habits, and internal monologue tone that remain consistent across chapters
**Plans**: 3 plans

Plans:
- [x] 04-01-PLAN.md — Multi-stage revision pipeline with 4 distinct stages (Draft/Tone/Style/Final)
- [x] 04-02-PLAN.md — Reference style learning with stylometric analysis (TTR, MTLD, sentence stats)
- [x] 04-03-PLAN.md — Emotion subtext engine and character voice differentiation

### Phase 5: Self-Improvement
**Goal**: The system autonomously improves its own quality baseline by accumulating successful exemplars and detecting quality regression
**Depends on**: Phase 4
**Requirements**: SELF-01, SELF-02
**Success Criteria** (what must be TRUE):
  1. Highest-quality passages (as judged by Quality Oracle) are automatically added to the Style Library as new exemplars, expanding the few-shot pool without manual curation
  2. Quality metrics are tracked chapter-by-chapter with trend visualization, and the system alerts the user when quality regresses compared to the rolling average
**Plans**: 2 plans

Plans:
- [x] 05-01-PLAN.md — Exemplar auto-accumulation: types, passage extraction, scoring, dedup, and Style Library promotion
- [x] 05-02-PLAN.md — Quality trend tracking with EWMA regression detection and markdown visualization

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5

| Phase | Plans Complete | Status | Completed |
|-------|---------------|--------|-----------|
| 1. Foundation | 3/3 | Complete | 2026-02-05 |
| 2. Core Pipeline | 3/3 | Complete | 2026-02-05 |
| 3. Korean Specialization | 3/3 | Complete | 2026-02-05 |
| 4. Advanced Quality | 3/3 | Complete | 2026-02-06 |
| 5. Self-Improvement | 2/2 | Complete | 2026-02-06 |
