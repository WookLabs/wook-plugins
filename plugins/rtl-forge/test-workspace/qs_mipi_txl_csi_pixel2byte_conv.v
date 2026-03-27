//=============================================================================
// Module: qs_mipi_txl_csi_pixel2byte_conv
//
// Description:
//   CSI TX Read Path - Line Memory Reader and Pixel to Byte Converter.
//   Handles packet header CDC, line memory read control, and payload generation.
//
// Features:
//   - Packet Header Async FIFO (ESC_CLK → WORD_CLK CDC)
//   - ECC calculation for CSI-2 packet headers
//   - Line Memory read control with ping-pong bank support
//   - Pixel to Byte conversion with 208-bit shift register
//   - CRC16 calculation and continuous payload output
//
// Clock Domain: word_clk (primary), esc_clk (for packet header input)
//
// Author: WOOK
// Date: 2025-02-06
//=============================================================================
`timescale 1ns/10ps

module qs_mipi_txl_csi_pixel2byte_conv #(
  parameter LINE_MEM_DEPTH_ADDR = 16
) (
//=============================================================================
// Clock & Reset
//=============================================================================
input  wire               i_word_clk                    ,
input  wire               i_word_resetn                 ,
input  wire               i_esc_clk                     ,  // For Async FIFO write
input  wire               i_esc_resetn                  ,

//=============================================================================
// Configuration
//=============================================================================
input  wire         [1:0] i_reg_data_lane_cfg           ,
input  wire         [5:0] i_reg_pix_pixel_data_type     ,
input  wire        [15:0] i_reg_hactive                 ,

//=============================================================================
// Control
//=============================================================================
input  wire               i_pix_sof                     ,

//=============================================================================
// From CSI2TX Controller (ESC_CLK domain) - Packet Header Write
//=============================================================================
input  wire               i_write_pkt_header_en         ,  // ESC domain
input  wire        [25:0] i_write_pkt_header            ,  // CSI-2: {VC[3:0], DT[5:0], WC[15:0]}

//=============================================================================
// From Line Memory Writer (via CDC) - Bank Status
//=============================================================================
input  wire               i_bank_select                 ,  // Current Write Bank (CDC'd PIX->WORD)

//=============================================================================
// To/From Line Memory (Read Side)
//=============================================================================
output wire               o_line_mem_ren                ,
output wire [LINE_MEM_DEPTH_ADDR-1:0] o_line_mem_addr  ,
input  wire       [143:0] i_line_mem_rdata_0            ,
input  wire       [143:0] i_line_mem_rdata_1            ,

//=============================================================================
// To CSI Lane Distributor
//=============================================================================
output wire               o_pkt_header_fifo_empty       ,  // Header FIFO status
input  wire               i_pkt_header_req              ,  // Header read request
output wire               o_pkt_header_valid            ,  // Header valid (1-cycle after req)
output wire        [31:0] o_pkt_header                  ,  // {ECC[7:0], WC[15:0], DT[5:0], VC[1:0]}

output wire         [7:0] o_payload_valid               ,  // Byte valid mask
output wire               o_payload_valid_last          ,  // Last payload of packet
output wire        [63:0] o_payload_data                ,  // Payload data

//=============================================================================
// Status
//=============================================================================
output wire               o_pixel2byte_fifo_full        ,
output wire               o_pixel2byte_fifo_empty
);

//=============================================================================
// Datawidth Configuration (from pixel2bytes_converter)
//=============================================================================
reg  [6:0]  r_datawidth_num;
reg  [4:0]  r_datawidth_sel;
always @(*) begin
  case(i_reg_data_lane_cfg)
    2'b01   : r_datawidth_num = 7'd16;   // 1-lane: 16-bit
    2'b10   : r_datawidth_num = 7'd32;   // 2-lane: 32-bit
    default : r_datawidth_num = 7'd64;   // 4-lane: 64-bit
  endcase
end

always @(*) begin
  case(i_reg_data_lane_cfg)
    2'b01   : r_datawidth_sel = 5'b0_0010;  // 1-lane: 16-bit
    2'b10   : r_datawidth_sel = 5'b0_0100;  // 2-lane: 32-bit
    default : r_datawidth_sel = 5'b1_0000;  // 4-lane: 64-bit
  endcase
end

//=============================================================================
// Packet Header Async FIFO Instance
//=============================================================================
// Packet Header Async FIFO: ESC_CLK(write) → WORD_CLK(read)
// Width: 26-bit (ECC is calculated on read side), Depth: 8
wire        w_pkt_header_fifo_empty;
wire [25:0] w_pkt_header_rd_data;
reg         r_pkt_header_rd_en;
qs_mipi_txl_async_fifo #(
  .DATA_WIDTH       ( 26  ),
  .FIFO_DEPTH       ( 8   ),
  .AFULL_THRESHOLD  ( 75  )
) u_pkt_header_fifo (
  // Write side (ESC_CLK)
  .fifo_write_clk         ( i_esc_clk               ),
  .fifo_write_nrst        ( i_esc_resetn             ),
  .fifo_write_strobe      ( i_write_pkt_header_en   ),
  .fifo_write_data        ( i_write_pkt_header      ),  // {VC[3:0], DT[5:0], WC[15:0]}
  .write_side_fifo_level  ( /* OPEN */              ),
  .write_side_fifo_full   ( /* OPEN */              ),

  // Read side (WORD_CLK)
  .fifo_read_clk          ( i_word_clk              ),
  .fifo_read_nrst         ( i_word_resetn           ),
  .fifo_read_strobe       ( r_pkt_header_rd_en      ),
  .fifo_read_data         ( w_pkt_header_rd_data    ),  // 26-bit
  .read_side_fifo_level   ( /* OPEN */              ),
  .read_side_fifo_empty   ( w_pkt_header_fifo_empty )
);

//=============================================================================
// CSI-2 ECC Calculation Module Instance
//=============================================================================
wire [7:0] w_pkt_ecc;
qs_mipi_txl_ecc_cal u_ecc_cal (
  .VC        ( w_pkt_header_rd_data[23:22]  ),  // VC[1:0]
  .DataType  ( w_pkt_header_rd_data[21:16]  ),  // DT[5:0]
  .WordCount ( w_pkt_header_rd_data[15:0]   ),  // WC[15:0]
  .VCX       ( w_pkt_header_rd_data[25:24]  ),  // VC[3:2]
  .ECC       ( w_pkt_ecc                   )
);

// FIFO empty status output
assign o_pkt_header_fifo_empty = w_pkt_header_fifo_empty;

//=============================================================================
// Header Read Control (FSM 제거 → 단순 1-cycle delay 로직)
//=============================================================================
wire w_pkt_header_rd_trigger = i_pkt_header_req & ~w_pkt_header_fifo_empty;
always @(posedge i_word_clk or negedge i_word_resetn) begin
  if(~i_word_resetn)               r_pkt_header_rd_en <= 1'b0;
  else if(w_pkt_header_rd_trigger) r_pkt_header_rd_en <= 1'b1;
  else                             r_pkt_header_rd_en <= 1'b0;
end

//=============================================================================
// Packet Header Output (ECC calculation)
//=============================================================================
reg         r_pkt_header_valid;
reg  [31:0] r_pkt_header;

// Header valid: one-shot pulse after read enable
always @(posedge i_word_clk or negedge i_word_resetn) begin
  if(~i_word_resetn)          r_pkt_header_valid <= 1'b0;
  else if(r_pkt_header_rd_en) r_pkt_header_valid <= 1'b1;
  else if(r_pkt_header_valid) r_pkt_header_valid <= 1'b0;  // auto-clear
end

// Header data: ECC calculated and remapped to CSI-2 standard format
// Input:  [25:22]=VC[3:0], [21:16]=DT[5:0], [15:0]=WC[15:0]
// Output: [31:24]=ECC, [23:8]=WC, [7:0]=DI={VC[1:0],DT}  (VCX in ECC)
always @(posedge i_word_clk or negedge i_word_resetn) begin
  if(~i_word_resetn)          r_pkt_header <= 32'h0;
  else if(r_pkt_header_rd_en) r_pkt_header <= {w_pkt_ecc, w_pkt_header_rd_data[15:0], w_pkt_header_rd_data[23:22], w_pkt_header_rd_data[21:16]};
end

assign o_pkt_header_valid = r_pkt_header_valid;
assign o_pkt_header       = r_pkt_header;

// Short/Long packet detection from registered header
// r_pkt_header format: {ECC[31:24], WC[23:8], VC[7:6], DT[5:0]}
// r_pkt_header는 r_pkt_header_rd_en 사이클에 래치 → FIFO empty 영향 없음
wire        w_is_short_packet = (r_pkt_header[5:4] == 2'b00);            // DT[5:4]
wire        w_is_long_packet  = ~w_is_short_packet;
wire [15:0] w_long_pkt_wc     = r_pkt_header[23:8];                     // WC[15:0]

// start_mem_read: header valid 시점에 long packet이면 발생
wire w_start_mem_read = r_pkt_header_valid & w_is_long_packet;

// YCbCr420 even/odd line tracking
// Toggles on each w_start_mem_read when YCbCr420 format
// 0 = odd line (first line), 1 = even line
wire w_is_ycbcr420 = (i_reg_pix_pixel_data_type == 6'h18) |
                     (i_reg_pix_pixel_data_type == 6'h19);

reg         r_even_odd_line;
always @(posedge i_word_clk or negedge i_word_resetn) begin
  if(~i_word_resetn)                         r_even_odd_line <= 1'b0;
  else if(i_pix_sof)                         r_even_odd_line <= 1'b0;
  else if(w_start_mem_read & w_is_ycbcr420)  r_even_odd_line <= ~r_even_odd_line;
end

//=============================================================================
// Line Memory Read Address Control
//=============================================================================
// Bank select mux for read data
// Latch bank_select at read start to prevent mid-read bank flip
reg         r_read_bank_sel;
always @(posedge i_word_clk or negedge i_word_resetn) begin
  if(~i_word_resetn)        r_read_bank_sel <= 1'b0;
  else if(w_start_mem_read) r_read_bank_sel <= i_bank_select;
end
wire [143:0] w_line_mem_rdata = r_read_bank_sel ? i_line_mem_rdata_0 : i_line_mem_rdata_1;

// Pixels per memory entry based on Data Type
reg  [4:0]  r_pixels_per_mem;
always @(*) begin
  case(i_reg_pix_pixel_data_type)
    //------------------------------------------------------------
    // CSI YCbCr/YUV Formats
    //------------------------------------------------------------
    6'h18   : r_pixels_per_mem = r_even_odd_line ? 5'd8  : 5'd16;  // YCbCr420 8-bit (odd:16px, even:8px)
    6'h19   : r_pixels_per_mem = r_even_odd_line ? 5'd4  : 5'd8;   // YCbCr420 10-bit (odd:8px, even:4px)
    6'h1A   : r_pixels_per_mem = 5'd8;   // YCbCr420 Legacy 8-bit
    6'h1E   : r_pixels_per_mem = 5'd8;   // YCbCr422 8-bit
    6'h1F   : r_pixels_per_mem = 5'd4;   // YCbCr422 10-bit

    //------------------------------------------------------------
    // CSI RGB Formats
    //------------------------------------------------------------
    6'h20   : r_pixels_per_mem = 5'd8;   // RGB444
    6'h21   : r_pixels_per_mem = 5'd8;   // RGB555
    6'h22   : r_pixels_per_mem = 5'd8;   // RGB565
    6'h23   : r_pixels_per_mem = 5'd4;   // RGB666
    6'h24   : r_pixels_per_mem = 5'd4;   // RGB888

    //------------------------------------------------------------
    // CSI Raw Formats
    //------------------------------------------------------------
    6'h26   : r_pixels_per_mem = 5'd4;   // Raw28
    6'h27   : r_pixels_per_mem = 5'd4;   // Raw24
    6'h28   : r_pixels_per_mem = 5'd16;  // Raw6
    6'h29   : r_pixels_per_mem = 5'd16;  // Raw7
    6'h2A   : r_pixels_per_mem = 5'd16;  // Raw8
    6'h2B   : r_pixels_per_mem = 5'd8;   // Raw10
    6'h2C   : r_pixels_per_mem = 5'd8;   // Raw12
    6'h2D   : r_pixels_per_mem = 5'd8;   // Raw14
    6'h2E   : r_pixels_per_mem = 5'd8;   // Raw16
    6'h2F   : r_pixels_per_mem = 5'd4;   // Raw20

    //------------------------------------------------------------
    // CSI User Defined Formats (UD0-UD7)
    //------------------------------------------------------------
    6'h30, 6'h31, 6'h32, 6'h33,
    6'h34, 6'h35, 6'h36, 6'h37  : r_pixels_per_mem = 5'd8;   // UD0-7

    default : r_pixels_per_mem = 5'd4;
  endcase
end

// Valid bits per memory entry (actual pixel data, excluding zero padding)
// = get_bytes_per_mem(dt) × 8
reg  [7:0]  r_valid_bits_per_entry;
always @(*) begin
  case(i_reg_pix_pixel_data_type)
    6'h18   : r_valid_bits_per_entry = 8'd128;  // YCbCr420 8-bit: odd=16×8=128, even=8×16=128
    6'h19   : r_valid_bits_per_entry = 8'd80;   // YCbCr420 10-bit: odd=8×10=80, even=4×20=80
    6'h1A   : r_valid_bits_per_entry = 8'd96;   // YCbCr420 Legacy: 8px, 12bytes=96bit
    6'h1E   : r_valid_bits_per_entry = 8'd128;  // YCbCr422 8-bit: 8×16=128
    6'h1F   : r_valid_bits_per_entry = 8'd80;   // YCbCr422 10-bit: 4×20=80
    6'h20   : r_valid_bits_per_entry = 8'd128;  // RGB444: 8×16=128
    6'h21   : r_valid_bits_per_entry = 8'd128;  // RGB555: 8×16=128
    6'h22   : r_valid_bits_per_entry = 8'd128;  // RGB565: 8×16=128
    6'h23   : r_valid_bits_per_entry = 8'd72;   // RGB666: 4×18=72
    6'h24   : r_valid_bits_per_entry = 8'd96;   // RGB888: 4×24=96
    6'h26   : r_valid_bits_per_entry = 8'd112;  // RAW28: 4×28=112
    6'h27   : r_valid_bits_per_entry = 8'd96;   // RAW24: 4×24=96
    6'h28   : r_valid_bits_per_entry = 8'd96;   // RAW6: 16×6=96
    6'h29   : r_valid_bits_per_entry = 8'd112;  // RAW7: 16×7=112
    6'h2A   : r_valid_bits_per_entry = 8'd128;  // RAW8: 16×8=128
    6'h2B   : r_valid_bits_per_entry = 8'd80;   // RAW10: 8×10=80
    6'h2C   : r_valid_bits_per_entry = 8'd96;   // RAW12: 8×12=96
    6'h2D   : r_valid_bits_per_entry = 8'd112;  // RAW14: 8×14=112
    6'h2E   : r_valid_bits_per_entry = 8'd128;  // RAW16: 8×16=128
    6'h2F   : r_valid_bits_per_entry = 8'd80;   // RAW20: 4×20=80
    default : r_valid_bits_per_entry = 8'd128;
  endcase
end

// Line Memory Read Control signals
reg  [LINE_MEM_DEPTH_ADDR-1:0]  r_read_addr;
reg  [LINE_MEM_DEPTH_ADDR-1:0]  r_read_count_max;
reg  [LINE_MEM_DEPTH_ADDR-1:0]  r_read_count;
reg                              r_mem_read_en;
reg                              r_mem_read_active;
wire [2:0]                       w_aligned_fifo_level;

// Read address counter
always @(posedge i_word_clk or negedge i_word_resetn) begin
  if(~i_word_resetn)        r_read_addr <= {LINE_MEM_DEPTH_ADDR{1'b0}};
  else if(i_pix_sof)        r_read_addr <= {LINE_MEM_DEPTH_ADDR{1'b0}};
  else if(w_start_mem_read) r_read_addr <= {LINE_MEM_DEPTH_ADDR{1'b0}};
  else if(r_mem_read_en)    r_read_addr <= r_read_addr + 1'b1;
end

// Read count max calculation: ceil(hactive / pixels_per_mem)
// = (hactive + pixels_per_mem - 1) / pixels_per_mem
wire [15:0] w_hactive_plus_margin = i_reg_hactive + {11'h0, r_pixels_per_mem} - 1'b1;

// Division by pixels_per_mem (4, 8, or 16)
// All cases are power-of-2, synthesized as bit shifts
reg  [15:0] r_read_count_div;
always @(*) begin
  case(r_pixels_per_mem)
    5'd4    : r_read_count_div = {2'b00,   w_hactive_plus_margin[15:2]};  // /4
    5'd8    : r_read_count_div = {3'b000,  w_hactive_plus_margin[15:3]};  // /8
    5'd16   : r_read_count_div = {4'b0000, w_hactive_plus_margin[15:4]};  // /16
    default : r_read_count_div = {2'b00,   w_hactive_plus_margin[15:2]};  // /4 (default)
  endcase
end

always @(posedge i_word_clk or negedge i_word_resetn) begin
  if(~i_word_resetn)        r_read_count_max <= {LINE_MEM_DEPTH_ADDR{1'b0}};
  else if(w_start_mem_read) r_read_count_max <= r_read_count_div[LINE_MEM_DEPTH_ADDR-1:0];
end

// Read count tracker
always @(posedge i_word_clk or negedge i_word_resetn) begin
  if(~i_word_resetn)        r_read_count <= {LINE_MEM_DEPTH_ADDR{1'b0}};
  else if(i_pix_sof)        r_read_count <= {LINE_MEM_DEPTH_ADDR{1'b0}};
  else if(w_start_mem_read) r_read_count <= {LINE_MEM_DEPTH_ADDR{1'b0}};
  else if(r_mem_read_en)    r_read_count <= r_read_count + 1'b1;
end

// Memory read active flag
wire w_mem_read_done = r_mem_read_active & (r_read_count >= r_read_count_max);
always @(posedge i_word_clk or negedge i_word_resetn) begin
  if(~i_word_resetn)        r_mem_read_active <= 1'b0;
  else if(i_pix_sof)        r_mem_read_active <= 1'b0;
  else if(w_start_mem_read) r_mem_read_active <= 1'b1;
  else if(w_mem_read_done)  r_mem_read_active <= 1'b0;
end

// Memory read enable: active when mem_read_active and FIFO level < 4
wire w_mem_read_ready = r_mem_read_active & (w_aligned_fifo_level < 3'd4) & (r_read_count < r_read_count_max);
always @(posedge i_word_clk or negedge i_word_resetn) begin
  if(~i_word_resetn)        r_mem_read_en <= 1'b0;
  else if(i_pix_sof)        r_mem_read_en <= 1'b0;
  else if(w_mem_read_ready) r_mem_read_en <= 1'b1;
  else                      r_mem_read_en <= 1'b0;
end

assign o_line_mem_ren  = r_mem_read_en;
assign o_line_mem_addr = r_read_addr;

//=============================================================================
// Aligned Pixel Sync FIFO (144x8)
//=============================================================================
// Write: from Line Memory read data
// Read: to Pixel2Bytes converter
wire         w_aligned_fifo_wen   = r_mem_read_en;
wire [143:0] w_aligned_fifo_rdata;
wire         w_aligned_fifo_empty;
wire         w_aligned_fifo_full;
wire         w_aligned_fifo_aempty;
wire         w_aligned_fifo_afull;
reg          r_aligned_fifo_ren;
qs_mipi_txl_sync_fifo #(
  .WIDTH  ( 144 ),
  .DEPTH  ( 8   ),
  .ASIZE  ( 2   )
) u_aligned_pixel_fifo (
  .nrst              ( i_word_resetn           ),
  .gclk              ( i_word_clk              ),
  .fifo_initialize   ( i_pix_sof               ),
  .fifo_write_strobe ( w_aligned_fifo_wen      ),
  .fifo_write_data   ( w_line_mem_rdata        ),
  .fifo_read_strobe  ( r_aligned_fifo_ren      ),
  .fifo_read_data    ( w_aligned_fifo_rdata    ),
  .valid_fifo        ( /* OPEN */              ),
  .fifo_empty        ( w_aligned_fifo_empty    ),
  .fifo_full         ( w_aligned_fifo_full     ),
  .fifo_aempty       ( w_aligned_fifo_aempty   ),
  .fifo_afull        ( w_aligned_fifo_afull    ),
  .fifo_level        ( w_aligned_fifo_level    )
);

//=============================================================================
// Pixel2Bytes Converter FSM (축소: 5-state → 3-state)
//=============================================================================
localparam P2B_IDLE  = 3'b001;
localparam P2B_LOAD  = 3'b010;
localparam P2B_SHIFT = 3'b100;

reg  [2:0]  r_p2b_state;
reg  [2:0]  r_p2b_next_state;
reg         r_init_packing_load;
reg         r_packing_shift_en;
reg         r_update_shift_data;
reg         r_shift_and_load;

// State register
always @(posedge i_word_clk or negedge i_word_resetn) begin
  if(~i_word_resetn) r_p2b_state <= P2B_IDLE;
  else               r_p2b_state <= r_p2b_next_state;
end

// Byte counter for payload (WC tracking)
reg  [15:0] r_byte_cnt;
wire        w_byte_cnt_done;
always @(posedge i_word_clk or negedge i_word_resetn) begin
  if(~i_word_resetn)        r_byte_cnt <= 16'h0;
  else if(i_pix_sof)        r_byte_cnt <= 16'h0;
  else if(w_start_mem_read) r_byte_cnt <= 16'h0;
  else if(r_packing_shift_en) begin
    case(r_datawidth_sel)
      5'b0_0010 : r_byte_cnt <= r_byte_cnt + 16'd2;   // 2 bytes
      5'b0_0100 : r_byte_cnt <= r_byte_cnt + 16'd4;   // 4 bytes
      5'b1_0000 : r_byte_cnt <= r_byte_cnt + 16'd8;   // 8 bytes
      default   : r_byte_cnt <= r_byte_cnt + 16'd8;
    endcase
  end
end

// Latch WC at start_mem_read
reg  [15:0] r_target_wc;
always @(posedge i_word_clk or negedge i_word_resetn) begin
  if(~i_word_resetn)        r_target_wc <= 16'h0;
  else if(w_start_mem_read) r_target_wc <= w_long_pkt_wc;
end

assign w_byte_cnt_done = (r_byte_cnt >= r_target_wc);

// Packing Shift Register control signals
reg  [7:0]  r_valid_data_num;

// Pre-detection: after next shift, will valid_data < datawidth?
// Same logic as DSI pixel2bytes_invalid_64bit
wire w_data_will_deplete = ({r_datawidth_num, 1'b0} >= r_valid_data_num);

// Remaining valid bits after shift (used for combined shift+load position)
wire [7:0] w_remain_after_shift = r_valid_data_num - {1'b0, r_datawidth_num};

// FSM combinational logic (단순화)
always @(*) begin
  // Defaults
  r_p2b_next_state    = r_p2b_state;
  r_aligned_fifo_ren  = 1'b0;
  r_init_packing_load = 1'b0;
  r_packing_shift_en  = 1'b0;
  r_update_shift_data = 1'b0;
  r_shift_and_load   = 1'b0;

  case(r_p2b_state)
    P2B_IDLE: begin
      if(w_start_mem_read) begin
        r_p2b_next_state = P2B_LOAD;
      end
    end

    P2B_LOAD: begin
      if(i_pix_sof) begin
        r_p2b_next_state = P2B_IDLE;
      end
      else if(~w_aligned_fifo_empty) begin
        r_aligned_fifo_ren  = 1'b1;
        r_init_packing_load = 1'b1;
        r_p2b_next_state    = P2B_SHIFT;
      end
    end

    P2B_SHIFT: begin
      if(i_pix_sof) begin
        r_p2b_next_state = P2B_IDLE;
      end
      else if(w_byte_cnt_done) begin
        // 마지막 shift 후 IDLE로 (CRC 출력은 별도 처리)
        r_p2b_next_state = P2B_IDLE;
      end
      else if(r_valid_data_num < {1'b0, r_datawidth_num}) begin
        // 데이터 부족 (shift 불가) → FIFO에서 추가 로드만
        if(~w_aligned_fifo_empty) begin
          r_aligned_fifo_ren  = 1'b1;
          r_update_shift_data = 1'b1;
        end
      end
      else if(w_data_will_deplete & ~w_aligned_fifo_empty) begin
        // Pre-detection: shift 가능하지만 다음에 부족 → shift + load 동시 수행
        r_aligned_fifo_ren = 1'b1;
        r_packing_shift_en = 1'b1;
        r_shift_and_load   = 1'b1;
      end
      else begin
        // 충분한 데이터 → shift out
        r_packing_shift_en = 1'b1;
      end
    end

    default: r_p2b_next_state = P2B_IDLE;
  endcase
end

//=============================================================================
// Packing Shift Register (208-bit, right-shift + LSB output)
//=============================================================================
// Architecture: Data loaded at LSB-aligned positions, output from reg[63:0].
// Right-shift consumes data from LSB. New data OR-merged above valid region.
// Matches pixeldata_align's LSB-aligned output and CRC byte_enb (LSB-first).
reg  [207:0] r_packing_reg;
always @(posedge i_word_clk or negedge i_word_resetn) begin
  if(~i_word_resetn)            r_packing_reg <= 208'h0;
  else if(i_pix_sof)            r_packing_reg <= 208'h0;
  else if(r_init_packing_load)  r_packing_reg <= {80'h0, w_aligned_fifo_rdata[127:0]};
  else if(r_shift_and_load)     r_packing_reg <= (r_packing_reg >> r_datawidth_num) | ({80'h0, w_aligned_fifo_rdata[127:0]} << w_remain_after_shift);
  else if(r_update_shift_data)  r_packing_reg <= r_packing_reg | ({80'h0, w_aligned_fifo_rdata[127:0]} << r_valid_data_num);
  else if(r_packing_shift_en)   r_packing_reg <= r_packing_reg >> r_datawidth_num;
end

always @(posedge i_word_clk or negedge i_word_resetn) begin
  if(~i_word_resetn)            r_valid_data_num <= 8'h0;
  else if(i_pix_sof)            r_valid_data_num <= 8'h0;
  else if(r_init_packing_load)  r_valid_data_num <= r_valid_bits_per_entry;
  else if(r_shift_and_load)     r_valid_data_num <= r_valid_data_num - {1'b0, r_datawidth_num} + r_valid_bits_per_entry;
  else if(r_update_shift_data)  r_valid_data_num <= r_valid_data_num + r_valid_bits_per_entry;
  else if(r_packing_shift_en)   r_valid_data_num <= r_valid_data_num - {1'b0, r_datawidth_num};
end

// Shift register LSB 64-bit (payload output data)
wire [63:0] w_shift_out_data = r_packing_reg[63:0];

//=============================================================================
// CRC16 Calculator Instance
//=============================================================================
wire        w_crc_init  = w_start_mem_read;
wire        w_crc_valid = r_packing_shift_en;

reg  [7:0]  r_crc_byte_enb;  // defined after r_remain_wc, r_bytes_per_shift

wire [15:0] w_calculated_crc;
wire [15:0] w_pre_calculated_crc;

qs_mipi_txl_crc16_calculator_8bytes u_crc_calc (
  .nrst               ( i_word_resetn          ),
  .gclk               ( i_word_clk             ),
  .init_calculator    ( w_crc_init             ),
  .valid_payload      ( w_crc_valid            ),
  .byte_enb           ( r_crc_byte_enb         ),
  .payload_data       ( w_shift_out_data       ),
  .calculated_crc     ( w_calculated_crc       ),
  .pre_calculated_crc ( w_pre_calculated_crc   )
);

//=============================================================================
// Payload Output Control (FIFO 제거 → 직접 출력)
//=============================================================================
reg         r_payload_active;
reg  [15:0] r_remain_wc;
reg         r_payload_valid_last;
reg         r_output_crc;

// Payload active flag
wire w_payload_done = r_output_crc & ~r_packing_shift_en;
always @(posedge i_word_clk or negedge i_word_resetn) begin
  if(~i_word_resetn)        r_payload_active <= 1'b0;
  else if(i_pix_sof)        r_payload_active <= 1'b0;
  else if(w_start_mem_read) r_payload_active <= 1'b1;
  else if(w_payload_done)   r_payload_active <= 1'b0;
end

// Remaining word count (payload bytes)
always @(posedge i_word_clk or negedge i_word_resetn) begin
  if(~i_word_resetn)        r_remain_wc <= 16'h0;
  else if(i_pix_sof)        r_remain_wc <= 16'h0;
  else if(w_start_mem_read) r_remain_wc <= w_long_pkt_wc;
  else if(r_packing_shift_en) begin
    case(r_datawidth_sel)
      5'b0_0010 : r_remain_wc <= (r_remain_wc > 16'd2) ? r_remain_wc - 16'd2 : 16'd0;
      5'b0_0100 : r_remain_wc <= (r_remain_wc > 16'd4) ? r_remain_wc - 16'd4 : 16'd0;
      5'b1_0000 : r_remain_wc <= (r_remain_wc > 16'd8) ? r_remain_wc - 16'd8 : 16'd0;
      default   : r_remain_wc <= (r_remain_wc > 16'd8) ? r_remain_wc - 16'd8 : 16'd0;
    endcase
  end
end

// 마지막 payload 감지 (remain_wc가 다음 shift로 0이 될 때)
wire w_last_payload_shift;
reg  [15:0] r_bytes_per_shift;
always @(*) begin
  case(r_datawidth_sel)
    5'b0_0010 : r_bytes_per_shift = 16'd2;
    5'b0_0100 : r_bytes_per_shift = 16'd4;
    5'b1_0000 : r_bytes_per_shift = 16'd8;
    default   : r_bytes_per_shift = 16'd8;
  endcase
end
assign w_last_payload_shift = r_packing_shift_en & (r_remain_wc <= r_bytes_per_shift);

// CRC byte enable: one-hot mask for CRC calculator cascade depth
// Dynamic adjustment for partial last shift when r_remain_wc < bytes_per_shift
always @(*) begin
  if(r_remain_wc < r_bytes_per_shift) begin
    case(r_remain_wc[2:0])
      3'd1    : r_crc_byte_enb = 8'b0000_0001;
      3'd2    : r_crc_byte_enb = 8'b0000_0010;
      3'd3    : r_crc_byte_enb = 8'b0000_0100;
      3'd4    : r_crc_byte_enb = 8'b0000_1000;
      3'd5    : r_crc_byte_enb = 8'b0001_0000;
      3'd6    : r_crc_byte_enb = 8'b0010_0000;
      3'd7    : r_crc_byte_enb = 8'b0100_0000;
      default : r_crc_byte_enb = 8'b1000_0000;
    endcase
  end
  else begin
    case(r_datawidth_sel)
      5'b0_0010 : r_crc_byte_enb = 8'b0000_0010;  // 1-lane: 2 bytes
      5'b0_0100 : r_crc_byte_enb = 8'b0000_1000;  // 2-lane: 4 bytes
      5'b1_0000 : r_crc_byte_enb = 8'b1000_0000;  // 4-lane: 8 bytes
      default   : r_crc_byte_enb = 8'b1000_0000;
    endcase
  end
end

// CRC 출력 플래그: 마지막 payload 후 1-cycle
always @(posedge i_word_clk or negedge i_word_resetn) begin
  if(~i_word_resetn)            r_output_crc <= 1'b0;
  else if(i_pix_sof)            r_output_crc <= 1'b0;
  else if(w_last_payload_shift) r_output_crc <= 1'b1;   // 마지막 payload 후 CRC
  else if(r_output_crc)         r_output_crc <= 1'b0;   // 1-cycle only
end

// Last payload detection (CRC 출력 사이클에 동시 assert)
always @(posedge i_word_clk or negedge i_word_resetn) begin
  if(~i_word_resetn)             r_payload_valid_last <= 1'b0;
  else if(r_payload_valid_last)  r_payload_valid_last <= 1'b0;  // auto-clear
  else if(w_last_payload_shift)  r_payload_valid_last <= 1'b1;  // CRC와 동시
end

// Payload valid mask based on remaining bytes
reg  [7:0]  r_payload_valid_mask;
always @(*) begin
  if(r_output_crc) begin
    // CRC는 항상 2 bytes
    r_payload_valid_mask = 8'b0000_0011;
  end
  else if(r_remain_wc >= r_bytes_per_shift) begin
    case(r_datawidth_sel)
      5'b0_0001 : r_payload_valid_mask = 8'b0000_0001;  // 8-bit
      5'b0_0010 : r_payload_valid_mask = 8'b0000_0011;  // 16-bit
      5'b0_0100 : r_payload_valid_mask = 8'b0000_1111;  // 32-bit
      5'b0_1000 : r_payload_valid_mask = 8'b0011_1111;  // 48-bit
      5'b1_0000 : r_payload_valid_mask = 8'b1111_1111;  // 64-bit
      default   : r_payload_valid_mask = 8'b0000_1111;
    endcase
  end
  else begin
    // Partial valid for last transfer
    case(r_remain_wc[2:0])
      3'd1    : r_payload_valid_mask = 8'b0000_0001;
      3'd2    : r_payload_valid_mask = 8'b0000_0011;
      3'd3    : r_payload_valid_mask = 8'b0000_0111;
      3'd4    : r_payload_valid_mask = 8'b0000_1111;
      3'd5    : r_payload_valid_mask = 8'b0001_1111;
      3'd6    : r_payload_valid_mask = 8'b0011_1111;
      3'd7    : r_payload_valid_mask = 8'b0111_1111;
      default : r_payload_valid_mask = 8'b1111_1111;
    endcase
  end
end

// Output enable: payload shift 또는 CRC 출력
wire w_payload_output_en = r_packing_shift_en | r_output_crc;

// Output assignments (FIFO 제거 → 직접 출력)
assign o_payload_valid      = w_payload_output_en ? r_payload_valid_mask : 8'h0;
assign o_payload_valid_last = r_payload_valid_last;
assign o_payload_data       = r_output_crc ? {48'h0, w_calculated_crc} : w_shift_out_data;

//=============================================================================
// Status Outputs
//=============================================================================
assign o_pixel2byte_fifo_full  = w_aligned_fifo_full;
assign o_pixel2byte_fifo_empty = w_aligned_fifo_empty;

endmodule
