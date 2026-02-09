---
name: write-grok-batch
description: Grok API로 여러 챕터를 병렬 배치 집필
user-invocable: true
---

# /write-grok-batch - 병렬 배치 집필

$ARGUMENTS

지정 범위의 챕터를 N개 병렬 배치로 동시 생성합니다.
플롯 기반 깨끗한 컨텍스트로 초안을 빠르게 뽑는 용도입니다.

## Quick Start

```bash
/write-grok-batch 1-15            # 1~15화를 3개 배치로 병렬 집필
/write-grok-batch 1-50 --parallel 5  # 5개 배치로 병렬 집필
```

## Prerequisites

`~/.env` 파일에 API 키 설정:
```
XAI_API_KEY=xai-xxxxxxxxxxxx
```

API 키는 https://console.x.ai 에서 발급받을 수 있습니다.

## 실행 흐름

1. **인자 파싱**: `$ARGUMENTS`에서 범위(start-end)와 옵션 추출
2. **플롯 파일 존재 확인**: `chapters/chapter_XXX.json` 검증
3. **grok-batch-writer.mjs 호출**:

```bash
node novel-dev/scripts/grok-batch-writer.mjs \
  --start {start} --end {end} \
  --project {소설 프로젝트 경로} \
  --parallel {N}
```

4. **결과 확인**: 생성된 챕터 수, 총 토큰, 소요 시간
5. **사후 처리 안내**:
   - 요약 생성: 각 챕터에 대해 summarizer 호출
   - 연결성 검토: `/consistency-check` 실행 권장
   - 퇴고: `/revise`로 챕터 간 이음새 다듬기

## 인자 파싱 규칙

- `N-M` 형식: start=N, end=M (예: `1-15`)
- `--parallel N`: 병렬 배치 수 (기본 3)
- `--model MODEL`: Grok 모델 지정
- `--max-tokens N`: 최대 토큰 (기본 30000)
- `--temperature N`: Temperature (기본 0.85)

## /write-grok-act과의 차이

| 항목 | /write-grok-act | /write-grok-batch |
|------|----------------|-------------------|
| 실행 방식 | 순차 (1화씩) | 병렬 (N개 배치) |
| 컨텍스트 | 이전 요약 포함 | 플롯만 참고 (깨끗한 컨텍스트) |
| 용도 | 연결성 중시 최종본 | 빠른 초안 생성 |
| 속도 | 느림 (순차 API) | 빠름 (병렬 API) |
| 사후 처리 | 자동 (검증+퇴고) | 수동 (사용자가 별도 실행) |

## 주의사항

- 배치 모드는 **초안용**입니다. 챕터 간 연결성이 약할 수 있습니다.
- 생성 후 반드시 `/consistency-check`과 `/revise`를 실행하세요.
- rate limit 방지를 위해 배치 내에서는 순차 실행됩니다.
- 플롯 파일이 없는 회차는 자동으로 건너뜁니다.

## Error Handling

### API 키 없음
```
[ERROR] XAI_API_KEY를 찾을 수 없습니다.
→ ~/.env 파일에 XAI_API_KEY=xai-xxx 추가
```

### 플롯 파일 없음
```
[WARNING] 플롯 파일이 없는 회차: 3, 7, 12
→ /gen-plot으로 플롯을 먼저 생성하세요
```

### 범위 오류
```
[ERROR] --start가 --end보다 클 수 없습니다.
→ 올바른 범위를 지정하세요 (예: --start 1 --end 15)
```
