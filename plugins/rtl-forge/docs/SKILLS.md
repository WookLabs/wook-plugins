# RTL-Forge 스킬 목록

> 최종 수정: 2026-01-24
> 문서 기반 설계 워크플로우 + Questa 시뮬레이션

---

## 🎯 핵심 철학: 문서 기반 설계

```
┌─────────────────────────────────────────────────────────────────┐
│                    RTL-Forge 설계 워크플로우                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   1. 스펙 문서 작성    ←──────────────────────┐                 │
│          ↓                                    │                 │
│   2. 사용자 리뷰       "이 부분은 이렇게 수정"  │                 │
│          ↓                                    │                 │
│   3. 문서 수정         ────────────────────────┘                │
│          ↓             (반복)                                   │
│   4. 문서 승인         "이 사양으로 확정"                        │
│          ↓                                                      │
│   5. RTL 작성/수정     (문서 기반으로만 코드 작성)               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

Iron Law: RTL은 승인된 문서를 구현한다. 문서 없이 RTL 없다.
```

### 문서 종류

| 문서 | 위치 | 용도 |
|------|------|------|
| **아키텍처 스펙** | `docs/{module}-arch.md` | 전체 구조, 블록 다이어그램 |
| **인터페이스 스펙** | `docs/{module}-interface.md` | 포트, 프로토콜, 타이밍 |
| **마이크로아키텍처** | `docs/{module}-uarch.md` | FSM, 파이프라인, 데이터패스 |
| **변경 요청** | `docs/changes/{date}-{title}.md` | 변경 이유, BEFORE/AFTER |

---

## 사용 가능한 도구

| 도구 | 용도 |
|------|------|
| **시뮬레이터** | Questa, VCS, Xcelium - 시뮬레이션, 커버리지, 어서션 |
| **LSP 서버** | svls, veridian, svlangserver - 실시간 문법 검사, 정의 이동 |
| **린트 도구** | Verilator, Slang, Verible - 정적 분석, 스타일 검사 |
| **AI + Bash** | 시뮬레이터 실행, 로그 파싱, 결과 분석 |
| **Markdown** | 스펙 문서 작성, 사용자 커뮤니케이션 |

## AI 역할 범위

| ✅ 가능 | ❌ 불가능 |
|---------|----------|
| **스펙 문서 작성/수정** | 합성 (DC, Vivado 없음) |
| **사용자와 문서 리뷰** | STA (Primetime 없음) |
| RTL 코드 읽기/분석/작성 | P&R |
| 시뮬레이션 (Questa/VCS/Xcelium) | 게이트레벨 작업 |
| LSP 정적 분석 (Verilator/Slang) | 물리 설계 |
| 타이밍 다이어그램 작성 | |

---

## 스킬 목록

### 1. spec-driven-design 🆕

| 항목 | 내용 |
|------|------|
| **상태** | 신규 추가 |
| **설명** | 문서 기반 설계 워크플로우. 스펙 문서 작성 → 사용자 리뷰 → 합의 → RTL. |
| **트리거** | "설계하자", "스펙 작성", "아키텍처", "새 모듈", "인터페이스 정의" |
| **핵심 기능** | **Phase 1: 스펙 초안**<br>- AI가 요구사항 기반 초안 작성<br>- `docs/{module}-spec.md` 생성<br><br>**Phase 2: 리뷰 루프**<br>- 사용자: "이 부분은 이렇게"<br>- AI: 문서 수정<br>- 반복<br><br>**Phase 3: 승인**<br>- 사용자: `/approve-spec`<br>- 문서 상태 → APPROVED<br><br>**Phase 4: RTL 작성**<br>- 승인된 문서 기반으로만 코드 작성 |
| **산출물** | - `docs/{module}-arch.md`<br>- `docs/{module}-interface.md`<br>- `docs/{module}-uarch.md` |
| **철학** | 문서 없이 RTL 없다. RTL은 승인된 문서를 구현한다. |

---

### 2. rtl-change-protocol 🔄

| 항목 | 내용 |
|------|------|
| **상태** | 수정 (문서 기반으로 변경) |
| **설명** | RTL 변경 시 문서 먼저 수정 → 승인 → RTL 수정. |
| **트리거** | "RTL 수정", "RTL 변경", "코드 수정", "로직 변경" |
| **핵심 기능** | **Step 1: 변경 문서 작성**<br>- `docs/changes/{date}-{title}.md` 생성<br>- 변경 이유/명분<br>- BEFORE 타이밍 다이어그램<br>- AFTER 타이밍 다이어그램<br>- 영향 분석<br><br>**Step 2: 사용자 리뷰**<br>- 문서 검토<br>- 수정 요청 → 문서 갱신<br><br>**Step 3: 승인**<br>- `/approve-change`<br><br>**Step 4: RTL 수정**<br>- 승인된 변경 문서 기반으로 코드 수정 |
| **Iron Law** | 문서 승인 없이 RTL 수정 없다. |

---

### 3. timing-diagram ✅

| 항목 | 내용 |
|------|------|
| **상태** | 유지 |
| **설명** | ASCII 타이밍 다이어그램 생성 가이드. 사이클 단위 파형 시각화. |
| **트리거** | "타이밍", "파형", "웨이브폼", "사이클" |
| **핵심 기능** | - 클럭, 단일비트, 버스 신호 표기법<br>- 핸드셰이크 패턴<br>- FSM 상태 전이<br>- CDC 동기화 |
| **용도** | 스펙 문서, 변경 문서에서 타이밍 시각화 |

---

### 4. rtl-review ✅

| 항목 | 내용 |
|------|------|
| **상태** | 유지 + LSP 지원 추가 |
| **설명** | RTL 코드 리뷰, LSP 정적 분석, 스펙 문서 대비 검증. |
| **트리거** | "리뷰해", "검토해", "분석해", "린트", "verilator", "slang" |
| **핵심 기능** | - **LSP 정적 분석**: 실시간 문법 검사, 정의 이동, 참조 찾기<br>- **스펙 대비 검증**: 문서와 RTL 일치 확인<br>- 아키텍처 분석 (rtl-architect)<br>- 코딩 스타일 검토 (lint-reviewer)<br>- CDC 패턴 식별 (cdc-analyst) |
| **LSP 서버** | svls, veridian (Slang 기반), svlangserver |
| **린트 도구** | Verilator, Slang, Verible |

---

### 5. notepad-wisdom ✅

| 항목 | 내용 |
|------|------|
| **상태** | 유지 |
| **설명** | 설계 지식 캡처 시스템. 학습/결정/이슈/문제 기록. |
| **트리거** | "기록해", "노트", "메모", "저장해" |
| **핵심 기능** | - learnings.md: 기술적 발견<br>- decisions.md: 아키텍처 결정<br>- issues.md: 알려진 이슈<br>- problems.md: 현재 블로커 |
| **용도** | 문서 리뷰 과정에서 발견한 내용 기록 |

---

### 6. verification-sim 🔄

| 항목 | 내용 |
|------|------|
| **상태** | 수정 (기존: verification-before-synthesis) |
| **설명** | 시뮬레이션 기반 검증. Questa/VCS/Xcelium 지원. |
| **트리거** | "시뮬레이션", "검증", "테스트", "시뮬 돌려", "vcs", "xcelium" |
| **핵심 기능** | - 컴파일 (vlog/vcs/xrun)<br>- 시뮬레이션 실행<br>- 어서션 결과 확인<br>- 커버리지 수집 |
| **지원 시뮬레이터** | Questa (vlog/vsim), VCS (vcs/simv), Xcelium (xrun/xmsim) |
| **파형 뷰어** | Questa (wave), Verdi (fsdb), SimVision (shm) |
| **주의** | 시뮬 결과는 "검증 완료" 주장의 증거로 사용 |

---

### 7. systematic-debugging 🔄

| 항목 | 내용 |
|------|------|
| **상태** | 수정 |
| **설명** | 시뮬레이터 파형/로그 기반 체계적 디버깅. |
| **트리거** | "디버그", "왜 안돼", "에러 분석", "시뮬 에러" |
| **핵심 기능** | **Phase 1: Root Cause**<br>- 시뮬레이터 로그 분석<br>- 에러 메시지 파싱<br><br>**Phase 2: Pattern Analysis**<br>- 파형 덤프 분석<br>- 스펙 문서와 비교<br><br>**Phase 3: Hypothesis**<br>- 단일 변경 테스트<br><br>**Phase 4: Fix**<br>- **문서 먼저 수정** → 승인 → RTL 수정 |
| **중요** | 디버깅으로 발견한 수정사항도 문서 워크플로우를 따름 |

---

### 8. rtl-analyze 🆕

| 항목 | 내용 |
|------|------|
| **상태** | 신규 추가 |
| **설명** | Slang 기반 RTL 정밀 분석. 신호 추적, 계층 분석, 심볼 검색. |
| **트리거** | "신호 추적", "계층 분석", "포트 목록", "slang", "어디서 구동" |
| **핵심 기능** | **신호 추적**: driver/load 찾기<br>**계층 분석**: 모듈 인스턴스 트리<br>**심볼 검색**: 정의 위치 찾기<br>**포트 매핑**: 모듈 연결 관계<br>**타입 정보**: 신호 폭/타입 |
| **Slang 명령어** | `--dump-symbols`, `--ast-json`, `--dump-hierarchy`, `--lint-only` |
| **장점** | SystemVerilog 2017 완벽 지원, JSON 출력으로 정확한 분석 |

---

### 9. rtl-init 🆕

| 항목 | 내용 |
|------|------|
| **상태** | 신규 추가 |
| **설명** | RTL 프로젝트 초기화. CLAUDE.md 생성 및 RTL-Forge 설정. |
| **트리거** | "프로젝트 초기화", "rtl init", "CLAUDE.md 만들어" |
| **핵심 기능** | **정보 수집**: 프로젝트명, 시뮬레이터, 클럭, 리셋, 코딩 스타일<br>**CLAUDE.md 생성**: RTL-Forge 워크플로우, 시뮬레이터 명령어, 규칙<br>**디렉토리 생성**: docs/, rtl/, tb/, sim/ (선택) |
| **출력** | `.claude/CLAUDE.md` 파일 |
| **용도** | 새 RTL 프로젝트 시작 시 또는 기존 프로젝트에 RTL-Forge 적용 시 |

---

## ❌ 삭제 대상 스킬

| 스킬 | 삭제 이유 |
|------|----------|
| **iterative-refinement** | 자동 수정 루프는 문서 기반 워크플로우와 충돌. 사용자 승인 없이 반복 수정 불가. |
| **multi-phase-orchestration** | 과도한 자동화. 각 단계마다 사용자 커뮤니케이션 필요. |
| **defense-in-depth** | 어서션 템플릿은 별도 라이브러리로 분리. 스킬로 관리 불필요. |

---

## 요약

| 스킬 | 상태 | 핵심 역할 |
|------|------|----------|
| **spec-driven-design** | 🆕 신규 | 문서 작성 → 리뷰 → 승인 → RTL |
| **rtl-change-protocol** | 🔄 수정 | 변경 문서 → 승인 → RTL 수정 |
| **timing-diagram** | ✅ 유지 | 문서 내 타이밍 시각화 |
| **rtl-review** | ✅ 유지 | LSP 정적 분석, 스펙 대비 검증 |
| **notepad-wisdom** | ✅ 유지 | 지식 캡처 |
| **verification-sim** | 🔄 수정 | 시뮬레이션 (Questa/VCS/Xcelium) |
| **systematic-debugging** | 🔄 수정 | 시뮬레이터 기반 디버깅 |
| **rtl-analyze** | 🆕 신규 | Slang 기반 신호 추적, 계층 분석 |
| **rtl-init** | 🆕 신규 | 프로젝트 초기화, CLAUDE.md 생성 |

---

## 워크플로우 예시

### 신규 모듈 설계

```
사용자: "AXI4 마스터 모듈을 설계하자"

AI: [spec-driven-design 활성화]
    1. docs/axi4_master-arch.md 초안 작성
    2. "이 아키텍처로 진행할까요?"

사용자: "버스트 길이 최대 256으로 수정해"

AI: 문서 수정
    "수정했습니다. 다른 의견 있으신가요?"

사용자: "/approve-spec"

AI: 승인됨. RTL 작성 시작.
    rtl/axi4_master.sv 생성 (문서 기반)
```

### 기존 모듈 변경

```
사용자: "FIFO에 almost_full 신호 추가해줘"

AI: [rtl-change-protocol 활성화]
    docs/changes/2026-01-24-fifo-almost-full.md 작성
    - 변경 이유
    - BEFORE/AFTER 타이밍 다이어그램
    - 영향 분석

    "이 변경 사항을 검토해주세요"

사용자: "threshold는 설정 가능하게 해줘"

AI: 문서 수정
    "수정했습니다"

사용자: "/approve-change"

AI: 승인됨. RTL 수정.
    rtl/fifo.sv 수정 (문서 기반)
```

---

## TODO (완료)

- [x] spec-driven-design 스킬 신규 생성
- [x] rtl-change-protocol 문서 기반으로 수정
- [x] verification-sim 스킬 생성 (기존 verification-before-synthesis 대체)
- [x] systematic-debugging 문서 워크플로우 반영
- [x] 삭제: iterative-refinement, multi-phase-orchestration, defense-in-depth
- [x] /approve-spec 커맨드 추가
- [x] plugin.json 업데이트
- [x] auto-skill-trigger.mjs 업데이트
