<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-01-18 -->

# scripts

## Purpose

Utility scripts for Novel-Sisyphus project lifecycle management. Contains CLI commands for state management, testing, data generation, and hook scripts that integrate with the novel writing workflow.

## Key Files

### Core Utility Scripts

- **backup.mjs** - Creates timestamped compressed backups of novel project state
  - Backs up: ralph-state.json, chapter files (MD/JSON), plot structure, foreshadowing data
  - Creates .tar.gz archives in .sisyphus/backups/
  - Usage: `node backup.mjs [projectPath]`

- **migrate-state.mjs** - Migrates legacy state files from v1 format to current schema
  - Handles old .sisyphus/novel-state.json → meta/ralph-state.json migration
  - Auto-detects current chapter count from file system
  - Creates backup of existing files before migration
  - Usage: `node migrate-state.mjs [projectPath]`

### Testing & Data Generation

- **integration-test.mjs** - Comprehensive integration test suite
  - Tests: state file detection, context budget system, schema validation, hook scripts
  - Verifies 100-chapter test project completeness
  - Tests path resolution and context loading
  - Run before releases to validate system integrity

- **generate-test-data.mjs** - Generates complete 100-chapter test project
  - Creates: 10 characters, 15 world locations, 20 foreshadowing items
  - Generates 100 chapter metadata files with full schema compliance
  - Creates 5 chapter summaries for testing
  - Output: test-project/novels/novel_20250117_100000/

### Ralph Loop Hooks

These are integration points that respond to system events during novel writing sessions.

- **act-completion.mjs** - Handles act/chapter completion during Ralph Loop
  - Reads transcript for assistant messages and promise tags
  - Tracks `<promise>ACT_N_DONE</promise>` and `<promise>NOVEL_DONE</promise>` markers
  - Increments iteration counter and manages state transitions
  - Enforces max_iterations limit
  - Triggers continuation or completion logic

- **session-start.mjs** - Displays project status when session begins
  - Detects most recent novel project by created_at timestamp
  - Shows progress: completed/target chapters with percentage
  - Displays Ralph Loop status if active
  - Lists available commands for user
  - Fallback to alphabetical sort if timestamps missing

- **novel-state-detector.mjs** - Detects novel-related keywords in user input
  - Keywords: 소설|집필|원고|회차|캐릭터|세계관|플롯|복선|떡밥|퇴고 (Korean novel terms)
  - English keywords: write|init|design|gen.?plot|revise|evaluate|export
  - Shows Ralph Loop reminder if loop is active
  - Suggests `/init` command if no projects exist
  - Cleans code blocks from input before processing

## For AI Agents

### When Working with These Scripts:

1. **State Management**: Always use lib/state-utils.mjs functions (findStateFile, readState, writeState) rather than direct file I/O. Handles both new and legacy paths.

2. **Hook Scripts**: These respond to specific events:
   - session-start.mjs runs when user opens terminal
   - novel-state-detector.mjs runs before processing user input
   - act-completion.mjs runs when Ralph Loop stops (handles continuation logic)

3. **Testing**: Run `npm run test:integration` before committing state management changes. Tests validate:
   - State file format compliance
   - Schema validation for 100 test chapters
   - Path resolution for context loading
   - Hook script exports and functionality

4. **Data Generation**: The test project structure is authoritative:
   - 100 chapter JSON files in chapters/chapter_NNN.json format
   - Chapters follow chapter.schema.json structure
   - Must include: meta, context, narrative_elements, scenes, style_guide
   - context.current_plot must be 100+ characters
   - scenes use emotional_tone (not mood)

## Dependencies

### Internal Dependencies
- **lib/state-utils.mjs** - Used by act-completion.mjs, session-start.mjs, novel-state-detector.mjs
- **lib/context-budget.mjs** - Imported by context budget system (in src/)

### External Modules
- child_process (for tar backup operations in backup.mjs)
- fs/promises (for async file operations)
- path (for cross-platform path handling)

### Schema References
- ralph-state.schema.json (state file validation)
- project.schema.json (project metadata)
- chapter.schema.json (chapter structure validation)
- character.schema.json, world.schema.json, plot.schema.json (entity schemas)

### Related Project Areas
- **src/context/** - Context loading system that uses test data from generate-test-data.mjs
- **dist/context/index.js** - Compiled context module imported by context-budget.mjs
- **meta/** - Where current state files are stored (new location)
- **.sisyphus/** - Legacy location for old state files, also stores backups
