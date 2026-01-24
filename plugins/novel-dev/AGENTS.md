<!-- Generated: 2026-01-17 -->

# novel-dev

## Purpose

Novel-Sisyphus is a Claude Code plugin for AI-powered Korean novel writing. It provides a multi-agent orchestration system specifically designed for creative writing workflows, featuring 7 specialized agents and 18 commands that support the complete novel creation lifecycle from initial concept to final export.

This plugin adapts the oh-my-claude-sisyphus orchestration framework for creative writing, implementing:
- Agent-based workflow with specialized roles (novelist, editor, critic, lore-keeper, plot-architect, proofreader, summarizer)
- Ralph Loop for automated chapter writing with quality gates
- Comprehensive project structure with JSON schemas
- Korean-language literary conventions and best practices

## Key Files

| File | Description |
|------|-------------|
| `README.md` | Complete plugin documentation with workflow examples |
| `package.json` | NPM package configuration, TypeScript build scripts |
| `tsconfig.json` | TypeScript compiler configuration |
| `.claude-plugin/` | Claude Code plugin metadata |
| `src/types.ts` | TypeScript type definitions for all data structures |

## Subdirectories

| Directory | Purpose | Details |
|-----------|---------|---------|
| `agents/` | Agent prompt files | 7 specialized agent definitions (.md files) |
| `commands/` | Command implementations | 18 slash commands for writing workflow (.md files) |
| `schemas/` | JSON schemas | Data validation schemas for all project files |
| `templates/` | JSON templates | Default templates for project initialization |
| `scripts/` | Utility scripts | Helper scripts for workflow automation (.mjs files) |
| `hooks/` | Plugin hooks | Hook configuration for Claude Code integration |
| `test-project/` | Example project | Sample novel project structure for testing |

## Plugin Architecture

### Agent System

The plugin implements a multi-agent system with specialized roles:

| Agent | Model | Role |
|-------|-------|------|
| novelist | opus | Main prose writing |
| editor | sonnet | Revision and editing |
| critic | opus | Quality evaluation (read-only) |
| lore-keeper | sonnet | Worldbuilding and consistency |
| plot-architect | opus | Plot structure design |
| proofreader | haiku | Grammar and spelling |
| summarizer | haiku | Chapter summarization |
| chapter-verifier | sonnet | Automated chapter verification with parallel validators |

### Command Categories

Commands are organized by workflow phase:

1. **Initialization**: `/init` - Project setup
2. **Design**: `/design_*` - Worldbuilding, characters, plot arcs
3. **Plot Generation**: `/gen_plot` - Episode-level plot creation
4. **Writing**: `/write`, `/write_act`, `/write_all` - Prose creation
5. **Revision**: `/revise`, `/evaluate`, `/consistency_check` - Quality assurance
6. **Completion**: `/timeline`, `/stats`, `/export` - Finalization

### Ralph Loop

The `/write_all` command activates Ralph Loop mode:
- Automated act-by-act writing
- Quality gate at 70/100 points
- Automatic revision on failure (max 3 retries)
- User confirmation between acts

## Project Structure

Novel projects are stored in `novels/{novel_id}/` with this structure:

```
novels/{novel_id}/
├── meta/                    # Project metadata
│   ├── project.json        # Core project info
│   └── style-guide.json    # Writing style guidelines
├── world/                   # Worldbuilding
│   ├── world.json          # World settings
│   ├── locations.json      # Place descriptions
│   └── terms.json          # Terminology
├── characters/              # Character data
│   ├── {char_id}.json      # Individual characters
│   ├── index.json          # Character list
│   └── relationships.json  # Character relationships
├── plot/                    # Plot structure
│   ├── structure.json      # Overall structure
│   ├── main-arc.json       # Main storyline
│   ├── sub-arcs/           # Subplots
│   ├── foreshadowing.json  # Planted hints
│   └── hooks.json          # Story hooks
├── chapters/                # Written content
│   ├── chapter_001.json    # Chapter metadata
│   └── chapter_001.md      # Chapter prose
├── context/summaries/       # Chapter summaries
├── reviews/                 # Quality evaluations
└── exports/                 # Export outputs
```

## For AI Agents

### When Working With This Plugin

**DO:**
- Follow Korean literary conventions (show don't tell, natural dialogue, sensory details)
- Respect the workflow phases (design → plot → write → revise)
- Use quality gates - 70/100 minimum score for chapter approval
- Maintain consistency with established worldbuilding and characters
- Plant foreshadowing naturally without telegraphing
- Follow the style guide in `meta/style-guide.json`

**DON'T:**
- Skip planning phases and jump directly to writing
- Modify completed chapters without using the revision workflow
- Ignore quality evaluation scores
- Break character voice or world rules
- Use meta-commentary in prose output
- Violate taboo words listed in style guide

### Agent Selection Guide

Choose the appropriate agent based on task:

- **plot-architect**: Story structure, act breaks, dramatic arcs, plot design
- **lore-keeper**: Worldbuilding, character creation, consistency checks, setting details
- **novelist**: Prose writing, scene construction, dialogue, narrative flow
- **editor**: Revision, pacing fixes, style improvements, structural edits
- **critic**: Quality evaluation, feedback, scoring (does NOT modify content)
- **proofreader**: Grammar, spelling, typos, Korean language corrections
- **summarizer**: Chapter summaries, context building for subsequent chapters
- **chapter-verifier**: Quality verification before completion claims

### chapter-verifier (sonnet)

Automated chapter verification agent that validates quality before completion claims.

**Role**: Orchestrates parallel validators (critic, beta-reader, genre-validator) and generates pass/fail verdicts.

**When to Use**:
- After completing chapter writing
- Before claiming "done" on any chapter
- During write-all loop for each chapter

**Thresholds**:
| Validator | Normal | Chapter 1 |
|-----------|--------|-----------|
| critic | ≥85 | ≥90 |
| beta-reader | ≥75 | ≥80 |
| genre-validator | ≥90 | ≥95 |

### Common Workflows

**Starting a new novel:**
1. `/init` with genre and concept
2. `/design_world`, `/design_character`, `/design_main_arc`
3. `/gen_plot` to create episode structure
4. `/write_all` for automated writing with Ralph Loop

**Revising a chapter:**
1. Read `chapters/chapter_NNN.md` and `reviews/chapter_NNN_review.json`
2. Call editor agent with context
3. Update chapter file
4. Run `/evaluate` to verify improvement

**Checking consistency:**
1. `/consistency_check` to find violations
2. Review flagged issues
3. Either revise chapters or update canonical data (world/characters)

## Dependencies

**NPM Dependencies:**
- `typescript` (^5.0.0) - Build toolchain
- `@types/node` (^20.0.0) - Node.js type definitions

**Runtime Requirements:**
- Node.js >= 18.0.0
- Claude Code CLI (parent framework)

**Internal Dependencies:**
- Agent definitions depend on schemas for validation
- Commands depend on agent definitions
- Scripts depend on project structure conventions

## Build and Development

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Watch mode for development
npm run watch

# Clean build artifacts
npm run clean
```

Output is compiled to `dist/` directory.

## Quality Standards

The plugin enforces quality through multiple mechanisms:

1. **Quality Gates**: 70/100 minimum score (25 points each for narrative quality, plot coherence, character consistency, worldbuilding adherence)
2. **Consistency Checks**: Automated validation of character traits, timeline, world rules
3. **Style Guide Enforcement**: Tone, pacing, POV, taboo words validated
4. **Schema Validation**: All JSON files validated against schemas

## Extension Points

To add new functionality:

- **New Agent**: Create `.md` file in `agents/` with frontmatter (name, description, model)
- **New Command**: Create `.md` file in `commands/` with description and workflow
- **New Schema**: Add JSON schema to `schemas/` following existing patterns
- **New Template**: Add default JSON to `templates/`
- **New Hook**: Update `hooks/hooks.json` with hook configuration

## License

MIT - See README.md for full details
