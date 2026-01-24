<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-01-18 -->

# hooks

## Purpose

The hooks directory contains Claude Code plugin hook configurations and documentation that integrate the novel-dev plugin with the Claude Code runtime environment. These hooks trigger automated actions at specific lifecycle points:

- **SessionStart**: Display current project status when a session begins
- **UserPromptSubmit**: Detect novel state changes when user submits prompts
- **Stop**: Execute completion and cleanup tasks when the session ends

This enables the plugin to maintain context awareness and automate routine workflows without explicit user commands.

## Key Files

| File | Description |
|------|-------------|
| `hooks.json` | Plugin hook configuration with command mappings for three lifecycle events |
| `session-start.md` | Documentation for the SessionStart hook - displays project status on session init |

## Hook System Overview

### SessionStart Hook

**Trigger**: When a Claude Code session begins
**Action**: Executes `scripts/session-start.mjs`
**Display Information**:
- Current active project name
- Writing progress (completed chapters / target chapters)
- Current workflow state (planning, writing, editing)
- Ralph Loop activation status

**Purpose**: Provides immediate context about the current novel project without requiring explicit commands.

### UserPromptSubmit Hook

**Trigger**: When user submits a prompt to Claude
**Action**: Executes `scripts/novel-state-detector.mjs`
**Purpose**: Detects changes in novel project state and updates internal tracking

### Stop Hook

**Trigger**: When Claude Code session ends
**Action**: Executes `scripts/act-completion.mjs`
**Purpose**: Performs cleanup and completion tasks (e.g., save state, close active workflows)

## For AI Agents

### When Working With Hooks

**DO:**
- Understand that hooks run automatically and provide plugin integration points
- Review hook configurations before modifying plugin behavior
- Check timeout values (currently 5 seconds per hook) when adding new hooks
- Use hooks for session context (not for critical writing operations)

**DON'T:**
- Modify hook.json without understanding the execution flow
- Add hooks with timeouts > 10 seconds (plugin responsiveness impact)
- Override core hooks (SessionStart, UserPromptSubmit, Stop) without careful consideration
- Place logic in hooks that should be in commands or agents

### Hook Configuration Schema

Each hook in `hooks.json` contains:
```json
{
  "hook": "HookName",
  "matcher": "*",
  "hooks": [
    {
      "type": "command",
      "command": "node \"${CLAUDE_PLUGIN_ROOT}/scripts/script-name.mjs\"",
      "timeout": 5
    }
  ]
}
```

**Fields**:
- `hook`: Lifecycle event name (SessionStart, UserPromptSubmit, Stop)
- `matcher`: Pattern matching (use "*" for all contexts)
- `type`: Always "command" for plugin hooks
- `command`: Executable command with `${CLAUDE_PLUGIN_ROOT}` variable expansion
- `timeout`: Maximum seconds to wait for hook completion

## Dependencies

**Internal Dependencies:**
- Hooks depend on scripts in `scripts/` directory:
  - `scripts/session-start.mjs` - Display project status
  - `scripts/novel-state-detector.mjs` - Track state changes
  - `scripts/act-completion.mjs` - Handle session cleanup
- Hooks access project structure and metadata files
- Context depends on novel projects in `test-project/novels/`

**External Dependencies:**
- Claude Code plugin runtime environment
- Node.js >= 18.0.0 (for .mjs script execution)

**Related Components:**
- Hooks provide integration for all plugin agents and commands
- Coordinates with `commands/` for user-initiated workflows
- Accesses metadata from `test-project/` for status display
