---
date: 2026-04-03
topic: design-plot-quality-enhancement
---

# Design/Gen-Plot 출력 품질 강화

## Problem Frame

현재 /design과 /gen-plot의 에이전트 출력이 충분히 자세하지 않음. novel2 분석에서 확인된 문제:
- 세계관 설명이 문자열 한 줄 수준
- 캐릭터 트라우마/과거 사건이 추상적
- 플롯 씬 beat이 "우연한 만남" 수준 — 집필 에이전트가 해석해야 할 여지가 과도
- 복선 hint가 "암시한다" 수준으로 구체성 부족

이는 에이전트 프롬프트에 (1) 정량적 깊이 기준 없음, (2) 자가 정제 루프 없음, (3) "좋은 출력"의 레퍼런스 없음이 원인.

## Requirements

**A. 프롬프트 깊이 기준 (정량적 최소 요구사항)**
- R1. 모든 설계 에이전트(character-designer, lore-keeper, plot-architect, arc-designer, style-curator)에 **정량적 깊이 기준** 추가
- R2. 기준 예시: 세계관 종족 설명 최소 3문장, 캐릭터 트라우마 구체적 사건 1개 이상, 플롯 씬 beat 최소 50자, 복선 hint에 "어떤 대사/행동으로 암시하는지" 명시
- R3. 기준은 장르/프로젝트 무관하게 범용으로 적용

**B. 자가 정제 루프**
- R4. 각 설계 에이전트가 1차 출력 완료 후 스스로 검토하여 부족한 부분을 보강하는 자가 정제 RULE
- R5. 정제 기준: R1~R3의 정량적 기준을 충족하는지 자가 체크 → 미충족 항목 보강
- R6. 1회 자가 정제 (2회 이상은 비용 대비 효과 미미)

**C. 레퍼런스 exemplar**
- R7. 5개 설계 에이전트 각각에 "good exemplar" (모범 출력 예시) 1개 이상 제공
- R8. exemplar는 프롬프트 내 인라인으로 포함 — 별도 파일이 아닌 에이전트 .md에 직접 삽입
- R9. exemplar는 장르 무관한 구조적 예시 (특정 소설의 내용이 아닌, "이 정도 깊이와 구조로 쓰세요"를 보여주는 예시)

## Success Criteria

- /design 실행 후 세계관 종족 설명이 3문장 이상
- 캐릭터 프로필에 구체적 트라우마 사건이 포함
- chapter_N.json의 씬 beat이 50자 이상이고 구체적 행동/대사 훅 포함
- 복선 hint에 "어떤 대사/행동으로 암시하는지" 명시

## Scope Boundaries

- 에이전트 .md 프롬프트 수정만 — 새 에이전트/스킬/스키마 추가 없음
- 기존 팀 구조(design-execution-team, plot-generation-team) 변경 없음
- 레퍼런스 exemplar는 에이전트 프롬프트에 인라인 — templates/ 폴더에 별도 파일 추가 안 함

## Key Decisions

- **자가 정제는 같은 에이전트가 수행**: 교차 검토보다 비용 효율적. 프롬프트에 "완성 후 다시 읽고 R1~R3 기준 미충족 항목 보강" 지시
- **exemplar는 인라인**: 별도 파일로 관리하면 동기화 부담. 프롬프트에 직접 before/after 또는 good example 삽입
- **정량적 기준은 HARD RULE**: 체크리스트가 아닌 MUST 어조 — novelist.md 패턴 따름

## Outstanding Questions

### Deferred to Planning
- [Affects R2][Needs research] 각 에이전트별 정확한 정량적 기준 수치 — 현재 에이전트 프롬프트를 읽고 어떤 필드가 가장 얕은지 분석하여 결정
- [Affects R7][Technical] exemplar 길이 — 너무 길면 프롬프트 토큰 증가, 너무 짧으면 효과 없음. 에이전트당 200~500자가 적절할 것으로 예상

## Next Steps

→ `/ce:plan` for structured implementation planning
