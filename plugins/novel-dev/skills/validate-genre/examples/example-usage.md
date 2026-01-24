# validate-genre - Usage Examples

## Basic Usage

### Validate Current Chapter

```
/validate-genre
```

Validates the most recent chapter against genre requirements.

### Validate Specific Chapter

```
/validate-genre 5
```

Validates chapter 5 for genre compliance.

## Example Output: GENRE_COMPLIANT

```
=== Genre Validation: Romance ===

Chapter 5 Compliance: 92/100 (EXCELLENT)

Required Elements:
  [x] 심쿵 포인트: 2/1 (exceeds)
      - Line 38: "심장이 쿵 내려앉았다"
      - Line 127: "손끝이 스치는 순간 전기가 흐르는 것 같았다"
  [x] 긴장감: 3/1 (exceeds)
      - Line 56-78: 계약서 조항 협상 장면
      - Line 103-115: 예상치 못한 조건 제시
      - Line 201-230: 첫 대면 후 혼란스러운 감정
  [x] 밀당: 1/1 (adequate)
      - Line 145-160: 거절과 제안의 반복
  [x] 관계 진전: PRESENT
      - 계약 동의 → 다음 회차 만남 약속

Commercial Factors:
  [x] Hook density: 4 (target: 3-4) - OPTIMAL
      - Hook #1 (line 34): 계약 조건 공개
      - Hook #2 (line 89): 과거 인연 암시
      - Hook #3 (line 156): 예상 밖 반응
      - Hook #4 (line 245): 다음 회차 클리프행어
  [x] Cliffhanger: STRONG
      - Line 245: "그가 내민 손을 잡으려는 순간, 뒤에서 누군가 내 이름을 불렀다."
  [x] Dialogue ratio: 58% (target: 55-65%) - OPTIMAL
  [x] Episode length: 5,200자 (target: 5,000-5,500) - OPTIMAL

Cliche Usage: ACCEPTABLE
  Used:
    - 운명적 만남 (line 38-45)
    - 갑작스런 제안 (line 103)
    - 과거 인연 복선 (line 89)
  Warning: NONE
  Freshness: 클리셰를 참신하게 변주 (계약 조건이 독특함)

Emotional Continuity:
  [x] Previous context maintained
  [x] Character consistency with chapter 4
  [x] Tension escalation appropriate

Issues Found: NONE

Verdict: GENRE_COMPLIANT - Ready for publication

Recommendation:
이 회차는 로맨스 장르의 핵심 요소를 충분히 만족하며,
상업적 요소도 최적 수준입니다. 다음 회차 진행을 권장합니다.
```

## Example Output: NEEDS_IMPROVEMENT

```
=== Genre Validation: Romance ===

Chapter 3 Compliance: 58/100 (NEEDS_IMPROVEMENT)

Required Elements:
  [-] 심쿵 포인트: 0/1 (MISSING) ❌
      Issue: 이 회차에 심쿵 요소가 전혀 없습니다.
      Suggestion:
        - Line 120-130 영역: 두 주인공의 신체 접촉 또는 시선 교환 장면 추가
        - 예: "그의 손이 내 어깨에 닿았을 때..." 또는 "그와 눈이 마주쳤고..."
  [x] 긴장감: 1/1 (adequate)
      - Line 67-85: 대화 중 긴장감
  [-] 밀당: 0/1 (MISSING) ❌
      Issue: 두 주인공 간의 밀당이 없습니다.
      Suggestion:
        - Line 150-170: 여주의 거절 → 남주의 재제안 → 여주의 망설임 구조 추가
  [!] 관계 진전: STAGNANT ⚠️
      Issue: 4회차와 비교해 관계가 진전되지 않았습니다.
      Suggestion: 작은 변화라도 보여주세요 (예: 호칭 변경, 말투 변화 등)

Commercial Factors:
  [!] Hook density: 1 (target: 3-4) - TOO LOW ⚠️
      Issue: 독자를 끌어당길 훅이 부족합니다.
      Suggestion:
        - 회차 초반(50-100줄): 전회 클리프행어 해결 + 새로운 떡밥 1개
        - 회차 중반(150-200줄): 예상 밖 전개 또는 반전 1개
        - 회차 후반(마지막 30줄 내): 다음 회차로 이어질 클리프행어
  [-] Cliffhanger: WEAK ❌
      Current ending (line 234): "나는 집으로 돌아갔다."
      Issue: 너무 평범한 마무리. 독자가 다음 회차를 기다릴 이유가 없습니다.
      Suggestion:
        - 예상 밖의 인물 등장
        - 중요한 정보 공개 직전에 끊기
        - 긴박한 상황 전개
  [x] Dialogue ratio: 62% (target: 55-65%) - GOOD
  [x] Episode length: 5,100자 (target: 5,000-5,500) - GOOD

Cliche Usage: RISKY
  Used:
    - 우연한 재회 (line 45) - 과도하게 사용됨 ⚠️
    - 오해 트로프 (line 89-120) - 식상함 ⚠️
  Warning:
    로맨스에서 흔한 클리셰가 참신한 변주 없이 사용되었습니다.
    특히 '우연한 재회'는 이미 1회차와 2회차에서도 사용되었습니다.
  Suggestion:
    클리셰를 비틀거나, 캐릭터 고유의 반응으로 차별화하세요.

Emotional Continuity:
  [!] Context broken with chapter 2
      Issue: 2회차에서 여주가 남주에게 화를 냈으나, 3회차에서 감정이 설명 없이 해소됨
      Suggestion: 감정 변화의 계기를 보여주세요

Issues Found: 5 CRITICAL, 3 WARNINGS

Verdict: NEEDS_IMPROVEMENT - Revision recommended

Critical Actions Required:
1. 심쿵 포인트 1개 이상 추가 (line 120-130 권장)
2. 밀당 요소 추가 (line 150-170 권장)
3. 클리프행어 강화 (마지막 20-30줄 재작성)
4. Hook 2-3개 추가 (회차 전반에 분산 배치)
5. 감정 맥락 연결 (2회차 → 3회차 브릿지 추가)

Estimated revision impact: 800-1200자 추가/수정 필요
```

## Example Output: GENRE_MISMATCH

```
=== Genre Validation: Romance ===

Chapter 8 Compliance: 42/100 (GENRE_MISMATCH)

Required Elements:
  [-] 심쿵 포인트: 0/1 (MISSING) ❌
  [-] 긴장감: 0/1 (MISSING) ❌
  [-] 밀당: 0/1 (MISSING) ❌
  [-] 관계 진전: NOT PRESENT ❌

Commercial Factors:
  [-] Hook density: 0 ❌
  [-] Cliffhanger: NONE ❌
  [!] Dialogue ratio: 25% (target: 55-65%) - TOO LOW ❌
  [x] Episode length: 5,000자 - ACCEPTABLE

Cliche Usage: N/A (no romance elements present)

Emotional Continuity:
  [-] No romance elements to continue

Issues Found: 7 CRITICAL

Verdict: GENRE_MISMATCH - Full rewrite recommended

Critical Assessment:
이 회차는 로맨스 장르의 필수 요소를 거의 포함하지 않습니다.
현재 내용은 일상 묘사 위주로, 로맨스 독자의 기대를 전혀 충족하지 못합니다.

이 회차가 로맨스 소설의 일부라면, 다음 중 하나를 선택해야 합니다:
1. 전면 재작성 (권장): 로맨스 요소를 중심으로 다시 쓰기
2. 장르 재분류: 이 소설이 실제로 로맨스인지 재고

만약 전면 재작성을 선택한다면:
- 남주와의 상호작용을 최소 3개 장면 추가
- 심쿵/밀당 요소를 각 1개 이상 포함
- 관계 진전을 명확히 보여주기
- 클리프행어로 다음 회차 로맨스 전개 예고
```

## Example Output: Multi-Genre

```
=== Genre Validation: Romance Fantasy ===

Chapter 7 Overall Compliance: 90/100 (EXCELLENT)

=== Romance Elements ===
Romance Compliance: 88/100

Required Elements:
  [x] 심쿵 포인트: 2/1 (exceeds)
      - Line 56: "마법진 안에서 그의 손을 잡는 순간"
      - Line 189: "계약 마법이 두 사람을 연결하며..."
  [x] 밀당: 1/1 (adequate)
      - Line 102-125: 계약 조건 협상
  [x] 감정선 진행: PRESENT
      - 경계 → 호기심 → 신뢰의 시작
  [x] 관계 진전: PRESENT
      - 계약 파트너 → 마법적 유대 형성

=== Fantasy Elements ===
Fantasy Compliance: 92/100

Required Elements:
  [x] 세계관 요소: EXCELLENT
      - Line 12-45: 마법 계약 시스템 상세 설명
      - Line 78-89: 마법사 길드 구조 소개
      - Line 156-167: 고대 마법 언어 사용
  [x] 마법/능력 활용: EXCELLENT
      - Line 134-178: 계약 마법 의식 진행
      - Line 201-223: 마법 발현 장면
  [x] 모험 요소: PRESENT
      - 새로운 마법 세계 진입, 위험 요소 제시

=== Genre Balance ===
Balance Score: EXCELLENT

Analysis:
- 판타지 설정이 로맨스를 참신하게 만듦 (계약 마법 = 관계 촉매)
- 로맨스가 판타지에 감정적 깊이 제공
- 두 장르가 서로를 보완하며 자연스럽게 융합
- 독자가 두 장르 모두의 만족을 얻을 수 있음

Genre Integration Highlights:
1. 마법 계약이 관계 발전의 필연성 제공 (판타지 → 로맨스)
2. 감정적 연결이 마법 강화 (로맨스 → 판타지)
3. 심쿵 순간이 마법 발현과 연결 (완벽한 융합)

Commercial Factors:
  [x] Hook density: 4 - OPTIMAL
  [x] Cliffhanger: STRONG
  [x] Dialogue ratio: 52% (판타지-로맨스 최적 비율)
  [x] Episode length: 6,100자 (판타지 적정 분량)

Verdict: GENRE_COMPLIANT - Excellent multi-genre execution

Recommendation:
이 회차는 로맨스판타지의 모범 사례입니다.
두 장르의 필수 요소를 모두 충족하면서도 자연스럽게 융합했습니다.
현재 방향을 유지하며 다음 회차로 진행하세요.
```

## Workflow Examples

### After Writing

```bash
/write 5
# Check if it meets genre requirements:
/validate-genre 5
```

### Before Publishing

```bash
# Final quality gate
/validate-genre 1
/validate-genre 2
/validate-genre 3
# Only publish if all GENRE_COMPLIANT
```

### Revision Loop

```bash
/validate-genre 3
# Output: NEEDS_IMPROVEMENT (58/100)

/revise 3
# Apply the recommended fixes:
# - Add heart flutter moment at line 120-130
# - Add push-pull at line 150-170
# - Strengthen cliffhanger

/validate-genre 3
# Output: GENRE_COMPLIANT (78/100)
# Revision successful!
```

### Batch Validation

```bash
# Validate all chapters
for i in 1 2 3 4 5; do
    /validate-genre $i
done

# Summary:
# Ch 1: COMPLIANT (85/100)
# Ch 2: COMPLIANT (82/100)
# Ch 3: NEEDS_IMPROVEMENT (68/100) ← Fix this
# Ch 4: COMPLIANT (79/100)
# Ch 5: COMPLIANT (88/100)
```

## Reading the Results

### Compliance Score Ranges

| Score | Verdict | Meaning | Action |
|-------|---------|---------|--------|
| 90-100 | EXCELLENT | 장르 모범 사례 | Publish as is |
| 80-89 | GENRE_COMPLIANT | 장르 요구사항 충족 | Minor polish optional |
| 70-79 | GENRE_COMPLIANT | 수용 가능 | Some improvements recommended |
| 60-69 | NEEDS_IMPROVEMENT | 주요 요소 누락 | Revision required |
| 0-59 | GENRE_MISMATCH | 장르 부적합 | Major rewrite needed |

### Required Elements Symbols

- `[x]` - Met or exceeded requirements
- `[-]` - Missing (critical issue)
- `[!]` - Present but inadequate (warning)

### Commercial Factors Status

- `OPTIMAL` - Perfect range
- `GOOD` - Acceptable
- `TOO LOW` / `TOO HIGH` - Needs adjustment
- `MISSING` - Critical issue

### Cliche Status

- `ACCEPTABLE` - Good usage, fresh enough
- `RISKY` - Borderline overuse
- `OVERUSED` - Too many repetitions

## Tips for Fixing Issues

### Missing 심쿵 포인트 (Heart Flutter)

**Where to add**: Mid-chapter interaction scene

**How to create**:
- Physical touch (accidental or intentional)
- Intense eye contact
- Protective gesture
- Unexpected compliment
- Close proximity

**Example fix**:
```
Before: "그가 서류를 건넸다."
After: "그가 서류를 건네며 손끝이 스쳤다. 짧은 접촉이었지만 심장이 요동쳤다."
```

### Missing 밀당 (Push-Pull)

**Pattern**: Rejection → Persistence → Wavering

**Example fix**:
```
Before: "그녀는 제안을 수락했다."

After:
"안 돼요." 그녀가 고개를 저었다.
"왜?" 그가 한 발 다가섰다.
"너무... 갑작스러워서요." 그녀의 목소리가 흔들렸다.
"천천히 생각해봐. 나는 기다릴 수 있어."
그녀는 망설였다. 거절하고 싶었지만, 그의 진심 어린 눈빛이...
```

### Weak Cliffhanger

**Types of strong cliffhangers**:
1. **Revelation**: "계약서 마지막 조항에는 놀라운 내용이 있었다."
2. **Entrance**: "문이 열리며 예상치 못한 사람이 들어왔다."
3. **Dialogue**: "'사실은...' 그가 입을 열려는 순간 전화가 울렸다."
4. **Action**: "그녀는 그의 손을 잡았다."
5. **Decision**: "그녀는 마침내 결심했다. 하지만..."

### Low Hook Density

**Add hooks at**:
- Line 50-80: Early re-engagement
- Line 150-180: Mid-chapter interest
- Line 250-280: Building to climax

**Hook types**:
- Surprising information
- Unexpected character action
- Mystery question raised
- Emotional moment
