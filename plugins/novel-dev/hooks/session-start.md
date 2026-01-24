---
name: session-start
description: 세션 시작 시 소설 프로젝트 상태 표시
hook: SessionStart
---

# Session Start Hook

세션 시작 시 현재 소설 프로젝트 상태를 자동으로 표시합니다.

## 표시 정보
- 현재 활성 프로젝트
- 진행률 (완료 챕터 / 목표 챕터)
- 현재 상태 (planning, writing, editing)
- Ralph Loop 활성 여부

## 실행 스크립트
`scripts/session-start.mjs`
