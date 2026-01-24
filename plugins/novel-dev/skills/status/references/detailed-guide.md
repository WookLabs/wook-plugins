# Status Skill - Detailed Guide

## Overview

The status skill provides a comprehensive overview of your novel project's workflow progress, showing which design and writing phases have been completed and what remains to be done.

## Status vs Stats

| Command | Purpose | Focus |
|---------|---------|-------|
| `/status` | Workflow progress | Where am I in the process? |
| `/stats` | Content metrics | How much have I created? |

## Phase Detection System

The skill automatically detects completion based on file existence:

### Phase 1: Initialization
**Check**: `meta/project.json` exists → [x] init

### Phase 2: Design
- `world/world.json` → [x] design-world
- `characters/*.json` → [x] design-character (N chars)
- `plot/main-arc.json` → [x] design-main-arc
- `plot/foreshadowing.json` → [x] design-foreshadow (N elements)
- `plot/hooks.json` → [x] design-hook (N hooks)
- `meta/style-guide.json` → [x] design-style

### Phase 3: Plot Generation
**Check**: `chapters/chapter_001.json` → [x] gen-plot

### Phase 4: Writing
**Progress**: Counts `chapters/chapter_*.md` files → [~] write (12/50)

### Phase 5: Review
- `reviews/*_review.json` → [x] evaluate
- `reviews/consistency-report.json` → [x] consistency-check

## Output Format

Shows workflow checklist with completion status, current chapter, Ralph state, and recommended next steps.

## Best Practices

### Check Status Regularly
Run `/status` after each major step to see what's next.

### Use Status to Resume Work
After breaks, `/status` shows exactly where you left off.

### Validate Workflow Sequence
Status alerts if you've skipped prerequisite steps.

## Ralph State Integration

If `meta/ralph-state.json` exists, shows:
- Current chapter being written
- Ralph loop active/inactive
- Resumable session available

For complete documentation, see the SKILL.md file in: skills/status/
