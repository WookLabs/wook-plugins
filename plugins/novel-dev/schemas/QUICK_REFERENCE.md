# Schema Constraints Quick Reference

## String Length Limits

| Field Type | Max Length | Examples |
|------------|------------|----------|
| Names | 50 | character name, author |
| Short titles | 100 | project title, series name |
| Long titles | 200 | chapter title, subtitle |
| Short descriptions | 300 | dialogue style, events |
| Medium descriptions | 500 | cliffhanger, suggestions |
| Long descriptions | 1000 | plot summary, foreshadowing |
| Very long | 1500-2000 | location details, chapter context |

## Array Limits

| Array Type | Max Items | Examples |
|------------|-----------|----------|
| Very small | 5 | key_events (summary) |
| Small | 10 | aliases, hints, traits, strengths |
| Medium | 15-20 | scenes, character evolution, clues |
| Large | 50 | taboo_words, related_characters (location) |
| Very large | 100 | locations in world |

## Numeric Ranges

| Field | Min | Max | Default |
|-------|-----|-----|---------|
| target_chapters | 1 | 1000 | - |
| target_words_per_chapter | 500 | 50000 | - |
| chapter_number | 1 | - | - |
| scene_number | 1 | - | - |
| total_score | 0 | 100 | - |
| quality_retries | 0 | 3 | - |
| max_iterations | 1 | - | 100 |

## Default Values

```yaml
# Project
status: "planning"
rating: "전체"

# Chapter
status: "planned"

# Style Guide
pacing_default: "medium"

# Narrative Elements
foreshadowing.status: "not_planted"
hooks.status: "not_planted"

# Timeline
events.importance: "minor"

# Review
passed: false

# Relationship
bidirectional: true

# Ralph State
mode: "idle"
ralph_active: false
```

## ID Patterns

```regex
novel:         ^novel_\d{8}_\d{6}$        # novel_20250117_150000
character:     ^char_[a-z0-9_]+$          # char_001, char_protagonist
location:      ^loc_[a-z0-9_]+$           # loc_001, loc_cafe
foreshadowing: ^fore_[a-z0-9_]+$          # fore_001
hook:          ^hook_[a-z0-9_]+$          # hook_001
```

## Enums

### Project
- **status**: planning, writing, editing, complete, paused
- **rating**: 전체, 12+, 15+, 19+

### Chapter
- **status**: planned, draft, edited, final, published
- **pacing**: fast, medium, slow

### Character
- **role**: protagonist, deuteragonist, antagonist, supporting, minor, cameo

### Foreshadowing
- **importance**: A, B, C
- **status**: not_planted, planted, hinting, paid_off

### Hooks
- **status**: not_planted, active, revealed
- **hook_type**: cliffhanger, revelation, question, shocking_dialogue, action, emotional
- **importance**: primary, secondary, tertiary

### Review
- **severity**: critical, major, minor

### Relationship
- **type**: family, friend, romantic, rival, mentor, enemy, colleague, acquaintance, other
- **dynamic**: positive, negative, neutral, complex

### Timeline
- **time_unit**: day, week, month, year
- **importance**: major, minor, background
- **conflict_type**: simultaneous_presence, impossible_travel, chronology_error

## Most Common Constraints

### For Authors/Names
```json
{
  "type": "string",
  "maxLength": 50
}
```

### For Descriptions
```json
{
  "type": "string",
  "maxLength": 500
}
```

### For Lists of Items
```json
{
  "type": "array",
  "items": {
    "type": "string",
    "maxLength": 200
  },
  "maxItems": 10
}
```

### For Chapters
```json
{
  "type": "integer",
  "minimum": 1
}
```

### For Character References
```json
{
  "type": "string",
  "pattern": "^char_[a-z0-9_]+$"
}
```

## Validation Tips

1. **Check length before saving**: Ensure text fields don't exceed maxLength
2. **Count array items**: Don't exceed maxItems limits
3. **Use enums**: Only use predefined values for enum fields
4. **Follow ID patterns**: Use consistent ID formats
5. **Set defaults**: Leverage default values to reduce typing

## Common Mistakes to Avoid

- ❌ title > 100 chars → ✓ Keep titles concise
- ❌ More than 20 scenes → ✓ Break into multiple chapters
- ❌ Invalid status value → ✓ Use enum values only
- ❌ Custom ID format → ✓ Follow pattern requirements
- ❌ Unbounded arrays → ✓ Respect maxItems limits

## Quick Validation Check

```bash
# In schemas directory
./validate_schemas.sh

# All schemas valid?
# Yes: ✓ You're good to go
# No: Check error messages
```
