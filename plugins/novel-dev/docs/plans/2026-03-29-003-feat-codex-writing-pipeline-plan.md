---
title: "feat: Add --codex option for GPT-5.4 writing via Codex CLI"
type: feat
status: active
date: 2026-03-29
origin: docs/brainstorms/2026-03-29-codex-writing-pipeline-requirements.md
---

# feat: Codex CLI 집필 파이프라인 (--codex 옵션)

## Overview

`write-act-2pass --codex` 옵션을 추가하여 Pass 1 전체(narrator + characters + proofreader + summarizer)를 Codex CLI(GPT-5.4 xhigh)로 실행. Pass 2(Grok adult-rewriter)는 기존 그대로. 비용 절감이 핵심 동기.

## Problem Frame

Claude opus 기반 집필은 품질은 좋지만 대량 집필 시 비용 부담. Codex CLI를 통해 GPT-5.4로 대체하면 팀 구조(collab)를 유지하면서 비용 절감 가능. (see origin: docs/brainstorms/2026-03-29-codex-writing-pipeline-requirements.md)

## Requirements Trace

- R1. `write-act-2pass --codex` 옵션 추가
- R2. 기존 Claude 경로 변경 없음
- R3-R6. Pass 1 전체를 Codex CLI로, collab 팀 구조 유지
- R7. OPENAI_API_KEY 환경변수
- R8. Pass 2(Grok) 변경 없음
- R9-R10. 에러 처리

## Scope Boundaries

- `/write` (단건)에는 미적용, act 단위만
- Codex CLI 설치는 사용자 책임
- 모델 고정 (GPT-5.4 xhigh)

## Context & Research

### Relevant Code and Patterns

- `teams/writing-team-collab-2pass.team.json` — 기존 collab+2pass 팀 정의. `orchestrator_action` 패턴으로 adult-rewriter 실행
- `agents/team-orchestrator.md` — `resolveModel()` 함수로 모델 결정. `orchestrator_action` 스텝 처리 로직 존재 (386행)
- `scripts/adult-rewriter.mjs` — 외부 API(Grok) 호출 스크립트의 선례. `--input`, `--chapter` 인자 패턴
- `skills/write-act-2pass/SKILL.md` — `$ARGUMENTS`로 `--solo` 옵션 처리하는 패턴
- `skills/write-2pass/SKILL.md` — `--solo` 플래그 처리 패턴

### Key Insight: Codex CLI의 collab 한계

Codex CLI는 단일 프롬프트→응답 모델. Claude Code의 SendMessage 기반 에이전트 간 실시간 통신(collab)을 직접 지원하지 않음. 따라서 collab을 "시뮬레이션"해야 함:
- narrator + character agents의 역할을 하나의 통합 프롬프트로 합치거나
- 순차 호출로 scene cycle을 시뮬레이션

## Key Technical Decisions

- **Codex 호출 방식**: 새 스크립트 `scripts/codex-writer.mjs` 생성 — adult-rewriter.mjs 패턴을 따르되, Codex CLI를 child process로 실행. team-orchestrator의 `orchestrator_action` 스텝으로 호출
- **collab 시뮬레이션**: 통합 프롬프트 방식 — narrator.md + 해당 씬의 character agent .md들을 하나의 시스템 프롬프트로 합쳐서 Codex에 전달. 실시간 통신은 포기하지만 캐릭터 보이스 정보는 유지
- **팀 정의**: `writing-team-codex-2pass.team.json` 신설 — 기존 collab-2pass와 유사하되 collab-write 스텝이 `orchestrator_action`(codex-writer) 타입
- **폴백**: Codex 실패 시 자동 폴백 없음 — 에러 메시지 + Claude 재시도 안내

## Open Questions

### Resolved During Planning

- **collab vs 통합 프롬프트**: Codex CLI가 SendMessage를 지원하지 않으므로 통합 프롬프트로 결정. 캐릭터 .md 파일의 핵심(voice profile, speech patterns)을 프롬프트에 포함
- **모델 라우팅**: team-orchestrator의 `resolveModel()`을 확장하지 않음 — codex-writer.mjs가 내부적으로 GPT-5.4 고정 호출

### Deferred to Implementation

- Codex CLI의 정확한 프롬프트 전달 방식 (--prompt, stdin, 파일 등) — 구현 시 `codex --help` 확인
- 통합 프롬프트의 정확한 토큰 한도 — GPT-5.4의 컨텍스트 윈도우에 따라 조정
- 씬별 순차 호출 vs 챕터 단위 일괄 호출 — 구현 시 품질 비교 후 결정

## High-Level Technical Design

> *Directional guidance for review, not implementation specification.*

```
write-act-2pass --codex 1
  │
  ▼
SKILL.md: --codex 감지 → writing-team-codex-2pass 팀 선택
  │
  ▼
team-orchestrator: 팀 정의 로드
  │
  ├─ Step 1 (orchestrator_action: codex-writer)
  │   │
  │   ▼
  │   codex-writer.mjs:
  │     1. narrator.md + characters/*.md 읽기
  │     2. 통합 시스템 프롬프트 생성
  │     3. plot/chapter_{N}.json + style-guide 컨텍스트 구성
  │     4. Codex CLI 실행 (GPT-5.4 xhigh)
  │     5. 결과를 chapters/chapter_{N}.md에 저장
  │
  ├─ Step 2 (orchestrator_action: adult-rewriter)  ← 기존 그대로
  │     ADULT 마커 감지 → Grok 리라이트
  │
  ├─ Step 3: proofreader (Claude haiku)  ← 기존 그대로
  │
  └─ Step 4: summarizer (Claude haiku)   ← 기존 그대로
```

**Note**: proofreader/summarizer는 haiku로 비용이 극소이므로 Claude 유지. Codex로 바꿀 필요 없음.

## Implementation Units

- [ ] **Unit 1: codex-writer.mjs 스크립트 생성**

**Goal:** Codex CLI를 통해 GPT-5.4로 챕터 집필하는 스크립트

**Requirements:** R3, R4, R5, R6, R7

**Dependencies:** None

**Files:**
- Create: `scripts/codex-writer.mjs`
- Test: `tests/scripts/codex-writer.test.ts`

**Approach:**
- adult-rewriter.mjs 패턴을 따름 (인자 파싱, 환경변수 체크, child process 실행, 에러 처리)
- 인자: `--chapter N --project {path} [--model gpt-5.4-xhigh]`
- 시스템 프롬프트 조립: narrator.md 본문 + 해당 씬 캐릭터 agents/*.md의 voice profile 섹션 + style-guide.json + prose_rules
- 유저 프롬프트: chapter_{N}.json (플롯) + 이전 요약 + ADULT 마커 지시
- Codex CLI 실행: `codex --model gpt-5.4-xhigh --system-prompt {file} --prompt {file}` (정확한 CLI 인터페이스는 구현 시 확인)
- 결과를 chapters/chapter_{N}.md에 저장

**Patterns to follow:**
- `scripts/adult-rewriter.mjs` — 인자 파싱, 환경변수 체크, Bash 실행, 에러 처리

**Test scenarios:**
- Happy path: OPENAI_API_KEY 존재 + Codex CLI 사용 가능 → 정상 실행
- Error path: OPENAI_API_KEY 미설정 → 명확한 에러 메시지
- Error path: Codex CLI 미설치 → "codex CLI를 설치하세요" 안내
- Error path: Codex 실행 실패 (비정상 종료) → 에러 메시지 + 원본 보존
- Edge case: chapter_{N}.json 미존재 → 에러

**Verification:** 스크립트가 `node scripts/codex-writer.mjs --help`로 사용법 출력

---

- [ ] **Unit 2: writing-team-codex-2pass.team.json 생성**

**Goal:** Codex 기반 2-pass 집필 팀 정의

**Requirements:** R3, R5, R8

**Dependencies:** Unit 1

**Files:**
- Create: `teams/writing-team-codex-2pass.team.json`

**Approach:**
- writing-team-collab-2pass.team.json 기반으로 생성
- Step 1(collab-write)을 `orchestrator_action: codex-writer`로 변경
- Step 2(adult-rewrite), Step 3(proofread), Step 4(summarize)는 동일
- proofreader/summarizer는 Claude haiku 유지 (비용 극소)

**Patterns to follow:**
- `teams/writing-team-collab-2pass.team.json` — 기존 2-pass 팀 구조

**Test scenarios:**
- Happy path: team.schema.json 검증 통과
- Happy path: 4개 스텝 순서 정확 (codex-write → adult-rewrite → proofread → summarize)

**Verification:** `npm run validate:schemas` 통과

---

- [ ] **Unit 3: write-act-2pass SKILL.md에 --codex 옵션 추가**

**Goal:** 사용자가 `--codex` 플래그로 Codex 파이프라인 선택

**Requirements:** R1, R2

**Dependencies:** Unit 2

**Files:**
- Modify: `skills/write-act-2pass/SKILL.md`

**Approach:**
- `$ARGUMENTS`에서 `--codex` 감지
- `--codex` 있으면 `writing-team-codex-2pass` 팀 사용
- 없으면 기존 `writing-team-collab-2pass` 그대로
- Quick Start에 `--codex` 예시 추가
- Prerequisites에 OPENAI_API_KEY 추가

**Patterns to follow:**
- 기존 `--solo` 옵션 처리 패턴

**Test scenarios:**
- Happy path: SKILL.md frontmatter 유효
- Happy path: --codex 예시가 Quick Start에 포함

**Verification:** `npm run validate:skills` 통과

---

- [ ] **Unit 4: routing-rules.json + 테스트 업데이트**

**Goal:** 라우팅에서 "codex" 키워드 인식

**Requirements:** R1

**Dependencies:** Unit 3

**Files:**
- Modify: `scripts/routing-rules.json` — write-act-2pass의 keywordVariants에 codex 관련 추가
- Modify: `tests/routing/skill-router.test.ts` — codex 매칭 테스트

**Approach:**
- write-act-2pass의 keywordVariants에 "codex 2패스", "codex 집필" 추가
- 테스트: "1막 codex로 써줘" → write-act-2pass 매칭 확인

**Test scenarios:**
- Happy path: "codex 2패스 1막" → write-act-2pass 매칭
- Edge case: "codex"만 단독 → 매칭 안 됨 (다른 스킬과 충돌 방지)

**Verification:** `npx vitest run tests/routing/skill-router.test.ts` 통과

---

- [ ] **Unit 5: team-orchestrator.md에 codex-writer action 처리 추가**

**Goal:** team-orchestrator가 `orchestrator_action: codex-writer` 스텝을 처리

**Requirements:** R3, R9, R10

**Dependencies:** Unit 1

**Files:**
- Modify: `agents/team-orchestrator.md` — codex-writer action 처리 로직 추가

**Approach:**
- 기존 `adult-rewriter` action 처리 패턴(386행)과 동일한 구조
- `action === 'codex-writer'` 시 `node scripts/codex-writer.mjs --chapter N --project {path}` 실행
- 실패 시 에러 메시지 + "Claude로 재시도하려면 --codex 없이 다시 실행하세요" 안내

**Patterns to follow:**
- team-orchestrator.md의 기존 `orchestrator_action` 처리 (adult-rewriter)

**Verification:** `npm run validate:agents` 통과

---

- [ ] **Unit 6: 참조 문서 업데이트**

**Goal:** README, help, AGENTS.md 등에 --codex 옵션 반영

**Dependencies:** Unit 1-5

**Files:**
- Modify: `README.md` — write-act-2pass 설명에 --codex 언급
- Modify: `teams/AGENTS.md` — writing-team-codex-2pass 추가
- Modify: `skills/help/SKILL.md` — Expert Skills에 codex 언급

**Verification:** stale 참조 없음

## System-Wide Impact

- **Interaction graph:** SKILL.md → team-orchestrator → codex-writer.mjs → Codex CLI → GPT-5.4. 기존 Claude 경로에 영향 없음
- **Error propagation:** Codex 실패 → team-orchestrator가 에러 보고 → 사용자에게 Claude 폴백 안내. 자동 폴백 없음
- **Unchanged invariants:** 기존 writing-team-collab-2pass 변경 없음, adult-rewriter.mjs 변경 없음, proofreader/summarizer 변경 없음

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| Codex CLI 인터페이스 변경 | codex-writer.mjs에서 CLI 버전 체크, 인터페이스 추상화 |
| GPT-5.4 한국어 소설 품질 | 사용자가 품질 비교 후 선택 — Claude가 기본값으로 유지 |
| 통합 프롬프트 토큰 한도 | 캐릭터 voice profile만 추출 (전체 .md가 아닌 핵심 섹션만) |
| collab 품질 저하 | 실시간 통신 없이도 캐릭터 정보가 프롬프트에 포함되므로 기본 보이스는 유지 |

## Sources & References

- **Origin:** [docs/brainstorms/2026-03-29-codex-writing-pipeline-requirements.md](docs/brainstorms/2026-03-29-codex-writing-pipeline-requirements.md)
- Pattern: `scripts/adult-rewriter.mjs`, `teams/writing-team-collab-2pass.team.json`
- Orchestrator: `agents/team-orchestrator.md` (orchestrator_action 처리, 386행)
