---
description: 타임라인 설계
---

[NOVEL-SISYPHUS: 타임라인 설계]

## Prerequisites

- `meta/project.json` must exist
- Run after `/character` or `/design-relationship`

## 언제 필요한가?

- 회귀물/시간여행 장르
- 과거 회상이 많은 스토리
- 여러 시점이 교차하는 구조
- 복잡한 사건 순서

## 실행 단계

1. **프로젝트 분석**
   - 장르 확인 (회귀 여부)
   - 시간 구조 파악

2. **타임라인 유형 선택** (AskUserQuestion)

   - **선형 (Linear)**: 시간 순서대로 진행
   - **비선형 (Non-linear)**: 과거-현재 교차
   - **회귀 (Regression)**: 과거로 돌아감
   - **다중 (Parallel)**: 여러 시간대 동시 진행

3. **타임라인 생성**

   ```
   Task(subagent_type="novel-dev:plot-architect", prompt="
   프로젝트: {project.json}
   캐릭터: {characters}
   타임라인 유형: {timeline_type}

   작품 내 시간 흐름을 설계하세요:

   1. 주요 시간대
      - 현재 시점 (스토리 시작)
      - 과거 시점 (회상/회귀)
      - 미래 시점 (있을 경우)

   2. 핵심 이벤트 타임라인
      - 스토리 시작 전 주요 사건
      - 각 막별 시간 경과
      - 시간 도약 포인트

   3. 캐릭터별 타임라인
      - 주인공의 과거 사건
      - 다른 캐릭터와의 교차점

   4. 회귀물인 경우
      - 회귀 전 타임라인
      - 회귀 후 변경점
      - 나비효과 포인트
   ")
   ```

4. **파일 생성**
   - `plot/timeline.json`

## 출력 예시

### plot/timeline.json (선형)
```json
{
  "type": "linear",
  "story_start": "20XX년 3월 15일",
  "story_end": "20XX년 9월 30일",
  "duration": "약 6개월",

  "eras": [
    {
      "id": "present",
      "label": "현재",
      "start": "20XX년 3월 15일",
      "description": "스토리 본편"
    },
    {
      "id": "past_5years",
      "label": "5년 전",
      "events": ["유나의 첫 직장", "준혁의 유학 시절"]
    }
  ],

  "major_events": [
    {
      "date": "20XX년 3월 15일",
      "chapter": 1,
      "event": "유나와 준혁 첫 만남",
      "characters": ["char_001", "char_002"]
    },
    {
      "date": "20XX년 3월 20일",
      "chapter": 3,
      "event": "계약 체결",
      "characters": ["char_001", "char_002"]
    },
    {
      "date": "20XX년 4월 15일",
      "chapter": 15,
      "event": "동거 시작 (계약 연장)",
      "characters": ["char_001", "char_002"]
    }
  ],

  "time_jumps": [
    {
      "from_chapter": 14,
      "to_chapter": 15,
      "duration": "2주",
      "reason": "계약 연장 협상 기간"
    }
  ],

  "flashbacks": [
    {
      "chapter": 20,
      "target_era": "past_5years",
      "content": "준혁의 유학 시절 트라우마",
      "purpose": "캐릭터 동기 설명"
    }
  ]
}
```

### plot/timeline.json (회귀물)
```json
{
  "type": "regression",
  "regression_point": {
    "original_death": "20XX년 12월 31일",
    "return_to": "20XX년 1월 1일",
    "chapter": 1
  },

  "original_timeline": [
    {
      "date": "20XX년 3월",
      "event": "첫 번째 실패",
      "outcome": "bad"
    },
    {
      "date": "20XX년 6월",
      "event": "배신당함",
      "outcome": "bad"
    },
    {
      "date": "20XX년 12월 31일",
      "event": "사망",
      "outcome": "death"
    }
  ],

  "new_timeline": [
    {
      "date": "20XX년 3월",
      "event": "첫 번째 분기점",
      "change": "회피 성공",
      "butterfly_effect": ["rel_002 변화", "char_003 생존"]
    }
  ],

  "knowledge_advantage": [
    "주식 시세 정보",
    "배신자 정체",
    "숨겨진 던전 위치"
  ],

  "butterfly_effects": [
    {
      "cause": "char_003 조기 구출",
      "effect": "후반부 동맹 가능",
      "reveal_chapter": 30
    }
  ]
}
```

## 다음 단계

- `/main-arc` - 메인 플롯 아크 설계
- `/sub-arc` - 서브플롯 설계
