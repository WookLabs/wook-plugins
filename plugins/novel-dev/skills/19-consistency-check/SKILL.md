---
name: 19-consistency-check
description: 전체 챕터 일관성 검사 (설정 모순, 플롯 구멍 탐지)
user-invocable: true
---

[NOVEL-SISYPHUS: 일관성 검사]

## Chunking Strategy

For projects with > 20 chapters:
1. Split into chunks of 10 chapters each
2. Check each chunk independently
3. Aggregate results in `reviews/consistency-report.json`
4. Use Context Budget System for each chunk

## 실행 단계

1. **데이터 로드**
   - 모든 설정 파일 (world, characters, plot)
   - 집필된 본문 전체

2. **lore-keeper 에이전트 호출**
   ```
   Task(subagent_type="novel-dev:lore-keeper", prompt="
   설정: {world, characters, plot}
   본문: {chapters}

   일관성 검사 항목:
   1. 캐릭터 외모/나이 묘사 변경
   2. 캐릭터 말투/성격 변화 (의도치 않은)
   3. 세계관 규칙 위반
   4. 장소 묘사 불일치
   5. 타임라인 모순
   6. 사망 캐릭터 재등장
   7. 용어 불일치
   8. 복선 회수 누락

   발견된 불일치를 JSON으로 출력해주세요.
   ")
   ```

3. **파일 저장**
   - `reviews/consistency_report.json`

## 출력 예시

```json
{
  "check_date": "2025-01-17T15:30:00Z",
  "total_issues": 3,
  "issues": [
    {
      "type": "character_appearance",
      "severity": "medium",
      "character": "char_001",
      "description": "5화에서 '긴 머리'라고 했는데 12화에서 '단발'로 묘사",
      "chapter_refs": [5, 12],
      "recommendation": "5화 또는 12화 수정 필요"
    },
    {
      "type": "timeline",
      "severity": "high",
      "description": "15화 사건이 14화보다 하루 전으로 설정됨",
      "chapter_refs": [14, 15],
      "recommendation": "15화 시간대 수정"
    },
    {
      "type": "foreshadowing",
      "severity": "low",
      "description": "fore_002 복선이 예정 회차(28화) 지났으나 미회수",
      "foreshadowing_id": "fore_002",
      "recommendation": "30화 이내 회수 필요"
    }
  ]
}
```
