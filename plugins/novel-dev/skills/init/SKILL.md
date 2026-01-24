---
name: init
description: "[1단계] 프로젝트 초기화 - 작품 아이디어로 기본 구조 생성"
user-invocable: true
---

[NOVEL-SISYPHUS: 프로젝트 초기화]

$ARGUMENTS

## 실행 단계

1. **프로젝트 ID 생성**
   - 형식: `novel_{YYYYMMDD}_{HHmmss}`
   - 예: `novel_20250117_143052`

2. **디렉토리 구조 생성**
   ```
   novels/{novel_id}/
   ├── meta/
   ├── world/
   ├── characters/
   ├── plot/
   ├── chapters/
   ├── context/summaries/
   ├── reviews/
   └── exports/
   ```

3. **plot-architect 에이전트 호출**
   ```
   Task(subagent_type="plot-architect", prompt="
   다음 아이디어를 바탕으로 소설 기본 구조를 설계해주세요:

   아이디어: {사용자 입력}

   생성할 내용:
   1. 제목 (워킹 타이틀)
   2. 장르/서브장르
   3. 톤/분위기
   4. 목표 화수
   5. 회차당 목표 글자수
   6. 플롯 구조 선택 (3막/5막/영웅의여정/Save the Cat)
   7. 로그라인 (1문장)
   8. 시놉시스 (200자, 1000자 버전)

   결과를 JSON 형식으로 출력해주세요.
   ")
   ```

4. **파일 생성**
   - `meta/project.json` - 프로젝트 메타데이터
   - `plot/structure.json` - 플롯 구조
   - `meta/style-guide.json` - 문체 가이드 (v4 추가)

## 출력 예시

### meta/project.json
```json
{
  "id": "novel_20250117_143052",
  "title": "계약 연애의 정석",
  "genre": ["로맨스"],
  "sub_genre": ["현대 로맨스", "계약 연애"],
  "tropes": ["계약연애", "가짜연인", "밀당"],
  "tone": ["달달", "코믹"],
  "rating": "15+",
  "target_chapters": 50,
  "target_words_per_chapter": 5000,
  "current_chapter": 0,
  "status": "planning",
  "created_at": "2025-01-17T14:30:52Z",
  "updated_at": "2025-01-17T14:30:52Z"
}
```

### meta/style-guide.json (v4 추가)
```json
{
  "narrative_voice": "3인칭 제한 시점",
  "pov_type": "single",
  "tense": "과거형",
  "tone": ["달달", "코믹"],
  "pacing_default": "medium",
  "dialogue_style": "자연스러운 구어체",
  "description_density": "medium",
  "sentence_rhythm": "mixed",
  "taboo_words": ["갑자기", "문득", "그런데"],
  "preferred_expressions": [],
  "chapter_structure": {
    "opening_hook": true,
    "scene_count_range": [2, 4],
    "ending_hook": true
  }
}
```

### plot/structure.json
```json
{
  "structure_type": "3막",
  "logline": "...",
  "synopsis_short": "...",
  "synopsis_long": "...",
  "acts": [
    {
      "act_number": 1,
      "name": "Setup",
      "chapters": [1, 15],
      "purpose": "세계관 소개, 주인공 일상, 계약 제안"
    },
    ...
  ]
}
```

## 에러 처리

| 상황 | 처리 |
|------|------|
| 동일 ID 존재 | "프로젝트가 이미 존재합니다. 덮어쓰시겠습니까?" 확인 |
| 입력 불충분 | 인터뷰 모드: 장르, 화수, 톤 등 추가 질문 |
| 디렉토리 생성 실패 | 에러 메시지 출력, 수동 생성 안내 |
