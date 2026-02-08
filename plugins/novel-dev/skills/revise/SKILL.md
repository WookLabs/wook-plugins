---
name: revise
description: 원고 퇴고 및 수정
user-invocable: true
---

[NOVEL-SISYPHUS: 퇴고]

$ARGUMENTS

## 실행 단계

1. **대상 결정**
   - 회차 지정: 해당 회차만
   - 미지정: 현재 막 전체

2. **editor 에이전트 호출**
   ```
   Task(subagent_type="novel-dev:editor", prompt="
   원고: {chapter.md}
   문체 가이드: {style-guide.json}

   퇴고 체크리스트:
   1. 문법/맞춤법
   2. 문체 일관성
   3. 불필요한 표현 제거
   4. 대화 리듬
   5. 장면 전환 자연스러움
   6. Show, don't tell

   수정 후 원고와 수정 내역을 출력해주세요.
   ")
   ```

3. **파일 업데이트**
   - `chapters/chapter_{N}.md` 덮어쓰기
   - `chapters/chapter_{N}_draft.md` 원본 유지
   - status → 'edited'
