---
title: "feat: Enhance prose quality — anti-AI-pattern rules, genre presets, quality gate"
type: feat
status: active
date: 2026-03-29
origin: docs/brainstorms/2026-03-29-prose-quality-requirements.md
---

# feat: AI 산문 품질 강화

## Overview

AI 집필 시 "끊어쓰기" 문체를 방지하고 유려한 산문을 생성하도록 3중 강화:
1. style-guide에 prose_rules 추가
2. 장르별 before/after few-shot 프리셋 확충
3. quality-oracle AI 패턴 감지 강화

## Problem Frame

novelist.md에 filter word 금지, sensory grounding, show-don't-tell 규칙과 quality-oracle + prose-surgeon 파이프라인이 이미 존재. 하지만 실제 출력에서 AI 문체 패턴 지속. 원인: positive-pattern 부족, few-shot 8개(로맨스 편중), quality-oracle가 연속 단문/리스트형 독백 미감지.

## Requirements Trace

- R1-R3. style-guide prose_rules (anti + positive patterns)
- R4-R6. 장르별(4종) before/after few-shot 프리셋
- R7-R9. novelist/narrator prose_rules 참조, Pass 1 적용
- R10-R12. quality-oracle AI 구조 패턴 감지 강화

## Scope Boundaries

- 문장 품질만 (플롯/스토리 제외), 한국어 전용
- proofreader 역할 변경 없음, 기존 directive type 변경 없음

## Key Technical Decisions

- **prose_rules 위치**: style-guide.json optional 섹션. novelist.md에서 참조
- **AI 패턴 감지**: quality-oracle 강화 (proofreader 아님)
- **before/after**: 기존 anti_exemplar_pair 필드 활용
- **새 directive 2개**: consecutive-short-sentences, list-monologue

## Implementation Units

### Unit 1: style-guide 스키마에 prose_rules 추가
- Modify: `schemas/style-guide.schema.json` — optional prose_rules 섹션
- Create: `templates/style-guide-prose-rules.json` — 기본 템플릿
- Test: `tests/validation/guards.test.ts`

### Unit 2: 장르별 before/after few-shot 확충
- Modify: `templates/style-library/default-exemplars.json` — 12+ exemplar 추가
- 판타지/스릴러/현대문학 각 3쌍(good+anti), ch001/ch002 AI 패턴 반영

### Unit 3: novelist.md + narrator.md 강화
- Modify: `agents/novelist.md` — Prose Rhythm Rules 섹션 + before/after 예시
- Modify: `agents/narrator.md` — prose_rules 참조
- 연속 3+ 단문 금지, 동일 어미 3회 금지, 리스트 독백 금지, 복문 30%+

### Unit 4: quality-oracle 감지 추가
- Modify: `agents/quality-oracle.md` — 2개 감지 항목
- Modify: `schemas/surgical-directive.schema.json` — type 2개 추가

### Unit 5: 참조 문서 업데이트
- README.md, help/SKILL.md, CLAUDE.template.md

## Risks

| Risk | Mitigation |
|------|------------|
| few-shot 품질 | 실제 AI 출력을 anti-exemplar로 사용 |
| novelist.md 비대화 | 20줄 이내, 상세는 style-guide 위임 |
| 과도한 규칙 → 창의성 저하 | 권장/금지 분리, 액션씬 단문 허용 |
