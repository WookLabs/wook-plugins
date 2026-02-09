---
name: rtl-apply
description: 승인된 RTL 수정 계획을 적용하고 rtl-format으로 자동 포매팅
user-invocable: true
---

# /rtl-apply

`/rtl-plan`에서 승인된 수정 계획을 코드에 적용하고, rtl-format 규칙으로 자동 포매팅합니다.

## Usage

```
/rtl-apply
```

- `/rtl-plan`에서 승인된 수정 계획이 필요합니다
- 승인된 plan 없이 호출하면 `/rtl-plan`을 먼저 실행하라고 안내합니다

## What It Does

1. 승인된 수정 계획을 확인
2. 한 번에 하나씩 수정 적용
3. 각 수정 후 rtl-format 자동 적용
4. Syntax 검사 (Verilator 또는 패턴 검사)
5. 적용 결과 요약 보고

**승인된 수정만 적용합니다. 추가 "개선"이나 "정리"는 하지 않습니다.**
