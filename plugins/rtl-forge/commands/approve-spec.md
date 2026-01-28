---
allowed-tools: ["Read", "Write", "Bash"]
description: 승인 대기 중인 스펙 문서를 승인합니다
---

# Approve Spec

대기 중인 RTL 스펙 문서를 승인하는 명령어입니다.

## Usage

```
/approve-spec
/approve-spec --comment "승인합니다"
/approve-spec --id <spec-id>
```

## Description

이 명령어는 `pending-specs`에 등록된 스펙 문서를 승인하여 `approved-specs`로 이동시킵니다.

### 승인 프로세스

1. 대기 중인 스펙 목록 확인
2. 선택된 스펙의 내용 검토
3. 승인 코멘트 추가 (선택)
4. 스펙을 approved-specs로 이동
5. 히스토리 기록

### 승인 후

승인된 스펙 문서는 RTL 구현의 기준이 됩니다:
- `rtl-coder`는 승인된 스펙에 따라서만 코드 제안 가능
- 모든 변경은 스펙 문서를 참조해야 함
- 스펙에 없는 기능은 새 스펙 문서 필요

## Files

- 대기 목록: `.omc/rtl-forge/pending-specs.json`
- 승인 목록: `.omc/rtl-forge/approved-specs.json`
- 히스토리: `.omc/rtl-forge/spec-history.json`
