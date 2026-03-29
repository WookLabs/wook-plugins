---
title: "fix: v1.5.x integrity audit — syntax, routing, metadata fixes"
type: fix
status: active
date: 2026-03-29
---

# fix: v1.5.x 통합 무결성 수정

## Overview

v1.5.0~1.5.2 변경 과정에서 발생한 4개의 무결성 이슈를 수정. 코드 문법 오류 1건, 라우팅 누락 1건, 문서 카운트 불일치 2건.

## Problem Frame

v1.5.x에서 review split, prose quality, Codex pipeline을 동시에 작업하며 여러 버그가 런타임에서 발견됨 (act 필드명, Windows .cmd, Codex CLI 인터페이스). 전체 점검 결과 추가 이슈 4건 확인.

## Requirements Trace

- R1. codex-writer.mjs 문법 오류 수정 — 런타임 크래시 방지
- R2. routing-rules.json 누락 스킬 추가 — 자연어 라우팅 정확도 복원
- R3. default-exemplars.json 메타데이터 정확성
- R4. agents/AGENTS.md 에이전트 카운트 정확성

## Scope Boundaries

- 기능 변경 없음 — 버그 수정 및 메타데이터 정합성만
- 라우팅 누락 8개 중 실제 사용 스킬만 추가 (유틸리티/내부 스킬은 라우팅 불필요 가능)

## Implementation Units

- [ ] **Unit 1: codex-writer.mjs 문법 수정**

**Goal:** runCodex 함수의 닫는 중괄호 누락 수정

**Requirements:** R1

**Files:**
- Modify: `scripts/codex-writer.mjs` (277행 부근)

**Approach:** try-finally 블록 뒤에 함수 닫는 `}` 추가

**Verification:** `node -c scripts/codex-writer.mjs` 통과, `node scripts/codex-writer.mjs --help` 정상 출력

---

- [ ] **Unit 2: routing-rules.json 누락 스킬 추가**

**Goal:** 라우팅에서 누락된 스킬 엔트리 추가

**Requirements:** R2

**Files:**
- Modify: `scripts/routing-rules.json`
- Test: `tests/routing/skill-router.test.ts`

**Approach:**
- 누락 8개 중 사용자 대면 스킬만 추가: `write-act-2pass`, `revise-pipeline`, `verify-chapter`, `verify-design`, `style-library`, `stats`
- 내부 전용 스킬(`02-blueprint-review`, `revision-team-gate`)은 라우팅 불필요 확인 후 스킵 또는 추가

**Verification:** routing 테스트 통과, 총 스킬 수가 skill 디렉토리와 대응

---

- [ ] **Unit 3: default-exemplars.json 메타데이터 수정**

**Goal:** total_exemplars 카운트를 실제 배열 길이에 맞춤

**Requirements:** R3

**Files:**
- Modify: `templates/style-library/default-exemplars.json`

**Approach:** exemplar 배열을 세어 metadata.total_exemplars 업데이트

**Verification:** `npm run validate:schemas` 통과

---

- [ ] **Unit 4: agents/AGENTS.md 카운트 수정**

**Goal:** 에이전트 수 문서 정확성 복원

**Requirements:** R4

**Files:**
- Modify: `agents/AGENTS.md`

**Approach:** 실제 .md 파일 수와 일치하도록 카운트 업데이트

**Verification:** agents/ 디렉토리의 .md 파일 수 == AGENTS.md 기재 수

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| routing 추가 시 기존 키워드 충돌 | 기존 excludeKeywords 패턴 확인 후 추가 |
| 카운트 불일치 재발 | 향후 validate 스크립트에 카운트 체크 추가 고려 |
