---
name: rtl-analyze
description: RTL 버그/이슈의 근본 원인을 분석하고 cycle-by-cycle 타이밍 다이어그램으로 설명
user-invocable: true
allowed-tools:
  - Read
  - Glob
  - Grep
  - Bash
  - AskUserQuestion
---

# RTL Analyze

RTL 버그 또는 이슈의 근본 원인을 분석하고, cycle-by-cycle ASCII 타이밍 다이어그램으로 현재 동작을 설명한다.

**이 스킬은 분석만 수행한다. 수정 제안은 `/rtl-plan`, 적용은 `/rtl-apply`에서 한다.**

## Input

```
/rtl-analyze <대상 파일 또는 모듈명> <문제 설명>
```

- `<대상>`: `.v` 파일 경로, 모듈명, 또는 신호명
- `<문제 설명>`: 증상, 파형에서 관찰된 현상, 에러 메시지 등
- 생략 시 사용자에게 물어본다

## Execution Flow

### Phase 1: 대상 식별

1. 지정된 파일/모듈을 Read로 읽는다
2. 관련 모듈 계층을 Grep/Glob으로 탐색한다
3. 문제와 관련된 신호, always 블록, assign문을 식별한다

### Phase 2: 근본 원인 분석

아래 순서로 원인을 추적한다:

1. **문제 신호 역추적** — 출력 → 입력 방향으로 dependence chain 추적
2. **클럭 도메인 확인** — 문제 신호가 CDC 경계를 넘는지 확인
3. **FSM 상태 분석** — 관련 FSM이 있으면 상태 전이 조건 점검
4. **타이밍 관계** — 관련 신호들의 cycle-by-cycle 타이밍 관계 파악
5. **영향 범위** — fanout을 추적하여 downstream에 미치는 영향 식별

### Phase 3: 타이밍 다이어그램 제시

분석 결과를 cycle-by-cycle ASCII 타이밍 다이어그램으로 표현한다.

## Timing Diagram Format

**반드시 아래 형식을 따른다:**

```
        ┌───┐   ┌───┐   ┌───┐   ┌───┐   ┌───┐
clk     ┘   └───┘   └───┘   └───┘   └───┘   └───
        cycle 0 │cycle 1│cycle 2│cycle 3│cycle 4

        ────────┬───────────────────────────────
i_valid         │▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
                └───────────────────────────────

        ────────────────┬───────────────────────
o_data  (current)       │  DATA_A  │  DATA_B  │
                        └───────────────────────
```

**규칙:**
- 클럭은 항상 첫 줄에 표시
- cycle 번호를 명시
- 문제 발생 지점에 `↑` 또는 화살표로 표시
- 1-bit 신호: `▓`(high), `─`(low) 표현
- multi-bit 신호: `│ VALUE │` 표현
- 변화 시점: `┬`(rising), `┴`(falling) 표현

## Analysis Output Format

분석 결과를 아래 구조로 출력한다:

```
RTL Analysis: <모듈명>
═══════════════════════════════════════════════════

1. 문제 요약
   - 증상: <관찰된 현상>
   - 위치: <파일:라인>

2. 근본 원인
   - <원인 설명>
   - 관련 코드:
     ```verilog
     <해당 코드 블록>
     ```

3. 현재 동작 (타이밍 다이어그램)
   <cycle-by-cycle 다이어그램>

4. 영향 범위
   - 직접 영향: <직접 연결된 신호/모듈>
   - 간접 영향: <downstream 모듈>
   - CDC 관련: <해당 시 CDC 포인트 명시>

5. 다음 단계
   → /rtl-plan 으로 수정 계획 수립
═══════════════════════════════════════════════════
```

## Analysis Checklist

분석 시 아래 항목을 점검한다:

| 점검 항목 | 설명 |
|-----------|------|
| 클럭 도메인 | 문제 신호의 클럭 도메인, CDC 경계 여부 |
| 리셋 조건 | 리셋 누락, 비동기 리셋 동기화 여부 |
| FSM 상태 | dead state, missing default, 탈출 조건 |
| 비트폭 | width mismatch, implicit extension/truncation |
| Latch 추론 | 불완전한 if/case로 인한 의도하지 않은 래치 |
| Sensitivity list | `always @*` 미사용, 누락된 신호 |
| Blocking/Non-blocking | sequential에서 `=` 사용, combinational에서 `<=` 사용 |
| Combinational loop | 조합 로직 피드백 루프 |

## Constraints

- **수정하지 않는다** — 분석과 설명만 한다
- **추측하지 않는다** — 코드에서 확인할 수 있는 사실만 기술한다
- **타이밍 다이어그램 필수** — 모든 분석에 타이밍 다이어그램을 포함한다
- **영향 범위 필수** — 문제가 미치는 downstream 영향을 반드시 명시한다
