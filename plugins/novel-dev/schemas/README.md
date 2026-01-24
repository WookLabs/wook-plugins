# Novel-Sisyphus JSON Schemas

This directory contains JSON Schema definitions for the Novel-Sisyphus project.

## Schema Files

| Schema | Purpose | Key Constraints |
|--------|---------|-----------------|
| **project.schema.json** | Novel project metadata | title≤100, chapters≤1000, words≤50000 |
| **chapter.schema.json** | Chapter structure and metadata | scenes≤20, plot≤2000 chars |
| **character.schema.json** | Character profiles | name≤50, aliases≤10, traits≤10 |
| **foreshadowing.schema.json** | Narrative foreshadowing elements | hints≤10, content≤1000 |
| **world.schema.json** | World-building settings | locations≤100, norms≤20 |
| **style-guide.schema.json** | Writing style guidelines | taboo_words≤50, expressions≤50 |
| **hooks.schema.json** | Story hooks and mysteries | clues≤15, content≤1000 |
| **plot.schema.json** | Plot structure and acts | acts≤10, key_events≤10 |
| **review.schema.json** | Chapter evaluation results | score 0-100, strengths≤10 |
| **summary.schema.json** | Chapter summaries | key_events≤5, summary≤2000 |
| **relationship.schema.json** | Character relationships | evolution≤20 |
| **timeline.schema.json** | Story timeline events | characters≤20 per event |
| **consistency-report.schema.json** | Consistency check results | issues with severity levels |
| **ralph-state.schema.json** | Ralph Loop execution state | tracks writing progress |

## Validation Constraints

### String Lengths
- **Short names**: 50 characters (character names, authors)
- **Titles**: 100-200 characters
- **Descriptions**: 300-1500 characters
- **Long text**: 1000-2000 characters (plots, summaries)

### Array Limits
- **Small lists**: 5-10 items (key events, hints)
- **Medium lists**: 10-20 items (scenes, characters in event)
- **Large lists**: 50-100 items (locations, related characters)

### Defaults
- `project.status`: "planning"
- `project.rating`: "전체"
- `chapter.status`: "planned"
- `style_guide.pacing_default`: "medium"
- `foreshadowing.status`: "not_planted"
- `timeline.events.importance`: "minor"

## ID Patterns

- **Novel**: `novel_YYYYMMDD_HHmmss`
- **Character**: `char_[a-z0-9_]+`
- **Location**: `loc_[a-z0-9_]+`
- **Foreshadowing**: `fore_[a-z0-9_]+`
- **Hook**: `hook_[a-z0-9_]+`

## Validation

Run the validation script to check all schemas:

```bash
./validate_schemas.sh
```

## Recent Changes

See [CHANGELOG.md](./CHANGELOG.md) for detailed enhancement history.

### Latest Update (2025-01-17)
- Added comprehensive validation constraints
- Introduced default values for common fields
- Implemented maxLength/maxItems limits
- Enhanced ID pattern validation
- All 14 schemas updated and validated

## Usage Examples

### Validating a Project File

```python
import json
import jsonschema

with open('schemas/project.schema.json') as f:
    schema = json.load(f)

with open('project.json') as f:
    data = json.load(f)

jsonschema.validate(data, schema)  # Raises error if invalid
```

### Required vs Optional Fields

Fields in `required` array must be present. Others are optional but must conform to schema if present.

Example for `project.schema.json`:
- **Required**: id, title, genre, target_chapters, target_words_per_chapter, current_chapter, status, created_at, updated_at
- **Optional**: author, description, subtitle, series_name, tags, etc.

## Schema Structure

Each schema follows JSON Schema Draft 07 specification:
- `$schema`: JSON Schema version
- `$id`: Unique schema identifier
- `title`: Human-readable title
- `description`: Schema purpose
- `type`: Root type (usually "object")
- `required`: Array of required fields
- `properties`: Field definitions
- `definitions`: Reusable components (if any)

## Best Practices

1. **Use defaults**: Reduces boilerplate in JSON files
2. **Respect limits**: Stay within maxLength/maxItems constraints
3. **Follow patterns**: Use consistent ID formats
4. **Validate early**: Check schema compliance during creation
5. **Document deviations**: If you need to exceed limits, document why

## Contributing

When modifying schemas:

1. Update the schema file
2. Update CHANGELOG.md
3. Run `./validate_schemas.sh`
4. Test with existing project files
5. Update this README if adding new schemas

## Support

For questions or issues with schemas, refer to the Novel-Sisyphus documentation or open an issue on the project repository.
