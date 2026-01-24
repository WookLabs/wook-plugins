---
name: timeline
description: 작품 내 시간 흐름 시각화
user-invocable: true
---

[NOVEL-SISYPHUS: 타임라인]

## 실행 단계

1. **데이터 로드**
   - 모든 chapter.json의 `in_story_time`
   - 주요 이벤트

2. **lore-keeper 에이전트 호출**
   ```
   Task(subagent_type="lore-keeper", prompt="
   회차별 시간대: {chapter times}

   타임라인을 정리해주세요:
   - 절대 시간 (날짜/시간)
   - 캐릭터별 동선
   - 시간 점프 구간
   - 동시 발생 사건
   ")
   ```

3. **파일 저장**
   - `meta/timeline.json`

## 출력 예시

```json
{
  "timeline": [
    {
      "date": "20XX-03-15",
      "events": [
        { "chapter": 1, "time": "저녁", "event": "첫 만남, 계약 제안" }
      ]
    },
    {
      "date": "20XX-03-16",
      "events": [
        { "chapter": 2, "time": "오전", "event": "계약서 검토" }
      ]
    }
  ],
  "time_jumps": [
    { "from_chapter": 10, "to_chapter": 11, "gap": "2주" }
  ],
  "character_movements": {
    "char_001": [
      { "chapter": 1, "location": "회사→술집" },
      { "chapter": 2, "location": "집→카페" }
    ]
  }
}
```
