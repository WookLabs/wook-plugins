---
name: init
description: |
  Triggers when user wants to initialize a new novel project from BLUEPRINT.md.
  <example>소설 시작</example>
  <example>프로젝트 생성</example>
  <example>initialize novel</example>
  <example>/init --from-blueprint</example>
  <example>새 소설 만들기</example>
  <example>웹소설 프로젝트 시작</example>
user-invocable: true
---

# /init - 프로젝트 초기화

BLUEPRINT.md 기획서를 완전한 프로젝트 구조로 변환합니다.

## Prerequisites

**REQUIRED**: BLUEPRINT.md 파일이 존재해야 합니다.

BLUEPRINT.md가 없으면:
```bash
/blueprint-gen "작품 아이디어"
```
먼저 실행하여 기획서를 생성하세요.

## Quick Start
```bash
# Step 1: Generate blueprint (if not exists)
/blueprint-gen "계약 연애로 시작해 진짜 사랑을 찾는 로맨스"

# Step 2: Initialize project from blueprint
/init --from-blueprint
```

## What It Creates

### Complete Project Structure
```
novels/{novel_id}/
├── meta/           # project.json, style-guide.json, ralph-state.json
├── world/          # world.json (setting, rules, locations)
├── characters/     # Character profiles
├── plot/           # structure.json (acts, synopsis)
├── chapters/       # Plot files (.json) and manuscripts (.md)
├── context/        # Chapter summaries for context
├── reviews/        # Quality evaluations and history
└── exports/        # Publication formats (epub, pdf, txt)
```

### Generated Files

1. **meta/project.json**
   - Project ID (novel_YYYYMMDD_HHmmss)
   - Title, genre, tropes, tone
   - Target chapters and word count
   - Progress tracking

2. **plot/structure.json**
   - Story structure (3-act, 5-act, Hero's Journey, etc.)
   - Act breakdown with chapter ranges
   - Logline and synopsis
   - Character arcs per act

3. **meta/style-guide.json**
   - Narrative voice and POV
   - Tone and pacing defaults
   - Taboo words and preferred expressions
   - Chapter structure requirements

4. **CLAUDE.md** (신규)
   - AI 협업 가이드
   - 프로젝트 개요 및 핵심 설정
   - 작업 규칙 및 품질 기준
   - 워크플로우 가이드 및 명령어
   - 현재 상태 추적 (자동 업데이트)

## Key Features

### BLUEPRINT.md Based
- Reads existing BLUEPRINT.md from current directory
- Extracts all metadata (genre, tropes, structure)
- No redundant questions - everything in blueprint

### Intelligent Conversion
- plot-architect agent converts blueprint to project structure
- Genre-appropriate defaults from recipes
- Character profiles from blueprint
- Plot structure from 3-act outline

### Customization Options
```bash
/init --from-blueprint           # Standard initialization
/init --from-blueprint --chapters=30  # Override chapter count
/init --from-blueprint --output=novels/my-novel  # Custom path
```

## Genre Recipe System

Recipes are automatically applied based on BLUEPRINT.md metadata.

### Automatic Recipe Selection
- Blueprint's genre field determines recipe
- No manual --recipe needed
- Override only if blueprint genre is incorrect

### Available Recipes

| Recipe | Genre | Description |
|--------|-------|-------------|
| `romance` | Romance | Modern romance defaults |
| `romance-contract` | Romance | Contract relationship stories |
| `romance-ceo` | Romance | CEO/Chaebol romance |
| `fantasy` | Fantasy | Isekai fantasy defaults |
| `fantasy-regression` | Fantasy | Regression/Time-travel |
| `fantasy-hunter` | Fantasy | Hunter/Dungeon stories |
| `bl` | BL | BL romance defaults |
| `thriller` | Thriller | Thriller/Mystery |

### What Recipes Provide
- **Defaults**: Target chapters, words per chapter, rating, structure type
- **Style Guide**: Narrative voice, POV, tone, dialogue ratio
- **Required Tropes**: Must-have genre elements
- **Required Beats**: Emotional beats with frequency guidelines
- **Validation Rules**: Critic/Beta/Genre validator thresholds
- **Plot Milestones**: Key events with chapter ranges
- **Recommended Cliches**: Safe/careful/risky tiers

### Recipe Documentation
See `templates/recipes/README.md` for full recipe schema and customization guide.

## Error Handling

### Missing BLUEPRINT.md
```
ERROR: BLUEPRINT.md not found in current directory.

Please run:
  /blueprint-gen "your story idea"

Then retry /init --from-blueprint
```

### Invalid Blueprint Format
```
ERROR: BLUEPRINT.md exists but missing required fields.

Required sections:
- 로그라인
- 장르
- 3막 구조
- 핵심 캐릭터

Please regenerate with /blueprint-gen
```

## Documentation

**Detailed Guide**: See `references/detailed-guide.md`
- Project ID generation
- Directory structure details
- plot-architect agent prompts
- File schemas and formats
- BLUEPRINT.md parsing

**Usage Examples**: See `examples/example-usage.md`
- Basic initialization workflows
- Customization examples
- Multi-project management
- Post-initialization steps
