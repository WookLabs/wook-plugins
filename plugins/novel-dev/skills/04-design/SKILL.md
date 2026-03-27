---
name: 04-design
description: "Use this skill when designing all aspects of a novel project (style, world, characters, arcs, foreshadowing, hooks). Triggers on: '설계', '디자인', 'design'."
user-invocable: true
---

# /design - 소설 전체 설계

$ARGUMENTS

03-init 완료 후, 문체부터 훅까지 전체 설계를 팀으로 실행합니다.

## Quick Start

```bash
/design          # 전체 설계 실행
/design-review   # 설계 산출물 검토 및 수정
```

## Prerequisites

- 03-init 완료 (`plot/structure.json`, `meta/project.json` 존재)
- `BLUEPRINT.md` 존재

## 실행

team-orchestrator에 design-execution-team 실행을 위임합니다:

```spec
Task(subagent_type="novel-dev:team-orchestrator", model="sonnet", prompt="
팀 실행: design-execution-team
프로젝트: {projectPath}
")
```

## 팀 구성 (5명)

| 에이전트 | 모델 | 단계 | 산출물 |
|---------|------|------|--------|
| style-curator | sonnet | Step 1 | style-guide.json |
| lore-keeper | sonnet | Step 1, 3 | world.json, relationships.json |
| character-designer | opus | Step 2 | characters/*.json, agents/characters/*.md |
| plot-architect | opus | Step 3, 4 | timeline.json, main-arc.json |
| arc-designer | sonnet | Step 5-7 | sub-arcs/*.json, foreshadowing.json, hooks.json |

## 파이프라인

1. 문체 + 세계관 (병렬)
2. 캐릭터 설계 + 에이전트 생성
3. 관계도 + 타임라인 (병렬)
4. 메인 아크
5. 서브 아크
6. 복선
7. 훅

## 완료 후

```
[OK] 전체 설계 완료. /design-review로 검토하거나, /gen-plot으로 회차별 플롯을 생성하세요.
```
