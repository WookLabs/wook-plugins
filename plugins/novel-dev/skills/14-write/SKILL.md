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
```

## Writer Mode

`meta/project.json`의 `writer_mode` 필드를 확인합니다:

| writer_mode | 동작 |
|-------------|------|
| `"claude"` | 모든 회차를 Claude novelist 에이전트로 작성 (기본값) |
| `"grok"` | **(deprecated)** 2-Pass 파이프라인으로 대체됨. `/write-2pass` 사용 권장 |
| `"hybrid"` | **(removed)** v6.0.0에서 제거됨. `/write-2pass` 또는 `/write-act-2pass` 사용 |

> **성인소설**: 2-Pass 파이프라인(`/write-2pass`, `/write-act-2pass`)을 사용하세요.
> Pass 1에서 Claude가 ADULT 마커와 함께 집필하고, Pass 2에서 `adult-rewriter.mjs`가 Grok API로 마커 구간을 대체합니다.

## 실행 흐름

### Phase 1: 준비

1. `meta/ralph-state.json` 읽어 현재 챕터 번호 확인 (인자 없으면)
2. `meta/project.json` 읽어 `writer_mode` 확인
3. `chapters/chapter_XXX.json` (플롯 파일) 존재 확인

### Phase 2: Claude 집필

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

### Phase 3: 사후 처리

**3-1. 요약 생성**

생성된 챕터를 읽고 summarizer를 호출:

```spec
Task(subagent_type="novel-dev:summarizer", model="haiku", prompt="
다음 챕터를 200-300자로 요약해주세요.
주요 사건, 캐릭터 감정 변화, 복선 진행을 포함하세요.

{chapter_content}
")
```

결과를 `context/summaries/chapter_XXX_summary.md`에 저장합니다.

**3-2. 상태 업데이트**

`meta/ralph-state.json` 업데이트:
- `current_chapter`: N + 1
- `completed_chapters`에 N 추가
- `last_checkpoint`: 현재 시각

**3-3. 품질 검토 (선택)**

사용자가 요청하면 또는 `/write-all` 루프 내에서:

```spec
Task(subagent_type="novel-dev:critic", model="sonnet", prompt="
Chapter {N} 평가:
{chapter_content}

플롯: {plot}
")
```

> **주의**: 2-Pass로 생성된 성인 콘텐츠를 Claude가 평가할 때,
> 성인 장면 자체가 아닌 서사 구조, 캐릭터 일관성, 플롯 정합성만 평가합니다.

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

> 2-Pass 모드에서도 Pass 1(Claude)이 이 우선순위에 따라 컨텍스트를 로드합니다.

## Documentation

**Detailed Guide**: See `references/detailed-guide.md`
**Usage Examples**: See `examples/example-usage.md`
