---
name: 09-revise
description: "Use this skill when revising chapters based on review feedback. The writing team (narrator + characters) collaboratively revises the manuscript. Triggers on: '퇴고', '수정', 'revise'."
user-invocable: true
---

# /revise - 피드백 기반 퇴고

$ARGUMENTS

집필 팀(narrator + character agents)이 /act-review 또는 /plot-review 피드백을 기반으로 collaborative 모드로 원고를 퇴고합니다.

## Quick Start

```bash
/revise 5        # 5화 퇴고
/revise 1-10     # 1~10화 순차 퇴고
/revise 5 --solo # 5화 editor 단독 퇴고
```

## Prerequisites

- `chapters/chapter_{N}.md` 존재 (집필 완료)
- `/act-review` 또는 `/plot-review` 결과가 있으면 피드백을 자동 로드 (없어도 실행 가능)

## 실행

### 기본 (집필 팀 collaborative 퇴고)

review 피드백이 있으면 로드한 뒤, 집필 팀이 collaborative로 원고를 수정합니다:

```spec
# 1. review 피드백 로드 (있으면)
feedback = Read("reviews/verification_ch{N}_*.json") or null

# 2. 집필 팀 collaborative 퇴고
Task(subagent_type="novel-dev:team-orchestrator", model="sonnet", prompt="
팀 실행: writing-team-collab
대상: Chapter {chapterNumber}
프로젝트: {projectPath}
모드: revise
피드백: {feedback}
")
```

- narrator가 피드백을 분석하고 수정 방향을 잡음
- character agents가 자기 캐릭터의 대사/내면을 직접 다듬음
- narrator가 서술/전환/페이싱을 개선
- proofreader → summarizer 순차 실행

### --solo (editor 단독 퇴고)

```spec
Task(subagent_type="novel-dev:editor", model="sonnet", prompt="
챕터 {chapterNumber} 퇴고:
피드백: {feedback}
")
```

## 팀 구성 (collaborative)

| 에이전트 | 역할 |
|---------|------|
| narrator (lead) | 피드백 분석 + 수정 방향 조율 + 서술 개선 |
| character agents | 자기 캐릭터의 대사/내면 직접 다듬기 |
| proofreader | 최종 교정 |
| summarizer | 요약 업데이트 |

## 결과

- 수정된 원고가 `chapters/chapter_{N}.md`에 저장
- 요약이 `context/summaries/chapter_{N}_summary.md`에 업데이트
