# 장르별 레시피 시스템

소설 초기화 시 장르에 맞는 기본값과 필수 요소를 정의합니다.

## 사용법

```bash
/init "아이디어" --genre=romance
/init "아이디어" --recipe=romance-contract
```

## 레시피 구조

각 레시피는 다음을 정의합니다:
- 기본 설정값 (화수, 글자수, 구조)
- 필수 트로프
- 필수 감정 비트
- 장르 특화 검증 규칙
- 추천 클리셰와 회피 클리셰

## 레시피 목록

| 레시피 | 장르 | 설명 |
|--------|------|------|
| romance.json | 로맨스 | 현대 로맨스 기본 |
| romance-contract.json | 로맨스 | 계약 연애물 |
| romance-ceo.json | 로맨스 | 재벌/CEO물 |
| fantasy.json | 판타지 | 이세계 판타지 기본 |
| fantasy-regression.json | 판타지 | 회귀물 |
| fantasy-hunter.json | 판타지 | 헌터물/던전물 |
| bl.json | BL | BL 기본 |
| thriller.json | 스릴러 | 스릴러/미스터리 |

## 레시피 스키마

### 기본 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `recipe_id` | string | 고유 식별자 |
| `recipe_name` | string | 표시 이름 |
| `extends` | string | 상속할 부모 레시피 |
| `genre` | string[] | 주 장르 |
| `sub_genre` | string[] | 세부 장르 |

### defaults (기본값)

| 필드 | 타입 | 설명 |
|------|------|------|
| `target_chapters` | number | 목표 화수 |
| `target_words_per_chapter` | number | 화당 목표 글자수 |
| `rating` | string | 연령 등급 (전체/15+/19+) |
| `structure_type` | string | 구조 유형 (3막/5막) |

### style_guide (스타일 가이드)

| 필드 | 타입 | 설명 |
|------|------|------|
| `narrative_voice` | string | 시점 (1인칭/3인칭 제한) |
| `pov_type` | string | POV 유형 (single/dual/multiple) |
| `tone` | string[] | 톤 키워드 |
| `dialogue_ratio` | object | 대사 비율 범위 |

### required_tropes (필수 트로프)

장르에서 반드시 포함해야 할 트로프 목록

### required_beats (필수 감정 비트)

| 필드 | 타입 | 설명 |
|------|------|------|
| `frequency` | string | 빈도 (1-2/chapter, 5ch_gap 등) |
| `description` | string | 비트 설명 |

### validation_rules (검증 규칙)

| 필드 | 타입 | 설명 |
|------|------|------|
| `critic_threshold` | number | 평론가 최소 점수 |
| `beta_reader_threshold` | number | 베타 리더 최소 점수 |
| `genre_validator_threshold` | number | 장르 검증 최소 점수 |

## 레시피 상속

`extends` 필드를 사용하여 부모 레시피를 상속할 수 있습니다:

```json
{
  "recipe_id": "romance-contract",
  "extends": "romance",
  "required_tropes": ["계약", "가짜 연인", ...]
}
```

상속 시 부모의 모든 설정을 받고, 자식에서 정의한 필드로 덮어씁니다.
배열 필드는 병합되지 않고 완전히 교체됩니다.

## 커스텀 레시피 생성

1. 기존 레시피를 복사하거나 `extends`로 상속
2. 필요한 필드 수정
3. `templates/recipes/` 디렉토리에 저장
4. `/init --recipe=custom-recipe-id`로 사용
