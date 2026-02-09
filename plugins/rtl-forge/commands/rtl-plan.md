---
name: rtl-plan
description: RTL 수정 계획을 수립하고 line-by-line diff와 수정 후 타이밍 다이어그램을 제시
user-invocable: true
---

# /rtl-plan

RTL 수정 계획을 수립합니다. 수정 전/후 코드 비교, 수정 후 타이밍 다이어그램, Top-Down 수정 순서를 제시하고 사용자 승인을 받습니다.

## Usage

```
/rtl-plan <수정 대상> <수정 목적>
```

- `/rtl-analyze` 결과를 기반으로 호출하는 것을 권장합니다
- 직접 호출 시 대상 파일/모듈과 수정 목적을 명시합니다

## Examples

```
/rtl-plan qs_mipi_txl_csi_frame_ctrl.v o_valid에 1-cycle 딜레이 추가
/rtl-plan pixel2bytes_bridge Line Memory FIFO depth 조정
```

## What It Does

1. 수정 범위와 Top-Down 순서 결정
2. 각 수정을 개별 제안서로 작성 (수정 전/후 코드, 타이밍 다이어그램)
3. 사용자에게 하나씩 승인 요청
4. 모든 승인 완료 후 → `/rtl-apply`로 안내

**계획만 수립합니다. 코드를 수정하지 않습니다.**
