<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-17 -->

# teams

## Purpose

에이전트 팀 프리셋 정의를 관리하는 디렉토리. 각 `.team.json` 파일은 `schemas/team.schema.json`을 준수하며, 역할 기반 에이전트 조직 + 워크플로우 + 품질 게이트를 정의합니다.

`/novel-dev:team-nov run <name>` 명령으로 실행하면 `team-orchestrator` 에이전트가 팀 정의를 로드하여 자동으로 에이전트를 조직화하고 워크플로우를 실행합니다.

## Preset Teams (9개)

| File | Name | Category | Agents | Workflow | 용도 |
|------|------|----------|--------|----------|------|
| `planning-team.team.json` | 설계 팀 | planning | plot-architect, lore-keeper, style-curator | collaborative | 소설 기획/설계 |
| `design-execution-team.team.json` | 설계 실행 팀 | planning | style-curator, lore-keeper, plot-architect | pipeline | 9개 설계 스킬 의존 그래프 실행 |
| `writing-team.team.json` | 집필 팀 | writing | novelist, proofreader, summarizer | sequential | 회차 집필 |
| `writing-team-2pass.team.json` | 2-Pass 집필 팀 | writing | scene-drafter, assembly-agent, quality-oracle, prose-surgeon, proofreader | pipeline | 정밀 집필 |
| `verification-team.team.json` | 검증 팀 | verification | critic, beta-reader, genre-validator | parallel | 품질 검증 |
| `deep-review-team.team.json` | 심층 리뷰 팀 | verification | critic, beta-reader, consistency-verifier, engagement-optimizer, character-voice-analyzer, prose-quality-analyzer | parallel | 심층 다관점 리뷰 |
| `design-review-team.team.json` | 설계 리뷰 팀 | verification | critic, lore-keeper, genre-validator, plot-architect | parallel | 설계 산출물 다관점 리뷰 |
| `plot-review-team.team.json` | 플롯 리뷰 팀 | verification | critic, consistency-verifier, genre-validator, plot-architect | parallel | 플롯 파일 다관점 검증 |
| `revision-team.team.json` | 퇴고 팀 | revision | critic, editor, proofreader, consistency-verifier | pipeline | 피드백 기반 퇴고 |

## Workflow Types

| Type | 설명 | 사용 팀 |
|------|------|---------|
| `parallel` | 모든 에이전트 동시 실행 + 결과 집계 | verification-team, deep-review-team, design-review-team, plot-review-team |
| `sequential` | 순차 체인 (이전 출력 → 다음 입력) | writing-team |
| `pipeline` | 단계별 순차 + 품질 게이트 + 재시도 | writing-team-2pass, revision-team, design-execution-team |
| `collaborative` | 자율 협업 (lead가 SendMessage로 조율) | planning-team |

## Quality Gates

| 팀 | Consensus | 주요 기준 |
|----|-----------|-----------|
| verification-team | all_pass | critic>=85, beta-reader>=75, genre-validator>=90 |
| deep-review-team | majority | 6개 에이전트, 과반수 통과 |
| writing-team-2pass | all_pass | quality-oracle>=80 |
| revision-team | all_pass | critic>=85, consistency-verifier>=85 |
| design-review-team | all_pass | critic>=80, lore-keeper>=85, genre-validator>=85, plot-architect>=80 |
| plot-review-team | all_pass | critic>=80, consistency-verifier>=85, genre-validator>=85, plot-architect>=80 |

## 사용자 정의 팀

`/novel-dev:team-nov create <name>` 명령으로 커스텀 팀을 만들 수 있습니다. `templates/team.template.json`을 기반으로 대화형 위자드가 팀 정의를 생성합니다.

커스텀 팀 파일도 이 디렉토리에 저장됩니다.

## For AI Agents

### 팀 실행 방법

```spec
// 1. 팀 정의 로드
const def = Read(`teams/${teamName}.team.json`);

// 2. team-orchestrator에 위임
Task({
  subagent_type: "novel-dev:team-orchestrator",
  model: "sonnet",
  prompt: `팀 실행: ${teamName}, 대상: Chapter ${N}`
});
```

### 새 프리셋 팀 추가

1. `teams/{name}.team.json` 파일 생성 (team.schema.json 준수)
2. agents, workflow, coordination, quality_gates 정의
3. 이 AGENTS.md 문서 업데이트
4. `skills/team-nov/SKILL.md`의 의존 에이전트 표 업데이트

## Dependencies

- `schemas/team.schema.json` — 팀 정의 스키마
- `schemas/team-state.schema.json` — 팀 실행 상태 스키마
- `agents/team-orchestrator.md` — 범용 오케스트레이터
- `skills/team-nov/SKILL.md` — `/novel-dev:team-nov` 스킬 정의
- `templates/team.template.json` — 커스텀 팀 템플릿
