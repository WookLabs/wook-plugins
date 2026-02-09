---
name: rtl-apply
description: 승인된 RTL 수정 계획을 적용하고 rtl-format으로 자동 포매팅
user-invocable: true
allowed-tools:
  - Read
  - Edit
  - Write
  - Glob
  - Grep
  - Bash
---

# RTL Apply

`/rtl-plan`에서 승인된 수정 계획을 코드에 적용하고, `rtl-format` 규칙으로 자동 포매팅한다.

**이 스킬은 승인된 수정만 적용한다. 미승인 수정은 절대 적용하지 않는다.**

## Input

```
/rtl-apply
```

- `/rtl-plan`에서 승인된 수정 계획이 컨텍스트에 있어야 한다
- 승인된 plan 없이 단독 호출하면, `/rtl-plan`을 먼저 실행하라고 안내한다

## Execution Flow

### Phase 1: 승인 확인

1. 컨텍스트에서 승인된 수정 계획을 확인한다
2. 미승인 항목이 있으면 적용하지 않고 사용자에게 알린다
3. 다중 수정인 경우, 승인된 것만 순서대로 적용한다

### Phase 2: 수정 적용

승인된 수정을 한 번에 하나씩 적용한다:

1. 대상 파일을 Read로 읽는다
2. Edit으로 수정을 적용한다
3. 수정 직후 해당 파일에 rtl-format 규칙을 적용한다:
   - 2-space 들여쓰기
   - `if(` 붙여쓰기
   - 2의 배수 정렬 그리드
   - 포트 선언 세로정렬 (인스턴스 파생)
   - 신호 선언 세로정렬
   - 인스턴스 포트 연결 세로정렬
   - one-liner if-else 세로정렬
   - `||` `&&` → `|` `&`
   - trailing whitespace 제거
   - 파일 끝 빈 줄 1개

### Phase 3: 검증

적용 후 기본 검증을 수행한다:

1. **Syntax 검사** — 수정된 파일이 문법적으로 올바른지 확인
   - Verilator가 있으면 `verilator --lint-only` 실행
   - 없으면 기본 패턴 검사 (괄호 매칭, begin-end 매칭)
2. **일관성 검사** — 수정으로 인한 명백한 불일치 확인
   - 포트 연결 비트폭 일치
   - 선언된 신호가 실제 사용되는지
   - 인스턴스 포트명이 모듈 정의와 일치하는지

### Phase 4: 결과 보고

## Output Format

```
RTL Apply Complete
═══════════════════════════════════════════════════

  수정 1/N: qs_mipi_txl_csi_frame_ctrl.v
  ─────────────────────────────────────────────
    Line 123: assign o_valid = i_valid;
           →  always @(posedge clk) r_valid <= i_valid;
              assign o_valid = r_valid;
    + rtl-format 적용 (3 lines formatted)
    ✓ Syntax OK

  수정 2/N: qs_mipi_txl_ip_top.v
  ─────────────────────────────────────────────
    Line 456: .o_valid ( o_valid )
           →  .o_valid ( w_delayed_valid )
    + rtl-format 적용 (1 line formatted)
    ✓ Syntax OK

═══════════════════════════════════════════════════
  N개 수정 적용 완료
  다음 단계: 시뮬레이션으로 기능 검증
═══════════════════════════════════════════════════
```

## Safety Rules

| 규칙 | 설명 |
|------|------|
| 승인된 수정만 적용 | plan에서 승인받지 않은 수정은 절대 적용하지 않는다 |
| 한 번에 하나씩 | 다중 수정을 동시에 적용하지 않는다 |
| 원본 보존 | 수정 전 원본 코드를 출력에 포함하여 rollback 가능하게 한다 |
| 포매팅 자동 적용 | 모든 수정 후 rtl-format 규칙을 자동 적용한다 |
| 추가 변경 금지 | 승인된 내용 외에 "개선"이나 "정리"를 하지 않는다 |

## Error Handling

| 상황 | 동작 |
|------|------|
| 승인된 plan 없음 | `/rtl-plan`을 먼저 실행하라고 안내 |
| 대상 파일 없음 | 에러 메시지와 함께 중단 |
| Edit 실패 (코드 변경됨) | 최신 코드를 다시 읽고, 수정 위치를 재확인 후 사용자에게 알림 |
| Syntax 검사 실패 | 수정을 유지하되, 경고와 함께 문제 위치를 보고 |
| 포매팅 충돌 | rtl-format 규칙이 수정 의도와 충돌하면, 수정 의도를 우선 |
