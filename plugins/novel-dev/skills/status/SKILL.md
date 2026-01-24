---
name: status
description: |
  Triggers when user wants to check workflow progress.
  <example>상태 확인</example>
  <example>진행 상황</example>
  <example>check status</example>
  <example>/status</example>
  <example>어디까지 했어?</example>
  <example>워크플로우 현황</example>
user-invocable: true
---

# /status - 워크플로우 상태

현재 소설 프로젝트의 워크플로우 진행 상황을 표시합니다.

## 구분: status vs stats

| 명령어 | 역할 | 초점 |
|--------|------|------|
| `/status` | 워크플로우 진행 | 어디까지 했는가? |
| `/stats` | 콘텐츠 통계 | 무엇을 만들었는가? |

## Phase 감지 로직

### Phase 1: 초기화
- **완료 조건**: `meta/project.json` 존재
- **표시**: `[x] init`

### Phase 2: 설계
- **완료 조건**:
  - `world/world.json` 존재 → `[x] design-world`
  - `characters/*.json` 1개 이상 → `[x] design-character`
  - `plot/main-arc.json` 존재 → `[x] design-main-arc`
  - `plot/sub-arcs/*.json` 1개 이상 (선택) → `[x] design-sub-arc`
  - `plot/foreshadowing.json` 존재 → `[x] design-foreshadow`
  - `plot/hooks.json` 존재 → `[x] design-hook`

### Phase 3: 플롯 생성
- **완료 조건**: `chapters/chapter_001.json` 존재
- **표시**: `[x] gen-plot`

### Phase 4: 집필
- **진행 조건**: `meta/ralph-state.json` 존재 및 `current_chapter` 확인
- **완료 조건**: 모든 `chapters/chapter_*.md` 존재
- **표시**:
  - 진행 중: `[~] write (12/50)`
  - 완료: `[x] write`

### Phase 5: 퇴고/검증
- **완료 조건**:
  - 모든 `reviews/chapter_*_review.json` 존재 → `[x] evaluate`
  - `reviews/consistency-report.json` 존재 → `[x] consistency-check`

### Phase 6: 내보내기
- **완료 조건**: `exports/` 폴더에 출력 파일 존재
- **표시**: `[x] export`

## 출력 형식

```
══════════════════════════════════════════════════════════════
  Novel Sisyphus Workflow Status
══════════════════════════════════════════════════════════════

  Project: {project_title}
  ID: {novel_id}

  -- Phase 1: 초기화 ------------------------------------------
  [x] init           프로젝트 초기화

  -- Phase 2: 설계 --------------------------------------------
  [x] design-world       세계관 설계
  [x] design-character   캐릭터 설계 (4명)
  [x] design-main-arc    메인 아크 설계
  [ ] design-sub-arc     서브 아크 설계 (선택)
  [x] design-foreshadow  복선 설계 (8개)
  [x] design-hook        훅/떡밥 설계 (12개)

  -- Phase 3: 플롯 --------------------------------------------
  [x] gen-plot       플롯 생성 (50화)

  -- Phase 4: 집필 --------------------------------------------
  [~] write          단일 회차 (12/50)
  [ ] write-act      막 단위 집필
  [~] write-all      전체 집필 (Ralph Loop 활성)

  -- Phase 5: 퇴고/검증 ---------------------------------------
  [ ] revise         퇴고
  [ ] evaluate       평가
  [ ] consistency-check   일관성 검사

  -- Phase 6: 완료 --------------------------------------------
  [ ] export         내보내기

══════════════════════════════════════════════════════════════

  현재 상태
  ├─ 현재 회차: 12
  ├─ 현재 막: 1 (1-15화)
  ├─ 마지막 점수: 87점
  ├─ Ralph 활성: YES
  └─ Resume 가능: YES

  다음 단계
  → /write 12  또는  /write-all --resume

══════════════════════════════════════════════════════════════
```

## 의존 파일

| 파일 | 용도 |
|------|------|
| `meta/project.json` | 프로젝트 정보 |
| `meta/ralph-state.json` | Ralph 상태 |
| `world/world.json` | Phase 2 완료 |
| `characters/*.json` | Phase 2 완료 |
| `plot/main-arc.json` | Phase 2 완료 |
| `chapters/chapter_*.json` | Phase 3 완료 |
| `chapters/chapter_*.md` | Phase 4 진행 |
| `reviews/*_review.json` | Phase 5 완료 |
| `exports/*` | Phase 6 완료 |
