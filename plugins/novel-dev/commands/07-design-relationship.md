---
description: "[7단계] 관계 설계 - 캐릭터 간 관계 네트워크 설계"
---

[NOVEL-SISYPHUS: 관계 설계]

## Prerequisites

- `characters/*.json` must exist (최소 2명 이상)
- Run after `/character` (06단계)

## 언제 필요한가?

- 등장인물 10명 이상
- 복잡한 관계망 (삼각관계, 가족 갈등, 파벌 등)
- 관계 변화가 플롯의 핵심인 경우

## 실행 단계

1. **캐릭터 로드**
   - `characters/*.json` 모든 캐릭터 로드
   - 기존 relationships 정보 추출

2. **관계 매트릭스 생성**

   ```
   Task(subagent_type="novel-dev:plot-architect", prompt="
   캐릭터 목록: {characters}

   캐릭터 간 관계 매트릭스를 생성하세요:

   1. 핵심 관계 (주인공 중심)
      - 연인/애정 관계
      - 가족 관계
      - 적대 관계
      - 멘토/제자 관계

   2. 관계 역학
      - 현재 상태 (친밀도 1-10)
      - 갈등 요소
      - 관계 변화 방향 (악화/개선/유지)
      - 변화 시점 (회차)

   3. 숨겨진 관계
      - 비밀 관계 (독자에게 숨김)
      - 공개 시점

   4. 관계 삼각형
      - 갈등 유발 삼각관계
      - 동맹 관계
   ")
   ```

3. **파일 생성**
   - `plot/relationships.json` (전체 관계 매트릭스)
   - 각 캐릭터 파일의 relationships 섹션 업데이트

## 출력 예시

### plot/relationships.json
```json
{
  "core_relationships": [
    {
      "id": "rel_001",
      "characters": ["char_001", "char_002"],
      "type": "romantic",
      "label": "계약 연인 → 진짜 연인",
      "start_state": {
        "intimacy": 2,
        "trust": 3,
        "conflict": "신분 차이, 가짜 관계"
      },
      "end_state": {
        "intimacy": 10,
        "trust": 10,
        "conflict": "해소"
      },
      "arc": [
        {"chapter": 1, "event": "계약 제안", "intimacy": 2},
        {"chapter": 15, "event": "동거 시작", "intimacy": 5},
        {"chapter": 25, "event": "감정 인지", "intimacy": 7},
        {"chapter": 40, "event": "위기", "intimacy": 4},
        {"chapter": 50, "event": "재결합", "intimacy": 10}
      ]
    },
    {
      "id": "rel_002",
      "characters": ["char_001", "char_003"],
      "type": "rivalry",
      "label": "직장 라이벌",
      "start_state": {
        "intimacy": 3,
        "trust": 2,
        "conflict": "승진 경쟁"
      },
      "end_state": {
        "intimacy": 5,
        "trust": 6,
        "conflict": "화해"
      }
    }
  ],
  "triangles": [
    {
      "characters": ["char_001", "char_002", "char_004"],
      "type": "love_triangle",
      "description": "준혁의 정혼녀가 유나를 견제",
      "resolution_chapter": 35
    }
  ],
  "hidden_relationships": [
    {
      "characters": ["char_002", "char_005"],
      "secret": "준혁과 비서의 과거 인연",
      "reveal_chapter": 30
    }
  ],
  "factions": [
    {
      "name": "준혁 편",
      "members": ["char_002", "char_005", "char_006"]
    },
    {
      "name": "반대파",
      "members": ["char_004", "char_007"]
    }
  ]
}
```

## 시각화 (선택)

관계도 다이어그램 생성:
```
        [char_004]
            |
          적대
            ↓
[char_003]─라이벌─[char_001]═══♥═══[char_002]
                      ↑               |
                    동료           지원
                      |               ↓
                  [char_006]     [char_005]
```

## 다음 단계

- `/design-timeline` - 시간순 이벤트 정리 (회귀물/복잡한 타임라인)
- `/main-arc` - 메인 플롯 아크 설계
