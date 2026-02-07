---
name: style-library
description: |
  스타일 예시 문장(exemplar) 라이브러리 관리 스킬. Few-shot 스타일 학습을 위한 예시 문장을 추가, 검색, 관리합니다.
  <example>스타일 예시 추가해줘</example>
  <example>로맨스 대화 예시 찾아줘</example>
  <example>안티 예시 만들어줘</example>
  <example>/style-library add</example>
  <example>/style-library search romance dialogue</example>
  <example>/style-library stats</example>
user-invocable: true
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - AskUserQuestion
---

# Style Library Skill

Few-shot 스타일 학습을 위한 예시 문장(exemplar) 라이브러리를 관리하는 스킬입니다.

## 개요

스타일 라이브러리는 AI 소설 작성 시 참조할 고품질 문체 예시를 저장합니다. 각 예시는 5차원 분류 체계(장르, 씬 유형, 감정 톤, 시점, 페이싱)로 태그되어 있어 상황에 맞는 예시를 검색할 수 있습니다.

## Actions

### add - 새 예시 추가

새로운 문체 예시를 라이브러리에 추가합니다.

**사용법:**
```
/style-library add
/style-library add <텍스트>
```

**프로세스:**
1. 텍스트 입력 (직접 입력 또는 프롬프트)
2. 길이 검증 (500-1500자)
3. 자동 분류 제안
4. 사용자 확인 및 수정
5. 저장

**에이전트:** style-curator

### list - 예시 목록

라이브러리의 예시 목록을 조회합니다.

**사용법:**
```
/style-library list
/style-library list romance
/style-library list --scene-type dialogue
```

**옵션:**
- `[genre]`: 특정 장르 필터
- `--scene-type <type>`: 씬 유형 필터
- `--anti`: 안티 예시만 표시

**에이전트:** style-curator

### search - 예시 검색

조건에 맞는 예시를 검색하고 점수순으로 정렬합니다.

**사용법:**
```
/style-library search romance dialogue
/style-library search <장르> <씬유형> [옵션]
```

**옵션:**
- `--tone <tone>`: 감정 톤 필터
- `--pov <pov>`: 시점 필터
- `--pacing <pacing>`: 페이싱 필터
- `--limit <N>`: 반환 개수 (기본: 3)
- `--no-anti`: 안티 예시 제외

**에이전트:** style-curator

### remove - 예시 삭제

라이브러리에서 예시를 삭제합니다.

**사용법:**
```
/style-library remove exm_romance_001
```

**주의:** 안티 예시 페어 연결이 있는 경우 경고가 표시됩니다.

**에이전트:** style-curator

### import - 대량 가져오기

텍스트 파일에서 여러 예시를 한 번에 가져옵니다.

**사용법:**
```
/style-library import <파일경로>
```

**파일 형식:**
```
---
genre: romance
scene_type: dialogue
---
예시 텍스트 내용...

---
genre: fantasy
scene_type: action
---
또 다른 예시 텍스트...
```

**에이전트:** style-curator

### stats - 통계 확인

라이브러리 현황과 커버리지 통계를 확인합니다.

**사용법:**
```
/style-library stats
```

**출력 정보:**
- 총 예시 수 (좋은 예시 / 안티 예시)
- 장르별 분포
- 씬 유형별 분포
- 커버리지 갭 (부족한 영역)
- 개선 제안

**에이전트:** style-curator

## 분류 체계

### 5차원 분류

| 차원 | 값 | 설명 |
|------|-----|------|
| genre | romance, fantasy, horror, sf, martial-arts, historical, sports, daily-life, mystery | 장르 (복수 태그 가능) |
| scene_type | opening-hook, dialogue, action, emotional-peak, transition, description, climax, denouement | 씬 유형 (단일) |
| emotional_tone | tension, warmth, sorrow, humor, awe, dread, excitement, serenity | 감정 톤 (복수 태그 가능) |
| pov | first-person, third-limited, third-omniscient | 시점 (단일) |
| pacing | fast, medium, slow | 페이싱 (단일) |

### 스코어링 가중치

검색 시 다음 가중치로 점수 계산:
- 장르 일치: +10점 (일치하는 장르당)
- 씬 유형 일치: +20점
- 감정 톤 일치: +5점 (일치하는 톤당)
- 시점 일치: +8점
- 페이싱 일치: +5점

## 데이터 저장

### 위치
- 프로젝트: `{project}/meta/style-library.json`
- 기본 템플릿: `templates/style-library/default-exemplars.json`

### 스키마
- `schemas/style-library.schema.json`
- exemplar ID 형식: `exm_{genre}_{NNN}`
- 내용 길이: 500-2000자 (권장 500-1500자)

## 관련 파일

- **에이전트**: `agents/style-curator.md`
- **스키마**: `schemas/style-library.schema.json`
- **타입**: `src/style-library/types.ts`
- **스토리지**: `src/style-library/storage.ts`
- **검색**: `src/style-library/retrieval.ts`
- **분류기**: `src/style-library/classifier.ts`

## 예시 시나리오

### 시나리오 1: 로맨스 대화 예시 추가

```
사용자: /style-library add

style-curator: 추가할 예시 텍스트를 입력해주세요. (500-1500자)

사용자: [로맨스 대화 텍스트 붙여넣기]

style-curator:
분석 결과:
- 장르: romance
- 씬 유형: dialogue
- 감정 톤: warmth, tension
- 시점: third-limited
- 페이싱: medium

이 분류가 맞습니까? 수정이 필요하면 말씀해주세요.

사용자: 네, 맞아요

style-curator:
✓ Exemplar Added: exm_romance_001
[상세 정보 출력]
```

### 시나리오 2: 씬에 맞는 예시 검색

```
사용자: /style-library search fantasy action --pacing fast --limit 2

style-curator:
검색 결과 (2개):

1. exm_fantasy_003 (점수: 35)
   "검기가 허공을 갈랐다. 순간, 그의 몸이..."
   Tags: fantasy, action, fast

2. exm_fantasy_007 (점수: 30)
   "마력이 폭발하며 주변이 뒤흔들렸다..."
   Tags: fantasy, action, medium

Anti-Exemplar:
   exm_fantasy_101 (점수: 25)
   "그는 검을 휘둘렀다. 한편 적도 검을 휘둘렀다..."
   ⚠ 단조로운 문장 구조, 긴장감 부재
```

### 시나리오 3: 안티 예시 페어 생성

```
사용자: 이 문장이 왜 안 좋은지 안티 예시로 등록하고 싶어

style-curator:
안티 예시로 등록하겠습니다. 좋은 버전의 예시도 함께 만드시겠습니까?

사용자: 네

style-curator:
[안티 예시 분석 후]
이 텍스트의 문제점:
1. '한편' 과다 사용
2. Tell-don't-show (직접 감정 서술)
3. 문장 구조 반복

좋은 버전을 작성해주시면 페어로 연결하겠습니다.

사용자: [개선된 버전 입력]

style-curator:
✓ Anti-Exemplar Pair Created:
- Good: exm_romance_005
- Anti: exm_romance_105 (linked)
```
