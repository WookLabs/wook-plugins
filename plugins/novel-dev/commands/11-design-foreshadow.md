---
description: 복선 설계
---

# /design-foreshadow - 복선 설계

[NOVEL-SISYPHUS: 복선 설계]

## Idempotency

If output file already exists:
1. Read existing content
2. Preserve user modifications (fields not auto-generated)
3. Merge with new content
4. Warn if conflicting changes detected

## 실행 단계

1. **데이터 로드**
   - `plot/main-arc.json`
   - `plot/sub-arcs/*.json`
   - `characters/*.json` (비밀 정보 포함)

2. **plot-architect 에이전트 호출**
   ```
   Task(subagent_type="plot-architect", prompt="
   메인 아크: {main-arc.json}
   서브 아크: {sub-arcs}
   캐릭터 비밀: {secrets}

   복선을 설계해주세요:

   각 복선에 포함:
   - ID, 내용
   - 심는 회차 (plant)
   - 힌트 회차들 (hints) - 선택
   - 회수 회차 (payoff)
   - 중요도 (A/B/C)

   규칙:
   - 중요 반전(A급)은 최소 3회 이상 힌트
   - 심기와 회수 사이 최소 5회차 간격
   - 회수 없는 복선 금지
   ")
   ```

3. **파일 생성**
   - `plot/foreshadowing.json`

## 출력 예시

```json
{
  "foreshadowing": [
    {
      "id": "fore_001",
      "content": "여주가 재벌가 숨겨진 딸이라는 것",
      "importance": "A",
      "plant_chapter": 8,
      "hints": [15, 22, 30],
      "payoff_chapter": 35,
      "status": "not_planted",
      "details": {
        "plant": "여주가 고아원 출신이라고 거짓말하는 장면",
        "hint_1": "고급 브랜드를 알아보는 모습",
        "hint_2": "재벌 파티에서 이상하게 편안해하는 모습",
        "hint_3": "여주 아버지의 사진이 뉴스에 잠깐 비침",
        "payoff": "남주 가문 조사로 진실 밝혀짐"
      }
    },
    {
      "id": "fore_002",
      "content": "남주가 사실 여주를 예전부터 알고 있었다는 것",
      "importance": "B",
      "plant_chapter": 5,
      "hints": [12],
      "payoff_chapter": 28,
      "status": "not_planted"
    }
  ]
}
```

## 다음 단계

- `/design-hook` - 훅/떡밥 설계
- `/gen-plot` - 플롯 생성 (훅 설계 생략 가능)
