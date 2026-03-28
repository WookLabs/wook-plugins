# Design Team Collaborative Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** design-execution-team을 pipeline에서 collaborative(TeamCreate/SendMessage)로 전환하여 5명이 실시간 소통하며 설계하도록 변경

**Architecture:** team JSON의 workflow type을 collaborative로 변경하고, plot-architect가 lead로 TeamCreate → SendMessage 기반 조율. 04-design 스킬과 teams/AGENTS.md의 참조도 업데이트.

**Tech Stack:** Claude Code teams (.team.json), agent prompts (.md)

---

## File Structure

| 파일 | 변경 |
|------|------|
| `teams/design-execution-team.team.json` | pipeline → collaborative, steps → phases (가이드라인) |
| `skills/04-design/SKILL.md` | 파이프라인 설명 → collaborative 설명 |
| `teams/AGENTS.md` | workflow type 업데이트 |

---

### Task 1: Update design-execution-team.team.json

**Files:**
- Modify: `teams/design-execution-team.team.json`

- [ ] **Step 1: Rewrite team JSON to collaborative mode**

Read the file, then replace entire content with:

```json
{
  "$schema": "../schemas/team.schema.json",
  "schema_version": "1.0",
  "name": "design-execution-team",
  "display_name": "설계 실행 팀",
  "description": "5명 에이전트가 collaborative 모드로 실시간 소통하며 소설 전체 설계를 수행하는 팀. plot-architect가 lead로 조율. 03-init 완료 필수.",
  "category": "planning",
  "agents": [
    {
      "agent": "style-curator",
      "role": "worker",
      "responsibility": "문체 및 서술 스타일 설계 (style-guide.json 생성). 세계관/캐릭터 설계 시 문체 일관성 자문.",
      "model": "sonnet"
    },
    {
      "agent": "lore-keeper",
      "role": "worker",
      "responsibility": "세계관 구축 (world.json, locations.json, terms.json) + 캐릭터 관계 네트워크 설계 (relationships.json). 캐릭터/플롯 설계 시 세계관 정합성 검증.",
      "model": "sonnet"
    },
    {
      "agent": "character-designer",
      "role": "worker",
      "responsibility": "캐릭터 프로필 설계 (characters/*.json, index.json) + collaborative용 에이전트 파일 생성 (agents/characters/*.md). 플롯 설계 시 캐릭터 동기/결함 자문.",
      "model": "opus"
    },
    {
      "agent": "plot-architect",
      "role": "lead",
      "responsibility": "전체 설계 조율 + 타임라인 설계 (timeline.json) + 메인 아크 설계 (main-arc.json). 팀원에게 작업 지시 및 진행 관리.",
      "model": "opus"
    },
    {
      "agent": "arc-designer",
      "role": "worker",
      "responsibility": "서브아크 (sub-arcs/*.json), 복선 (foreshadowing.json), 훅 (hooks.json) 설계. 메인 아크/캐릭터 아크와 정합성 조율.",
      "model": "sonnet"
    }
  ],
  "workflow": {
    "type": "collaborative",
    "phases": [
      {
        "name": "foundation",
        "description": "문체 + 세계관 기반 구축. style-curator와 lore-keeper가 동시 진행하며 상호 참조.",
        "primary_agents": ["style-curator", "lore-keeper"],
        "outputs": ["meta/style-guide.json", "world/world.json", "world/locations.json", "world/terms.json"]
      },
      {
        "name": "characters",
        "description": "캐릭터 프로필 + 관계 설계. character-designer가 주도, lore-keeper가 세계관 정합성 검증.",
        "primary_agents": ["character-designer", "lore-keeper"],
        "outputs": ["characters/*.json", "characters/index.json", "characters/relationships.json", "agents/characters/*.md"]
      },
      {
        "name": "structure",
        "description": "타임라인 + 메인/서브 아크 + 복선 + 훅. plot-architect와 arc-designer가 주도, character-designer가 캐릭터 동기 자문.",
        "primary_agents": ["plot-architect", "arc-designer", "character-designer"],
        "outputs": ["plot/timeline.json", "plot/main-arc.json", "plot/sub-arcs/*.json", "plot/foreshadowing.json", "plot/hooks.json"]
      }
    ]
  },
  "coordination": {
    "mode": "collaborative",
    "lead": "plot-architect",
    "communication": "message-based",
    "lead_protocol": "plot-architect가 TeamCreate로 팀 생성 후 SendMessage로 각 phase를 조율. 자연스러운 의존성은 lead가 메시지로 관리 (예: '세계관 초안 나오면 캐릭터 설계 시작해주세요')."
  },
  "quality_gates": {
    "enabled": false
  },
  "cost_estimate": {
    "tokens_per_agent": 60000,
    "warning_message": "설계 팀은 5명이 collaborative로 소통합니다 (character-designer, plot-architect = opus / style-curator, lore-keeper, arc-designer = sonnet). 약 300K 토큰이 소요될 수 있습니다."
  }
}
```

- [ ] **Step 2: Validate JSON**

Run: `node -e "const d=JSON.parse(require('fs').readFileSync('teams/design-execution-team.team.json'));console.log(d.workflow.type, d.coordination.mode, 'agents:'+d.agents.length)"`

Expected: `collaborative collaborative agents:5`

- [ ] **Step 3: Commit**

```bash
git add teams/design-execution-team.team.json
git commit -m "feat(novel-dev): convert design-execution-team to collaborative mode"
```

---

### Task 2: Update 04-design skill

**Files:**
- Modify: `skills/04-design/SKILL.md`

- [ ] **Step 1: Replace skill content**

Read the file, then replace entire content with:

```markdown
---
name: 04-design
description: "Use this skill when designing all aspects of a novel project (style, world, characters, arcs, foreshadowing, hooks). Triggers on: '설계', '디자인', 'design'."
user-invocable: true
---

# /design - 소설 전체 설계

$ARGUMENTS

03-init 완료 후, 5명의 설계 팀이 collaborative 모드로 실시간 소통하며 전체 설계를 수행합니다.

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
모드: collaborative
")
```

## 팀 구성 (5명, collaborative)

| 에이전트 | 모델 | 역할 | 산출물 |
|---------|------|------|--------|
| **plot-architect** (lead) | opus | 전체 조율 + 타임라인 + 메인 아크 | timeline.json, main-arc.json |
| style-curator | sonnet | 문체 설계 + 문체 일관성 자문 | style-guide.json |
| lore-keeper | sonnet | 세계관 + 관계도 + 정합성 검증 | world.json, relationships.json |
| character-designer | opus | 캐릭터 프로필 + 에이전트 생성 | characters/*.json, agents/characters/*.md |
| arc-designer | sonnet | 서브아크 + 복선 + 훅 | sub-arcs/*.json, foreshadowing.json, hooks.json |

## Collaborative 진행 방식

plot-architect(lead)가 TeamCreate로 팀을 구성하고 SendMessage로 조율합니다.

**Phase 1: 기반 구축**
- style-curator + lore-keeper가 동시 진행
- 상호 참조: 문체가 세계관 분위기에 맞는지 실시간 조율

**Phase 2: 캐릭터**
- character-designer 주도, lore-keeper가 세계관 정합성 검증
- character-designer가 캐릭터 에이전트 파일도 자동 생성

**Phase 3: 구조**
- plot-architect + arc-designer 주도
- character-designer가 캐릭터 동기/결함 기반 플롯 자문
- 서브아크 → 복선 → 훅 순으로 진행하되, 필요시 역순 피드백

## 완료 후

```
[OK] 전체 설계 완료. /design-review로 검토하거나, /gen-plot으로 회차별 플롯을 생성하세요.
```
```

- [ ] **Step 2: Commit**

```bash
git add skills/04-design/SKILL.md
git commit -m "feat(novel-dev): update 04-design skill for collaborative team mode"
```

---

### Task 3: Update teams/AGENTS.md

**Files:**
- Modify: `teams/AGENTS.md`

- [ ] **Step 1: Update workflow type in the Preset Teams table**

Find the `design-execution-team` row and change `pipeline` to `collaborative`:

Before: `| pipeline | 전체 설계 파이프라인 (5명) |`
After: `| collaborative | 5명 실시간 소통 설계 |`

- [ ] **Step 2: Update Workflow Types table**

Find the `pipeline` row's "사용 팀" column. Remove `design-execution-team` from the pipeline list.
Find the `collaborative` row's "사용 팀" column. Add `design-execution-team`.

- [ ] **Step 3: Commit**

```bash
git add teams/AGENTS.md
git commit -m "docs(novel-dev): update AGENTS.md for collaborative design team"
```

---

### Task 4: Final validation

- [ ] **Step 1: Validate JSON**

Run: `node -e "JSON.parse(require('fs').readFileSync('teams/design-execution-team.team.json'));console.log('OK')"`
Expected: `OK`

- [ ] **Step 2: Run full tests**

Run: `npx vitest run`
Expected: 750/750 pass

- [ ] **Step 3: Commit version bump if needed**

이건 patch 수준이 아니라 기존 기능의 동작 방식 변경이므로 `1.2.1` → `1.3.0` minor bump.

```bash
# package.json, plugin.json version: "1.3.0"
git add -A
git commit -m "feat(novel-dev): v1.3.0 — design team collaborative mode"
```
