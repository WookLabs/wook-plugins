---
name: write-grok
description: xAI Grok API를 사용한 소설 생성
user-invocable: true
---

# /write-grok - Grok API로 챕터 집필

xAI Grok API를 사용하여 소설 챕터를 생성합니다.
프로젝트 컨텍스트(문체, 캐릭터, 플롯, 이전 요약)를 자동으로 조립합니다.

## Prerequisites

`~/.env` 파일에 API 키 설정:
```
XAI_API_KEY=xai-xxxxxxxxxxxx
```

API 키는 https://console.x.ai 에서 발급받을 수 있습니다.

## Usage

```bash
/write-grok 5          # 5화를 Grok으로 생성 (컨텍스트 자동 조립)
/write-grok "프롬프트"  # 직접 프롬프트로 생성 (레거시 모드)
```

## 실행 흐름

### 챕터 번호 지정 시 (권장)

`/write --grok`과 동일한 파이프라인을 실행합니다:

**Step 1. 컨텍스트 조립**

```bash
node novel-dev/scripts/assemble-grok-prompt.mjs \
  --chapter {N} \
  --project {소설 프로젝트 경로}
```

stdout JSON에서 `system`, `prompt`, `outputPath` 추출.

**Step 2. 프롬프트 파일 저장**

- `/tmp/grok_system_{N}.txt` ← system
- `/tmp/grok_prompt_{N}.txt` ← prompt

**Step 3. Grok API 호출**

```bash
node novel-dev/scripts/grok-writer.mjs \
  --system-file /tmp/grok_system_{N}.txt \
  --prompt-file /tmp/grok_prompt_{N}.txt \
  --model "grok-4-1-fast-reasoning" \
  --max-tokens 8192 \
  --temperature 0.85 \
  --output {outputPath}
```

**Step 4. 사후 처리**

- 생성된 챕터 내용과 분량 확인
- `context/summaries/chapter_XXX_summary.md` 요약 생성 (summarizer 호출)
- `meta/ralph-state.json` 상태 업데이트
- 사용자에게 결과 보고

### 직접 프롬프트 시 (레거시)

```bash
node novel-dev/scripts/grok-writer.mjs \
  --prompt "{사용자 프롬프트}" \
  --model "grok-4-1-fast-reasoning" \
  --max-tokens 8192 \
  --temperature 0.85
```

컨텍스트 자동 조립 없이 직접 프롬프트만 전달됩니다.
결과는 stdout으로 출력되며 사후 처리 없음.

## Grok 모델

| 모델 | 설명 |
|------|------|
| grok-4-1-fast-reasoning | 추론 강화 모델 **(기본값, 권장)** |
| grok-4-1-fast | 최신 모델, 빠른 응답 |
| grok-3 | 레거시 모델 |

## 프로젝트 전체 Grok 모드

성인소설 프로젝트에서 매번 `--grok`을 붙이지 않으려면:

`meta/project.json`에 설정:
```json
{
  "writer_mode": "grok",
  "grok_config": {
    "model": "grok-4-1-fast-reasoning",
    "temperature": 0.85,
    "max_tokens": 8192
  }
}
```

이후 `/write 5`만으로 자동으로 Grok이 사용됩니다.

## 품질 검증

> **주의**: Grok이 생성한 콘텐츠도 Claude가 품질 검증을 수행합니다.
> 성인 장면 자체가 아닌 **서사 구조, 캐릭터 일관성, 플롯 정합성**만 평가합니다.

검증 에이전트: critic, beta-reader, genre-validator (모두 Claude)

## Hybrid 모드 키워드 (Deprecated)

> **Deprecated**: hybrid 모드 대신 `writer_mode: "grok"` 사용을 권장합니다.

`writer_mode: "hybrid"` 시 아래 키워드가 플롯에 포함되면 자동으로 Grok 전환:

- **Korean**: 야한, 19금, 베드신, 관능, 정사, 밀애, 섹시, 에로, R-18, NC-17, 수위
- **English**: nsfw, explicit, adult, erotic, intimate scene, love scene, 18+

검색 대상: 플롯 파일(`chapters/chapter_XXX.json`), 씬 설명, 캐릭터 상호작용 태그

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

### 컨텍스트 조립 실패
```
[ERROR] 프로젝트 경로를 찾을 수 없습니다.
→ --project 경로 확인 또는 소설 프로젝트 디렉토리에서 실행
```

## Documentation

**Detailed Guide**: See `references/detailed-guide.md`
**Usage Examples**: See `examples/example-usage.md`
