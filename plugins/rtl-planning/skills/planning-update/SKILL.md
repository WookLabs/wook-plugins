---
name: planning-update
description: "Use after completing RTL implementation tasks to update project state. Updates .planning/STATE.md with progress from git history and plan checkboxes. Trigger with 'update planning', 'update state', 'mark done'."
user-invocable: true
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
---

# planning:update

RTL 구현 작업 완료 후 `.planning/STATE.md`를 현재 진행 상황에 맞게 갱신하는 skill이다.

## 실행 절차

### 1단계: 최근 변경사항 파악

`git log --oneline -20` 명령으로 최근 커밋 이력을 확인한다.
변경된 모듈과 파일을 식별하여 어떤 작업이 완료되었는지 판단한다.

### 2단계: PLAN 체크박스 상태 스캔

Glob `.planning/*_PLAN.md` 패턴으로 모든 PLAN 파일을 찾는다.
각 PLAN 파일의 체크박스(`- [x]`, `- [ ]`)를 파싱하여 태스크별 완료율을 계산한다.

### 3단계: CONCERNS 상태 확인

Read `.planning/codebase/CONCERNS.md` 파일을 읽어 현재 이슈 목록과 상태를 확인한다.
해결된 이슈와 새로 발견된 이슈를 분류한다.

### 4단계: STATE.md 갱신

STATE.md 파일을 다음 항목에 대해 업데이트한다:

- **Last Updated** 타임스탬프를 현재 시각으로 갱신
- **Active Modules** 테이블의 진행률(%) 업데이트 (PLAN 체크박스 기반)
- 완료된 태스크를 **Active** 섹션에서 **Resolved** 섹션으로 이동
- 새로 발견된 이슈를 **Open Issues** 섹션에 추가

### 5단계: 다음 액션 제안

우선순위 기반으로 다음에 수행할 작업 항목을 제안한다:

- 진행률이 가장 높은(완료에 가까운) 모듈 우선
- blocking dependency가 있는 태스크 우선
- CONCERNS.md의 critical 이슈 우선

## STATE.md 미존재 시

`.planning/STATE.md`가 존재하지 않으면 아래 template으로 새로 생성한다:

```markdown
# Project State

> Last Updated: YYYY-MM-DD HH:MM

## Active Modules

| Module | Plan | Progress | Status |
|--------|------|----------|--------|

## Open Issues

_No open issues._

## Resolved

_No resolved items yet._

## Next Actions

1. (우선순위에 따라 자동 생성)
```

## 출력 형식

갱신 완료 후 변경 요약을 다음 형식으로 출력한다:

```
[STATE 갱신 완료]
- 업데이트된 모듈: <목록>
- 전체 진행률: <N>%
- 새 이슈: <N>건
- 해결된 이슈: <N>건
- 다음 추천 액션: <요약>
```
