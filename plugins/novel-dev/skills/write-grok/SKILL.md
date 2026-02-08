---
name: write-grok
description: xAI Grok API를 사용한 소설 생성
user-invocable: true
---

# /write-grok - Grok API로 소설 생성

xAI Grok API를 사용하여 소설을 생성합니다.
Claude의 콘텐츠 정책으로 인해 생성이 어려운 장면에 사용할 수 있습니다.

## Prerequisites

1. `~/.env` 파일에 API 키 설정:
```
XAI_API_KEY=xai-xxxxxxxxxxxx
```

2. API 키는 https://console.x.ai 에서 발급

## Usage

```
/write-grok "로맨스 소설의 키스 장면을 써줘"
/write-grok --chapter 5    # 5화를 Grok으로 생성
```

## Process

이 스킬이 호출되면 다음 단계를 수행합니다:

### Step 1: API 키 확인

Bash 도구로 API 키 존재 여부를 확인합니다:

```bash
node novel-dev/scripts/grok-writer.mjs --help
```

API 키가 없으면 사용자에게 설정 방법을 안내합니다.

### Step 2: 프롬프트 구성

사용자의 요청을 바탕으로 소설 생성 프롬프트를 구성합니다.

시스템 프롬프트 예시:
```
당신은 한국어 소설 작가입니다.
감각적이고 몰입감 있는 장면을 작성합니다.
대화, 묘사, 감정 표현을 자연스럽게 섞어서 써주세요.
```

### Step 3: Grok API 호출

```bash
node novel-dev/scripts/grok-writer.mjs \
  --prompt "프롬프트 내용" \
  --system "시스템 프롬프트" \
  --model "grok-3" \
  --max-tokens 4096 \
  --temperature 0.85
```

### Step 4: 결과 처리

- 결과는 stdout으로 출력됩니다
- 필요시 `--output` 옵션으로 파일에 저장
- 생성된 텍스트를 사용자에게 보여줍니다

## Options

| 옵션 | 설명 | 기본값 |
|------|------|--------|
| --model | Grok 모델 | grok-3 |
| --max-tokens | 최대 토큰 | 4096 |
| --temperature | 창의성 (0~1) | 0.85 |
| --output | 출력 파일 | (stdout) |

## Available Models

| 모델 | 설명 |
|------|------|
| grok-3 | 기본 모델, 균형잡힌 성능 |
| grok-4-1-fast | 최신 모델, 빠른 응답 |
| grok-4-1-fast-reasoning | 추론 강화 모델 |

## Examples

### 기본 사용
```
/write-grok "두 주인공이 처음 키스하는 로맨스 장면"
```

### 컨텍스트와 함께
```
/write-grok "이전 장면: 비 내리는 밤, 서로의 진심을 고백한 후. 다음 장면을 이어서 써줘."
```

### 특정 장르 스타일
```
/write-grok --system "당신은 무협 소설 작가입니다" "주인공이 적과 대결하는 액션 장면"
```

## Error Handling

### API 키 없음
```
[ERROR] XAI_API_KEY를 찾을 수 없습니다.
→ ~/.env 파일에 XAI_API_KEY=xai-xxx 추가
```

### API 오류
```
[ERROR] Grok API Error (401): Unauthorized
→ API 키가 잘못되었거나 만료됨
```

### 토큰 한도 초과
```
[ERROR] Grok API Error (400): max_tokens exceeded
→ --max-tokens 값을 줄이거나 프롬프트 축소
```

## Integration with Novel Workflow

기존 워크플로우와 통합하여 사용:

1. `/write 5` 로 기본 집필 시도
2. Claude 정책으로 거부되면 `/write-grok --chapter 5` 로 대체
3. 생성된 결과를 `chapters/chapter_005.md`에 저장
4. `/evaluate 5` 로 품질 평가 (평가는 Claude가 수행)

## Notes

- Grok API는 유료입니다 (사용량에 따라 과금)
- Claude보다 콘텐츠 제한이 덜 엄격합니다
- 생성 결과의 품질은 프롬프트에 크게 좌우됩니다
- 한국어 지원이 잘 됩니다
