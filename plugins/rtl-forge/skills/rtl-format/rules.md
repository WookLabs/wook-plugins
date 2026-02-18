---
name: rtl-format
description: Verilog/SystemVerilog 파일을 RTL 코딩 표준에 맞게 자동 포매팅
user-invocable: true
allowed-tools:
  - Read
  - Edit
  - Write
  - Glob
  - Grep
  - Bash
---

# RTL Format

Verilog/SystemVerilog 파일을 RTL 코딩 표준에 맞게 자동 포매팅한다.
로직 변경 없이 순수 포매팅만 수행하므로, RTL 협의 프로토콜(승인) 없이 바로 적용한다.

## Input

```
/rtl-format <path>
```

- `<path>`가 `.v` 파일이면 해당 파일만 포매팅
- `<path>`가 디렉토리면 `**/*.v` 전부 포매팅
- `<path>` 생략 시 사용자에게 경로를 물어본다

## Execution Flow

대상 파일을 수집한 뒤, **Phase 1 → 2 → 3 → 4를 순서대로** 실행한다. 각 Phase가 끝나면 적용 결과를 확인한 뒤 다음 Phase로 넘어간다.

```
파일 수집 (Glob **/*.v) → 각 파일을 Read
  │
  ▼
Phase 1: 공백 정리 (Rule 1, 2, 9, 10)
  → 들여쓰기, 키워드 공백, trailing whitespace, EOF
  → 확인: 들여쓰기가 2-space인가? if( 붙어있는가?
  │
  ▼
Phase 2: 세로정렬 (Rule 3, 4, 5, 6, 7)
  → 정렬 그리드, 포트 선언, 신호 선언, 인스턴스, if-else
  → 확인: 각 정렬 블록의 컬럼이 2의 배수인가? 인스턴스↔포트 그리드가 일치하는가?
  │
  ▼
Phase 3: 연산자/배치 (Rule 8, 11)
  → 1-bit ||→|, &&→&, 변수 선언 위치 이동
  → 확인: 1-bit 컨텍스트에 논리연산자가 남아있지 않은가? wire/reg가 사용 블럭 바로 위에 있는가?
  │
  ▼
Phase 4: 경고 출력 (Rule 12~18)
  → 코드 수정 없이 위반 사항만 경고로 출력
  │
  ▼
Write로 저장 → 결과 요약 출력 (파일명, 변경 줄 수)
```

**각 Phase는 해당 Rule만 집중해서 적용하고, 다른 Rule은 건드리지 않는다.**

## Formatting Rules

아래 18가지 규칙을 Phase 순서에 따라 적용한다. 모든 규칙은 로직을 변경하지 않는다.

---

### Rule 1: 2-Space Indentation

4-space 또는 탭 들여쓰기를 2-space로 변환한다.

```verilog
// BEFORE (4-space)
always @(posedge clk or negedge rstn) begin
    if(~rstn) r_state <= IDLE;
    else      r_state <= r_state_next;
end

// AFTER (2-space)
always @(posedge clk or negedge rstn) begin
  if(~rstn) r_state <= IDLE;
  else      r_state <= r_state_next;
end
```

**주의:**
- 문자열 리터럴(`"..."`) 내부의 공백은 건드리지 않는다
- 정렬용 공백(세로정렬)은 Rule 3~7에서 별도 처리한다
- 들여쓰기 레벨만 변환한다 (선행 공백만 대상)

---

### Rule 2: No Space Between `if` and `(`

`if (`, `else if (`, `case (` 의 키워드와 괄호 사이 공백을 제거한다.

```verilog
// BEFORE
if (~rstn)              r_state <= IDLE;
else if (start_cond)    r_state <= RUN;
case (r_state)

// AFTER
if(~rstn)              r_state <= IDLE;
else if(start_cond)    r_state <= RUN;
case(r_state)
```

**대상 키워드:** `if`, `else if`, `case`, `casex`, `casez`
**비대상:** `for`, `while`, `repeat` (이들은 공백 유지)

---

### Rule 3: Alignment Grid — 2의 배수

세로정렬 컬럼이 홀수인 경우 다음 짝수 컬럼으로 조정한다.

```verilog
// BEFORE (col 21 — 홀수)
if(~rstn)           r_data <= 8'd0;
else if(i_valid)    r_data <= i_data;

// AFTER (col 22 — 짝수)
if(~rstn)            r_data <= 8'd0;
else if(i_valid)     r_data <= i_data;
```

**적용 대상:**
- if-else 체인의 할당부 시작 컬럼
- reg/wire 선언의 신호명 시작 컬럼
- 포트 선언의 각 정렬 컬럼

---

### Rule 4: Port Declaration Vertical Alignment

모듈 포트 선언을 세로정렬한다. **이 정렬은 Rule 6 (인스턴스 정렬)과 동일한 컬럼 그리드를 사용한다.**

#### 컬럼 그리드 (인스턴스-파생 규칙)

인스턴스 포트 연결에서 `/*`(2ch)와 `*/ .`(4ch)를 제거하면 포트 선언이 된다:

```
인스턴스:  /*input  wire        [5:0]                  */ .i_pix_dtype                    ( i_pix_dtype                   ),
               ↓ /* 제거                           ↓ */ . 제거                      ↓ ( ~ ), → ,
포트선언:    input  wire        [5:0]                    i_pix_dtype                                                    ,
```

6글자(`/*` + `*/ .`)만 제거하면 컬럼 그리드가 그대로 유지되므로, 복사-붙여넣기로 인스턴스 ↔ 포트 선언 변환이 가능하다.

#### 정렬 규칙

```verilog
module example (
input  wire               i_clk                          ,
input  wire               i_rstn                         ,
input  wire        [15:0] i_data                         ,  // Data input
output wire        [31:0] o_result                       ,  // Result output
output wire               o_valid                           // Valid flag (last, no comma)
);
```

| 요소 | 정렬 |
|------|------|
| `input`/`output` | 들여쓰기 없이 col 0에서 시작 (인스턴스에서 `/*` 제거 시 col 0) |
| `wire` | 키워드 정렬 |
| `[N:0]` | 브래킷 오른쪽 끝 정렬 (1-bit은 공백) |
| 신호명 | 같은 컬럼에서 시작 |
| 쉼표(`,`) | 같은 컬럼에 정렬 |
| 주석(`//`) | 같은 컬럼에 정렬 |
| 마지막 포트 | 쉼표 없음 |

**핵심:** 포트 선언의 컬럼 위치는 Rule 6의 인스턴스 컬럼에서 파생된다. 인스턴스 형식이 마스터이고, 포트 선언은 여기서 6글자를 빼서 만든다.

---

### Rule 5: Signal Declaration Vertical Alignment

reg/wire 선언의 `[]`과 신호명을 세로정렬한다.

```verilog
// BEFORE
reg [ST_W-1:0] r_state;
reg [ST_W-1:0] r_state_next;
reg [15:0] r_line_cnt;
reg r_eof_detected;

// AFTER
reg  [ST_W-1:0]  r_state;
reg  [ST_W-1:0]  r_state_next;
reg  [15:0]      r_line_cnt;
reg              r_eof_detected;
```

| 요소 | 정렬 |
|------|------|
| `reg`/`wire` | 키워드 뒤 2칸 공백 |
| `[N:0]` | 브래킷 끝 정렬 |
| 신호명 | 같은 컬럼에서 시작 |
| 1-bit 신호 | `[]` 없이 공백으로 정렬 |

**범위:** 인접한 reg 선언 그룹, 인접한 wire 선언 그룹 단위로 정렬한다. 빈 줄로 구분된 그룹은 독립적으로 정렬한다.

---

### Rule 6: Instance Port Connection Vertical Alignment (Master Format)

모듈 인스턴스의 포트 연결을 세로정렬한다. **이것이 마스터 포맷이며, Rule 4의 포트 선언은 여기서 파생된다.**

#### 고정 컬럼 그리드

```verilog
qs_mipi_txl_pulse_synchronizer inst_sync (
/*input  wire                              */ .tx_nrst                                      ( tx_nrst                               ),
/*input  wire                              */ .rx_nrst                                      ( rx_nrst                               ),
/*input  wire                              */ .tx_clk                                       ( tx_clk                                ),
/*input  wire                              */ .rx_clk                                       ( rx_clk                                ),
/*input  wire                              */ .pulse_in                                     ( pulse_in                              ),
/*output wire                              */ .pulse_out                                    ( pulse_out                             )
);
```

| 요소 | 위치 | 설명 |
|------|------|------|
| `/*` | col 0 | 주석 블록 시작 (앞에 공백 없음) |
| 타입 정보 | col 2~ | `input wire [N:0]` 등 |
| `*/` | 고정 컬럼 | 주석 블록 끝 |
| `.port_name` | 고정 컬럼 | 포트명 시작 |
| `( signal )` | 고정 컬럼 | 신호 연결 시작 |
| `)` + `,` | 고정 컬럼 | 닫기 |

#### Parameter 인스턴스

```verilog
qs_mipi_txl_csi_frame_ctrl #(
  .FRAME_NUM_WIDTH                          ( 16                                    ),
  .LINE_NUM_WIDTH                           ( 16                                    )
) inst_csi_frame_ctrl (
/*input  wire                              */ .i_clk                                        ( i_pix_clk                             ),
/*output wire                              */ .o_tx_packet_header_request                   ( w_tx_cmd_request                      )
);
```

- Parameter는 2-space 들여쓰기 (주석 블록 없음)
- Parameter의 `.NAME` / `( VALUE )` 도 세로정렬
- 포트 연결부는 일반 인스턴스와 동일한 고정 컬럼

#### 인스턴스 ↔ 포트 선언 변환 규칙

인스턴스 한 줄에서:
1. `/*` 제거 (2ch)
2. `*/ .` 제거 (4ch → 공백 유지)
3. `( signal_name ... ),` → `,` (뒤 전부 제거)

```
/*input  wire [5:0]                        */ .i_pix_dtype                                  ( i_pix_dtype                           ),
   ↓
  input  wire [5:0]                          i_pix_dtype                                                                            ,
```

이렇게 **6글자만 제거**하면 포트 선언이 되므로, 두 포맷 간 복사-편집이 간편하다.

---

### Rule 7: One-liner if-else Vertical Alignment

begin-end 없는 단독 if-else 체인에서, 할당부를 세로정렬한다.

```verilog
// BEFORE
always @(posedge clk or negedge rstn) begin
  if(~rstn) r_signal <= 1'b0;
  else if(cond_high) r_signal <= 1'b1;
  else if(cond_mid) r_signal <= 1'b1;
  else if(r_signal) r_signal <= 1'b0;
end

// AFTER
always @(posedge clk or negedge rstn) begin
  if(~rstn)          r_signal <= 1'b0;
  else if(cond_high) r_signal <= 1'b1;
  else if(cond_mid)  r_signal <= 1'b1;
  else if(r_signal)  r_signal <= 1'b0;
end
```

**규칙:**
- 가장 긴 조건부 뒤에 1칸 공백을 두고, 그 컬럼에 할당부를 정렬
- 정렬 컬럼은 2의 배수 (Rule 3)
- `begin`-`end` 블록 내의 단일 할당 if-else만 대상

---

### Rule 8: Bitwise Operators Over Logical

1-bit 컨텍스트에서 `||` → `|`, `&&` → `&` 로 변환한다.

```verilog
// BEFORE
if(cond_a || cond_b)   r_next = ST_A;
if(cond_a && cond_b)   r_next = ST_B;
wire trigger = en && valid && ~busy;

// AFTER
if(cond_a | cond_b)    r_next = ST_A;
if(cond_a & cond_b)    r_next = ST_B;
wire trigger = en & valid & ~busy;
```

**주의:**
- multi-bit 연산은 변환하지 않는다 (의미가 달라짐)
- `if` 조건, `wire` assign, `case` 조건 내의 1-bit 논리연산만 대상
- 불확실한 경우 변환하지 않는다 (안전 우선)

---

### Rule 9: Trailing Whitespace Removal

모든 줄의 trailing whitespace (공백, 탭)를 제거한다.

---

### Rule 10: Single Newline at EOF

파일 끝에 빈 줄이 정확히 1개가 되도록 조정한다.
- 빈 줄이 없으면 추가
- 2줄 이상이면 1줄로 축소

---

### Rule 11: Variable Declaration Near First Use

변수(wire/reg)를 최초 사용 블럭 바로 위에 선언한다. 파일 상단에 모아놓지 않는다.
wire/reg 선언과 always 블럭 사이에 빈 줄을 넣지 않는다.

```verilog
// BEFORE (파일 상단에 모아놓음)
wire w_some_condition;
wire w_next_phase;
// ... 100줄 뒤에서 사용 ...
always @(posedge clk or negedge rstn) begin
  if(~rstn) r_data <= 8'd0;
  else      r_data <= i_data;
end

always @(posedge clk or negedge rstn) begin
  if(~rstn) r_phase <= 1'b0;
  else      r_phase <= w_next_phase;
end

// AFTER (최초 사용 블럭 바로 위에 선언, 빈 줄 없이 붙임)
wire w_some_condition = i_enable & i_valid;
always @(posedge clk or negedge rstn) begin
  if(~rstn) r_data <= 8'd0;
  else      r_data <= i_data;
end

wire w_next_phase = r_data[7] & r_enable;
always @(posedge clk or negedge rstn) begin
  if(~rstn) r_phase <= 1'b0;
  else      r_phase <= w_next_phase;
end
```

**규칙:**
- wire 선언은 그것을 사용하는 always/assign 블럭 바로 위에 위치
- 선언과 사용 블럭 사이에 빈 줄 없음
- 블럭 간에는 빈 줄 1개로 구분
- 여러 곳에서 사용되는 wire는 첫 사용처 위에 선언

**Why?**
- 변수의 용도를 즉시 파악 가능
- 사용하지 않는 변수를 빠르게 발견
- 코드 리뷰 시 위아래 스크롤 최소화

---

### Rule 12: Signal Naming Convention — i_/o_/r_/w_ Prefix

신호 명명 규칙을 검사하고 위반 시 경고한다.

| Prefix | 의미 | 예시 |
|--------|------|------|
| `i_` | Input port | `i_pixel_valid` |
| `o_` | Output port | `o_byte_data` |
| `r_` | Register (FF) | `r_state`, `r_count` |
| `w_` | Wire (combinational) | `w_next_state` |

```verilog
// BEFORE
input  wire        valid,
output wire        result,
reg  [7:0]  state;
wire [3:0]  next_state;

// AFTER
input  wire        i_valid,
output wire        o_result,
reg  [7:0]  r_state;
wire [3:0]  w_next_state;
```

**규칙:**
- input port는 `i_` prefix
- output port는 `o_` prefix
- `always @(posedge ...)` 에서 할당되는 reg는 `r_` prefix
- combinational wire/assign은 `w_` prefix
- 위반 시 자동 rename 대신 **경고만 출력** (rename은 영향 범위가 넓으므로)

---

### Rule 13: CDC Signal Naming — `_{src}2{dst}`

CDC(Clock Domain Crossing) 동기화 신호는 `{signal}_{src}2{dst}` 형식으로 명명한다.

```verilog
// BEFORE
wire init_seq_done_sync;
wire frame_active_sync;

// AFTER (경고 + 제안)
wire init_seq_done_word2pix;    // word_clk → pix_clk
wire frame_active_pix2word;     // pix_clk → word_clk
```

**규칙:**
- synchronizer 출력 신호에 `_{src}2{dst}` suffix가 없으면 경고
- 자동 rename 대신 **올바른 이름을 제안**만 한다
- `_sync` suffix는 도메인 정보가 없으므로 부적절

---

### Rule 14: FSM Control Signal Naming — set_/clr_/inc_

FSM에서 생성하는 내부 컨트롤 신호는 동작을 나타내는 prefix를 사용한다.

| Prefix | 동작 | 예시 |
|--------|------|------|
| `set_` | 레지스터를 1로 설정 | `set_frame_active` |
| `clr_` | 레지스터를 0으로 클리어 | `clr_frame_active` |
| `inc_` | 카운터 증가 | `inc_frame_num` |

```verilog
// BEFORE (FSM 내 컨트롤 신호에 prefix 없음)
reg frame_active_en;
reg frame_active_rst;
reg frame_num_next;

// AFTER (경고 + 제안)
reg set_frame_active;
reg clr_frame_active;
reg inc_frame_num;
```

**규칙:**
- FSM combinational block 내에서 default 0으로 초기화되고 조건부로 1이 되는 신호 → `set_` 제안
- `set_`과 쌍을 이루는 클리어 신호 → `clr_` 제안
- 카운터 증가 용도 → `inc_` 제안
- 자동 rename 대신 **경고 + 제안**

---

### Rule 15: One Variable Per Always Block

한 always 블록에는 한 변수만 할당한다.

```verilog
// BEFORE (한 always에 여러 변수)
always @(posedge clk or negedge rstn) begin
  if(~rstn) begin
    r_signal_a <= 1'b0;
    r_signal_b <= 1'b0;
  end else begin
    r_signal_a <= some_logic;
    r_signal_b <= other_logic;
  end
end

// AFTER (분리)
always @(posedge clk or negedge rstn) begin
  if(~rstn) r_signal_a <= 1'b0;
  else      r_signal_a <= some_logic;
end

always @(posedge clk or negedge rstn) begin
  if(~rstn) r_signal_b <= 1'b0;
  else      r_signal_b <= other_logic;
end
```

**규칙:**
- sequential always 블록에서 2개 이상의 reg에 할당하면 **경고**
- 단순한 경우 자동 분리를 제안
- FSM의 combinational always (`always @(*)`)는 예외 (여러 신호 할당 허용)

---

### Rule 16: Combinational Logic Extracted to Wire

always 블록의 if-else 조건에 조합식을 직접 넣지 않는다. 바로 위에 wire로 선언한다.

```verilog
// BEFORE (조합식을 if 조건에 직접)
always @(posedge clk or negedge rstn) begin
  if(~rstn)                              r_state <= IDLE;
  else if(i_valid & i_ready & ~i_busy)   r_state <= ACTIVE;
end

// AFTER (wire로 분리)
wire w_valid_and_ready = i_valid & i_ready & ~i_busy;
always @(posedge clk or negedge rstn) begin
  if(~rstn)                  r_state <= IDLE;
  else if(w_valid_and_ready) r_state <= ACTIVE;
end
```

**규칙:**
- `if`/`else if` 조건에 2개 이상의 연산자가 있으면 wire 분리를 **제안**
- 단순 조건 (`~rstn`, 단일 신호)은 그대로 유지
- reset 조건 (`~rstn`, `!rstn`)은 항상 예외

**Why?**
- 파형 분석 시 조합식 결과를 직접 확인 가능
- 같은 조건을 여러 곳에서 재사용 가능

---

### Rule 17: Self-clearing One-shot Pattern

one-shot 펄스 패턴에서 set 조건이 auto-clear보다 우선하도록 정렬한다.

```verilog
// CORRECT pattern
always @(posedge clk or negedge rstn) begin
  if(~rstn)          r_pulse <= 1'b0;
  else if(trigger_a) r_pulse <= 1'b1;  // trigger (priority)
  else if(trigger_b) r_pulse <= 1'b1;  // trigger (priority)
  else if(r_pulse)   r_pulse <= 1'b0;  // auto-clear (last)
end
```

**규칙:**
- `r_xxx <= 1'b1` (set) 조건이 `r_xxx <= 1'b0` (clear) 조건보다 위에 있는지 검사
- self-reference로 클리어하는 패턴 (`else if(r_pulse) r_pulse <= 1'b0`)이 마지막에 위치하는지 검사
- 순서가 잘못되면 **경고**

---

### Rule 18: Parameter/Localparam Uppercase

parameter와 localparam은 전부 대문자로 명명한다.

```verilog
// BEFORE
parameter data_width = 8;
localparam max_count = 255;
localparam st_idle = 3'b001;

// AFTER (경고 + 제안)
parameter DATA_WIDTH = 8;
localparam MAX_COUNT = 255;
localparam ST_IDLE = 3'b001;
```

**규칙:**
- parameter/localparam 이름에 소문자가 포함되면 **경고 + UPPERCASE 제안**
- 대문자 + 언더스코어(`_`) 조합만 허용

---

## Output

포매팅 완료 후 아래 형식으로 요약을 출력한다:

```
RTL Format Complete
───────────────────────────────────
  qs_mipi_txl_csi_frame_ctrl.v    47 lines changed
  qs_mipi_txl_lane_distributor.v  23 lines changed
  qs_mipi_txl_ip_top.v            12 lines changed
───────────────────────────────────
  3 files formatted, 82 lines changed
```

변경이 없는 파일은 목록에서 제외한다.

## Rule Classification

| Phase | 구분 | 규칙 | 동작 |
|-------|------|------|------|
| **Phase 1** | 공백 정리 | Rule 1, 2, 9, 10 | 들여쓰기, 키워드 공백, trailing whitespace, EOF |
| **Phase 2** | 세로정렬 | Rule 3, 4, 5, 6, 7 | 정렬 그리드, 포트/신호/인스턴스/if-else 정렬 |
| **Phase 3** | 연산자/배치 | Rule 8, 11 | 비트 연산자 변환, 변수 선언 위치 이동 |
| **Phase 4** | 경고 출력 | Rule 12~18 | 코드 수정 없이 위반 경고만 출력 |

Phase 1~3은 코드를 직접 수정한다. Phase 4는 이름 변경이나 코드 구조 변경을 수반하므로 경고만 출력하고, 수정은 사용자가 `/rtl-plan` → `/rtl-apply` 워크플로우로 진행한다.

## Safety

- **로직 변경 금지**: 포매팅은 공백, 정렬, 연산자 치환, 배치 변경만 수행한다
- **문자열 보호**: `$display("...")` 등 문자열 리터럴 내부는 건드리지 않는다
- **주석 보존**: `//` 및 `/* */` 주석 내용은 변경하지 않는다 (정렬만)
- **경고 규칙은 읽기 전용**: Rule 12~18은 코드를 수정하지 않고 경고만 출력한다
- **승인 불필요**: 로직 변경이 아니므로 RTL 협의 프로토콜을 적용하지 않는다
