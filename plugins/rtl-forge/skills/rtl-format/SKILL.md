---
name: rtl-format
description: Verilog/SystemVerilog 파일을 RTL 코딩 표준에 맞게 자동 포매팅 (sonnet 에이전트 위임)
user-invocable: true
allowed-tools:
  - Read
  - Glob
  - Task
---

# RTL Format (Dispatcher)

Verilog/SystemVerilog 파일을 RTL 코딩 표준에 맞게 자동 포매팅한다.
실제 포매팅은 sonnet 에이전트에게 위임하여 18개 규칙을 Phase별로 정확히 적용한다.

## Input

```
/rtl-format <path>
```

- `<path>`가 `.v` 파일이면 해당 파일만 포매팅
- `<path>`가 디렉토리면 `**/*.v` 전부 포매팅
- `<path>` 생략 시 사용자에게 경로를 물어본다

## Execution

1. 대상 `.v` 파일을 Glob으로 수집한다
2. 규칙 파일(`rules.md`)을 Read로 읽는다
   - 경로: 이 SKILL.md와 같은 디렉토리의 `rules.md`
3. **sonnet 에이전트를 Task로 spawn**하여 포매팅을 위임한다:

```
Task(
  subagent_type = "oh-my-claudecode:executor",
  model = "sonnet",
  mode = "bypassPermissions",
  prompt = """
당신은 RTL Format 전문 에이전트입니다.
아래 규칙 문서를 **정확히** 따라 대상 파일을 포매팅하세요.

[rules.md 전체 내용을 여기에 포함]

대상 파일: [수집된 .v 파일 경로 목록]

실행 순서:
1. 각 파일을 Read로 읽는다
2. Phase 1 (공백 정리: Rule 1,2,9,10) 적용 → 확인
3. Phase 2 (세로정렬: Rule 3,4,5,6,7) 적용 → 확인
4. Phase 3 (연산자/배치: Rule 8,11) 적용 → 확인
5. Phase 4 (경고: Rule 12~18) → 경고 목록 수집
6. Write로 저장
7. 결과 요약 + 경고 목록 반환

중요:
- 18개 규칙 전부 빠짐없이 적용
- Phase를 건너뛰지 않는다
- 각 Phase 완료 후 확인 단계를 거친다
- 로직 변경 금지 (순수 포매팅만)
"""
)
```

4. 에이전트 결과를 받아 사용자에게 요약을 출력한다

## Output

에이전트가 반환한 결과를 아래 형식으로 출력한다:

```
RTL Format Complete
───────────────────────────────────
  qs_mipi_txl_csi_frame_ctrl.v    47 lines changed
  qs_mipi_txl_lane_distributor.v  23 lines changed
───────────────────────────────────
  2 files formatted, 70 lines changed

Warnings:
  ⚠ Rule 13: i_bank_select — CDC 신호명에 _{src}2{dst} suffix 없음
  ⚠ Rule 17: r_pulse — auto-clear/set 순서 뒤바뀜
```

## Notes

- 포매팅은 로직을 변경하지 않으므로 RTL 협의 프로토콜(승인) 없이 바로 적용한다
- Rule 6 (인스턴스 포트 연결)에서 외부 모듈 정의가 필요한 경우, 접근 가능한 범위 내에서 최대한 적용한다
- sonnet 모델이 세로정렬(Phase 2)과 RTL 의미 분석(Phase 4)에 필요한 최소 사양이다
