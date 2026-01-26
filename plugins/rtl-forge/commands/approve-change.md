---
description: 승인 대기 중인 RTL 변경을 승인합니다
---

# Approve Change

대기 중인 RTL 코드 변경 제안을 승인하는 명령어입니다.

## Usage

```
/approve-change
/approve-change --comment "승인합니다"
/approve-change --id <change-id>
```

## Description

이 명령어는 `rtl-coder`가 제안한 변경을 승인합니다. **승인 없이는 RTL 파일 수정이 불가합니다.**

### 승인 전 체크리스트

1. **타이밍 다이어그램 검토**
   - BEFORE 다이어그램이 현재 동작과 일치하는가?
   - AFTER 다이어그램이 원하는 동작인가?

2. **영향 분석 검토**
   - 연결된 모듈들이 식별되었는가?
   - 부작용이 분석되었는가?

3. **rtl-critic 평가 확인**
   - RECOMMEND/CAUTION/REJECT 중 어떤 평가인가?
   - CAUTION이나 REJECT라면 이유는?

### 승인 프로세스

1. 대기 중인 변경 목록 확인
2. 변경 내용 및 타이밍 다이어그램 검토
3. rtl-critic의 평가 확인
4. 승인 결정
5. 승인된 변경은 자동으로 RTL 파일에 적용

## Files

- 대기 목록: `.omc/rtl-forge/pending-changes.json`
- 승인 목록: `.omc/rtl-forge/approved-changes.json`
- 히스토리: `.omc/rtl-forge/change-history.json`

## Warning

승인된 변경은 RTL 파일에 직접 적용됩니다. 신중하게 검토하세요.
