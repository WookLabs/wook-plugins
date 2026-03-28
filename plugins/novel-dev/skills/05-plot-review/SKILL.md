---
name: 05-plot-review
description: "Use this skill when reviewing generated chapter plots for quality, consistency, and genre fit. Triggers on: '플롯 리뷰', '플롯 검증', 'plot review'."
user-invocable: true
---

# /plot-review - 플롯 리뷰

$ARGUMENTS

생성된 회차별 플롯 파일을 plot-review-team (4에이전트 병렬)이 다각도로 검증합니다.

## Quick Start

```bash
/plot-review 1-5          # 1~5화 플롯 리뷰 (Claude 팀, 기본)
/plot-review 3            # 3화 플롯 단건 리뷰
/plot-review              # 전체 플롯 리뷰
/plot-review 1-5 --codex  # 1~5화 플롯 리뷰 (Codex/GPT-5.4, 비용 절감)
```

## Prerequisites

- `chapters/chapter_{N}.json` 존재 (플롯 생성 완료)
- `/gen-plot` 실행 후 사용 권장

## 실행

### --codex: Codex CLI(GPT-5.4) 리뷰

`$ARGUMENTS`에 `--codex`가 있으면 4에이전트 관점을 GPT-5.4 단일 호출로 통합 수행합니다:

```spec
Bash("node scripts/codex-reviewer.mjs --mode plot --chapters {chapterRange} --project {projectPath}")
```

Codex CLI가 자체 인증을 처리하므로 별도 API 키가 필요하지 않습니다.

### 기본: plot-review-team (4명 병렬)

```spec
Task(subagent_type="novel-dev:team-orchestrator", model="sonnet", prompt="
팀 실행: plot-review-team
대상: Chapter {chapterRange}
프로젝트: {projectPath}
")
```

| 에이전트 | 모델 | 평가 관점 |
|---------|------|----------|
| critic | opus | 극적 긴장, 전환점 배치, 페이싱 |
| consistency-verifier | sonnet | 회차 간 연속성, 캐릭터 동선, 시간 정합성 |
| genre-validator | sonnet | 장르 비트 배치, 클리프행어 밀도, 상업성 |
| plot-architect | opus | 아크 진행률, 복선 심기/회수 타이밍, 서브플롯 밸런스 |

## Quality Gates

| 에이전트 | 기준 |
|---------|------|
| critic | >= 80 |
| consistency-verifier | >= 85 |
| genre-validator | >= 85 |
| plot-architect | >= 80 |

## 결과

- 플롯 품질 리포트 (4관점 점수 + 구체적 피드백)
- 플롯 파일 수정 **없음** — 수정이 필요하면 `/gen-plot`을 재실행하세요
- 결과 파일: `reviews/plot-review_ch{N}_{timestamp}.json`

## 다음 단계

플롯 리뷰 통과 후:
```bash
/write 1       # 1화 집필
/write-act 1   # 1막 집필
```
