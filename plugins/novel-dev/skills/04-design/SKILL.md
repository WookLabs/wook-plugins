---
name: 04-design
description: "Use this skill when designing all aspects of a novel project (style, world, characters, arcs, foreshadowing, hooks). Triggers on: '설계', '디자인', 'design'."
user-invocable: true
---

# /design - 소설 전체 설계

$ARGUMENTS

03-init 완료 후, 5명의 설계 팀이 collaborative 모드로 실시간 소통하며 전체 설계를 수행합니다.

## Quick Start

```bash
/design          # 전체 설계 실행 (Claude 팀, 기본)
/design --codex  # 전체 설계 (Codex/GPT-5.4, 비용 절감)
/design-review   # 설계 산출물 검토 및 수정
```

## --codex: Codex CLI(GPT-5.4) 설계

`$ARGUMENTS`에 `--codex`가 있으면 5에이전트 관점을 GPT-5.4 단일 호출로 통합 수행합니다:
```spec
Bash("node scripts/codex-writer.mjs --project {projectPath} --mode design")
```
결과 JSON을 `meta/design-codex-output.json`에 저장 후, 각 파일로 분배합니다.

## Prerequisites

- 03-init 완료 (`plot/structure.json`, `meta/project.json` 존재)
- `BLUEPRINT.md` 존재

## 실행

### Phase 0: 설계 전략 수립 (자동)

팀 실행 전에 plot-architect가 blueprint를 분석하여 설계 전략을 수립합니다:

```spec
Task(subagent_type="novel-dev:plot-architect", model="opus", prompt="
프로젝트: {projectPath}

설계 전략을 수립하세요:
1. BLUEPRINT.md를 읽고 분석
2. meta/project.json, plot/structure.json 참조
3. templates/design-strategy.template.json 구조를 참고하여
   meta/design-strategy.json 생성

포함할 내용:
- 핵심 톤/분위기 방향
- 세계관 설계 우선순위
- 캐릭터 설계 방침
- 아크 구조 전략
- 각 에이전트(style-curator, lore-keeper, character-designer, arc-designer)에 대한 구체적 지시사항
- 장르별 필수 비트 및 회피 패턴
- 프로젝트 제약 사항

이 전략 문서는 이후 Phase 1~3에서 모든 에이전트가 참조합니다.
구체적이고 실행 가능한 지시사항을 작성하세요.
")
```

### Phase 1~3: 팀 실행

team-orchestrator에 design-execution-team 실행을 위임합니다:

```spec
Task(subagent_type="novel-dev:team-orchestrator", model="sonnet", prompt="
팀 실행: design-execution-team
프로젝트: {projectPath}
모드: collaborative

⚠️ Phase 0 전략 참조: meta/design-strategy.json에 설계 전략이 있습니다.
모든 에이전트는 작업 시작 전에 이 파일을 읽고, agent_directives 섹션의
자기 에이전트 지시사항을 따르세요.
")
```

## 팀 구성 (5명, collaborative)

| 에이전트 | 모델 | 역할 | 산출물 |
|---------|------|------|--------|
| **plot-architect** (lead) | opus | 전체 조율 + 타임라인 + 메인 아크 | timeline.json, main-arc.json |
| style-curator | sonnet | 문체 설계 + 문체 일관성 자문 | style-guide.json |
| lore-keeper | sonnet | 세계관 + 관계도 + 정합성 검증 | world.json, relationships.json |
| character-designer | opus | 캐릭터 프로필 + 에이전트 생성 | characters/*.json, agents/characters/*.md |
| arc-designer | sonnet | 서브아크 + 복선 + 훅 | sub-arcs/*.json, foreshadowing.json, hooks.json |

## Collaborative 진행 방식

plot-architect(lead)가 TeamCreate로 팀을 구성하고 SendMessage로 조율합니다.

**Phase 1: 기반 구축**
- style-curator + lore-keeper가 동시 진행
- 상호 참조: 문체가 세계관 분위기에 맞는지 실시간 조율

**Phase 2: 캐릭터**
- character-designer 주도, lore-keeper가 세계관 정합성 검증
- character-designer가 캐릭터 에이전트 파일도 자동 생성

**Phase 3: 구조**
- plot-architect + arc-designer 주도
- character-designer가 캐릭터 동기/결함 기반 플롯 자문
- 서브아크 → 복선 → 훅 순으로 진행하되, 필요시 역순 피드백

## 완료 후

```
[OK] 전체 설계 완료. /design-review로 검토하거나, /gen-plot으로 회차별 플롯을 생성하세요.
```
