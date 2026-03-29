---
title: "feat: Add --codex option to all generative commands"
type: feat
status: active
date: 2026-03-29
---

# feat: 모든 생성 커맨드에 --codex 옵션 추가

## Overview

현재 4개 스킬만 --codex를 지원. 나머지 9개 생성형 스킬에도 --codex를 추가하여 전체 파이프라인을 Codex CLI(GPT-5.4)로 실행 가능하게 함.

## Problem Frame

--codex 옵션이 일부 스킬에만 있으면 사용자가 비용 절감 모드로 전환할 때 어떤 커맨드가 지원되는지 외워야 함. 모든 생성형 커맨드에 일관되게 --codex를 지원해야 함.

## Requirements Trace

- R1. 집필 스킬 4개에 --codex 추가: /write, /write-act, /write-all, /write-2pass
- R2. 설계/플롯 스킬 2개에 --codex 추가: /design, /gen-plot
- R3. 리뷰/기획 스킬 3개에 --codex 추가: /design-review, /blueprint-gen, /blueprint-review
- R4. 기존 codex-writer.mjs, codex-reviewer.mjs 재활용
- R5. 모든 --codex 스킬이 동일한 UX (Codex CLI 필요, 기본 모델 gpt-5.4)

## Scope Boundaries

- brainstorm, init, resume, help, quickstart, stats, status, style-library는 제외 (비생성형)
- 새 스크립트 추가 최소화 — 기존 2개 스크립트를 모드 확장으로 대응
- Codex CLI 인터페이스는 현재 구현(`codex exec`) 유지

## Context & Research

### Relevant Code and Patterns

- `scripts/codex-writer.mjs` — 이미 write + revise 모드 지원. design/gen-plot 모드 추가 가능
- `scripts/codex-reviewer.mjs` — 이미 plot + act 모드 지원. design-review/blueprint-review 모드 추가 가능
- `skills/write-act-2pass/SKILL.md` — --codex 패턴의 원본. `$ARGUMENTS`에서 --codex 감지 → 팀 선택 분기

### Key Pattern: SKILL.md --codex 삽입 패턴

```
$ARGUMENTS에 --codex가 있으면:
  1. codex-writer.mjs 또는 codex-reviewer.mjs를 Bash로 직접 호출
  2. 기존 Claude 팀 실행을 건너뜀
없으면:
  기존 Claude 워크플로우 그대로
```

## Key Technical Decisions

- **codex-writer.mjs 확장 (design/gen-plot 모드 추가)**: 새 스크립트 만들지 않고 기존 스크립트에 `--mode design`, `--mode gen-plot` 추가. 이유: 프롬프트 조립 로직만 다르고 Codex CLI 호출 방식은 동일
- **codex-reviewer.mjs 확장 (design-review/blueprint-review 모드 추가)**: 기존 plot/act 외에 `--mode design-review`, `--mode blueprint-review` 추가
- **집필 스킬의 --codex**: /write, /write-act, /write-all은 codex-writer.mjs `--mode write`를 호출 (이미 존재). /write-2pass는 codex-writer + adult-rewriter 조합
- **blueprint-gen의 --codex**: codex-writer.mjs에 `--mode blueprint` 추가. blueprint는 BLUEPRINT.md 생성이므로 writer 계열

## Implementation Units

### Phase 1: 스크립트 모드 확장

- [ ] **Unit 1: codex-writer.mjs에 design/gen-plot/blueprint 모드 추가**

**Goal:** codex-writer.mjs가 write/revise 외에 design, gen-plot, blueprint 모드도 지원

**Requirements:** R2, R3, R4

**Files:**
- Modify: `scripts/codex-writer.mjs`

**Approach:**
- `--mode` 인자 확장: write | revise | design | gen-plot | blueprint
- 모드별 `buildSystemPrompt` + `buildUserPrompt` 분기
- design 모드: blueprint + project.json + structure.json을 입력으로, 설계 산출물 생성 지시
- gen-plot 모드: design 산출물 전체를 입력으로, 회차별 플롯 JSON 생성 지시
- blueprint 모드: 사용자 아이디어(brainstorm 결과)를 입력으로, BLUEPRINT.md 생성 지시
- 출력 경로도 모드별로 다름 (chapters/ vs meta/ vs BLUEPRINT.md)

**Patterns to follow:** 기존 write/revise 모드 분기 패턴

**Test scenarios:**
- Happy path: `--mode design --help` → 도움말 출력
- Happy path: `--mode gen-plot --dry-run` → 프롬프트 정상 출력
- Error path: `--mode invalid` → 에러 메시지

**Verification:** `node -c scripts/codex-writer.mjs` 통과, 각 모드 --dry-run 정상

---

- [ ] **Unit 2: codex-reviewer.mjs에 design-review/blueprint-review 모드 추가**

**Goal:** 기존 plot/act 외에 design-review, blueprint-review 모드 지원

**Requirements:** R3, R4

**Files:**
- Modify: `scripts/codex-reviewer.mjs`

**Approach:**
- `--mode` 확장: plot | act | design-review | blueprint-review
- design-review: 설계 산출물(style-guide, world, characters, arcs)을 입력으로 4관점 리뷰 지시
- blueprint-review: BLUEPRINT.md를 입력으로 구조/상업성/장르 적합성 리뷰 지시

**Patterns to follow:** 기존 plot/act 모드 분기 패턴

**Verification:** `node -c scripts/codex-reviewer.mjs` 통과

---

### Phase 2: SKILL.md 업데이트 (집필)

- [ ] **Unit 3: /write, /write-act, /write-all, /write-2pass에 --codex 추가**

**Goal:** 4개 집필 스킬에 --codex 옵션 삽입

**Requirements:** R1

**Dependencies:** Unit 1

**Files:**
- Modify: `skills/06-write/SKILL.md`
- Modify: `skills/07-write-act/SKILL.md`
- Modify: `skills/08-write-all/SKILL.md`
- Modify: `skills/write-2pass/SKILL.md`

**Approach:**
- 각 SKILL.md에 Quick Start에 --codex 예시 추가
- --codex 감지 시 codex-writer.mjs를 Bash로 호출하는 분기 추가
- /write-all --codex: 루프 내에서 codex-writer.mjs 반복 호출
- /write-2pass --codex: codex-writer → adult-rewriter 순차 실행

**Patterns to follow:** `skills/write-act-2pass/SKILL.md`의 --codex 패턴

**Verification:** `npm run validate:skills` 통과

---

### Phase 3: SKILL.md 업데이트 (설계/플롯/기획)

- [ ] **Unit 4: /design, /gen-plot에 --codex 추가**

**Goal:** 설계/플롯 생성 스킬에 --codex 지원

**Requirements:** R2

**Dependencies:** Unit 1

**Files:**
- Modify: `skills/04-design/SKILL.md`
- Modify: `skills/05-gen-plot/SKILL.md`

**Approach:**
- /design --codex: codex-writer.mjs `--mode design` 호출
- /gen-plot --codex: codex-writer.mjs `--mode gen-plot` 호출 (회차별 반복)

**Verification:** `npm run validate:skills` 통과

---

- [ ] **Unit 5: /design-review, /blueprint-gen, /blueprint-review에 --codex 추가**

**Goal:** 리뷰/기획 스킬에 --codex 지원

**Requirements:** R3

**Dependencies:** Unit 1, Unit 2

**Files:**
- Modify: `skills/04-design-review/SKILL.md`
- Modify: `skills/01-blueprint-gen/SKILL.md`
- Modify: `skills/02-blueprint-review/SKILL.md`

**Approach:**
- /design-review --codex: codex-reviewer.mjs `--mode design-review`
- /blueprint-gen --codex: codex-writer.mjs `--mode blueprint`
- /blueprint-review --codex: codex-reviewer.mjs `--mode blueprint-review`

**Verification:** `npm run validate:skills` 통과

---

### Phase 4: 문서

- [ ] **Unit 6: README + AGENTS.md 업데이트**

**Dependencies:** Unit 1-5

**Files:**
- Modify: `README.md`
- Modify: `AGENTS.md`

**Verification:** --codex 지원 스킬 13개 전체 문서화

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| codex-writer.mjs가 너무 비대해짐 | 모드별 프롬프트 빌더를 함수로 분리, 메인 로직은 공유 |
| design 모드의 출력이 여러 파일 | 단일 Codex 호출로 JSON 묶음 생성 후 스크립트가 파일 분배 |
| gen-plot 회차별 순차 호출 비용 | 기존 Claude 방식도 순차, Codex는 단가가 낮으므로 총비용 절감 |

## Sources & References

- Pattern: `scripts/codex-writer.mjs`, `scripts/codex-reviewer.mjs`
- Existing --codex skills: `write-act-2pass`, `plot-review`, `act-review`, `revise`
