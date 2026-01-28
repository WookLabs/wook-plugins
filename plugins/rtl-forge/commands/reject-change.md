---
allowed-tools: ["Read", "Write", "Bash"]
description: 승인 대기 중인 RTL 변경을 거부합니다
---

# Reject Change

대기 중인 RTL 코드 변경 제안을 거부하는 명령어입니다.

## Usage

```
/reject-change
/reject-change --reason "타이밍 위반 우려"
/reject-change --id <change-id>
```

## Description

이 명령어는 `rtl-coder`가 제안한 변경을 거부합니다.

### 거부 사유 예시

- 타이밍 다이어그램 부정확
- 부작용 분석 불충분
- 기존 동작 파괴
- 성능 저하 우려
- 더 나은 대안 존재
- rtl-critic이 REJECT 평가

### 거부 프로세스

1. 대기 중인 변경 선택
2. 거부 사유 입력 (필수)
3. 변경을 rejected-changes로 이동
4. 히스토리에 기록

### 거부 후

- rtl-coder에게 피드백 전달
- 수정된 제안으로 재시도 가능
- 거부 사유를 반영한 개선 필요

## Files

- 거부 목록: `.omc/rtl-forge/rejected-changes.json`
- 히스토리: `.omc/rtl-forge/change-history.json`
