# Architecture

**Analysis Date:** 2026-02-05

## Pattern Overview

**Overall:** Layered plugin architecture with specialized sub-systems for context management, state persistence, and quality control. Acts as a multi-agent orchestrator for Korean novel writing using Claude Code plugin system.

**Key Characteristics:**
- Modular service-oriented design with three core layers: context management, state management, and quality gating
- Token budget-aware context loading system with dynamic prioritization
- Ralph Loop integration for iterative chapter writing and retry cycles
- Stateful persistence layer with atomic locking and backup recovery mechanisms
- Separation between plugin infrastructure (skills/commands) and core algorithms (src/)

## Layers

**Plugin Interface Layer:**
- Purpose: Expose plugin capabilities to Claude Code as skills, commands, and agents
- Location: `./skills/`, `./commands/`, `./agents/`, `./hooks/`
- Contains: Skill definitions (.md files), command specifications, agent instructions, Python hooks
- Depends on: Core src/ modules via TypeScript compilation
- Used by: Claude Code plugin system, user invocations via `/` commands

**Context Management Layer:**
- Purpose: Load and prioritize novel project context within token budget constraints
- Location: `src/context/`
- Contains: Token estimation, priority calculation, context loading, overflow handling
- Depends on: File system (fs/promises), path resolution
- Used by: Skills and agents that need project metadata for writing/reviewing
- Modules:
  - `estimator.ts`: Token estimation using Korean/English language-aware factors
  - `priorities.ts`: Dynamic priority calculation based on context relevance
  - `loader.ts`: Main orchestrator that collects, prioritizes, and loads context items
  - `overflow-handler.ts`: Multi-level strategy for handling budget overflow
  - `config.ts`: Project path structure definitions

**State Management Layer:**
- Purpose: Persist and manage plugin state with safety guarantees
- Location: `src/state/`
- Contains: Atomic locking, backup/restore mechanisms
- Depends on: File system (fs), process IDs
- Used by: Ralph Loop, skills that need to track chapter progress
- Modules:
  - `lock.ts`: Atomic file-based locking (O_CREAT|O_EXCL) preventing race conditions
  - `backup.ts`: Automatic backup and restore on operation failure

**Quality Control Layer:**
- Purpose: Determine retry strategies and quality thresholds for generated chapters
- Location: `src/retry/`
- Contains: Quality scoring, retry decision logic, escalation to user intervention
- Depends on: Evaluation results from critic agent
- Used by: Ralph Loop to decide whether chapter passes or needs revision
- Modules:
  - `quality-gate.ts`: Implements 4-stage retry strategy (revise → revise-with-feedback → partial-rewrite → user-intervention)

**Type Definition Layer:**
- Purpose: Central source of truth for all data types used in novel projects
- Location: `src/types.ts`
- Contains: 500+ lines of comprehensive TypeScript interfaces covering projects, characters, plots, relationships, evaluations, etc.
- Depends on: None (pure type definitions)
- Used by: All other layers, agent instructions, schema validation

## Data Flow

**Chapter Generation Cycle (Ralph Loop):**

1. User invokes `/write-all` command with project path
2. Ralph Loop state initialized, locks acquired
3. For each chapter/act:
   - Context loader gathers all relevant files (style guide, plot, character profiles, foreshadowing, etc.)
   - Token estimator calculates sizes using language-aware factors
   - Priority calculator ranks items by relevance to current chapter
   - If overflow: handler applies multi-level compression/removal strategies
   - Context passed to novelist agent for generation
   - Generated chapter evaluated by critic + beta-reader agents
   - Quality gate determines pass/fail/retry decision
   - If retry needed: retry strategy selects next action (revise, revise-with-feedback, partial-rewrite, or user escalation)
   - On success: chapter locked, state updated, next chapter begins
4. On error or user cancellation: state restored from backup

**Context Loading Pipeline:**

1. `collectCandidates()`: Scans project directories for all context files (style guides, plots, summaries, characters, locations, foreshadowing, act summaries)
2. `enrichMetadata()`: Attaches metadata for priority calculation (current chapter, character appearance, foreshadowing payoff chapter, etc.)
3. `estimateTokens()`: Analyzes content character-by-character, applying Korean (0.7 tokens/char) vs English (1.3 tokens/word) factors
4. `calculatePriority()`: Dynamic ranking based on type base priority + relevance adjustments (distance from current chapter for summaries, appearance flags for characters, payoff chapter for foreshadowing)
5. `sortByPriority()`: Orders items for greedy loading
6. `loadWithinBudget()`: Loads items in priority order until budget exhausted
7. `handleOverflow()`: If required items don't fit, applies compression/removal strategies

**State Persistence Pattern:**

1. Before any state modification: acquire atomic lock (prevents concurrent access)
2. Create backup of current state file
3. Execute operation (chapter write, state update)
4. On success: release lock
5. On failure: restore from backup, release lock
6. Stale locks automatically cleared after 30 seconds

**Quality Gate Escalation:**

1. Chapter generated and saved
2. Critic agent evaluates on 4 dimensions (narrative quality, plot consistency, character consistency, setting adherence)
3. Score compared to threshold (default 70):
   - Pass (≥70): Move to next chapter
   - Fail 1st attempt: Run `/revise` command
   - Fail 2nd attempt: Run `/revise` with critic feedback
   - Fail 3rd attempt: Partial rewrite of lowest-scoring section only
   - Fail 4th+ attempts: Escalate to user intervention with detailed breakdown

## Key Abstractions

**Context Budget:**
- Purpose: Represents the token allocation model for loading context
- Examples: `src/context/types.ts` (ContextBudget, ContextItem, LoadContextResult)
- Pattern: Immutable context budget object with items array, overflow tracking, and loading statistics. Each item carries estimated tokens, priority level, and required flag.

**Project Paths:**
- Purpose: Abstract project directory structure for flexible deployment
- Examples: `src/context/config.ts` (ProjectPaths, DEFAULT_PATHS)
- Pattern: Interface defines standard paths (chapters/, summaries/, characters/, meta/, world/, foreshadowing/), allowing custom path schemes.

**Priority Scoring:**
- Purpose: Quantify relevance of context items to current writing context
- Examples: `src/context/priorities.ts` (getPriority, basePriority, requiredByType)
- Pattern: Base priority (1-10) modified by metadata. Style guide always 10, plot 9, character 7 but adjusts to 8 if appearing in chapter or 2 if not appearing.

**Retry Strategy:**
- Purpose: Escalate chapter quality issues through defined stages
- Examples: `src/retry/quality-gate.ts` (RetryStrategy, determineRetryStrategy)
- Pattern: Deterministic enum-based routing: attempt 1→revise, 2→revise-with-feedback, 3→partial-rewrite, 4+→user-intervention.

**Novel State:**
- Purpose: Track Ralph Loop progress and chapter metadata
- Examples: `src/types.ts` (NovelState)
- Pattern: Serialized JSON state file containing ralph_active, project_id, current_act, current_chapter, quality_score, retry_count, iteration, max_iterations.

## Entry Points

**Plugin Commands:**
- Location: `./commands/*.md` (24 command definitions)
- Triggers: User `/command` invocations (e.g., `/write-all`, `/evaluate`, `/check`)
- Responsibilities:
  - `/write-all` (commands/16-write-all.md): Orchestrate Ralph Loop for full novel generation
  - `/write [N]` (commands/14-write.md): Generate specific chapter
  - `/evaluate [N]` (commands/18-evaluate.md): Run quality gate on chapter
  - `/check` (commands/19-check.md): Consistency validation across all project files
  - `/novel-autopilot` (commands/novel-autopilot.md): End-to-end automation from brainstorm to final novel

**Plugin Skills:**
- Location: `./skills/*/SKILL.md` (40+ skill definitions)
- Triggers: User invocation, command orchestration, agent delegation
- Responsibilities:
  - `init/`: Initialize novel project structure
  - `brainstorm/`: Ideation phase
  - `blueprint-gen/`: Generate BLUEPRINT.md
  - `design-*`: Character, world, arc, relationship, timeline design
  - `write/`, `write-all/`: Content generation
  - `revise/`: Editing and refinement
  - `evaluate/`: Quality assessment
  - `analyze/`: Problem diagnosis and deep analysis

**Plugin Agents:**
- Location: `./agents/*.md` (18 specialized agents)
- Triggers: Skill/command delegation
- Responsibilities:
  - `novelist.md` (Opus): Main chapter writing
  - `critic.md` (Opus): Quality evaluation (read-only)
  - `editor.md` (Sonnet): Editing and refinement
  - `lore-keeper.md` (Sonnet): Setting/consistency management
  - `plot-architect.md` (Opus): Plot structure design
  - Supporting agents: beta-reader, proofreader, summarizer, genre-validator, consistency-verifier, character-voice-analyzer, etc.

**Python Hooks:**
- Location: `./hooks/` (Python scripts)
- Triggers: Schema validation, agent validation, build verification
- Responsibilities: Validate JSON schemas, verify agent definitions, check build integrity

**TypeScript Module Entry:**
- Location: `src/index.ts`
- Exports: All public APIs from context, state, retry modules
- Used by: Skills and commands that import novel-dev for token estimation and state management

## Error Handling

**Strategy:** Defensive multi-layered approach with graceful degradation. All file operations wrapped in try-catch with specific error handling for ENOENT vs other errors.

**Patterns:**
- **Lock Failures:** Automatic retry with 30-second timeout, stale lock removal (LOCK_TIMEOUT_MS = 30000)
- **Token Estimation Errors:** Fall back to pre-calculated file type estimates (ESTIMATED_TOKENS_BY_FILE_TYPE)
- **Context Overflow:** Multi-level handler: (1) Remove low-priority items, (2) Compress summaries/profiles, (3) Present user choices
- **State Persistence:** Atomic operations with backup before modification, automatic restore on failure
- **Quality Gate Failures:** Retry up to 4 times with escalating strategies; if all fail, require user intervention
- **Missing Files:** Gracefully skip missing context files without blocking chapter generation
- **Required Item Failures:** Throw ContextOverflowError immediately if required items (style guide, current chapter plot) don't fit in budget

## Cross-Cutting Concerns

**Logging:** Minimal in src/ (core algorithms), more verbose in skills/commands. Warnings logged when context items excluded due to budget constraints. Errors logged with full stack traces.

**Validation:**
- JSON schema validation via Zod (package.json dependency) at import time
- Token budget validation before context loading (assertRequiredItemsFit)
- Quality score threshold validation (threshold default 70, configurable)
- State consistency checks on lock acquisition (verify .lock file contains valid PID)

**Authentication:** Plugin runs within Claude Code environment with implicit authentication. No explicit auth layer required.

**Internationalization:** Full Korean language support in:
- Token estimation (Korean char detection U+AC00-U+D7AF Hangul syllables)
- Agent prompts (all instructions in Korean)
- Type definitions (field names bilingual, descriptions in Korean)
- Example values in types (Korean date formats, names, terminology)

---

*Architecture analysis: 2026-02-05*
