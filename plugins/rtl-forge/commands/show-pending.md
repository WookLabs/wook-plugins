---
name: show-pending
description: 대기 중인 RTL 변경 목록과 분류 레벨 표시.
allowed-tools: ["Read", "Glob"]
---

# /show-pending

승인 대기 중인 RTL 변경 요청을 분류 레벨과 함께 표시합니다.

## 사용법

```
/show-pending                  # 모든 대기 항목
/show-pending --level MAJOR    # 특정 레벨만
/show-pending --verbose        # 상세 정보 포함
```

## 출력 형식

```
┌─────────────────────────────────────────────────────────┐
│                  Pending RTL Changes                     │
├──────┬──────────────┬────────────────────────────────────┤
│ Level│ File         │ Description                        │
├──────┼──────────────┼────────────────────────────────────┤
│ MAJOR│ rtl/fifo.sv  │ FSM 상태 추가 (IDLE→FLUSH)        │
│ ARCH │ rtl/top.sv   │ 새 CDC bridge 모듈 추가           │
└──────┴──────────────┴────────────────────────────────────┘
```

## 분류 레벨 설명

| Level | 의미 | 승인 필요? |
|-------|------|-----------|
| TRIVIAL | 사소한 변경 (주석, 공백) | ✗ |
| MINOR | 로컬 변경 (변수명, 단순 로직) | ✗ (사후 리뷰) |
| MAJOR | 중요한 변경 (FSM, 인터페이스) | ✓ |
| ARCHITECTURAL | 구조적 변경 (새 모듈, CDC) | ✓ (Ralplan 필요) |

## 옵션

- `--level LEVEL`: 특정 분류 레벨만 필터링 (TRIVIAL, MINOR, MAJOR, ARCHITECTURAL)
- `--verbose`: 타이밍 다이어그램 및 상세 분석 포함

## 동작

1. `.rtl-forge/approved-changes.json` 읽기
2. 미승인 항목 필터링
3. 분류 레벨과 함께 표시
4. MAJOR/ARCHITECTURAL 항목은 하이라이트

## Files

- 대기 변경: `.rtl-forge/approved-changes.json`
