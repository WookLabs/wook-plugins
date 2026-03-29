---
title: "fix: Grok adult-rewriter prose quality parity with Claude"
type: fix
status: active
date: 2026-03-29
---

# fix: Grok 리라이트 산문 품질을 Claude 수준으로

## Overview

adult-rewriter.mjs의 Grok 시스템 프롬프트에 prose quality 규칙이 빠져있어 리라이트 구간의 문체가 급격히 저하됨. novelist.md의 핵심 규칙(Prose Rhythm Rules, filter word ban, show-don't-tell)을 Grok 프롬프트에 주입.

## Problem Frame

Pass 1(Claude)은 novelist.md의 모든 문체 규칙을 받아 문학적 산문을 생성. Pass 2(Grok)는 간략한 스타일 메타데이터만 받아 "구체적이고 감각적으로 묘사하세요" 수준의 지시만 있음. 결과: ADULT 마커 구간이 기계적 단문 나열, 필터 워드 남용, 감정 직접 서술로 변질.

## Requirements Trace

- R1. Grok 프롬프트에 Prose Rhythm Rules 삽입 (연속 단문 금지, 동일 어미 반복 금지, 복문 활용, 길이 변주)
- R2. Grok 프롬프트에 filter word ban 삽입
- R3. Grok 프롬프트에 "주변 문장의 톤과 문체를 유지" 규칙을 구체화 (before/after 예시 포함)
- R4. style-guide.json의 prose_rules가 있으면 Grok 프롬프트에도 주입

## Scope Boundaries

- adult-rewriter.mjs의 `buildSystemPrompt` 함수만 수정
- Grok API 호출 방식, JSON 출력 형식 등은 변경 없음
- 새 파일 생성 없음

## Implementation Units

- [ ] **Unit 1: buildSystemPrompt에 prose quality 규칙 추가**

**Goal:** Grok이 Claude와 동일한 산문 품질 규칙을 받아 리라이트

**Requirements:** R1, R2, R3

**Files:**
- Modify: `scripts/adult-rewriter.mjs` — `buildSystemPrompt` 함수

**Approach:**
- "작업 지시" 섹션 앞에 3개 블록 추가:
  1. **산문 리듬 규칙**: novelist.md의 Prose Rhythm Rules 핵심 (anti-patterns 테이블 + positive-patterns 테이블)
  2. **필터 워드 금지**: 느꼈다, 보였다, 생각했다 등 금지 + 대체 기법
  3. **문체 연속성**: "ADULT 마커 바로 앞 3문장의 문체, 리듬, 어휘 수준을 분석하고 그것을 그대로 이어가세요" + before/after 예시
- 기존 "주변 문장의 톤과 문체를 유지하세요" 한 줄을 위 구체 규칙으로 교체

**Patterns to follow:** `agents/novelist.md`의 Prose Rhythm Rules 섹션, Filter Word Ban 섹션

**Test scenarios:**
- Happy path: `node -c scripts/adult-rewriter.mjs` 문법 통과
- Happy path: `--dry-run`으로 시스템 프롬프트 출력 시 prose rules 포함 확인

**Verification:** 시스템 프롬프트에 "연속 단문 금지", "필터 워드", "복문 활용" 키워드 존재

---

- [ ] **Unit 2: prose_rules JSON 로드 및 주입**

**Goal:** style-guide.json에 prose_rules가 있으면 Grok 프롬프트에도 포함

**Requirements:** R4

**Dependencies:** Unit 1

**Files:**
- Modify: `scripts/adult-rewriter.mjs` — `buildSystemPrompt` 함수

**Approach:**
- styleGuide 객체에서 `prose_rules` 필드 확인
- 있으면 anti_patterns/positive_patterns를 프롬프트에 포함
- 없으면 Unit 1의 하드코딩 규칙만 적용 (fallback)

**Verification:** prose_rules가 있는 style-guide로 --dry-run 시 프롬프트에 프로젝트별 규칙 포함

## Sources & References

- `scripts/adult-rewriter.mjs:233-323` — 현재 buildSystemPrompt
- `agents/novelist.md` — Prose Rhythm Rules, Filter Word Ban
- `templates/style-guide-prose-rules.json` — prose_rules 기본 템플릿
