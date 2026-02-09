---
name: 14-write
description: 특정 회차 챕터 집필
user-invocable: true
---

# /write - 소설 챕터 작성

현재 진행 중인 챕터를 작성합니다.

## Quick Start
```bash
/write           # 다음 챕터 작성
/write 5         # 5화 작성
/write 5-10      # 5~10화 연속 작성
/write 5 --grok  # Grok API로 강제 작성
```

## Writer Mode 결정

`meta/project.json`의 `writer_mode` 필드를 확인합니다:

| writer_mode | 동작 |
|-------------|------|
| `"grok"` | 모든 회차를 Grok API로 작성 |
| `"hybrid"` | ~~(deprecated)~~ 성인 키워드 감지 시 Grok, 그 외 novelist. **성인소설은 `"grok"` 권장** |
| `"claude"` | 모든 회차를 novelist 에이전트로 작성 |

`--grok` 플래그 사용 시 writer_mode 무시하고 Grok으로 작성합니다.

## 실행 흐름

### Phase 1: 준비

1. `meta/ralph-state.json` 읽어 현재 챕터 번호 확인 (인자 없으면)
2. `meta/project.json` 읽어 `writer_mode` 확인
3. `chapters/chapter_XXX.json` (플롯 파일) 존재 확인

### Phase 2: Grok 경로 (writer_mode = "grok" 또는 --grok)

다음 단계를 **순서대로** 수행합니다:

**2-1. 컨텍스트 조립**

Bash 도구로 assemble-grok-prompt.mjs 실행:

```bash
node novel-dev/scripts/assemble-grok-prompt.mjs \
  --chapter {N} \
  --project {소설 프로젝트 경로}
```

stdout으로 JSON이 출력됩니다:
```json
{
  "system": "시스템 프롬프트",
  "prompt": "유저 프롬프트 (컨텍스트 포함)",
  "outputPath": "chapters/chapter_005.md",
  "chapter": 5,
  "contextStats": { "hasStyleGuide": true, "hasPlot": true, "..." : "..." }
}
```

**2-2. 프롬프트 파일 저장**

조립된 JSON에서 `system`과 `prompt`를 각각 임시 파일로 저장:
- `/tmp/grok_system_{N}.txt` <- system 내용
- `/tmp/grok_prompt_{N}.txt` <- prompt 내용

**2-3. Grok API 호출**

```bash
node novel-dev/scripts/grok-writer.mjs \
  --system-file /tmp/grok_system_{N}.txt \
  --prompt-file /tmp/grok_prompt_{N}.txt \
  --model "{project.grok_config.model}" \
  --max-tokens {project.grok_config.max_tokens} \
  --temperature {project.grok_config.temperature} \
  --output {outputPath}
```

**2-4. 결과 확인**

생성된 `chapters/chapter_XXX.md` 파일을 읽어 내용과 분량을 확인합니다.
분량이 3000자 미만이면 사용자에게 재생성 여부를 묻습니다.

### Phase 3: Claude 경로 (writer_mode = "claude")

기존 방식대로 novelist 에이전트 호출:

```spec
Task(subagent_type="novel-dev:novelist", model="opus", prompt="
# 회차 집필: {chapterNumber}

## 플롯
{currentPlot}

## 이전 회차 요약
{previousSummaries}

## 캐릭터
{characterProfiles}

## 세계관
{worldInfo}

## 문체 가이드
{styleGuide}

위 정보를 바탕으로 Chapter {chapterNumber}를 작성해주세요.
목표 분량: {targetWords}자
")
```

### Phase 4: 사후 처리 (Grok/Claude 공통)

**4-1. 요약 생성**

생성된 챕터를 읽고 summarizer를 호출:

```spec
Task(subagent_type="novel-dev:summarizer", model="haiku", prompt="
다음 챕터를 200-300자로 요약해주세요.
주요 사건, 캐릭터 감정 변화, 복선 진행을 포함하세요.

{chapter_content}
")
```

결과를 `context/summaries/chapter_XXX_summary.md`에 저장합니다.

**4-2. 상태 업데이트**

`meta/ralph-state.json` 업데이트:
- `current_chapter`: N + 1
- `completed_chapters`에 N 추가
- `last_checkpoint`: 현재 시각

**4-3. 품질 검토 (선택)**

사용자가 요청하면 또는 `/write-all` 루프 내에서:

```spec
Task(subagent_type="novel-dev:critic", model="sonnet", prompt="
Chapter {N} 평가:
{chapter_content}

플롯: {plot}
")
```

> **주의**: Grok이 생성한 성인 콘텐츠를 Claude가 평가할 때,
> 성인 장면 자체가 아닌 서사 구조, 캐릭터 일관성, 플롯 정합성만 평가합니다.

## Hybrid 모드: 성인 키워드 자동 감지 (Deprecated)

> **Deprecated**: hybrid 모드는 챕터 단위 라우팅만 지원하며 씬 단위 전환이 불가합니다.
> 성인소설은 `writer_mode: "grok"`으로 통일을 권장합니다.

Korean: 야한, 19금, 베드신, 관능, 정사, 밀애, 섹시, 에로, R-18, NC-17, 수위
English: nsfw, explicit, adult, erotic, intimate scene, love scene, 18+

검색 대상: 플롯 파일(`chapters/chapter_XXX.json`), 씬 설명, 캐릭터 상호작용 태그

## Context Budget System

120K 토큰 예산 내에서 우선순위별 컨텍스트 로드:

| 우선순위 | 컨텍스트 | 토큰 | 출처 |
|----------|----------|------|------|
| 1 (필수) | 문체 가이드 | 10K | `meta/style-guide.json` |
| 2 (필수) | 현재 회차 플롯 | 15K | `chapters/chapter_XXX.json` |
| 3 (높음) | 이전 3화 요약 | 20K | `context/summaries/` |
| 4 (높음) | 캐릭터 프로필 | 25K | `characters/*.json` |
| 5 (중간) | 세계관/설정 | 15K | `world/world.json` |
| 6 (중간) | 막 컨텍스트 | 10K | `plot/structure.json` |
| 7 (낮음) | 이전 회차 전문 | 15K | 마지막 회차 |
| 8 (시스템) | 응답 예약 | 10K | 버퍼 |

> Grok 경로에서는 `assemble-grok-prompt.mjs`가 이 우선순위를 자동 적용합니다.

## Documentation

**Detailed Guide**: See `references/detailed-guide.md`
**Usage Examples**: See `examples/example-usage.md`
