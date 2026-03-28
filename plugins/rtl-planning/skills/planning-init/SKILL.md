---
name: planning-init
description: "Use when starting a new RTL project or onboarding to existing RTL codebase. Creates .planning/ directory with codebase analysis documents and state tracking. Trigger with 'init planning', 'setup planning', 'analyze codebase'."
user-invocable: true
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - Agent
---

# Planning Init — RTL 프로젝트 코드베이스 분석 및 문서화

## 개요

현재 프로젝트의 RTL 코드베이스를 분석하여 `.planning/` 디렉토리에 구조화된 문서를 생성한다.
생성 결과물: `codebase/` 하위 7개 분석 문서 + `STATE.md` 진행 상태 문서.

---

## Phase 1: 프로젝트 구조 탐색

프로젝트 루트에서 아래 패턴으로 RTL 파일, 테스트벤치, 빌드 스크립트를 탐색한다.

```
# RTL 소스 파일
Glob: **/*.v, **/*.sv, **/*.svh

# 빌드/시뮬레이션 스크립트
Glob: **/Makefile, **/*.f, **/*.tcl, **/filelist*, **/*.csh, **/*.sh

# 테스트 관련
Glob: **/*test*.sv, **/*tb*.sv, **/testcase/**

# 문서/설정
Glob: **/CLAUDE.md, **/*.txt, **/*.cfg, **/*.json
```

탐색 결과를 기반으로 아래 정보를 수집한다:
- RTL 소스 디렉토리 위치 및 파일 수
- 테스트벤치/시뮬레이션 디렉토리 위치
- 빌드 시스템 유형 (Makefile, 스크립트 등)
- 최상위 모듈 후보 (wrapper, top 등)

---

## Phase 2: Codebase 문서 생성

`.planning/codebase/` 디렉토리를 생성하고 7개 문서를 **병렬 Agent**로 작성한다.
각 Agent에게 Phase 1 탐색 결과와 아래 가이드라인을 전달한다.

### 2.1 ARCHITECTURE.md — 아키텍처 분석

**분석 대상:**
- 모듈 hierarchy (top → sub-module 관계)
- 데이터 흐름 경로 (입력 → 처리 → 출력)
- Clock domain 구분 및 CDC (Clock Domain Crossing) 포인트
- 주요 FSM (Finite State Machine) 목록
- Entry point (최상위 모듈, wrapper)

**출력 형식:**
```markdown
# Architecture
**Analysis Date:** {날짜}

## Pattern Overview
**Overall:** {아키텍처 패턴 한 줄 요약}
{2-3문장 설명}
**Key Characteristics:** (bullet list)

## Layers
**{레이어명} ({파일명}):**
- Purpose: ...
- Location: {절대 경로}
- Contains: (sub-module list)
- Depends on: ...
- Used by: ...

## Data Flow
{주요 데이터 흐름 ASCII 다이어그램 또는 설명}

## Clock Domains
| Domain | 용도 | 주요 모듈 |
|--------|------|----------|

## CDC Crossings
| 신호 | Source Domain | Dest Domain | 동기화 방식 |
|------|-------------|-------------|------------|

## State Machines
| FSM | 모듈 | States | 설명 |
|-----|------|--------|------|

## Error Handling
{에러/예외 처리 패턴}
```

### 2.2 STRUCTURE.md — 디렉토리 구조

**분석 대상:**
- 전체 디렉토리 트리 (build artifact 제외)
- 각 디렉토리의 역할
- 파일 목록 및 크기 (주요 모듈)
- Signal naming convention 요약
- 수정 규칙: locked (wrapper/interface) / protected (공유 모듈) / open (신규 코드)

**출력 형식:**
```markdown
# Codebase Structure
**Analysis Date:** {날짜}

## Directory Layout
(tree 형식, 주석 포함)

## Directory Purposes
**{디렉토리 경로}:**
- Purpose: ...
- Contains: (주요 파일 나열, 크기 포함)

## Signal Naming Conventions
| Prefix | 의미 | 예시 |
|--------|------|------|

## Modification Rules
### Locked (수정 금지)
### Protected (신중한 수정)
### Open (자유 수정)

## Where to Add New Code
{새 모듈/테스트 추가 시 위치 가이드}
```

### 2.3 CONVENTIONS.md — 코딩 컨벤션

**분석 대상:**
- 파일/모듈/신호 naming pattern
- FSM encoding 방식 (one-hot, binary 등)
- Indentation 및 formatting 규칙
- Always block 작성 패턴 (one-variable-per-always 등)
- Reset 패턴 (sync/async, active-high/low)
- Port 선언 스타일

**출력 형식:**
```markdown
# Coding Conventions
**Analysis Date:** {날짜}

## Naming Patterns
**Files:** ...
**Functions/Tasks:** ...
**Variables/Signals:** (prefix 규칙 표)
**Types:** ...
**FSM Control Signals:** ...

## Code Style
**Formatting:** (indentation, alignment 규칙)
**Linting:** (사용 중인 linter 또는 미사용)

## Import Organization
**Order:** (timescale, includes, imports 순서)

## RTL Patterns
**Always Block 규칙:**
**Reset 패턴:**
**FSM Encoding:**

## Code Examples
(실제 코드에서 발췌한 컨벤션 예시)
```

### 2.4 TESTING.md — 테스트 체계

**분석 대상:**
- 테스트 프레임워크 (SVUnit, UVM, cocotb 등)
- 테스트 디렉토리 구조
- 테스트 실행 명령어 (simulator별)
- 테스트 작성 패턴 (setup/stimulus/check/teardown)
- Mocking/modeling 패턴
- Coverage 설정

**출력 형식:**
```markdown
# Testing Patterns
**Analysis Date:** {날짜}

## Test Framework
**Runner:** ...
**Assertion Library:** ...
**Run Commands:** (simulator별 명령어)

## Test Organization
**Location:** ...
**Naming:** ...

## Test Structure
(setup → stimulus → check → teardown 패턴)

## Mocking Patterns
{모델/스코어보드 구현 패턴}

## Coverage
{coverage 설정 및 목표}
```

### 2.5 STACK.md — 기술 스택

**분석 대상:**
- 사용 언어 (Verilog, SystemVerilog, VHDL)
- 시뮬레이터 (VCS, Xcelium, QuestaSim, ModelSim, Verilator, Icarus)
- 프레임워크 (SVUnit, UVM, cocotb)
- 환경 변수 및 라이선스 설정
- 스크립팅 언어 (Tcl, Python, Perl, Shell)

**출력 형식:**
```markdown
# Technology Stack
**Analysis Date:** {날짜}

## Languages
**Primary:** ...
**RTL Scope:** ...
**Testbench/Verification:** ...

## Runtime
**Simulation Environments:** (simulator 목록 + 버전)
**Scripting Runtime:** ...

## Frameworks
**Testing:** ...
**Build/Dev:** ...

## Environment Variables
| 변수명 | 용도 | 설정값/경로 |
|--------|------|------------|

## Compiler/Simulator Flags
(주요 컴파일/시뮬레이션 옵션)
```

### 2.6 CONCERNS.md — 알려진 이슈

**분석 대상:**
- CLAUDE.md 또는 TODO/FIXME/HACK 주석에서 추출한 known bug
- 복잡도가 높은 모듈 (대형 FSM, 깊은 hierarchy)
- Verification gap (테스트 미작성 영역)
- CDC 위험 포인트
- Timing/synthesis 관련 우려사항

**출력 형식:**
```markdown
# Codebase Concerns
**Analysis Date:** {날짜}

## Summary
{전체 요약 2-3문장}

## Known Bugs
### ISSUE-{NNN}: {제목}
**Severity:** HIGH/MEDIUM/LOW | **Status:** Open/Fixed | **Impact:** ...
**Problem:** ...
**Root Cause:** ...
**Fix Required:** ...

## Complex Modules (주의 필요)
| 모듈 | 복잡도 원인 | 위험도 |
|------|-----------|--------|

## Verification Gaps
{테스트 미작성 영역}

## CDC Risk Points
{CDC 동기화 누락 또는 불완전 포인트}
```

### 2.7 INTEGRATIONS.md — 외부 연동

**분석 대상:**
- 외부 도구 연동 (FTP, 파형 뷰어, coverage 도구)
- 환경 설정 스크립트 (env.csh, .bashrc 등)
- CI/CD 파이프라인 (있는 경우)
- EDA 라이선스 설정

**출력 형식:**
```markdown
# External Integrations
**Analysis Date:** {날짜}

## APIs & External Services
{외부 서버/서비스 연동}

## Data Storage
{파일 저장 구조, 파형 출력 형식}

## Authentication & Identity
{인증 정보, 라이선스}

## Monitoring & Observability
{로그, 에러 추적}

## Environment Setup
{환경 설정 절차}
```

---

## Phase 3: STATE.md 초기화

프로젝트 루트의 `.planning/STATE.md`에 빈 상태 추적 템플릿을 생성한다.

```markdown
# Project State

**Last Updated:** {날짜}

## Active Modules
(현재 작업 중인 모듈 없음)

## Task Progress
- [ ] (작업 항목 추가 예정)

## Resolved Issues
(해결된 이슈 없음)

## Next Actions
(다음 액션 추가 예정)
```

---

## Phase 4: 완료 보고

생성된 파일 목록과 각 문서의 핵심 발견사항을 사용자에게 보고한다.

**보고 형식:**
```
## .planning/ 초기화 완료

### 생성된 파일
- .planning/codebase/ARCHITECTURE.md — {핵심 발견}
- .planning/codebase/STRUCTURE.md — {파일 수, 디렉토리 수}
- .planning/codebase/CONVENTIONS.md — {주요 컨벤션}
- .planning/codebase/TESTING.md — {프레임워크, 테스트 수}
- .planning/codebase/STACK.md — {언어, 시뮬레이터}
- .planning/codebase/CONCERNS.md — {이슈 수, 심각도}
- .planning/codebase/INTEGRATIONS.md — {연동 도구}
- .planning/STATE.md — 빈 템플릿

### 다음 단계
- `planning:status`로 현재 상태 확인
- `planning:update`로 모듈 PLAN 파일 생성
```

---

## 주의사항

- **기존 `.planning/` 디렉토리가 있으면** 사용자에게 덮어쓸지 확인한다.
- **Build artifact 디렉토리** (`work/`, `result/`, `simv*`, `*.log`)는 분석에서 제외한다.
- **경로는 항상 절대 경로**로 기록한다.
- 분석 깊이는 프로젝트 규모에 따라 조절한다: 소규모(<20 파일)는 전수 분석, 대규모(>100 파일)는 hierarchy 기반 샘플링.
- 각 문서 상단에 `**Analysis Date:**`를 반드시 기록한다.
