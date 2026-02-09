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

1. 대상 파일 수집 (Glob으로 `**/*.v`)
2. 각 파일을 Read로 읽기
3. 아래 10가지 규칙을 순서대로 적용
4. Write로 저장
5. 결과 요약 출력 (파일명, 변경 줄 수)

## Formatting Rules

아래 10가지 규칙을 **번호 순서대로** 적용한다. 모든 규칙은 로직을 변경하지 않는다.

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
  input  wire               i_clk                        ,
  input  wire               i_rstn                       ,
  input  wire        [15:0] i_data                       ,  // Data input
  output wire        [31:0] o_result                     ,  // Result output
  output wire               o_valid                         // Valid flag (last, no comma)
);
```

| 요소 | 정렬 |
|------|------|
| `input`/`output` | 2-space 들여쓰기 후 시작 |
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

## Safety

- **로직 변경 금지**: 포매팅은 공백, 정렬, 연산자 치환만 수행한다
- **문자열 보호**: `$display("...")` 등 문자열 리터럴 내부는 건드리지 않는다
- **주석 보존**: `//` 및 `/* */` 주석 내용은 변경하지 않는다 (정렬만)
- **승인 불필요**: 로직 변경이 아니므로 RTL 협의 프로토콜을 적용하지 않는다
