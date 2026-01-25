# RTL Coding Standards

RTL-Forge 플러그인에서 사용하는 코딩 스타일 규칙입니다.

---

## 1. Indentation: 2-Space

**Rule: 들여쓰기는 2-space (업계 표준)**

```verilog
// GOOD: 2-space indentation
always @(posedge clk or negedge rstn) begin
  if (~rstn) r_state <= IDLE;
  else       r_state <= r_state_next;
end

// BAD: 4-space (too wide for deep nesting)
always @(posedge clk or negedge rstn) begin
    if (~rstn) r_state <= IDLE;
    else       r_state <= r_state_next;
end
```

---

## 2. One Variable Per Always Block

**Rule: 한 always문에는 한 변수만 할당**

```verilog
// GOOD: One variable per always block
always @(posedge clk or negedge rstn) begin
  if (~rstn) r_signal_a <= 1'b0;
  else       r_signal_a <= some_logic;
end

always @(posedge clk or negedge rstn) begin
  if (~rstn) r_signal_b <= 1'b0;
  else       r_signal_b <= other_logic;
end

// BAD: Multiple variables in one always block
always @(posedge clk or negedge rstn) begin
  if (~rstn) begin
    r_signal_a <= 1'b0;
    r_signal_b <= 1'b0;  // Don't mix!
  end
end
```

**예외:**
- FSM에서 state와 output을 함께 할당하는 경우 (Mealy machine)
- 긴밀하게 연관된 신호 그룹 (예: valid/ready 페어)

---

## 3. One-liner Style with Vertical Alignment

**Rule: begin-end 없는 단독 if-else는 한 줄로, 할당부 세로정렬**

```verilog
// GOOD: One-liner with vertical alignment
always @(posedge clk or negedge rstn) begin
  if (~rstn)          r_signal <= 1'b0;
  else if (cond_high) r_signal <= 1'b1;  // highest priority
  else if (cond_mid)  r_signal <= 1'b1;  // middle priority
  else if (r_signal)  r_signal <= 1'b0;  // auto-clear (lowest)
end

// GOOD: FSM next state with alignment
case (r_state)
  ST_IDLE: begin
    if (start_cond)                r_state_next = ST_RUN;
    else if (ulps_req | skew_req)  r_state_next = ST_CHECK;
  end
endcase

// BAD: Multi-line without alignment
always @(posedge clk or negedge rstn) begin
  if (~rstn)
    r_signal <= 1'b0;
  else if (cond_high)
    r_signal <= 1'b1;
end
```

**Alignment Column Rule:**
- 세로정렬 시 정렬 컬럼은 **2의 배수로 올림** (41→42, 43→44)
- 2-space 인덴트와 그리드 일관성 유지

---

## 4. Vertical Alignment for Port Declarations

**Rule: 포트 선언 시 input/output, wire, [], 신호명, 쉼표, 주석 세로정렬**

```verilog
// GOOD: Full vertical alignment (brackets right-aligned, comma aligned)
module example (
  input  wire               i_clk                        ,
  input  wire               i_rstn                       ,
  input  wire        [15:0] i_data                       ,  // Data input
  output wire        [31:0] o_result                     ,  // Result output
  output wire               o_valid                         // Valid flag (last, no comma)
);

// BAD: No alignment
module example (
  input wire i_clk,
  input wire [15:0] i_data,    // Data
  output wire [31:0] o_result  // Result
);
```

**Port Alignment Rules:**
| 요소 | 정렬 방식 |
|------|----------|
| `input`/`output` | 왼쪽 정렬, 같은 컬럼 |
| `wire`/`reg` | 같은 컬럼 |
| `[N:0]` | 오른쪽 끝 정렬 (1-bit은 공백) |
| 신호명 | 시작점 정렬 |
| 쉼표 `,` | 같은 컬럼 |
| 주석 `//` | 같은 컬럼 |
| 마지막 포트 | 쉼표 없음 |

---

## 5. Vertical Alignment for Signal Declarations

**Rule: reg/wire 선언 시 [], 신호명 세로정렬**

```verilog
// GOOD: Vertical alignment (brackets and names aligned)
reg  [ST_W-1:0]  r_state;
reg  [ST_W-1:0]  r_state_next;
reg  [15:0]      r_line_cnt;
reg              r_eof_detected;

wire [7:0]       w_data_out;
wire [3:0]       w_byte_cnt;
wire             w_valid;

// BAD: No alignment (hard to read)
reg [ST_W-1:0] r_state;
reg [ST_W-1:0] r_state_next;
reg [15:0] r_line_cnt;
reg        r_eof_detected;
```

**Alignment Rules:**
| 요소 | 정렬 방식 |
|------|----------|
| `reg`/`wire` | 뒤 2칸 공백 |
| `[N:0]` | 끝을 정렬 |
| 신호명 | 시작점 정렬 |
| 1-bit 신호 | `[]` 없이 공백으로 정렬 |
| 정렬 컬럼 | **2의 배수로 올림** |

---

## 6. Bitwise Operators Over Logical Operators

**Rule: || && 대신 | & 비트연산자 사용**

```verilog
// GOOD: Bitwise operators (preferred)
if (cond_a | cond_b)   r_next = ST_A;
if (cond_a & cond_b)   r_next = ST_B;
wire trigger = en & valid & ~busy;

// BAD: Logical operators (avoid)
if (cond_a || cond_b)  r_next = ST_A;
if (cond_a && cond_b)  r_next = ST_B;
```

**Why bitwise?**
- 1-bit 신호에서 결과 동일
- 합성 결과 더 예측 가능
- Short-circuit evaluation 불필요 (HW는 병렬)

---

## 7. Naming Conventions

### Prefix Rules

| Prefix | 의미 | 예시 |
|--------|------|------|
| `i_` | Input port | `i_clk`, `i_data` |
| `o_` | Output port | `o_valid`, `o_result` |
| `r_` | Register (always_ff) | `r_state`, `r_cnt` |
| `w_` | Wire (combinational) | `w_next_state` |
| `c_` | Constant/Parameter | `c_DATA_WIDTH` |
| `p_` | Parameter (module) | `p_DEPTH` |

### State Machine Naming

```verilog
// State parameter naming: ST_{STATE_NAME}
localparam ST_IDLE  = 3'b000;
localparam ST_RUN   = 3'b001;
localparam ST_DONE  = 3'b010;

// State register naming
reg [2:0] r_state;
reg [2:0] r_state_next;  // _next suffix for combinational
```

---

## 8. Reset Style

**Rule: Active-low asynchronous reset (업계 표준)**

```verilog
// GOOD: Active-low async reset
always @(posedge clk or negedge rstn) begin
  if (~rstn) r_data <= '0;
  else       r_data <= w_data_next;
end

// Alternative: posedge rst (active-high)
always @(posedge clk or posedge rst) begin
  if (rst) r_data <= '0;
  else     r_data <= w_data_next;
end
```

---

## 9. FSM Style

**Rule: Two-process FSM (state register + next state logic)**

```verilog
// State register (sequential)
always @(posedge clk or negedge rstn) begin
  if (~rstn) r_state <= ST_IDLE;
  else       r_state <= r_state_next;
end

// Next state logic (combinational)
always @(*) begin
  r_state_next = r_state;  // default: hold
  case (r_state)
    ST_IDLE: if (i_start)    r_state_next = ST_RUN;
    ST_RUN:  if (w_done)     r_state_next = ST_DONE;
    ST_DONE: if (~i_start)   r_state_next = ST_IDLE;
    default:                 r_state_next = ST_IDLE;
  endcase
end
```

---

## 10. Comment Style

```verilog
// Single line comment for brief notes

/*
 * Multi-line block comment
 * for detailed explanations
 */

//-----------------------------------------------------------------------------
// Section separator (80 chars)
//-----------------------------------------------------------------------------

always @(posedge clk) begin
  r_cnt <= r_cnt + 1;  // inline comment: increment counter
end
```

---

## Quick Reference

| Rule | Summary |
|------|---------|
| Indent | 2-space |
| Always block | 한 변수만 |
| If-else | One-liner + 세로정렬 |
| Port decl | 모든 요소 세로정렬, 쉼표 끝 정렬 |
| Signal decl | [], 신호명 세로정렬 |
| Operators | `\|` `&` 비트연산자 |
| Align column | 2의 배수로 올림 |
| Reset | Active-low async |
| FSM | Two-process |

---

## Lint Integration

```bash
# Verilator로 스타일 검사
verilator --lint-only -Wall module.sv

# Slang으로 검사
slang --lint-only module.sv

# Verible로 포맷팅
verible-verilog-format --indentation_spaces=2 module.sv
```

---

## For AI Agents

RTL 코드 작성/리뷰 시 이 스타일 가이드를 **반드시** 준수:

1. 들여쓰기 2-space 확인
2. always 블록당 1개 변수 확인
3. 세로정렬 검사 (정렬 컬럼 2의 배수)
4. 비트 연산자 사용 확인 (`|` `&` vs `||` `&&`)
5. 포트/신호 선언 정렬 확인
