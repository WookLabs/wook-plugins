---
description: 승인 대기 중인 스펙 문서를 거부합니다
---

# Reject Spec

대기 중인 RTL 스펙 문서를 거부하는 명령어입니다.

## Usage

```
/reject-spec
/reject-spec --reason "타이밍 분석이 불충분합니다"
/reject-spec --id <spec-id>
```

## Description

이 명령어는 `pending-specs`에 등록된 스펙 문서를 거부합니다.

### 거부 사유 예시

- 타이밍 다이어그램 누락
- 인터페이스 정의 불충분
- 기존 스펙과 충돌
- 구현 불가능한 요구사항
- 검증 방안 미제시

### 거부 프로세스

1. 대기 중인 스펙 선택
2. 거부 사유 입력 (필수)
3. 스펙을 rejected-specs로 이동
4. 히스토리에 기록

### 거부 후

- 스펙 작성자에게 피드백 전달
- 수정 후 재제출 가능
- 거부 사유는 개선 방향 제시

## Files

- 거부 목록: `.omc/rtl-forge/rejected-specs.json`
- 히스토리: `.omc/rtl-forge/spec-history.json`
