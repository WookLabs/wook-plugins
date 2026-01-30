---
name: approve-change
description: MAJOR/ARCHITECTURAL RTL 변경 승인. 변경 분류가 MAJOR 이상일 때만 필요.
allowed-tools: ["Read", "Write", "Bash"]
---

# /approve-change

MAJOR 또는 ARCHITECTURAL 레벨의 RTL 변경을 승인합니다.

## 사용법

```
/approve-change                    # 대기 중인 변경 승인
/approve-change --comment "조건"   # 조건부 승인
```

## 언제 필요한가?

| 분류 | 승인 필요? | 설명 |
|------|-----------|------|
| TRIVIAL | ✗ 불필요 | 주석, 공백, 간단한 수정 → 즉시 적용 |
| MINOR | ✗ 불필요 (사후 리뷰) | 로컬 변수, 단순 로직 → 적용 후 리뷰 |
| MAJOR | ✓ 사전 승인 | FSM 상태 추가, 인터페이스 변경 → 승인 필요 |
| ARCHITECTURAL | ✓ Ralplan + 승인 | 새 모듈, CDC 도입 → 계획 수립 필요 |

## 동작

1. `scripts/approve-change.mjs` 실행
2. 승인 상태를 `.rtl-forge/approved-changes.json`에 기록
3. Write guard가 승인 상태 확인 후 쓰기 허용

## 승인 전 체크리스트

### MAJOR 변경
1. **타이밍 다이어그램 검토**
   - BEFORE 다이어그램이 현재 동작과 일치하는가?
   - AFTER 다이어그램이 원하는 동작인가?

2. **영향 분석 검토**
   - 연결된 모듈들이 식별되었는가?
   - 부작용이 분석되었는가?

3. **rtl-critic 평가 확인**
   - RECOMMEND/CAUTION/REJECT 중 어떤 평가인가?
   - CAUTION이나 REJECT라면 이유는?

### ARCHITECTURAL 변경
1. **ralplan 실행 확인**
   - 계획 수립이 완료되었는가?
   - Planner, Architect, Critic 합의가 이루어졌는가?

2. **전체 시스템 영향 분석**
   - 새 모듈이 기존 아키텍처와 호환되는가?
   - CDC 경계가 명확히 정의되었는가?

## Files

- 승인 목록: `.rtl-forge/approved-changes.json`
- 히스토리: `.rtl-forge/change-history.json`

## Warning

승인된 변경은 RTL 파일에 직접 적용됩니다. 신중하게 검토하세요.
