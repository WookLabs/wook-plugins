---
title: "refactor: Split review into plot-review + act-review"
type: refactor
status: active
date: 2026-03-29
origin: docs/brainstorms/2026-03-29-review-skill-split-requirements.md
---

# refactor: Split review into plot-review + act-review

## Overview

모호한 `/review` 스킬을 제거하고, 대상별로 명확한 리뷰 스킬 2개를 신설한다:
- `/plot-review` — 플롯 파일 품질 검증 (기존 plot-review-team 활용)
- `/act-review` — 막 단위 원고 평가 + 선택적 회차 심층 리뷰 (기존 deep-review-team 활용)

## Problem Frame

현재 `/review`가 회차 평가, 설계 리뷰, 범용 검토를 혼재하여 사용자가 어떤 리뷰를 호출하는지 불명확하다. 소설 워크플로우에서 리뷰는 대상별로 분리되어야 한다. (see origin: docs/brainstorms/2026-03-29-review-skill-split-requirements.md)

## Requirements Trace

- R1. `/plot-review` 스킬 신설 — plot-review-team 호출
- R2. `/act-review` 스킬 신설 — deep-review-team 호출, 막 전체 평가 + 선택적 심층
- R3. `/09-review` 제거
- R4. `/review` (unnumbered) 제거
- R5. `/09-revise` 유지 (변경 없음)
- R6-R7. act-review 거시 평가 → 문제 회차 drill-down
- R8. act-review 인자: 막 번호
- R9. plot-review 4에이전트 병렬
- R10. plot-review 인자: 회차 범위

## Scope Boundaries

- 팀 JSON 변경 없음 (plot-review-team, deep-review-team 그대로)
- `/09-revise` 변경 없음
- `/design-review`, `/blueprint-review` 변경 없음

## Key Technical Decisions

- **번호 체계**: plot-review는 05b (gen-plot 다음), act-review는 07b (write-act 다음). 기존 `05-gen-plot`, `07-write-act` 패턴에 `-review` suffix 추가: `05-plot-review`, `07-act-review`
- **act-review argType**: `act` (막 번호). `/write-act`와 동일한 패턴
- **plot-review argType**: `chapterRange` (회차 범위). 기존 09-review 패턴 재활용
- **09-revise 피드백 경로**: `/review` → `/act-review` 또는 `/plot-review`로 안내 텍스트만 변경

## Context & Research

### Relevant Code and Patterns

- `skills/04-design-review/SKILL.md` — 팀 기반 리뷰 스킬 패턴 (team-orchestrator 호출)
- `skills/09-review/SKILL.md` — 기존 챕터 리뷰 구조 (verification-team/deep-review-team)
- `teams/plot-review-team.team.json` — 이미 존재, 4에이전트 병렬
- `teams/deep-review-team.team.json` — 이미 존재, 6에이전트 병렬
- `scripts/routing-rules.json` — 09-review 엔트리 (line 154), skill routing 패턴

### Institutional Learnings

- 이전 스킬 리넘버링에서 cross-reference 누락이 반복 → 모든 참조 파일 사전 목록화 필수
- `validate-skills.mjs`는 디렉토리 존재만 확인 → 새 디렉토리만 만들면 통과

## Open Questions

### Resolved During Planning

- **09-revise의 피드백 로드 경로**: 현재 `reviews/verification_ch{N}_*.json` 하드코딩 → act-review도 같은 경로에 저장하므로 변경 불필요. `/review` → `/act-review` 텍스트만 변경

### Deferred to Implementation

- act-review의 "문제 회차 식별" 로직의 정확한 프롬프트 문구 — SKILL.md 작성 시 결정

## Implementation Units

- [ ] **Unit 1: 스킬 디렉토리 생성 (plot-review, act-review)**

**Goal:** 2개의 새 리뷰 스킬 SKILL.md 작성

**Requirements:** R1, R2, R6-R10

**Dependencies:** None

**Files:**
- Create: `skills/05-plot-review/SKILL.md`
- Create: `skills/07-act-review/SKILL.md`

**Approach:**
- `04-design-review/SKILL.md` 패턴을 따라 team-orchestrator 호출 구조
- plot-review: plot-review-team 호출, 회차 범위 인자, quality gates 포함
- act-review: deep-review-team 호출, 막 번호 인자, 2단계 흐름 (거시 평가 → 선택적 심층)

**Patterns to follow:**
- `skills/04-design-review/SKILL.md` — 팀 기반 리뷰 스킬의 표준 구조
- `skills/09-review/SKILL.md` — Quick Start, 실행, Quality Gates, 결과 섹션 구조

**Test scenarios:**
- Happy path: SKILL.md frontmatter가 올바른 name, description, user-invocable 포함
- Happy path: team-orchestrator 호출 spec이 올바른 팀 이름 참조

**Verification:**
- `npm run validate:skills` 통과 (25 → 27개 → 실제로는 삭제 2 + 추가 2 = 25개)

---

- [ ] **Unit 2: 기존 스킬 디렉토리 삭제**

**Goal:** 09-review, review (unnumbered) 제거

**Requirements:** R3, R4

**Dependencies:** Unit 1 (새 스킬이 먼저 존재해야 참조 전환 가능)

**Files:**
- Delete: `skills/09-review/` (전체 디렉토리)
- Delete: `skills/review/` (전체 디렉토리 — examples/, references/ 포함)

**Approach:**
- `rm -rf` 두 디렉토리

**Test scenarios:**
- Happy path: 디렉토리 삭제 후 `ls skills/` 에서 미출현 확인

**Verification:**
- `skills/09-review/` 와 `skills/review/` 존재하지 않음

---

- [ ] **Unit 3: routing-rules.json 업데이트**

**Goal:** 09-review 엔트리 제거, plot-review + act-review 엔트리 추가

**Requirements:** R1, R2, R3, R8, R10

**Dependencies:** Unit 1

**Files:**
- Modify: `scripts/routing-rules.json`

**Approach:**
- `09-review` 엔트리 삭제
- `05-plot-review` 엔트리 추가: keywords=["플롯 리뷰", "플롯 검증", "plot review"], argPattern 회차 범위, priority=9, requiredState=["planning", "writing"]
- `07-act-review` 엔트리 추가: keywords=["막 리뷰", "막 평가", "act review"], argPattern 막 번호, priority=9, requiredState=["writing", "editing"]
- `config.projectRequiredExceptions`에 변경 없음 (review는 프로젝트 필수)

**Patterns to follow:**
- 기존 routing-rules.json의 다른 스킬 엔트리 구조

**Test scenarios:**
- Happy path: 새 엔트리가 JSON 파서 오류 없이 로드됨
- Happy path: "플롯 리뷰해줘" → 05-plot-review 매칭
- Happy path: "2막 리뷰해줘" → 07-act-review 매칭
- Edge case: "리뷰" 단독은 이제 매칭 안 됨 (09-review 삭제)
- Edge case: "설계 리뷰" → 여전히 04-design-review 매칭

**Verification:**
- `npx vitest run tests/routing/skill-router.test.ts` 통과

---

- [ ] **Unit 4: 라우팅 테스트 업데이트**

**Goal:** 09-review 관련 테스트를 plot-review/act-review로 교체

**Requirements:** R1, R2, R3

**Dependencies:** Unit 3

**Files:**
- Modify: `tests/routing/skill-router.test.ts`

**Approach:**
- `09-review` 매칭 테스트 삭제/교체
- plot-review 매칭 테스트 추가 ("플롯 리뷰", "5화 플롯 검증")
- act-review 매칭 테스트 추가 ("2막 리뷰", "막 평가")
- 스킬 count 업데이트 (16 → 삭제1 + 추가2 = 17)

**Patterns to follow:**
- 기존 테스트 파일의 describe/it 구조

**Test scenarios:**
- Happy path: 모든 신규 테스트 통과
- Happy path: 기존 비관련 테스트 회귀 없음

**Verification:**
- `npx vitest run tests/routing/skill-router.test.ts` 전체 통과

---

- [ ] **Unit 5: 참조 파일 정리**

**Goal:** 삭제/신설된 스킬을 참조하는 모든 파일 업데이트

**Requirements:** 참조 일관성 (Success Criteria)

**Dependencies:** Unit 1, Unit 2

**Files:**
- Modify: `skills/help/SKILL.md` — Quick Start 5단계의 review → act-review/plot-review
- Modify: `README.md` — 커맨드 테이블에서 /review 제거, /plot-review + /act-review 추가
- Modify: `templates/CLAUDE.template.md` — /review 참조 → /act-review, /plot-review
- Modify: `skills/09-revise/SKILL.md` — "/review 결과" → "/act-review 또는 /plot-review 결과"
- Modify: `skills/07-write-act/SKILL.md` — 막 완료 후 검증 안내를 /act-review로
- Modify: `skills/08-write-all/SKILL.md` — /review 참조 확인 후 변경
- Modify: `skills/quickstart/SKILL.md` — /review 참조 변경
- Modify: `skills/status/SKILL.md` — /review 참조 확인 후 변경
- Modify: `skills/06-write/examples/example-usage.md` — /review 참조 변경
- Modify: `skills/03-init/examples/example-usage.md` — /review 참조 변경
- Modify: `skills/write-act-2pass/SKILL.md` — /review 참조 확인
- Modify: `teams/AGENTS.md` — 해당 시 업데이트
- Modify: `agents/AGENTS.md` — /review 참조 확인

**Approach:**
- grep으로 `/review` 참조가 있는 활성 파일 전수 확인 (docs/plans/ 제외)
- 문맥에 따라 /act-review 또는 /plot-review로 교체

**Patterns to follow:**
- 이전 스킬 리넘버링 때의 cross-reference 정리 패턴

**Test scenarios:**
- Happy path: grep "09-review" 및 standalone "/review" 결과 0건 (docs/plans/ 제외)

**Verification:**
- `grep -r "09-review\|/review " skills/ templates/ README.md teams/ agents/ --include="*.md" --include="*.json"` 결과가 brainstorms/plans 외에 0건

## System-Wide Impact

- **Interaction graph:** `/gen-plot` → `/plot-review` → `/write` → `/write-act` → `/act-review` → `/revise` 흐름으로 자연스러운 워크플로우 연결
- **Error propagation:** 영향 없음 — 스킬 레벨 변경, 팀/에이전트 변경 없음
- **State lifecycle risks:** 없음 — review 결과 저장 경로(`reviews/`)는 동일
- **API surface parity:** routing-rules.json 키워드가 유일한 진입점, 여기만 변경하면 됨
- **Unchanged invariants:** plot-review-team.team.json, deep-review-team.team.json, verification-team.team.json, 09-revise 모두 변경 없음

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| Cross-reference 누락 | Unit 5에서 전수 grep 검증 |
| 라우팅 키워드 충돌 ("리뷰" 단독) | excludeKeywords로 설계 리뷰/플롯 리뷰/막 리뷰 분리 |
| 사용자 습관 ("리뷰해줘") | routing에서 "리뷰" 단독 시 안내 메시지 또는 가장 일반적인 act-review로 fallback |

## Sources & References

- **Origin document:** [docs/brainstorms/2026-03-29-review-skill-split-requirements.md](docs/brainstorms/2026-03-29-review-skill-split-requirements.md)
- Related patterns: `skills/04-design-review/SKILL.md`, `skills/09-review/SKILL.md`
- Related teams: `teams/plot-review-team.team.json`, `teams/deep-review-team.team.json`
