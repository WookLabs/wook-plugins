---
name: 03-init
description: BLUEPRINT.md 기반 소설 프로젝트 초기화
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

### Mode 선택 (최초 1회)

`.omc/state/novel-dev-prefs.json`이 없으면 AskUserQuestion으로 모드를 선택합니다:

질문: "어떤 모드로 작업하시겠습니까?"
옵션:
- "Simple (5단계, 가이드)" — 처음 사용자에게 추천. `/quickstart`로 안내됩니다.
- "Standard (17 커맨드)" — 단계별 수동 실행
- "Expert (40+ 스킬)" — 전체 기능 접근

선택 결과를 `.omc/state/novel-dev-prefs.json`에 저장합니다:
```json
{
  "mode": "simple",
  "updatedAt": "2026-01-29T10:30:00.000Z"
}
```

Simple 선택 시, init 완료 후 자동으로 `/quickstart` Step 2로 안내합니다.

### 집필 모드 선택

모드 선택 후, AskUserQuestion으로 집필 모드를 선택받습니다:

| 옵션 | 설명 |
|------|------|
| **Grok (성인소설)** | 모든 회차를 xAI Grok API로 집필. 콘텐츠 제한 없음. |
| **Claude (일반)** | 모든 회차를 Claude novelist 에이전트로 집필 (기본값) |
| **Hybrid (혼합, deprecated)** | 성인 키워드 감지 시 Grok, 나머지 Claude. 성인소설은 Grok 권장 |

선택에 따라 `meta/project.json`에 설정:

```json
{
  "writer_mode": "grok",
  "grok_config": {
    "model": "grok-4-1-fast-reasoning",
    "temperature": 0.85,
    "max_tokens": 8192
  }
}
```

- `"claude"` 선택 시 `writer_mode: "claude"`, `grok_config` 생략
- `"hybrid"` 선택 시 `writer_mode: "hybrid"`, `grok_config` 포함

**Grok 모드 선택 시** API 키 존재 확인:

```bash
node novel-dev/scripts/grok-writer.mjs --help 2>&1 | head -1
```

API 키가 없으면 설정 방법을 안내:
```
~/.env 파일에 다음을 추가하세요:
XAI_API_KEY=xai-xxxxxxxxxxxx

API 키는 https://console.x.ai 에서 발급받을 수 있습니다.
```

**Grok 모드 선택 시** `meta/style-guide.json`에 `adult_writing` 섹션도 함께 설정합니다:

```json
{
  "adult_writing": {
    "explicitness": "high",
    "emotional_focus": true,
    "sensory_detail": "all",
    "pacing": "gradual",
    "vocabulary_level": "literary"
  }
}
```

AskUserQuestion으로 사용자에게 커스터마이징 여부 확인:
- "기본값 사용" — 위 설정 그대로 적용
- "커스터마이징" — 각 항목별 선택
  - 수위: low(암시적) / medium(은유적) / high(직접적)
  - 감각: visual / tactile / emotional / all
  - 페이싱: quick / gradual / slow-burn
  - 어휘: crude(직설) / moderate(적당) / literary(문학적)

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
