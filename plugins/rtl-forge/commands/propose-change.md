---
description: RTL 변경 제안을 등록합니다 (pending-changes에 추가)
---

# Propose Change

RTL 코드 변경을 제안하는 명령어입니다.

## Usage

```
/propose-change --file <rtl-file> --type <add|modify|delete>
/propose-change --file top_module.sv --type modify --reason "FSM 최적화"
```

## Description

이 명령어는 RTL 파일 변경 제안을 `pending-changes`에 등록합니다.
**직접 파일을 수정하지 않고, 승인 프로세스를 거칩니다.**

### 필수 정보

모든 변경 제안에는 다음이 필수입니다:

1. **변경 사유** (reason)
   - 왜 이 변경이 필요한가?
   - 어떤 문제를 해결하는가?

2. **BEFORE 타이밍 다이어그램**
   ```
           clk     __|--|__|--|__|--|__|--|__|--|
           현재동작 [현재 신호 동작]
   ```

3. **AFTER 타이밍 다이어그램**
   ```
           clk     __|--|__|--|__|--|__|--|__|--|
           제안동작 [제안 신호 동작]
   ```

4. **영향 분석**
   - 연결된 모듈 목록
   - 인터페이스 변경 여부
   - 타이밍 영향

5. **제안 코드**
   - 실제 RTL 코드 (Verilog/SystemVerilog)

### 변경 유형

| Type | 설명 |
|------|------|
| add | 새 모듈/신호/로직 추가 |
| modify | 기존 코드 수정 |
| delete | 코드 삭제 |

### 제안 후 프로세스

1. 제안이 `pending-changes`에 등록
2. `rtl-critic`이 자동으로 검토
3. 사용자에게 승인 요청 표시
4. `/approve-change` 또는 `/reject-change`로 결정

## Files

- 대기 목록: `.omc/rtl-forge/pending-changes.json`

## Note

이 명령어는 주로 `rtl-coder` 에이전트가 내부적으로 사용합니다.
사용자가 직접 호출할 수도 있지만, 일반적으로 rtl-coder를 통한 제안을 권장합니다.
