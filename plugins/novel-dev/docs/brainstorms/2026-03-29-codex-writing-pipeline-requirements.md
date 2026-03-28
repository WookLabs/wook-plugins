---
date: 2026-03-29
topic: codex-writing-pipeline
---

# Codex CLI 집필 파이프라인 (GPT-5.4 + Grok)

## Problem Frame

현재 `write-act-2pass`는 Claude opus(Pass 1) + Grok(Pass 2)로 구성되며, Claude opus의 비용이 대량 집필 시 부담이 된다. `--codex` 옵션을 추가하여 Pass 1 전체를 Codex CLI(GPT-5.4 xhigh)로 대체하면 비용을 절감하면서 기존 팀 구조(narrator + character agents + proofreader + summarizer)를 유지할 수 있다.

## Requirements

**커맨드 인터페이스**
- R1. `write-act-2pass --codex` 옵션 추가 — Pass 1 전체를 Codex CLI로 실행
- R2. 기존 `write-act-2pass` (Claude 기반)은 변경 없이 유지 — `--codex`는 선택적 옵션

**Pass 1: Codex CLI 집필**
- R3. team-orchestrator가 `--codex` 감지 시 narrator, character agents, proofreader, summarizer를 모두 Codex CLI 경유로 디스패치
- R4. 모델: GPT-5.4 xhigh
- R5. 기존 collab 팀 구조(narrator lead + character agents co-write + proofreader + summarizer) 유지
- R6. 각 에이전트의 시스템 프롬프트(novelist.md, narrator.md, characters/*.md 등)를 Codex에 그대로 전달
- R7. 환경변수 `OPENAI_API_KEY` 필요

**Pass 2: Grok 리라이트**
- R8. Pass 2(adult-rewriter.mjs)는 변경 없음 — 기존 Grok API 그대로

**에러 처리**
- R9. OPENAI_API_KEY 미설정 시 명확한 에러 메시지
- R10. Codex CLI 실패 시 Claude 폴백 옵션 제시 (자동 폴백 아님, 사용자 확인)

## Success Criteria

- `write-act-2pass --codex 1` 실행 시 GPT-5.4로 1막 집필 완료
- ADULT 마커 포함 시 Pass 2(Grok) 정상 동작
- 기존 `write-act-2pass 1` (Claude)이 영향 없이 동작

## Scope Boundaries

- `/write` (단건 집필)에는 `--codex` 미적용 (act 단위만)
- Codex CLI 설치/설정은 사용자 책임 (플러그인이 설치하지 않음)
- GPT 모델 선택은 고정 (GPT-5.4 xhigh) — 향후 모델 선택 옵션은 별도 작업

## Key Decisions

- **Codex CLI 경유**: OpenAI API 직접 호출이 아닌 Codex CLI를 통해 호출 — 인증/세션 관리를 Codex에 위임
- **collab 팀 유지**: GPT에서도 narrator + character agents 구조 유지 — 캐릭터 개성 보존
- **Pass 1 전체 대체**: proofreader/summarizer 포함 전부 Codex로 — 부분 대체보다 단순

## Dependencies / Assumptions

- Codex CLI가 시스템에 설치되어 있어야 함
- `OPENAI_API_KEY` 환경변수 필요
- GPT-5.4 xhigh가 한국어 소설 집필에 충분한 품질이라고 가정

## Outstanding Questions

### Deferred to Planning
- [Affects R3][Technical] Codex CLI에서 시스템 프롬프트를 전달하는 정확한 방법 (--system-prompt 플래그 등)
- [Affects R5][Needs research] Codex CLI가 collab 패턴(SendMessage 기반 에이전트 간 통신)을 지원하는지, 아니면 순차 호출로 시뮬레이션해야 하는지
- [Affects R6][Technical] 에이전트 .md 파일을 Codex 프롬프트로 변환하는 어댑터 구현 방식

## Next Steps

→ `/ce:plan` for structured implementation planning
