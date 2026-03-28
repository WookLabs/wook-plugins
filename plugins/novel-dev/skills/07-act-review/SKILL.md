---
name: 07-act-review
description: "Use this skill when reviewing a completed act (macro evaluation + selective chapter deep-dive). Triggers on: '막 리뷰', '막 평가', 'act review'."
user-invocable: true
---

# /act-review - 막(Act) 리뷰

$ARGUMENTS

완성된 막의 원고를 deep-review-team (6에이전트 병렬)이 거시적으로 평가하고, 문제 회차만 선택적으로 심층 리뷰합니다.

## Quick Start

```bash
/act-review 1          # 1막 리뷰 (Claude 팀, 기본)
/act-review 2          # 2막 리뷰
/act-review 1 --codex  # 1막 리뷰 (Codex/GPT-5.4, 비용 절감)
```

## Prerequisites

- 해당 막의 원고 `chapters/chapter_{N}.md` 존재 (집필 완료)
- `/write-act` 실행 후 사용 권장

## 실행

### --codex: Codex CLI(GPT-5.4) 리뷰

`$ARGUMENTS`에 `--codex`가 있으면 6에이전트 관점을 GPT-5.4 단일 호출로 통합 수행합니다:

```spec
Bash("node scripts/codex-reviewer.mjs --mode act --act {actNumber} --project {projectPath}")
```

거시 평가 + 문제 회차 심층 리뷰를 한 번의 호출로 수행합니다.
Codex CLI가 자체 인증을 처리하므로 별도 API 키가 필요하지 않습니다.

### 기본 (Claude 팀):

### Step 1: 막 범위 확인

`plot/structure.json`에서 해당 막의 회차 범위를 확인합니다.

### Step 2: 거시 평가 (deep-review-team, 6명 병렬)

막 전체 원고를 대상으로 거시적 평가를 수행합니다:

```spec
Task(subagent_type="novel-dev:team-orchestrator", model="sonnet", prompt="
팀 실행: deep-review-team
대상: Act {actNumber} (Chapter {startCh}-{endCh})
프로젝트: {projectPath}
모드: macro-evaluation

거시 평가 항목:
- 아크 완성도 (시작/전개/클라이맥스/마무리)
- 감정 곡선 흐름
- 회차 간 일관성
- 페이싱 밸런스
- 캐릭터 보이스 일관성
- 산문 품질 전반
")
```

| 에이전트 | 모델 | 평가 관점 |
|---------|------|----------|
| critic | opus | 문학 품질, 서사적 깊이, 구조적 완성도 |
| beta-reader | sonnet | 독자 몰입도, 감정 반응, 이탈 위험 구간 |
| consistency-verifier | sonnet | 설정 일관성, 캐릭터 동선, 타임라인 |
| engagement-optimizer | sonnet | 긴장 곡선, 장면 리듬, 비트 타이밍 |
| character-voice-analyzer | sonnet | 말투 일관성, OOC 감지, 대화 자연스러움 |
| quality-oracle | opus | show vs tell, 감각 묘사, 필터 단어, 구체성 |

### Step 3: 문제 회차 식별

거시 평가에서 점수가 낮거나 이슈가 집중된 회차를 식별합니다:
- Quality gate 미달 회차
- 에이전트 2명 이상이 지적한 회차
- 일관성/보이스 이탈이 감지된 회차

### Step 4: 선택적 심층 리뷰

문제 회차에 대해서만 개별 심층 리뷰를 수행합니다:

```spec
for chapter in flagged_chapters:
    Task(subagent_type="novel-dev:team-orchestrator", model="sonnet", prompt="
    팀 실행: deep-review-team
    대상: Chapter {chapter}
    프로젝트: {projectPath}
    모드: deep-chapter-review
    거시 평가 컨텍스트: {macroFeedback}
    ")
```

## Quality Gates (거시 평가)

| 에이전트 | 기준 |
|---------|------|
| critic | >= 85 |
| beta-reader | >= 75 |
| consistency-verifier | >= 85 |
| engagement-optimizer | >= 70 |
| character-voice-analyzer | >= 80 |
| quality-oracle | >= 75 |

## 결과

- 막 전체 거시 리포트 (6관점 점수 + 피드백)
- 문제 회차 심층 리포트 (해당 시)
- 원고 수정 **없음** — 수정이 필요하면 `/revise`를 사용하세요
- 결과 파일: `reviews/act-review_act{N}_{timestamp}.json`

## 다음 단계

리뷰 후 수정이 필요하면:
```bash
/revise 5    # 집필 팀이 피드백 기반으로 퇴고
```
