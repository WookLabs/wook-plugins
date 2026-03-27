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
