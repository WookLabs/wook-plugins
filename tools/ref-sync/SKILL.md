---
name: ref-sync
description: Update all reference repositories in ref/ directory via git pull. Use when starting a development session or when you need the latest reference code.
allowed-tools: Bash, Read, Write
---

# ref-sync

Synchronize all reference repositories to get the latest updates.

## Purpose

Keep reference repositories up-to-date for accurate pattern reference during plugin development.

## Usage

Invoke this skill when:
- Starting a new development session
- Before comparing patterns across references
- When you suspect a reference has been updated upstream

## Workflow

1. **Iterate** through all subdirectories in `ref/`
2. **Check** if each is a git repository
3. **Fetch & Pull** latest changes from origin
4. **Update** `ref/_index.json` with sync timestamp
5. **Report** changes and any errors

## Script

Run the sync script:

```bash
node "${CLAUDE_PLUGIN_ROOT}/tools/ref-sync/sync.mjs"
```

Or manually for a single repo:

```bash
cd ref/[repo-name] && git fetch && git pull
```

## Output

Reports for each repository:
- Already up to date
- Updated (shows changed files count)
- Error (shows error message)

## Related

- `ref-compare` - Compare patterns across references
- `ref-stats` - Analyze reference repositories
