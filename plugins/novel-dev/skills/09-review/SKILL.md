---
name: 09-review
description: "Use this skill when evaluating completed chapters (quality scoring, engagement analysis, consistency check). Read-only evaluation — no manuscript changes. Triggers on: '리뷰', '평가', '검증', 'review', 'evaluate'."
user-invocable: true
---

# /review - 챕터 평가

$ARGUMENTS

완성된 챕터를 리뷰 팀이 다각도로 평가합니다. 원고를 수정하지 않고 점수와 피드백만 제공합니다.

## Quick Start

```bash
/review 5        # 5화 평가
/review 1-10     # 1~10화 순차 평가
/review 5 --deep # 5화 심층 평가 (6명)
```

## 실행

### 기본 평가 (verification-team, 3명 병렬)

```spec
Task(subagent_type="novel-dev:team-orchestrator", model="sonnet", prompt="
팀 실행: verification-team
대상: Chapter {chapterNumber}
프로젝트: {projectPath}
")
```

| 에이전트 | 모델 | 평가 관점 |
|---------|------|----------|
| critic | opus | 서사/플롯/캐릭터/배경 4차원 품질 (0-100) |
| beta-reader | sonnet | 독자 몰입도 + 이탈 위험 분석 |
| genre-validator | sonnet | 장르 적합성 + 상업성 |

### 심층 평가 (--deep, deep-review-team, 6명 병렬)

```spec
Task(subagent_type="novel-dev:team-orchestrator", model="sonnet", prompt="
팀 실행: deep-review-team
대상: Chapter {chapterNumber}
프로젝트: {projectPath}
")
```

추가 에이전트: consistency-verifier, engagement-optimizer, character-voice-analyzer

## Quality Gates

| 에이전트 | 기준 |
|---------|------|
| critic | >= 85 |
| beta-reader | >= 75 |
| genre-validator | >= 90 |

## 결과

- 평가 리포트 (점수 + 구체적 피드백)
- 원고 수정 **없음** — 수정이 필요하면 `/revise`를 사용하세요
- 결과 파일: `reviews/verification_ch{N}_{timestamp}.json`

## 다음 단계

평가 후 수정이 필요하면:
```bash
/revise 5    # 집필 팀이 피드백 기반으로 퇴고
```
