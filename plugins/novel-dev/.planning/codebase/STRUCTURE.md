# Codebase Structure

**Analysis Date:** 2026-02-05

## Directory Layout

```
novel-dev/
├── .claude-plugin/              # Plugin metadata
│   ├── plugin.json              # Plugin definition (name, version, skills path)
│   └── .claude-plugin/          # Internal plugin directory (empty)
├── src/                         # Core TypeScript modules (compiled to dist/)
│   ├── index.ts                 # Entry point: exports all public APIs
│   ├── types.ts                 # Comprehensive type definitions for novel projects
│   ├── context/                 # Token budget & context loading system
│   │   ├── index.ts             # Exports: loader, estimator, priorities, overflow-handler
│   │   ├── types.ts             # ContextBudget, ContextItem, LoadContextResult, BudgetConfig
│   │   ├── config.ts            # ProjectPaths interface, DEFAULT_PATHS definition
│   │   ├── estimator.ts         # Token estimation with Korean/English language factors
│   │   ├── priorities.ts        # Dynamic priority calculation based on context relevance
│   │   ├── loader.ts            # Main context loading orchestrator
│   │   └── overflow-handler.ts  # Multi-level budget overflow strategies
│   ├── state/                   # State persistence with safety guarantees
│   │   ├── index.ts             # Exports: acquireLock, withStateBackup
│   │   ├── lock.ts              # Atomic file-based locking (O_CREAT|O_EXCL)
│   │   └── backup.ts            # Backup/restore mechanism on failure
│   └── retry/                   # Quality gate & retry logic
│       ├── index.ts             # Exports: quality-gate functions
│       └── quality-gate.ts      # 4-stage retry strategy for failed chapters
├── dist/                        # Compiled JavaScript output (generated, not committed)
│   └── [compiled .js files]     # TypeScript compilation target
├── tests/                       # Test suite
│   ├── context/                 # Context system tests
│   │   ├── estimator.test.ts    # Token estimation unit tests
│   │   └── priorities.test.ts   # Priority calculation tests
│   ├── retry/                   # Quality gate tests
│   │   └── quality-gate.test.ts # Retry strategy tests
│   ├── state/                   # State persistence tests
│   │   └── state.test.ts        # Lock and backup tests
│   └── smoke.test.ts            # Integration smoke tests
├── skills/                      # Plugin skills (40+ directories)
│   ├── init/                    # Project initialization skill
│   ├── brainstorm/              # Ideation skill
│   ├── blueprint-gen/           # Blueprint generation skill
│   ├── blueprint-review/        # Blueprint review skill
│   ├── design-character/        # Character design skill
│   ├── design-world/            # World design skill
│   ├── design-style/            # Style guide design skill
│   ├── design-main-arc/         # Main plot arc design skill
│   ├── design-sub-arc/          # Subplot design skill
│   ├── design-foreshadow/       # Foreshadowing design skill
│   ├── design-hook/             # Mystery hook design skill
│   ├── design-relationship/     # Character relationship design skill
│   ├── design-timeline/         # Timeline design skill
│   ├── design-world/            # World building skill
│   ├── gen-plot/                # Plot generation skill
│   ├── write/                   # Single chapter writing skill
│   ├── write-act/               # Multi-chapter/act writing skill
│   ├── write-all/               # Full novel writing with Ralph Loop
│   ├── multi-draft/             # Parallel chapter drafting
│   ├── revise/                  # Chapter revision/editing skill
│   ├── revise-pipeline/         # Multi-stage revision pipeline
│   ├── evaluate/                # Quality evaluation skill
│   ├── deep-evaluate/           # Advanced evaluation with multiple agents
│   ├── consistency-check/       # Timeline/character/world consistency check
│   ├── analyze/                 # Problem diagnosis skill
│   ├── analyze-engagement/      # Reader engagement analysis
│   ├── review/                  # Design review skill
│   ├── verify-design/           # Design verification
│   ├── verify-chapter/          # Chapter verification
│   ├── validate-genre/          # Genre appropriateness validation
│   ├── check-retention/         # Reader retention analysis
│   ├── ai-slop-detector/        # AI-generated text detection and rewriting
│   ├── adversarial-review/      # Defensive review from opposing viewpoint
│   ├── emotion-arc/             # Emotional arc design
│   ├── help/                    # Help documentation skill
│   ├── stats/                   # Project statistics skill
│   ├── status/                  # Project status skill
│   ├── timeline/                # Timeline visualization skill
│   ├── swarm/                   # Parallel agent coordination skill
│   ├── resume/                  # Resume interrupted work skill
│   ├── wisdom/                  # Capture learnings and patterns
│   └── quickstart/              # Quick start guide
├── commands/                    # Plugin commands (24 command definitions)
│   ├── 00-brainstorm.md         # Command: /brainstorm
│   ├── 01-blueprint-gen.md      # Command: /blueprint-gen
│   ├── 02-blueprint-review.md   # Command: /blueprint-review
│   ├── 03-init.md               # Command: /init - Initialize project
│   ├── 04-design-style.md       # Command: /design-style
│   ├── 05-world.md              # Command: /world
│   ├── 06-character.md          # Command: /character
│   ├── 07-design-relationship.md# Command: /design-relationship
│   ├── 08-design-timeline.md    # Command: /design-timeline
│   ├── 09-main-arc.md           # Command: /main-arc
│   ├── 10-sub-arc.md            # Command: /sub-arc
│   ├── 11-foreshadow.md         # Command: /foreshadow
│   ├── 12-hook.md               # Command: /hook
│   ├── 13-plot.md               # Command: /plot - Generate chapter plots
│   ├── 14-write.md              # Command: /write [N] - Write specific chapter
│   ├── 15-write-act.md          # Command: /write-act [N] - Write entire act
│   ├── 16-write-all.md          # Command: /write-all - Full novel with Ralph Loop
│   ├── 17-revise.md             # Command: /revise [N] - Revise chapter
│   ├── 18-evaluate.md           # Command: /evaluate [N] - Evaluate chapter quality
│   ├── 19-check.md              # Command: /check - Consistency check
│   ├── 20-resume.md             # Command: /resume - Resume interrupted session
│   ├── 21-wisdom.md             # Command: /wisdom - Save learnings
│   ├── 22-swarm.md              # Command: /swarm - Parallel processing
│   ├── novel-autopilot.md       # Command: /novel-autopilot - Full automation
│   ├── cancel-novel-autopilot.md# Command: /cancel-novel-autopilot
│   ├── validate-genre.md        # Command: /validate-genre
│   ├── check-retention.md       # Command: /check-retention
│   ├── verify-chapter.md        # Command: /verify-chapter
│   ├── timeline.md              # Command: /timeline
│   ├── status.md                # Command: /status
│   ├── stats.md                 # Command: /stats
│   ├── help.md                  # Command: /help
│   ├── quickstart.md            # Command: /quickstart
│   ├── analyze-engagement.md    # Command: /analyze-engagement
│   ├── AGENTS.md                # Command documentation index
│   └── [SKILL_REFERENCE_DOCS]   # Various skill reference docs
├── agents/                      # Agent definitions (18 agents)
│   ├── novelist.md              # Opus: Main chapter writing
│   ├── editor.md                # Sonnet: Editing and refinement
│   ├── critic.md                # Opus: Quality evaluation (read-only)
│   ├── lore-keeper.md           # Sonnet: Setting/consistency management
│   ├── plot-architect.md        # Opus: Plot structure design
│   ├── proofreader.md           # Haiku: Spell checking
│   ├── summarizer.md            # Haiku: Chapter summarization
│   ├── beta-reader.md           # Sonnet: Reader engagement analysis
│   ├── genre-validator.md       # Sonnet: Genre requirement validation
│   ├── consistency-verifier.md  # Sonnet: Logic/continuity verification
│   ├── character-voice-analyzer.md # Sonnet: Character speech pattern analysis
│   ├── dialogue-analyzer.md     # Sonnet: Dialogue quality analysis
│   ├── tension-tracker.md       # Sonnet: Dramatic tension monitoring
│   ├── plot-consistency-analyzer.md # Sonnet: Plot logic verification
│   ├── engagement-optimizer.md  # Sonnet: Reader engagement optimization
│   ├── pacing-analyzer.md       # Sonnet: Story pacing analysis
│   ├── prose-quality-analyzer.md# Sonnet: Writing quality analysis
│   ├── AGENTS.md                # Agent documentation index
│   └── [ADDITIONAL_SPECIALIZED_AGENTS] # Specialized verification agents
├── schemas/                     # JSON schema definitions
│   ├── project.schema.json      # Project metadata schema
│   ├── chapter.schema.json      # Chapter content schema
│   ├── character.schema.json    # Character profile schema
│   ├── [other schemas...]       # Additional validation schemas
├── scripts/                     # Build, validation, and utility scripts
│   ├── validate-schemas.mjs     # Validate schema files
│   ├── validate-agents.mjs      # Validate agent definitions
│   ├── verify-build.mjs         # Verify TypeScript compilation
│   ├── integration-test.mjs     # Integration testing
│   └── lib/                     # Utility functions for scripts
│       └── [helper modules]
├── hooks/                       # Python hooks for schema validation
│   ├── validate_schema.py       # JSON schema validation
│   └── __pycache__/             # Python bytecode (generated)
├── templates/                   # Template files for project generation
│   ├── [template files]         # Project initialization templates
├── .planning/                   # Planning documents
│   └── codebase/                # Codebase analysis documents
│       ├── ARCHITECTURE.md      # Architecture analysis
│       ├── STRUCTURE.md         # This file
│       └── [other analysis docs]
├── .claude-plugin/              # Claude plugin configuration
│   └── plugin.json              # Plugin metadata
├── package.json                 # NPM package definition
├── tsconfig.json                # TypeScript configuration
├── vitest.config.ts             # Vitest test runner configuration
├── .gitignore                   # Git ignore rules
├── README.md                    # Project documentation
├── AGENTS.md                    # Agent documentation index
├── COMMAND_DEPS.md              # Command dependency mapping
└── [other config files]
```

## Directory Purposes

**src/:**
- Purpose: Core TypeScript library code compiled to JavaScript
- Contains: Type definitions, context loader, state manager, quality gate logic
- Key files: `types.ts` (500+ lines), `context/loader.ts`, `state/lock.ts`
- Access: Imported by skills/commands, not directly by users

**dist/:**
- Purpose: Compiled JavaScript output (build artifact)
- Contains: .js and .d.ts files corresponding to src/
- Generated: By `npm run build` (tsc command)
- Committed: No (gitignore)
- Usage: Loaded at runtime by Claude Code plugin system

**skills/:**
- Purpose: Plugin skill definitions with orchestration logic
- Contains: 40+ skill directories, each with SKILL.md and supporting files
- Naming: snake-case directory names matching command names (e.g., `design-character/`, `write-all/`)
- Structure: Each skill typically has:
  - `SKILL.md`: Skill definition with metadata, examples, workflow
  - `examples/`: Example usage scenarios
  - `references/`: Background research or knowledge resources
  - `.claude.md`: Orchestration instructions for the plugin system

**commands/:**
- Purpose: CLI command definitions that trigger skills
- Contains: 24 markdown files defining user-invocable commands
- Naming: `NN-command-name.md` (numbers define execution order/grouping)
- Format: YAML frontmatter with command metadata + workflow instructions
- Trigger: User invocation via `/command` in Claude Code

**agents/:**
- Purpose: Specialized Claude agent definitions for delegated work
- Contains: 18 markdown files with agent system prompts and capabilities
- Naming: `agent-name.md`
- Model Assignment: Specified in metadata (Opus for complex reasoning, Sonnet for balanced, Haiku for light tasks)
- Types: Core agents (novelist, editor, critic), specialized agents (character-voice-analyzer, consistency-verifier), utility agents (summarizer, proofreader)

**tests/:**
- Purpose: Automated test suite for core modules
- Contains: Unit tests for context loader, state manager, quality gate, token estimator
- Structure: Mirrors src/ structure (`tests/context/`, `tests/state/`, `tests/retry/`)
- Format: Vitest test files (.test.ts)
- Run: `npm run test`, `npm run test:watch`, `npm run test:coverage`

**schemas/:**
- Purpose: JSON Schema definitions for novel project structure validation
- Contains: Schema files for projects, chapters, characters, worlds, etc.
- Format: JSON Schema format (.schema.json)
- Validation: Scripts validate against these schemas before build
- Sync Notes: Some schema definitions synchronized with `src/types.ts` (documented in comments)

**scripts/:**
- Purpose: Build, validation, and utility automation
- Contains: Node.js scripts (.mjs) and Python hooks
- Key scripts:
  - `validate-schemas.mjs`: Verify schema files are valid
  - `validate-agents.mjs`: Verify agent definitions
  - `verify-build.mjs`: Post-build verification
  - `integration-test.mjs`: End-to-end testing

**hooks/:**
- Purpose: Python scripts for validation outside Node.js
- Contains: Schema validation, agent validation
- Language: Python 3.10+ (required in README)
- Invocation: Called by npm scripts, not directly by TypeScript

**templates/:**
- Purpose: Template files for initializing new novel projects
- Contains: Boilerplate project structure, example files
- Usage: Copied by `/init` command to user's project directory

**.planning/codebase/:**
- Purpose: Codebase analysis documentation for future Claude instances
- Contains: ARCHITECTURE.md, STRUCTURE.md, CONVENTIONS.md, TESTING.md, CONCERNS.md
- Format: Markdown with file paths, code examples, prescriptive guidance
- Usage: Loaded by `/gsd:plan-phase` and `/gsd:execute-phase` commands

## Key File Locations

**Entry Points:**
- `src/index.ts`: TypeScript library entry point - exports all public APIs
- `.claude-plugin/plugin.json`: Plugin metadata (name, version, skills path)
- `commands/16-write-all.md`: Main command for Ralph Loop automation
- `commands/novel-autopilot.md`: Full end-to-end automation command

**Configuration:**
- `package.json`: NPM dependencies (zod, archiver, typescript, vitest), build scripts, metadata
- `tsconfig.json`: TypeScript compilation settings
- `vitest.config.ts`: Test runner configuration
- `.claude-plugin/plugin.json`: Plugin registration

**Core Logic:**
- `src/types.ts`: 500+ lines of comprehensive type definitions (start here for data model understanding)
- `src/context/loader.ts`: Context loading orchestrator with budget management
- `src/context/priorities.ts`: Dynamic priority calculation algorithm
- `src/context/estimator.ts`: Korean/English token estimation with language-specific factors
- `src/state/lock.ts`: Atomic locking implementation using O_CREAT|O_EXCL
- `src/retry/quality-gate.ts`: 4-stage retry strategy for failed chapters

**Testing:**
- `tests/context/estimator.test.ts`: Token estimation tests
- `tests/context/priorities.test.ts`: Priority calculation tests
- `tests/retry/quality-gate.test.ts`: Retry strategy tests
- `tests/state/state.test.ts`: Locking and backup tests
- `tests/smoke.test.ts`: Integration smoke tests

## Naming Conventions

**Files:**
- TypeScript/JavaScript source: `camelCase.ts` (e.g., `estimator.ts`, `loader.ts`)
- Skill directories: `kebab-case` (e.g., `design-character`, `write-all`)
- Command files: `NN-kebab-case.md` where NN is numeric order (e.g., `03-init.md`, `16-write-all.md`)
- Agent definitions: `kebab-case.md` (e.g., `character-voice-analyzer.md`)
- Schema files: `noun.schema.json` (e.g., `project.schema.json`, `chapter.schema.json`)
- Test files: `name.test.ts` or `name.spec.ts` (e.g., `estimator.test.ts`)

**Directories:**
- Core modules: `lowercase` (e.g., `context`, `state`, `retry`)
- Plugin surface: `kebab-case` (e.g., `design-character`, `write-all`)
- Subfolders: `lowercase` for logical grouping (e.g., `examples/`, `references/`, `lib/`)

**TypeScript/JavaScript:**
- Interfaces/Types: `PascalCase` (e.g., ContextBudget, ContextItem, ProjectPaths)
- Enums: `PascalCase` (e.g., ContextType, RetryStrategy)
- Constants: `UPPER_SNAKE_CASE` (e.g., LOCK_TIMEOUT_MS, DEFAULT_BUDGET_CONFIG)
- Functions: `camelCase` (e.g., estimateTokens, getPriority, acquireLock)
- Variables: `camelCase` (e.g., candidates, currentTokens, priority)
- Private functions: Prefix with `_` or place in module scope (e.g., `_loadFile`, `sleep`)

**Exported vs Internal:**
- Exported from `index.ts`: Public API (used by skills/commands)
- Module-scoped: Internal helpers not exported (e.g., `collectCandidates` is async helper in loader)
- Re-exports: Use `export type` for types, `export { function }` for implementations

## Where to Add New Code

**New Feature (Novel Writing Skill):**
- Primary code: Create skill in `skills/new-feature-name/SKILL.md` with orchestration logic
- Tests: Add test file `tests/skills/new-feature-name.test.ts` (if testing core logic)
- Configuration: Add command in `commands/NN-new-feature.md` if user-invocable
- Agents: Reference existing agents or define new agent in `agents/` if specialized behavior needed

**New Agent (Specialized Evaluator):**
- Implementation: Create `agents/agent-name.md` with system prompt and capabilities
- Integration: Reference in agent orchestration (skills that delegate to it)
- Model: Specify model (opus/sonnet/haiku) in agent metadata
- Read-Only Flag: Set `read_only: true` if agent should not modify project files (e.g., critic)

**Core Algorithm Change (Token Estimation, Priority Calculation):**
- Implementation: Modify corresponding file in `src/` (e.g., `src/context/estimator.ts`)
- Tests: Add test cases to `tests/context/estimator.test.ts`
- Build: Run `npm run build` to compile
- Validation: Run `npm run test` to verify no regressions

**New Context Type:**
- Type Definition: Add interface to `src/types.ts`
- Estimator: Add token estimation case to `src/context/estimator.ts`
- Priority: Add base priority and required flag to `src/context/priorities.ts`
- Loader: Add candidate collection logic to `src/context/loader.ts`
- Schema: Add JSON schema to `schemas/` if persisting to disk

**Utility Skill (Standalone Analysis Tool):**
- Implementation: Create skill in `skills/utility-name/SKILL.md`
- Command: Create command in `commands/NN-utility-name.md`
- Agents: Delegate to appropriate agent (or create new specialized agent)
- No core module changes needed if using existing context/state APIs

**State-Dependent Logic (Ralph Loop Modification):**
- State Interface: Update `NovelState` in `src/types.ts` if new fields needed
- State Operations: Use `withStateBackup()` from `src/state/backup.ts` to wrap modifications
- Locking: Call `acquireLock()` before state file access
- Testing: Add state transition test to `tests/state/state.test.ts`

## Special Directories

**dist/:**
- Purpose: Compiled JavaScript output (build artifact)
- Generated: Yes (by `npm run build` via TypeScript compiler)
- Committed: No (listed in .gitignore)
- Cleanup: `npm run clean` removes entire dist/ directory before rebuild

**.planning/codebase/:**
- Purpose: Codebase analysis documentation created by `/gsd:map-codebase`
- Contains: ARCHITECTURE.md, STRUCTURE.md, CONVENTIONS.md, TESTING.md, CONCERNS.md
- Generated: Yes (by orchestrator tools)
- Committed: Yes (consumed by planning and execution phases)
- Updates: Regenerated when codebase structure significantly changes

**skills/*/references/ and /examples/:**
- Purpose: Knowledge base and usage examples for skill documentation
- Examples: AI-slop-detector has comprehensive pattern dictionary in references/
- Format: Markdown documentation files
- Usage: Embedded in skill execution context for agent reference
- Committed: Yes (part of skill definition)

**hooks/__pycache__/:**
- Purpose: Python bytecode cache
- Generated: Yes (by Python interpreter)
- Committed: No (listed in .gitignore)
- Cleanup: Safe to delete, automatically regenerated

---

*Structure analysis: 2026-02-05*
