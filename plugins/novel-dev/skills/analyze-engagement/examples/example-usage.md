# analyze-engagement - Usage Examples

## Basic Usage

### Analyze Current Chapter

```
/analyze-engagement
```

Analyzes the most recent chapter and provides engagement metrics.

### Analyze Specific Chapter

```
/analyze-engagement 5
```

Analyzes chapter 5 specifically.

## Example Output: GOOD Rating

```
=== Chapter 1 Engagement Analysis ===

Overall Score: 82/100 (GOOD)

Tension Curve:
  Scene 1: ███░░░░░░░ (3/10) - 일상적 출근
  Scene 2: █████░░░░░ (5/10) - 야근 지시
  Scene 3: ████████░░ (8/10) - 계약 제안
  Scene 4: ██████████ (10/10) - 충격적 조건

Drop-off Risk Zones:
  [!] Para 5: 15% risk (설명 과다 - 회사 배경 축약 권장)
  [!] Para 12: 8% risk (대화 느림 - 템포 개선 필요)
  [✓] Para 18: 3% risk (양호)

Emotional Beats:
  심쿵 (1): "남주의 부드러운 미소"
  긴장 (2): "계약서 공개", "조건 확인"
  호기심 (1): "숨겨진 조항"

Cliffhanger: STRONG (9/10)
  "하지만 계약서 마지막 장을 넘기는 순간, 그녀의 손이 멈췄다."

Verdict: ENGAGING - Proceed to next chapter

Recommendations:
  1. Para 5 설명 50% 축약
  2. Para 12 대화 템포 개선
  3. 클리프행어 강도 유지 - 매우 효과적
```

## Example Output: NEEDS WORK Rating

```
=== Chapter 7 Engagement Analysis ===

Overall Score: 68/100 (NEEDS WORK)

Tension Curve:
  Scene 1: ████░░░░░░ (4/10) - 회사 회의
  Scene 2: ███░░░░░░░ (3/10) - 점심 식사
  Scene 3: ████░░░░░░ (4/10) - 짧은 대화
  Scene 4: █████░░░░░ (5/10) - 퇴근

Drop-off Risk Zones:
  [!!] Para 3: 22% risk (CRITICAL - 회의 설명 4문단 지속)
  [!] Para 8: 18% risk (HIGH - 일상 묘사 과도)
  [!] Para 15: 12% risk (대화 템포 정체)

Emotional Beats:
  긴장 (1): "회의 중 긴장한 순간" (weak)
  [!] 심쿵 포인트 없음 (로맨스 장르 - 필수)

Cliffhanger: WEAK (3/10)
  "그녀는 집에 도착했다."
  Issue: 너무 평범한 마무리 - 다음 회차 기대감 없음

Verdict: NEEDS WORK - Revision recommended

CRITICAL Actions Required:
  1. Para 3-6 회의 설명 80% 축약 또는 삭제
  2. Para 8-11 일상 묘사 액션으로 대체
  3. Para 15-18 대화에 갈등/긴장 요소 추가
  4. Para 20+ 심쿵 포인트 1개 추가 (남주 등장 또는 메시지)
  5. 마지막 문단 클리프행어 강화 (예: 예상치 못한 전화/메시지/만남)

Estimated impact: +14 points (to 82/100) after fixes
```

## Workflow Integration

### After Writing

```bash
/write 5
# System automatically runs:
/analyze-engagement 5
```

### Before Revision

```bash
/analyze-engagement 3
# Review the output, then:
/revise 3
# System re-runs analysis to measure improvement
```

### Quality Check

```bash
/evaluate 1-10
# Includes engagement scores for all chapters in summary
```

## Reading the Results

### Tension Curve

The ASCII chart shows how tension builds throughout the chapter:
- **Rising curve** (3 → 5 → 8 → 10): Good pacing
- **Flat curve** (4 → 4 → 4 → 4): Boring - needs variation
- **Early peak** (9 → 5 → 3 → 2): Front-loaded - weak ending

### Drop-off Risk Zones

- **15% or higher**: Immediate fix required
- **Multiple high-risk zones**: Chapter may need restructuring
- **Location matters**: Early drop-off (para 1-5) is most critical

### Emotional Beats

For romance novels:
- Should have at least 1 심쿵 (heart flutter) per chapter
- 긴장 (tension) maintains engagement between 심쿵 moments
- 호기심 (curiosity) hooks readers for next chapter

### Cliffhanger Strength

- **8-10**: Strong - readers will definitely continue
- **5-7**: Moderate - some readers might pause
- **0-4**: Weak - high risk of reader drop-off

## Tips for Improvement

1. **Fix critical drop-offs first** (20%+ risk)
2. **Strengthen weak cliffhangers** - most impactful change
3. **Add emotional beats early** - hook readers in first 3 paragraphs
4. **Vary tension levels** - avoid flat curves
5. **Test after each revision** - verify improvements worked
