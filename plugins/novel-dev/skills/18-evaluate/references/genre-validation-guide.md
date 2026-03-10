# validate-genre - Detailed Guide

## Agent Invocation

```javascript
Task(subagent_type="novel-dev:genre-validator", model="sonnet", prompt=`
## 검증 요청

Chapter: ${chapter}
Genre: ${project.genre}
Sub-Genres: ${project.sub_genres}

## 회차 콘텐츠

${chapterContent}

## 이전 감정 맥락

${emotionalContext}

## 검증 항목

### 1. 장르별 필수 요소

각 장르마다 반드시 포함되어야 할 요소들을 체크하세요:

**로맨스:**
- 심쿵 포인트 (최소 1회 이상)
- 밀당/긴장감
- 감정선 진행
- 관계 진전도

**판타지:**
- 세계관 요소 노출
- 마법/능력 설정 활용
- 모험/성장 요소

**스릴러/미스터리:**
- 긴장감 유지
- 떡밥/힌트 배치
- 반전 요소

**현대물:**
- 현실감 있는 대화
- 시대 고증
- 사회적 맥락

### 2. 상업적 요소

- Hook density (회차당 훅 개수: 3-4개 권장)
- Cliffhanger 존재 여부
- Dialogue ratio (대화:지문 비율 - 장르별 적정 범위)
- Episode length (장르별 적정 분량)

### 3. 클리셰 사용 분석

- 사용된 클리셰 목록
- 과도한 사용 경고
- 참신한 변주 여부

### 4. 종합 판정

- 점수 산출 (100점 만점)
- GENRE_COMPLIANT / NEEDS_IMPROVEMENT / GENRE_MISMATCH
- 구체적 개선 권고안 (미충족 항목에 대해)

## 출력 형식

JSON 형식으로 상세한 검증 결과를 제공하세요.
라인 번호를 명시하여 구체적인 근거를 제시하세요.
`)
```

## Genre Requirements Detail

### Romance

| Element | Requirement | How to Check |
|---------|-------------|--------------|
| 심쿵 포인트 | Min 1/chapter | Physical touch, eye contact, internal flutter reaction |
| 밀당 | Min 1/chapter | Push-pull dynamic, rejection-persistence pattern |
| 감정선 진행 | Every chapter | Character feelings evolve or deepen |
| 관계 진전 | Every 2-3 chapters | Relationship status changes (stranger→acquaintance→friend→love interest) |

**Dialogue Ratio**: 55-65% (romance is dialogue-heavy)
**Episode Length**: 5,000-5,500 characters (Korean web novel standard)

### Fantasy

| Element | Requirement | How to Check |
|---------|-------------|--------------|
| 세계관 요소 | Every chapter | Magic system, world rules, setting details referenced |
| 마법/능력 활용 | Every 2-3 chapters | Powers used in plot, not just mentioned |
| 모험/성장 | Every chapter | Character faces challenges, learns, or gains power |

**Dialogue Ratio**: 45-55% (balanced with world-building description)
**Episode Length**: 5,500-6,500 characters

### Thriller/Mystery

| Element | Requirement | How to Check |
|---------|-------------|--------------|
| 긴장감 유지 | Throughout | Sustained sense of danger or uncertainty |
| 떡밥/힌트 | 2-3/chapter | Clues placed for future payoff |
| 반전 요소 | Every 3-5 chapters | Unexpected revelations or twists |

**Dialogue Ratio**: 50-60% (investigation-heavy)
**Episode Length**: 5,000-6,000 characters

### Contemporary

| Element | Requirement | How to Check |
|---------|-------------|--------------|
| 현실감 있는 대화 | Throughout | Natural speech patterns, modern slang |
| 시대 고증 | As needed | Accurate references to current events, technology |
| 사회적 맥락 | Throughout | Realistic social dynamics, workplace/school norms |

**Dialogue Ratio**: 60-70% (very dialogue-heavy)
**Episode Length**: 4,500-5,500 characters

## Commercial Elements Detail

### Hook Density

**Target**: 3-4 hooks per chapter

**Hook Types**:
- Plot hook: Unexpected event or information
- Character hook: Surprising action or revelation
- Emotional hook: Strong feeling evoked
- Mystery hook: Question raised without answer

**Placement**:
- Hook 1: Lines 1-50 (opening hook)
- Hook 2: Lines 100-150 (mid-chapter re-engagement)
- Hook 3: Lines 200-250 (building to climax)
- Hook 4: Last 20-30 lines (cliffhanger)

### Cliffhanger

**Required**: Yes (critical for serialized web novels)

**Strength Levels**:
- **STRONG (8-10)**: Unresolved crisis, shocking revelation, dramatic entrance
- **MODERATE (5-7)**: Unanswered question, emotional uncertainty
- **WEAK (0-4)**: Simple scene end, resolution without tension

**Best Practices**:
- Use varied types (dialogue, action, revelation)
- Connect to next chapter opening
- Avoid repetitive patterns

### Dialogue Ratio

Measured as percentage of text that is dialogue vs. narration/description.

**How to Calculate**:
```python
dialogue_lines = count(lines starting with quotes or dialogue markers)
total_lines = count(all lines)
dialogue_ratio = (dialogue_lines / total_lines) * 100
```

**Genre Targets**:
- Romance: 55-65%
- Fantasy: 45-55%
- Thriller: 50-60%
- Contemporary: 60-70%

### Episode Length

Korean web novel standard lengths (characters, not words):

| Genre | Min | Optimal | Max |
|-------|-----|---------|-----|
| Romance | 4,500 | 5,200 | 5,500 |
| Fantasy | 5,000 | 6,000 | 6,500 |
| Thriller | 4,500 | 5,500 | 6,000 |
| Contemporary | 4,000 | 5,000 | 5,500 |

## Cliche Analysis

### Common Romance Cliches

| Cliche | Acceptable Use | Overuse Warning |
|--------|----------------|-----------------|
| 운명적 만남 | 1-2 times/series | > 3 times |
| 갑작스런 제안 | 1 time/series | > 2 times |
| 과거 인연 | 1 time (reveal gradually) | Multiple reveals |
| 오해 트로프 | 2-3 times/series | Every chapter |
| 우연한 재회 | 2-3 times/series | > 4 times |

### Freshness Evaluation

- **EXCELLENT**: Unique twist on cliche, subverts expectation
- **GOOD**: Familiar but executed well with character-specific spin
- **ACCEPTABLE**: Standard usage, no special variation
- **POOR**: Predictable, no attempt at freshness
- **OVERUSED**: Same cliche repeated too frequently

## Compliance Scoring

```python
# Scoring breakdown
required_elements_score = (met_elements / total_elements) * 40
commercial_factors_score = (met_factors / total_factors) * 30
cliche_freshness_score = cliche_rating * 15
emotional_continuity_score = continuity_rating * 15

compliance_score = (
    required_elements_score +
    commercial_factors_score +
    cliche_freshness_score +
    emotional_continuity_score
)
```

## Output Format

### Console Output

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

### File Output

**Location:** `validations/genre/chapter_{N}_genre.json`

```json
{
  "chapter": 5,
  "genre": "romance",
  "sub_genres": ["modern", "comedy"],
  "validated_at": "2026-01-22T10:30:00Z",
  "compliance_score": 92,
  "verdict": "GENRE_COMPLIANT",
  "required_elements": {
    "heart_flutter": {
      "found": 2,
      "required": 1,
      "status": "PASS",
      "lines": [38, 127]
    },
    "tension": {
      "found": 3,
      "required": 1,
      "status": "PASS",
      "lines": [56, 103, 201]
    },
    "push_pull": {
      "found": 1,
      "required": 1,
      "status": "PASS",
      "lines": [145]
    },
    "relationship_progress": {
      "status": "PRESENT"
    }
  },
  "commercial_factors": {
    "hook_density": {
      "found": 4,
      "target": "3-4",
      "status": "OPTIMAL"
    },
    "cliffhanger": {
      "status": "STRONG",
      "line": 245
    },
    "dialogue_ratio": {
      "value": 58,
      "target": "55-65",
      "status": "OPTIMAL"
    },
    "episode_length": {
      "value": 5200,
      "target": "5000-5500",
      "status": "OPTIMAL"
    }
  },
  "cliche_usage": {
    "items": [
      {
        "type": "운명적 만남",
        "line": 38,
        "freshness": "GOOD"
      },
      {
        "type": "갑작스런 제안",
        "line": 103,
        "freshness": "GOOD"
      },
      {
        "type": "과거 인연 복선",
        "line": 89,
        "freshness": "EXCELLENT"
      }
    ],
    "overused": [],
    "status": "ACCEPTABLE"
  },
  "emotional_continuity": {
    "previous_context_maintained": true,
    "character_consistency": true,
    "tension_escalation": "appropriate"
  },
  "issues": [],
  "recommendations": [
    "이 회차는 로맨스 장르의 핵심 요소를 충분히 만족하며, 상업적 요소도 최적 수준입니다."
  ]
}
```

## Multi-Genre Validation

For projects with multiple genres (e.g., "Romance Fantasy"):

```
=== Genre Validation: Romance Fantasy ===

Chapter 5 Overall Compliance: 90/100 (EXCELLENT)

Romance Compliance: 88/100
  Required Elements:
    [x] 심쿵 포인트: 2/1
    [x] 밀당: 1/1
    [x] 감정선 진행: PRESENT
    [x] 관계 진전: PRESENT

Fantasy Compliance: 92/100
  Required Elements:
    [x] 세계관 요소: PRESENT (마법 계약 설정)
    [x] 마법/능력 활용: PRESENT (계약 마법 사용)
    [x] 모험 요소: PRESENT (새로운 세계 탐색)

Genre Balance: GOOD
  - 판타지 요소가 로맨스를 보완 (계약 마법이 관계 발전 촉매)
  - 두 장르가 자연스럽게 융합
  - 판타지 설정이 로맨스 트로프를 참신하게 만듦

Verdict: GENRE_COMPLIANT - Excellent genre fusion
```

## Integration Workflow

### In Ralph Loop (`/write_all`)

```javascript
for each chapter:
    await write(chapter)
    const validation = await validateGenre(chapter)

    if (validation.compliance_score < 70) {
        await revise(chapter, validation.recommendations)
        await validateGenre(chapter)  // Re-validate
    }
```

### Standalone Validation

```bash
/validate-genre 3
# If NEEDS_IMPROVEMENT:
/revise 3
/validate-genre 3  # Confirm fixes worked
```
