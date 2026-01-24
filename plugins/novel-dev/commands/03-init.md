---
description: "[3단계] 프로젝트 초기화 - BLUEPRINT.md 기반 프로젝트 생성"
prerequisite: "BLUEPRINT.md must exist (run /blueprint-gen first)"
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
   - `meta/style-guide.json` - 문체 가이드
   - **`CLAUDE.md`** - AI 협업 가이드 (신규)

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

## --from-blueprint 옵션

BLUEPRINT.md에서 프로젝트를 생성합니다:

```bash
/init --from-blueprint
/init --from-blueprint novels/my-novel/BLUEPRINT.md
/init --from-blueprint .claude/blueprints/my-concept.md
```

### 워크플로우

1. **BLUEPRINT.md 로드**
   - 경로 지정 시: 해당 파일 로드
   - 미지정 시: 현재 프로젝트 또는 `.claude/blueprints/` 검색

2. **메타데이터 추출**
   ```
   - 제목 → project.json.title
   - 장르/서브장르 → project.json.genre, sub_genre
   - 목표 화수 → project.json.target_chapters
   - 회차당 글자수 → project.json.target_words_per_chapter
   - 등급 → project.json.rating
   - 톤/분위기 → project.json.tone, style-guide.json.tone
   ```

3. **레시피 매칭**
   - BLUEPRINT.md의 `<!-- Recipe: xxx -->` 주석에서 레시피 ID 추출
   - 레시피가 없으면 장르 기반 자동 선택

4. **디렉토리 구조 생성**
   ```
   novels/{novel_id}/
   ├── meta/           # project.json, style-guide.json
   ├── world/          # world.json
   ├── characters/     # 캐릭터 프로필
   ├── plot/           # structure.json
   ├── chapters/       # 챕터 파일
   ├── context/        # 요약
   ├── reviews/        # 리뷰
   ├── exports/        # 내보내기
   └── BLUEPRINT.md    # 블루프린트 복사본
   ```

5. **파일 생성**
   - `meta/project.json` - 블루프린트에서 추출한 메타데이터
   - `meta/style-guide.json` - 레시피 기반 스타일 가이드
   - `plot/structure.json` - 블루프린트의 플롯 구조 변환
   - `BLUEPRINT.md` - 원본 블루프린트 복사

6. **캐릭터 자동 생성** (선택적)
   - 블루프린트의 핵심 캐릭터 섹션에서 캐릭터 추출
   - `characters/` 디렉토리에 기본 프로필 생성

### 장점

- 검토된 기획서 기반으로 일관된 프로젝트 생성
- 수동 입력 최소화
- 레시피 자동 적용
- 기획과 실행의 연결성 보장

### 예시

```bash
# 1. 블루프린트 생성
/blueprint-init "재벌 3세와 평범녀의 계약 연애"

# 2. 블루프린트 검토
/blueprint-review

# 3. 프로젝트 생성
/init --from-blueprint

# 결과:
# ✅ 프로젝트 생성 완료
# ID: novel_20250124_183052
# 제목: 계약의 온도
# 장르: 로맨스
# 레시피: romance-contract
# 목표: 60화
```

### 블루프린트 → 프로젝트 매핑

| BLUEPRINT.md 섹션 | 프로젝트 파일 | 필드 |
|-------------------|---------------|------|
| 기본 정보.장르 | project.json | genre |
| 기본 정보.서브장르 | project.json | sub_genre |
| 기본 정보.등급 | project.json | rating |
| 기본 정보.목표 화수 | project.json | target_chapters |
| 기본 정보.회차당 글자수 | project.json | target_words_per_chapter |
| 기본 정보.톤/분위기 | project.json, style-guide.json | tone |
| 로그라인 | structure.json | logline |
| 시놉시스 (200자) | structure.json | synopsis_short |
| 시놉시스 (1000자) | structure.json | synopsis_long |
| 플롯 구조.구조 유형 | structure.json | structure_type |
| 플롯 구조.1막/2막/3막 | structure.json | acts[] |
| 필수 요소.트로프 | project.json | tropes |
| 핵심 캐릭터 | characters/*.json | (각 캐릭터 파일) |

## CLAUDE.md 자동 생성

프로젝트 초기화 시 `CLAUDE.md` 파일이 자동 생성됩니다.

### 목적
- **빠른 컨텍스트**: Claude가 매번 파일을 읽지 않아도 핵심 설정 파악
- **작업 규칙 명시**: 시점, 분량, 문체, 금지어 등 일관된 품질 유지
- **상태 추적**: 마지막 작업, 다음 할 일, 미해결 이슈
- **워크플로우 가이드**: 다음 단계 명령어 안내

### 포함 내용
```markdown
# {제목} - AI 협업 가이드

## 프로젝트 개요
- 장르, 목표 화수, 현재 진행률

## 핵심 설정 (빠른 참조)
- 주요 캐릭터, 핵심 갈등, 톤

## 작업 규칙
- 시점, 분량, 문체, 금지 표현
- 품질 기준 (critic ≥70, beta-reader ≥75, genre-validator ≥90)

## 현재 상태
- 마지막 작업, 다음 할 일, 미해결 이슈

## 워크플로우 가이드
- 설계/집필/검토 단계별 명령어

## 참조 파일 경로
- 세계관, 캐릭터, 플롯 등 파일 위치
```

### 자동 업데이트
- `/write` 완료 시 → 현재 상태 업데이트
- `/evaluate` 완료 시 → 미해결 이슈 업데이트
- 매 세션 시작 시 → 진행률 동기화

### 템플릿 위치
`templates/CLAUDE.template.md`
