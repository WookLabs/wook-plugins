---
name: write-3pass
description: "Use this skill when writing with 3-pass pipeline (Claude draft plus Grok full polish plus Grok adult rewrite). Triggers on: '3패스', '3-pass', 'write 3pass'."
user-invocable: true
---

# /write-3pass - 3-Pass 집필

$ARGUMENTS

Claude가 전체 챕터를 집필(Pass 1), Grok이 서술/묘사/전환을 문학적으로 폴리시(Pass 2), Grok이 성인 장면을 최대 수위로 리라이트(Pass 3)합니다.

## Quick Start

```bash
/write-3pass 5              # 5화를 3-Pass로 집필
/write-3pass 5 --solo       # 5화를 novelist 단독 + 3-Pass
/write-3pass 5 --codex      # 5화를 Codex(GPT-5.4) + 3-Pass
/write-3pass 5 --selective  # 5화를 2.5-Pass (POLISH 마커만 폴리시 + ADULT 리라이트)
```

## Prerequisites

`~/.env` 파일에 API 키 설정:
```
XAI_API_KEY=xai-xxxxxxxxxxxx
```

## 실행 단계

### Pass 1: Claude 집필

**기본 (캐릭터 협업):**
```spec
Task(subagent_type="novel-dev:team-orchestrator", model="sonnet", prompt="
팀 실행: writing-team-collab-2pass
대상: Chapter {chapterNumber}
프로젝트: {projectPath}
")
```

**--solo:** novelist 단독 집필
**--codex:** `node scripts/codex-writer.mjs --chapter {N} --project {projectPath} --mode write`

성인 장면은 `<!-- ADULT_N_START -->` / `<!-- ADULT_N_END -->` 마커로 감싸기.
저장: `chapters/chapter_XXX.md`

### Pass 2: Grok 전체 폴리시

```bash
node scripts/adult-rewriter.mjs \
  --input chapters/chapter_XXX.md \
  --project {projectPath} \
  --mode full \
  --output chapters/chapter_XXX.md
```

- 대화("큰따옴표" 안)는 한 글자도 수정 안 함
- 서술, 묘사, 전환만 문학적으로 향상
- 플롯/사건/캐릭터 행동 유지
- ADULT 마커는 이 단계에서 보존됨

> `--selective` 플래그 사용 시 Pass 2를 `--mode selective`로 대체합니다.
> 이 경우 `<!-- POLISH_N_START -->` 마커가 있는 구간만 폴리시됩니다.

### Pass 3: Grok 성인 장면 리라이트

```bash
node scripts/adult-rewriter.mjs \
  --input chapters/chapter_XXX.md \
  --project {projectPath} \
  --mode adult \
  --output chapters/chapter_XXX.md
```

- Pass 2에서 보존된 ADULT 마커 구간을 최대 수위로 리라이트
- 마커 태그 제거

> `--selective` 모드에서는 Pass 2에서 ADULT도 함께 처리되므로 Pass 3을 건너뜁니다.

### 사후 처리

- **요약 생성**: summarizer 에이전트 → `context/summaries/chapter_XXX_summary.md`
- **상태 업데이트**: `meta/ralph-state.json` 갱신

## 3-Pass vs 2-Pass 비교

| | 2-Pass | 3-Pass | 2.5-Pass (--selective) |
|---|---|---|---|
| Pass 1 | Claude 집필 | Claude 집필 | Claude 집필 |
| Pass 2 | Grok ADULT 리라이트 | **Grok 전체 폴리시** | Grok ADULT+POLISH 마커 |
| Pass 3 | - | Grok ADULT 리라이트 | - |
| 비용 | Grok 1회 | **Grok 2회** | Grok 1회 |
| 품질 | 서술은 Claude 수준 | **서술도 Grok 수준** | 선택적 Grok 수준 |

## ADULT 마커가 없는 경우

Pass 3에서 ADULT 마커가 없으면 건너뜁니다.
Pass 2 (full polish)는 마커 유무와 관계없이 항상 실행됩니다.

## Error Handling

### Pass 2 실패
```
→ Pass 1 원본이 보존됩니다. Pass 3으로 진행 (ADULT 마커가 있으면).
```

### Pass 3 실패
```
→ Pass 2 결과가 보존됩니다. .bak 백업으로 복구 가능.
```
