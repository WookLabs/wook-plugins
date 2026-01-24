# Design-Character Skill - Detailed Guide

## Overview

The design-character skill creates comprehensive character profiles including personality, background, motivations, arcs, and behavioral patterns. It integrates with the lore-keeper agent to ensure characters fit naturally within the established world.

## Character Design Philosophy

### Want vs. Need Framework

Every character is built on the Want/Need dichotomy:

- **Want**: What the character thinks they need (surface goal)
- **Need**: What they actually need (deep character growth)

Example:
- Want: "승진해서 능력을 인정받고 싶다" (Get promoted to be recognized)
- Need: "자신의 가치를 외부 평가가 아닌 내면에서 찾기" (Find self-worth internally)

The gap between Want and Need creates internal conflict and drives character arcs.

### Fatal Flaw

Each character has a **Fatal Flaw** that:
- Blocks them from achieving their Need
- Must be overcome for growth
- Creates believable obstacles

Example: "타인의 시선에 지나치게 의존" (Over-dependence on others' opinions)

## Execution Process

### Phase 1: Argument Parsing

**With character name**:
```
/design-character 김유나
```
→ Designs only that specific character

**Without arguments**:
```
/design-character
```
→ Enters interview mode to design all major characters

### Phase 2: Context Loading

The skill loads:
- `meta/project.json` - Genre, tone, target chapters
- `world/world.json` - World settings for grounding
- `world/locations.json` - For residence/workplace assignment

### Phase 3: lore-keeper Agent Call

The lore-keeper receives comprehensive context and generates:

**Basic Profile**:
- Name, age, gender
- Physical appearance (height, build, distinctive features)
- Voice tone and speech patterns
- Vocabulary preferences

**Background**:
- Origin and family
- Education and occupation
- Economic status
- Past trauma
- Secrets (with reveal timing)

**Inner Life**:
- Want (surface desire)
- Need (true growth)
- Fatal Flaw
- Values and fears

**Behavioral Patterns**:
- Habits and hobbies
- Stress responses
- Lying tells
- Dislikes

**Character Arc**:
- Start state
- Catalyst for change
- Midpoint realization
- Dark night of the soul
- Transformation
- End state

### Phase 4: File Generation

#### Individual Character Files
`characters/{char_id}_{name}.json`

Each contains complete character profile.

#### Character Index
`characters/index.json`

Lists all characters with roles:
- Protagonist
- Deuteragonist (main supporting)
- Antagonist
- Supporting cast

#### Relationship Matrix
`characters/relationships.json`

Defines character relationships:
- Initial state
- Evolution by chapter
- Final state
- Conflict points
- Chemistry type

## Output Structure

### Character File Fields

| Section | Fields | Purpose |
|---------|--------|---------|
| Basic | name, aliases, age, gender, appearance, voice | Physical/surface traits |
| Background | origin, family, occupation, trauma, secrets | History and context |
| Inner | want, need, fatal_flaw, values, fears | Motivation and growth |
| Behavior | habits, hobbies, stress_response, lying_tell | Consistent actions |
| Arc | start_state → transformation → end_state | Character journey |

### Relationship Fields

| Field | Purpose |
|-------|---------|
| relationship_type | Label (친구/연인/적) |
| initial_state | Starting dynamic |
| evolution | Chapter-by-chapter changes |
| final_state | Ending dynamic |
| conflict_points | Sources of tension |
| chemistry_type | Interaction style (밀당/티격태격) |

## Character Archetypes by Genre

### Romance
- **Protagonist**: Relatable, flawed, capable of growth
- **Love Interest**: Complementary flaw, external obstacles
- **Rival**: Professional or romantic competition
- **Best Friend**: Confidant and advice-giver

### Fantasy
- **Hero**: Reluctant or chosen, clear Want/Need gap
- **Mentor**: Guides but has own arc
- **Antagonist**: Ideological opposition, not pure evil
- **Sidekick**: Comic relief + skills hero lacks

### Thriller
- **Detective/Investigator**: Obsessive, personal stakes
- **Victim**: More than just victim, has agency
- **Antagonist**: Intelligent, motivated by clear goals
- **Red Herring**: Suspicious but innocent

## Korean Web Novel Techniques

### Speech Patterns (말투)

Character differentiation through dialogue:

**Formal** (존댓말 위주):
```
"저는 그렇게 생각하지 않습니다."
```
Use for: Workplace, respect, distance

**Informal** (반말):
```
"난 그렇게 안 생각해."
```
Use for: Close relationships, casual settings

**Mixed** (상황에 따라 변화):
```
"저... 그게 말이죠..." → "아, 진짜!"
```
Use for: Characters adapting to situation

### Personality Through Vocabulary

**Businesslike**:
- Uses terms: 보고서, 일정, 성과
- Short, efficient sentences

**Intellectual**:
- Uses: 본질적으로, 관점에서, 맥락
- Longer, complex sentences

**Casual/Young**:
- Uses: 완전, 대박, 진짜
- Sentence fragments, exclamations

## Character Secrets System

Every character can have secrets with controlled reveal:

```json
"secret": {
  "content": "실은 재벌가 숨겨진 딸",
  "reveal_chapter": 35,
  "hints_before": [8, 15, 22, 30],
  "impact": "관계 파탄, 플롯 반전"
}
```

**Best Practices**:
- Plant hints before reveal (최소 3회)
- Secrets should impact plot, not just surprise
- A-level secrets: Protagonist only
- B-level secrets: Major supporting cast
- C-level secrets: Background details

## Character Arc Pacing

### 3-Act Structure Alignment

**Act 1 (Setup)**:
- Introduce character in start_state
- Show Want clearly
- Hint at Need subtly
- Display Fatal Flaw

**Act 2 (Confrontation)**:
- Catalyst challenges start_state
- Want/Need conflict escalates
- Midpoint: First awareness of Need
- Dark night: Fatal Flaw causes major loss

**Act 3 (Resolution)**:
- Transformation moment
- Choose Need over Want
- Overcome Fatal Flaw
- Reach end_state

### Pacing Example (50-chapter Romance)

```json
{
  "arc": {
    "start_state": "일 중독, 감정 억압",  // Chapter 1-5
    "catalyst": "계약 연애 제안",         // Chapter 3
    "midpoint": "가짜가 진짜가 됨 인지",   // Chapter 25
    "dark_night": "비밀 폭로로 모든 것 상실", // Chapter 40-42
    "transformation": "자신의 행복 선택",  // Chapter 45
    "end_state": "진정한 사랑과 자아 수용"  // Chapter 50
  }
}
```

## Integration with Other Skills

**Depends on**:
- `/init` - Project structure
- `/design-world` - Location references

**Feeds into**:
- `/design-main-arc` - Character goals drive plot
- `/design-relationship` - Relationship details
- `/gen-plot` - Characters assigned to scenes
- `/write` - Personality informs dialogue/actions

## Idempotency System

### First Run
Creates all character files fresh.

### Subsequent Runs
1. Reads existing files
2. Preserves manual edits in `<!-- MANUAL -->` sections
3. Merges new suggestions
4. Warns on conflicts

**Manual Edit Example**:
```json
{
  "name": "김유나",
  "<!-- MANUAL -->": {
    "custom_trait": "사실 좌파 경향의 독서광",
    "secret_hobby": "밤에 웹소설 쓰기"
  }
}
```

These survive re-runs.

## Character Count Guidelines

| Novel Length | Main Characters | Supporting Cast | Total |
|--------------|-----------------|-----------------|-------|
| 20-30 chapters | 2-3 | 3-5 | 5-8 |
| 50 chapters | 3-5 | 5-8 | 8-13 |
| 100+ chapters | 5-7 | 10-15 | 15-22 |

**Anti-Pattern**: Too many characters dilutes focus
**Best Practice**: Start minimal, add during `/gen-plot` if needed

## Common Character Flaws by Genre

### Romance
- Over-independence / Can't ask for help
- Trust issues from past relationships
- Workaholism / Emotional unavailability
- Low self-worth / Imposter syndrome

### Fantasy
- Arrogance / Underestimates enemies
- Revenge obsession / Can't let go
- Savior complex / Thinks they must do everything alone
- Fear of own power / Self-sabotage

### Thriller
- Obsessiveness / Ignores personal life
- Paranoia / Can't trust anyone
- Guilt from past failure / Overcompensation
- Recklessness / Puts self in danger

## Advanced Features

### Character Variants

For complex stories:
```
/design-character 김유나 --variant=past
```

Creates alternate version (for flashbacks, regression, etc.):
```json
{
  "id": "char_001_past",
  "name": "김유나 (10년 전)",
  "age": 18,
  "personality_diff": "더 순수, 낙관적"
}
```

### Ensemble Cast Mode

```
/design-character --ensemble
```

Focuses on:
- Balanced screen time
- Interconnected arcs
- Group dynamics
- Multiple POVs

### Relationship-First Design

```
/design-character --from-relationship
```

Starts from relationship concept:
- What chemistry do we want?
- What conflict drives them?
- Design characters to create that dynamic

## Quality Checklist

Before proceeding to plot design:

- [ ] Each character has clear Want and Need
- [ ] Fatal Flaw is believable and relevant
- [ ] Character arc has defined start/end states
- [ ] Speech patterns differentiate characters
- [ ] Background justifies personality
- [ ] At least one secret per major character
- [ ] Relationship matrix defines key dynamics

## Troubleshooting

### Issue: Characters Feel Generic
**Symptom**: All characters sound the same
**Solution**:
- Define distinct speech patterns
- Give each unique vocabulary
- Differentiate stress responses
- Add specific habits/quirks

### Issue: Unmotivated Actions
**Symptom**: Characters do things for plot convenience
**Solution**:
- Ensure Want/Need drive actions
- Every choice should reflect values or flaw
- Inconsistency = character growth moment, not randomness

### Issue: Flat Supporting Cast
**Symptom**: Side characters are one-dimensional
**Solution**:
- Every character, even minor, has a goal
- Give them at least one defining trait
- Show how they change (even slightly)

### Issue: Overpowered/Underpowered
**Symptom**: Character solves/creates all problems
**Solution**:
- Balance strengths with clear weaknesses
- Fatal Flaw should counterbalance talents
- Support cast compensates for protagonist gaps
