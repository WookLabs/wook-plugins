# Skill Renumbering & Team Consolidation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 04~12 설계 스킬을 04-design 팀 스킬로 통합, 17~19 퇴고 스킬을 09-review로 통합, 번호 재배치, 신규 에이전트 2개 추가

**Architecture:** 개별 설계 스킬 12개를 삭제하고 3개 팀 스킬(04-design, 04-design-review, 09-review)을 신규 생성한다. 5개 스킬을 git mv로 리네임한다. design-execution-team을 5명 에이전트로 확대하고 routing-rules.json을 전면 업데이트한다.

**Tech Stack:** Claude Code agents (.md), team definitions (.team.json), skills (.md), routing-rules.json

---

## File Structure

### 신규 생성

| 파일 | 책임 |
|------|------|
| `agents/character-designer.md` | 캐릭터 프로필 + 에이전트 파일 설계 전문 (opus) |
| `agents/arc-designer.md` | 서브아크/복선/훅 설계 전문 (sonnet) |
| `skills/04-design/SKILL.md` | 전체 설계 팀 스킬 (design-execution-team 호출) |
| `skills/04-design-review/SKILL.md` | 설계 리뷰 팀 스킬 (design-review-team 호출) |
| `skills/09-review/SKILL.md` | 퇴고/평가/검증 팀 스킬 (revision-team 호출) |

### 삭제

12개 스킬 디렉토리: `04-design-style`, `05-design-world`, `06-design-character`, `07-design-relationship`, `08-design-timeline`, `09-design-main-arc`, `10-design-sub-arc`, `11-design-foreshadow`, `12-design-hook`, `17-revise`, `18-evaluate`, `19-consistency-check`

### 리네임 (git mv)

| 기존 | 변경 |
|------|------|
| `skills/13-gen-plot/` | `skills/05-gen-plot/` |
| `skills/14-write/` | `skills/06-write/` |
| `skills/15-write-act/` | `skills/07-write-act/` |
| `skills/16-write-all/` | `skills/08-write-all/` |
| `skills/20-resume/` | `skills/10-resume/` |

### 수정

| 파일 | 변경 |
|------|------|
| `teams/design-execution-team.team.json` | 5명 에이전트, 새 파이프라인 |
| `scripts/routing-rules.json` | 전면 재작성 |
| `config/model-tiers.json` | character-designer, arc-designer 추가 |
| `agents/AGENTS.md` | 에이전트 목록 업데이트 |
| `teams/AGENTS.md` | 팀 문서 업데이트 |
| 리네임된 5개 SKILL.md | frontmatter name 필드 업데이트 |

---

### Task 1: New Agents (character-designer, arc-designer)

**Files:**
- Create: `agents/character-designer.md`
- Create: `agents/arc-designer.md`

- [ ] **Step 1: Create character-designer.md**

캐릭터 전문 설계 에이전트. 기존 lore-keeper의 캐릭터 설계 역할을 분리.

핵심 역할:
- 캐릭터 프로필 설계 (basic, inner, behavior, arc)
- `characters/{char_id}.json` 파일 생성
- `characters/index.json` 업데이트
- `agents/characters/{name}.md` 자동 생성 (collaborative writing용)

frontmatter: `name: character-designer`, `model: opus`, `tools: [Read, Write, Edit, Glob]`

참조할 스키마: `schemas/character.schema.json`, `schemas/voice-profile.schema.json`
참조할 템플릿: `agents/characters/_template.md` (Part 1 구조 가이드)

에이전트 파일 생성 시 role → model 매핑:
- protagonist/deuteragonist/antagonist → opus
- supporting → sonnet
- minor/cameo → haiku

- [ ] **Step 2: Create arc-designer.md**

서브아크/복선/훅 전문 설계 에이전트. 기존 plot-architect의 세부 구조 설계 역할을 분리.

핵심 역할:
- plot-architect가 설계한 메인 아크 기반으로 서브아크 설계
- 복선(foreshadowing) 배치 계획
- 챕터 말미 훅/클리프행어 설계

frontmatter: `name: arc-designer`, `model: sonnet`, `tools: [Read, Write, Edit, Glob]`

참조할 스키마: `schemas/sub-arc.schema.json`, `schemas/foreshadowing.schema.json`, `schemas/hooks.schema.json`

출력 파일:
- `plot/sub-arcs/*.json` (서브아크별 파일)
- `plot/foreshadowing.json`
- `plot/hooks.json`

- [ ] **Step 3: Commit**

```bash
git add agents/character-designer.md agents/arc-designer.md
git commit -m "feat(novel-dev): add character-designer and arc-designer agents"
```

---

### Task 2: New Skills (04-design, 04-design-review, 09-review)

**Files:**
- Create: `skills/04-design/SKILL.md`
- Create: `skills/04-design-review/SKILL.md`
- Create: `skills/09-review/SKILL.md`

- [ ] **Step 1: Create skills/04-design/SKILL.md**

스펙 섹션 5의 "04-design" 정의를 그대로 사용:

```markdown
---
name: 04-design
description: "Use this skill when designing all aspects of a novel project (style, world, characters, arcs, foreshadowing, hooks). Triggers on: '설계', '디자인', 'design'."
user-invocable: true
---

# /design - 소설 전체 설계

$ARGUMENTS

03-init 완료 후, 문체부터 훅까지 전체 설계를 팀으로 실행합니다.

## Quick Start

```bash
/design          # 전체 설계 실행
/design-review   # 설계 산출물 검토 및 수정
```

## Prerequisites

- 03-init 완료 (`plot/structure.json`, `meta/project.json` 존재)
- `BLUEPRINT.md` 존재

## 실행

team-orchestrator에 design-execution-team 실행을 위임합니다:

```spec
Task(subagent_type="novel-dev:team-orchestrator", model="sonnet", prompt="
팀 실행: design-execution-team
프로젝트: {projectPath}
")
```

## 팀 구성 (5명)

| 에이전트 | 모델 | 단계 | 산출물 |
|---------|------|------|--------|
| style-curator | sonnet | Step 1 | style-guide.json |
| lore-keeper | sonnet | Step 1, 3 | world.json, relationships.json |
| character-designer | opus | Step 2 | characters/*.json, agents/characters/*.md |
| plot-architect | opus | Step 3, 4 | timeline.json, main-arc.json |
| arc-designer | sonnet | Step 5-7 | sub-arcs/*.json, foreshadowing.json, hooks.json |

## 파이프라인

1. 문체 + 세계관 (병렬)
2. 캐릭터 설계 + 에이전트 생성
3. 관계도 + 타임라인 (병렬)
4. 메인 아크
5. 서브 아크
6. 복선
7. 훅

## 완료 후

```
[OK] 전체 설계 완료. /design-review로 검토하거나, /gen-plot으로 회차별 플롯을 생성하세요.
```
```

- [ ] **Step 2: Create skills/04-design-review/SKILL.md**

```markdown
---
name: 04-design-review
description: "Use this skill when reviewing and refining design artifacts from multiple angles. Triggers on: '설계 리뷰', '설계 검토', 'design review'."
user-invocable: true
---

# /design-review - 설계 산출물 검토

$ARGUMENTS

설계 완료 후, 4명의 전문가가 다각도로 검토합니다.

## Quick Start

```bash
/design-review   # 전체 설계 산출물 검토
```

## 실행

team-orchestrator에 design-review-team 실행을 위임합니다:

```spec
Task(subagent_type="novel-dev:team-orchestrator", model="sonnet", prompt="
팀 실행: design-review-team
프로젝트: {projectPath}
")
```

## 팀 구성 (4명, 병렬)

| 에이전트 | 역할 | 검토 관점 |
|---------|------|----------|
| critic | 서사 품질 | 구조적 완성도, 캐릭터 깊이 |
| lore-keeper | 세계관 일관성 | 설정 모순, 누락 |
| genre-validator | 장르 적합성 | 독자 기대 충족 |
| plot-architect | 플롯 구조 | 아크 균형, 긴장 곡선 |

## 결과

- 검토 리포트 + 수정 제안 제시
- 사용자 승인 후 수정 적용
```

- [ ] **Step 3: Create skills/09-review/SKILL.md**

```markdown
---
name: 09-review
description: "Use this skill when reviewing completed chapters (revision, evaluation, consistency check). Triggers on: '리뷰', '퇴고', '평가', '검증', 'review'."
user-invocable: true
---

# /review - 퇴고/평가/검증

$ARGUMENTS

완성된 챕터를 revision-team으로 퇴고 + 평가 + 일관성 검증합니다.

## Quick Start

```bash
/review 5        # 5화 리뷰
/review 1-10     # 1~10화 순차 리뷰
```

## 실행

### 단일 챕터

team-orchestrator에 revision-team 실행을 위임합니다:

```spec
Task(subagent_type="novel-dev:team-orchestrator", model="sonnet", prompt="
팀 실행: revision-team
대상: Chapter {chapterNumber}
프로젝트: {projectPath}
")
```

### 범위 지정 (N-M)

```spec
for chapter in range(N, M+1):
    Task(subagent_type="novel-dev:team-orchestrator", model="sonnet", prompt="
    팀 실행: revision-team
    대상: Chapter {chapter}
    프로젝트: {projectPath}
    ")
```

## 팀 구성 (4명, 파이프라인)

| 에이전트 | 모델 | 단계 | 역할 |
|---------|------|------|------|
| critic | opus | 1. 평가 | 4차원 품질 평가 (서사/플롯/캐릭터/배경) |
| editor | sonnet | 2. 퇴고 | 평가 기반 원고 수정 |
| proofreader | haiku | 3. 교정 | 맞춤법/문법/어법 |
| consistency-verifier | sonnet | 4. 검증 | 5도메인 일관성 체크 |

## Quality Gates

| 에이전트 | 기준 |
|---------|------|
| critic | >= 85 |
| consistency-verifier | >= 85 |

## 결과

- **성공**: editor 수정본이 최종본으로 저장
- **실패**: 원고 보존 + 경고 리포트
- **결과 파일**: `reviews/team/revision-team_ch{N}_{timestamp}.json`
```

- [ ] **Step 4: Commit**

```bash
git add skills/04-design/SKILL.md skills/04-design-review/SKILL.md skills/09-review/SKILL.md
git commit -m "feat(novel-dev): add 04-design, 04-design-review, 09-review team skills"
```

---

### Task 3: Delete Old Skills (12 directories)

**Files:**
- Delete: 12 skill directories

- [ ] **Step 1: Delete design skills (9)**

```bash
git rm -r skills/04-design-style skills/05-design-world skills/06-design-character \
  skills/07-design-relationship skills/08-design-timeline skills/09-design-main-arc \
  skills/10-design-sub-arc skills/11-design-foreshadow skills/12-design-hook
```

- [ ] **Step 2: Delete revise/evaluate/consistency skills (3)**

```bash
git rm -r skills/17-revise skills/18-evaluate skills/19-consistency-check
```

- [ ] **Step 3: Commit**

```bash
git commit -m "refactor(novel-dev): remove 12 individual design/review skills (replaced by team skills)"
```

---

### Task 4: Rename Skills (5 directories)

**Files:**
- Rename: 5 skill directories via git mv
- Modify: 5 SKILL.md frontmatter name fields

- [ ] **Step 1: git mv all 5 directories**

```bash
git mv skills/13-gen-plot skills/05-gen-plot
git mv skills/14-write skills/06-write
git mv skills/15-write-act skills/07-write-act
git mv skills/16-write-all skills/08-write-all
git mv skills/20-resume skills/10-resume
```

- [ ] **Step 2: Update frontmatter name fields**

각 SKILL.md의 frontmatter `name:` 필드를 새 이름으로 변경:

| 파일 | 기존 name | 변경 name |
|------|----------|----------|
| `skills/05-gen-plot/SKILL.md` | `13-gen-plot` | `05-gen-plot` |
| `skills/06-write/SKILL.md` | `14-write` | `06-write` |
| `skills/07-write-act/SKILL.md` | `15-write-act` | `07-write-act` |
| `skills/08-write-all/SKILL.md` | `08-write-all` | `08-write-all` |
| `skills/10-resume/SKILL.md` | `20-resume` | `10-resume` |

각 파일의 `name:` 줄을 Edit으로 변경.

- [ ] **Step 3: Update internal references in renamed skills**

리네임된 스킬 SKILL.md 내부에서 구 번호를 참조하는 부분 업데이트:

| 파일 | 변경할 참조 |
|------|-----------|
| `skills/06-write/SKILL.md` | `/revise` → `/review`, `/write-act` → 참조 확인 |
| `skills/07-write-act/SKILL.md` | `/write {chapter}` → 참조 확인, `/revise` → `/review`, `/evaluate` → `/review`, `/consistency-check` → `/review` |
| `skills/08-write-all/SKILL.md` | `/write` → 참조 확인, `/revise` → `/review`, `/evaluate` → `/review`, `/consistency-check` → `/review` |

핵심: `/revise`, `/evaluate`, `/consistency-check` 참조를 모두 `/review`로 변경.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "refactor(novel-dev): rename skills 13→05, 14→06, 15→07, 16→08, 20→10"
```

---

### Task 5: Update design-execution-team.team.json

**Files:**
- Modify: `teams/design-execution-team.team.json`

- [ ] **Step 1: Rewrite team definition with 5 agents**

전체 파일을 새 5명 구성으로 교체:

```json
{
  "$schema": "../schemas/team.schema.json",
  "schema_version": "1.0",
  "name": "design-execution-team",
  "display_name": "설계 실행 팀",
  "description": "5명 에이전트가 문체→세계관→캐릭터→관계→타임라인→아크→복선→훅까지 전체 설계를 파이프라인으로 실행하는 팀. 03-init 완료 필수.",
  "category": "planning",
  "agents": [
    {
      "agent": "style-curator",
      "role": "support",
      "responsibility": "문체 및 서술 스타일 설계 (style-guide.json 생성)",
      "model": "sonnet"
    },
    {
      "agent": "lore-keeper",
      "role": "worker",
      "responsibility": "세계관 구축 (world.json, locations.json, terms.json) + 캐릭터 관계 네트워크 설계 (relationships.json)",
      "model": "sonnet"
    },
    {
      "agent": "character-designer",
      "role": "worker",
      "responsibility": "캐릭터 프로필 설계 (characters/*.json, index.json) + collaborative용 에이전트 파일 생성 (agents/characters/*.md)",
      "model": "opus"
    },
    {
      "agent": "plot-architect",
      "role": "lead",
      "responsibility": "타임라인 설계 (timeline.json) + 메인 아크 설계 (main-arc.json)",
      "model": "opus"
    },
    {
      "agent": "arc-designer",
      "role": "worker",
      "responsibility": "서브아크 (sub-arcs/*.json), 복선 (foreshadowing.json), 훅 (hooks.json) 설계",
      "model": "sonnet"
    }
  ],
  "workflow": {
    "type": "pipeline",
    "steps": [
      {
        "name": "style-and-world",
        "agents": ["style-curator", "lore-keeper"],
        "execution": "parallel",
        "output": "style-guide.json + world.json + locations.json + terms.json"
      },
      {
        "name": "character-design",
        "agents": ["character-designer"],
        "execution": "sequential",
        "depends_on": ["style-and-world"],
        "output": "characters/*.json + index.json + agents/characters/*.md"
      },
      {
        "name": "relationship-and-timeline",
        "agents": ["lore-keeper", "plot-architect"],
        "execution": "parallel",
        "depends_on": ["character-design"],
        "output": "relationships.json + timeline.json"
      },
      {
        "name": "main-arc",
        "agents": ["plot-architect"],
        "execution": "sequential",
        "depends_on": ["relationship-and-timeline"],
        "output": "main-arc.json"
      },
      {
        "name": "sub-arcs",
        "agents": ["arc-designer"],
        "execution": "sequential",
        "depends_on": ["main-arc"],
        "output": "sub-arcs/*.json"
      },
      {
        "name": "foreshadow",
        "agents": ["arc-designer"],
        "execution": "sequential",
        "depends_on": ["sub-arcs"],
        "output": "foreshadowing.json"
      },
      {
        "name": "hooks",
        "agents": ["arc-designer"],
        "execution": "sequential",
        "depends_on": ["foreshadow"],
        "output": "hooks.json"
      }
    ],
    "max_iterations": 1
  },
  "coordination": {
    "mode": "orchestrated",
    "lead": "plot-architect",
    "communication": "task-based"
  },
  "quality_gates": {
    "enabled": false
  },
  "cost_estimate": {
    "tokens_per_agent": 60000,
    "warning_message": "설계 실행 팀은 5개 에이전트 (character-designer, plot-architect = opus / style-curator, lore-keeper, arc-designer = sonnet) 파이프라인을 사용합니다. 약 300K 토큰이 소요될 수 있습니다."
  }
}
```

- [ ] **Step 2: Validate JSON**

Run: `node -e "JSON.parse(require('fs').readFileSync('teams/design-execution-team.team.json')); console.log('OK')"`
Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add teams/design-execution-team.team.json
git commit -m "feat(novel-dev): expand design-execution-team to 5 agents"
```

---

### Task 6: Update routing-rules.json

**Files:**
- Modify: `scripts/routing-rules.json`

- [ ] **Step 1: Remove old skill entries**

`skills` 배열에서 다음 ID의 항목을 제거:
- `05-design-world`
- `06-design-character`
- `09-design-main-arc`
- `11-design-foreshadow`
- `17-revise`
- `18-evaluate`
- `19-consistency-check`

- [ ] **Step 2: Add new skill entries**

`skills` 배열에 추가:

```json
{
  "id": "04-design",
  "name": "design",
  "keywords": ["설계", "디자인", "design", "전체 설계", "세계관", "캐릭터", "아크"],
  "keywordVariants": ["설계해", "설계하자", "디자인해", "설계 시작"],
  "argPattern": null,
  "argType": null,
  "excludeKeywords": ["리뷰", "검토", "review"],
  "requiredState": ["planning"],
  "requireNovelContext": false,
  "priority": 8
},
{
  "id": "04-design-review",
  "name": "design-review",
  "keywords": ["설계 리뷰", "설계 검토", "design review", "설계 확인"],
  "keywordVariants": ["설계 리뷰해", "설계 검토해", "설계 확인해"],
  "argPattern": null,
  "argType": null,
  "excludeKeywords": [],
  "requiredState": ["planning"],
  "requireNovelContext": false,
  "priority": 8
},
{
  "id": "09-review",
  "name": "review",
  "keywords": ["리뷰", "퇴고", "평가", "검증", "수정", "review", "revise", "evaluate"],
  "keywordVariants": ["리뷰해", "퇴고해", "평가해", "검증해", "수정해", "리뷰해줘"],
  "argPattern": "^(\\d+)(?:[-~](\\d+))?",
  "argType": "chapterRange",
  "excludeKeywords": ["설계", "design", "파이프라인"],
  "requiredState": ["writing", "editing"],
  "requireNovelContext": false,
  "priority": 9
}
```

- [ ] **Step 3: Update renamed skill IDs**

기존 항목의 `id` 필드 변경:
- `"id": "13-gen-plot"` → `"id": "05-gen-plot"`
- `"id": "14-write"` → `"id": "06-write"`
- `"id": "15-write-act"` → `"id": "07-write-act"`
- `"id": "16-write-all"` → `"id": "08-write-all"`
- `"id": "20-resume"` → `"id": "10-resume"`

- [ ] **Step 4: Validate JSON**

Run: `node -e "const d=JSON.parse(require('fs').readFileSync('scripts/routing-rules.json')); console.log('skills: '+d.skills.length)"`
Expected: skills 수가 12개 (기존 17 - 7삭제 + 3추가 - 1중복조정 = ~12)

- [ ] **Step 5: Commit**

```bash
git add scripts/routing-rules.json
git commit -m "refactor(novel-dev): update routing-rules for renumbered skills"
```

---

### Task 7: Update model-tiers.json

**Files:**
- Modify: `config/model-tiers.json`

- [ ] **Step 1: Add new agents to all sections**

`agents` 섹션에 추가:
```json
"character-designer": "HIGH",
"arc-designer": "MEDIUM"
```

`permissionModes` 섹션에 추가:
```json
"character-designer": "default",
"arc-designer": "default"
```

`colors` 섹션에 추가:
```json
"character-designer": "pink",
"arc-designer": "blue"
```

- [ ] **Step 2: Commit**

```bash
git add config/model-tiers.json
git commit -m "feat(novel-dev): add character-designer and arc-designer to model-tiers"
```

---

### Task 8: Update Documentation (AGENTS.md files)

**Files:**
- Modify: `agents/AGENTS.md`
- Modify: `teams/AGENTS.md`

- [ ] **Step 1: Update agents/AGENTS.md**

에이전트 목록 테이블에 2개 추가:
- `character-designer` — 캐릭터 프로필 + 에이전트 파일 설계 (opus)
- `arc-designer` — 서브아크/복선/훅 설계 (sonnet)

총 에이전트 수를 18 → 20으로 업데이트.

- [ ] **Step 2: Update teams/AGENTS.md**

`## Preset Teams` 테이블에서 `design-execution-team` 행의 Agents 컬럼을 업데이트:
- 기존: `style-curator, lore-keeper, plot-architect`
- 변경: `style-curator, lore-keeper, character-designer, plot-architect, arc-designer`

- [ ] **Step 3: Commit**

```bash
git add agents/AGENTS.md teams/AGENTS.md
git commit -m "docs(novel-dev): update AGENTS.md for new agents and team composition"
```

---

### Task 9: Final Validation & Version Bump

**Files:**
- Modify: `package.json`
- All files

- [ ] **Step 1: Verify skill directory structure**

Run:
```bash
ls -d skills/0*/ skills/10-*/ | sort
```
Expected:
```
skills/00-brainstorm/
skills/01-blueprint-gen/
skills/02-blueprint-review/
skills/03-init/
skills/04-design/
skills/04-design-review/
skills/05-gen-plot/
skills/06-write/
skills/07-write-act/
skills/08-write-all/
skills/09-review/
skills/10-resume/
```

- [ ] **Step 2: Verify old skills are gone**

Run:
```bash
ls -d skills/04-design-style/ skills/17-revise/ 2>&1 | head -2
```
Expected: "No such file or directory" for both

- [ ] **Step 3: Validate JSON files**

Run:
```bash
node -e "
const fs = require('fs');
['teams/design-execution-team.team.json', 'scripts/routing-rules.json', 'config/model-tiers.json'].forEach(f => {
  JSON.parse(fs.readFileSync(f));
  console.log(f + ' OK');
});
"
```
Expected: All 3 files OK

- [ ] **Step 4: Run existing validation**

Run:
```bash
npm run validate:schemas && npm run validate:agents && npm run validate:skills
```
Expected: All pass (agent count updated to 20, skill count reduced)

- [ ] **Step 5: Version bump and final commit**

`package.json`: `1.1.0` → `1.2.0` (minor — 스킬 구조 개편)

```bash
git add package.json
git commit -m "feat(novel-dev): v1.2.0 — skill renumbering and design/review team consolidation"
```
