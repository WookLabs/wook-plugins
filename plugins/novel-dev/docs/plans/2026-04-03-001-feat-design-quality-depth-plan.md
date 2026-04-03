---
title: "feat: Design/Plot quality depth — quantitative criteria, self-refinement, exemplars"
type: feat
status: active
date: 2026-04-03
origin: docs/brainstorms/2026-04-03-design-plot-quality-requirements.md
---

# feat: 설계/플롯 출력 품질 강화 (A+B+C)

## Overview

5개 설계 에이전트에 (A) 정량적 깊이 기준, (B) 자가 정제 루프, (C) good exemplar를 추가하여 /design과 /gen-plot의 출력 품질을 높임.

## Problem Frame

에이전트별 깊이 격차가 크고, 정량적 기준이 없는 에이전트는 얕은 출력을 생성. novel2 분석에서 세계관 종족 설명이 1줄, 플롯 beat이 추상적, 복선 hint가 "암시한다" 수준으로 확인됨. (see origin: docs/brainstorms/2026-04-03-design-plot-quality-requirements.md)

## Requirements Trace

- R1-R3. 정량적 깊이 기준 (HARD RULE)
- R4-R6. 자가 정제 루프 (1회)
- R7-R9. Good exemplar (인라인)

## Scope Boundaries

- 에이전트 .md 프롬프트 수정만 — 새 파일/스키마 없음
- 팀 구조 변경 없음

## Context & Research

### Agent Gap Analysis

| 에이전트 | 깊이 기준 | 자가 정제 | Exemplar | 취약 영역 |
|----------|----------|----------|----------|----------|
| character-designer | Good | Good | Good | behavior patterns 카운트 없음 |
| lore-keeper | **Weak** | Good | Good | **설명 최소 길이 없음**, 어휘 필드 미강제 |
| plot-architect | Good | Good | Good | "구체적으로" 지시가 자체로 추상적 |
| arc-designer | Strong | Strong | Strong | plant/payoff 구체성 템플릿 없음 |
| style-curator | Good | **Weak** | Good | 산문 품질 루브릭 없음 |

### Key Pattern: novelist.md의 HARD RULE

novelist.md의 "필터 워드 금지" 패턴이 효과적임을 확인:
- "다음 표현은 절대 사용 금지" + 구체적 대체 기법 테이블
- "자가 검증: 작성 완료 후 위 표현을 검색하여 0개인지 확인"
이 패턴을 설계 에이전트에도 적용.

## Key Technical Decisions

- **exemplar 길이**: 에이전트당 200~400자. 전체 JSON이 아닌 핵심 필드만 good/bad 비교
- **자가 정제는 프롬프트 지시**: 별도 루프가 아닌 "완성 후 다시 읽고 기준 미충족 항목 보강" 지시
- **기준은 범용**: 장르 무관, "최소 N문장/N자/N개" 형태

## Implementation Units

- [ ] **Unit 1: lore-keeper.md — 깊이 기준 + exemplar (최대 갭)**

**Goal:** 가장 얕은 출력을 내는 lore-keeper에 정량적 기준 + 자가 정제 + exemplar 추가

**Requirements:** R1, R2, R4, R7

**Files:**
- Modify: `agents/lore-keeper.md`

**Approach:**
- **깊이 기준 HARD RULE** 추가:
  - 세계관 종족/사회 설명: 최소 3문장 (배경, 특징, 다른 종족과의 관계)
  - 장소 설명: 최소 200자 (외관, 분위기, 서사적 중요성)
  - 용어 정의: 최소 2문장 (의미 + 맥락)
  - relationships 관계 설명: 최소 3문장 (현재 상태, 변화 방향, 갈등 요소)
- **자가 정제** 추가: "모든 JSON 파일 저장 후, 위 기준을 하나씩 체크하고 미충족 항목을 보강하세요."
- **Good exemplar**: 종족 설명 good vs bad 비교 (2줄 vs 5줄)

**Patterns to follow:** `agents/novelist.md`의 "필터 워드 금지" HARD RULE + 자가 검증 패턴

**Verification:** lore-keeper.md에 정량적 기준(숫자), 자가 정제 지시, good/bad 비교 예시 모두 존재

---

- [ ] **Unit 2: plot-architect.md — beat 구체성 기준 + exemplar**

**Goal:** 플롯 씬 beat의 추상성 문제 해결

**Requirements:** R1, R2, R4, R7

**Files:**
- Modify: `agents/plot-architect.md`

**Approach:**
- **깊이 기준 HARD RULE**:
  - 씬 beat: 최소 50자, 구체적 행동/대사 훅 1개 이상 포함
  - current_plot: 최소 800자
  - character_development: 구체적 변화 사건 명시 (추상적 "성장" 금지)
  - emotional_goal: 독자 감정 전환 경로 명시 (예: "혼란→공포→냉정")
- **자가 정제**: "완성 후 모든 beat을 다시 읽고, '이 beat만 보고 집필 에이전트가 씬을 쓸 수 있는가?' 자문. 불가능하면 보강."
- **Good exemplar**: beat good vs bad 비교
  - BAD: "우연한 만남, 의외로 편안한 대화"
  - GOOD: "유나가 회식 2차 바에서 준혁을 발견. 회사에서의 차가운 이미지와 달리 맥주잔을 돌리며 혼자 앉아있는 모습. 유나가 먼저 말을 건다. 준혁이 처음으로 웃는 표정을 보이고, 유나는 '이 사람 웃을 줄도 아네'라고 생각한다."

**Verification:** plot-architect.md에 beat 최소 50자 기준, good/bad 비교, 자가 정제 지시 존재

---

- [ ] **Unit 3: arc-designer.md — plant/payoff 구체성 + exemplar**

**Goal:** 복선 hint와 payoff의 구체성 강화

**Requirements:** R1, R2, R4, R7

**Files:**
- Modify: `agents/arc-designer.md`

**Approach:**
- **깊이 기준 HARD RULE**:
  - foreshadowing plant: "어떤 대사/행동/소품으로 심는지" 반드시 명시 (추상적 "암시한다" 금지)
  - hint: "어떤 장면에서 어떻게 상기시키는지" 구체적 방법 명시
  - payoff: "어떤 반전/깨달음으로 회수되는지" 구체적 장면 명시
  - hook: tension_contribution을 정량 점수뿐 아니라 "독자가 어떤 질문을 갖게 되는지" 명시
- **Good exemplar**: 복선 good vs bad
  - BAD: `"plant": "마왕이 도현에게 관심을 보인다"`
  - GOOD: `"plant": "마왕이 알현실에서 도현의 이름을 듣자 0.5초 멈칫한다. 옆의 간부가 눈치채지 못할 정도로 미세한 반응이지만, 도현의 약사 눈은 그 떨림을 포착한다."`

**Verification:** arc-designer.md에 "추상적 암시 금지" HARD RULE, good/bad 복선 비교 존재

---

- [ ] **Unit 4: character-designer.md — behavior 깊이 + 자가 정제 강화**

**Goal:** behavior patterns의 정량 기준 보강

**Requirements:** R1, R4, R7

**Files:**
- Modify: `agents/character-designer.md`

**Approach:**
- **깊이 기준 추가**:
  - habits: 최소 2개 (일상 습관 + 스트레스 반응 습관)
  - stress_response: 구체적 행동 1개 이상 (추상적 "불안해한다" 금지)
  - trauma/secret: 구체적 사건 1개 이상 명시 (언제, 어디서, 무슨 일이)
- **Good exemplar**: trauma good vs bad
  - BAD: `"trauma": "과거에 큰 상처를 받았다"`
  - GOOD: `"trauma": "17세에 형이 마약 거래 중 총에 맞아 죽는 것을 목격. 형의 피가 운동화에 묻었던 기억이 빨간색을 볼 때마다 떠오른다."`

**Verification:** character-designer.md에 habits 2개 이상, trauma 구체적 사건 기준 존재

---

- [ ] **Unit 5: style-curator.md — 품질 루브릭 + 자가 정제**

**Goal:** 산문 품질 평가 기준과 자가 정제 추가

**Requirements:** R1, R4, R7

**Files:**
- Modify: `agents/style-curator.md`

**Approach:**
- **깊이 기준 HARD RULE**:
  - exemplar 선정 시 language_features 태그 필수 (최소 2개)
  - quality_notes에 "왜 이 예시가 좋은지" 구체적 기법 3개 이상 명시
  - anti-exemplar의 quality_notes에 "어떤 문제가 있는지" 구체적 결함 3개 이상 명시
- **자가 정제**: "exemplar 저장 후, quality_notes를 다시 읽고 '이 설명만 보고 작가가 기법을 모방할 수 있는가?' 자문."
- **Good exemplar**: quality_notes good vs bad
  - BAD: `"좋은 문장이다. 감정이 잘 드러난다."`
  - GOOD: `"감정을 직접 서술하지 않고 신체 반응(떨리는 손, 출렁이는 물)으로 전달. 문장 길이 변화(단문→장문→단문)로 리듬 조절. 식은 커피, 종소리 등 구체적 소품으로 이별의 여운 강조."`

**Verification:** style-curator.md에 language_features 필수, quality_notes 3개 이상 기법 기준 존재

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| 프롬프트 길이 증가 → 토큰 비용 | exemplar는 200~400자로 제한, 전체 JSON이 아닌 핵심 필드만 |
| 기준이 너무 엄격 → 에이전트가 기준 맞추느라 창의성 저하 | "최소" 기준이지 "최대"가 아님을 명시 |
| 자가 정제 지시를 무시할 가능성 | HARD RULE 어조 + "미충족 시 완료로 보고하지 마세요" 강제 |

## Sources & References

- **Origin:** [docs/brainstorms/2026-04-03-design-plot-quality-requirements.md](docs/brainstorms/2026-04-03-design-plot-quality-requirements.md)
- Pattern: `agents/novelist.md` — HARD RULE, 자가 검증, before/after 예시
- Agent gap analysis from this session
