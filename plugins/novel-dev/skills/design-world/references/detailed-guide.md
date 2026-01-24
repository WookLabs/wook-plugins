# Design-World Skill - Detailed Guide

## Overview

The design-world skill creates the foundational worldbuilding for your novel by generating comprehensive world settings, location databases, and terminology dictionaries.

## When to Use

- **After `/init`**: World design is typically the first design step after project initialization
- **Before character design**: Having a world helps ground characters in specific locations and contexts
- **Genre-specific**: Especially important for fantasy/SF, but valuable for all genres

## Execution Process

### Phase 1: Project Data Loading

The skill reads existing project metadata to understand context:

```json
// From meta/project.json
{
  "genre": "로맨스",
  "tone": ["달달", "코믹"],
  "target_chapters": 50
}
```

This informs world design decisions like:
- **Genre** → Technology level, special systems
- **Tone** → Atmosphere of locations
- **Target length** → Number of locations needed

### Phase 2: lore-keeper Agent Call

The lore-keeper agent is specialized in worldbuilding consistency. It receives:

**Input Context:**
- Genre and tone
- Target chapter count
- Any user-specified requirements

**Expected Output:**
- Temporal setting (era, year)
- Geographic setting (country, city, specific districts)
- Technology level
- Social structures and norms
- Special systems (magic, abilities) if applicable
- Location database (5+ key locations)
- Terminology dictionary

### Phase 3: File Generation

Three files are created:

#### 1. world/world.json
Core world settings including era, geography, tech level, and social context.

#### 2. world/locations.json
Database of locations where scenes occur:
- Protagonist's home/workplace
- Key meeting places
- Recurring locations
- One-time significant locations

#### 3. world/terms.json
Glossary of world-specific terminology:
- Special jargon
- Fantasy/SF terminology
- Cultural concepts
- Organization names

## Idempotency Handling

If world files already exist:

1. **Read existing content** first
2. **Preserve manual edits** in `<!-- MANUAL -->` sections
3. **Merge** new auto-generated content
4. **Warn** if conflicts detected

This allows iterative refinement without losing work.

## Output Structure

### world.json Fields

| Field | Type | Purpose |
|-------|------|---------|
| `era` | string | Time period (현대/근대/중세/미래) |
| `year` | string | Specific year or era name |
| `location` | object | Geographic setting hierarchy |
| `technology_level` | string | Available technology |
| `social_context` | object | Norms, issues, hierarchies |
| `special_systems` | array | Magic/powers (optional) |

### locations.json Structure

Each location includes:
- **id**: Unique identifier (loc_001)
- **name**: Display name
- **type**: Category (거주지/사무실/공공장소)
- **description**: Physical details
- **atmosphere**: Mood/feeling
- **related_characters**: Who uses this location

### terms.json Structure

- **term**: The word/phrase
- **definition**: Meaning in-world
- **first_use_chapter**: When introduced
- **category**: Term type

## Genre-Specific Variations

### Modern Romance
- Focus on relatable locations (apartments, offices, cafes)
- Minimal terminology (company names, locations)
- Realistic social contexts (workplace hierarchy, dating culture)

### Fantasy
- Extensive location types (kingdoms, magical academies, dungeons)
- Rich terminology (magic systems, species, titles)
- Complex social structures (nobility, guilds, factions)

### Science Fiction
- Technology-focused locations (space stations, labs)
- Technical terminology (ship types, alien races, tech)
- Future social structures

## Integration with Other Skills

**Feeds into:**
- `/design-character` - Characters are grounded in specific locations
- `/design-main-arc` - Plot events occur in defined locations
- `/gen-plot` - Each chapter references world locations
- `/write` - Consistent worldbuilding for scene descriptions

**Depends on:**
- `/init` - Project metadata must exist first

## Best Practices

### Start Broad, Then Specific
1. Define era and geography first
2. Add 3-5 core locations
3. Expand location database as needed during plotting
4. Add terms as they become relevant

### Keep it Grounded
- Even fantasy needs internal consistency
- Modern settings benefit from specific locations (real neighborhoods, not generic "city")
- Technology level should match era

### Plan for Growth
- Start with essential locations
- Add more during `/gen-plot` phase
- Use `<!-- MANUAL -->` sections for crucial custom details

### Avoid Over-Design
- Don't create 50 locations upfront
- Focus on locations that drive plot
- Generic locations (random cafe) don't need entries

## Common Issues

### Issue: Too Generic
**Problem**: "서울 어딘가의 회사"
**Solution**: Specify district, company size, industry

### Issue: Inconsistent Tech Level
**Problem**: Modern setting with unrealistic technology
**Solution**: Ground in actual current tech, or justify future setting

### Issue: Unused Locations
**Problem**: 20 locations designed, only 5 used
**Solution**: Design iteratively - start minimal, expand during plotting

### Issue: Missing Social Context
**Problem**: Characters exist in a vacuum
**Solution**: Define workplace culture, dating norms, family expectations

## Advanced Features

### Iterative Refinement
Run `/design-world` multiple times to refine:
```bash
/design-world  # Initial creation
# ... review output ...
/design-world  # Refine with manual edits preserved
```

### Partial Updates
Manually edit files, then re-run to fill gaps:
- Edit world.json to add custom social norms
- Re-run to generate missing location details

### Cross-Reference Validation
After character design:
```bash
/design-world  # Update to add character-specific locations
```

## File Size Estimates

| File | Typical Size | Token Budget |
|------|--------------|--------------|
| world.json | 1-3 KB | ~500-1500 tokens |
| locations.json | 3-10 KB | ~1500-5000 tokens |
| terms.json | 1-5 KB | ~500-2500 tokens |

Total world context: ~2500-9000 tokens

This fits comfortably within chapter writing context budgets (15K allocated for world).

## Quality Checklist

Before proceeding to character design:

- [ ] Era and year specified
- [ ] Geographic setting clear (country → city → district)
- [ ] At least 3 core locations defined
- [ ] Social context relevant to plot
- [ ] Technology level consistent with era
- [ ] Special systems explained if present
- [ ] Terms defined for any jargon used

## Examples by Genre

### Example 1: Modern Romance
```json
{
  "era": "현대",
  "year": "2025년",
  "location": {
    "country": "대한민국",
    "city": "서울",
    "district": "강남구"
  },
  "technology_level": "현대 기술",
  "social_context": {
    "norms": ["직장 내 서열", "외모 중시 사회"],
    "issues": ["워라밸", "연애 시장"]
  }
}
```

### Example 2: Fantasy
```json
{
  "era": "중세 판타지",
  "year": "마법력 3500년",
  "location": {
    "continent": "아르테리스",
    "kingdom": "루나리스 왕국",
    "capital": "은월성"
  },
  "technology_level": "중세 + 마법",
  "social_context": {
    "norms": ["귀족 계급제", "마법사 길드 우위"],
    "issues": ["마법 자원 고갈", "이종족 차별"]
  },
  "special_systems": [
    {
      "name": "마나 체계",
      "description": "모든 생명체는 마나를 지님, 수련으로 증폭 가능"
    }
  ]
}
```

## Troubleshooting

### Error: Missing project.json
```
Cannot design world: meta/project.json not found
Run '/init' first to create project structure
```
**Solution**: Run `/init` to create project first

### Warning: Existing files
```
world/world.json already exists
Loading existing content...
Merging with new suggestions...
```
**Expected behavior**: Idempotency system is working

### Error: Genre mismatch
```
Warning: Genre 'thriller' but world has 'cute' atmosphere
Review tone settings in meta/project.json
```
**Solution**: Ensure genre and tone are aligned
