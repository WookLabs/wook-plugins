---
title: "feat: Scene-level quality loop with prose rule re-injection"
type: feat
status: active
date: 2026-04-04
---

# feat: 씬 단위 품질 루프 + 산문 규칙 재주입

## Overview

narrator의 씬 사이클에 (1) 산문 규칙 재주입, (2) 씬 완성 후 자가 품질 체크를 추가하여 장편 출력에서의 품질 열화를 방지.

## Problem Frame

현재 narrator는 씬 단위로 SCENE_BRIEF → CHARACTER_RESPONSE → 엮기 사이클을 수행하지만, 씬을 엮을 때 산문 규칙을 재참조하지 않고, 엮기 후 품질 체크 없이 바로 다음 씬으로 넘어감. 챕터 후반 씬으로 갈수록 복문 비율 저하, 단문 나열 증가, 필터 워드 유입 등 품질 열화 발생.

## Requirements Trace

- R1. 매 씬 엮기 전에 산문 규칙 핵심을 재주입 (context refreshing)
- R2. 씬 엮기 완료 후 자가 품질 체크 (복문 비율, 단문 연속, 필터 워드, 독백 형식)
- R3. 품질 미달 시 해당 씬만 보강 후 확정 (전체 재작성 아님)
- R4. 직전 씬의 마지막 문장을 다음 씬 엮기의 "톤 앵커"로 전달

## Scope Boundaries

- narrator.md만 수정 — 팀 정의, 스키마, 스크립트 변경 없음
- 별도 품질 에이전트 추가 안 함 — narrator의 자가 체크

## Key Technical Decisions

- **자가 체크 (별도 에이전트 아님)**: narrator가 씬 엮기 후 스스로 체크. 이유: 별도 에이전트를 추가하면 팀 구조 변경 필요, 자가 체크는 프롬프트 수정만으로 구현 가능
- **규칙 재주입은 간결하게**: novelist.md 전체를 다시 읽는 게 아니라, 핵심 3줄 리마인더를 씬마다 자기에게 상기
- **톤 앵커**: 직전 씬의 마지막 2-3문장을 SCENE_BRIEF의 `previous_scene_ending`으로 전달 — 이미 필드가 존재하므로 활용 강화

## Implementation Units

- [ ] **Unit 1: narrator.md — 씬 사이클에 품질 루프 삽입**

**Goal:** 씬 엮기 전 규칙 재주입 + 엮기 후 자가 품질 체크

**Requirements:** R1, R2, R3, R4

**Files:**
- Modify: `agents/narrator.md`

**Approach:**
- 씬 사이클(46행) 수정:
  ```
  기존: BRIEF → RESPONSE → 엮기 → (OOC) → FINAL
  변경: BRIEF → RESPONSE → 규칙 리마인더 → 엮기 → 품질 자가 체크 → (보강) → (OOC) → FINAL
  ```
- **규칙 리마인더** (엮기 직전 자기 상기):
  "이 씬을 엮기 전 상기: (1) 복문 30%+, 연속 단문 2개까지만 (2) 필터 워드 금지: 느꼈다/보였다/생각했다 (3) 독백은 '홑따옴표' (4) 직전 씬 마지막 문장의 톤을 이어갈 것"
- **자가 품질 체크** (엮기 후, FINAL 전):
  씬 초안을 다시 읽고 체크:
  - 연속 단문 3개+ 없는지
  - 필터 워드 0개인지
  - `*이탤릭*` 독백 없는지
  - 복문 비율이 체감적으로 30%+ 인지
  미달 시 해당 부분만 보강 후 확정
- **톤 앵커 강화**: SCENE_BRIEF의 `previous_scene_ending`을 "문체 앵커"로 재명명/강화하여 narrator가 이 톤을 유지하도록 명시

**Patterns to follow:** `agents/novelist.md`의 "자가 검증" 패턴

**Verification:** narrator.md에 "규칙 리마인더", "품질 자가 체크" 섹션이 씬 사이클 안에 존재

## Sources & References

- `agents/narrator.md:46-55` — 현재 씬 사이클
- `agents/novelist.md` — 산문 리듬 규칙, 자가 검증 패턴
