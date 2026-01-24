---
description: 장르 적합성 검증
---

[NOVEL-SISYPHUS: 장르 적합성 검증]

$ARGUMENTS

## 사용법

```
/validate-genre [chapter]
```

- `chapter`: 검증할 회차 번호. 생략 시 현재 회차 검증.

## 목적

특정 회차가 장르 요구사항을 충족하는지 검증합니다.
- 장르별 필수 요소 체크
- 상업적 요소 검증
- 클리셰 사용량 분석
- 구체적 개선 권고안 제시

## 실행 흐름

```
1. 프로젝트 장르 확인 (project.json)
2. 회차 콘텐츠 로드 (chapters/chapter_{N}.md)
3. 감정 맥락 로드 (chapters/emotional-context.json) - 이전 회차와의 연속성 확인
4. genre-validator 에이전트 호출
5. 필수 요소 체크리스트 생성
6. 상업적 요소 분석
7. 클리셰 사용 적정성 평가
8. 검증 결과 저장 (validations/genre/chapter_{N}_genre.json)
9. 결과 출력 (미충족 시 구체적 개선안 포함)
```

## 에이전트 호출

```
Task(subagent_type="novel-dev:genre-validator", model="sonnet", prompt="
## 검증 요청

Chapter: {chapter}
Genre: {project.genre}
Sub-Genres: {project.sub_genres}

## 회차 콘텐츠

{chapters/chapter_{N}.md 전체 내용}

## 이전 감정 맥락

{chapters/emotional-context.json 중 해당 회차 이전 맥락}

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
")
```

## 다중 장르 지원

프로젝트에 여러 장르가 지정된 경우 (예: 로맨스판타지):
- 각 장르의 필수 요소를 모두 체크
- 통합 준수도 점수 산출
- 장르 간 균형 평가

예시:
```
=== Genre Validation: 로맨스판타지 ===

Romance Compliance: 88/100
Fantasy Compliance: 92/100
Overall Compliance: 90/100

Genre Balance: GOOD (판타지 요소가 적절히 로맨스를 보완)
```

## 출력 예시

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

## 미충족 시 출력 예시

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

## 파일 출력

검증 결과를 다음 위치에 저장:
```
validations/genre/chapter_{N}_genre.json
```

구조:
```json
{
  "chapter": 5,
  "genre": "romance",
  "sub_genres": ["modern", "comedy"],
  "validated_at": "2026-01-22T10:30:00Z",
  "compliance_score": 92,
  "verdict": "GENRE_COMPLIANT",
  "required_elements": {
    "heart_flutter": { "found": 2, "required": 1, "status": "PASS", "lines": [38, 127] },
    "tension": { "found": 3, "required": 1, "status": "PASS", "lines": [56, 103, 201] },
    "push_pull": { "found": 1, "required": 1, "status": "PASS", "lines": [145] },
    "relationship_progress": { "status": "PRESENT" }
  },
  "commercial_factors": {
    "hook_density": { "found": 4, "target": "3-4", "status": "OPTIMAL" },
    "cliffhanger": { "status": "STRONG", "line": 245 },
    "dialogue_ratio": { "value": 58, "target": "55-65", "status": "OPTIMAL" },
    "episode_length": { "value": 5200, "target": "5000-5500", "status": "OPTIMAL" }
  },
  "cliche_usage": {
    "items": [
      { "type": "운명적 만남", "line": 38, "freshness": "GOOD" },
      { "type": "갑작스런 제안", "line": 103, "freshness": "GOOD" },
      { "type": "과거 인연 복선", "line": 89, "freshness": "EXCELLENT" }
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

## 다음 단계

- **GENRE_COMPLIANT**: 다음 회차 진행 또는 발행
- **NEEDS_IMPROVEMENT**: `/revise {chapter}` 실행 후 재검증
- **GENRE_MISMATCH**: 회차 전면 재작성 권고

## 통합 워크플로우

`/write_all` Ralph Loop 내에서 자동으로 각 회차마다 검증 수행 가능:
```
for each chapter:
    /write {chapter}
    /validate-genre {chapter}
    if compliance < 70:
        /revise {chapter}
        /validate-genre {chapter}  # 재검증
```
