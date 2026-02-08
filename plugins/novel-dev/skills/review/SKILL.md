---
name: review
description: 설계 결과물(캐릭터, 플롯, 세계관) 다각도 검토 및 승인 판정
user-invocable: true
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Task
  - AskUserQuestion
---

# Review Skill

설계 결과물(캐릭터, 플롯, 세계관 등)을 다각도로 검토하고 승인/거부 판정을 내리는 스킬입니다.

## 워크플로우

### Phase 1: 검토 대상 파악

사용자가 지정하지 않은 경우 자동 감지 또는 질문:

```typescript
// 자동 감지 우선순위
if (exists("world/world.json") && not_reviewed) {
  target = "world design"
} else if (exists("characters/*.json") && not_reviewed) {
  target = "character design"
} else if (exists("plot/main-arc.json") && not_reviewed) {
  target = "plot design"
} else {
  AskUserQuestion("무엇을 검토할까요?", [
    "세계관 (world.json)",
    "캐릭터 (characters/*.json)",
    "메인 플롯 (main-arc.json)",
    "서브 플롯 (sub-arcs/*.json)",
    "복선 시스템 (foreshadowing.json)",
    "회차별 플롯 (chapters/*.json)",
    "전체 설계"
  ])
}
```

### Phase 2: 컨텍스트 로딩

검토 대상에 따라 관련 파일 수집:

**세계관 검토**:
```
- world/world.json
- world/locations.json
- world/timeline.json
- BLUEPRINT.md (세계관 섹션)
```

**캐릭터 검토**:
```
- characters/{char_id}.json
- characters/relationships.json
- plot/main-arc.json (캐릭터 역할 확인)
```

**플롯 검토**:
```
- plot/main-arc.json
- plot/sub-arcs/*.json
- plot/foreshadowing.json
- plot/hooks.json
- chapters/*.json (샘플)
```

**회차 플롯 검토**:
```
- chapters/chapter_{N}.json
- plot/main-arc.json
- characters/*.json
- world/world.json
```

### Phase 3: 병렬 검토 (Multi-Agent)

3개 에이전트를 병렬로 실행하여 다각도 검토:

```typescript
// 1. 기술적 품질 검토 (critic)
const criticalReview = Task({
  subagent_type: "novel-dev:critic",
  model: "opus",
  prompt: `다음 설계를 기술적 관점에서 검토하세요:

검토 대상: {target}
파일: {files}

평가 기준:
1. 완성도 (Completeness): 필수 요소가 모두 포함되었는가?
2. 일관성 (Consistency): 내부 모순이 없는가?
3. 논리성 (Logic): 설정이 논리적으로 타당한가?
4. 상세도 (Detail): 구체적이고 실행 가능한가?
5. 기술적 정확성: JSON 구조, 스키마 준수

각 기준에 대해:
- 점수 (0-100)
- 발견 사항 (구체적 예시)
- 개선 제안

최종 판정: APPROVED (80+) / REVISE (60-79) / REJECT (<60)
`
})

// 2. 독자 경험 검토 (beta-reader)
const readerReview = Task({
  subagent_type: "novel-dev:beta-reader",
  model: "sonnet",
  prompt: `다음 설계를 독자 관점에서 검토하세요:

검토 대상: {target}
파일: {files}

평가 기준:
1. 매력도 (Appeal): 독자가 흥미를 가질 요소인가?
2. 공감성 (Relatability): 독자가 공감할 수 있는가?
3. 독창성 (Originality): 신선한가, 클리셰인가?
4. 몰입도 (Immersion): 세계/캐릭터에 빠져들 수 있는가?
5. 상업성 (Marketability): 장르 독자층이 좋아할까?

각 기준에 대해:
- 점수 (0-100)
- 강점 (독자가 좋아할 요소)
- 약점 (독자가 싫어할 요소)
- 개선 제안

최종 판정: COMPELLING (80+) / ENGAGING (60-79) / WEAK (<60)
`
})

// 3. 장르 적합성 검토 (genre-validator)
const genreReview = Task({
  subagent_type: "novel-dev:genre-validator",
  model: "sonnet",
  prompt: `다음 설계를 장르 관점에서 검토하세요:

검토 대상: {target}
파일: {files}
장르: {genre}

평가 기준:
1. 필수 트로프: 장르 필수 요소가 포함되었는가?
2. 독자 기대: 장르 독자가 기대하는 것을 제공하는가?
3. 장르 규칙: 장르 컨벤션을 따르는가?
4. 차별화: 클리셰를 넘어서는 요소가 있는가?
5. 시장 적합성: 현재 트렌드에 맞는가?

각 기준에 대해:
- 점수 (0-100)
- 준수 사항
- 위반 사항
- 개선 제안

최종 판정: EXCELLENT (80+) / ACCEPTABLE (60-79) / UNSUITABLE (<60)
`
})

// 병렬 실행
const [critical, reader, genre] = await Promise.all([
  criticalReview,
  readerReview,
  genreReview
])
```

### Phase 4: 결과 종합 및 판정

3개 리뷰를 통합하여 최종 판정:

```typescript
// 종합 점수 계산
const totalScore = (
  critical.score * 0.4 +  // 기술적 품질 40%
  reader.score * 0.35 +   // 독자 경험 35%
  genre.score * 0.25      // 장르 적합성 25%
)

// 신뢰도 계산 (3개 리뷰 간 점수 편차)
const scores = [critical.score, reader.score, genre.score]
const variance = calculateVariance(scores)
const confidence = variance < 15 ? "HIGH" : variance < 30 ? "MEDIUM" : "LOW"

// 최종 판정
let verdict
if (totalScore >= 80) {
  verdict = "APPROVED"
} else if (totalScore >= 60) {
  verdict = "REVISE"
} else {
  verdict = "REJECT"
}
```

### Phase 5: 검토 결과 출력

```markdown
# {대상} 검토 결과

## 최종 판정: {APPROVED|REVISE|REJECT}

**종합 점수**: {total}/100
**신뢰도**: {HIGH|MEDIUM|LOW}

---

## 리뷰 요약

| 관점 | 점수 | 판정 | 주요 이슈 |
|------|------|------|-----------|
| 기술적 품질 (critic) | {N}/100 | {APPROVED/REVISE/REJECT} | {핵심 이슈 1줄} |
| 독자 경험 (beta-reader) | {N}/100 | {COMPELLING/ENGAGING/WEAK} | {핵심 이슈 1줄} |
| 장르 적합성 (genre-validator) | {N}/100 | {EXCELLENT/ACCEPTABLE/UNSUITABLE} | {핵심 이슈 1줄} |

---

## 상세 피드백

### ✅ 강점 (Strengths)

#### 기술적 측면
{critical.strengths}

#### 독자 경험 측면
{reader.strengths}

#### 장르 측면
{genre.strengths}

---

### ⚠️ 개선 필요 (Needs Revision)

#### 우선순위 높음
1. **{이슈 제목}**
   - 발견자: {critic|beta-reader|genre-validator}
   - 위치: `{파일명}:{경로}`
   - 문제: {설명}
   - 영향: {독자/스토리에 미치는 영향}
   - 제안: {구체적 수정 방법}

2. **{이슈 제목}**
   ...

#### 우선순위 중간
{...}

#### 우선순위 낮음
{...}

---

### ❌ 치명적 결함 (Critical Issues)

{verdict가 REJECT인 경우만 표시}

1. **{결함 제목}**
   - 심각도: CRITICAL
   - 위치: `{파일명}:{경로}`
   - 문제: {설명}
   - 반드시 수정해야 하는 이유: {...}

---

## 체크리스트

{검토 대상별 체크리스트, 통과/실패 표시}

### 필수 요소
- [x] {통과 항목}
- [ ] {실패 항목}
- [x] {통과 항목}

### 권장 요소
- [x] {통과 항목}
- [ ] {실패 항목}

---

## 다음 단계

{verdict에 따른 권장 행동}
```

**APPROVED (≥80)인 경우**:
```
✅ 설계가 승인되었습니다!

다음 단계:
1. /gen-plot - 회차별 플롯 생성
2. /write - 집필 시작
3. /timeline - 타임라인 관리

강점을 계속 유지하세요:
- {강점 1}
- {강점 2}
```

**REVISE (60-79)인 경우**:
```
⚠️ 설계가 조건부 승인되었습니다. 개선 후 재검토를 권장합니다.

필수 수정사항:
1. {우선순위 높음 이슈}
2. {우선순위 높음 이슈}

선택적 개선사항:
1. {우선순위 중간 이슈}

수정 후 다시 검토: /review
또는 현재 상태로 진행: /gen-plot --skip-review
```

**REJECT (<60)인 경우**:
```
❌ 설계가 기준에 미달합니다. 재설계가 필요합니다.

치명적 결함:
1. {critical issue 1}
2. {critical issue 2}

권장 조치:
1. 재설계: /design-{type}
2. 또는 BLUEPRINT.md부터 수정
3. 수정 후 재검토 필수

현재 상태로는 집필을 권장하지 않습니다.
```

### Phase 6: 자동 수정 옵션 (선택)

```typescript
if (verdict === "REVISE" && hasAutoFixableLssues) {
  const answer = await AskUserQuestion(
    "일부 이슈는 자동으로 수정할 수 있습니다. 수정하시겠습니까?",
    ["자동 수정", "직접 수정", "무시하고 진행"]
  )

  if (answer === "자동 수정") {
    // plot-architect에게 수정 위임
    await Task({
      subagent_type: "novel-dev:plot-architect",
      model: "opus",
      prompt: `다음 피드백을 반영하여 설계를 개선하세요:

대상 파일: {target_file}
피드백: {consolidated_feedback}

자동 수정 가능한 이슈:
{auto_fixable_issues}

수정 후 원본 파일을 업데이트하세요.
`
    })

    // 수정 후 재검토
    console.log("✅ 자동 수정 완료. 재검토를 시작합니다...")
    // 재귀적으로 review 스킬 재실행
  }
}
```

## 검토 대상별 상세 기준

### 세계관 (world.json) 검토

**필수 요소**:
- [ ] 세계 이름
- [ ] 장르
- [ ] 시대/시간 배경
- [ ] 지리적 구조
- [ ] 마법/과학 체계 (해당 시)
- [ ] 사회 구조
- [ ] 역사 (주요 사건)

**검토 포인트**:
1. **일관성**: 설정 간 모순이 없는가?
2. **논리성**: 마법/과학 체계가 논리적인가?
3. **독창성**: 장르 클리셰를 넘어서는가?
4. **활용성**: 플롯에 활용 가능한가?
5. **깊이**: 피상적이지 않은가?

**자동 수정 가능**:
- JSON 구조 오류
- 필수 필드 누락 (기본값 추가)
- 용어 불일치

### 캐릭터 (characters/*.json) 검토

**필수 요소**:
- [ ] 이름, 나이, 성별
- [ ] 외모 특징
- [ ] 성격 (MBTI/키워드)
- [ ] Want (원하는 것)
- [ ] Need (필요한 것)
- [ ] Fear (두려움)
- [ ] Lie/Truth (거짓 믿음/진실)
- [ ] 백스토리
- [ ] 관계 설정

**검토 포인트**:
1. **매력도**: 독자가 관심 가질 요소가 있는가?
2. **차별성**: 다른 캐릭터와 구별되는가?
3. **완성도**: 입체적인 캐릭터인가?
4. **갈등**: 내적 갈등이 흥미로운가?
5. **아크**: 성장 가능성이 보이는가?

**자동 수정 가능**:
- JSON 구조 오류
- 관계 양방향 불일치

### 메인 플롯 (main-arc.json) 검토

**필수 요소**:
- [ ] 3막 구조 전환점
- [ ] Inciting Incident
- [ ] Plot Point 1
- [ ] Midpoint
- [ ] Plot Point 2
- [ ] Climax
- [ ] Resolution
- [ ] 핵심 갈등
- [ ] 스테이크
- [ ] 극적 질문

**검토 포인트**:
1. **구조**: 3막 비율이 적절한가? (25/50/25)
2. **인과**: 사건 간 논리적 연결이 있는가?
3. **확대**: 갈등이 점진적으로 확대되는가?
4. **필연성**: Climax가 자연스럽게 도출되는가?
5. **테마**: 플롯이 테마를 구현하는가?

**자동 수정 가능**:
- 막 비율 불균형 (회차 재분배)
- JSON 구조 오류

### 회차 플롯 (chapter_N.json) 검토

**필수 요소**:
- [ ] 챕터 제목
- [ ] 등장 인물
- [ ] 장소
- [ ] 시간
- [ ] 씬 구조 (2-4개)
- [ ] 각 씬의 목적/갈등/비트
- [ ] 복선 plant/payoff
- [ ] 챕터 엔드 훅

**검토 포인트**:
1. **구체성**: 집필 가능한 수준으로 상세한가?
2. **밸런스**: 씬 간 분량 배분이 적절한가?
3. **훅**: 챕터 시작/끝 훅이 강력한가?
4. **진행**: 스토리가 실질적으로 진전되는가?
5. **통합**: 복선/떡밥이 자연스럽게 통합되었는가?

**자동 수정 가능**:
- 씬 분량 불균형
- 누락된 메타데이터

## 신뢰도 시스템

3개 리뷰 간 점수 차이로 신뢰도 계산:

**HIGH (편차 <15)**:
```
3개 리뷰가 거의 일치합니다. 판정을 신뢰할 수 있습니다.
```

**MEDIUM (편차 15-30)**:
```
리뷰 간 약간의 의견 차이가 있습니다.
{최고 점수 리뷰}는 긍정적이지만, {최저 점수 리뷰}는 우려를 표합니다.
판정은 참고용으로 활용하고, 직접 판단하세요.
```

**LOW (편차 >30)**:
```
⚠️ 리뷰 간 의견이 크게 갈립니다.
- {critic}: {점수}점
- {beta-reader}: {점수}점
- {genre-validator}: {점수}점

이는 설계가 특정 관점에서는 우수하지만 다른 관점에서는 미흡함을 의미합니다.
각 리뷰를 개별적으로 검토하고 우선순위를 판단하세요.
```

## 옵션

### --strict

더 엄격한 기준 적용 (APPROVED 기준: 85점):
```bash
/review --strict
```

### --focus

특정 관점만 검토:
```bash
/review --focus=critic        # 기술적 품질만
/review --focus=reader        # 독자 경험만
/review --focus=genre         # 장르 적합성만
```

### --auto-fix

자동 수정 가능한 이슈를 즉시 수정:
```bash
/review --auto-fix
```

### --target

특정 파일만 검토:
```bash
/review --target=world/world.json
/review --target=characters/char_001.json
/review --target=plot/main-arc.json
```

### --skip-checklist

체크리스트 생략 (요약만):
```bash
/review --skip-checklist
```

## 검토 결과 저장

검토 결과를 자동으로 저장:

```
.reviews/
  world-{timestamp}.md
  character-{char_id}-{timestamp}.md
  plot-{timestamp}.md
```

재검토 시 이전 검토와 비교:
```markdown
## 변경 사항 (이전 검토 대비)

| 항목 | 이전 점수 | 현재 점수 | 변화 |
|------|-----------|-----------|------|
| 기술적 품질 | 65 | 78 | +13 ✅ |
| 독자 경험 | 70 | 82 | +12 ✅ |
| 장르 적합성 | 75 | 75 | 0 - |

개선된 이슈:
- ✅ {이전에 지적된 이슈 1}
- ✅ {이전에 지적된 이슈 2}

여전히 남은 이슈:
- ⚠️ {미해결 이슈 1}
```

## 통합 워크플로우

```
설계 완료
  ↓
/review (자동 감지 또는 대상 지정)
  ↓
병렬 검토 (critic + beta-reader + genre-validator)
  ↓
결과 종합 (점수/신뢰도/판정)
  ↓
┌─────────────┬──────────────┬──────────────┐
│ APPROVED    │ REVISE       │ REJECT       │
│ (80+ 점)    │ (60-79 점)   │ (<60 점)     │
└─────────────┴──────────────┴──────────────┘
      │              │               │
      ↓              ↓               ↓
   진행 OK      개선 후 재검토    재설계 필요
      │              │               │
      ↓         자동수정 옵션         ↓
  /gen-plot         ↓          /design-*
               수정 완료
                  ↓
              /review (재검토)
```

## 예시 출력

```markdown
# 세계관 설계 검토 결과

## 최종 판정: REVISE

**종합 점수**: 73/100
**신뢰도**: HIGH

---

## 리뷰 요약

| 관점 | 점수 | 판정 | 주요 이슈 |
|------|------|------|-----------|
| 기술적 품질 | 75/100 | REVISE | 마법 체계의 제약이 불명확 |
| 독자 경험 | 78/100 | ENGAGING | 세계관은 매력적이나 설명이 과다 |
| 장르 적합성 | 65/100 | ACCEPTABLE | 필수 트로프 일부 누락 |

---

## 상세 피드백

### ✅ 강점

#### 기술적 측면
- 사회 계층 구조가 상세하고 논리적입니다.
- 지리적 설정이 플롯과 잘 연동됩니다.
- 용어가 일관적으로 사용되었습니다.

#### 독자 경험 측면
- 독특한 마법 체계가 독자의 호기심을 자극합니다.
- 세계관이 시각적으로 풍부하게 느껴집니다.

#### 장르 측면
- 판타지 로맨스의 "금지된 사랑" 트로프를 잘 활용합니다.

---

### ⚠️ 개선 필요

#### 우선순위 높음

1. **마법 체계의 제약 불명확**
   - 발견자: critic
   - 위치: `world/world.json:magic_system.limitations`
   - 문제: 마법 사용의 대가/제약이 모호하게 기술됨
   - 영향: 플롯 긴장감 저하, 데우스 엑스 마키나 위험
   - 제안: 구체적 제약 3가지 명시 (마나 소모량, 시전 시간, 부작용)

2. **필수 트로프 누락**
   - 발견자: genre-validator
   - 위치: `world/world.json`
   - 문제: 판타지 로맨스 필수 요소인 "운명적 연결"이 세계관에 없음
   - 영향: 장르 독자 기대 미충족
   - 제안: "소울메이트 마법" 또는 이에 준하는 설정 추가

---

## 다음 단계

⚠️ 설계가 조건부 승인되었습니다. 개선 후 재검토를 권장합니다.

필수 수정사항:
1. 마법 체계 제약 구체화 (world/world.json:magic_system.limitations)
2. 장르 필수 트로프 추가

선택적 개선사항:
1. 세계관 설명 간소화 (독자 경험 개선)

수정 후 다시 검토: /review --target=world/world.json
또는 현재 상태로 진행: /gen-plot --skip-review
```
