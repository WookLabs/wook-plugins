---
name: gen-plot
description: 전체 회차별 플롯 파일 생성
user-invocable: true
---

[NOVEL-SISYPHUS: 회차 플롯 생성]

## Prerequisites

Before execution, verify these files exist:
- `meta/project.json` - Project metadata
- `meta/style-guide.json` - Style guide
- `plot/structure.json` - Plot structure (at least skeleton)
- `characters/` - At least one character file

If any file is missing, report error and suggest `/init` or `/design-world` ~ `/design-hook` commands.

## 실행 단계

1. **데이터 로드**
   - `meta/project.json` (목표 화수)
   - `plot/structure.json` (막 구분)
   - `plot/main-arc.json`
   - `plot/sub-arcs/*.json`
   - `plot/foreshadowing.json`
   - `plot/hooks.json`
   - `characters/*.json`
   - `meta/style-guide.json`

2. **plot-architect 에이전트 호출** (회차별 반복)
   ```
   Task(subagent_type="novel-dev:plot-architect", prompt="
   프로젝트: {project.json}
   플롯 구조: {structure.json}
   메인 아크: {main-arc.json}
   서브 아크: {sub-arcs}
   복선: {foreshadowing.json}
   떡밥: {hooks.json}
   기존 회차 플롯: {chapters/chapter_*.json} (있는 경우)

   회차 {N}의 상세 플롯을 생성해주세요:

   포함 내용:
   1. 회차 제목
   2. 이전 회차 요약 (N>1일 경우, 이전 chapter_*.json의 current_plot 참조)
      - N=1: 빈 문자열
      - N=2: chapter_001.json의 current_plot 요약
      - N>=3: 직전 3개 회차의 current_plot 통합 요약
   3. 현재 회차 줄거리 (1500자)
   4. 다음 회차 줄거리 (500자, 마지막 회차면 빈 문자열)
   5. POV 캐릭터
   6. 등장 인물
   7. 등장 장소
   8. 작품 내 시간대
   9. 심을 복선 ID
   10. 회수할 복선 ID
   11. 떡밥 훅
   12. 캐릭터 발전 포인트
   13. 독자 감정 목표
   14. 씬 분해 (2-4개 씬)
   15. 문체 가이드 (톤, 페이싱)
   ")

   ⚠️ 참고: 회차별로 순차 생성하며, 각 회차 생성 후 저장하여
   다음 회차 생성 시 이전 회차 요약으로 활용
   ```

3. **파일 생성**
   - `chapters/chapter_001.json` ~ `chapter_{N}.json`

## 출력 예시

### chapters/chapter_001.json
```json
{
  "chapter_number": 1,
  "chapter_title": "예상 밖의 제안",
  "status": "planned",
  "word_count_target": 5000,

  "meta": {
    "pov_character": "char_001",
    "characters": ["char_001", "char_002"],
    "locations": ["loc_002", "loc_003"],
    "in_story_time": "20XX년 3월 15일 저녁"
  },

  "context": {
    "previous_summary": "",
    "current_plot": "마케팅팀 김유나 대리는 야근 후 회식 자리에서 그룹 후계자 이준혁을 우연히 만난다. 회사에서의 이미지와 달리 편안하게 대화하는 두 사람. 유나는 준혁이 왜 이런 자리에 있는지 의아해한다. 회식이 끝나고 함께 나오는 두 사람. 준혁이 갑자기 유나에게 '저와 연애하실 생각 없으십니까?'라고 제안한다. 당황하는 유나. 준혁은 '물론 계약으로요'라고 덧붙인다.",
    "next_plot": "유나는 황당한 제안을 거절하지만, 준혁은 조건을 제시한다. 3개월간 연인 행세, 대가로 승진 지원과 보너스. 유나의 승진 욕구와 자존심 사이의 갈등. 결국 계약서를 검토하기로 한다."
  },

  "narrative_elements": {
    "foreshadowing_plant": [],
    "foreshadowing_payoff": [],
    "hooks_plant": ["hook_001"],
    "hooks_reveal": [],
    "character_development": "유나의 승진 욕구와 현실적 성격 소개",
    "emotional_goal": "궁금증, 의외성"
  },

  "scenes": [
    {
      "scene_number": 1,
      "purpose": "유나의 일상과 성격 소개",
      "characters": ["char_001"],
      "location": "loc_002",
      "conflict": "야근 스트레스, 승진 압박",
      "beat": "유나가 야근 후 지친 모습, 동료와 회식 가기로"
    },
    {
      "scene_number": 2,
      "purpose": "준혁 첫 등장, 두 사람 만남",
      "characters": ["char_001", "char_002"],
      "location": "loc_003",
      "conflict": "신분 차이, 어색함",
      "beat": "우연한 만남, 의외로 편안한 대화"
    },
    {
      "scene_number": 3,
      "purpose": "충격적 제안",
      "characters": ["char_001", "char_002"],
      "location": "loc_003",
      "conflict": "당혹감, 궁금증",
      "beat": "계약 연애 제안, 클리프행어"
    }
  ],

  "style_guide": {
    "tone": "가볍고 코믹하면서도 궁금증 유발",
    "pacing": "medium",
    "focus": "캐릭터 소개, 훅 설정"
  }
}
```
