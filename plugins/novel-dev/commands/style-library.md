---
description: "스타일 라이브러리 - 문체 예시(exemplar) 관리"
---

# /style-library - 스타일 예시 라이브러리 관리

Few-shot 스타일 학습을 위한 예시 문장(exemplar) 라이브러리를 관리합니다.

## Usage

```
/style-library add                    # 새 예시 추가 (대화형)
/style-library add <텍스트>           # 텍스트로 예시 추가
/style-library list                   # 전체 목록
/style-library list romance           # 장르별 목록
/style-library search <장르> <씬유형> # 조건 검색
/style-library remove <id>            # 예시 삭제
/style-library stats                  # 라이브러리 통계
```

## Subcommands

### add - 새 예시 추가

새로운 문체 예시를 라이브러리에 추가합니다.

```
/style-library add
/style-library add "그녀의 손이 미세하게 떨렸다..."
```

**자동 분류**: 5차원 분류 체계로 자동 태깅 후 사용자 확인
- 장르 (genre)
- 씬 유형 (scene_type)
- 감정 톤 (emotional_tone)
- 시점 (pov)
- 페이싱 (pacing)

**요구사항**: 500-1500자 길이의 한국어 산문

### list - 예시 목록

라이브러리의 예시 목록을 조회합니다.

```
/style-library list                   # 전체 목록
/style-library list romance           # 로맨스 장르만
/style-library list --anti            # 안티 예시만
/style-library list --scene-type dialogue  # 대화 씬만
```

### search - 예시 검색

조건에 맞는 예시를 검색합니다. 점수순 정렬.

```
/style-library search romance dialogue
/style-library search fantasy action --pacing fast
/style-library search mystery emotional-peak --tone tension --limit 5
```

**옵션:**
- `--tone <tone>`: 감정 톤 필터
- `--pov <pov>`: 시점 필터
- `--pacing <pacing>`: 페이싱 필터
- `--limit <N>`: 반환 개수 (기본 3)
- `--no-anti`: 안티 예시 제외

### remove - 예시 삭제

```
/style-library remove exm_romance_001
```

연결된 안티 예시 페어가 있는 경우 경고 표시.

### stats - 통계

라이브러리 현황과 커버리지 통계를 확인합니다.

```
/style-library stats
```

**출력 정보:**
- 총 예시 수 (좋은 예시 / 안티 예시)
- 장르별, 씬 유형별 분포
- 커버리지 갭 (부족한 영역)
- 개선 제안

## Process

1. style-curator 에이전트 호출
2. 프로젝트 `meta/style-library.json` 로드
3. 요청된 작업 수행
4. 변경사항 저장 (add/remove 시)
5. 결과 출력

## Related

- **에이전트**: `agents/style-curator.md`
- **스킬**: `skills/style-library/SKILL.md`
- **스키마**: `schemas/style-library.schema.json`
- **기본 예시**: `templates/style-library/default-exemplars.json`

## Examples

### 예시 1: 대화 예시 검색 및 확인

```
/style-library search romance dialogue --tone warmth

결과:
1. exm_romance_003 (35점)
   "눈을 마주친 순간, 그녀가 작게 미소 지었다..."
   Tags: romance, dialogue, warmth

2. exm_romance_007 (30점)
   "커피잔을 내려놓으며 그가 말했다..."
   Tags: romance, dialogue, warmth

Anti-Exemplar:
   exm_romance_103
   "그녀는 행복했다. 그는 말했다. 한편 그녀도..."
   ⚠ 감정 직접 서술, 단조로운 구조
```

### 예시 2: 안티 예시 페어 추가

```
/style-library add --anti

[나쁜 예시 입력]

자동 분석:
- 문제점: '한편' 과다 사용, tell-don't-show
- 장르: romance
- 씬 유형: emotional-peak

좋은 버전을 입력하시겠습니까? (y/n)

[좋은 버전 입력]

✓ Anti-Exemplar Pair Created:
- Good: exm_romance_015
- Anti: exm_romance_115 (linked to exm_romance_015)
```

### 예시 3: 커버리지 확인

```
/style-library stats

Style Library Status
────────────────────
Total: 14 exemplars (10 good, 4 anti)

By Genre:
  romance: 6  ████████
  fantasy: 4  █████
  mystery: 2  ██
  daily-life: 2  ██

By Scene Type:
  dialogue: 5  ██████
  emotional-peak: 4  █████
  action: 3  ███
  transition: 2  ██

Coverage Gaps:
  ⚠ Missing genres: horror, sf, martial-arts, historical, sports
  ⚠ Missing scene types: opening-hook, description, climax, denouement

Recommendations:
  - Add opening-hook exemplars (critical for chapter starts)
  - Add fantasy action scenes (common genre need)
```
