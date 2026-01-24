---
name: design-hook
description: "[7단계] 훅 설계 - 떡밥(미스터리 요소) 설계"
user-invocable: true
---

[NOVEL-SISYPHUS: 떡밥 설계]

## Idempotency

If output file already exists:
1. Read existing content
2. Preserve user modifications (fields not auto-generated)
3. Merge with new content
4. Warn if conflicting changes detected

## 실행 단계

1. **데이터 로드**
   - `plot/main-arc.json`
   - `plot/foreshadowing.json`

2. **plot-architect 에이전트 호출**
   ```
   Task(subagent_type="plot-architect", prompt="
   메인 아크: {main-arc.json}
   복선: {foreshadowing.json}

   떡밥(Hook)을 설계해주세요:

   떡밥 = 독자의 궁금증을 유발하는 미스터리 요소
   복선과 차이: 복선은 나중 사건 암시, 떡밥은 독자 궁금증 유발

   각 떡밥에 포함:
   - ID, 내용
   - 심는 회차
   - 힌트/단서 제공 회차들
   - 해소 회차
   - 독자 반응 예상

   회차 말미 훅:
   - 각 회차 끝에 다음 회차로 이어지는 훅 포함
   ")
   ```

3. **파일 생성**
   - `plot/hooks.json`

## 출력 예시

```json
{
  "mystery_hooks": [
    {
      "id": "hook_001",
      "content": "남주가 계약 연애를 제안한 진짜 이유",
      "plant_chapter": 3,
      "clues": [10, 18, 25],
      "reveal_chapter": 32,
      "reader_reaction": "왜 굳이 그녀여야 했을까?",
      "reveal": "남주가 여주를 예전에 본 적 있고 마음에 두고 있었음"
    }
  ],
  "chapter_end_hooks": [
    {
      "chapter": 1,
      "hook": "\"김유나 씨, 저와 연애하실 생각 없으십니까?\"",
      "purpose": "충격적 제안으로 2화 유입"
    },
    {
      "chapter": 2,
      "hook": "계약서 마지막 조항: '감정이 생기면 즉시 계약 파기'",
      "purpose": "아이러니한 조항으로 긴장감 조성"
    }
  ]
}
```
