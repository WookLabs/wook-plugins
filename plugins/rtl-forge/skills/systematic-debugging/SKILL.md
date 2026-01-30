---
name: systematic-debugging
description: 4단계 체계적 디버깅. 타이밍/CDC/합성 이슈 해결. "디버그", "왜 안돼", "에러 분석" 시 사용.
allowed-tools: Read, Bash, Task
---

# Systematic Debugging

체계적인 4단계 디버깅 프로토콜로 RTL 설계 이슈를 해결합니다.

## 사용 시점

- 합성/시뮬레이션 실패 디버깅
- 타이밍 위반 분석
- 기능 불일치 추적
- 예상치 못한 동작 분석

## AI 역할 범위

| ✅ 가능 | ❌ 불가능 |
|---------|----------|
| Questa 로그 분석 | 합성 (DC 없음) |
| 파형 덤프 분석 (WLF) | STA (Primetime 없음) |
| 에러 메시지 파싱 | 게이트 레벨 시뮬레이션 |
| 문서 기반 수정 제안 | 물리적 배치/라우팅 |
| 어서션 디버깅 | 파워 분석 |
| 커버리지 분석 | FPGA 구현 |

## 4단계 디버깅 프로토콜

### Phase 1: Root Cause Analysis (근본 원인 분석)

**목표**: 문제의 정확한 원인 파악

#### 1.1 에러 메시지 완전히 읽기
```
❌ 안 좋은 예: "synthesis error 발생"
✅ 좋은 예: "Error: Multi-driven net 'data_q' at line 45 and line 67"
```

**체크리스트**:
- [ ] 전체 에러 메시지 복사
- [ ] 파일명과 라인 번호 확인
- [ ] 관련된 모든 경고 메시지 수집

#### 1.2 일관된 재현 확인
```bash
# 3번 이상 반복 실행하여 재현성 확인 (Questa)
vlog -sv rtl/*.sv tb/*.sv && vsim -c work.tb -do "run -all; quit"
vlog -sv rtl/*.sv tb/*.sv && vsim -c work.tb -do "run -all; quit"
vlog -sv rtl/*.sv tb/*.sv && vsim -c work.tb -do "run -all; quit"
```

**체크리스트**:
- [ ] 동일한 조건에서 3회 재현
- [ ] 재현율 기록 (3/3, 2/3 등)
- [ ] 비결정적이면 랜덤 시드 확인

#### 1.3 최근 변경 확인
```bash
# 마지막 정상 동작 시점 확인
git log --oneline -10
git diff HEAD~5

# 특정 파일의 변경 이력
git log -p -- path/to/module.sv
```

**체크리스트**:
- [ ] 마지막 정상 커밋 식별
- [ ] 변경된 라인 검토
- [ ] 이슈 발생 시점과 변경 시점 대조

### Phase 2: Pattern Analysis (패턴 분석)

**목표**: 동작하는 사례와 비교하여 차이점 발견

#### 2.1 동작하는 예제와 비교
```systemverilog
// 동작하는 모듈
module working_fifo (
  input  logic clk,
  input  logic rst_n,
  input  logic wr_en,
  output logic full
);
  // ...
endmodule

// 문제가 있는 모듈
module broken_fifo (
  input  logic clk,
  input  logic rst_n,
  input  logic wr_en,
  output logic full  // ← 여기는 무엇이 다른가?
);
  // ...
endmodule
```

**비교 포인트**:
| 항목 | 동작 O | 동작 X | 차이점 |
|------|--------|--------|--------|
| 리셋 타입 | async | sync | ✓ |
| 신호 초기화 | 있음 | 없음 | ✓ |
| 클럭 도메인 | 단일 | 다중 | ✓ |

#### 2.2 레퍼런스 설계 참조
```
rtl-architect 에이전트 호출:
- 표준 디자인 패턴과 비교
- 검증된 CDC 구조 확인
- 합성 가이드라인 검토
```

**참조 소스**:
- 동일 프로젝트 내 유사 모듈
- 공식 IP 레퍼런스 디자인
- IEEE 표준 권장사항

### Phase 3: Hypothesis (가설 검증)

**목표**: 하나씩 변경하며 원인 좁혀가기

#### 3.1 단일 변경 원칙
```
⚠️ 금지: 동시에 여러 곳 수정
✅ 권장: 한 번에 한 가지만 변경
```

**변경 추적 템플릿**:
```markdown
## Hypothesis #1
- **변경 내용**: `full` 신호를 레지스터로 변경
- **예상 결과**: 조합 루프 제거 예상
- **실제 결과**: [테스트 후 기록]
- **결론**: [PASS/FAIL/PARTIAL]
```

#### 3.2 결과 예측
```
변경 전에 반드시 예측하고 기록:
- 이 변경으로 무엇이 달라질까?
- 성공하면 어떤 신호가 바뀔까?
- 실패하면 어떤 에러가 나올까?
```

**예측 기록 예시**:
```yaml
hypothesis: "wr_ptr을 Gray 코드로 변경"
predicted_outcome:
  success: "CDC violation 경고 사라짐"
  failure: "기능 불일치 발생"
actual_outcome: "[실행 후 기록]"
```

#### 3.3 이진 탐색 전략
```
변경 범위가 클 때:
1. 변경 사항을 절반씩 되돌림
2. 각 단계에서 테스트
3. 문제 구간 좁혀감

git bisect start
git bisect bad HEAD
git bisect good v1.0.0
# git이 자동으로 이진 탐색
```

### Phase 4: Fix (분류 기반 수정)

**수정 워크플로우는 변경 분류에 따라 달라집니다.**

#### 4.1 변경 분류 확인
```
scripts/classify-change.mjs가 자동 분류:
- TRIVIAL/MINOR → 바로 수정 + 린트 검증
- MAJOR → /approve-change 후 수정
- ARCHITECTURAL → Ralplan 루프 필요
```

#### 4.2 수정 및 즉시 검증

```bash
# 수정 후 자동 린트 (PostToolUse hook)
verilator --lint-only -Wall {file}.sv

# 시뮬레이션 재실행
vsim -c work.{tb} -do "run -all; quit"

# 회귀 테스트
vsim -c work.tb_top -do "run -all; quit"
```

#### 4.3 Verify-and-Claim 게이트

수정 완료 주장 전 반드시:
1. **IDENTIFY**: 무엇을 증명할 것인가?
2. **RUN**: 도구 실행
3. **READ**: 출력 확인
4. **VERIFY**: 기준 충족?
5. **CLAIM**: 증거와 함께 주장

**통과 기준**:
| 검증 단계 | 기준 | 결과 |
|----------|------|------|
| 린트 | 0 errors | [ ] |
| 시뮬레이션 | all PASS | [ ] |
| 회귀 | 0 new failures | [ ] |
| 어서션 | 0 failures | [ ] |
```

## Questa 디버깅 명령어

Mentor Graphics Questa를 사용한 체계적 디버깅 명령어 모음입니다.

### 시뮬레이션 로그 분석
```bash
# 기본 시뮬레이션 + 로그 저장
vsim -c work.tb_top -do "run -all" | tee sim.log

# 상세 로그 (모든 메시지 출력)
vsim -c work.tb_top +verbose -do "run -all; quit -f"

# 특정 시간까지만 실행
vsim -c work.tb_top -do "run 1000ns; quit -f"
```

### 파형 덤프 및 분석
```bash
# WLF 파형 덤프
vsim work.tb_top -do "add wave *; run -all; write format wave dump.wlf; quit"

# 특정 신호만 덤프
vsim work.tb_top -do "add wave /tb_top/dut/clk; add wave /tb_top/dut/data_*; run -all"

# 파형 뷰어 열기 (GUI)
vsim -view dump.wlf
```

### 어서션 디버깅
```bash
# 어서션 활성화 + 디버그 모드
vsim -c work.tb_top -assertdebug -do "run -all; assertion report; quit"

# 어서션 실패 시 중단
vsim -c work.tb_top -onfinish stop -do "run -all"

# 어서션 커버리지 수집
vsim -c work.tb_top -coverage -assertcover -do "run -all; coverage report"
```

### 커버리지 분석
```bash
# 코드 커버리지 수집
vsim -c work.tb_top -coverage -do "run -all; coverage save coverage.ucdb; quit"

# 커버리지 보고서 생성
vcover report coverage.ucdb

# HTML 보고서
vcover report -html coverage.ucdb
```

### 디버깅 유틸리티
```bash
# 특정 신호 모니터링 (force/release)
vsim work.tb_top -do "force /tb_top/dut/reset 1 0, 0 100ns; run 200ns"

# 신호 값 검사 (examine)
vsim -c work.tb_top -do "run 50ns; examine /tb_top/dut/state; quit"

# 브레이크포인트 설정
vsim work.tb_top -do "when {data_valid == 1} {stop}; run -all"
```

### 에러 격리 전략
```bash
# 1단계: 최소 테스트벤치로 재현
vsim -c work.tb_minimal -do "run -all"

# 2단계: 특정 테스트 케이스만 실행
vsim -c work.tb_top -gTEST_ID=5 -do "run -all"

# 3단계: 랜덤 시드 고정 (재현성)
vsim -c work.tb_top -sv_seed 12345 -do "run -all"
```

### 로그 파싱 패턴
```bash
# 에러 메시지만 추출
grep "Error:" sim.log

# 타이밍 위반 검색
grep -i "setup\|hold" sim.log

# 어서션 실패 요약
grep "Assertion.*failed" sim.log | sort | uniq -c
```

## Circuit Breaker (차단기)

**규칙**: 3회 연속 실패 시 접근 방법 변경

### 실패 카운터
```
시도 1: [가설] → [결과: FAIL]
시도 2: [가설] → [결과: FAIL]
시도 3: [가설] → [결과: FAIL]

→ 🛑 CIRCUIT BREAKER 발동
```

### 대응 액션
```
3회 실패 시 다음 중 하나 선택:

1. 아키텍처 재검토
   → rtl-architect 에이전트 호출
   → "이 설계 접근이 맞는가?"

2. 동료 리뷰 요청
   → Task(rtl-review)
   → 신선한 관점에서 재분석

3. 문제 범위 축소
   → 더 작은 모듈로 분리
   → 각각 독립적으로 디버깅

4. 레퍼런스 재작성
   → 검증된 예제 기반으로 재구현
   → 점진적으로 기능 추가
```

## RTL 디버깅 전문 패턴

### 타이밍 위반 디버깅 (시뮬레이션 레벨)

#### 패턴 1: Setup Violation (어서션 기반)
```systemverilog
// 어서션으로 타이밍 체크
property setup_check;
  @(posedge clk) disable iff (!rst_n)
  $rose(data_valid) |-> ##[1:2] $stable(data);
endproperty
assert property (setup_check) else $error("Setup violation detected");

분석 단계:
1. Questa로 어서션 실패 로그 확인
   vsim -assertdebug -do "run -all; assertion report"

2. 파형에서 타이밍 관계 확인
   vsim -view dump.wlf  // GUI에서 신호 간격 측정

3. 조합 로직 깊이 측정
   → 10단 이상이면 파이프라인 추가 고려

해결책:
- 파이프라인 레지스터 삽입 (문서 승인 필요)
- 로직 재분배
- 테스트벤치에서 입력 타이밍 조정
```

#### 패턴 2: Hold Violation (시뮬레이션)
```systemverilog
// Hold 타임 체크 어서션
property hold_check;
  @(posedge clk) disable iff (!rst_n)
  $rose(capture_en) |-> $stable(data) [*2];
endproperty

분석 단계:
1. 어서션 실패 시점 파형 확인
2. 데이터 경로 지연 분석
3. 비동기 경로 여부 확인

해결책:
- 동기화 레지스터 체인 추가
- 테스트벤치에서 지연 추가
- 클럭 도메인 분리
```

### CDC (Clock Domain Crossing) 디버깅

#### 패턴 3: 메타스테빌리티
```systemverilog
// ❌ 문제: 단일 플롭 동기화
always_ff @(posedge clk_dst) begin
  data_sync <= data_src;  // 위험!
end

// ✅ 해결: 2-FF 동기화
always_ff @(posedge clk_dst) begin
  sync_ff1 <= data_src;
  sync_ff2 <= sync_ff1;
  data_sync <= sync_ff2;
end
```

**검증 방법**:
```bash
# Questa에서 파형으로 메타스테빌리티 확인
vsim work.tb_cdc -do "add wave /tb_cdc/sync_ff*; run -all; write format wave cdc.wlf"

# 어서션으로 CDC 위반 검출
# (SVA로 동기화 체인 검증)

# 또는 cdc-analyst 에이전트 호출
Task(subagent_type="rtl-forge:cdc-analyst",
     prompt="Verify all CDC paths in fifo_async.sv")
```

#### 패턴 4: Gray 코드 포인터 오류
```systemverilog
// ❌ 잘못된 Gray 변환
assign gray_ptr = (bin_ptr >> 1) ^ bin_ptr;  // LSB부터

// ✅ 올바른 Gray 변환
assign gray_ptr = bin_ptr ^ (bin_ptr >> 1);  // MSB부터
```

### 합성 이슈 디버깅

#### 패턴 5: Latch 생성
```systemverilog
// ❌ 조합 로직에 누락된 else → Latch!
always_comb begin
  if (sel == 2'b00) out = a;
  else if (sel == 2'b01) out = b;
  // sel == 2'b10, 2'b11일 때 out이 정의 안 됨!
end

// ✅ 모든 경우 커버
always_comb begin
  case (sel)
    2'b00: out = a;
    2'b01: out = b;
    default: out = '0;  // 명시적 디폴트
  endcase
end
```

#### 패턴 6: 다중 드라이버
```systemverilog
// ❌ 여러 always 블록에서 같은 신호 구동
always_ff @(posedge clk) data_q <= data_d;
always_ff @(posedge clk) data_q <= alt_data;  // 충돌!

// ✅ 하나의 always 블록에서만 구동
always_ff @(posedge clk) begin
  data_q <= sel ? alt_data : data_d;
end
```

## 워크플로우 다이어그램

```
디버깅 시작
    ↓
[Phase 1: Root Cause]
  - Questa 로그 분석
  - 재현성 확인
  - git diff 분석
    ↓
[Phase 2: Pattern]
  - 동작 예제 비교
  - 레퍼런스 확인
    ↓
[Phase 3: Hypothesis]
  - 단일 변경 가설
  - 결과 예측
  - 테스트 실행
    ↓
    성공? ──Yes──→ [Phase 4: Fix]
    ↓ No           1. 변경 문서 작성
    ↓              2. 사용자 리뷰
    실패 카운트++  3. /approve-change 대기
    ↓              4. RTL 수정
    3회 이상? ──Yes──→ [Circuit Breaker]  5. Questa 검증
    ↓ No              - 아키텍처 재검토         ↓
    ↓                 - 동료 리뷰         ✅ 완료
    Phase 3 반복      - 범위 축소
```

## 자동 트리거

다음 패턴에서 자동 활성화:
- "디버그해줘"
- "왜 안 되는지 분석"
- "에러 원인 찾아줘"
- "타이밍 위반 해결"
- "CDC 문제 디버깅"

## 출력 형식

```markdown
# Debugging Report

## Phase 1: Root Cause Analysis
- **에러 메시지**: [Questa 로그 전체 메시지]
- **재현율**: 3/3 (100%)
- **마지막 정상 커밋**: abc1234 (2024-01-20)
- **변경 라인**: module.sv:45-67
- **Questa 명령어**: `vsim -c work.tb -do "run -all"`

## Phase 2: Pattern Analysis
| 항목 | 동작 O | 동작 X | 차이 |
|------|--------|--------|------|
| ... | ... | ... | ✓ |

## Phase 3: Hypothesis Testing
### Hypothesis #1
- 변경: [구체적 변경]
- 예상: [예측]
- 결과: FAIL
- 다음: [다음 시도]

### Hypothesis #2
- 변경: [구체적 변경]
- 예상: [예측]
- 결과: PASS ✅

## Phase 4: Fix (문서 기반)
### 4.1 변경 문서 작성됨
- 파일: `docs/changes/20260124-fix-issue.md`

### 4.2 사용자 리뷰 대기
📋 **Review Request**: 변경 문서를 검토해주세요.
승인하시면 `/approve-change` 명령으로 RTL 수정을 진행합니다.

### 4.3 승인 후 검증 (Questa)
- [✓] Questa 시뮬레이션 통과
- [✓] 회귀 테스트 0 failures
- [✓] 어서션 검증 통과
- [✓] 커버리지 >90%

## 근본 원인
[한 문장으로 요약]

## 제안된 수정 (승인 필요)
```diff
[패치 내용]
```

## 재발 방지책
- [ ] SVA 어서션 추가
- [ ] 테스트 케이스 추가
- [ ] 문서 업데이트
```

## 예제

### 타이밍 위반 디버깅 예시 (Questa 기반)

```bash
# Phase 1: 에러 확인 (시뮬레이션)
$ vlog -sv rtl/multiplier.sv tb/tb_multiplier.sv
$ vsim -c work.tb_multiplier -do "run -all" | tee sim.log
Error: Setup time violation detected in assertion at 150ns

# Phase 2: 동작하는 디자인과 비교
$ git show v1.0:rtl/multiplier.sv
# → 이전 버전은 2단 파이프라인이었음

# Phase 3: 가설 - 파이프라인 복원
# 1. 변경 문서 작성
$ cat > docs/changes/20260124-restore-pipeline.md
# 2. 사용자 승인 대기
# 3. /approve-change 후 코드 수정

# Phase 4: 검증 (Questa)
$ vlog -sv rtl/multiplier.sv tb/tb_multiplier.sv
$ vsim -c work.tb_multiplier -assertdebug -do "run -all; assertion report"
Info: All assertions passed
✅ 성공
```

## 관련 스킬

- `rtl-review`: 전체 모듈 분석
- `timing-diagram`: 타이밍 시각화
- `rtl-analyze`: Slang 기반 신호 추적
- `sim-first-workflow`: Simulation-First 워크플로우
- `verify-and-claim`: 결정론적 검증 게이트

## 참고 자료

- IEEE 1364/1800 SystemVerilog 표준
- Synopsys Design Compiler User Guide
- Cadence CDC Verification Methodology
- "RTL Modeling with SystemVerilog for Simulation and Synthesis" (Stuart Sutherland)
