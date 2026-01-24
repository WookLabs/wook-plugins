---
description: 회차별 몰입도 분석
---

# analyze-engagement - Chapter Engagement Analysis

## Purpose

회차의 독자 몰입도를 분석하고 이탈 위험 구간을 식별합니다.

## Usage

```
/analyze-engagement [chapter]
```

- `chapter` (optional): 분석할 회차 번호. 미지정시 현재 회차 분석

## Flow

1. **beta-reader** 에이전트 호출 → 몰입도 분석
2. **tension-tracker** 에이전트 호출 → 텐션 곡선 분석
3. 결과 종합 → `engagement-report.json` 생성
4. 위험 구간 시각화 (ASCII chart)

## Agent Invocations

### 1. Beta-Reader (몰입도 분석)

```javascript
Task(subagent_type="novel-dev:beta-reader", model="opus", prompt=`
Chapter: ${chapterNumber}
Content: ${chapterContent}
Genre: ${project.genre}
Target Audience: ${project.targetAudience}

다음 항목을 분석하세요:

1. 전반적 몰입도 (0-100 점수)
2. 이탈 위험 구간 식별 (문단 단위)
   - 위험도 % 계산
   - 원인 분석 (설명 과다, 대화 느림, 전개 지연 등)
3. 감정적 임팩트 순간 추출
   - 심쿵/긴장/호기심/슬픔/재미 등
4. 클리프행어 강도 평가 (0-10)

JSON 형식으로 출력:
{
  "overallScore": number,
  "dropOffRisks": [
    {
      "paragraph": number,
      "riskLevel": number,
      "reason": string,
      "suggestion": string
    }
  ],
  "emotionalBeats": [
    {
      "type": string,
      "intensity": number,
      "location": string
    }
  ],
  "cliffhangerStrength": number,
  "verdict": string
}
`)
```

### 2. Tension-Tracker (텐션 곡선)

```javascript
Task(subagent_type="novel-dev:tension-tracker", model="sonnet", prompt=`
Chapter: ${chapterNumber}
Content: ${chapterContent}
Previous Context: ${emotionalContext}

장면별 텐션 레벨을 0-10 스케일로 분석:

1. 각 장면의 텐션 포인트
2. 텐션 변화 곡선
3. 최고점/최저점 식별
4. 전체적 텐션 흐름 평가

JSON 형식으로 출력:
{
  "scenes": [
    {
      "sceneNumber": number,
      "description": string,
      "tensionLevel": number
    }
  ],
  "tensionCurve": "description of flow",
  "peakMoment": string,
  "valleyMoment": string
}
`)
```

## Output Format

### Console Output (ASCII Visualization)

```
=== Chapter {N} Engagement Analysis ===

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

### File Output

**Location:** `validations/engagement/chapter_{N}_engagement.json`

```json
{
  "chapter": 1,
  "timestamp": "2026-01-22T10:30:00Z",
  "overallScore": 82,
  "rating": "GOOD",
  "tensionCurve": {
    "scenes": [
      {
        "sceneNumber": 1,
        "description": "일상적 출근",
        "tensionLevel": 3
      },
      {
        "sceneNumber": 2,
        "description": "야근 지시",
        "tensionLevel": 5
      },
      {
        "sceneNumber": 3,
        "description": "계약 제안",
        "tensionLevel": 8
      },
      {
        "sceneNumber": 4,
        "description": "충격적 조건",
        "tensionLevel": 10
      }
    ],
    "peakMoment": "계약서 마지막 조항 발견",
    "valleyMoment": "일상적 출근 장면"
  },
  "dropOffRisks": [
    {
      "paragraph": 5,
      "riskLevel": 15,
      "reason": "설명 과다 - 회사 배경 서술이 3문단 지속",
      "suggestion": "배경 설명 50% 축약, 액션으로 전환"
    },
    {
      "paragraph": 12,
      "riskLevel": 8,
      "reason": "대화 템포 느림 - 인사말이 길게 이어짐",
      "suggestion": "인사 생략, 핵심 대화로 진입"
    },
    {
      "paragraph": 18,
      "riskLevel": 3,
      "reason": "양호 - 긴장감 유지됨",
      "suggestion": null
    }
  ],
  "emotionalBeats": [
    {
      "type": "심쿵",
      "intensity": 7,
      "location": "Para 8",
      "description": "남주의 부드러운 미소"
    },
    {
      "type": "긴장",
      "intensity": 8,
      "location": "Para 15",
      "description": "계약서 공개"
    },
    {
      "type": "긴장",
      "intensity": 9,
      "location": "Para 20",
      "description": "조건 확인"
    },
    {
      "type": "호기심",
      "intensity": 10,
      "location": "Para 25",
      "description": "숨겨진 조항"
    }
  ],
  "cliffhanger": {
    "strength": 9,
    "rating": "STRONG",
    "text": "하지만 계약서 마지막 장을 넘기는 순간, 그녀의 손이 멈췄다."
  },
  "verdict": "ENGAGING",
  "recommendation": "Proceed to next chapter",
  "actionItems": [
    "Para 5 설명 50% 축약",
    "Para 12 대화 템포 개선",
    "클리프행어 강도 유지 - 매우 효과적"
  ]
}
```

## Scoring Criteria

| Score | Rating | Action |
|-------|--------|--------|
| 90-100 | EXCELLENT | 완벽 - 그대로 진행 |
| 80-89 | GOOD | 양호 - 미세 조정 권장 |
| 70-79 | ACCEPTABLE | 수용 가능 - 일부 개선 필요 |
| 60-69 | NEEDS WORK | 작업 필요 - 문제 구간 수정 |
| 0-59 | POOR | 불량 - 대폭 수정 또는 재집필 |

## Drop-off Risk Levels

| Risk % | Severity | Action |
|--------|----------|--------|
| 0-5% | LOW | 양호 - 유지 |
| 6-10% | MODERATE | 주의 - 개선 권장 |
| 11-20% | HIGH | 경고 - 수정 필요 |
| 21%+ | CRITICAL | 위험 - 즉시 수정 |

## Tension Scale

```
10 █████████████████████ CLIMAX (클라이맥스)
 9 ███████████████████░░ PEAK (최고조)
 8 █████████████████░░░░ HIGH (고조)
 7 ███████████████░░░░░░ RISING (상승)
 6 █████████████░░░░░░░░ MODERATE+ (중상)
 5 ███████████░░░░░░░░░░ MODERATE (중간)
 4 █████████░░░░░░░░░░░░ MODERATE- (중하)
 3 ███████░░░░░░░░░░░░░░ LOW (낮음)
 2 █████░░░░░░░░░░░░░░░░ VERY LOW (매우 낮음)
 1 ███░░░░░░░░░░░░░░░░░░ MINIMAL (최소)
 0 ░░░░░░░░░░░░░░░░░░░░░ FLAT (평탄)
```

## Integration Points

- **write**: 집필 후 자동 몰입도 분석
- **revise**: 퇴고 후 개선 효과 측정
- **evaluate**: 품질 평가에 몰입도 점수 포함

## Related Commands

- `/evaluate` - 전반적 품질 평가
- `/consistency-check` - 설정 일관성 검사
- `/revise` - 퇴고 및 개선

## Notes

- 몰입도 분석은 beta-reader 관점을 시뮬레이션
- 장르별 텐션 곡선 패턴 고려
- 클리프행어는 웹소설의 핵심 - 높은 가중치 적용
- Drop-off risk 15% 이상 시 즉시 수정 권장
