---
name: design-sub-arc
description: "[5단계] 서브 아크 설계 - 서브플롯 설계"
user-invocable: true
---

[NOVEL-SISYPHUS: 서브아크 설계]

$ARGUMENTS

## Idempotency

If output file already exists:
1. Read existing content
2. Preserve user modifications (fields not auto-generated)
3. Merge with new content
4. Warn if conflicting changes detected

## 실행 단계

1. **인자 확인**
   - 아크명 지정 시: 해당 서브플롯만 설계
   - 미지정 시: 필요한 서브플롯 제안 후 설계

2. **plot-architect 에이전트 호출**
   ```
   Task(subagent_type="plot-architect", prompt="
   메인 아크: {main-arc.json}
   캐릭터: {characters}

   서브플롯을 설계해주세요:

   - 서브플롯 ID, 이름
   - 관련 캐릭터
   - 메인플롯 연결점
   - 시작 회차, 해결 회차
   - 테마적 기능 (메인 테마 강화/대조)

   서브플롯 예시:
   - 직장 내 경쟁자와의 갈등
   - 여주 가족과의 화해
   - 남주 전 여친의 등장
   ")
   ```

3. **파일 생성**
   - `plot/sub-arcs/{arc_id}.json`

## 출력 예시

```json
{
  "id": "sub_001",
  "name": "직장 라이벌",
  "related_characters": ["char_001", "char_003"],
  "connection_to_main": "여주의 승진 욕구와 연결, 남주와의 관계에 영향",
  "start_chapter": 5,
  "resolution_chapter": 38,
  "thematic_function": "외부 인정 추구 vs 내면의 행복 대비",
  "beats": [
    { "chapter": 5, "event": "라이벌 등장, 프로젝트 경쟁 시작" },
    { "chapter": 20, "event": "라이벌이 여주와 남주 관계 눈치챔" },
    { "chapter": 35, "event": "라이벌의 방해 공작" },
    { "chapter": 38, "event": "여주가 정정당당하게 승리" }
  ]
}
```
