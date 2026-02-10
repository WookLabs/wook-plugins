# Write Skill - Detailed Guide

## Context Loading System

The write skill uses a sophisticated context budget system to load relevant information for chapter writing while staying within token limits.

### Token Budget Allocation

Total budget: ~120K tokens

| Context Type | Tokens | Priority | Source |
|--------------|--------|----------|--------|
| Style guide | 10K | REQUIRED | `meta/style-guide.json` |
| Current chapter plot | 15K | REQUIRED | `chapters/chapter_XXX.json` |
| Previous 3 summaries | 20K | HIGH | `context/summaries/` |
| Character profiles | 25K | HIGH | `characters/*.json` (active in plot) |
| World/Setting | 15K | MEDIUM | `world/world.json` |
| Act context | 10K | MEDIUM | `plot/structure.json` (current act) |
| Previous chapter text | 15K | LOW | Last chapter full text |
| Reserved for response | 10K | SYSTEM | Response buffer |

### Context Priority Rules

1. **REQUIRED** - Always loaded, writing fails without these
2. **HIGH** - Loaded unless budget constraints
3. **MEDIUM** - Loaded if space available
4. **LOW** - Only if significant space remains

### Adaptive Loading

The system dynamically adjusts based on:
- Chapter position in story (early chapters need more world-building)
- Number of active characters in plot
- Complexity of current scene
- Available token budget

## Adult Content: 2-Pass Pipeline

v6.0.0부터 성인 콘텐츠는 2-Pass 파이프라인으로 처리합니다.

### 2-Pass 워크플로우

1. **Pass 1 (Claude)**: Claude novelist가 ADULT 마커(`<!-- ADULT_N_START -->` / `<!-- ADULT_N_END -->`)와 함께 전체 챕터를 집필
2. **Pass 2 (Grok)**: `adult-rewriter.mjs`가 마커 구간만 추출하여 Grok API로 전송, 응답으로 대체

### 관련 스킬

- `/write-2pass N` -- 단일 챕터 2-Pass 집필
- `/write-act-2pass N` -- 막 단위 2-Pass 순차 집필

### /write 스킬과의 관계

`/write` 스킬은 Claude-only 경로입니다. 성인 콘텐츠가 필요한 경우 `/write-2pass`를 직접 사용하세요.

> **Note**: `writer_mode: "grok"`과 `--grok` 플래그는 deprecated되었습니다. 2-Pass 파이프라인으로 마이그레이션하세요.

## Writing Process

### Phase 1: Preparation

1. **Load ralph-state.json**
   - Determine current chapter number
   - Check writing status
   - Verify prerequisites

2. **Load Chapter Plot**
   - Read `chapters/chapter_XXX.json`
   - Parse scenes, character arcs, plot points
   - Identify key moments

3. **Context Assembly**
   - Apply budget system
   - Load contexts by priority
   - Build composite prompt

### Phase 2: Writing

Claude novelist 에이전트를 호출하여 챕터를 작성합니다.

> **성인소설**: `/write-2pass`를 사용하세요. 이 스킬(`/write`)은 Claude-only 경로입니다.

```javascript
Task({
  subagent_type: "novel-dev:novelist",
  model: "opus",
  prompt: `
# 회차 집필: ${chapterNumber}

## 플롯
${currentPlot}

## 이전 회차 요약
${previousSummaries}

## 캐릭터
${characterProfiles}

## 세계관
${worldInfo}

## 문체 가이드
${styleGuide}

위 정보를 바탕으로 Chapter ${chapterNumber}를 작성해주세요.
목표 분량: ${targetWords}자
  `
});
```

### Phase 3: Quality Review

After chapter generation:

```javascript
Task({
  subagent_type: "novel-dev:editor",
  model: "opus",
  prompt: `
# 편집 검토

원고: ${generatedChapter}
플롯: ${plot}

다음을 확인해주세요:
1. 플롯 정합성
2. 캐릭터 일관성
3. 문체 가이드 준수
4. 오탈자/문법
5. 분량 (목표: ${targetWords}자)

수정이 필요한 부분을 제안해주세요.
  `
});
```

### Phase 4: State Update

1. Mark chapter as completed in ralph-state.json
2. Generate chapter summary for context
3. Save summary to `context/summaries/chapter_XXX_summary.md`
4. Update project.json current_chapter

## Korean Literary Techniques

The novelist agent is trained on Korean literary techniques for authentic prose.

### 은유/비유 (Metaphors)

Korean metaphors often draw from nature and seasons:

**Examples:**
- "그녀의 마음은 가을 하늘처럼 맑았다" (Her heart was clear like autumn sky)
- "그의 눈빛은 겨울 호수처럼 차가웠다" (His gaze was cold like winter lake)

### 의성어/의태어 (Onomatopoeia)

Rich sound and mimetic words unique to Korean:

**Sound (의성어):**
- 쏴아 (swoosh - flowing water)
- 또각또각 (clack-clack - heels walking)
- 쿵쾅쿵쾅 (thud-thud - heavy footsteps)

**Mimetic (의태어):**
- 아슬아슬 (precariously)
- 살금살금 (stealthily)
- 울렁울렁 (queasily)

### 시점 변화 (POV Shifts)

Korean web novels frequently use:

**3인칭 제한 시점 (Third Limited):**
```
민준은 그녀의 표정을 살폈다. 화가 난 것 같기도, 슬픈 것 같기도 했다.
(Minjun studied her expression. She seemed angry, or perhaps sad.)
```

**1인칭 고백 (First Person Confessional):**
```
나는 몰랐다. 그 선택이 모든 것을 바꿔버릴 줄은.
(I didn't know. That choice would change everything.)
```

### 문장 리듬 (Sentence Rhythm)

Korean prose rhythm varies by scene type:

**긴장 장면 (Tension):** Short, staccato sentences
```
문이 열렸다. 그가 들어왔다. 그리고 나를 봤다.
(The door opened. He entered. And saw me.)
```

**서정 장면 (Lyrical):** Flowing, longer sentences
```
봄비가 창문을 두드리는 소리를 들으며, 나는 그때의 우리를 떠올렸다.
(Listening to spring rain tapping the window, I recalled us from that time.)
```

## Style Guide System

The write skill enforces project-specific style through `meta/style-guide.json`.

### Core Style Elements

```json
{
  "narrative_voice": "3인칭 제한 시점",
  "pov_type": "single",
  "tense": "과거형",
  "tone": ["달달", "코믹"],
  "pacing_default": "medium",
  "dialogue_style": "자연스러운 구어체",
  "description_density": "medium",
  "sentence_rhythm": "mixed"
}
```

### Taboo Words

Words to avoid for better prose:

```json
{
  "taboo_words": [
    "갑자기",    // suddenly (overused)
    "문득",      // suddenly/abruptly (cliché)
    "그런데",    // but/however (weak transition)
    "그러자",    // then/upon that (weak causation)
    "어느새"     // before one knows (vague timing)
  ]
}
```

These are flagged during editing review.

### Preferred Expressions

Project-specific vocabulary:

```json
{
  "preferred_expressions": [
    {
      "context": "romantic_tension",
      "words": ["설레다", "두근거리다", "아찔하다"]
    },
    {
      "context": "conflict",
      "words": ["팽팽하다", "날카롭다", "차갑다"]
    }
  ]
}
```

## Chapter Structure

### Standard Structure

1. **Opening Hook** (100-200 words)
   - Immediate conflict or intrigue
   - Sensory detail to ground reader
   - Emotional stake

2. **Main Scenes** (2-4 scenes)
   - Each scene has clear goal
   - Rising tension/stakes
   - Character development

3. **Ending Hook** (100-200 words)
   - Cliffhanger or emotional beat
   - Promise of next chapter
   - Unanswered question

### Scene Transitions

Korean web novels favor:

**Time Cuts:**
```
# (Scene break symbol)

다음 날 아침.
(The next morning.)
```

**Location Shifts:**
```
***

그 시각, 민준의 사무실.
(At that moment, Minjun's office.)
```

## Error Handling

### Missing Context

If required context is missing:

```
ERROR: Cannot write chapter 5
Required context missing: chapters/chapter_005.json

Run: /outline 5
Then retry: /write 5
```

### Adult Content Handling

성인 콘텐츠가 필요한 챕터에서 `/write`를 실행한 경우:

```
INFO: 이 챕터에 성인 콘텐츠가 포함될 수 있습니다.

Options:
1. /write-2pass로 전환 (2-Pass 파이프라인)
2. Claude로 계속 진행 (콘텐츠 제한 있음)
3. 취소

Choose [1/2/3]:
```

### Token Budget Exceeded

If context assembly exceeds budget:

```
WARNING: Context budget exceeded (135K / 120K tokens)

Reducing priority:
- Skipping previous chapter full text
- Limiting character profiles to active characters only
- Reducing world context to current location only

Continue? [Y/n]
```

## Advanced Features

### Focus Mode

Target specific aspect of writing:

```
/write 5 --focus=dialogue
/write 5 --focus=description
/write 5 --focus=action
```

This adjusts:
- Prompt emphasis
- Context loading (more character data for dialogue)
- Style guide hints

### Style Variation

Override default style for specific chapter:

```
/write 5 --style=suspenseful
/write 5 --style=comedic
/write 5 --style=emotional
```

Temporarily adjusts:
- Sentence rhythm
- Vocabulary choices
- Pacing hints

### Revision Mode

Write with explicit revision focus:

```
/write 5 --revise
```

Loads additional context:
- Previous version of chapter (if exists)
- Review feedback from critic
- Specific revision notes
