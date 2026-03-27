# Gen-Plot Skill - Usage Examples

## Basic Usage

### Generate All Chapter Plots

```bash
/gen-plot
```

**Expected Output**:
```
Loading project data...
✓ Project: 계약의 온도 (50 chapters)
✓ Structure loaded: 3 acts
✓ Characters loaded: 4
✓ Main arc loaded
✓ Foreshadowing: 8 elements
✓ Hooks: 12 elements

Generating chapter plots...

[1/50] Chapter 1: 예상 밖의 제안
[2/50] Chapter 2: 계약서 검토
[3/50] Chapter 3: 첫 번째 데이트
...
[50/50] Chapter 50: 진심의 고백

✓ All 50 chapter plots generated

Files created:
- chapters/chapter_001.json through chapter_050.json

Next step: /write or /write-all
```

### Generate Specific Range

```bash
/gen-plot 1-15
```

**Output**:
```
Generating chapters 1-15 (Act 1)...

[1/15] Chapter 1: 예상 밖의 제안
...
[15/15] Chapter 15: 계약 갱신

✓ Act 1 plots completed (15 chapters)
```

## Example Chapter Plot Output

`chapters/chapter_001.json`:
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
    "current_plot": "마케팅팀 김유나 대리는 야근 후 회식 자리에서 그룹 후계자 이준혁을 우연히 만난다...",
    "next_plot": "유나는 황당한 제안을 거절하지만, 준혁은 조건을 제시한다..."
  },

  "narrative_elements": {
    "foreshadowing_plant": [],
    "foreshadowing_payoff": [],
    "hooks_plant": ["hook_001"],
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
      "beat": "유나가 야근 후 지친 모습"
    },
    {
      "scene_number": 2,
      "purpose": "준혁 첫 등장",
      "characters": ["char_001", "char_002"],
      "location": "loc_003",
      "conflict": "신분 차이, 어색함",
      "beat": "우연한 만남, 편안한 대화"
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

## Error Scenarios

### Missing Prerequisites

```bash
/gen-plot
```

**Error**:
```
ERROR: Cannot generate plots

Missing required files:
- plot/main-arc.json (run /design-main-arc)
- characters/char_001.json (run /design-character)

Workflow: /design-character → /design-main-arc → /gen-plot
```

### Foreshadowing Conflicts

```bash
/gen-plot
```

**Warning**:
```
WARNING: Foreshadowing conflict detected

fore_002:
  - Plant chapter: 5
  - Payoff chapter: 8
  - Gap: 3 chapters (minimum 5 recommended)

Recommendation: Move payoff to chapter 10+
Continue anyway? [Y/n]
```
