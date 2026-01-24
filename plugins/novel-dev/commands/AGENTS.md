<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-01-17 -->

# commands

## Purpose

Contains implementation files for the 18 slash commands that drive the novel writing workflow. Each command is a Markdown file with a description and implementation logic that orchestrates agents, manages file I/O, and coordinates the multi-step processes involved in novel creation.

Commands are invoked by users via the Claude Code CLI (e.g., `/init`, `/write 5`, `/export md`) and handle the complete lifecycle from project initialization through final export.

## Key Files

### Initialization Commands

| File | Command | Purpose |
|------|---------|---------|
| `init.md` | `/init <idea>` | Creates project structure, invokes plot-architect for initial design, generates meta/project.json and plot/structure.json |
| `init-review.md` | `/init-review` | Reviews initial setup, validates structure, suggests improvements before proceeding to design phase |

### Design Commands

| File | Command | Purpose |
|------|---------|---------|
| `design-world.md` | `/design_world` | Invokes lore-keeper to create world.json, locations.json, terms.json with worldbuilding details |
| `design-character.md` | `/design_character` | Invokes lore-keeper to create character profiles, relationships, and character index |
| `design-main-arc.md` | `/design_main_arc` | Invokes plot-architect to design main storyline with dramatic beats across acts |
| `design-sub-arc.md` | `/design_sub_arc` | Invokes plot-architect to create subplot arcs that weave with main narrative |
| `design-foreshadowing.md` | `/design_foreshadowing` | Plans foreshadowing elements with IDs, plant locations, payoff locations |
| `design-hook.md` | `/design_hook` | Designs story hooks and cliffhangers for reader engagement |

### Plot Generation Commands

| File | Command | Purpose |
|------|---------|---------|
| `gen-plot.md` | `/gen_plot` | Invokes plot-architect to generate chapter_NNN.json for all episodes with scene-level plot beats |

### Writing Commands

| File | Command | Purpose |
|------|---------|---------|
| `write.md` | `/write <N>` | Invokes novelist to write chapter N, creates chapter_NNN.md and invokes summarizer for context |
| `write-act.md` | `/write_act <N>` | Writes all chapters in act N sequentially |
| `write-all.md` | `/write_all` | Activates Ralph Loop: writes entire novel act-by-act with quality gates and user confirmation |

### Revision Commands

| File | Command | Purpose |
|------|---------|---------|
| `revise.md` | `/revise <N>` | Invokes editor to revise chapter N based on critic feedback |
| `evaluate.md` | `/evaluate <N>` | Invokes critic to score chapter N, creates review JSON with scores and feedback |
| `consistency-check.md` | `/consistency_check` | Invokes lore-keeper to validate all chapters against canonical world/character data |

### Completion Commands

| File | Command | Purpose |
|------|---------|---------|
| `timeline.md` | `/timeline` | Generates visual timeline of story events from all chapters |
| `stats.md` | `/stats` | Shows progress statistics (chapters written, word counts, completion percentage) |
| `export.md` | `/export <format>` | Exports novel to specified format (md, txt, json) in exports/ directory |

## Command Architecture

### Common Command Structure

Commands follow this pattern:

```markdown
---
description: Brief command description
---

[NOVEL-SISYPHUS: Command Name]

$ARGUMENTS

## 실행 단계

1. Step 1: Description
2. Step 2: Description
   ...

## 출력 예시
Example outputs

## 에러 처리
Error scenarios and handling
```

### Workflow Phases

Commands are designed for sequential phases:

```
Phase 1: Initialization
  /init → /init-review

Phase 2: Design
  /design_world → /design_character → /design_main_arc → /design_sub_arc → /design_foreshadowing → /design_hook

Phase 3: Plot Generation
  /gen_plot

Phase 4: Writing
  /write <N> | /write_act <N> | /write_all

Phase 5: Revision
  /evaluate → /revise → /consistency_check

Phase 6: Completion
  /timeline → /stats → /export
```

### Ralph Loop Implementation

The `/write_all` command implements Ralph Loop:

1. Iterate through acts in sequence
2. For each chapter in act:
   - Invoke novelist agent
   - Invoke summarizer agent
   - Invoke critic agent
   - If score < 70: invoke editor (max 3 retries)
   - If score >= 70: mark chapter complete
3. After act completion:
   - Invoke editor for act-level revision
   - Request user confirmation to continue
4. Repeat until all acts complete
5. Output `<promise>NOVEL_DONE</promise>` when finished

## For AI Agents

### When to Use Commands vs Direct Agent Invocation

**Use Commands When:**
- You need complete workflow orchestration
- You need file I/O and project structure management
- You want user-facing output and error handling
- You need multi-step processes with state management

**Direct Agent Invocation When:**
- You need a single agent task
- You're building custom workflows
- You're testing agent behavior
- You need fine-grained control over inputs

### Command Invocation Examples

**From user:**
```bash
/init "현대 로맨스, 계약 연애 트로프, 50화 분량"
/design_world
/gen_plot
/write 1
/write_all
```

**From orchestration code:**
```javascript
// Commands are invoked via Claude Code's command system
// Not via Task tool - they're top-level entry points
```

### Common Command Workflows

**Complete Novel Creation:**
```
/init "concept"
/design_world
/design_character
/design_main_arc
/design_sub_arc
/gen_plot
/write_all  # Ralph Loop handles rest
/export md
```

**Targeted Chapter Revision:**
```
/evaluate 5              # Get scores
/revise 5               # Improve chapter
/evaluate 5             # Verify improvement
/consistency_check      # Ensure no violations
```

**Incremental Writing:**
```
/write 1
/write 2
/write 3
# Review progress
/stats
# Continue act-by-act
/write_act 2
```

### Quality Gates in Commands

Commands enforce quality at multiple levels:

1. **Schema Validation**: All JSON outputs validated against schemas
2. **Quality Scores**: `/evaluate` enforces 70/100 minimum
3. **Consistency Checks**: `/consistency_check` flags violations
4. **User Confirmation**: `/write_all` requires approval between acts
5. **Error Handling**: Commands catch and report errors gracefully

### File I/O Patterns

Commands manage project files following conventions:

**Read Operations:**
- `novels/{novel_id}/meta/project.json` - Project metadata
- `novels/{novel_id}/plot/structure.json` - Plot structure
- `novels/{novel_id}/chapters/chapter_NNN.json` - Chapter metadata
- `novels/{novel_id}/chapters/chapter_NNN.md` - Chapter prose
- `novels/{novel_id}/context/summaries/` - Chapter summaries

**Write Operations:**
- Commands use Write tool to create/update files
- Always update `project.json` timestamps
- Create review files in `reviews/` directory
- Export outputs to `exports/` directory

**Atomic Updates:**
- Read → Process → Write (never partial writes)
- Backup before destructive operations
- Validate before writing

### Error Scenarios

Common error handling patterns:

| Scenario | Command Behavior |
|----------|------------------|
| Project not found | Check if in `novels/` directory, offer to `/init` |
| Missing dependencies | Report missing files, suggest prerequisite commands |
| Agent failure | Retry with modified prompt or fallback approach |
| Schema validation failure | Report specific validation errors, suggest fixes |
| Quality gate failure | Retry with editor or request user intervention |
| File I/O error | Report error, suggest manual intervention |

### Command Extension

To add a new command:

1. Create `command-name.md` in this directory
2. Add frontmatter with description
3. Define execution steps (실행 단계)
4. Specify output format (출력 예시)
5. Document error handling (에러 처리)
6. Update parent `../AGENTS.md` to reference new command
7. Add to relevant workflow documentation

**Example:**
```markdown
---
description: Brief description of what this command does
---

[NOVEL-SISYPHUS: Command Name]

$ARGUMENTS

## 실행 단계

1. **Step Name**
   - Details
   - Agent invocation if needed

2. **Step Name**
   - Details

## 출력 예시
```json
{
  "example": "output"
}
```

## 에러 처리

| 상황 | 처리 |
|------|------|
| Error case | How to handle |
```

## Dependencies

**Commands depend on:**
- Agents in `../agents/` - Invoked via Task tool
- Schemas in `../schemas/` - For validation
- Templates in `../templates/` - For initialization
- Scripts in `../scripts/` - For helper functions
- Project structure in `novels/{novel_id}/` - File I/O target

**Inter-command dependencies:**
- `/design_*` commands require `/init` first
- `/gen_plot` requires design commands complete
- `/write` requires `/gen_plot` first
- `/revise` requires `/evaluate` first
- `/export` requires chapters written

## Testing Commands

Use the test project:

```bash
cd test-project
/init "test novel concept"
/design_world
/write 1
/evaluate 1
```

Test edge cases:
- Empty inputs
- Invalid chapter numbers
- Missing files
- Concurrent command execution
- Quality gate failures

## Command Best Practices

**DO:**
- Validate inputs before processing
- Provide clear progress indicators
- Report errors with actionable messages
- Update project metadata (timestamps, status)
- Create atomic file operations
- Use appropriate agents for tasks

**DON'T:**
- Skip workflow phases (e.g., write before gen_plot)
- Modify files without validation
- Swallow errors silently
- Create partially initialized projects
- Bypass quality gates
- Duplicate agent logic in commands
