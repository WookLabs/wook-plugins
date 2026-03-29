---
date: 2026-03-29
topic: design-plot-phase0-team
---

# Design/Gen-Plot Phase 0 전략 수립 + Gen-Plot 팀 기반 전환

## Problem Frame

현재 design과 gen-plot 단계에서 에이전트들이 상위 전략 없이 바로 실행에 들어감. design은 5명이 동시에 설계하지만 "이 소설을 어떤 방향으로 설계할지" 합의 없이 시작하여 결과물 정합성이 낮아질 수 있음. gen-plot은 plot-architect 혼자서 전체 회차를 순차 생성하여 시야가 좁고 검증이 없음.

## Requirements

**Design Phase 0 (설계 전략 수립)**
- R1. /design 실행 시 Phase 1(실제 설계) 전에 Phase 0(전략 수립)을 자동 실행
- R2. Phase 0에서 blueprint를 분석하여 설계 전략 문서를 생성 — 문체 방향, 세계관 톤, 캐릭터 설계 우선순위, 아크 구조 전략 포함
- R3. Phase 1~3의 모든 에이전트가 Phase 0 전략 문서를 참조하며 설계

**Gen-Plot Phase 0 (플롯 전략 수립)**
- R4. /gen-plot 실행 시 회차 생성 전에 Phase 0(플롯 전략)을 자동 실행
- R5. Phase 0에서 design 산출물(main-arc, sub-arcs, foreshadowing, hooks, timeline)을 분석하여 전체 회차 배분 전략 수립 — 아크별 회차 할당, 복선 plant/payoff 타이밍, 긴장 곡선 설계
- R6. Phase 0 전략 문서가 이후 회차별 생성의 컨텍스트로 주입

**Gen-Plot 팀 기반 전환**
- R7. gen-plot을 plot-architect 단독에서 팀 기반으로 전환
- R8. 팀 구성: plot-architect(lead, 생성) + arc-designer(아크/복선 검증) + lore-keeper(세계관/타임라인 정합성) + character-designer(캐릭터 동선/성장 아크 검증)
- R9. 회차 생성 시 plot-architect가 초안 → 나머지 3명이 검증/피드백 → plot-architect가 반영하는 collaborative 워크플로우

## Success Criteria

- design Phase 0 전략 문서가 생성되고, Phase 1~3 에이전트가 이를 참조
- gen-plot Phase 0 전략 문서가 생성되고, 회차별 생성에 반영
- gen-plot이 4명 팀으로 실행되어, 단독 생성 대비 아크/복선/캐릭터 정합성 향상

## Scope Boundaries

- design/gen-plot 스킬 내부 변경만 — 새 스킬 추가 안 함
- Phase 0 전략은 사용자 검토/승인 불필요 (자동 실행)
- 기존 design-execution-team 구조 유지, Phase 0만 앞에 추가
- gen-plot 팀은 새 team.json 생성 필요

## Key Decisions

- **Phase 0은 별도 스킬이 아닌 기존 스킬 내부에 삽입**: 워크플로우 마찰 최소화. 사용자가 잘 모르는 영역이므로 자동 실행이 적합
- **gen-plot 팀에 critic/beta-reader 미포함**: 플롯 생성 단계에서는 구조적 검증이 중요, 문학적 평가는 plot-review에서 담당
- **Phase 0 전략 문서 형식**: JSON (기존 meta/ 패턴) 또는 markdown — planning에서 결정

## Outstanding Questions

### Deferred to Planning
- [Affects R2][Technical] Phase 0 전략 문서의 정확한 스키마/포맷
- [Affects R9][Technical] gen-plot 팀의 collaborative 워크플로우 상세 (동기/비동기, 라운드 수)
- [Affects R3][Needs research] design-execution-team에 Phase 0 컨텍스트를 주입하는 최적 방법 (team.json 수정 vs SKILL.md에서 프롬프트 주입)

## Next Steps

→ `/ce:plan` for structured implementation planning
