---
date: 2026-03-29
topic: review-skill-split
---

# Review Skill Split: plot-review + act-review

## Problem Frame

현재 `/review`가 모호하다. 회차 평가, 설계 리뷰, 일반 리뷰가 뒤섞여 있어 사용자가 어떤 리뷰를 호출하는지 불명확하다. 소설 창작 워크플로우에서 리뷰는 **대상별로** 명확히 분리되어야 한다: 플롯 → 플롯 리뷰, 막 집필 → 막 리뷰.

## Requirements

**신규 스킬**
- R1. `/plot-review` 스킬 신설 — `plot-review-team` (4에이전트 병렬) 호출. 회차 플롯 생성(`/gen-plot`) 후 플롯 품질 검증 용도.
- R2. `/act-review` 스킬 신설 — `deep-review-team` (6에이전트 병렬) 호출. 막 전체 평가 후 문제 회차만 선택적 심층 리뷰.

**제거 스킬**
- R3. `/09-review` (회차 평가) 제거 — act-review가 막+회차를 포괄.
- R4. `/review` (unnumbered, 범용 설계 리뷰) 제거 — `/design-review`와 역할 중복.

**유지 스킬**
- R5. `/09-revise` 유지 — 리뷰 결과 기반 퇴고는 별도 concern.

**act-review 동작**
- R6. 막 전체 원고를 읽고 거시적 평가 수행 (아크 완성도, 감정 곡선, 일관성, 페이싱).
- R7. 거시 평가 후 문제 회차만 식별하여 심층 리뷰 (효율적 선택적 접근).
- R8. 인자: 막 번호 (`/act-review 2` = 2막 리뷰).

**plot-review 동작**
- R9. `plot-review-team` 4에이전트 병렬 실행 (critic, consistency-verifier, genre-validator, plot-architect).
- R10. 인자: 회차 범위 (`/plot-review 1-5` = 1~5화 플롯 리뷰).

## Success Criteria

- `/plot-review`로 플롯 품질 검증 가능
- `/act-review`로 막 단위 + 선택적 회차 심층 리뷰 가능
- 모호한 `/review` 제거로 스킬 체계 명확화
- routing-rules.json, help, README 등 참조 일관성 유지

## Scope Boundaries

- 팀 JSON 신설 불필요 (plot-review-team, deep-review-team 기존 활용)
- `/09-revise`는 변경하지 않음
- `/design-review`, `/blueprint-review`는 변경하지 않음

## Key Decisions

- act-review가 회차 리뷰를 포괄: 별도 chapter-review 불필요
- deep-review-team 재활용: 6에이전트가 충분히 다각적
- 선택적 심층: 막 전체 → 문제 회차만 drill-down (효율성)

## Next Steps

→ `/ce:plan` for structured implementation planning
