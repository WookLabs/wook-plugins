---
description: 플롯 생성
---

# /gen-plot - 회차 플롯 생성

[NOVEL-SISYPHUS: 회차 플롯 생성]

## Prerequisites

Before execution, verify these files exist:
- `meta/project.json` - Project metadata
- `meta/style-guide.json` - Style guide
- `plot/structure.json` - Plot structure (at least skeleton)
- `characters/` - At least one character file

If any file is missing, report error and suggest `/01-init` or `/02-world` ~ `/07-hook` commands.

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
   Task(subagent_type="plot-architect", prompt="
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
   3. **현재 회차 줄거리 (current_plot)** - 최소 1500자, 권장 2500자
      - 회차의 핵심 사건과 전개
      - 캐릭터의 감정 변화와 동기
      - 긴장감과 갈등의 구체적 묘사
      - 독자 몰입 포인트
   4. **다음 회차 줄거리 (next_plot)** - 500자 이상
      - 다음 회차로의 자연스러운 연결
      - 기대감을 높이는 예고
      - (마지막 회차면 빈 문자열)
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
       - 각 씬의 목적(purpose): 이 씬이 왜 필요한지 명확히
       - 갈등(conflict): 씬 내 긴장감의 원천
       - 비트(beat): 씬에서 일어나는 구체적 사건 (200자 이상)
       - 감정 톤(emotional_tone): 독자가 느껴야 할 감정
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
    "current_plot": "마케팅팀 김유나 대리는 중요한 프레젠테이션을 앞두고 밤늦게까지 야근하고 있다. 팀장 승진을 눈앞에 둔 그녀에게 이번 프로젝트는 결정적인 기회다. 지친 몸을 이끌고 팀 회식 자리에 합류한 유나는 구석 자리에서 혼자 술을 마시는 낯익은 얼굴을 발견한다. 그룹 후계자 이준혁. 회사에서 보는 차갑고 완벽한 이미지와 달리, 오늘의 그는 어딘가 지쳐 보인다. 우연히 눈이 마주치고, 어색한 인사를 나누다가 자연스럽게 대화가 시작된다.\n\n준혁은 의외로 유머 감각이 있고, 유나의 솔직한 말투에 웃음 짓는다. 둘은 회사 생활의 고충, 주변의 기대, 때로는 도망치고 싶은 마음에 대해 이야기한다. 유나는 이 사람이 왜 이런 허름한 술집에 있는지 의아하지만, 묻지 않는다. 회식이 끝나고 함께 가게를 나서는 두 사람. 차가운 밤공기 속에서 준혁이 갑자기 발걸음을 멈춘다.\n\n'김유나 씨, 저와 연애하실 생각 없으십니까?'\n\n당황한 유나. 뭐라고 대답해야 할지 모르겠다. 준혁은 담담하게 덧붙인다.\n\n'물론... 계약으로요.'\n\n그의 진지한 눈빛에서 이것이 장난이 아님을 직감한 유나. 도대체 무슨 상황인 건지, 머릿속이 하얘진다. 하지만 묘하게 그의 제안이 궁금하기도 하다.",
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
      "beat": "유나가 밤늦게까지 프레젠테이션 자료를 수정하며 지친 모습을 보인다. 팀장 승진을 앞두고 있지만 경쟁자도 만만치 않다. 동료들이 회식 가자며 부르고, 피곤하지만 인간관계도 중요하다는 생각에 억지로 웃으며 따라나선다. 거울에 비친 자신의 피곤한 얼굴을 보며 한숨을 쉰다.",
      "emotional_tone": "지침, 압박감, 현실적 고민"
    },
    {
      "scene_number": 2,
      "purpose": "준혁 첫 등장, 두 사람 만남",
      "characters": ["char_001", "char_002"],
      "location": "loc_003",
      "conflict": "신분 차이, 어색함",
      "beat": "시끌벅적한 회식 자리에서 유나는 구석에 혼자 앉아 있는 이준혁을 발견한다. 회사에서 보던 완벽한 모습과 달리 오늘은 어딘가 지쳐 보인다. 우연히 눈이 마주치고 어색하게 인사한다. 준혁이 먼저 말을 걸어오고, 의외로 편안한 대화가 이어진다. 회사 얘기, 꿈과 현실의 괴리, 때로는 모든 걸 내려놓고 싶다는 솔직한 고백까지. 유나는 이 사람의 진짜 모습을 처음 보는 것 같다.",
      "emotional_tone": "의외성, 친밀감 형성, 호기심"
    },
    {
      "scene_number": 3,
      "purpose": "충격적 제안",
      "characters": ["char_001", "char_002"],
      "location": "loc_003",
      "conflict": "당혹감, 궁금증",
      "beat": "회식이 끝나고 함께 가게를 나서는 두 사람. 차가운 밤공기가 볼을 스친다. 갑자기 준혁이 발걸음을 멈추고 진지한 표정으로 유나를 바라본다. '저와 연애하실 생각 없으십니까?' 유나는 순간 귀를 의심한다. 뭐라고 대답해야 할지 모르겠다. 준혁은 '물론 계약으로요'라고 담담하게 덧붙인다. 그의 진지한 눈빛에서 농담이 아님을 직감한 유나. 머릿속이 하얘지지만, 묘하게 그의 제안이 궁금하기도 하다.",
      "emotional_tone": "충격, 당혹감, 궁금증, 클리프행어"
    }
  ],

  "style_guide": {
    "tone": "가볍고 코믹하면서도 궁금증 유발",
    "pacing": "medium",
    "focus": "캐릭터 소개, 훅 설정"
  }
}
```

## 다음 단계

- `/write` - 회차 집필
- `/write-act` - 막 단위 집필
- `/write-all` - 전체 자동 집필
