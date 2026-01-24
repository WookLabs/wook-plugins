<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-01-18 -->

# lib

## Purpose

Shared utility modules for hook scripts and CLI commands. Provides state file management and context budget operations that bridge between the novel project structure and the TypeScript-compiled context system.

## Key Files

### State Management Utility

- **state-utils.mjs** - Core functions for reading and writing project state
  - `findStateFile(projectPath)` - Locates state file in new or legacy location
    - Returns: `{ path, isLegacy }` or null
    - New path priority: meta/ralph-state.json
    - Fallback: .sisyphus/novel-state.json (legacy)
    - Used by: act-completion.mjs, session-start.mjs, novel-state-detector.mjs

  - `readState(projectPath)` - Parses state JSON with legacy path warning
    - Returns: parsed state object or null
    - Logs warning if legacy file detected

  - `writeState(projectPath, state)` - Writes state to new canonical location
    - Always writes to meta/ralph-state.json
    - Ensures meta/ directory exists
    - Updates last_updated timestamp
    - Returns: path to written file

### Context Budget Wrapper

- **context-budget.mjs** - Interface to compiled TypeScript context loading system
  - `loadChapterContext(chapterNumber, projectPath, budget = 80000)` - Loads context within token budget
    - Calls: compiled dist/context/index.js loadContextWithBudget()
    - Returns: context object with items, currentTokens, maxTokens, overflow
    - Logs warnings for excluded items
    - Handles compilation errors gracefully
    - Default budget: 80,000 tokens
    - Used by: Ralph Loop writing system

## For AI Agents

### State File Workflow

1. **Always use state-utils functions** - Never read/write state files directly
2. **Legacy path awareness** - System supports both old and new state locations
   - Detect with: `findStateFile(projectPath)`
   - Read from either location with: `readState(projectPath)`
   - Write always goes to: `meta/ralph-state.json`
3. **State format** - Current schema_version: "2.0"
   - Key fields: novel_id, mode, current_chapter, current_act, ralph_active, iteration
   - See: schemas/ralph-state.schema.json

### Context Loading Workflow

1. **Load context for chapter writing** - Use `loadChapterContext()`
2. **Token budgeting** - System respects max token limits
   - Prioritizes: plot, characters, current chapter context
   - Logs excluded items to console
3. **Error handling** - Wrapper catches compilation issues
   - Requires: `npm run build` before use
   - Check: dist/context/index.js exists

### Hook Script Integration Points

When adding new hooks that need state/context access:

1. **State hooks**: Use state-utils.mjs functions, return JSON to stdout
2. **Context hooks**: Use context-budget.mjs, handles build dependencies
3. **Logging**: Console output visible in hook logs, use for debugging
4. **Error handling**: Always log to stderr, return safe defaults to stdout

## Dependencies

### External Modules
- path (for joining paths across platforms)
- fs / fs/promises (for file I/O)

### Related Modules
- `../context/index.js` (compiled TypeScript, dynamically imported by context-budget.mjs)
- `../backup.mjs` (uses state-utils for backup file discovery)
- `../migrate-state.mjs` (source of truth for state schema version)

### Project Structure Dependencies
- **meta/ralph-state.json** - Canonical state file location (new)
- **.sisyphus/novel-state.json** - Legacy state location (for backward compatibility)
- **dist/context/index.js** - Compiled context module (build artifact)
- **schemas/ralph-state.schema.json** - State validation schema

## Version Notes

- State schema version: 2.0 (introduced in migrate-state.mjs)
- Supports legacy v1 state files during migration
- Default context budget: 80,000 tokens
