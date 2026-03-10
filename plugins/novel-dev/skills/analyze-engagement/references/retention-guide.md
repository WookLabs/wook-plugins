# check-retention - Detailed Guide

## Retention Calculation Formula

```python
# Weight application
hook_score = (hook_strength / 5.0) * 25
cliff_score = (cliffhanger / 5.0) * 25
char_score = (character_appeal / 5.0) * 20
pace_score = (pacing / 5.0) * 15
genre_score = (genre_compliance / 5.0) * 15

retention_rate = hook_score + cliff_score + char_score + pace_score + genre_score
# retention_rate: 0-100%

# Chapter 1 requires 75%+ (critical threshold)
# Subsequent chapters require 65%+ (recommended)
```

## Retention Factors

| Factor | Weight | Ideal State | Measurement |
|--------|--------|-------------|-------------|
| Hook strength | 25% | Strong hook in first 3 paragraphs | First sentence impact, situation/character/conflict clarity |
| Cliffhanger | 25% | Always present and compelling | Next chapter urgency, unresolved tension |
| Character appeal | 20% | Likeable and interesting | Relatability, depth, growth |
| Pacing | 15% | No lulls or slow sections | Tempo consistency, no drag |
| Genre compliance | 15% | Meets reader expectations | Genre tropes, tone, structure |

## Agent Invocations

### Per-Chapter Analysis

```javascript
Task(subagent_type="novel-dev:beta-reader", model="opus", prompt=`
다음 회차의 engagement scores를 평가해주세요:

## 회차 내용
${chapterContent}

## 평가 항목 (5점 만점)
1. Hook strength (첫 3문단): 독자를 즉시 끌어들이는가?
2. Cliffhanger (마지막 문단): 다음 회차가 궁금한가?
3. Character appeal: 캐릭터가 매력적이고 공감 가능한가?
4. Pacing: 템포가 적절하고 루즈한 부분이 없는가?
5. Genre compliance: 장르 기대를 충족하는가?

각 항목별 점수(5점)와 구체적 근거를 제시해주세요.
개선 가능한 부분이 있다면 파일 위치(para N)와 함께 제안해주세요.
`)
```

### Chapter 1 Special Analysis

```javascript
Task(subagent_type="novel-dev:beta-reader", model="opus", prompt=`
1화의 retention 예측 분석 (1→2 이탈률 집중):

## 1화 내용
${chapter1Content}

## 특별 체크 항목
1. First paragraph impact: 첫 문장이 강렬한가?
2. First 3 paragraphs: 상황/캐릭터/갈등이 명확한가?
3. Promise to reader: 이 소설이 무엇을 줄지 약속이 있는가?
4. Hook at para 5, 10, 15: 중간중간 재유입 포인트가 있는가?
5. Ending cliffhanger: 2화를 반드시 보게 만드는가?

1→2 predicted retention을 %로 제시하고, 75% 미만 시 구체적 개선안을 제시해주세요.
`)
```

### Series Fatigue Check (10+ Chapters)

For ongoing series with 10+ chapters:

```javascript
Task(subagent_type="novel-dev:beta-reader", model="opus", prompt=`
시리즈 피로도 체크:

## 최근 10개 회차 분석
${recentChapters}

## 체크 항목
1. 반복 패턴 탐지 (similar scene structures)
2. 캐릭터 성장 정체 여부
3. 새로운 전개 요소 부족 여부
4. 예측 가능성 증가 여부

피로도 점수와 개선 권고안을 제시해주세요.
`)
```

## Output Format

### Console Output

```
=== Retention Prediction ===

## Chapter 1 → 2 Predicted Retention: 78%
  [PASS] Target: 75%+

### Breakdown
  Hook strength:    23/25 (strong opening - 여주의 위기 상황 즉시 제시)
  Cliffhanger:      24/25 (excellent - 계약 제안의 충격적 조건)
  Character appeal: 17/20 (good but needs depth - 내면 묘사 부족)
  Pacing:           12/15 (slight lull at para 12 - 배경 설명 과다)
  Genre compliance: 14/15 (meets expectations - 계약 연애 트로프 잘 활용)

### Improvement Actions
1. Para 12의 대화 압축 (3문장 → 1문장) → +2% retention
2. Para 8에 여주 내면 1문장 추가 → +1% retention
3. Para 1 첫 문장에 강렬한 동사 사용 → +1% retention

### Projected after fixes: 82%

---

## Chapter 2 → 3 Predicted Retention: 71%
  [PASS] Target: 65%+

### Breakdown
  Hook strength:    20/25 (good - 전회 클리프 해소)
  Cliffhanger:      22/25 (strong - 남주의 숨겨진 의도 암시)
  Character appeal: 18/20 (excellent - 남주 매력 상승)
  Pacing:           14/15 (smooth - no lulls)
  Genre compliance: 13/15 (acceptable - 로맨스 요소 약간 부족)

### Improvement Actions
1. Para 18에 스킨십 장면 추가 → +3% retention
2. 클리프행어를 dialogue로 변경 → +1% retention

### Projected after fixes: 75%

---

## Summary

| Chapter | Retention | Status | Action |
|---------|-----------|--------|--------|
| 1 → 2 | 78% | ✓ PASS | Minor tweaks |
| 2 → 3 | 71% | ✓ PASS | Add romance |
| 3 → 4 | 68% | ⚠ WARNING | **URGENT fixes required** |

### Overall Trend
- 1화: Strong start (78%)
- 이탈률 상승 추세 (78% → 71% → 68%)
- **Action Required**: 3화 개선 필수, 그렇지 않으면 4화 이후 급격한 이탈 예상

### Recommendations
1. **즉시**: 3화 수정 (para 1 강화, para 12 내면 추가)
2. **4화 집필 전**: 새로운 갈등 요소 도입 계획
3. **5화부터**: 서브플롯 시작으로 변화 제공
```

### File Output

**Location:** `validations/retention/retention_prediction.json`

```json
{
  "analyzed_at": "2025-01-17T16:00:00Z",
  "target_chapters": [1, 2, 3],
  "predictions": [
    {
      "chapter": 1,
      "next_chapter": 2,
      "retention_rate": 78,
      "target": 75,
      "status": "PASS",
      "breakdown": {
        "hook_strength": {
          "score": 4.6,
          "weighted": 23,
          "feedback": "strong opening - 여주의 위기 상황 즉시 제시"
        },
        "cliffhanger": {
          "score": 4.8,
          "weighted": 24,
          "feedback": "excellent - 계약 제안의 충격적 조건"
        },
        "character_appeal": {
          "score": 4.25,
          "weighted": 17,
          "feedback": "good but needs depth - 내면 묘사 부족"
        },
        "pacing": {
          "score": 4.0,
          "weighted": 12,
          "feedback": "slight lull at para 12 - 배경 설명 과다"
        },
        "genre_compliance": {
          "score": 4.67,
          "weighted": 14,
          "feedback": "meets expectations - 계약 연애 트로프 잘 활용"
        }
      },
      "improvements": [
        {
          "location": "para 12",
          "action": "대화 압축 (3문장 → 1문단)",
          "impact": "+2%"
        },
        {
          "location": "para 8",
          "action": "여주 내면 1문장 추가",
          "impact": "+1%"
        },
        {
          "location": "para 1",
          "action": "첫 문장에 강렬한 동사 사용",
          "impact": "+1%"
        }
      ],
      "projected_after_fixes": 82
    }
  ],
  "series_fatigue": null,
  "overall_trend": "declining",
  "urgent_actions": [
    "3화 para 1 강화 필수",
    "3화 para 12 내면 추가 필수"
  ]
}
```

## Judgment Criteria

| Chapter Transition | Target | Priority |
|-------------------|--------|----------|
| 1 → 2 | 75%+ | CRITICAL - Fix immediately if below |
| 2 → 10 | 65%+ | IMPORTANT - Address soon |
| 10+ | 60%+ | ACCEPTABLE - Monitor trends |

## Special Warnings

1. **Chapter 1 below 75%**: Immediate revision required
2. **3 consecutive drops**: Danger signal - plot review needed
3. **Below 60%**: Critical - full structure reassessment
4. **No cliffhanger**: Automatic -15% penalty
5. **Weak first paragraph**: Automatic -10% penalty

## Trend Analysis

The system tracks retention trends across chapters:
- **Stable** (±2%): Good consistency
- **Rising**: Improving engagement
- **Declining**: Warning - reader fatigue setting in
- **Erratic**: Inconsistent quality - needs attention
