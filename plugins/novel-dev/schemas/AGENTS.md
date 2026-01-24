<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-01-17 -->

# schemas

## Purpose

Contains JSON Schema definitions for all data structures used in the novel writing workflow. These schemas ensure data consistency, enable validation, provide type safety, and serve as documentation for the expected structure of project files.

All JSON files created by commands and agents are validated against these schemas to prevent data corruption and maintain system integrity.

## Key Files

| File | Schema For | Description |
|------|-----------|-------------|
| `project.schema.json` | `meta/project.json` | Core project metadata including ID, title, genre, target chapters, current status, timestamps |
| `style-guide.schema.json` | `meta/style-guide.json` | Writing style guidelines including narrative voice, POV, tone, pacing, taboo words, preferred expressions |
| `world.schema.json` | `world/world.json` | Worldbuilding settings including rules, magic systems, technology levels, cultural norms |
| `character.schema.json` | `characters/{char_id}.json` | Character profiles with personality, backstory, goals, relationships, speech patterns |
| `chapter.schema.json` | `chapters/chapter_NNN.json` | Chapter metadata with scenes, emotional beats, word count targets, foreshadowing to plant |
| `foreshadowing.schema.json` | `plot/foreshadowing.json` | Foreshadowing elements with IDs, plant locations, payoff locations, hint types |
| `hooks.schema.json` | `plot/hooks.json` | Story hooks and cliffhangers with types, locations, emotional impacts |

## Schema Structure

All schemas follow JSON Schema Draft 07 specification:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://novel-dev.org/schemas/[schema-name].schema.json",
  "title": "SchemaName",
  "description": "Schema description",
  "type": "object",
  "required": ["field1", "field2"],
  "properties": {
    "field1": {
      "type": "string",
      "description": "Field description",
      "pattern": "regex if needed"
    }
  }
}
```

### Schema Design Principles

1. **Strict Required Fields**: Core fields are always required
2. **Flexible Optional Fields**: Extensions allowed for customization
3. **Type Safety**: Explicit types for all fields (string, number, array, object)
4. **Validation Constraints**: Patterns, min/max, enums where appropriate
5. **Documentation**: Descriptions for all fields
6. **Backward Compatibility**: Additive changes only, never breaking

## Schema Details

### project.schema.json

**Required Fields:**
- `id` (pattern: `novel_YYYYMMDD_HHmmss`)
- `title`, `genre`, `target_chapters`, `target_words_per_chapter`
- `current_chapter`, `status`, `created_at`, `updated_at`

**Optional Fields:**
- `subtitle`, `series_name`, `series_order`, `author`, `description`, `tags`
- `sub_genre`, `tropes`, `tone`, `rating`

**Enums:**
- `status`: planning, writing, editing, complete, paused
- `rating`: 전체, 12+, 15+, 19+

### style-guide.schema.json

**Key Fields:**
- `narrative_voice`: POV type (1인칭, 3인칭 제한, 3인칭 전지적)
- `pov_type`: single, dual, multiple, rotating
- `tense`: 과거형, 현재형, 혼합
- `tone`: Array of tone descriptors
- `pacing_default`: fast, medium, slow
- `taboo_words`: Array of words to avoid
- `preferred_expressions`: Array of recommended phrases
- `chapter_structure`: Settings for opening hooks, scene counts, ending hooks

### character.schema.json

**Key Sections:**
- **Basic Info**: name, age, gender, role (protagonist, antagonist, supporting)
- **Appearance**: Physical description
- **Personality**: Traits, MBTI, values, fears, desires
- **Backstory**: History, formative events
- **Goals**: Immediate and long-term objectives
- **Speech Pattern**: Vocabulary level, catchphrases, accent
- **Relationships**: Links to other character IDs

### chapter.schema.json

**Structure:**
- `chapter_number`, `title`, `act_number`
- `scenes`: Array of scene objects with setting, characters, purpose, emotional_beat, word_count_target
- `foreshadowing_to_plant`: Array of foreshadowing IDs
- `hooks`: Chapter-end hook description
- `target_word_count`, `emotional_arc`

### foreshadowing.schema.json

**Elements:**
- `id`: Unique identifier
- `type`: object, dialogue, behavior, environment, symbol
- `hint`: What to plant
- `payoff`: What it reveals later
- `plant_chapter`: Where to introduce
- `payoff_chapter`: Where to resolve
- `subtlety`: obvious, moderate, subtle, very_subtle

## For AI Agents

### When to Validate

**Always validate:**
- Before writing JSON files (commands use schemas)
- After agent-generated JSON outputs
- During `/init` and design commands
- Before quality gates and consistency checks

**Validation workflow:**
```javascript
// Read schema
const schema = readJSON('schemas/project.schema.json')

// Validate data
const data = agentOutput
const isValid = validate(data, schema)

if (!isValid) {
  reportErrors(validationErrors)
  requestCorrection()
}

// Write only if valid
writeJSON('novels/project_id/meta/project.json', data)
```

### Schema Usage by Agent

| Agent | Schemas Used |
|-------|--------------|
| plot-architect | project, chapter, foreshadowing, hooks |
| lore-keeper | world, character, style-guide |
| novelist | chapter (input), validates against style-guide |
| editor | chapter (input/output), style-guide |
| critic | chapter (input) |
| proofreader | chapter (input) |
| summarizer | chapter (input) |

### Common Validation Errors

| Error | Cause | Fix |
|-------|-------|-----|
| Missing required field | Agent didn't include mandatory field | Update agent prompt to include field |
| Invalid enum value | Agent used wrong status/rating | Specify allowed values in prompt |
| Pattern mismatch | ID format wrong (e.g., `novel_20250117`) | Enforce pattern in prompt with example |
| Type error | String where number expected | Validate agent output before writing |
| Array item invalid | Character relationship has invalid structure | Validate nested objects |

### Extending Schemas

**To add new optional field:**
1. Add to `properties` section
2. Include `description`
3. Specify `type` and constraints
4. Do NOT add to `required` array (breaking change)
5. Update documentation in this file
6. Update templates if needed

**To add new required field (AVOID):**
- This breaks existing projects
- Only do in major version bumps
- Provide migration script
- Update all templates

**Example addition:**
```json
{
  "properties": {
    "new_field": {
      "type": "string",
      "description": "New optional field for X",
      "default": "default_value"
    }
  }
}
```

### Schema Validation Tools

**Recommended validators:**
- [AJV](https://ajv.js.org/) - Fast JSON Schema validator for JavaScript/TypeScript
- [JSON Schema Validator](https://www.jsonschemavalidator.net/) - Online validator for testing

**Usage in TypeScript:**
```typescript
import Ajv from 'ajv'
import projectSchema from './schemas/project.schema.json'

const ajv = new Ajv()
const validate = ajv.compile(projectSchema)

const data = { /* project data */ }
const valid = validate(data)

if (!valid) {
  console.error(validate.errors)
}
```

## Dependencies

**Schemas depend on:**
- JSON Schema Draft 07 specification
- No external dependencies (pure JSON)

**Schemas are used by:**
- Commands for validation before writing files
- Agents for understanding expected output formats
- Templates as initialization defaults
- Scripts for data integrity checks
- External tools for type generation (e.g., TypeScript interfaces)

## Schema Versioning

Current version: 1.0.0

**Version policy:**
- Patch (1.0.x): Documentation updates, clarifications
- Minor (1.x.0): New optional fields, new enums
- Major (x.0.0): Breaking changes (new required fields, removed fields, type changes)

**$id URIs:**
- Schemas use `https://novel-dev.org/schemas/` namespace
- Include schema name: `project.schema.json`, `character.schema.json`
- Version in URI on major version changes

## Testing Schemas

**Validation tests:**
```json
// Valid project.json
{
  "id": "novel_20250117_143052",
  "title": "Test Novel",
  "genre": ["로맨스"],
  "target_chapters": 50,
  "target_words_per_chapter": 5000,
  "current_chapter": 0,
  "status": "planning",
  "created_at": "2025-01-17T14:30:52Z",
  "updated_at": "2025-01-17T14:30:52Z"
}

// Invalid (missing required field)
{
  "id": "novel_20250117_143052",
  "title": "Test Novel"
  // Missing genre, target_chapters, etc.
}

// Invalid (wrong pattern)
{
  "id": "invalid_id",  // Should match novel_YYYYMMDD_HHmmss
  ...
}
```

**Test coverage should include:**
- All required fields present
- All required fields missing
- Optional fields present/absent
- Enum values (valid and invalid)
- Pattern matching (IDs, dates)
- Type validation (string vs number)
- Array validation (empty, single, multiple items)
- Nested object validation

## Schema Best Practices

**DO:**
- Provide detailed descriptions for all fields
- Use enums for fixed value sets
- Use patterns for IDs and formatted strings
- Specify min/max for numbers and string lengths
- Mark truly required fields as required
- Document units (e.g., "word count", "chapter number")
- Use examples in descriptions

**DON'T:**
- Add required fields in minor versions
- Remove fields (deprecate instead)
- Change field types (breaking change)
- Use ambiguous field names
- Skimp on descriptions
- Over-constrain (allow flexibility where appropriate)
- Forget to update templates when adding fields
