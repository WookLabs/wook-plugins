---
name: planning-status
description: "Use when resuming work on an RTL project or checking progress. Reads .planning/STATE.md and summarizes current status. Trigger with 'planning status', 'where was I', 'project status', 'resume work'."
user-invocable: true
allowed-tools:
  - Read
  - Glob
  - Grep
---

이 skill은 `.planning/STATE.md`와 모든 `*_PLAN.md` 파일을 읽어 프로젝트 진행 상황 요약을 생성한다.

## 실행 절차

### 1단계: `.planning/` 디렉토리 존재 확인

현재 작업 디렉토리에서 `.planning/` 디렉토리를 확인한다.

- `.planning/` 디렉토리가 **존재하지 않으면**, 사용자에게 다음을 안내한다:
  > `.planning/` 디렉토리가 없습니다. `planning:init`을 먼저 실행하여 프로젝트 계획 구조를 초기화하세요.
- 존재하면 다음 단계로 진행한다.

### 2단계: STATE.md 읽기

`Read` 도구로 `.planning/STATE.md`를 읽는다.

추출할 정보:
- **현재 상태** (Active / Paused / Blocked)
- **활성 모듈** 목록
- **진행 중인 태스크**
- **주요 concerns / blockers**
- **마지막 업데이트 시간**

### 3단계: PLAN 파일 스캔

`Glob` 도구로 `.planning/*_PLAN.md` 파일들을 검색한다.

각 PLAN 파일에 대해 `Grep`을 사용하여:
- `- [x]` (완료된 항목) 개수를 센다
- `- [ ]` (미완료 항목) 개수를 센다
- 진행률을 계산한다: `완료 / (완료 + 미완료) * 100%`

### 4단계: CONCERNS 파일 확인

`Read` 도구로 `.planning/codebase/CONCERNS.md`를 읽는다.

- 미해결 이슈 (열린 항목) 개수를 센다
- 심각도별로 분류한다 (Critical / Warning / Info)

### 5단계: 요약 출력

다음 형식으로 결과를 출력한다:

```
## 프로젝트 상태: [Active/Paused/Blocked]

### 모듈별 진행률

| Module | Progress | Status |
|--------|----------|--------|
| module_a | 75% (6/8) | In Progress |
| module_b | 100% (4/4) | Complete |
| module_c | 0% (0/5) | Not Started |

### 미해결 이슈: N건
- Critical: X건
- Warning: Y건
- Info: Z건

### 다음 추천 액션
1. [가장 우선순위 높은 미완료 태스크]
2. [미해결 critical 이슈 해결]
3. [다음 모듈 착수]

### 마지막 업데이트: YYYY-MM-DD HH:MM
```

## 주의사항

- STATE.md가 존재하지만 내용이 비어있으면, 각 PLAN 파일에서 상태를 추론한다.
- PLAN 파일이 하나도 없으면 "계획 파일이 없습니다. `planning:init`으로 초기화하세요."를 안내한다.
- 진행률 계산 시 중첩된 checkbox는 최하위 항목만 카운트한다.
