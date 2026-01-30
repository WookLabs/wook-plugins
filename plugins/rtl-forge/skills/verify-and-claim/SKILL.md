---
name: verify-and-claim
description: 결정론적 검증 게이트. 도구 실행 증거 없이 완료 주장 금지. "검증해", "확인해", "verify" 시 사용.
allowed-tools: Read, Bash
---

# Verify-and-Claim (결정론적 검증)

## 핵심 원칙

**Dual Iron Law (v2.1)**

1. **Iron Law #1: 사고 없이 코드 수정 금지** — Logic reasoning 없이 RTL 코드를 수정하지 않는다 (MINOR-LOGIC 이상).
2. **Iron Law #2: 증거 없이 완료 주장 금지** — 문서가 아닌 시뮬레이션 결과가 증거다.

---

## IDENTIFY → RUN → READ → VERIFY → CLAIM

### Step 1: IDENTIFY (무엇을 증명할 것인가?)

| 주장하려는 것 | 필요한 도구 |
|--------------|------------|
| "린트 통과" | Verilator 또는 Slang |
| "문법 정확" | Slang --lint-only |
| "시뮬 통과" | Questa/VCS/Xcelium |
| "어서션 통과" | 시뮬레이터 + SVA |
| "커버리지 달성" | 시뮬레이터 + 커버리지 옵션 |
| "회귀 통과" | 전체 테스트 스위트 |
| "로직 검토 완료" | logic-reasoning 스킬 실행 결과 (Logic Memo) |

### Step 2: RUN (도구 실행)

```bash
# 린트 검증
verilator --lint-only -Wall {file}.sv
# 또는
slang --lint-only {file}.sv

# 시뮬레이션 검증 (Questa)
vlog -sv -work work {files}
vsim -c work.{tb} -do "run -all; quit"

# 시뮬레이션 검증 (VCS)
vcs -sverilog -full64 {files} -o simv && ./simv

# 시뮬레이션 검증 (Xcelium)
xrun -sv {files}

# 커버리지 검증
vsim -c -coverage work.{tb} -do "run -all; coverage report; quit"
```

### Step 3: READ (출력 확인)

도구 출력에서 확인할 패턴:

| 도구 | 성공 패턴 | 실패 패턴 |
|------|----------|----------|
| Verilator | `0 errors` | `%Error` |
| Slang | exit code 0 | `error:` |
| Questa | `All tests PASSED` | `** Error`, `FAILED` |
| VCS | `$finish` (정상) | `Error-` |
| Xcelium | `xmsim: *W` (경고만) | `*E` |

### Step 4: VERIFY (기준 충족?)

| 검증 유형 | 통과 기준 |
|----------|----------|
| 린트 | 0 errors (warnings 허용) |
| 시뮬레이션 | 모든 테스트 PASS, 0 assertion failures |
| 커버리지 | Line ≥95%, Branch ≥90%, FSM = 100% |
| 회귀 | 0 new failures |

### Step 4.5: VERIFY Logic Memo (MINOR-LOGIC 이상)

MINOR-LOGIC, MAJOR, ARCHITECTURAL 변경 시 추가 검증:

| 검증 항목 | 확인 내용 |
|----------|----------|
| Logic Memo 존재 | 로직 추론 Q&A 기록이 있는가? |
| 사고 깊이 적절 | 변경 레벨에 맞는 Tier의 분석이 수행되었는가? |
| 결론 명확 | 추론 결과가 코드 변경과 일치하는가? |

### Step 5: CLAIM (증거와 함께 주장)

```markdown
## 검증 결과

### ✅ 린트 통과
```
$ verilator --lint-only -Wall rtl/fifo_ctrl.sv
%Warning-UNUSED: rtl/fifo_ctrl.sv:45:... (suppressed)
Errors: 0, Warnings: 1 (suppressed)
```

### ✅ 시뮬레이션 통과
```
$ vsim -c work.tb_fifo -do "run -all; quit"
# ** Note: All 15 tests PASSED
# ** Note: 0 assertion failures
# Time: 50000 ns  Iteration: 0
```

**결론: 구현 완료** (린트 clean, 시뮬 15/15 pass)
```

---

## Red Flags (즉시 중단 신호)

다음 표현이 나오면 CLAIM 전에 반드시 도구 실행:

- "should work" / "아마 될 거예요"
- "looks correct" / "맞아 보여요"
- "I believe" / "제 생각에는"
- 도구 실행 로그 없이 "완료"
- 이전 세션의 캐시된 결과 인용
- 로직 메모 없이 MINOR-LOGIC 이상 변경 완료 주장
- Tier 1 분석만으로 MAJOR 변경 완료 주장

## Confidence Scoring

모든 분석 결과에 신뢰도 점수 부여:

| 점수 | 의미 | 보고 여부 |
|------|------|----------|
| 90-100 | 도구 실행으로 확인 | ✓ 보고 |
| 80-89 | 높은 확신 (패턴 매칭) | ✓ 보고 |
| 60-79 | 중간 확신 | ⚠️ 주의사항 포함 |
| < 60 | 낮은 확신 | ✗ 보고하지 않음 |

**규칙: 신뢰도 80 미만 결과는 보고하지 않는다.**

---

## 트리거 키워드

- "검증해", "확인해", "verify"
- "증거 보여줘", "prove it"
- "정말 통과했어?"

## 관련 스킬

- `sim-first-workflow`: 메인 워크플로우 (이 스킬을 포함)
- `systematic-debugging`: 검증 실패 시 디버깅
- `rtl-review`: 코드 리뷰 시 검증 포함
- `logic-reasoning`: 로직 추론 (Dual Iron Law #1 충족)
