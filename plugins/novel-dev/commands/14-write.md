---
description: 회차 집필
---

# /write - 소설 챕터 작성

현재 진행 중인 챕터를 작성합니다.

## Usage
```
/write           # 다음 챕터 작성
/write 5         # 5화 작성
/write 5-10      # 5~10화 연속 작성
```

## Process
1. ralph-state.json에서 현재 챕터 확인
2. chapters/chapter_XXX.json에서 플롯 로드
3. Context Budget System으로 관련 컨텍스트 로드
4. novelist 에이전트로 챕터 작성
5. editor 에이전트로 품질 검토
6. 상태 업데이트

## 다음 단계

- `/revise` - 퇴고
- `/evaluate` - 품질 평가
- `/write` - 다음 회차 계속 집필
