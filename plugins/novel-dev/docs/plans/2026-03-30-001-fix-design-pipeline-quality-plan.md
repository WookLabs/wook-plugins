---
title: "fix: Design pipeline quality gaps — agent coverage, JSON validation, cross-reference sync"
type: fix
status: active
date: 2026-03-30
---

# fix: 설계 파이프라인 품질 결함 수정

## Overview

novel2 설계 결과 분석에서 5개의 플러그인 결함을 발견. 에이전트 프롬프트 강화, 검증 게이트 추가, 교차 참조 동기화 지시를 통해 /design의 출력 품질을 보장.

## Problem Frame

/design 실행 후 설계 산출물에 구조적 결함이 반복 발생:
1. character-designer가 protagonist/antagonist 에이전트 파일을 누락
2. world.json이 유효하지 않은 JSON으로 출력되어도 감지 안 됨
3. arc-designer가 foreshadowing.json을 만들지만 timeline.json의 foreshadowing_collected와 동기화하지 않음
4. lore-keeper가 relationships.json에 주인공-히로인 관계만 생성, 히로인 간 관계 누락
5. sub-arcs 개수가 설계 의도와 불일치

## Requirements Trace

- R1. character-designer가 protagonist/antagonist/supporting 역할 캐릭터 **전원**의 에이전트 .md 파일 생성 보장
- R2. 설계 완료 후 모든 JSON 산출물의 유효성 검증 게이트
- R3. timeline.json 생성 시 foreshadowing.json의 모든 plant/payoff/hint를 foreshadowing_collected에 매핑
- R4. relationships.json에 주인공-히로인 + 히로인 간 관계(삼각 이상) 모두 포함
- R5. sub-arcs 개수가 설계된 캐릭터 아크/서브플롯 수와 일치하도록 검증

## Scope Boundaries

- 에이전트 .md 프롬프트 수정만 — 새 에이전트 추가 없음
- 팀 정의(design-execution-team.team.json) 변경 없음
- 스키마 파일 변경 없음

## Context & Research

### Relevant Code and Patterns

- `agents/character-designer.md:214` — "protagonist/deuteragonist/antagonist/supporting → 에이전트 파일 생성" 체크리스트가 이미 있으나 **강제성이 부족**
- `agents/character-designer.md:39` — "minor/cameo는 에이전트 파일 미생성"이 올바르지만, protagonist가 누락되는 건 다른 문제
- `agents/lore-keeper.md:188-230` — relationships 정의 예시에 주인공-히로인만 있음. 히로인 간 관계 예시/지시 없음
- `agents/arc-designer.md:27` — timeline.json을 **읽기**만 하고 foreshadowing_collected **쓰기** 지시 없음
- `agents/plot-architect.md` — timeline.json을 **생성**하는 에이전트. foreshadowing 매핑 지시 부재

### Root Causes

| 결함 | 근본 원인 |
|------|----------|
| 에이전트 파일 누락 | character-designer 프롬프트에 "모든 역할별 에이전트 파일 생성" 체크리스트가 있지만 **HARD RULE이 아닌 체크리스트** — AI가 간과 가능 |
| 잘못된 JSON | 설계 에이전트에 "출력 후 JSON 유효성 자가 검증" 지시 없음 |
| foreshadowing 미동기화 | plot-architect가 timeline 생성 시 foreshadowing.json을 참조하지만 collected 필드를 채우는 명시적 지시 없음 |
| 히로인 간 관계 누락 | lore-keeper 프롬프트의 예시가 주인공-히로인만. "캐릭터 간 모든 유의미한 관계" 지시 없음 |
| sub-arcs 불일치 | arc-designer에 "설계된 모든 서브플롯에 대해 파일 생성" 명시적 카운트 검증 없음 |

## Key Technical Decisions

- **JSON 검증은 에이전트 자가검증**: 별도 검증 스크립트가 아닌, 각 에이전트 프롬프트에 "파일 저장 후 JSON.parse로 유효성 확인" HARD RULE 추가. 이유: team-orchestrator에 검증 스텝을 추가하면 팀 구조 변경이 필요하지만, 프롬프트에 자가검증 룰을 넣으면 기존 구조 유지 가능
- **HARD RULE 패턴**: novelist.md의 "필터 워드 금지" 같은 절대 규칙 형태로 작성 — 체크리스트가 아닌 MUST/NEVER 어조

## Implementation Units

- [ ] **Unit 1: character-designer.md — 에이전트 파일 생성 HARD RULE 강화**

**Goal:** protagonist/antagonist/supporting 역할의 모든 캐릭터에 대해 에이전트 .md 파일 생성을 강제

**Requirements:** R1

**Files:**
- Modify: `agents/character-designer.md`

**Approach:**
- 기존 체크리스트 형태("- [ ] 에이전트 파일 생성 완료")를 **HARD RULE**로 승격
- "CRITICAL: `role`이 protagonist, deuteragonist, antagonist, supporting인 **모든** 캐릭터는 에이전트 .md 파일을 생성해야 합니다. **에이전트 파일 없이 설계를 완료로 보고하지 마세요.** minor/cameo만 예외."
- 역할 기반 판단 명확화: "에이전트 파일은 해당 캐릭터의 voice profile, 말투 패턴, 행동 원칙을 집필 에이전트에게 전달하는 문서입니다. 집필 방식(collab/solo)과 무관하게 모든 주요 캐릭터에 필요합니다."

**Patterns to follow:** `agents/novelist.md`의 HARD RULE 패턴 ("필터 워드 금지", "감각 그라운딩")

**Verification:** character-designer.md에 "HARD RULE" 또는 "CRITICAL"로 마크된 에이전트 파일 생성 지시 존재

---

- [ ] **Unit 2: 모든 설계 에이전트에 JSON 자가검증 RULE 추가**

**Goal:** JSON 출력 에이전트가 파일 저장 후 유효성을 자가 검증

**Requirements:** R2

**Files:**
- Modify: `agents/character-designer.md`
- Modify: `agents/lore-keeper.md`
- Modify: `agents/plot-architect.md`
- Modify: `agents/arc-designer.md`
- Modify: `agents/style-curator.md`

**Approach:**
- 각 에이전트의 "출력 형식" 또는 "완료 체크리스트" 섹션에 추가:
  "**JSON 검증 RULE**: JSON 파일을 저장한 후 반드시 Read로 다시 읽어 유효한 JSON인지 확인하세요. 파싱 에러가 있으면 즉시 수정하세요. **유효하지 않은 JSON을 최종 산출물로 남기지 마세요.**"

**Patterns to follow:** novelist.md의 "자가 검증" 패턴 ("작성 완료 후 위 표현을 검색하여 0개인지 확인")

**Verification:** 5개 에이전트 .md 모두에 "JSON 검증" 관련 RULE 존재

---

- [ ] **Unit 3: plot-architect.md — timeline foreshadowing_collected 매핑 지시**

**Goal:** timeline.json 생성 시 foreshadowing.json의 plant/payoff/hint를 매핑

**Requirements:** R3

**Files:**
- Modify: `agents/plot-architect.md`

**Approach:**
- timeline.json 생성 지시 섹션에 추가:
  "**복선 매핑 RULE**: timeline.json의 각 회차에 `foreshadowing_planted`와 `foreshadowing_collected` 배열을 채우세요. foreshadowing.json의 `plant_chapter`, `hints[].chapter`, `payoff_chapter`를 참조하여 해당 회차에 어떤 복선이 식재/암시/회수되는지 정확히 매핑하세요. **빈 배열만 있는 timeline은 불완전한 산출물입니다.**"

**Patterns to follow:** arc-designer.md의 "고아 복선 금지" 패턴 (`allow_orphan_foreshadowing: false`)

**Verification:** plot-architect.md에 "foreshadowing_collected 매핑" 관련 RULE 존재

---

- [ ] **Unit 4: lore-keeper.md — 캐릭터 간 전체 관계 생성 지시**

**Goal:** relationships.json에 주인공-히로인뿐 아니라 히로인 간 관계도 생성

**Requirements:** R4

**Files:**
- Modify: `agents/lore-keeper.md`

**Approach:**
- relationships 섹션에 추가:
  "**관계 완전성 RULE**: 유의미한 상호작용이 있는 **모든 캐릭터 쌍**의 관계를 정의하세요. 주인공-조연뿐 아니라 조연-조연 간 관계(경쟁, 협력, 갈등, 견제 등)도 포함합니다. role이 protagonist/deuteragonist/antagonist/supporting인 N명의 캐릭터에 대해, 유의미한 상호작용이 있는 쌍을 누락 없이 정의하세요."
- 기존 예시(주인공-캐릭터A)에 조연 간 관계 예시 1개 추가 (장르 무관한 구조적 예시)

**Verification:** lore-keeper.md에 "히로인 간 관계" 또는 "캐릭터 쌍 전체" 관련 지시 존재

---

- [ ] **Unit 5: arc-designer.md — sub-arcs 완전성 검증 지시**

**Goal:** 설계된 모든 서브플롯에 대한 파일이 생성되었는지 자가 검증

**Requirements:** R5

**Files:**
- Modify: `agents/arc-designer.md`

**Approach:**
- 완료 체크리스트에 추가:
  "**서브아크 완전성 RULE**: main-arc.json에서 언급된 서브플롯, 캐릭터별 고유 아크(질환, 비밀, 성장 등)이 모두 sub-arcs/ 폴더에 별도 파일로 존재하는지 확인하세요. structure.json의 subplots 목록과 sub-arcs/ 파일 수가 일치해야 합니다. **누락된 서브아크가 있으면 추가 생성하세요.**"

**Verification:** arc-designer.md에 "서브아크 완전성" 관련 검증 지시 존재

## System-Wide Impact

- **Interaction graph:** character-designer, lore-keeper, plot-architect, arc-designer, style-curator 프롬프트만 변경. 팀 정의, 스키마, 스크립트 변경 없음
- **Unchanged invariants:** design-execution-team.team.json 구조 유지, 기존 스킬 동작 변경 없음

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| 프롬프트 길이 증가 → 에이전트 성능 저하 | 각 RULE은 3-5줄로 간결하게, 기존 체크리스트에 통합 |
| 자가 JSON 검증이 불완전할 수 있음 | RULE로 명시하면 대부분 준수됨. 향후 team-orchestrator에 자동 검증 스텝 추가 고려 |
| 관계 N*(N-1)/2 쌍 → 조합 폭발 | "유의미한 상호작용이 있는" 조건으로 제한 |

## Sources & References

- Novel2 분석 결과 (이 세션에서 수행)
- `agents/character-designer.md:214, 39, 352`
- `agents/lore-keeper.md:188-230`
- `agents/arc-designer.md:27, 353`
- `agents/plot-architect.md`
- `agents/novelist.md` — HARD RULE 패턴 참조
