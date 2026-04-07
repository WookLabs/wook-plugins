---
name: 04-design-review
description: "Use this skill when reviewing and refining design artifacts from multiple angles. Triggers on: '설계 리뷰', '설계 검토', 'design review'."
user-invocable: true
---

# /design-review - 설계 산출물 검토

$ARGUMENTS

설계 완료 후, 4명의 전문가가 다각도로 검토합니다.

## Provider 선택

기본: **Codex** (리뷰 태스크, 비용 효율)
- `--claude`: Claude 팀으로 강제
- 프로젝트 override: `meta/project.json`의 `provider_routing.design-review`

## Quick Start

```bash
/design-review           # Codex로 검토 (기본)
/design-review --claude  # Claude 4-agent 팀 검토 (품질 우선)
```

## --codex: Codex CLI(GPT-5.4) 설계 리뷰

`$ARGUMENTS`에 `--codex`가 있으면 4에이전트 관점을 GPT-5.4 단일 호출로 통합 수행합니다:
```spec
Bash("node scripts/codex-reviewer.mjs --mode design-review --project {projectPath}")
```

## 실행

team-orchestrator에 design-review-team 실행을 위임합니다:

```spec
Task(subagent_type="novel-dev:team-orchestrator", model="sonnet", prompt="
팀 실행: design-review-team
프로젝트: {projectPath}
")
```

## 팀 구성 (4명, 병렬)

| 에이전트 | 역할 | 검토 관점 |
|---------|------|----------|
| critic | 서사 품질 | 구조적 완성도, 캐릭터 깊이 |
| lore-keeper | 세계관 일관성 | 설정 모순, 누락 |
| genre-validator | 장르 적합성 | 독자 기대 충족 |
| plot-architect | 플롯 구조 | 아크 균형, 긴장 곡선 |

## 결과

- 검토 리포트 + 수정 제안 제시
- 사용자 승인 후 수정 적용
