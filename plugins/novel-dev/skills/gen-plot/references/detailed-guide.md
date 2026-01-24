# Gen-Plot Skill - Detailed Guide

## Overview

The gen-plot skill generates detailed plot files for all chapters based on the designed plot structure, character arcs, and narrative elements. It creates comprehensive chapter blueprints that guide the actual writing process.

## Prerequisites

Before running gen-plot, ensure these files exist:
- `meta/project.json` - Project metadata and target chapter count
- `meta/style-guide.json` - Writing style guidelines
- `plot/structure.json` - 3-act structure with chapter ranges
- `characters/*.json` - At least one character file
- `plot/main-arc.json` - Main plot arc
- `plot/foreshadowing.json` - Foreshadowing elements (optional)
- `plot/hooks.json` - Mystery hooks (optional)

## Execution Process

### Phase 1: Data Loading

Loads all design files to understand:
- Total chapters needed
- Act boundaries (Act 1: 1-15, Act 2: 16-40, Act 3: 41-50)
- Main arc events and timing
- Character arcs and development points
- Foreshadowing plant/payoff timing
- Hooks to place

### Phase 2: Sequential Chapter Generation

For each chapter (1 to N):

**Calls plot-architect agent** with:
- Project context
- Plot structure
- Previous chapters (for continuity)
- Character arcs
- Narrative elements to include

**Generates**:
- Chapter title
- Previous chapter summary (context for next chapter)
- Current chapter plot (1500 characters detailed)
- Next chapter preview (500 characters teaser)
- POV character
- Characters appearing
- Locations used
- In-story timestamp
- Foreshadowing to plant/payoff
- Hooks to include
- Character development beats
- Emotional goal for reader
- Scene breakdown (2-4 scenes per chapter)
- Style guide hints (tone, pacing)

### Phase 3: Context Chaining

Critical feature: Each chapter's "current_plot" becomes "previous_summary" for the next chapter.

This creates narrative flow:
- Chapter 1: previous_summary = "" (start of story)
- Chapter 2: previous_summary = Chapter 1's current_plot summary
- Chapter N: previous_summary = Summary of chapters N-3 to N-1

### Phase 4: File Generation

Creates `chapters/chapter_XXX.json` for each chapter with status="planned".

## Output Structure

### Chapter File Schema

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
    "current_plot": "...",
    "next_plot": "..."
  },
  
  "narrative_elements": {
    "foreshadowing_plant": [],
    "foreshadowing_payoff": [],
    "hooks_plant": ["hook_001"],
    "hooks_reveal": [],
    "character_development": "...",
    "emotional_goal": "궁금증, 의외성"
  },
  
  "scenes": [
    {
      "scene_number": 1,
      "purpose": "...",
      "characters": [],
      "location": "loc_XXX",
      "conflict": "...",
      "beat": "..."
    }
  ],
  
  "style_guide": {
    "tone": "가볍고 코믹하면서도 궁금증 유발",
    "pacing": "medium",
    "focus": "캐릭터 소개, 훅 설정"
  }
}
```

## Plot Distribution Principles

### 3-Act Structure Mapping

**Act 1 (Setup)**: Chapters 1-15 (30% of story)
- Introduce characters and world
- Establish normal world
- Inciting incident (around chapter 3-5)
- Plot Point 1 ending (chapter 15)

**Act 2 (Confrontation)**: Chapters 16-40 (50% of story)
- Rising complications
- Midpoint reversal (chapter 25-30)
- Dark night of the soul (chapter 38-40)
- Plot Point 2 transition (chapter 40)

**Act 3 (Resolution)**: Chapters 41-50 (20% of story)
- Climax (chapter 45-48)
- Resolution and denouement (chapter 49-50)

### Scene Density

Each chapter typically contains 2-4 scenes:
- **2 scenes**: Fast-paced, action-heavy chapters
- **3 scenes**: Standard chapters with balanced pacing
- **4 scenes**: Slower, character-development chapters

## Integration with Write Skill

Generated chapter plots become the blueprint for `/write`:

1. `/gen-plot` creates `chapter_005.json`
2. `/write 5` reads `chapter_005.json` as the blueprint
3. novel-writer agent uses:
   - previous_summary for context
   - current_plot as writing guide
   - scenes as structure
   - style_guide for tone/pacing
4. Outputs `chapter_005.md` (manuscript)

## Foreshadowing Management

### Planting Foreshadowing

If `foreshadowing.json` specifies:
```json
{
  "id": "fore_001",
  "plant_chapter": 8,
  "hints": [15, 22],
  "payoff_chapter": 35
}
```

Then:
- Chapter 8: `foreshadowing_plant: ["fore_001"]`
- Chapter 15: Include subtle hint
- Chapter 22: Include another hint
- Chapter 35: `foreshadowing_payoff: ["fore_001"]`

### Payoff Tracking

The system ensures:
- No payoff without prior planting
- Minimum gap between plant and payoff (5+ chapters)
- Hints distributed evenly

## Hook System

### Chapter-End Hooks

Every chapter should end with a hook:
- **Question hook**: Raise unanswered question
- **Action hook**: Mid-action cliffhanger
- **Revelation hook**: Shocking discovery
- **Emotion hook**: Peak emotional moment

Example from `hooks.json`:
```json
{
  "chapter": 1,
  "hook": "\"김유나 씨, 저와 연애하실 생각 없으십니까?\"",
  "purpose": "충격적 제안으로 2화 유입"
}
```

## Best Practices

### Iterative Plot Generation

**Option 1: Generate All At Once**
```bash
/gen-plot
```
Generates chapters 1-50 in one run (10-20 minutes).

**Option 2: Generate By Act**
```bash
/gen-plot 1-15    # Act 1
# Review Act 1
/gen-plot 16-40   # Act 2
# Review Act 2
/gen-plot 41-50   # Act 3
```

Option 2 allows mid-course corrections.

### Plot Density Guidelines

**Chapter plot length**:
- 1000-1500 characters: Sufficient detail for writing
- 500 characters: Too vague, hard to expand
- 2000+ characters: Over-specified, limits writer creativity

**Scene beats**:
- Each scene needs: purpose, conflict, emotional beat
- Avoid: "Characters talk" (too vague)
- Prefer: "Characters argue about contract terms, tension rises" (specific)

### Common Issues

**Issue: Pacing Problems**
- Act 2 sag: Add midpoint reversal around chapter 25-30
- Rushed Act 3: Ensure climax has 3-5 chapter buildup

**Issue: Repetitive Chapters**
- Vary scene counts (2/3/4 scenes)
- Alternate between action/dialogue/introspection
- Change locations frequently

**Issue: Lost Plot Threads**
- Track all foreshadowing payoffs
- Check that character arcs progress every 5-10 chapters
- Ensure sub-arcs resolve

## Quality Checklist

Before proceeding to writing:

- [ ] All chapters have titles
- [ ] Previous/current/next plot continuity maintained
- [ ] Foreshadowing planted before payoff
- [ ] Character arcs distributed across chapters
- [ ] Scene breakdown specific enough
- [ ] Emotional goals vary across chapters
- [ ] Hooks present at chapter ends
- [ ] Timeline consistency (no date contradictions)

## Advanced Features

### Parallel Plot Threads

For complex stories with multiple POVs:
```json
{
  "chapter_number": 15,
  "parallel_threads": [
    {
      "pov": "char_001",
      "plot": "유나가 계약 갱신 고민"
    },
    {
      "pov": "char_002",
      "plot": "준혁이 유나를 위해 가문과 대립"
    }
  ]
}
```

### Regression/Time-Travel Handling

For regression stories:
```json
{
  "timeline": "회귀 후",
  "divergence_from_original": "원래 타임라인에서는 이 시점에 주인공 사망",
  "knowledge_advantage": "주인공만 미래 사건 알고 있음"
}
```

### Mystery/Thriller Plot Tracking

```json
{
  "clues": [
    {
      "clue_id": "clue_003",
      "visible_to_reader": true,
      "visible_to_protagonist": false,
      "significance": "범인의 정체 힌트"
    }
  ]
}
```
