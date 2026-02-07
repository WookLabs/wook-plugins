# Phase 1: Foundation - Research

**Researched:** 2026-02-05
**Domain:** Style exemplar infrastructure, tiered context management, scene data model
**Confidence:** HIGH

## Summary

Phase 1 builds three foundational components for Novel-Dev v5.0: (1) a Style Library for storing and retrieving few-shot prose exemplars, (2) a Context Manager that replaces the current flat 80K token dump with tiered hot/warm/cold bundles, and (3) a Scene Data Model that decomposes chapters into discrete scene objects. These components are pure infrastructure -- they do not change the existing writing pipeline (stages 0-4) but provide the building blocks that Phase 2's new pipeline will consume.

The existing codebase already has a well-structured TypeScript context loader (`src/context/`) with token estimation, priority calculation, and overflow handling. The new Context Manager extends this rather than replacing it. The existing `chapter.schema.json` already has a `scenes` array with basic fields -- the Scene Data Model enriches this significantly. The Style Library is entirely new infrastructure with no existing precedent in the codebase.

**Primary recommendation:** Build the Style Library schema and storage first (no dependencies), then the Scene Data Model (extends existing chapter schema), then the Context Manager (depends on understanding what data the other two produce). All three are JSON schema + TypeScript type definitions + skill commands, following existing codebase conventions exactly.

## Standard Stack

This is a Claude Code plugin project. There are no external runtime dependencies to add. The "stack" is JSON schemas, TypeScript types, agent definitions, and skill markdown files.

### Core (Already in Codebase)
| Component | Version | Purpose | Status |
|-----------|---------|---------|--------|
| TypeScript | 5.x (strict) | Type definitions, core modules | Existing |
| Vitest | Latest | Test runner | Existing |
| JSON Schema (draft-07) | - | Data validation | Existing |
| Claude Code Plugin System | - | Agent/skill/command framework | Existing |
| Zod | In deps | Schema validation (available but unused in observed code) | Existing |

### New Components to Create
| Component | Type | Purpose |
|-----------|------|---------|
| `schemas/style-library.schema.json` | JSON Schema | Style exemplar storage and categorization |
| `schemas/scene.schema.json` | JSON Schema | Enriched scene data model |
| `src/context/tiers.ts` | TypeScript | Tiered context assembly (hot/warm/cold) |
| `src/style-library/` | TypeScript module | Style exemplar storage, categorization, retrieval |
| `agents/style-curator.md` | Agent definition | Exemplar curation and categorization |
| `skills/style-library/` | Skill directory | Style library management commands |

### No New Dependencies Needed

The project already has everything required. No npm packages to add. The work is schema design, TypeScript types, agent prompts, and skill orchestration.

## Architecture Patterns

### Recommended Project Structure (New Files Only)

```
novel-dev/
├── src/
│   ├── types.ts                    # ADD: StyleExemplar, SceneV5, ContextTier types
│   ├── context/
│   │   ├── tiers.ts                # NEW: Tiered context assembly (hot/warm/cold)
│   │   ├── types.ts                # MODIFY: Add ContextTier, TieredBundle types
│   │   ├── priorities.ts           # MODIFY: Add exemplar and scene context types
│   │   └── [existing files]        # PRESERVE: loader, estimator, overflow-handler
│   └── style-library/
│       ├── index.ts                # NEW: Public API exports
│       ├── types.ts                # NEW: StyleExemplar, ExemplarCategory types
│       ├── storage.ts              # NEW: File-based exemplar CRUD
│       ├── retrieval.ts            # NEW: Query by genre, scene-type, tone
│       └── classifier.ts           # NEW: Auto-categorization logic
├── schemas/
│   ├── style-library.schema.json   # NEW: Exemplar storage schema
│   ├── scene.schema.json           # NEW: Enriched scene data model
│   └── context-bundle.schema.json  # NEW: Tiered context bundle schema
├── agents/
│   └── style-curator.md            # NEW: Exemplar curation agent
├── skills/
│   └── style-library/              # NEW: Style library management skill
│       ├── SKILL.md
│       ├── examples/
│       └── references/
├── commands/
│   └── style-library.md            # NEW: /style-library command
└── tests/
    ├── context/
    │   └── tiers.test.ts           # NEW: Tiered context tests
    └── style-library/
        ├── storage.test.ts         # NEW: Storage CRUD tests
        └── retrieval.test.ts       # NEW: Retrieval query tests
```

### Pattern 1: Style Library Data Model

**What:** Categorized prose exemplar storage with multi-dimensional indexing.

**Exemplar Classification Taxonomy (Claude's Discretion Decision):**

Based on how the novelist agent currently structures its work (genre-specific writing techniques, scene construction, emotional arc integration), the classification should use these dimensions:

| Dimension | Values | Rationale |
|-----------|--------|-----------|
| **genre** | romance, fantasy, horror, sf, martial-arts, historical, sports, daily-life, mystery | Matches existing `novelist.md` genre-specific techniques and `genre-validator` agent |
| **scene_type** | opening-hook, dialogue, action, emotional-peak, transition, description, climax, denouement | Maps to novelist agent's scene construction phases and chapter structure |
| **emotional_tone** | tension, warmth, sorrow, humor, awe, dread, excitement, serenity | Maps to existing `emotional-context.schema.json` beat types |
| **pov** | first-person, third-limited, third-omniscient | Matches existing `style-guide.schema.json` narrative_voice values |
| **pacing** | fast, medium, slow | Matches existing `StyleGuide.pacing_default` type |

**Anti-exemplar Decision (Claude's Discretion):**

Include anti-exemplars. They are critical for AI-che elimination. The project-level research found "anti-exemplars showing bad vs. good versions" as a prevention strategy for the Tell-Don't-Show trap. Structure:

```typescript
interface StyleExemplar {
  id: string;                    // "exm_{genre}_{NNN}"
  content: string;               // 500-1500 chars (scene-length)
  genre: string[];               // Multi-genre tagging
  scene_type: string;            // Primary scene type
  emotional_tone: string[];      // Emotional dimension tags
  pov: string;                   // Narrative POV
  pacing: string;                // Pacing speed
  is_anti_exemplar: boolean;     // false = good example, true = what NOT to write
  anti_exemplar_pair?: string;   // ID of the corresponding good exemplar (if anti)
  source: string;                // Attribution or "curated"
  quality_notes?: string;        // Why this is good/bad
  language_features?: string[];  // Notable Korean techniques used
  created_at: string;            // ISO 8601
}
```

**Why anti-exemplar pairs:** Providing both "bad version" and "good version" of the same scene concept gives the LLM a contrastive signal. Research shows this is more effective than positive examples alone for style transfer (EMNLP 2025 imitation study).

### Pattern 2: Tiered Context Manager

**What:** Three-tier context assembly replacing flat priority-based loading.

The current system (`src/context/`) loads everything into a single flat priority queue with an 80K token budget. The new system organizes context into three tiers that serve different cognitive functions during writing:

| Tier | Purpose | Contents | Token Budget | Position in Prompt |
|------|---------|----------|-------------|-------------------|
| **Hot** | Immediate writing task | Current scene plan, style exemplars (2-3), character voice profiles for scene characters, emotional directives | ~15K | Sandwiching generation (beginning + end) |
| **Warm** | Narrative continuity | Previous 5 chapter summaries, active foreshadowing, relationship states, next chapter preview | ~25K | Middle of context |
| **Cold** | Reference material | World building, full plot structure, act summaries, inactive characters, all foreshadowing | ~40K | Early in context (can be partially loaded) |

**Key design decisions from CONTEXT.md:**

1. **Warm window = 5 chapters** (user decision, expanded from default 3)
2. **Characters uncompressed at ~2000 tokens** (user decision -- no voice cards, full profiles)
3. **Token strategy = generous** (user decision -- prioritize completeness over compression)
4. **Plot information is paramount** (user's core design principle -- context manager must provide sufficient plot info for independent scene/chapter writing)

**Integration with existing context loader:**

The existing `src/context/` module is well-designed. Extend it rather than replace:

```typescript
// NEW: src/context/tiers.ts
interface TieredContextBundle {
  hot: ContextItem[];     // Always loaded, sandwich position
  warm: ContextItem[];    // Loaded by sliding window
  cold: ContextItem[];    // Reference, partially loaded
  totalTokens: number;
  tierBreakdown: {
    hot: number;
    warm: number;
    cold: number;
  };
}

// Extends existing ContextType with new types
type ContextTypeV5 = ContextType
  | 'exemplar'           // Style exemplars (hot tier)
  | 'scene_plan'         // Current scene plan (hot tier)
  | 'emotional_directive' // Emotional arc directives (hot tier)
  | 'relationship_state'; // Active relationship dynamics (warm tier)
```

**Sandwich Pattern Implementation:**

The success criteria require exemplars positioned at beginning AND end of context to counter "lost in the middle." The tiered system naturally supports this:

```
[SYSTEM PROMPT]
[HOT TIER - Part 1: Style exemplars + scene plan]
[COLD TIER: World, plot structure]
[WARM TIER: Summaries, foreshadowing, relationships]
[HOT TIER - Part 2: Style exemplars repeated + character voices + emotional directives]
[GENERATION INSTRUCTION]
```

### Pattern 3: Scene Data Model

**What:** Enriched scene schema extending existing chapter.scenes with plot-beat-based decomposition.

**Current state:** `chapter.schema.json` already has a `scenes` array with: scene_number, purpose, characters, location, conflict, beat, emotional_tone, estimated_words.

**Enrichment needed for v5.0 (from CONTEXT.md decisions):**

The user decided scenes decompose based on **plot beats** from existing `chapter_NNN.json`. Each plot beat becomes one or more scenes. The scene model needs to capture enough information for independent scene drafting in Phase 2.

```typescript
interface SceneV5 {
  // Existing fields (preserve compatibility)
  scene_number: number;
  purpose: string;
  characters: string[];       // char_XXX IDs
  location: string;           // loc_XXX ID
  conflict: string;
  beat: string;               // Plot beat this scene realizes
  emotional_tone: string;
  estimated_words: number;

  // New v5.0 fields
  pov_character: string;      // Which character's POV (may differ from chapter POV)
  sensory_anchors: string[];  // Required sensory details (sight, sound, smell, touch, taste)
  emotional_arc: {
    entry_emotion: string;    // Emotional state at scene start
    exit_emotion: string;     // Emotional state at scene end
    peak_moment: string;      // Description of emotional peak
    tension_target: number;   // 1-10 tension level target
  };
  dialogue_goals?: string[];  // What dialogue must accomplish
  foreshadowing: {
    plant: string[];          // fore_XXX IDs to plant
    payoff: string[];         // fore_XXX IDs to pay off
    hint: string[];           // fore_XXX IDs to hint at
  };
  transition: {
    from_previous: string;    // How to enter this scene (sensory bridge, time cut, etc.)
    to_next: string;          // How to exit (emotional resonance, cliffhanger, etc.)
  };
  style_override?: {
    pacing: 'fast' | 'medium' | 'slow';
    focus: string;            // action, dialogue, introspection, description
    tone: string;             // Override chapter tone for this scene
  };
  exemplar_tags?: string[];   // Tags for matching style exemplars to this scene
}
```

**Chapter decomposition logic (Claude's Discretion):**

Decomposition should follow the existing plot beat structure. Each chapter's `context.current_plot` (2000-8000 chars of detailed plot) contains natural beat boundaries. The decomposer:

1. Reads chapter_NNN.json `context.current_plot`
2. Identifies beat boundaries (shifts in: location, character focus, conflict, emotional tone)
3. Creates one SceneV5 per beat or beat cluster
4. Assigns sensory anchors, emotional arcs, and foreshadowing per scene
5. Calculates word budgets proportional to beat importance

**Scene count (Claude's Discretion):** Adaptive based on chapter length and complexity. Typical range: 2-5 scenes per chapter. Short chapters (~3000 chars) get 2 scenes; standard (~5000 chars) get 3-4; long/complex chapters get 4-5. Never exceed 6 scenes (diminishing returns in scene-by-scene drafting).

**Schema compatibility (Claude's Discretion):** The new scene model should be a **superset** of the existing `chapter.schema.json` scenes array. All existing fields preserved, new fields added as optional. This means:
- Existing chapter JSONs remain valid
- The decomposer ADDS the new fields when processing
- Phase 2's scene drafter uses the new fields; existing novelist agent ignores them gracefully

### Pattern 4: Hot Context Composition (Claude's Discretion)

**What constitutes "hot" context -- the most critical information for scene-level writing:**

| Component | Token Estimate | Why Hot |
|-----------|---------------|---------|
| Current scene plan (SceneV5) | ~500 | The immediate writing task |
| Style exemplars (2-3, matching scene type) | ~3000-4500 | Research: dominant factor in prose quality |
| POV character full profile | ~2000 | User decision: uncompressed characters |
| Other scene character profiles | ~2000-4000 | User decision: uncompressed |
| Emotional directives (from emotional-context) | ~500 | What emotions to target |
| Foreshadowing to plant/payoff in this scene | ~500 | Narrative thread continuity |
| **Total hot** | **~8500-12000** | Fits within 15K budget |

Note: The user decided characters stay at full ~2000 tokens each. With 2-3 characters per scene, that's 4000-6000 tokens just for characters. This is intentional -- the user explicitly rejected voice card compression (200 tokens) in favor of full personality preservation.

### Anti-Patterns to Avoid

- **Voice card compression:** User explicitly rejected 200-token voice cards. Keep full character profiles (~2000 tokens). The project-level research suggested voice cards, but user overrode this.
- **Over-compressing warm context:** User chose "generous" token strategy. Don't aggressively summarize the 5-chapter window.
- **Flat context loading:** Current system dumps everything at same priority level. New system must tier explicitly.
- **Exemplar flooding:** Research says 2-3 exemplars per generation call. More than 4 dilutes the style signal.
- **Breaking existing schemas:** Scene model must be backward-compatible superset.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Token estimation | New token counter | Existing `src/context/estimator.ts` | Already handles Korean/English/JSON with empirical factors |
| Priority sorting | New priority system | Existing `src/context/priorities.ts` | Already has dynamic priority calculation; extend with new types |
| File locking | Custom lock logic | Existing `src/state/lock.ts` | Already implements atomic O_CREAT\|O_EXCL locking |
| State backup | Custom backup | Existing `src/state/backup.ts` | Already has withStateBackup() pattern |
| Schema validation | Custom validators | JSON Schema draft-07 (existing pattern) | All 22 existing schemas use this |
| Overflow handling | Custom budget logic | Existing `src/context/overflow-handler.ts` | Already has multi-level overflow strategies |

**Key insight:** The existing `src/context/` module is solid infrastructure. The tiered context manager should extend it with a new tier assignment layer, not replace the loading/estimation/overflow logic.

## Common Pitfalls

### Pitfall 1: Exemplar Quality Chicken-and-Egg
**What goes wrong:** Style library launches with zero or poor exemplars, making the entire system useless.
**Why it happens:** Users don't have curated exemplars ready; auto-generation doesn't exist yet (Phase 5).
**How to avoid:** Ship with curated starter exemplars per genre. The existing `novelist.md` already has genre-specific technique descriptions with example passages. Extract and formalize these as initial exemplars. Provide a `/style-library add` command for manual collection.
**Warning signs:** Empty style library after project init.

### Pitfall 2: Token Budget Miscalculation with Uncompressed Characters
**What goes wrong:** Hot tier budget explodes when a scene has 4+ characters at 2000 tokens each.
**Why it happens:** User chose uncompressed characters. A scene with 4 characters = 8000 tokens just for characters, leaving little room for exemplars.
**How to avoid:** Hot tier character loading must be adaptive: POV character always full (2000 tokens), other scene characters get progressively compressed if budget is tight. Define a fallback compression level for non-POV characters (e.g., 800 tokens keeping voice/speech patterns only).
**Warning signs:** Hot tier exceeding 15K tokens; exemplars being dropped to fit characters.

### Pitfall 3: Scene Decomposition Over-Splitting
**What goes wrong:** Decomposer creates too many tiny scenes, making Phase 2's scene-by-scene drafting produce choppy prose.
**Why it happens:** Every plot beat mapped to exactly one scene, even when beats are closely related.
**How to avoid:** Set minimum scene word count (800 chars). Cluster adjacent beats that share location + characters into single scenes. Maximum 5 scenes per chapter.
**Warning signs:** Scenes under 500 chars; more than 5 scenes in a chapter.

### Pitfall 4: Backward Compatibility Break
**What goes wrong:** Existing projects fail to load because schema changes break validation.
**Why it happens:** New required fields added to scene or chapter schemas.
**How to avoid:** All new scene fields are OPTIONAL in schema. The decomposer adds them; the existing pipeline doesn't require them. v5.0 is for new projects only (user decision), but schemas should still validate old data.
**Warning signs:** `validate_schemas.sh` failing after changes.

### Pitfall 5: Exemplar Sandwich Position Not Enforced
**What goes wrong:** Style exemplars end up in the middle of context where LLM attention is lowest.
**Why it happens:** Context assembly treats exemplars like any other context item.
**How to avoid:** The tiered system must explicitly split hot context into two sections: one at the beginning, one at the end of the prompt. This is an assembly-time concern, not a storage concern.
**Warning signs:** Exemplars only appearing at one position in the prompt.

## Code Examples

### Style Exemplar Schema Structure

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "style-library.schema.json",
  "title": "Style Library",
  "description": "Few-shot prose exemplar storage for style-guided generation",
  "type": "object",
  "required": ["exemplars"],
  "properties": {
    "exemplars": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["id", "content", "genre", "scene_type", "is_anti_exemplar", "source"],
        "properties": {
          "id": {
            "type": "string",
            "pattern": "^exm_[a-z0-9_]+$"
          },
          "content": {
            "type": "string",
            "minLength": 300,
            "maxLength": 2000,
            "description": "Scene-length prose exemplar (500-1500 chars recommended)"
          },
          "genre": {
            "type": "array",
            "items": { "type": "string" },
            "minItems": 1
          },
          "scene_type": {
            "type": "string",
            "enum": ["opening-hook", "dialogue", "action", "emotional-peak",
                     "transition", "description", "climax", "denouement"]
          },
          "emotional_tone": {
            "type": "array",
            "items": { "type": "string" }
          },
          "pov": {
            "type": "string",
            "enum": ["first-person", "third-limited", "third-omniscient"]
          },
          "pacing": {
            "type": "string",
            "enum": ["fast", "medium", "slow"]
          },
          "is_anti_exemplar": {
            "type": "boolean",
            "default": false
          },
          "anti_exemplar_pair": {
            "type": "string",
            "description": "ID of the paired good exemplar (only for anti-exemplars)"
          },
          "source": { "type": "string" },
          "quality_notes": { "type": "string" },
          "language_features": {
            "type": "array",
            "items": { "type": "string" }
          },
          "created_at": {
            "type": "string",
            "format": "date-time"
          }
        }
      }
    },
    "metadata": {
      "type": "object",
      "properties": {
        "version": { "type": "string" },
        "total_exemplars": { "type": "integer" },
        "genres_covered": { "type": "array", "items": { "type": "string" } },
        "last_updated": { "type": "string", "format": "date-time" }
      }
    }
  }
}
```

### Tiered Context Assembly

```typescript
// src/context/tiers.ts
import { ContextItem, ContextType, BudgetConfig } from './types.js';
import { getPriority } from './priorities.js';

export type ContextTier = 'hot' | 'warm' | 'cold';

export interface TierBudget {
  hot: number;    // ~15K tokens
  warm: number;   // ~25K tokens
  cold: number;   // ~40K tokens
}

export const DEFAULT_TIER_BUDGET: TierBudget = {
  hot: 15000,
  warm: 25000,
  cold: 40000,
};

export interface TieredContextBundle {
  hot: ContextItem[];
  warm: ContextItem[];
  cold: ContextItem[];
  totalTokens: number;
  tierBreakdown: Record<ContextTier, number>;
}

/**
 * Assigns a context item to its appropriate tier
 */
export function assignTier(type: ContextType | string, metadata: Record<string, unknown>): ContextTier {
  // Hot tier: immediate writing needs
  if (type === 'exemplar' || type === 'scene_plan' || type === 'emotional_directive') {
    return 'hot';
  }
  if (type === 'character' && metadata.appearsInCurrentScene) {
    return 'hot';
  }

  // Warm tier: narrative continuity
  if (type === 'summary' || type === 'relationship_state') {
    return 'warm';
  }
  if (type === 'foreshadowing' && metadata.isActive) {
    return 'warm';
  }
  if (type === 'plot') {
    return 'warm'; // Current chapter plot in warm; scene_plan in hot
  }

  // Cold tier: reference material
  return 'cold';
}
```

### Scene Decomposition Type

```typescript
// Extension to src/types.ts
export interface SceneV5 extends Scene {
  pov_character: string;
  sensory_anchors: string[];
  emotional_arc: {
    entry_emotion: string;
    exit_emotion: string;
    peak_moment: string;
    tension_target: number;
  };
  dialogue_goals?: string[];
  foreshadowing: {
    plant: string[];
    payoff: string[];
    hint: string[];
  };
  transition: {
    from_previous: string;
    to_next: string;
  };
  style_override?: {
    pacing: Pacing;
    focus: string;
    tone: string;
  };
  exemplar_tags?: string[];
}
```

### Exemplar Retrieval Query

```typescript
// src/style-library/retrieval.ts
export interface ExemplarQuery {
  genre: string;
  scene_type: string;
  emotional_tone?: string;
  pov?: string;
  pacing?: string;
  limit?: number;           // Default: 3
  include_anti?: boolean;   // Default: true (include 1 anti-exemplar)
}

export interface ExemplarResult {
  exemplars: StyleExemplar[];      // Matched good exemplars (2-3)
  anti_exemplar?: StyleExemplar;   // Optional anti-exemplar for contrast
  total_tokens: number;
}

/**
 * Retrieves best-matching exemplars for a scene
 * Scoring: exact genre match > partial > none; exact scene_type > similar
 */
export function queryExemplars(
  library: StyleLibrary,
  query: ExemplarQuery
): ExemplarResult {
  // Score each exemplar by match quality
  // Return top N by score
  // Include at most 1 anti-exemplar if requested
}
```

## State of the Art

| Old Approach (v3.x/v4.0) | New Approach (v5.0) | Impact |
|---------------------------|---------------------|--------|
| Flat 80K token context dump | Three-tier hot/warm/cold bundles | Prevents voice drift, ensures exemplar proximity |
| No style exemplars | 2-3 scene-matched exemplars per generation | Research: #1 factor in prose quality (EMNLP 2025) |
| Basic scene array (7 fields) | Rich scene model (20+ fields) | Enables independent scene drafting in Phase 2 |
| 3-chapter summary window | 5-chapter sliding window | Better foreshadowing recall, long-form consistency |
| 200-token voice cards | Full ~2000-token character profiles | Complete personality preservation (user decision) |
| Priority-only context selection | Tier + priority context selection | Semantic grouping prevents inappropriate mixing |

**Deprecated/outdated:**
- The project-level research suggested 200-token voice cards for characters. User explicitly overrode this in CONTEXT.md. Do NOT implement voice card compression.
- The research suggested 60K total context. User chose "generous" strategy. Use 80K total (15K+25K+40K tiers).

## Open Questions

1. **Starter exemplar sourcing**
   - What we know: The system needs curated exemplars to be useful from day one
   - What's unclear: Whether to include actual Korean novel excerpts (copyright), or generate synthetic exemplars, or extract from existing `novelist.md` genre examples
   - Recommendation: Generate synthetic exemplars using Claude during project init, tagged by the project's genre. This avoids copyright issues and guarantees relevance.

2. **Non-POV character hot tier compression**
   - What we know: Full characters at 2000 tokens each; scenes can have 4+ characters
   - What's unclear: How much to compress non-POV characters when hot tier budget is tight
   - Recommendation: Define a "scene-relevant excerpt" format (~800 tokens) keeping: name, appearance summary, voice/speech patterns, current emotional state, relationship to POV character. Apply only when hot tier exceeds budget.

3. **Exemplar file storage location**
   - What we know: Per-project data goes in the project directory; curated defaults could be in plugin
   - What's unclear: Where to store the default/curated exemplar library vs. user-collected exemplars
   - Recommendation: Default curated exemplars in `novel-dev/templates/style-library/` (copied during init). User exemplars in project's `meta/style-library.json`. Both merged at retrieval time.

4. **Agent restructuring scope (Claude's Discretion)**
   - What we know: User listed "agent restructuring" as Claude's discretion
   - What's unclear: How much agent restructuring belongs in Phase 1 vs. Phase 2
   - Recommendation: Phase 1 adds only ONE new agent (`style-curator` for exemplar management). All existing agents preserved. Major agent restructuring (novelist refactor, Quality Oracle, Prose Surgeon) belongs in Phase 2.

## Sources

### Primary (HIGH confidence)
- **Existing codebase analysis** - Direct reading of all 22 schemas, 18 agents, key skills, and src/ TypeScript modules
- **CONTEXT.md** (user decisions) - Locked decisions on character compression, sliding window, token strategy
- **Project-level SUMMARY.md** - Synthesized research from ICLR 2025, ACL 2025, EMNLP 2025 papers

### Secondary (MEDIUM confidence)
- **EMNLP 2025 style imitation study** (from project research) - Few-shot exemplars as dominant quality factor
- **"Lost in the middle" attention research** (from project research) - Sandwich pattern for exemplar placement
- **NeurIPS 2025 multi-agent failure research** (from project research) - Keep Phase 1 minimal (1 new agent only)

### Tertiary (LOW confidence)
- **Scene decomposition word count thresholds** (800 chars minimum, 5 scenes maximum) - Based on reasoning about Korean web novel chapter structure (~5000 chars), not empirical data. Needs validation in Phase 2.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - This is a Claude Code plugin; stack is fixed and well-understood from codebase analysis
- Architecture: HIGH - Extending existing well-structured TypeScript modules; patterns follow existing conventions
- Pitfalls: HIGH - Derived from user decisions (uncompressed characters) and existing codebase constraints
- Scene model: MEDIUM - Scene enrichment fields are designed for Phase 2 consumption; actual utility depends on Phase 2 implementation
- Exemplar classification: MEDIUM - Taxonomy designed from existing agent genre categories; effectiveness depends on exemplar quality

**Research date:** 2026-02-05
**Valid until:** Stable foundation patterns; valid for 60+ days. Scene model may need adjustment after Phase 2 planning.
