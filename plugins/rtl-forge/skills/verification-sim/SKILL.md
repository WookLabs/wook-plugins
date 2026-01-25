---
name: verification-sim
description: 시뮬레이션 기반 검증. Questa/VCS/Xcelium 지원. 커버리지, 어서션 검사.
allowed-tools: Read, Bash
---

# Verification Simulation (시뮬레이션 기반 검증)

## 핵심 원칙

**Iron Law: 증거 없이 완료 주장 금지**

## 지원 시뮬레이터

| 시뮬레이터 | 벤더 | 특징 |
|-----------|------|------|
| **Questa** | Siemens (Mentor) | UVM 최적화, CDC 통합 |
| **VCS** | Synopsys | 성능 우수, Verdi 연동 |
| **Xcelium** | Cadence | 병렬 컴파일, 저전력 검증 |

---

## Questa 명령어

### 컴파일
```bash
vlog -sv -work work {file}.sv
vlog -sv -work work {testbench}.sv
```

### 시뮬레이션 실행
```bash
vsim -c work.{testbench} -do "run -all; quit"
```

### 커버리지
```bash
vlog -sv -cover bcesfx {file}.sv
vsim -c -coverage work.{testbench} -do "run -all; coverage report; quit"
```

### 어서션 검사
```bash
vsim -c work.{testbench} -assertdebug -do "run -all; quit"
```

---

## VCS 명령어 (Synopsys)

### 컴파일 + 시뮬레이션
```bash
# 컴파일
vcs -sverilog -full64 -debug_access+all {file}.sv {testbench}.sv -o simv

# 시뮬레이션 실행
./simv

# GUI 디버깅 (Verdi)
./simv -gui
```

### 커버리지
```bash
# 커버리지 수집
vcs -sverilog -full64 -cm line+cond+fsm+tgl+branch {file}.sv {testbench}.sv -o simv
./simv -cm line+cond+fsm+tgl+branch

# 커버리지 리포트
urg -dir simv.vdb -report coverage_report
```

### 어서션 검사
```bash
vcs -sverilog -full64 -assert svaext {file}.sv {testbench}.sv -o simv
./simv +fsdb+sva_success
```

### 파형 덤프 (FSDB for Verdi)
```bash
./simv +fsdbfile+dump.fsdb
verdi -ssf dump.fsdb &
```

---

## Xcelium 명령어 (Cadence)

### 컴파일 + 시뮬레이션
```bash
# 단일 단계 (컴파일 + 시뮬레이션)
xrun -sv {file}.sv {testbench}.sv

# 분리 단계
xmvlog -sv {file}.sv {testbench}.sv
xmelab work.{testbench}
xmsim work.{testbench}
```

### 커버리지
```bash
xrun -sv -coverage all -covoverwrite {file}.sv {testbench}.sv
imc -load cov_work/scope/test &  # IMC GUI
```

### 어서션 검사
```bash
xrun -sv -assert -propfile_severity {file}.sv {testbench}.sv
```

### 파형 덤프 (SHM for SimVision)
```bash
xrun -sv -access +rwc -input run.tcl {file}.sv {testbench}.sv
# run.tcl: database -open waves.shm; probe -create -all -depth all; run; exit
simvision waves.shm &
```

---

## 시뮬레이터 선택 가이드

```
프로젝트 환경 확인:
├── Questa 설치됨? → Questa 사용
├── VCS 설치됨? → VCS 사용 (Verdi 연동 시 추천)
└── Xcelium 설치됨? → Xcelium 사용 (대규모 병렬 빌드 시 추천)
```

### 환경 변수 확인
```bash
# Questa
which vsim

# VCS
which vcs

# Xcelium
which xrun
```

## 검증 체크리스트

### 컴파일 단계
- [ ] vlog 컴파일 성공
- [ ] Error 0개
- [ ] Warning 검토 완료

### 시뮬레이션 단계
- [ ] 모든 테스트 케이스 PASS
- [ ] Assertion 위반 0개
- [ ] Timeout 없음

### 커버리지 단계
- [ ] Line coverage ≥ 95%
- [ ] Branch coverage ≥ 90%
- [ ] FSM coverage = 100%

## 증거 템플릿

```markdown
## 검증 완료 보고서

### 모듈: {module_name}
### 일시: {YYYY-MM-DD HH:MM}

### 1. 컴파일
```
$ vlog -sv -work work {module}.sv
-- Compiling module {module}
-- Compiling completed: Errors: 0, Warnings: 0
```

### 2. 시뮬레이션
```
$ vsim -c work.{tb} -do "run -all; quit"
# Loading work.{tb}
# ** Note: All tests PASSED
# ** No assertion failures
```

### 3. 커버리지
```
$ coverage report
Line: 97%
Branch: 92%
FSM: 100%
```

### 결론: ✅ 검증 통과 / ❌ 재검증 필요
```

## Red Flags
- "should work"
- "looks correct"
- 검증 실행 전 만족감 표현

## 트리거 키워드
- "시뮬레이션"
- "검증"
- "테스트"
- "시뮬 돌려"

## AI 역할 범위
| ✅ 가능 | ❌ 불가능 |
|---------|----------|
| Questa 시뮬레이션 실행 | 합성 (DC, Vivado 없음) |
| 커버리지 분석 | STA (Primetime 없음) |
| 어서션 검사 | P&R |

## 관련 스킬
- systematic-debugging: 시뮬 에러 디버깅
- rtl-review: 종합 코드 리뷰
