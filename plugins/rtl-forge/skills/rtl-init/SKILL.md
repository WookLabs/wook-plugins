---
name: rtl-init
description: RTL 프로젝트 초기화. CLAUDE.md 생성 및 RTL-Forge 설정.
allowed-tools: Read, Write, Edit, AskUserQuestion, Bash
---

# RTL Project Init (프로젝트 초기화)

RTL 프로젝트에 RTL-Forge 플러그인을 위한 CLAUDE.md를 생성합니다.

## 사용 시점

- 새 RTL 프로젝트 시작
- 기존 프로젝트에 RTL-Forge 적용
- CLAUDE.md 재생성/업데이트

## 트리거 키워드

- "프로젝트 초기화"
- "rtl init"
- "CLAUDE.md 만들어"
- "RTL 프로젝트 설정"

---

## 워크플로우

### Phase 1: 프로젝트 정보 수집

AskUserQuestion을 사용하여 다음 정보 수집:

#### Q1. 기본 정보
```
프로젝트 이름: [필수]
프로젝트 설명: [선택]
```

#### Q2. 시뮬레이터 선택
```
사용 시뮬레이터:
- Questa (Siemens/Mentor)
- VCS (Synopsys)
- Xcelium (Cadence)
- 복수 선택 가능
```

#### Q2.5. 린트 도구
```
사용 린트 도구 (자동 감지 가능):
- Verilator (오픈소스, 빠름)
- Slang (정확한 SystemVerilog 파싱)
- Verible (Google, 스타일 검사)
- 자동 감지 (추천)
```

#### Q3. 클럭 도메인
```
주요 클럭:
- 클럭 이름 (예: clk_sys)
- 주파수 (예: 100MHz)
- 추가 클럭 도메인 (있다면)
```

#### Q4. 리셋 정책
```
리셋 방식:
- Active Low / Active High
- Async / Sync
```

#### Q5. 디렉토리 구조
```
기존 구조 사용 또는 표준 구조 생성:
- rtl/
- tb/
- sim/
- docs/
- scripts/
```

#### Q6. 코딩 스타일 (기본값: docs/CODING_STYLE.md)
```
기본 스타일 사용 여부: Yes / No (커스텀)
커스텀 시:
- 레지스터 접미사: _q / _reg / 없음
- 조합로직 접미사: _d / _next / 없음
- FSM 스타일: typedef enum / localparam
```

---

### Phase 2: CLAUDE.md 생성

수집된 정보를 바탕으로 `.claude/CLAUDE.md` 생성:

```markdown
# Project: {project_name}

{project_description}

## RTL-Forge 플러그인 활성화

이 프로젝트는 RTL-Forge 플러그인을 사용합니다.

**Iron Law: 증거 없이 완료 주장 금지** — 시뮬레이션 결과가 증거다.

### 워크플로우 (Simulation-First)
1. 변경 분류: 자동 (TRIVIAL/MINOR/MAJOR/ARCHITECTURAL)
2. 코드 수정 → 린트 (자동) → 시뮬레이션 → 검증
3. MAJOR/ARCHITECTURAL만 사전 승인 필요

---

## 프로젝트 구조

```
{project_name}/
├── docs/                    # 스펙 문서
│   ├── {module}-arch.md     # 아키텍처 스펙
│   ├── {module}-interface.md # 인터페이스 스펙
│   ├── {module}-uarch.md    # 마이크로아키텍처 스펙
│   └── changes/             # 변경 요청 문서
├── rtl/                     # RTL 소스
├── tb/                      # 테스트벤치
├── sim/                     # 시뮬레이션 스크립트
└── scripts/                 # 빌드/실행 스크립트
```

---

## 시뮬레이터 설정

사용 시뮬레이터: {simulator}

{simulator_commands}

---

## Slang 설정 (정적 분석)

```bash
# 신호 추적
slang --dump-symbols rtl/*.sv

# AST 분석
slang --ast-json rtl/{module}.sv

# 계층 분석
slang --dump-hierarchy rtl/*.sv

# Include 경로
slang -I./rtl -I./include {file}.sv
```

---

## 클럭 도메인

{clock_domains}

### CDC 규칙
- 클럭 도메인 교차 시 반드시 2-FF 동기화
- Gray 코드 사용 (멀티비트 신호)
- CDC 경계에 주석 필수: `// CDC: {src_clk} -> {dst_clk}`

---

## 리셋 정책

- 리셋 극성: {reset_polarity}
- 리셋 방식: {reset_type}
- 리셋 신호명: {reset_name}

```systemverilog
// 리셋 템플릿
always_ff @(posedge clk or {reset_edge} {reset_name}) begin
  if ({reset_condition}) begin
    // 리셋 로직
  end else begin
    // 정상 동작
  end
end
```

---

## 코딩 스타일

**참조: RTL-Forge docs/CODING_STYLE.md**

### 핵심 규칙

| 규칙 | 설명 |
|------|------|
| **Indent** | 2-space |
| **Always block** | 한 변수만 할당 |
| **If-else** | One-liner + 세로정렬 |
| **정렬 컬럼** | 2의 배수로 올림 |
| **Operators** | `\|` `&` 비트연산자 (not `\|\|` `&&`) |

### 세로정렬 예시

```verilog
// 포트 선언 - 모든 요소 세로정렬
module example (
  input  wire               i_clk                        ,
  input  wire        [15:0] i_data                       ,
  output wire        [31:0] o_result
);

// 신호 선언 - [], 신호명 정렬
reg  [ST_W-1:0]  r_state;
reg  [15:0]      r_cnt;
reg              r_valid;

// if-else - 할당부 세로정렬
always @(posedge clk or negedge rstn) begin
  if (~rstn)          r_signal <= 1'b0;
  else if (cond_high) r_signal <= 1'b1;
  else if (cond_mid)  r_signal <= 1'b0;
end
```

### 네이밍 규칙

| Prefix | 의미 |
|--------|------|
| `i_` | Input port |
| `o_` | Output port |
| `r_` | Register |
| `w_` | Wire |

### 파일 네이밍
- 모듈: `{block}_{function}.sv`
- 테스트벤치: `tb_{module}.sv`
- 패키지: `{block}_pkg.sv`
- 인터페이스: `{block}_if.sv`

### FSM 스타일 (Two-process)
```systemverilog
// State register
always @(posedge clk or negedge rstn) begin
  if (~rstn) r_state <= ST_IDLE;
  else       r_state <= r_state_next;
end

// Next state logic
always @(*) begin
  r_state_next = r_state;
  case (r_state)
    ST_IDLE: if (i_start) r_state_next = ST_RUN;
    ST_RUN:  if (w_done)  r_state_next = ST_DONE;
    default:              r_state_next = ST_IDLE;
  endcase
end
```

---

## RTL-Forge 명령어

| 작업 | 트리거 키워드 | 스킬 |
|------|--------------|------|
| 새 모듈 설계 | "설계하자", "스펙 작성" | arch-design |
| RTL 수정 | "RTL 수정", "신호 추가" | sim-first-workflow |
| 신호 추적 | "신호 추적", "어디서 구동" | rtl-analyze |
| 코드 리뷰 | "리뷰해", "검토해" | rtl-review |
| 검증 게이트 | 완료 주장 전 | verify-and-claim |
| 디버깅 | "왜 안돼", "디버그" | systematic-debugging |
| 타이밍 그리기 | "타이밍", "파형" | timing-diagram |

---

## 커맨드

| 커맨드 | 설명 |
|--------|------|
| `/approve-change` | RTL 변경 승인 |
| `/show-pending` | 대기 중인 변경 목록 |
| `/rtl-review` | RTL 코드 리뷰 |
| `/note {type} "내용"` | 노트패드에 기록 |

---

## 검증 목표

| 메트릭 | 목표 |
|--------|------|
| Line Coverage | ≥ 95% |
| Branch Coverage | ≥ 90% |
| FSM Coverage | 100% |
| Assertion Coverage | ≥ 85% |

---

## 금지 사항

- ❌ 증거 없이 "완료" 주장 (verify-and-claim 필수)
- ❌ CDC 동기화 없이 클럭 도메인 교차
- ❌ MAJOR/ARCHITECTURAL 변경을 승인 없이 진행
- ❌ 신뢰도 80 미만 분석 결과 보고

---

## 프로젝트 노트

> 이 섹션은 프로젝트 진행 중 발견한 중요 사항을 기록합니다.
> `/note` 커맨드로 추가된 내용이 여기에 반영될 수 있습니다.

```

---

### Phase 3: 디렉토리 생성 (선택)

사용자 동의 시 표준 디렉토리 구조 생성:

```bash
mkdir -p docs/changes
mkdir -p rtl
mkdir -p tb
mkdir -p sim
mkdir -p scripts
```

---

### Phase 4: 완료 메시지

```
╔═══════════════════════════════════════════════════════════════╗
║              ✓ RTL 프로젝트 초기화 완료                        ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║  생성된 파일:                                                 ║
║  - .claude/CLAUDE.md                                          ║
║                                                               ║
║  다음 단계:                                                   ║
║  1. "새 모듈 설계하자" → spec-driven-design 시작              ║
║  2. 기존 RTL 분석 → "rtl/ 폴더 분석해줘"                     ║
║                                                               ║
║  Iron Law: RTL은 승인된 문서를 구현한다.                      ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
```

---

## 시뮬레이터별 명령어 템플릿

### Questa

```bash
# 컴파일
vlib work
vlog -sv -work work rtl/*.sv tb/*.sv

# 시뮬레이션
vsim -c work.tb_top -do "run -all; quit"

# 커버리지
vlog -sv -cover bcesfx rtl/*.sv tb/*.sv
vsim -c -coverage work.tb_top -do "run -all; coverage report; quit"

# GUI
vsim work.tb_top &
```

### VCS

```bash
# 컴파일 + 시뮬레이션
vcs -sverilog -full64 -debug_access+all \
    -f rtl.f -f tb.f -o simv
./simv

# 커버리지
vcs -sverilog -full64 -cm line+cond+fsm+tgl+branch \
    -f rtl.f -f tb.f -o simv
./simv -cm line+cond+fsm+tgl+branch
urg -dir simv.vdb -report coverage_report

# Verdi
./simv -gui &
```

### Xcelium

```bash
# 단일 명령 (컴파일 + 시뮬레이션)
xrun -sv -f rtl.f -f tb.f

# 커버리지
xrun -sv -coverage all -covoverwrite -f rtl.f -f tb.f
imc -load cov_work/scope/test &

# SimVision
xrun -sv -access +rwc -gui -f rtl.f -f tb.f &
```

---

## FSM 스타일 템플릿

### typedef enum (권장)

```systemverilog
typedef enum logic [2:0] {
  IDLE    = 3'b000,
  ACTIVE  = 3'b001,
  WAIT    = 3'b010,
  DONE    = 3'b100
} state_t;

state_t state_q, state_d;

always_ff @(posedge clk or negedge rst_n) begin
  if (!rst_n) state_q <= IDLE;
  else        state_q <= state_d;
end

always_comb begin
  state_d = state_q;
  case (state_q)
    IDLE:   if (start) state_d = ACTIVE;
    ACTIVE: if (done)  state_d = DONE;
    // ...
  endcase
end
```

### localparam

```systemverilog
localparam IDLE   = 3'b000;
localparam ACTIVE = 3'b001;
localparam WAIT   = 3'b010;
localparam DONE   = 3'b100;

logic [2:0] state_q, state_d;
// ...
```

---

## 관련 스킬

- **arch-design**: 초기화 후 첫 모듈 설계 시 사용
- **sim-first-workflow**: RTL 변경 메인 워크플로우
- **rtl-analyze**: 기존 RTL 분석 시 사용
- **notepad-wisdom**: 프로젝트 지식 기록
