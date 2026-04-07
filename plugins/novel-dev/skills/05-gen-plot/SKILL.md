---
name: 05-gen-plot
description: "Use this skill when generating per-chapter plot files from completed designs. Triggers on: '플롯 생성', '회차별 플롯', 'gen plot'."
user-invocable: true
---

# /gen-plot - 회차별 플롯 생성 (팀 기반)

$ARGUMENTS

설계 완료 후, 4명의 플롯 팀이 collaborative 모드로 회차별 상세 플롯을 생성합니다.
plot-architect가 초안을 만들고, arc-designer/lore-keeper/character-designer가 검증합니다.

## Provider 선택

기본: **Codex** (구조화 JSON 출력, 비용 효율)
- `--claude`: Claude 4-agent 팀으로 강제
- 프로젝트 override: `meta/project.json`의 `provider_routing.gen-plot`

## Quick Start

```bash
/gen-plot           # Codex로 플롯 생성 (기본)
/gen-plot --claude  # Claude 팀으로 플롯 생성 (품질 우선)
```

## Prerequisites

Before execution, verify these files exist:
- `meta/project.json` - Project metadata
- `meta/style-guide.json` - Style guide
- `plot/structure.json` - Plot structure (at least skeleton)
- `plot/main-arc.json` - Main arc
- `plot/foreshadowing.json` - Foreshadowing elements
- `characters/` - At least one character file

If any file is missing, report error and suggest `/init` or `/design` commands.

## --codex: Codex CLI(GPT-5.4) 플롯 생성

`$ARGUMENTS`에 `--codex`가 있으면 각 회차 플롯을 Codex CLI로 생성합니다:
```spec
for chapter in 1..total_chapters:
    Bash("node scripts/codex-writer.mjs --chapter {chapter} --project {projectPath} --mode gen-plot")
```

## 실행

### Phase 0: 플롯 전략 수립 (자동)

팀 실행 전에 plot-architect가 설계 산출물을 분석하여 전체 회차 배분 전략을 수립합니다:

```spec
Task(subagent_type="novel-dev:plot-architect", model="opus", prompt="
프로젝트: {projectPath}

플롯 전략을 수립하세요:
1. 다음 파일들을 읽고 분석:
   - plot/structure.json (막 구분, 총 회차)
   - plot/main-arc.json (메인 아크)
   - plot/sub-arcs/*.json (서브 아크)
   - plot/foreshadowing.json (복선)
   - plot/hooks.json (훅)
   - plot/timeline.json (타임라인)
   - characters/*.json (캐릭터)

2. templates/plot-strategy.template.json 구조를 참고하여
   meta/plot-strategy.json 생성

포함할 내용:
- 아크별 회차 할당 (어느 아크가 어느 회차에서 진행되는지)
- 복선 plant/payoff 타이밍표 (foreshadowing.json 기반)
- 전체 긴장 곡선 설계 (key peaks 명시)
- 회차별 페이싱 가이드
- POV 로테이션 전략
- 서브플롯-메인플롯 교차 지점
- 회차별 간략 가이드 (아크 비트, 복선, 훅, 감정 목표)

이 전략 문서는 이후 팀이 회차별 플롯을 생성할 때 참조합니다.
구체적이고 실행 가능한 내용을 작성하세요.
")
```

### Phase 1: 팀 기반 회차별 플롯 생성

team-orchestrator에 plot-generation-team 실행을 위임합니다:

```spec
Task(subagent_type="novel-dev:team-orchestrator", model="sonnet", prompt="
팀 실행: plot-generation-team
프로젝트: {projectPath}
모드: collaborative

⚠️ Phase 0 전략 참조: meta/plot-strategy.json에 플롯 전략이 있습니다.
plot-architect는 각 회차 초안 작성 시 이 전략의 per_chapter_guide를 따르세요.
검증 에이전트(arc-designer, lore-keeper, character-designer)도 전략 문서를 참조하여 검증하세요.

회차별 순차 생성:
- 각 회차 완성 후 저장하여 다음 회차 생성 시 이전 요약으로 활용
- 1회차당 1라운드: plot-architect 초안 → 3명 검증 → plot-architect 반영
")
```

## 팀 구성 (4명, collaborative)

| 에이전트 | 모델 | 역할 | 책임 |
|---------|------|------|------|
| **plot-architect** (lead) | opus | 초안 생성 + 피드백 반영 | 회차별 chapter_N.json 작성 |
| arc-designer | sonnet | 아크/복선 검증 | 아크 진행률, 복선 타이밍, 훅 배치 확인 |
| lore-keeper | sonnet | 세계관 검증 | 타임라인 정합성, 장소/설정 일관성 확인 |
| character-designer | sonnet | 캐릭터 검증 | 캐릭터 동선, 성장 아크, 행동 동기 확인 |

## Collaborative 진행 방식

plot-architect(lead)가 TeamCreate로 팀을 구성하고 SendMessage로 조율합니다.

**각 회차마다:**
1. plot-architect가 초안 작성 (plot-strategy.json의 해당 회차 가이드 참조)
2. arc-designer에게 SendMessage → 아크/복선 피드백
3. lore-keeper에게 SendMessage → 세계관 정합성 피드백
4. character-designer에게 SendMessage → 캐릭터 동선 피드백
5. plot-architect가 피드백 반영 → chapter_N.json 저장
6. 다음 회차로 진행

## 회차별 포함 내용

1. 회차 제목, 목표 분량
2. 이전 회차 요약 (N=1: 빈 문자열, N>=2: 직전 3개 요약)
3. 현재 회차 줄거리 (1500자+)
4. 다음 회차 줄거리 (500자, 마지막 회차면 빈 문자열)
5. POV 캐릭터, 등장 인물, 등장 장소
6. 작품 내 시간대
7. 복선 plant/payoff ID
8. 떡밥 훅
9. 캐릭터 발전 포인트
10. 독자 감정 목표
11. 씬 분해 (2-4개 씬)
12. 문체 가이드 (톤, 페이싱)

## 파일 생성

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
    "current_plot": "마케팅팀 김유나 대리는 야근 후 회식 자리에서...",
    "next_plot": "유나는 황당한 제안을 거절하지만..."
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
    }
  ],

  "style_guide": {
    "tone": "가볍고 코믹하면서도 궁금증 유발",
    "pacing": "medium",
    "focus": "캐릭터 소개, 훅 설정"
  }
}
```

## 완료 후

```
[OK] 전체 회차 플롯 생성 완료. /plot-review로 검토하거나, /write로 집필을 시작하세요.
```
