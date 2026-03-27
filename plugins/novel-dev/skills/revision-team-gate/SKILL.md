---
name: revision-team-gate
description: "Internal skill for automated revision-team execution after writing. Invoked by /write, /write-act, /write-all with --team flag."
user-invocable: false
---

# revision-team-gate - Revision Team 자동 검증 게이트

$ARGUMENTS (챕터 번호)

> **Internal skill**: 사용자가 직접 호출하지 않습니다.
> `/write --team`, `/write-act --team`, `/write-all --team`에서 자동 호출됩니다.

## 실행 흐름

### Step 1: Surgical Directives 이력 수집

해당 챕터에 대해 quality-oracle/prose-surgeon이 적용한 수정 이력을 수집합니다:

- revision-loop 실행 기록에서 `executionRecords` 참조
- 적용된 directive 타입, 위치, 수정 내용 요약

이력이 없으면 다음 메시지로 대체합니다: "이전 단계에서 적용된 정밀 수정 이력이 없습니다. editor는 자유롭게 수정할 수 있습니다."

### Step 2: team-orchestrator에 위임

```spec
Task(subagent_type="novel-dev:team-orchestrator", model="sonnet", prompt="
# Revision Team 실행

## 팀 정의
teams/revision-team.team.json

## 대상
Chapter {N} (chapters/chapter_{pad(N, 3)}.md)

## 추가 컨텍스트 (Surgical Edits 보존)
이전 단계에서 quality-oracle/prose-surgeon이 적용한 수정 이력:
{surgical_directives_history}

**중요**: editor는 위 passage-level 수정사항을 존중해야 합니다.
필터워드 제거, 감각 보강, 리듬 변화 등 정밀 수정을 되돌리지 마세요.
전체 구조, 페이싱, 대화 품질 개선에 집중하세요.

## 지시
1. revision-team.team.json을 로드하여 pipeline 워크플로우를 실행하세요
2. critic -> editor -> proofreader -> consistency-verifier 순서로 진행
3. quality_gates: critic >= 85, consistency-verifier >= 85
4. 결과를 reviews/team/revision-team_ch{N}_{timestamp}.json에 저장하세요

## 실패 시
- 원고 파일(chapters/chapter_{pad(N, 3)}.md)을 변경하지 마세요
- 경고 리포트를 반환하세요

## 에러 처리
- team-orchestrator Task 호출 자체가 실패하면 quality gate 미통과와 동일하게 처리합니다 (원고 보존, 경고 리포트)
- 파이프라인 부분 완료(예: critic 성공, editor 실패)도 동일하게 원고 보존
")
```

### Step 3: 결과 처리

**성공 시** (quality gate 통과):
- editor가 수정한 챕터를 `chapters/chapter_{pad(N, 3)}.md`에 저장
- 결과를 `reviews/team/revision-team_ch{N}_{timestamp}.json`에 저장
- 성공 메시지 표시:
  ```
  [OK] revision-team 검증 통과 (critic: {score} >= 85, consistency: {score} >= 85)
  수정본이 저장되었습니다.
  ```

**실패 시** (quality gate 미통과):
- 원고(`chapters/chapter_{pad(N, 3)}.md`)는 **변경하지 않고 그대로 보존**
- 결과를 `reviews/team/revision-team_ch{N}_{timestamp}.json`에 저장
- 경고 리포트 표시:
  ```
  [WARN] revision-team 검증 미통과 (critic: {score} < 85, consistency: {score} < 85)
  원고는 그대로 저장되었습니다. 수동 퇴고를 권장합니다:
    /novel-dev:team-nov run revision-team {N}
  상세: reviews/team/revision-team_ch{N}_{timestamp}.json
  ```

**중요**: 실패가 상위 스킬의 집필 흐름을 중단하지 않습니다.

## Output Paths

| 유형 | 경로 |
|------|------|
| 팀 실행 결과 | `reviews/team/revision-team_ch{N}_{timestamp}.json` |
| 팀 실행 상태 | `.omc/state/team-{id}.json` (team-orchestrator 관리) |

## Dependencies

- `teams/revision-team.team.json` — 팀 정의
- `agents/team-orchestrator.md` — 오케스트레이션 위임 대상
