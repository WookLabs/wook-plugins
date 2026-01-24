# Command Dependency Graph (v3 - 번호 체계)

## Initialization Flow
```
/01-init → /02-world → /03-character → /04-main-arc → /05-sub-arc → /06-foreshadow → /07-hook → /08-plot
```

## Writing Flow
```
/08-plot → /09-write N → /13-evaluate N → [/12-revise N if score < 85]
```

## Full Project Flow
```
/01-init
  ↓
/02-world → /03-character
  ↓
/04-main-arc
  ↓
/05-sub-arc (optional, multiple)
  ↓
/06-foreshadow
  ↓
/07-hook
  ↓
/08-plot 1..N
  ↓
/11-write-all (Ralph Loop)
  ├── /09-write → /13-evaluate → [/12-revise]
  └── repeat until complete
  ↓
/14-check
  ↓
/15-export
```

## Status vs Stats

| Command | Purpose | Focus |
|---------|---------|-------|
| /status | 워크플로우 진행 | 어디까지 했는가? |
| /stats | 콘텐츠 통계 | 무엇을 만들었는가? |

## Dependencies by Command

| Command | Requires | Produces |
|---------|----------|----------|
| /01-init | (none) | meta/project.json, meta/style-guide.json, plot/structure.json |
| /02-world | meta/project.json | world/world.json, world/locations.json, world/terms.json |
| /03-character | meta/project.json | characters/*.json, characters/index.json, characters/relationships.json |
| /04-main-arc | plot/structure.json, characters/*.json | plot/main-arc.json |
| /05-sub-arc | plot/main-arc.json, characters/*.json | plot/sub-arcs/*.json |
| /06-foreshadow | plot/main-arc.json, plot/sub-arcs/*.json, characters/*.json | plot/foreshadowing.json |
| /07-hook | plot/main-arc.json, plot/foreshadowing.json | plot/hooks.json |
| /08-plot | meta/project.json, plot/structure.json, plot/main-arc.json, plot/sub-arcs/*.json, plot/foreshadowing.json, plot/hooks.json, characters/*.json, meta/style-guide.json | chapters/chapter_*.json |
| /09-write N | chapters/chapter_N.json, context/summaries/chapter_N-1_summary.md (if N>1), meta/style-guide.json, characters/*.json, world/locations.json | chapters/chapter_N.md, chapters/chapter_N_draft.md |
| /10-write-act N | plot/structure.json, chapter plot files for act | chapters/chapter_*.md (for act) |
| /11-write-all | All chapter plot files | All chapters in sequence |
| /12-revise N | chapters/chapter_N.md, reviews/chapter_N_review.json | chapters/chapter_N.md (updated) |
| /13-evaluate N | chapters/chapter_N.md | reviews/chapter_N_review.json, reviews/history/chapter_N.json |
| /14-check | world/*.json, characters/*.json, plot/*.json, chapters/*.md | reviews/consistency-report.json |
| /15-export | All completed chapters | exports/* |
| /status | meta/project.json, meta/ralph-state.json | (display only) |
| /stats | chapters/chapter_*.md | meta/statistics.json |
| /timeline | chapters/chapter_*.json | plot/timeline.json |

## Detailed Command Prerequisites

### /01-init
- **Requires**: Nothing
- **Produces**:
  - `meta/project.json` - Project metadata (title, genre, target chapters, etc.)
  - `meta/style-guide.json` - Writing style guidelines
  - `plot/structure.json` - Basic plot structure (acts)

### /02-world
- **Requires**:
  - `meta/project.json` - Project metadata for genre/tone
- **Produces**:
  - `world/world.json` - World settings (era, location, technology)
  - `world/locations.json` - Location database
  - `world/terms.json` - Terminology dictionary
- **Idempotency**: Merges with existing files, preserves user modifications

### /03-character
- **Requires**:
  - `meta/project.json` - Project metadata
- **Produces**:
  - `characters/{char_id}.json` - Individual character files
  - `characters/index.json` - Character list
  - `characters/relationships.json` - Relationship matrix
- **Idempotency**: Merges with existing files, preserves user modifications

### /04-main-arc
- **Requires**:
  - `plot/structure.json` - Plot structure
  - `characters/*.json` - Main characters
- **Produces**:
  - `plot/main-arc.json` - Main plot arc with major events
- **Idempotency**: Merges with existing files, preserves user modifications

### /05-sub-arc
- **Requires**:
  - `plot/main-arc.json` - Main arc for connection points
  - `characters/*.json` - Characters involved in subplots
- **Produces**:
  - `plot/sub-arcs/{arc_id}.json` - Individual subplot files
- **Idempotency**: Merges with existing files, preserves user modifications

### /06-foreshadow
- **Requires**:
  - `plot/main-arc.json` - Main arc events
  - `plot/sub-arcs/*.json` - Subplot events
  - `characters/*.json` - Character secrets
- **Produces**:
  - `plot/foreshadowing.json` - Foreshadowing database
- **Idempotency**: Merges with existing files, preserves user modifications

### /07-hook
- **Requires**:
  - `plot/main-arc.json` - Main arc for hook placement
  - `plot/foreshadowing.json` - Foreshadowing for mystery hooks
- **Produces**:
  - `plot/hooks.json` - Mystery hooks and chapter-end hooks
- **Idempotency**: Merges with existing files, preserves user modifications

### /08-plot
- **Requires**:
  - `meta/project.json` - Target chapter count
  - `meta/style-guide.json` - Style guide
  - `plot/structure.json` - Plot structure (at least skeleton)
  - `characters/` - At least one character file
  - `plot/main-arc.json` - Main arc
  - `plot/sub-arcs/*.json` - Subplots (optional)
  - `plot/foreshadowing.json` - Foreshadowing (optional)
  - `plot/hooks.json` - Hooks (optional)
- **Produces**:
  - `chapters/chapter_001.json` ~ `chapter_{N}.json` - Per-chapter plot outlines
- **Error Handling**: Reports missing files and suggests prerequisite commands

### /09-write N
- **Requires**:
  - `chapters/chapter_{N}.json` - Chapter plot outline
  - `context/summaries/chapter_{N-1}_summary.md` - Previous chapter summary (if N > 1)
  - `meta/style-guide.json` - Style guide
  - `characters/*.json` - Character information for those appearing
  - `world/locations.json` - Location information
- **Produces**:
  - `chapters/chapter_{N}.md` - Final chapter text
  - `chapters/chapter_{N}_draft.md` - Draft backup
  - `context/summaries/chapter_{N}_summary.md` - Chapter summary
- **Context Budget**: Uses 80K token budget, prioritizes style > plot > summaries > characters
- **Special Case**: Chapter 1 doesn't require previous summary

### /10-write-act N
- **Requires**:
  - `plot/structure.json` - Act boundaries
  - Chapter plot files for specified act
- **Produces**:
  - Chapter text files for specified act
- **Behavior**: Same as /11-write-all but limited to one act

### /11-write-all
- **Requires**:
  - All chapter plot files `chapters/chapter_*.json`
- **Produces**:
  - All chapter text files `chapters/chapter_*.md`
- **Behavior**: Ralph Loop that continues until all chapters are written
- **Quality Gate**: 85점 (마스터피스 모드), 3중 검증 (critic + beta-reader + genre-validator)
- **Note**: Automatically calls /09-write → /13-evaluate → /12-revise for each chapter

### /12-revise N
- **Requires**:
  - `chapters/chapter_{N}.md` - Original chapter text
  - `reviews/chapter_{N}_review.json` - Evaluation results
- **Produces**:
  - `chapters/chapter_{N}.md` - Revised chapter (overwrites)
  - `chapters/chapter_{N}_draft_v2.md` - Backup of revision

### /13-evaluate N
- **Requires**:
  - `chapters/chapter_{N}.md` - Completed chapter text
  - `chapters/chapter_{N}.json` - Chapter plot outline (for comparison)
  - `meta/style-guide.json` - Style guide (for evaluation)
- **Produces**:
  - `reviews/chapter_{N}_review.json` - Quality evaluation with score
  - `reviews/history/chapter_{N}.json` - Revision history (NEW)
- **Triggers**: /12-revise if score < 85 (마스터피스 모드)

### /14-check
- **Requires**:
  - `world/*.json` - World settings
  - `characters/*.json` - Character data
  - `plot/*.json` - Plot data
  - `chapters/*.md` - All written chapters
- **Produces**:
  - `reviews/consistency-report.json` - Inconsistency report
- **Chunking Strategy**: For > 20 chapters, processes in chunks of 10
- **Context Budget**: Uses Context Budget System per chunk

### /15-export
- **Requires**:
  - All completed chapters in `chapters/chapter_*.md`
  - `meta/project.json` - Project metadata
- **Produces**:
  - `exports/{project_id}.md` - Markdown export
  - `exports/{project_id}.txt` - Plain text export
  - `exports/{project_id}.html` - HTML export (optional)
  - `exports/{project_id}.epub` - EPUB format (optional)

### /status
- **Requires**:
  - `meta/project.json` - Project metadata
  - `meta/ralph-state.json` - Ralph state (optional)
- **Produces**:
  - (display only) - Shows workflow progress
- **Purpose**: Answer "어디까지 했는가?" (Where am I in the workflow?)

### /stats
- **Requires**:
  - `chapters/chapter_*.md` - Completed chapters
- **Produces**:
  - `meta/statistics.json` - Word counts, character appearances, etc.
- **Purpose**: Answer "무엇을 만들었는가?" (What did I create?)

### /timeline
- **Requires**:
  - `chapters/chapter_*.json` - Chapter metadata with time information
- **Produces**:
  - `plot/timeline.json` - Chronological timeline of events
- **Purpose**: Helps detect timeline inconsistencies

## Command Execution Order Recommendations

### For New Project
1. `/01-init` - Initialize project structure
2. `/02-world` - Build world settings
3. `/03-character` - Design all main characters
4. `/04-main-arc` - Create main plot arc
5. `/05-sub-arc` (multiple times) - Add subplots
6. `/06-foreshadow` - Plan foreshadowing
7. `/07-hook` - Add mystery hooks
8. `/08-plot` - Generate per-chapter plots
9. `/11-write-all` - Write all chapters (or `/09-write N` individually)
10. `/14-check` - Verify consistency
11. `/15-export` - Export final manuscript

### For Iterative Writing
1. `/01-init` → `/02-world` ~ `/07-hook` (steps 1-7 above)
2. `/08-plot 1-10` - Generate first act plots
3. `/10-write-act 1` - Write first act
4. `/14-check` - Check first act
5. `/08-plot 11-20` - Generate second act plots
6. `/10-write-act 2` - Write second act
7. Repeat until complete
8. `/14-check` - Final check
9. `/15-export` - Export

### For Single Chapter Development
1. Ensure prerequisites exist (design files, previous chapter summary)
2. `/09-write N` - Write chapter
3. `/13-evaluate N` - Evaluate quality
4. `/12-revise N` - Revise if needed (if score < 85)
5. Move to next chapter

## Error Prevention

### Common Missing Prerequisite Scenarios

| Attempted Command | Missing File | Suggested Fix |
|------------------|--------------|---------------|
| /08-plot | meta/project.json | Run /01-init first |
| /08-plot | characters/ (empty) | Run /03-character first |
| /08-plot | plot/structure.json | Run /01-init first |
| /09-write 2 | context/summaries/chapter_001_summary.md | Write chapter 1 first |
| /09-write 5 | chapters/chapter_005.json | Run /08-plot first |
| /04-main-arc | characters/*.json | Run /03-character first |
| /14-check | chapters/ (empty) | Write some chapters first |
| /15-export | chapters/ (incomplete) | Complete all chapters first |

## Idempotency Notes

All `/02-world` ~ `/07-hook` commands are idempotent:
- They read existing files before generating new content
- User modifications are preserved
- Only auto-generated fields are updated
- Warnings are shown for conflicting changes

This allows you to:
- Re-run design commands to add new content
- Regenerate without losing manual edits
- Iteratively refine designs

## Context Budget Integration

Commands that use Context Budget System (80K tokens):
- `/09-write N` - Prioritizes: style > plot > summaries > characters
- `/14-check` - Per chunk (10 chapters)
- `/13-evaluate N` - Loads context for evaluation

Overflow handling:
- Items exceeding budget are logged as warnings
- Most important context is always included
- Less critical context may be truncated

## Quality Gate (마스터피스 모드 v2)

| Validator | Threshold | 1화 Threshold | Role |
|-----------|-----------|---------------|------|
| critic | ≥85점 | ≥90점 | 품질 평가 |
| beta-reader | ≥75점 | ≥80점 | 몰입도/이탈 예측 |
| genre-validator | ≥90점 | ≥95점 | 장르 요구사항 |

**모든 validator가 통과해야 품질 게이트 통과**
