---
name: rtl-analyze
description: RTL 버그/이슈의 근본 원인을 분석하고 cycle-by-cycle 타이밍 다이어그램으로 설명
user-invocable: true
---

# /rtl-analyze

RTL 버그 또는 동작 이슈를 분석하고 cycle-by-cycle 타이밍 다이어그램으로 현재 동작을 설명합니다.

## Usage

```
/rtl-analyze <대상> <문제 설명>
```

- `<대상>`: `.v` 파일 경로, 모듈명, 또는 신호명
- `<문제 설명>`: 증상, 파형에서 관찰된 현상 등

## Examples

```
/rtl-analyze qs_mipi_txl_csi_frame_ctrl.v o_valid 타이밍이 1 cycle 빠름
/rtl-analyze pixel2bytes_bridge Line Memory 읽기에서 데이터 누락
```

## What It Does

1. 대상 모듈과 관련 계층 탐색
2. 문제 신호 역추적 (출력 → 입력)
3. 클럭 도메인, FSM, 영향 범위 분석
4. cycle-by-cycle 타이밍 다이어그램 제시
5. 근본 원인과 영향 범위 보고

**분석만 수행합니다. 수정은 `/rtl-plan` → `/rtl-apply` 로 진행합니다.**
