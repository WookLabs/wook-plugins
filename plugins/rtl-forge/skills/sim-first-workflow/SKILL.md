---
name: sim-first-workflow
description: Logic-First RTL 개발 워크플로우 (v2.1). 사고 → 코드 → 린트 → 시뮬 → 수정 → 문서화. "RTL 수정", "코드 변경", "구현해줘" 시 사용. Think before you code, then verify.
allowed-tools: Read, Write, Edit, Bash, Task, AskUserQuestion
---

# Logic-First Workflow (v2.1)

## 핵심 철학

**"Think before you code, then verify"** — 사고 먼저, 코드 다음, 검증 즉시.

RTL은 하드웨어다. 합성 후에는 되돌릴 수 없다.
1줄 버그 수정에 타이밍 다이어그램 2장은 불필요하지만,
always 블록 수정에 "왜 이렇게 바꾸는지" 30초 사고는 필수다.

## Dual Iron Law (v2.1)

**Iron Law #1: "사고 없이 코드 수정 금지"** — 로직 변경은 반드시 논리적 근거가 선행되어야 한다.

**Iron Law #2: "증거 없이 완료 주장 금지"** — 문서가 아닌 시뮬레이션 결과가 증거다.

---

## 변경 분류 시스템 (5-Level)

모든 RTL 변경은 자동 분류된다 (scripts/classify-change.mjs):

| Level | Examples | Logic Reasoning | Workflow | Approval | Documentation |
|-------|----------|-----------------|----------|----------|---------------|
| **TRIVIAL** | 주석, 공백, lint fix, 테스트벤치 | Tier 0 (없음) | Direct write | 없음 | 없음 |
| **MINOR-MECHANICAL** | 신호 rename, 파라미터 값 변경, width 변경 | Tier 0 (없음) | Write + Verify | 사후 리뷰 | 커밋 메시지 |
| **MINOR-LOGIC** | always 블록 버그 수정, FSM 수정, 로직 변경 | Tier 1 (Quick Check) | Think + Write + Verify | 사후 리뷰 | Logic Memo + 커밋 메시지 |
| **MAJOR** | FSM 상태 추가, 파이프라인 변경, 포트 변경 | Tier 2 (Logic Ralplan) | Think + Write + Verify + Review | 사전 승인 | Logic Memo + 변경 문서 |
| **ARCHITECTURAL** | 새 모듈, CDC 추가, 구조 변경 | Tier 3 (Full Ralplan) | Full Ralplan Loop | 다단계 승인 | Logic Memo + 전체 스펙 + 타이밍 |

### MINOR 분류 기준

| 판별 질문 | MINOR-MECHANICAL | MINOR-LOGIC |
|-----------|------------------|-------------|
| 로직(always/assign) 변경? | No | Yes |
| 기능적 동작 변경? | No (이름/크기만) | Yes |
| 사이드 이펙트 가능성? | 거의 없음 | 있음 |
| 예시 | `signal_a` → `signal_b` rename, `WIDTH=8` → `WIDTH=16` | `if` 조건 수정, FSM transition 변경, sensitivity list 수정 |

---

## Logic Reasoning Tiers

### Tier 0: None (TRIVIAL, MINOR-MECHANICAL)

논리적 분석 불필요. 바로 코드 수정 진행.

### Tier 1: Quick Check (MINOR-LOGIC)

rtl-architect 에이전트가 인라인 Q&A로 ~30초 내 검증:

```
Q: 이 변경의 의도는?
A: wr_ptr 리셋 시 초기값이 0이 아닌 1로 설정되어 첫 쓰기가 누락되는 버그 수정.

Q: 영향 범위는?
A: fifo_ctrl.sv 내 always_ff 블록 1개. 다른 모듈 영향 없음.

Q: 예상되는 동작 변화는?
A: 리셋 직후 첫 write가 정상적으로 addr 0에 기록됨.
```

결과는 **Logic Memo**로 기록.

### Tier 2: Logic Ralplan (MAJOR)

3-agent swarm이 병렬 분석 수행:

| Agent | Role | Focus |
|-------|------|-------|
| **rtl-architect** | 설계 분석 | 아키텍처 영향, 인터페이스 변경, 기능 정합성 |
| **cdc-analyst** | CDC 분석 | 클록 도메인 교차 영향, 동기화 필요성 |
| **synthesis-advisor** | 합성 분석 | 합성 가능성, 면적/타이밍 영향, 제약조건 |

**선택적 확장 (+2 agents):**
- **rdc-analyst**: multi-power-domain 설계인 경우 추가 (리셋 도메인 교차 분석)
- **timing-analyst**: timing-critical 경로가 관련된 경우 추가 (STA 영향 분석)

> **Note:** dft-advisor는 swarm에서 의도적으로 제외. DFT는 체크리스트 기반 검증이며 설계 시점 분석이 아님.

결과는 **Logic Memo**로 기록.

### Tier 3: Full Ralplan (ARCHITECTURAL)

Enhanced 5-agent swarm + Ralplan 반복 루프:

| Agent | Role | Focus |
|-------|------|-------|
| **rtl-architect** | Planner/Advisor | 전체 아키텍처 설계 및 검증 |
| **cdc-analyst** | CDC Expert | 클록 도메인 전략 수립 |
| **synthesis-advisor** | Synthesis Expert | 합성 전략, PPA 최적화 |
| **rdc-analyst** | RDC Expert | 리셋 도메인 교차 분석 |
| **timing-analyst** | Timing Expert | 타이밍 예산 배분, 크리티컬 패스 |

Ralplan 루프:
1. rtl-architect가 설계 계획 수립 (Plan)
2. 4 specialist agents가 병렬 분석 (Analyze)
3. rtl-critic이 통합 리뷰 (Critique)
4. 미합의 시 2-3번 반복 (Iterate)
5. 합의 도출 후 진행 (Consensus)

결과는 **Logic Memo**로 기록.

---

## Logic Memo

모든 Logic Reasoning 결과는 Q&A 형식으로 기록:

```markdown
## Logic Memo: {변경 제목}

**Level:** MINOR-LOGIC | MAJOR | ARCHITECTURAL
**Tier:** 1 | 2 | 3
**Date:** {날짜}
**File(s):** {대상 파일}

### Reasoning Q&A

Q: 변경 의도?
A: ...

Q: 영향 범위?
A: ...

Q: 예상 동작 변화?
A: ...

Q: CDC 영향? (Tier 2+)
A: ...

Q: 합성 영향? (Tier 2+)
A: ...

Q: 아키텍처 영향? (Tier 3)
A: ...

### Conclusion
{최종 판단 및 진행 방향}
```

---

## 워크플로우

### TRIVIAL 플로우

```
1. 변경 분류 확인 (자동: write guard → TRIVIAL)
2. RTL 코드 수정
3. 린트 실행 (자동: post-write hook → Verilator/Slang)
4. 린트 통과? → 완료
5. 린트 실패? → 수정 → 3번 반복
```

### MINOR-MECHANICAL 플로우

```
1. 변경 분류 확인 (자동: write guard → MINOR-MECHANICAL)
2. RTL 코드 수정
3. 린트 실행 (자동)
4. 린트 통과? → 완료
5. 린트 실패? → 수정 → 3번 반복
```

### MINOR-LOGIC 플로우

```
1. 변경 분류 확인 (자동: write guard → MINOR-LOGIC)
2. [Logic Reasoning - Tier 1] Quick Check
   - rtl-architect 인라인 Q&A (~30초)
   - Logic Memo 기록
3. RTL 코드 수정
4. 린트 실행 (자동)
5. 시뮬레이션 실행 (선택적)
6. 린트/시뮬 통과? → 완료
7. 린트/시뮬 실패? → 수정 → 4번 반복
```

### MAJOR 플로우

```
1. 변경 분류 확인 (자동: write guard → MAJOR)
2. [Logic Reasoning - Tier 2] Logic Ralplan
   - 3-agent swarm: rtl-architect + cdc-analyst + synthesis-advisor
   - 선택적 +2: rdc-analyst (multi-power-domain), timing-analyst (timing-critical)
   - Logic Memo 기록
3. /approve-change로 사전 승인 획득
4. RTL 코드 수정
5. 린트 실행 (자동)
6. 시뮬레이션 실행 (수동 또는 자동)
   - 컴파일: vlog/vcs/xrun
   - 시뮬: vsim/simv/xrun
   - 어서션 검사
7. 시뮬 통과? → 변경 문서 작성 → 완료
8. 시뮬 실패? → 디버깅 (systematic-debugging) → 4번 반복
```

### ARCHITECTURAL 플로우

```
1. 변경 분류 확인 (자동: write guard → ARCHITECTURAL)
2. [Logic Reasoning - Tier 3] Full Ralplan Loop
   - Enhanced 5-agent swarm: rtl-architect + cdc-analyst + synthesis-advisor + rdc-analyst + timing-analyst
   - Ralplan 반복: Plan → Analyze → Critique → Iterate → Consensus
   - Logic Memo 기록
3. 계획 승인 후 RTL 코드 작성
4. 린트 + 시뮬레이션 + 커버리지
5. 전체 문서 작성 (스펙, 타이밍 다이어그램)
6. 최종 리뷰 (rtl-review)
```

---

## 시뮬레이터 통합

### 자동 감지

프로젝트의 `tool-config.json` 또는 환경에서 자동 감지:
- Verilator: `verilator --lint-only` (린트)
- Slang: `slang --lint-only` (린트 + 파싱)
- Questa: `vlog` + `vsim` (시뮬레이션)
- VCS: `vcs` + `./simv` (시뮬레이션)
- Xcelium: `xrun` (시뮬레이션)

### 린트 단계 (자동 - PostToolUse hook)

```bash
# Verilator (빠른 린트)
verilator --lint-only -Wall {file}.sv

# Slang (정확한 파싱)
slang --lint-only {file}.sv
```

### 시뮬레이션 단계

```bash
# Questa
vlog -sv -work work {files}
vsim -c work.{tb} -do "run -all; quit"

# VCS
vcs -sverilog -full64 {files} -o simv
./simv

# Xcelium
xrun -sv {files}
```

### 커버리지 단계 (ARCHITECTURAL만 필수)

```bash
# Questa
vlog -sv -cover bcesfx {files}
vsim -c -coverage work.{tb} -do "run -all; coverage report; quit"

# VCS
vcs -sverilog -full64 -cm line+cond+fsm+tgl+branch {files} -o simv
./simv -cm line+cond+fsm+tgl+branch
urg -dir simv.vdb -report coverage_report

# Xcelium
xrun -sv -coverage all -covoverwrite {files}
```

---

## Verify-and-Claim 게이트

**어떤 레벨이든 "완료" 전에 반드시 (Iron Law #2):**

| Claim | Required Evidence |
|-------|-------------------|
| "린트 통과" | Verilator/Slang 실행 로그 (0 errors) |
| "시뮬 통과" | 시뮬레이터 실행 로그 (all tests PASS) |
| "커버리지 달성" | 커버리지 리포트 (수치 포함) |
| "로직 검증 완료" | Logic Memo 작성 완료 (Tier 1+) |
| "구현 완료" | 린트 clean + 시뮬 pass + Logic Memo (해당 시) |

**Red Flags** (즉시 중단):
- "should work" / "looks correct"
- 도구 실행 없이 만족감 표현
- "아마 통과할 거예요"
- 로직 변경인데 Logic Reasoning 없이 코드 수정 시도 (Iron Law #1 위반)

---

## 에이전트 라우팅

| 단계 | 에이전트 | 모델 |
|------|---------|------|
| 변경 분류 | change-classifier | haiku |
| 로직 추론 (Tier 1) | rtl-architect | opus |
| 로직 추론 (Tier 2 swarm) | rtl-architect + cdc-analyst + synthesis-advisor | opus + sonnet + sonnet |
| 로직 추론 (Tier 3 swarm) | rtl-architect + cdc-analyst + synthesis-advisor + rdc-analyst + timing-analyst | opus + sonnet + sonnet + sonnet + sonnet |
| 코드 작성/수정 | rtl-coder | sonnet |
| 린트 리뷰 | lint-reviewer | haiku |
| 시뮬레이션 실행 | verification-runner | sonnet |
| 코드 리뷰 | rtl-critic | opus |
| DFT 검증 | dft-advisor | haiku |
| 문서 작성 | doc-writer | haiku |

---

## 출력 형식

### Dual Output Contract

모든 의미 있는 작업은 두 가지 형식으로 출력:

**1. Markdown 보고서** (사용자용)
```markdown
## Logic-First Workflow 결과

### 변경 분류: MINOR-LOGIC
- 파일: rtl/fifo_ctrl.sv
- 변경: wr_ptr 신호 초기화 버그 수정

### Logic Reasoning (Tier 1)
- Q: 변경 의도? → wr_ptr 리셋 초기값 0→1 버그 수정
- Q: 영향 범위? → fifo_ctrl.sv always_ff 1개 블록
- Q: 예상 동작 변화? → 리셋 후 첫 write 정상 동작

### 린트 결과
- Verilator: PASS (0 errors, 0 warnings)

### 시뮬레이션 결과
- Questa: ALL TESTS PASSED (15/15)
- 어서션 위반: 0
```

**2. JSON 요약** (자동화용)
```json
{
  "classification": "MINOR-LOGIC",
  "file": "rtl/fifo_ctrl.sv",
  "logic_reasoning": {
    "tier": 1,
    "memo": "wr_ptr reset value fix, single always_ff block, no cross-module impact"
  },
  "lint": {"tool": "verilator", "errors": 0, "warnings": 0},
  "simulation": {"tool": "questa", "tests_passed": 15, "tests_total": 15},
  "status": "COMPLETE"
}
```

---

## 트리거 키워드

- "RTL 수정", "코드 변경", "구현해줘"
- "버그 수정", "fix", "수정해"
- "모듈 추가", "새 모듈"
- "파이프라인 변경", "FSM 수정"
- "sim first", "시뮬레이션 우선", "logic first"

## 관련 스킬

- `rtl-classify`: 변경 분류 상세 (5-Level 분류)
- `logic-reasoning`: Logic Reasoning Tier 1/2/3 상세
- `verify-and-claim`: 결정론적 검증
- `systematic-debugging`: 시뮬 실패 디버깅
- `arch-design`: ARCHITECTURAL 변경 설계
- `rtl-review`: 종합 코드 리뷰
- `timing-diagram`: 타이밍 시각화 (MAJOR/ARCHITECTURAL만)

## 관련 에이전트

- `rtl-architect`: RTL 아키텍처 분석 및 설계 (opus)
- `cdc-analyst`: 클록 도메인 교차 분석 (sonnet)
- `rdc-analyst`: 리셋 도메인 교차 분석 (sonnet)
- `synthesis-advisor`: 합성 가능성 및 PPA 분석 (sonnet)
- `timing-analyst`: 타이밍 분석 및 STA 영향 (sonnet)
- `dft-advisor`: DFT 체크리스트 검증 (haiku)
- `rtl-critic`: RTL 코드 리뷰 및 비평 (opus)
