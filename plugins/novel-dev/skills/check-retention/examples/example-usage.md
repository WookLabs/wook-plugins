# check-retention - Usage Examples

## Basic Usage

### Analyze Recent Chapters

```
/check-retention
```

Analyzes the last 3 chapters and predicts retention rates.

### Analyze Specific Chapter

```
/check-retention 5
```

Analyzes chapter 5's retention to chapter 6.

### Focus on Chapter 1

```
/check-retention --first
```

Deep analysis of critical chapter 1→2 retention.

## Example Output: Good Retention

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
```

## Example Output: Warning

```
=== Retention Prediction ===

## Chapter 3 → 4 Predicted Retention: 68%
  [WARNING] Target: 65%+

### Breakdown
  Hook strength:    18/25 (weak - 전회 연결 부자연스러움)
  Cliffhanger:      21/25 (good - 갈등 요소 도입)
  Character appeal: 16/20 (decent - 캐릭터 성장 정체)
  Pacing:           13/15 (acceptable)
  Genre compliance: 14/15 (good)

### Critical Issues
⚠ Para 1-3: 전회 클리프 해소가 너무 늦음 (para 5로 이동 필요)
⚠ Para 10-15: 캐릭터 내면 변화 없음 - 성장 필요

### Improvement Actions (URGENT)
1. **Para 1 강화**: 전회 클리프 즉시 해소 → +4% retention
2. **Para 12에 깨달음 추가**: 여주의 감정 변화 → +3% retention
3. **Para 20 클리프행어 강화**: 제3자 등장 암시 → +2% retention

### Projected after fixes: 77%
```

## Example Output: Critical (Chapter 1 Below Target)

```
=== Chapter 1 Retention Analysis (CRITICAL) ===

## Chapter 1 → 2 Predicted Retention: 71%
  [FAIL] Target: 75%+ (Critical threshold)

⚠⚠⚠ URGENT: Chapter 1 retention below critical threshold!
This will severely impact overall series success.

### Breakdown
  Hook strength:    15/25 ❌ (weak - 첫 문장이 평범함)
  Cliffhanger:      20/25 (good - but not enough to overcome weak start)
  Character appeal: 15/20 (acceptable - 여주 매력 부족)
  Pacing:           12/15 (decent)
  Genre compliance: 13/15 (acceptable)

### CRITICAL Issues

1. **Para 1 (URGENT)**:
   Current: "그녀는 아침에 일어났다."
   Problem: 너무 평범한 시작 - 독자를 즉시 끌어들이지 못함
   Fix: 강렬한 액션/대사/상황으로 시작
   Example: "해고 통지서를 받는 순간, 그녀는 미소 지었다."
   Impact: +6% retention

2. **Para 3-5 (URGENT)**:
   Problem: 캐릭터 소개 없이 배경 설명만 3문단
   Fix: 여주의 감정/생각/특징을 먼저 보여주기
   Impact: +4% retention

3. **Para 8 (URGENT)**:
   Problem: 여주의 매력 포인트 없음
   Fix: 독특한 반응/사고방식/행동 1-2줄 추가
   Impact: +3% retention

### Immediate Actions Required
1. **Para 1 완전 재작성**: 첫 문장 강렬하게
2. **Para 3-5 축약 + 캐릭터 focus**: 배경 50% 줄이고 여주에 집중
3. **Para 8 캐릭터 매력 추가**: 여주만의 특별함 보여주기
4. **Para 15 hook 추가**: 중간 이탈 방지

### Projected after fixes: 84% (9% improvement)
### Status after fixes: PASS

⚠ 이 수정사항들은 필수입니다. 1화 실패는 전체 시리즈 실패를 의미합니다.
```

## Example Output: Declining Trend

```
=== Retention Prediction (Multi-Chapter) ===

| Chapter | Retention | Status | Trend |
|---------|-----------|--------|-------|
| 1 → 2 | 78% | ✓ PASS | - |
| 2 → 3 | 71% | ✓ PASS | ↓ -7% |
| 3 → 4 | 68% | ⚠ WARNING | ↓ -3% |
| 4 → 5 | 64% | ⚠ WARNING | ↓ -4% |

### Overall Trend: DECLINING ⚠

### Analysis
- Strong start at Chapter 1 (78%)
- Consistent decline over 4 chapters
- At risk of falling below 60% (critical) by Chapter 6
- Pattern suggests: **Reader fatigue or predictable plotting**

### Root Cause Analysis
1. 클리프행어 패턴 반복 (similar structure in ch 2, 3, 4)
2. 캐릭터 성장 정체 (여주 변화 없음)
3. 새로운 갈등 부재 (같은 문제 반복)

### Strategic Recommendations
1. **Chapter 5**: 새로운 서브플롯 도입 (예: 제3자 등장, 과거 비밀 공개)
2. **Chapter 5-6**: 캐릭터 내면 변화 강조 (여주 깨달음/성장)
3. **Chapter 6+**: 클리프행어 패턴 변경 (대화 → 액션 → 정보 공개 순환)
4. **Pacing shift**: 템포 변화로 신선함 제공

### Projected Impact
Current trajectory: Chapter 6 → 58% (FAIL)
With fixes: Chapter 6 → 72% (PASS)
```

## Workflow Integration

### After Writing New Chapter

```bash
/write 1
# System automatically checks:
/check-retention --first
```

If retention < 75%, system suggests:
```
Retention below target. Run /revise 1 with these priorities:
1. Strengthen opening paragraph
2. Add character appeal
3. Improve cliffhanger
```

### Batch Analysis

```bash
# Check all existing chapters
/check-retention 1
/check-retention 2
/check-retention 3
```

### Series Health Check (10+ Chapters)

```
=== Series Fatigue Check ===

Chapters analyzed: 1-15
Series age: 15 chapters

Fatigue Score: 32/100 (Low fatigue - healthy)

### Repetition Analysis
- Scene structure variety: GOOD (8 different templates)
- Dialogue patterns: ACCEPTABLE (some repetition in greeting scenes)
- Plot twists: GOOD (unexpected elements every 3-4 chapters)

### Character Growth
- 여주: PROGRESSING (clear arc from ch 1 → 15)
- 남주: DEVELOPING (layers revealed gradually)
- Supporting cast: ACCEPTABLE

### Freshness
- New elements introduced: Every 2.5 chapters (average)
- Predictability: LOW (readers guessing correctly only 40% of time)

### Recommendations
- Series health: GOOD
- Can sustain current quality for 10-15 more chapters
- Consider introducing major twist around chapter 20-25
```

## Tips for Improving Retention

### Hook Strength (+5-10%)
- Start in media res (middle of action)
- Use strong verbs in first sentence
- Create immediate curiosity/tension

### Cliffhanger (+5-10%)
- End on unresolved question
- Use dialogue cliffhangers for intimacy
- Introduce unexpected element in last paragraph

### Character Appeal (+3-7%)
- Show unique personality trait early
- Make character relatable (flaws + strengths)
- Give character clear goal/motivation

### Pacing (+2-5%)
- Vary sentence length
- Cut unnecessary description
- Balance action/dialogue/introspection

### Genre Compliance (+2-5%)
- Deliver genre expectations consistently
- Use genre tropes creatively
- Meet reader's emotional contract
