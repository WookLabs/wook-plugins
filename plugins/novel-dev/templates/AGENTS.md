<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-01-17 -->

# templates

## Purpose

Contains default JSON templates used during project initialization and file creation. Templates provide starting structures that match the corresponding schemas, with sensible defaults and placeholder values that are replaced during the initialization workflow.

Templates ensure that newly created projects have consistent structure and valid data from the start, reducing setup friction and validation errors.

## Key Files

| File | Template For | Usage |
|------|-------------|-------|
| `project.template.json` | `meta/project.json` | Used by `/init` command to create initial project metadata |
| `style-guide.template.json` | `meta/style-guide.json` | Used by `/init` to create default writing style guidelines |
| `character.template.json` | `characters/{char_id}.json` | Used by `/design_character` to create new character profiles |
| `chapter.template.json` | `chapters/chapter_NNN.json` | Used by `/gen_plot` to create chapter metadata structures |

## Template Structure

Templates are JSON files with:

1. **Empty Strings**: For fields that must be filled by agents or user input
2. **Null Values**: For optional fields that may not be applicable
3. **Empty Arrays**: For collection fields that will be populated
4. **Sensible Defaults**: For fields with common values (e.g., `rating: "15+"`, `status: "planning"`)

### Example: project.template.json

```json
{
  "id": "",                          // Filled by /init with timestamp
  "title": "",                       // Filled by plot-architect
  "subtitle": "",                    // Optional, may remain empty
  "series_name": "",                 // Optional
  "series_order": null,              // Optional
  "genre": [],                       // Filled by plot-architect
  "sub_genre": [],                   // Filled by plot-architect
  "tropes": [],                      // Filled by plot-architect
  "tone": [],                        // Filled by plot-architect
  "rating": "15+",                   // Default, can be changed
  "target_chapters": 50,             // Default, can be changed
  "target_words_per_chapter": 5000,  // Default, can be changed
  "current_chapter": 0,              // Always starts at 0
  "status": "planning",              // Always starts in planning
  "created_at": "",                  // Filled by /init with current timestamp
  "updated_at": ""                   // Filled by /init with current timestamp
}
```

## Template Usage Workflow

### /init Command Flow

1. **Load Template**: Read `templates/project.template.json`
2. **Generate ID**: Create timestamp-based ID (`novel_YYYYMMDD_HHmmss`)
3. **Invoke Agent**: Call plot-architect to fill title, genre, structure
4. **Merge Data**: Combine template defaults with agent output
5. **Add Timestamps**: Set `created_at` and `updated_at` to current time
6. **Validate**: Check against `schemas/project.schema.json`
7. **Write**: Create `novels/{novel_id}/meta/project.json`

### /design_character Command Flow

1. **Load Template**: Read `templates/character.template.json`
2. **Generate ID**: Create character ID (e.g., `char_001`)
3. **Invoke Agent**: Call lore-keeper with character brief
4. **Merge Data**: Combine template structure with agent output
5. **Validate**: Check against `schemas/character.schema.json`
6. **Write**: Create `novels/{novel_id}/characters/{char_id}.json`
7. **Update Index**: Add to `characters/index.json`

### /gen_plot Command Flow

1. **Load Template**: Read `templates/chapter.template.json`
2. **For Each Chapter** (1 to target_chapters):
   - Fill `chapter_number`, `title`, `act_number`
   - Invoke plot-architect for scenes and beats
   - Fill `scenes` array with scene objects
   - Add `foreshadowing_to_plant` IDs
   - Set `target_word_count`, `hooks`
3. **Validate**: Check each against `schemas/chapter.schema.json`
4. **Write**: Create `novels/{novel_id}/chapters/chapter_{NNN}.json`

## For AI Agents

### When to Use Templates

**Use templates when:**
- Creating new project (`/init`)
- Adding new character (`/design_character`)
- Generating plot structure (`/gen_plot`)
- Initializing new world settings
- Creating new arcs or story elements

**Don't use templates when:**
- Updating existing files (read current data instead)
- Creating summaries or reviews (no templates needed)
- Exporting (read from chapters, not templates)

### Template Modification Guidelines

When agents receive templates:

1. **Preserve Structure**: Don't add/remove top-level keys
2. **Fill Required Fields**: Replace empty strings with actual values
3. **Validate Types**: Ensure strings are strings, arrays are arrays, etc.
4. **Use Schema Enums**: For status, rating, etc., use only allowed values
5. **Keep Defaults**: If default makes sense, keep it (e.g., `rating: "15+"`)
6. **Add Optional Data**: Fill optional fields if relevant information available

### Common Template Fields

**Always fill these when using templates:**

| Field | Template Value | Agent Should Fill |
|-------|----------------|-------------------|
| `id` | `""` | Timestamp-based or sequential ID |
| `title` | `""` | Actual title from user/agent |
| `created_at` | `""` | Current ISO 8601 timestamp |
| `updated_at` | `""` | Current ISO 8601 timestamp |
| `genre` | `[]` | Array of genre strings |
| `status` | `"planning"` | Keep or update based on context |

**Safe to leave empty:**

| Field | Template Value | When to Fill |
|-------|----------------|--------------|
| `subtitle` | `""` | Only if novel has subtitle |
| `series_name` | `""` | Only if part of series |
| `series_order` | `null` | Only if part of series |
| `author` | undefined | Only if specified |
| `description` | undefined | Only if needed |

### Template-Agent Coordination

Different agents use different templates:

| Agent | Templates Used | Purpose |
|-------|----------------|---------|
| plot-architect | project, chapter | Fill story structure, beats, arcs |
| lore-keeper | character, world (if created) | Fill worldbuilding and character data |
| novelist | None | Reads from existing chapter JSON |
| editor | None | Reads and modifies existing chapters |
| critic | None | Reads chapters, creates reviews (no template) |

### Template Validation

**Before writing from template:**

```javascript
// 1. Load template
const template = readJSON('templates/project.template.json')

// 2. Agent fills data
const filledData = {
  ...template,
  id: generateID(),
  title: agentOutput.title,
  genre: agentOutput.genre,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
}

// 3. Validate
const schema = readJSON('schemas/project.schema.json')
const isValid = validate(filledData, schema)

if (!isValid) {
  throw new Error('Invalid data: ' + validationErrors)
}

// 4. Write
writeJSON('novels/novel_id/meta/project.json', filledData)
```

## Template Maintenance

### Adding New Templates

To add a new template:

1. **Create JSON file** in this directory
2. **Match corresponding schema** in `../schemas/`
3. **Use appropriate defaults**:
   - Empty strings for required text fields
   - Null for optional non-text fields
   - Empty arrays for collections
   - Sensible defaults for common values
4. **Document** in this AGENTS.md file
5. **Update commands** that should use the template
6. **Test** initialization workflow

### Updating Existing Templates

**When schema changes:**

1. **New Optional Field**: Add to template with empty/null/default value
2. **New Required Field**: Add to template with empty string or sensible default
3. **Removed Field**: Remove from template (only on major version)
4. **Changed Type**: Update template to match new type
5. **New Enum Value**: Update default if relevant

**Version synchronization:**
- Templates should always match current schema version
- When schema version bumps, review all templates
- Document changes in parent README.md

### Template Testing

**Test each template with:**

1. **Schema Validation**: Does filled template pass schema validation?
2. **Agent Integration**: Can agents successfully fill the template?
3. **File Creation**: Does command correctly use template to create files?
4. **Edge Cases**: Empty project, minimal data, maximum data

**Example test:**
```javascript
// Test project template
const template = readJSON('templates/project.template.json')

// Fill with minimal data
const minimal = {
  ...template,
  id: 'novel_20250117_143052',
  title: 'Test Novel',
  genre: ['로맨스'],
  created_at: '2025-01-17T14:30:52Z',
  updated_at: '2025-01-17T14:30:52Z'
}

// Should validate
assert(validate(minimal, projectSchema))
```

## Dependencies

**Templates depend on:**
- Schemas in `../schemas/` - Templates must produce valid schema-compliant data
- JSON specification - Templates are pure JSON files

**Templates are used by:**
- Commands in `../commands/` - Load templates for initialization
- Agents in `../agents/` - Receive templates to fill with data
- Scripts in `../scripts/` - May use templates for testing or migration

## Best Practices

**DO:**
- Keep templates minimal and focused
- Use sensible defaults for common values
- Match schema requirements exactly
- Document any non-obvious defaults
- Test templates with validation
- Update templates when schemas change

**DON'T:**
- Include example/dummy data (use empty strings instead)
- Add fields not in schema
- Use invalid enum values
- Skip required fields
- Use inconsistent formatting
- Hardcode project-specific values

## Template Files Detail

### project.template.json

**Defaults:**
- `rating: "15+"` - Most common rating for Korean web novels
- `target_chapters: 50` - Standard length
- `target_words_per_chapter: 5000` - Typical episode length
- `current_chapter: 0` - Not started
- `status: "planning"` - Initial phase

**Must be filled by /init:**
- `id`, `title`, `genre`, `created_at`, `updated_at`

### style-guide.template.json

**Defaults:**
- `narrative_voice: "3인칭 제한 시점"` - Most common for Korean novels
- `tense: "과거형"` - Standard narrative tense
- `pacing_default: "medium"` - Balanced pacing
- `dialogue_style: "자연스러운 구어체"` - Natural conversational style

**Must be filled by /init or design:**
- `tone`, `taboo_words`, `preferred_expressions`

### character.template.json

**Defaults:**
- `role: "supporting"` - Most characters are supporting
- `importance: "medium"` - Typical importance level
- Empty arrays for relationships (filled during design)

**Must be filled by /design_character:**
- `id`, `name`, `age`, `personality`, `backstory`, `goals`

### chapter.template.json

**Defaults:**
- `scenes: []` - Filled by plot-architect
- `target_word_count: 5000` - Matches project default
- `status: "planned"` - Initial state

**Must be filled by /gen_plot:**
- `chapter_number`, `title`, `act_number`, `scenes`, `foreshadowing_to_plant`, `hooks`

## Future Template Extensions

Potential new templates:

- `world.template.json` - For world settings initialization
- `arc.template.json` - For subplot arc structures
- `location.template.json` - For detailed location descriptions
- `timeline.template.json` - For story timeline management
- `review.template.json` - For standardized review structure

Each would follow the same principles: match schema, use sensible defaults, enable agent/command workflows.
