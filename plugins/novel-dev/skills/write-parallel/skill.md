---
name: write-parallel
description: "Use this skill when writing with Claude-Codex parallel pipeline (both write independently, then merge best parts). Triggers on: '병렬', 'parallel', '협업 집필'."
user-invocable: true
---

# /write-parallel - Claude-Codex 병렬 협업 집필

$ARGUMENTS

Claude 캐릭터 협업팀과 Codex(GPT-5.4)가 **동시에** 같은 챕터를 독립 집필하고, chapter-merger가 양쪽의 최선을 선택/병합합니다.

## Quick Start

```bash
/write-parallel 5              # 5화를 병렬 생성 → 최선 병합
/write-parallel 5 --pick       # 병합 없이 더 나은 버전만 선택
/write-parallel 5 --2pass      # 병합 후 Grok 성인 리라이트 포함
```

## Prerequisites

- Codex CLI 설치: `npm install -g @openai/codex`
- `~/.env`에 `XAI_API_KEY` (Grok 2-pass 사용 시)

## 파이프라인

```
┌─────────────┐     ┌─────────────┐
│ Claude Team  │     │  Codex CLI  │  ← 병렬 실행
│ (narrator+   │     │ (codex-     │
│  characters) │     │  writer.mjs)│
└──────┬──────┘     └──────┬──────┘
       ▼                    ▼
 ch_XXX_claude.md     ch_XXX_codex.md
       │                    │
       └────────┬───────────┘
                ▼
       ┌─────────────┐
       │  Merger      │  ← 씬별 비교 + 최선 선택/병합
       │ (Claude Opus)│
       └──────┬──────┘
              ▼
       chapters/chapter_XXX.md
              │
       (Grok adult rewrite if --2pass)
       (Proofreader + Summarizer)
```

## 실행 단계

### Phase 1: 병렬 집필

**Claude 브랜치** (기본 writing-team-collab 동일):
```spec
Task(subagent_type="novel-dev:team-orchestrator", model="sonnet", prompt="
팀 실행: writing-team-collab
대상: Chapter {chapterNumber}
프로젝트: {projectPath}
출력: chapters/chapter_{pad(N,3)}_claude.md
")
```

**Codex 브랜치** (동시 실행):
```spec
Bash("node scripts/codex-writer.mjs --chapter {N} --project {projectPath} --mode write")
# 출력을 chapters/chapter_{pad(N,3)}_codex.md로 이동
```

### Phase 2: 비교 + 병합

chapter-merger 에이전트가 두 버전을 읽고:
1. 씬별 품질 비교 (감각밀도, 필터워드, 캐릭터보이스, 복문비율, 플롯충실도)
2. 전략 결정 (PICK / SCENE-SELECT / MERGE)
3. 최종 챕터 생성 → `chapters/chapter_{pad(N,3)}.md`
4. 병합 리포트 → `reviews/merge_ch{N}.json`

`--pick` 플래그: MERGE 없이 PICK 전략만 사용 (더 빠름)

### Phase 3: 사후 처리

- `--2pass`: Grok adult-rewriter로 ADULT 마커 리라이트
- 요약 생성 → `context/summaries/chapter_{pad(N,3)}_summary.md`
- 상태 업데이트 → `meta/ralph-state.json`

## 병합 전략

| 전략 | 조건 | 동작 |
|------|------|------|
| PICK | 한쪽이 전 씬 우위 | 해당 버전 선택 (미세 조정만) |
| SCENE-SELECT | 씬별 우열 다름 | 씬마다 더 나은 버전 선택 + 톤 연결 |
| MERGE | 서술≠대사 강점 분리 | Codex 서술 + Claude 대사/감정 결합 |

## 비용

- Claude 팀 + Codex CLI = **약 2배** (단독 집필 대비)
- Merger (Claude Opus) 추가 비용
- 품질 최대화가 목적. 비용 절감이 목적이면 `/write` 또는 `/write --codex` 사용.

## Error Handling

- Codex CLI 미설치/실패 → Claude 버전만으로 진행 (병합 생략)
- Claude 팀 실패 → Codex 버전만으로 진행
- 양쪽 모두 실패 → 오류 보고
