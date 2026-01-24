---
name: design-character
description: "[3단계] 캐릭터 설계 - 캐릭터 상세 설계"
user-invocable: true
---

[NOVEL-SISYPHUS: 캐릭터 설계]

$ARGUMENTS

## Idempotency

If output file already exists:
1. Read existing content
2. Preserve user modifications (fields not auto-generated)
3. Merge with new content
4. Warn if conflicting changes detected

## 실행 단계

1. **인자 확인**
   - 캐릭터명 지정 시: 해당 캐릭터만 설계
   - 미지정 시: 주요 캐릭터 전체 설계 (인터뷰 모드)

2. **lore-keeper 에이전트 호출**
   ```
   Task(subagent_type="lore-keeper", prompt="
   프로젝트: {project.json}
   세계관: {world.json}

   캐릭터를 설계해주세요:

   1. 기본 신상
      - 이름, 나이, 성별
      - 외모 (키, 체형, 특징)
      - 목소리 톤, 말투

   2. 배경
      - 출신, 가족
      - 직업, 경제 수준
      - 과거 트라우마
      - 비밀 (공개 시점 포함)

   3. 내면
      - Want (표면적 욕망)
      - Need (진정한 필요)
      - Fatal Flaw (치명적 결함)
      - 가치관, 두려움

   4. 행동 패턴
      - 습관, 취미
      - 스트레스 반응
      - 거짓말할 때 특징

   5. 캐릭터 아크
      - 시작 상태 → 변화 촉발 → 최저점 → 성장 → 종착점

   결과를 JSON 형식으로 출력해주세요.
   ")
   ```

3. **파일 생성/업데이트**
   - `characters/{char_id}.json` - 개별 캐릭터
   - `characters/index.json` - 캐릭터 목록
   - `characters/relationships.json` - 관계 매트릭스

## 출력 예시

### characters/char_001_yuna.json
```json
{
  "id": "char_001",
  "name": "김유나",
  "aliases": ["유나", "김대리"],
  "role": "protagonist",

  "basic": {
    "age": 28,
    "gender": "여성",
    "birthday": "3월 15일",
    "appearance": {
      "height": "165cm",
      "build": "보통",
      "features": ["단발머리", "안경", "항상 정장"]
    },
    "voice": {
      "tone": "차분하고 낮은 톤",
      "speech_pattern": "존댓말 위주, 간결한 문장",
      "vocabulary": "비즈니스 용어 자주 사용"
    }
  },

  "background": {
    "origin": "부산",
    "family": "부모님, 여동생 1명",
    "education": "서울대 경영학과",
    "occupation": "대기업 마케팅팀 대리",
    "economic_status": "중산층",
    "trauma": "과거 연인에게 배신당한 경험",
    "secret": {
      "content": "실은 재벌가 숨겨진 딸",
      "reveal_chapter": 35
    }
  },

  "inner": {
    "want": "승진해서 능력을 인정받고 싶다",
    "need": "자신의 가치를 외부 평가가 아닌 내면에서 찾기",
    "fatal_flaw": "타인의 시선에 지나치게 의존",
    "values": ["성실함", "공정함"],
    "fears": ["실패", "배신", "혼자 남겨지는 것"]
  },

  "behavior": {
    "habits": ["손톱 물어뜯기 (긴장 시)", "야근 후 편의점 맥주"],
    "hobbies": ["독서", "요가"],
    "dislikes": ["무례한 사람", "뒷담화"],
    "stress_response": "일에 몰두함",
    "lying_tell": "눈을 피하고 말이 빨라짐"
  },

  "arc": {
    "start_state": "일 중독, 감정 억압",
    "catalyst": "계약 연애 제안",
    "midpoint": "가짜 감정인 줄 알았던 것이 진짜가 됨",
    "dark_night": "비밀이 폭로되고 모든 것을 잃음",
    "transformation": "타인의 평가가 아닌 자신의 행복 선택",
    "end_state": "진정한 사랑과 자아 수용"
  }
}
```

### characters/relationships.json
```json
{
  "relationships": [
    {
      "character_a": "char_001",
      "character_b": "char_002",
      "relationship_type": "계약 연인 → 진짜 연인",
      "initial_state": "비즈니스 파트너",
      "evolution": [
        { "chapter": 1, "state": "첫 만남, 서로에 대한 편견" },
        { "chapter": 15, "state": "계약 체결" },
        { "chapter": 30, "state": "감정 발생 인지" },
        { "chapter": 45, "state": "갈등과 이별" },
        { "chapter": 50, "state": "재회와 진심 고백" }
      ],
      "final_state": "연인",
      "conflict_points": ["신분 차이", "과거 트라우마", "주변 반대"],
      "chemistry_type": "밀당, 티격태격"
    }
  ]
}
```
