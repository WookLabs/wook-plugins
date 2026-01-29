---
name: deep-evaluate
description: |
  8축 심층 평가로 챕터/원고 품질을 다각도로 분석합니다.
  LongStoryEval 연구(600권 분석)의 8개 기준을 적용합니다.
  <example>심층 평가해줘</example>
  <example>deep evaluate</example>
  <example>8축 평가</example>
  <example>전체 품질 분석</example>
  <example>deep-evaluate 5화</example>
  <example>심층 품질 검사</example>
user-invocable: true
allowed-tools:
  - Read
  - Glob
  - Grep
  - Task
  - AskUserQuestion
---

# /deep-evaluate - LongStoryEval 8축 심층 평가

LongStoryEval 연구(600권 장편소설 분석)에서 도출된 8개 평가 축으로
챕터, 막, 또는 전체 원고의 품질을 다각도로 분석합니다.

기존 4차원 평가(`/evaluate`)를 **객관적 5축 + 주관적 3축 = 8축**으로 확장하여
출판 수준의 품질 진단을 제공합니다.

## Quick Start

```bash
/deep-evaluate 5        # 5화 심층 평가
/deep-evaluate           # 현재 막 전체 심층 평가
/deep-evaluate 5-10     # 5~10화 일괄 심층 평가
/deep-evaluate --axis=PLOT,CHA  # 특정 축만 평가
```

## 8개 평가 축 (LongStoryEval Framework)

### 객관적 평가 (Objective Axes) - 5축

| 축 | 코드 | 평가 내용 | 핵심 질문 |
|----|------|----------|----------|
| 플롯 & 구조 | **PLOT** | 사건 인과관계, 긴장 곡선, 전환점, 결말 만족도 | "이야기가 논리적으로 흘러가는가?" |
| 캐릭터 | **CHA** | 동기 일관성, 성장 아크, 대화 자연스러움, 고유성 | "캐릭터가 살아 있는가?" |
| 문장력 | **WRI** | Show vs Tell 비율, 문체 일관성, 리듬, 어휘 다양성 | "문장이 기술적으로 우수한가?" |
| 주제 | **THE** | 주제 명확성, 상징 활용, 메시지 전달력 | "작품이 말하고자 하는 바가 명확한가?" |
| 세계관 & 설정 | **WOR** | 설정 일관성, 디테일 밀도, 몰입감, 규칙 준수 | "세계가 믿을 만한가?" |

### 주관적 평가 (Subjective Axes) - 3축

| 축 | 코드 | 평가 내용 | 핵심 질문 |
|----|------|----------|----------|
| 감정적 임팩트 | **EMO** | 감정 유발력, 공감도, 카타르시스, 여운 | "가슴에 남는가?" |
| 즐거움 & 몰입 | **ENJ** | 페이지터너 지수, 몰입도, 재독 의향 | "손에서 놓을 수 없는가?" |
| 기대 충족 | **EXP** | 장르 기대 충족, 독자 예상 관리, 반전 효과 | "기대에 부응하는가?" |

## 워크플로우

### Phase 1: 평가 대상 파악

사용자가 구체적으로 지정하지 않은 경우:

```
AskUserQuestion:
  question: "무엇을 심층 평가할까요?"
  options:
    - "특정 회차 (번호 입력)"
    - "현재 막 전체"
    - "전체 원고"
    - "특정 범위 (예: 5-10화)"
```

### Phase 2: 컨텍스트 수집

평가 대상에 따라 필요한 파일 로드:

**회차 평가**:
```
- manuscripts/chapter_{N}.md         (원고 본문)
- chapters/chapter_{N}.json          (챕터 설계)
- characters/*.json                  (등장인물 프로필)
- plot/main-arc.json                 (메인 플롯 위치 파악)
- plot/sub-arcs/*.json               (서브플롯 연관성)
- world/world.json                   (세계관 설정 참조)
- meta/style-guide.json              (문체 가이드라인)
- plot/foreshadowing.json            (복선 체크)
- BLUEPRINT.md                       (전체 설계 참조)
```

**막 단위 평가**:
```
- 해당 막의 모든 manuscripts/chapter_*.md
- 해당 막의 모든 chapters/chapter_*.json
- plot/main-arc.json (act 구조)
- characters/*.json
- world/world.json
```

**전체 원고 평가**:
```
- 모든 manuscripts/chapter_*.md
- 모든 chapters/chapter_*.json
- plot/* 전체
- characters/* 전체
- world/* 전체
- BLUEPRINT.md
```

### Phase 3: 8축 병렬 평가

8개 평가 축을 **병렬로** 실행합니다. 각 축은 전문 프롬프트로 독립 평가합니다.

```typescript
// === 객관적 축 (5개) ===

// 1. PLOT: 플롯 & 구조
const plotEval = Task({
  subagent_type: "novel-dev:critic",
  model: "opus",
  prompt: `[PLOT 축 평가] 플롯 & 구조

대상: {target}
원고: {manuscript_content}
플롯 설계: {plot_data}

다음 기준으로 평가하세요:

1. 사건 인과관계 (Causality)
   - 장면 간 "그래서(therefore)" / "하지만(but)" 연결이 명확한가?
   - 우연 의존도가 낮은가?

2. 긴장 곡선 (Tension Arc)
   - 긴장의 상승-하강 리듬이 적절한가?
   - 클라이맥스가 충분히 강력한가?

3. 전환점 (Turning Points)
   - 주요 전환점이 예측 불가하면서도 필연적인가?
   - 전환점 전후의 스테이크가 상승하는가?

4. 결말 만족도 (Resolution)
   - 제기된 질문들이 해결되는가?
   - 결말이 인위적이지 않은가?

출력 형식:
- 점수: 0-100
- 근거: 3줄 (각 줄은 구체적 예시 포함)
- 개선점: 2줄 (실행 가능한 제안)
- 핵심 발견: 가장 중요한 1가지`
})

// 2. CHA: 캐릭터
const chaEval = Task({
  subagent_type: "novel-dev:critic",
  model: "opus",
  prompt: `[CHA 축 평가] 캐릭터

대상: {target}
원고: {manuscript_content}
캐릭터 프로필: {character_data}

다음 기준으로 평가하세요:

1. 동기 일관성 (Motivation Consistency)
   - 캐릭터의 행동이 설정된 동기와 일치하는가?
   - Want/Need 구조가 작동하는가?

2. 성장 아크 (Character Arc)
   - 캐릭터가 의미 있게 변화하는가?
   - Lie → Truth 전환이 자연스러운가?

3. 대화 자연스러움 (Dialogue Authenticity)
   - 각 캐릭터의 목소리가 구별되는가?
   - 대화가 노출(exposition dump) 수단이 아닌가?

4. 고유성 (Distinctiveness)
   - 캐릭터가 서로 교환 불가능한가?
   - 독자가 기억할 수 있는 특징이 있는가?

출력 형식:
- 점수: 0-100
- 근거: 3줄
- 개선점: 2줄
- 핵심 발견: 가장 중요한 1가지`
})

// 3. WRI: 문장력
const wriEval = Task({
  subagent_type: "novel-dev:editor",
  model: "opus",
  prompt: `[WRI 축 평가] 문장력

대상: {target}
원고: {manuscript_content}
스타일 가이드: {style_guide}

다음 기준으로 평가하세요:

1. Show vs Tell 비율
   - 감정/상황을 보여주는가, 설명하는가?
   - 핵심 장면에서 Show가 충분한가?

2. 문체 일관성 (Style Consistency)
   - 시점, 톤, 어조가 일관적인가?
   - 의도된 문체 변화와 실수를 구별

3. 리듬 (Prose Rhythm)
   - 문장 길이의 변주가 있는가?
   - 장면 분위기에 맞는 호흡인가?

4. 어휘 다양성 (Lexical Diversity)
   - 반복 표현이 과도하지 않은가?
   - 클리셰 사용 빈도
   - 필터 워드/능동태 비율

출력 형식:
- 점수: 0-100
- 근거: 3줄
- 개선점: 2줄
- 핵심 발견: 가장 중요한 1가지`
})

// 4. THE: 주제
const theEval = Task({
  subagent_type: "novel-dev:critic",
  model: "opus",
  prompt: `[THE 축 평가] 주제

대상: {target}
원고: {manuscript_content}
블루프린트: {blueprint}

다음 기준으로 평가하세요:

1. 주제 명확성 (Thematic Clarity)
   - 작품의 주제/테마가 식별 가능한가?
   - 주제가 너무 노골적이거나 너무 모호하지 않은가?

2. 상징 활용 (Symbolism)
   - 반복 모티프가 효과적으로 사용되는가?
   - 상징이 주제를 강화하는가?

3. 메시지 전달력 (Message Delivery)
   - 주제가 플롯과 캐릭터를 통해 유기적으로 전달되는가?
   - 설교조가 아닌가?

4. 주제적 일관성 (Thematic Coherence)
   - 서브플롯이 주제를 지지하는가?
   - 주제와 무관한 사건이 과도하지 않은가?

출력 형식:
- 점수: 0-100
- 근거: 3줄
- 개선점: 2줄
- 핵심 발견: 가장 중요한 1가지`
})

// 5. WOR: 세계관 & 설정
const worEval = Task({
  subagent_type: "novel-dev:lore-keeper",
  model: "sonnet",
  prompt: `[WOR 축 평가] 세계관 & 설정

대상: {target}
원고: {manuscript_content}
세계관 설정: {world_data}

다음 기준으로 평가하세요:

1. 설정 일관성 (Consistency)
   - 원고에서 세계관 규칙을 위반하는 곳이 있는가?
   - 용어가 일관적으로 사용되는가?

2. 디테일 밀도 (Detail Density)
   - 세계관 묘사가 충분한가?
   - 과잉 설명(info dump)은 없는가?

3. 몰입감 (Immersion)
   - 독자가 세계 안에 있는 느낌을 받는가?
   - 감각적 묘사가 충분한가?

4. 규칙 준수 (Rule Adherence)
   - 마법/과학 체계가 일관적으로 작동하는가?
   - 세계 법칙을 편의적으로 무시하지 않는가?

출력 형식:
- 점수: 0-100
- 근거: 3줄
- 개선점: 2줄
- 핵심 발견: 가장 중요한 1가지`
})

// === 주관적 축 (3개) ===

// 6. EMO: 감정적 임팩트
const emoEval = Task({
  subagent_type: "novel-dev:beta-reader",
  model: "sonnet",
  prompt: `[EMO 축 평가] 감정적 임팩트

대상: {target}
원고: {manuscript_content}

독자 관점에서 다음을 평가하세요:

1. 감정 유발력 (Emotional Evocation)
   - 어떤 감정이 유발되는가? 얼마나 강렬한가?
   - 감정적으로 아무것도 느껴지지 않는 구간이 있는가?

2. 공감도 (Empathy)
   - 캐릭터의 감정에 공감할 수 있는가?
   - 독자가 캐릭터를 응원하게 되는가?

3. 카타르시스 (Catharsis)
   - 감정적 해소가 충분한가?
   - 긴장 후 적절한 이완이 있는가?

4. 여운 (Lingering Impact)
   - 읽은 후에도 생각나는 장면이 있는가?
   - 감정적 잔상이 남는가?

출력 형식:
- 점수: 0-100
- 근거: 3줄
- 개선점: 2줄
- 핵심 발견: 가장 중요한 1가지`
})

// 7. ENJ: 즐거움 & 몰입
const enjEval = Task({
  subagent_type: "novel-dev:beta-reader",
  model: "sonnet",
  prompt: `[ENJ 축 평가] 즐거움 & 몰입

대상: {target}
원고: {manuscript_content}

독자 관점에서 다음을 평가하세요:

1. 페이지터너 지수 (Page-Turner Index)
   - "다음 장을 넘기고 싶은" 힘이 있는가?
   - 각 회차/장면 끝에 훅이 있는가?

2. 몰입도 (Absorption)
   - 읽다가 중단하고 싶은 구간이 있는가?
   - 흐름이 끊기는 지점은?

3. 재독 의향 (Re-readability)
   - 다시 읽고 싶은 장면이 있는가?
   - 새로운 발견을 기대할 수 있는가?

4. 순수 즐거움 (Pure Enjoyment)
   - 단순히 읽는 것 자체가 즐거운가?
   - 어떤 종류의 즐거움인가? (서스펜스/유머/감동/지적 자극)

출력 형식:
- 점수: 0-100
- 근거: 3줄
- 개선점: 2줄
- 핵심 발견: 가장 중요한 1가지`
})

// 8. EXP: 기대 충족
const expEval = Task({
  subagent_type: "novel-dev:genre-validator",
  model: "sonnet",
  prompt: `[EXP 축 평가] 기대 충족

대상: {target}
원고: {manuscript_content}
장르: {genre}
블루프린트: {blueprint}

독자 기대 관점에서 다음을 평가하세요:

1. 장르 기대 충족 (Genre Fulfillment)
   - 장르 필수 요소가 충족되는가?
   - 장르 팬이 만족할 수준인가?

2. 독자 예상 관리 (Expectation Management)
   - 의도적 미스리딩이 효과적인가?
   - 독자의 기대를 적절히 조종하고 있는가?

3. 반전 효과 (Twist Effectiveness)
   - 반전이 놀랍되 납득 가능한가?
   - 뒤돌아보면 단서가 있었는가?

4. 약속 이행 (Promise Fulfillment)
   - 초반에 암시된 것들이 이행되는가?
   - 복선이 적절히 회수되는가?

출력 형식:
- 점수: 0-100
- 근거: 3줄
- 개선점: 2줄
- 핵심 발견: 가장 중요한 1가지`
})

// 병렬 실행
const [plot, cha, wri, the, wor, emo, enj, exp] = await Promise.all([
  plotEval, chaEval, wriEval, theEval, worEval, emoEval, enjEval, expEval
])
```

### Phase 4: 종합 레이더 차트

8축 결과를 레이더 차트로 시각화합니다:

```
          PLOT({plot})
           ╱╲
      EXP /  \ CHA
   ({exp})╱    ╲({cha})
        ╱      ╲
   ENJ ╱        ╲ WRI
({enj})╱──────────╲({wri})
      ╲          ╱
   EMO ╲        ╱ THE
 ({emo})╲      ╱({the})
         ╲    ╱
      WOR ╲  ╱
      ({wor})╲╱

  객관적 평균: {obj_avg} / 100  (PLOT+CHA+WRI+THE+WOR)
  주관적 평균: {sub_avg} / 100  (EMO+ENJ+EXP)
  ─────────────────────
  종합 평균: {total_avg} / 100

  최강: {best_axis} ({best_score})
  최약: {worst_axis} ({worst_score}) <- 집중 개선 필요
```

### 종합 점수 계산

```typescript
// 객관적 축 가중치 (60%)
const objectiveScore = (
  plot.score * 0.15 +   // PLOT: 15%
  cha.score * 0.15 +    // CHA: 15%
  wri.score * 0.12 +    // WRI: 12%
  the.score * 0.08 +    // THE: 8%
  wor.score * 0.10      // WOR: 10%
) / 0.60

// 주관적 축 가중치 (40%)
const subjectiveScore = (
  emo.score * 0.15 +    // EMO: 15%
  enj.score * 0.15 +    // ENJ: 15%
  exp.score * 0.10      // EXP: 10%
) / 0.40

// 종합 점수
const totalScore = objectiveScore * 0.60 + subjectiveScore * 0.40
```

### 등급 체계

| 점수 | 등급 | 의미 | 권장 행동 |
|------|------|------|----------|
| 90-100 | **S** (출판 수준) | 상업 출판 가능 품질 | 즉시 투고/출간 가능 |
| 80-89 | **A** (우수) | 소폭 다듬기만 필요 | 교정 후 출간 가능 |
| 70-79 | **B** (양호) | 개선 여지 있음 | 약점 축 집중 개선 |
| 60-69 | **C** (보통) | 상당한 개선 필요 | 구조적 수정 권장 |
| 0-59 | **F** (미달) | 근본적 재작업 필요 | 재설계 고려 |

### Phase 5: 액션 아이템 생성

각 축에서 **80점 미만인 항목**에 대해 구체적 개선안을 제시합니다:

```markdown
## 집중 개선 항목

### THE (73점) - 우선순위 1

**문제**: 주제가 플롯과 유기적으로 연결되지 않음
- 위치: `manuscripts/chapter_003.md:45-67`
- 현상: 주제적 의미 없이 액션만 나열됨
- 영향: 독자가 "그래서 이 이야기가 뭘 말하려는 거지?" 의문

**개선 방향**:
1. 3화 전투 장면에 주인공의 내적 갈등을 반영하는 선택지 추가
2. 적대자의 대사를 통해 주제를 간접적으로 환기

**참고 레퍼런스**: {같은 장르 성공 사례에서 주제 전달 방식}

---

### ENJ (78점) - 우선순위 2

**문제**: 중반부 페이싱 저하
- 위치: `manuscripts/chapter_007.md:120-180`
- 현상: 설명 과다로 흐름이 끊김
- 영향: 독자 이탈 위험 구간

**개선 방향**:
1. 7화 중반 설명을 대화/행동으로 전환
2. 서브플롯 긴장 요소를 이 구간에 배치

**참고 레퍼런스**: {페이싱 처리 우수 사례}
```

### Phase 6: 결과 저장

평가 결과를 자동 저장합니다:

```
.reviews/
  deep-evaluate-chapter_{N}-{timestamp}.md
  deep-evaluate-act_{N}-{timestamp}.md
  deep-evaluate-full-{timestamp}.md
```

이전 평가가 존재하면 변화 추이를 비교:

```markdown
## 이전 평가 대비 변화

| 축 | 이전 | 현재 | 변화 |
|----|------|------|------|
| PLOT | 75 | 87 | +12 |
| CHA | 85 | 91 | +6  |
| WRI | 80 | 85 | +5  |
| THE | 60 | 73 | +13 |
| WOR | 82 | 88 | +6  |
| EMO | 85 | 90 | +5  |
| ENJ | 70 | 78 | +8  |
| EXP | 78 | 82 | +4  |
| **종합** | **76.9** | **84.3** | **+7.4** |
```

## 출력 템플릿

```markdown
# 심층 평가 결과: {대상}

**평가일**: {timestamp}
**평가 범위**: {챕터/막/전체}
**장르**: {genre}

---

## 레이더 차트

          PLOT({N})
           ╱╲
      EXP /  \ CHA
    ({N})╱    ╲({N})
        ╱      ╲
   ENJ ╱        ╲ WRI
  ({N})╱──────────╲({N})
      ╲          ╱
   EMO ╲        ╱ THE
  ({N})╲      ╱({N})
         ╲    ╱
      WOR ╲  ╱
       ({N})╲╱

---

## 종합 결과

| 구분 | 평균 |
|------|------|
| 객관적 (PLOT+CHA+WRI+THE+WOR) | {obj_avg}/100 |
| 주관적 (EMO+ENJ+EXP) | {sub_avg}/100 |
| **종합** | **{total}/100** |

**등급**: {S/A/B/C/F}
**최강 축**: {axis} ({score}) - {한줄 요약}
**최약 축**: {axis} ({score}) - {한줄 요약}

---

## 축별 상세 결과

### [객관적] PLOT - 플롯 & 구조: {N}/100

**근거**:
1. {근거 1 - 구체적 예시 포함}
2. {근거 2}
3. {근거 3}

**개선점**:
1. {개선점 1}
2. {개선점 2}

---

### [객관적] CHA - 캐릭터: {N}/100
{... 동일 포맷 ...}

### [객관적] WRI - 문장력: {N}/100
{... 동일 포맷 ...}

### [객관적] THE - 주제: {N}/100
{... 동일 포맷 ...}

### [객관적] WOR - 세계관 & 설정: {N}/100
{... 동일 포맷 ...}

### [주관적] EMO - 감정적 임팩트: {N}/100
{... 동일 포맷 ...}

### [주관적] ENJ - 즐거움 & 몰입: {N}/100
{... 동일 포맷 ...}

### [주관적] EXP - 기대 충족: {N}/100
{... 동일 포맷 ...}

---

## 집중 개선 항목 (80점 미만)

### {축명} ({점수}점) - 우선순위 {N}

**문제**: {핵심 문제 1줄}
- 위치: `{파일}:{라인}`
- 현상: {구체적 현상}
- 영향: {독자 경험에 미치는 영향}

**개선 방향**:
1. {구체적 행동 1}
2. {구체적 행동 2}

**참고 레퍼런스**: {같은 장르 성공 사례}

---

## 다음 단계

{등급에 따른 권장 행동}
```

## 옵션

### --axis

특정 축만 평가:
```bash
/deep-evaluate --axis=PLOT           # 플롯만 평가
/deep-evaluate --axis=PLOT,CHA,WRI   # 객관적 3축만 평가
/deep-evaluate --axis=EMO,ENJ,EXP    # 주관적 축만 평가
```

### --compare

이전 평가와 비교:
```bash
/deep-evaluate --compare              # 최근 평가와 비교
/deep-evaluate --compare=2025-01-15   # 특정 날짜 평가와 비교
```

### --strict

엄격 모드 (A등급 기준을 85로 상향):
```bash
/deep-evaluate --strict
```

### --genre-weight

장르별 가중치 프리셋 적용:
```bash
/deep-evaluate --genre-weight=romance      # EMO, CHA 가중치 상향
/deep-evaluate --genre-weight=thriller      # PLOT, ENJ 가중치 상향
/deep-evaluate --genre-weight=literary      # WRI, THE 가중치 상향
/deep-evaluate --genre-weight=fantasy       # WOR, PLOT 가중치 상향
```

장르별 가중치는 `references/evaluation-rubric.md`에서 상세 확인 가능합니다.

### --quick

빠른 평가 (haiku 모델, 요약만):
```bash
/deep-evaluate --quick 5
```

## 에이전트 활용

| 축 | 에이전트 | 모델 | 이유 |
|----|---------|------|------|
| PLOT | critic | opus | 구조적 분석에 깊은 추론 필요 |
| CHA | critic | opus | 캐릭터 일관성 검증에 높은 정밀도 필요 |
| WRI | editor | opus | 문체 분석에 언어적 감수성 필요 |
| THE | critic | opus | 추상적 주제 파악에 높은 추론력 필요 |
| WOR | lore-keeper | sonnet | 설정 일관성은 규칙 기반 검증 |
| EMO | beta-reader | sonnet | 독자 감정 반응 시뮬레이션 |
| ENJ | beta-reader | sonnet | 독자 경험 시뮬레이션 |
| EXP | genre-validator | sonnet | 장르 기대 충족 검증 |

## /evaluate와의 차이점

| 항목 | /evaluate (기존) | /deep-evaluate (8축) |
|------|-----------------|---------------------|
| 평가 축 | 4차원 (25점 x 4) | 8축 (0-100 개별) |
| 기반 | 자체 기준 | LongStoryEval 연구 |
| 객관/주관 구분 | 없음 | 객관 5축 + 주관 3축 |
| 레이더 차트 | 없음 | 8각형 시각화 |
| 장르 가중치 | 없음 | 장르별 가중치 조정 |
| 액션 아이템 | 기본 | 파일:라인 수준 구체성 |
| 비교 기능 | 버전 비교 | 버전 비교 + 추이 분석 |
| 에이전트 수 | 3개 | 8개 병렬 |

## Documentation

**상세 루브릭**: See `references/evaluation-rubric.md`
- 8축별 0-25(F), 26-50(D), 51-70(C), 71-85(B), 86-100(A) 상세 기준
- 장르별 가중치 조정 가이드
- 구체적 예시와 함께
