---
name: design-main-arc
description: |
  Triggers when user wants to design main plot arc.
  <example>메인 아크 설계</example>
  <example>주 플롯 짜기</example>
  <example>design main arc</example>
  <example>/design-main-arc</example>
  <example>중심 갈등 설정</example>
  <example>플롯 구조 만들기</example>
user-invocable: true
---

[NOVEL-SISYPHUS: 메인 아크 설계]

## Idempotency

If output file already exists:
1. Read existing content
2. Preserve user modifications (fields not auto-generated)
3. Merge with new content
4. Warn if conflicting changes detected

## 실행 단계

1. **데이터 로드**
   - `plot/structure.json` (플롯 구조)
   - `characters/*.json` (주요 캐릭터)

2. **plot-architect 에이전트 호출**
   ```
   Task(subagent_type="plot-architect", prompt="
   프로젝트: {project.json}
   플롯 구조: {structure.json}
   캐릭터: {characters 요약}

   메인 아크를 설계해주세요:

   1. 핵심 갈등
      - 외적 갈등 (환경, 상황)
      - 내적 갈등 (주인공 내면)
      - 관계적 갈등 (인물 간)

   2. 중심 질문 (Dramatic Question)
      - 독자가 끝까지 알고 싶어하는 질문

   3. 주요 이벤트
      - Inciting Incident (촉발 사건)
      - Plot Point 1 (1막→2막)
      - Midpoint (중간 반전)
      - Plot Point 2 (2막→3막)
      - Climax
      - Resolution

   4. 주제/메시지

   각 이벤트에 예상 회차 번호를 포함해주세요.
   ")
   ```

3. **파일 생성**
   - `plot/main-arc.json`

## 출력 예시

```json
{
  "conflicts": {
    "external": "계약 연애가 회사/가족에게 들킬 위기",
    "internal": "진짜 감정과 계약 조건 사이의 갈등",
    "relational": "신분 차이로 인한 남주 가문의 반대"
  },
  "dramatic_question": "가짜로 시작한 연애가 진짜가 될 수 있을까?",
  "major_events": {
    "inciting_incident": {
      "chapter": 3,
      "description": "남주가 파티 파트너로 계약 연애 제안"
    },
    "plot_point_1": {
      "chapter": 15,
      "description": "계약 기간 연장, 동거 시작"
    },
    "midpoint": {
      "chapter": 25,
      "description": "남주 가문에서 여주 조사 시작, 둘 다 감정 인지"
    },
    "plot_point_2": {
      "chapter": 40,
      "description": "여주의 비밀 폭로, 계약 파기"
    },
    "climax": {
      "chapter": 47,
      "description": "남주가 가문을 버리고 여주 선택"
    },
    "resolution": {
      "chapter": 50,
      "description": "재회, 진심 고백, 해피엔딩"
    }
  },
  "theme": "진정한 사랑은 조건을 초월한다"
}
```
