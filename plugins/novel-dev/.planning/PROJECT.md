# Novel-Dev v5.0 — 대폭 개편

## What This Is

장르문학(로맨스, 판타지, 무협, SF 등) 소설을 체계적으로 집필하는 Claude Code 플러그인. 멀티에이전트 오케스트레이션으로 기획부터 완성 원고까지 전 과정을 지원하되, **사람이 쓴 것 같은 자연스러운 문체**를 최우선 목표로 한다.

## Core Value

AI가 썼다는 것을 모를 수준의 자연스럽고 몰입감 있는 한국어 소설 원고를 생성한다.

## Requirements

### Validated

- ✓ 19단계 워크플로우 (브레인스토밍 → 완성) — existing
- ✓ 14개 전문 에이전트 시스템 — existing
- ✓ 22개 JSON 스키마 기반 데이터 관리 — existing
- ✓ Ralph Loop 자동 집필 사이클 — existing
- ✓ 3중 품질 검증 (critic + beta-reader + genre-validator) — existing
- ✓ 17개 장르 레시피 — existing
- ✓ Grok API 외부 집필 지원 — existing
- ✓ 일관성 검사 (캐릭터, 세계관, 타임라인) — existing

### Active

- [ ] AI체 탈피 — 리듬감 있는 자연스러운 한국어 문장 생성
- [ ] 감각적 묘사 강화 — 오감 기반, show don't tell 원칙의 몰입감 있는 서술
- [ ] 장면 전환 자연스러움 — 복선 회수, 페이싱, 전환의 유기적 흐름
- [ ] 캐릭터 음성 차별화 — 등장인물마다 고유한 화법과 사고방식
- [ ] 레퍼런스 기반 문체 학습 — 명작 소설의 문체/구조 패턴 분석 및 적용
- [ ] 다단계 퇴고 파이프라인 — 초고 → 톤 개선 → 문체 다듬기 → 최종 교정
- [ ] 에이전트 프롬프트 전면 재설계 — novelist, editor 등 핵심 에이전트 품질 혁신
- [ ] 평가 기준 고도화 — 문예지 당선작 수준의 엄격한 품질 게이트

### Out of Scope

- 비소설 콘텐츠 (시, 에세이, 논문) — 소설에 집중
- 영문/다국어 소설 — 한국어 특화
- 출판 포맷 변환 (ePub, PDF) — 원고 품질에 집중
- 실시간 협업 — 단일 사용자 워크플로우

## Context

- 기존 novel-dev v3.8.x 코드베이스 위에서 개편
- 14개 에이전트, 35개 커맨드, 22개 스키마 기반
- Claude Code 플러그인 시스템 (skills, commands, agents, hooks)
- TypeScript 소스 + Python 훅 + JavaScript 스크립트 혼합 구조
- xAI Grok API 외부 집필 지원 가능
- 한국어 장르문학 특화 (로맨스, 판타지, 무협, SF, 스릴러 등)

## Constraints

- **플랫폼**: Claude Code 플러그인 구조 (.claude-plugin/ 기반)
- **언어**: 한국어 소설 전용
- **품질 기준**: 사람이 쓴 것 같은 자연스러움 (AI체 탈피가 최우선)
- **하위 호환**: 기존 프로젝트 데이터 (JSON 스키마) 마이그레이션 경로 제공

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| 대폭 개편 (구조 재설계 포함) | 프롬프트 튜닝만으로는 근본적 품질 개선 한계 | — Pending |
| 장르문학에 집중 | 순문학보다 장르문학이 주 사용 목적 | — Pending |
| 기존 데이터 호환 유지 | 이미 작성된 소설 프로젝트 보호 | — Pending |

---
*Last updated: 2026-02-05 after initialization*
