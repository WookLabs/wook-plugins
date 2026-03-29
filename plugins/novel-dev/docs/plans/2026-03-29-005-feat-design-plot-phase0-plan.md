---
title: "feat: Add Phase 0 strategy to /design and /gen-plot, team-based gen-plot"
type: feat
status: active
date: 2026-03-29
origin: docs/brainstorms/2026-03-29-design-plot-phase0-requirements.md
---

# feat: Design/Gen-Plot Phase 0 전략 수립 + Gen-Plot 팀 전환

## Overview

/design과 /gen-plot에 Phase 0(전략 수립)을 추가하여 실행 전 방향성을 확립. gen-plot을 plot-architect 단독에서 4명 팀 기반으로 전환하여 검증 품질 향상.

## Problem Frame

design 5명 에이전트가 상위 전략 합의 없이 동시 설계를 시작하면 결과물 정합성이 떨어짐. gen-plot은 plot-architect 혼자서 전체 회차를 생성하여 시야가 좁고 아크/복선/캐릭터 검증이 없음. (see origin: docs/brainstorms/2026-03-29-design-plot-phase0-requirements.md)

## Requirements Trace

- R1. /design Phase 0 자동 실행
- R2. Phase 0 전략 문서 생성 (문체 방향, 세계관 톤, 캐릭터 우선순위, 아크 구조)
- R3. Phase 1~3 에이전트가 전략 문서 참조
- R4. /gen-plot Phase 0 자동 실행
- R5. Phase 0에서 전체 회차 배분 전략 수립
- R6. 회차별 생성 시 전략 문서 컨텍스트 주입
- R7. gen-plot 팀 기반 전환
- R8. 팀 구성: plot-architect(lead) + arc-designer + lore-keeper + character-designer
- R9. collaborative 워크플로우: 초안 → 검증 → 반영

## Scope Boundaries

- 새 스킬 추가 안 함 — 기존 스킬 내부 수정만
- Phase 0 전략은 사용자 검토 불필요 (자동)
- design-execution-team의 기존 Phase 1~3 구조 유지
- 전략 문서 형식: JSON (기존 meta/ 패턴 일관성)

## Context & Research

### Relevant Code and Patterns

- `teams/design-execution-team.team.json` — collaborative 팀, 3 phases. Phase 0을 phases 배열 앞에 추가
- `skills/04-design/SKILL.md` — team-orchestrator 위임 패턴. Phase 0은 SKILL.md에서 team-orchestrator 호출 전에 별도 에이전트로 실행
- `skills/05-gen-plot/SKILL.md` — plot-architect 단독 순차 호출. 팀 기반으로 전환하면 team-orchestrator 위임 패턴으로 변경
- `teams/writing-team-collab-2pass.team.json` — collaborative + orchestrator_action 혼합 워크플로우의 선례

### Key Architectural Insight

Phase 0는 팀 실행 **전에** 단일 에이전트(plot-architect)가 수행. 전략 문서를 `meta/design-strategy.json`, `meta/plot-strategy.json`에 저장. team-orchestrator가 팀 실행 시 이 파일을 컨텍스트로 주입.

## Key Technical Decisions

- **Phase 0 실행 위치**: SKILL.md에서 team-orchestrator 호출 전에 별도 Task로 plot-architect를 호출하여 전략 문서 생성. 이유: team.json의 collaborative 워크플로우를 수정하지 않고 SKILL.md 레벨에서 제어 가능
- **전략 문서 포맷**: JSON — 에이전트가 파싱하기 쉽고 기존 meta/ 패턴과 일관
- **gen-plot 팀 이름**: `plot-generation-team` — 기존 네이밍 패턴 (`{purpose}-team`)
- **gen-plot 워크플로우**: collaborative (순차가 아닌 실시간 소통) — 각 회차마다 plot-architect가 초안 생성 후 3명이 검증하는 라운드 기반

## Open Questions

### Resolved During Planning

- **전략 문서 스키마**: 고정 스키마 없이 자유 형식 JSON. plot-architect가 blueprint 분석 결과를 구조화. 이유: 장르/프로젝트마다 전략 항목이 다르므로 유연성 필요
- **gen-plot collaborative 라운드 수**: 회차당 1라운드 (초안→검증→반영). 이유: 다회 라운드는 비용 대비 효과 미미, 검증 에이전트가 3명이므로 1라운드로 충분
- **Phase 0 에이전트 선택**: plot-architect (lead) 단독. 이유: 전략은 전체 시야를 가진 1명이 수립하는 게 효율적, 팀 합의는 Phase 1~3에서

### Deferred to Implementation

- design-strategy.json의 정확한 필드 구성 — blueprint 분석 결과에 따라 달라짐
- plot-strategy.json의 회차 배분 알고리즘 — 아크 수, 복선 수에 따라 가변적

## High-Level Technical Design

> *Directional guidance for review, not implementation specification.*

```
/design 실행 흐름 (변경 후):
  │
  ├─ Phase 0 (NEW): plot-architect 단독
  │   └─ blueprint 분석 → meta/design-strategy.json 생성
  │
  └─ team-orchestrator: design-execution-team
      ├─ Phase 1 (foundation): strategy 참조하며 style + world
      ├─ Phase 2 (characters): strategy 참조하며 캐릭터
      └─ Phase 3 (structure): strategy 참조하며 아크/복선

/gen-plot 실행 흐름 (변경 후):
  │
  ├─ Phase 0 (NEW): plot-architect 단독
  │   └─ design 산출물 분석 → meta/plot-strategy.json 생성
  │
  └─ team-orchestrator: plot-generation-team (NEW)
      └─ 회차별 반복:
          ├─ plot-architect: 초안 생성
          ├─ arc-designer: 아크/복선 타이밍 검증
          ├─ lore-keeper: 세계관/타임라인 정합성
          ├─ character-designer: 캐릭터 동선/성장 검증
          └─ plot-architect: 피드백 반영 → chapter_N.json 저장
```

## Implementation Units

- [ ] **Unit 1: design-strategy.json 스키마 + Phase 0 프롬프트**

**Goal:** Phase 0에서 생성할 설계 전략 문서의 구조 정의

**Requirements:** R1, R2

**Dependencies:** None

**Files:**
- Create: `templates/design-strategy.template.json` — 예시/기본 구조
- Create: `schemas/design-strategy.schema.json` — optional, 검증용

**Approach:**
- 전략 항목: 핵심 톤/분위기, 세계관 설계 우선순위, 캐릭터 설계 방침, 아크 구조 전략, 에이전트별 구체 지시사항
- blueprint의 genre, tone, synopsis, act_outline을 입력으로 분석
- 출력: `meta/design-strategy.json`

**Patterns to follow:** `templates/style-guide.template.json`

**Test scenarios:**
- Happy path: 템플릿 JSON이 유효한 JSON
- Happy path: 스키마가 있으면 검증 통과

**Verification:** `npm run validate:schemas` 통과

---

- [ ] **Unit 2: /design SKILL.md에 Phase 0 삽입**

**Goal:** /design 실행 시 team-orchestrator 호출 전에 Phase 0 자동 실행

**Requirements:** R1, R2, R3

**Dependencies:** Unit 1

**Files:**
- Modify: `skills/04-design/SKILL.md`

**Approach:**
- 기존 team-orchestrator 호출 전에 plot-architect Task 추가
- plot-architect에게 blueprint 분석 → design-strategy.json 생성 지시
- team-orchestrator 호출 시 "Phase 0 전략이 `meta/design-strategy.json`에 있으니 모든 에이전트가 참조하라" 프롬프트 추가

**Patterns to follow:** `skills/write-act-2pass/SKILL.md`의 조건부 팀 선택 패턴

**Test scenarios:**
- Happy path: SKILL.md frontmatter 유효
- Happy path: Phase 0 → team-orchestrator 호출 순서 명시

**Verification:** `npm run validate:skills` 통과

---

- [ ] **Unit 3: plot-strategy.json 구조 + Phase 0 프롬프트**

**Goal:** gen-plot Phase 0에서 생성할 플롯 전략 문서 정의

**Requirements:** R4, R5

**Dependencies:** None (Unit 1과 병렬 가능)

**Files:**
- Create: `templates/plot-strategy.template.json`

**Approach:**
- 전략 항목: 아크별 회차 할당, 복선 plant/payoff 타이밍표, 긴장 곡선 설계, 회차별 페이싱 가이드, POV 로테이션 전략
- design 산출물(main-arc, sub-arcs, foreshadowing, hooks, timeline, characters)을 입력으로 분석
- 출력: `meta/plot-strategy.json`

**Patterns to follow:** `templates/design-strategy.template.json` (Unit 1)

**Test scenarios:**
- Happy path: 템플릿 JSON 유효

**Verification:** 유효한 JSON 파일 존재

---

- [ ] **Unit 4: plot-generation-team.team.json 생성**

**Goal:** gen-plot용 4명 collaborative 팀 정의

**Requirements:** R7, R8, R9

**Dependencies:** None

**Files:**
- Create: `teams/plot-generation-team.team.json`

**Approach:**
- 4명: plot-architect(lead, opus), arc-designer(worker, sonnet), lore-keeper(worker, sonnet), character-designer(worker, sonnet)
- workflow type: collaborative
- 단일 phase: per-chapter collaborative generation
- plot-architect가 lead로 조율, 회차별로 초안→검증→반영 사이클

**Patterns to follow:** `teams/design-execution-team.team.json`의 collaborative 구조

**Test scenarios:**
- Happy path: team.schema.json 검증 통과
- Happy path: 4명 에이전트 모두 존재하는 에이전트 .md 참조

**Verification:** `npm run validate:schemas` 통과

---

- [ ] **Unit 5: /gen-plot SKILL.md 전면 수정**

**Goal:** gen-plot에 Phase 0 추가 + plot-architect 단독에서 팀 기반으로 전환

**Requirements:** R4, R5, R6, R7, R9

**Dependencies:** Unit 3, Unit 4

**Files:**
- Modify: `skills/05-gen-plot/SKILL.md`

**Approach:**
- Phase 0: plot-architect Task로 design 산출물 분석 → plot-strategy.json 생성
- Phase 1: team-orchestrator에 plot-generation-team 위임
- team-orchestrator 프롬프트에 plot-strategy.json 참조 지시 + 회차별 순차 생성 지시
- 기존 plot-architect 단독 호출 패턴을 team-orchestrator 위임 패턴으로 교체

**Patterns to follow:** `skills/04-design/SKILL.md`의 team-orchestrator 위임 패턴

**Test scenarios:**
- Happy path: SKILL.md frontmatter 유효
- Happy path: Phase 0 → team-orchestrator 호출 순서 명시
- Happy path: plot-generation-team 참조

**Verification:** `npm run validate:skills` 통과

---

- [ ] **Unit 6: teams/AGENTS.md + README 업데이트**

**Goal:** 새 팀 + Phase 0 워크플로우 문서 반영

**Dependencies:** Unit 1-5

**Files:**
- Modify: `teams/AGENTS.md` — plot-generation-team 추가 (12→13개)
- Modify: `README.md` — 워크플로우에 Phase 0 언급

**Verification:** 팀 카운트 정확, stale 참조 없음

## System-Wide Impact

- **Interaction graph:** SKILL.md → plot-architect(Phase 0) → meta/*.json → team-orchestrator → 팀 에이전트들. 기존 design-execution-team 내부 구조 변경 없음
- **Unchanged invariants:** design-execution-team.team.json 변경 없음, 기존 agent .md 파일 변경 없음, 기존 스키마 변경 없음

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| Phase 0 전략이 너무 generic해서 실제 설계에 도움 안 됨 | plot-architect 프롬프트에 "구체적 지시사항 포함" 강조, 예시 제공 |
| gen-plot 팀 비용 증가 (1명→4명) | 검증 에이전트는 sonnet(저비용), 라운드 1회로 제한 |
| 전략 문서가 blueprint와 중복 | 전략은 "어떻게 설계할지"의 방법론, blueprint는 "무엇을 만들지"의 내용 — 명확 분리 |

## Sources & References

- **Origin:** [docs/brainstorms/2026-03-29-design-plot-phase0-requirements.md](docs/brainstorms/2026-03-29-design-plot-phase0-requirements.md)
- Design team: `teams/design-execution-team.team.json`
- Design skill: `skills/04-design/SKILL.md`
- Gen-plot skill: `skills/05-gen-plot/SKILL.md`
