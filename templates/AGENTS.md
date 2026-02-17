# Templates Directory - AI Navigation Guide

This directory contains reusable templates for creating Claude Code plugins.

## Overview

The templates provide a standardized starting point for plugin development, incorporating best practices from established plugins like oh-my-claudecode, superpowers, and claude-code-plugin-template.

## Directory Structure

```
templates/
├── plugin/                      # Full plugin template
│   ├── .claude-plugin/
│   │   └── plugin.json.template # Plugin metadata template
│   ├── README.md.template       # Plugin documentation template
│   └── AGENTS.md.template       # AI navigation template
├── agents/                      # Agent templates by tier
│   ├── haiku-agent.md.template  # LOW tier (quick tasks)
│   ├── sonnet-agent.md.template # MEDIUM tier (standard work)
│   └── opus-agent.md.template   # HIGH tier (complex reasoning)
├── skills/                      # Skill templates
│   └── SKILL.md.template        # Skill with YAML frontmatter
├── commands/                    # Command templates
│   └── command.md.template      # CLI command template
└── hooks/                       # Hook templates
    └── hooks.json.template      # Lifecycle hooks configuration

AGENTS.md                        # This file
```

## Template Categories

### 1. Plugin Template

**Location:** `templates/plugin/`

**Purpose:** Complete plugin scaffold with all essential files.

**Files:**
- `plugin.json.template` - Plugin metadata (name, version, author, etc.)
- `README.md.template` - Comprehensive documentation structure
- `AGENTS.md.template` - AI navigation and plugin guide

**Usage:**
```bash
# Copy to new plugin directory
cp -r templates/plugin/* /path/to/new-plugin/
```

**Placeholders:**
- `{{name}}` - Plugin name
- `{{description}}` - Plugin description
- `{{author}}` - Author name
- `{{email}}` - Author email
- `{{repository_url}}` - Git repository URL
- And many more specific to each section

### 2. Agent Templates

**Location:** `templates/agents/`

**Purpose:** Templates for creating AI agents at different capability tiers.

#### Haiku Agent (LOW Tier)

**File:** `haiku-agent.md.template`

**Best for:**
- Quick lookups and simple queries
- Fast file/function searches
- Simple code changes (1-3 lines)
- Basic documentation tasks
- Status checks and validations

**Key characteristics:**
- Model: Haiku
- Temperature: 0.1
- Thinking Budget: Low
- Cost: Minimal
- Speed: Fast (<5 seconds)

**Placeholders:**
- `{{agent_name}}` - Agent identifier
- `{{agent_role}}` - High-level role description
- `{{agent_purpose_detailed}}` - Detailed purpose explanation
- `{{plugin_name}}` - Parent plugin name
- `{{sonnet_agent_name}}` - Related Sonnet agent
- `{{opus_agent_name}}` - Related Opus agent

#### Sonnet Agent (MEDIUM Tier)

**File:** `sonnet-agent.md.template`

**Best for:**
- Standard feature implementation
- Multi-file changes with clear requirements
- Bug fixes requiring moderate investigation
- API integration and data transformation
- Test writing and maintenance

**Key characteristics:**
- Model: Sonnet
- Temperature: 0.3
- Thinking Budget: Medium
- Cost: Moderate
- Speed: 30-120 seconds

**Placeholders:**
- Same as Haiku, plus:
- `{{haiku_agent_name}}` - Related Haiku agent for delegation
- More detailed workflow sections

#### Opus Agent (HIGH Tier)

**File:** `opus-agent.md.template`

**Best for:**
- Complex architectural decisions
- Deep debugging requiring hypothesis generation
- Novel problems without established patterns
- Cross-cutting refactors
- Security architecture and threat modeling

**Key characteristics:**
- Model: Opus
- Temperature: 0.3
- Thinking Budget: Maximum
- Cost: High
- Speed: 60-300 seconds

**Placeholders:**
- All standard agent placeholders
- Extended sections for strategic thinking
- Delegation orchestration examples

### 3. Skill Template

**Location:** `templates/skills/SKILL.md.template`

**Purpose:** Template for creating invokable skills with auto-activation.

**Features:**
- YAML frontmatter for metadata
- Trigger pattern definitions
- Parameter specifications
- Multi-phase workflow structure
- Auto-activation configuration

**Key sections:**
- Overview and purpose
- Auto-activation triggers
- Parameter definitions
- Workflow phases
- Agent delegation
- Configuration options
- Examples and error handling

**Placeholders:**
- `{{skill_name}}` - Skill identifier
- `{{skill_description}}` - Brief description
- `{{trigger_pattern_N}}` - Auto-activation patterns
- `{{param_N_name}}` - Parameter names and specs
- `{{phase_N_name}}` - Workflow phase descriptions
- `{{agent_N_name}}` - Agents used in workflow

### 4. Command Template

**Location:** `templates/commands/command.md.template`

**Purpose:** Template for CLI commands with comprehensive documentation.

**Features:**
- YAML frontmatter with command metadata
- Option/flag specifications
- Usage examples
- Exit codes and error handling
- Output format options
- Integration examples (scripts, CI/CD)

**Key sections:**
- Usage and options
- Examples (basic to advanced)
- Output formats (human, JSON, CSV)
- Configuration
- Environment variables
- Integration patterns
- Error handling and troubleshooting

**Placeholders:**
- `{{command_name}}` - Command identifier
- `{{flag_N}}` - Command flags/options
- `{{example_N_command}}` - Example usages
- `{{error_N_name}}` - Error scenarios
- `{{env_var_N}}` - Environment variables

### 5. Hooks Template

**Location:** `templates/hooks/hooks.json.template`

**Purpose:** Lifecycle hooks configuration for event-driven behaviors.

**Hook types:**
- Plugin lifecycle: loaded, activated, deactivated
- Skill lifecycle: before, after execution
- Agent lifecycle: spawn, complete
- Command execution
- File operations: read, write
- Git operations
- Error handling
- Session lifecycle
- Custom hooks

**Configuration:**
- Handler specification
- Priority ordering
- Filters for targeted activation
- Timeout and retry settings
- Logging configuration

**Placeholders:**
- `{{handler_file}}` - Handler implementation path
- `{{skill_name}}` - Associated skill
- `{{agent_name}}` - Associated agent
- `{{command_name}}` - Associated command
- `{{custom_hook_name}}` - Custom hook identifier

## Template Usage Patterns

### Creating a New Plugin

1. **Copy plugin template:**
   ```bash
   cp -r templates/plugin/* /path/to/my-new-plugin/
   ```

2. **Replace placeholders:**
   ```bash
   # Use find/replace or script to substitute all {{placeholders}}
   ```

3. **Add agents:**
   ```bash
   mkdir -p /path/to/my-new-plugin/.claude-plugin/agents/
   cp templates/agents/sonnet-agent.md.template \
      /path/to/my-new-plugin/.claude-plugin/agents/my-agent.md
   ```

4. **Add skills:**
   ```bash
   mkdir -p /path/to/my-new-plugin/.claude-plugin/skills/
   cp templates/skills/SKILL.md.template \
      /path/to/my-new-plugin/.claude-plugin/skills/my-skill.md
   ```

5. **Customize and refine**

### Adding an Agent to Existing Plugin

1. **Choose tier** based on task complexity:
   - Simple tasks → `haiku-agent.md.template`
   - Standard work → `sonnet-agent.md.template`
   - Complex reasoning → `opus-agent.md.template`

2. **Copy template:**
   ```bash
   cp templates/agents/sonnet-agent.md.template \
      .claude-plugin/agents/my-executor.md
   ```

3. **Fill in placeholders:**
   - Agent name and role
   - Purpose and use cases
   - Related agents for delegation
   - Plugin-specific details

4. **Update AGENTS.md** to reference new agent

### Adding a Skill

1. **Copy skill template:**
   ```bash
   cp templates/skills/SKILL.md.template \
      .claude-plugin/skills/my-analyzer.md
   ```

2. **Define metadata in frontmatter:**
   - Name and description
   - Trigger patterns for auto-activation
   - Parameters with types and validation
   - Agents used in workflow

3. **Document workflow phases:**
   - Break skill execution into logical phases
   - Specify which agent handles each phase
   - Define success criteria

4. **Add examples:**
   - Basic usage
   - Advanced scenarios
   - Error cases

### Adding a Command

1. **Copy command template:**
   ```bash
   cp templates/commands/command.md.template \
      .claude-plugin/commands/analyze.md
   ```

2. **Define command interface:**
   - Command name and description
   - Flags and options
   - Required vs optional parameters

3. **Document behavior:**
   - What the command does step-by-step
   - Exit codes
   - Output formats

4. **Add integration examples:**
   - Shell scripts
   - CI/CD pipelines
   - Piping with other commands

### Configuring Hooks

1. **Copy hooks template:**
   ```bash
   cp templates/hooks/hooks.json.template \
      .claude-plugin/hooks/hooks.json
   ```

2. **Enable relevant hooks:**
   - Set `enabled: true` for hooks you want
   - Configure filters to target specific events
   - Set priorities for execution order

3. **Implement handlers:**
   - Create handler files referenced in config
   - Handle hook payload
   - Return appropriate response

## Placeholder Conventions

### Naming Pattern

All placeholders use double curly braces: `{{placeholder_name}}`

### Common Placeholders

**Plugin-level:**
- `{{name}}` - Plugin name
- `{{description}}` - Plugin description
- `{{author}}` - Author name
- `{{email}}` - Author email
- `{{repository_url}}` - Repository URL
- `{{license}}` - License type
- `{{version}}` - Version number

**Agent-level:**
- `{{agent_name}}` - Agent identifier
- `{{agent_role}}` - Agent role
- `{{agent_purpose}}` - Purpose statement
- `{{agent_model}}` - Model tier (haiku/sonnet/opus)
- `{{agent_tier}}` - Tier level (LOW/MEDIUM/HIGH)

**Skill-level:**
- `{{skill_name}}` - Skill identifier
- `{{skill_description}}` - Skill description
- `{{trigger_pattern_N}}` - Auto-activation pattern
- `{{param_N_name}}` - Parameter name
- `{{phase_N_name}}` - Workflow phase name

**Command-level:**
- `{{command_name}}` - Command identifier
- `{{flag_N}}` - Command flag
- `{{alias_N}}` - Flag alias
- `{{example_N_command}}` - Example command

**General:**
- `{{date}}` - Date placeholder
- `{{config_key}}` - Configuration key
- `{{error_N_name}}` - Error identifier

### Replacement Strategies

**Manual replacement:**
```bash
# Simple find/replace in editor
:%s/{{name}}/my-plugin/g
```

**Scripted replacement:**
```bash
#!/bin/bash
# replace-placeholders.sh

sed -i 's/{{name}}/my-plugin/g' plugin.json
sed -i 's/{{author}}/John Doe/g' plugin.json
# ... more replacements
```

**Template engine:**
```javascript
// Using a template engine like Handlebars
const template = fs.readFileSync('template.md', 'utf8');
const compiled = Handlebars.compile(template);
const result = compiled({
  name: 'my-plugin',
  author: 'John Doe',
  // ... more data
});
```

## Best Practices

### When Creating Templates

1. **Use descriptive placeholders**: `{{user_email}}` not `{{email1}}`
2. **Provide examples**: Show how placeholders should be filled
3. **Document sections**: Explain what each section is for
4. **Include patterns**: Show common patterns and anti-patterns
5. **Version templates**: Track template versions separately

### When Using Templates

1. **Don't skip sections**: Even if not immediately needed
2. **Customize examples**: Replace generic examples with real ones
3. **Update cross-references**: Ensure all links and references are updated
4. **Remove unused sections**: Clean up what you don't need
5. **Maintain consistency**: Use same patterns across all files

### Quality Checklist

Before considering a template-based plugin complete:

- [ ] All `{{placeholders}}` replaced
- [ ] Examples are realistic and tested
- [ ] Cross-references between files are correct
- [ ] AGENTS.md accurately reflects plugin structure
- [ ] Agent tiers match task complexity
- [ ] Skill triggers are well-defined
- [ ] Command options are documented
- [ ] Hooks are configured appropriately
- [ ] Configuration files are valid JSON
- [ ] README is comprehensive

## Template Design Principles

### 1. Progressive Disclosure

Templates start simple and layer in complexity:
- Basic structure first
- Advanced features optional
- Comments guide expansion

### 2. Best Practices Embedded

Templates encode best practices:
- Agent tier selection guidance
- Proper parameter validation
- Error handling patterns
- Documentation standards

### 3. Pattern Recognition

Templates help AI assistants recognize:
- Common plugin structures
- Standard agent roles
- Typical skill workflows
- Command interface patterns

### 4. Consistency

Templates ensure consistency:
- Naming conventions
- File organization
- Documentation structure
- Metadata format

## Integration with Plugin Ecosystem

### Compatible with oh-my-claudecode

Templates follow oh-my-claudecode patterns:
- Three-tier agent system (haiku/sonnet/opus)
- Skill auto-activation
- YAML frontmatter
- AGENTS.md navigation

### Inspired by superpowers

Templates incorporate superpowers concepts:
- Rich skill documentation
- Parameter specifications
- Workflow phases
- Integration hooks

### Based on claude-code-plugin-template

Templates extend the official scaffold:
- Plugin.json structure
- Directory organization
- Command patterns
- Hook system

## Extensibility

### Adding New Template Types

To add a new template category:

1. **Create directory**: `templates/new-category/`
2. **Create template file**: `templates/new-category/template.ext.template`
3. **Document in AGENTS.md**: Add section explaining the template
4. **Provide examples**: Show how to use the template
5. **Update checklist**: Add to quality checklist above

### Customizing Templates

To create project-specific template variants:

1. **Copy base template**: `cp templates/agents/sonnet-agent.md.template custom/`
2. **Add custom sections**: Extend with project-specific needs
3. **Document differences**: Note what's different from base
4. **Version separately**: Track custom templates independently

## Version History

### 1.0.0 - Initial Release

Template types:
- Plugin scaffold (plugin.json, README, AGENTS.md)
- Agent templates (haiku, sonnet, opus)
- Skill template with YAML frontmatter
- Command template with full documentation
- Hooks configuration template

Based on best practices from:
- oh-my-claudecode (agent tiers, orchestration)
- superpowers (skill structure, workflows)
- claude-code-plugin-template (scaffolding, conventions)

## Future Enhancements

Planned template additions:
- Test templates (unit, integration)
- CI/CD configuration templates
- Documentation templates (tutorials, guides)
- Migration templates (for upgrading plugins)
- Localization templates (i18n support)

## Contributing

To improve these templates:

1. Identify common patterns across multiple plugins
2. Extract into reusable template form
3. Add comprehensive placeholders
4. Document usage in this guide
5. Provide examples
6. Submit for review

## References

- [oh-my-claudecode](https://github.com/user/oh-my-claudecode) - Multi-agent orchestration
- [superpowers](https://github.com/user/superpowers) - Skill system design
- [claude-code-plugin-template](https://github.com/anthropics/claude-code-plugin-template) - Official scaffold

## Support

For template usage questions or issues:
- Review this AGENTS.md file
- Check template comments and examples
- Refer to reference plugins listed above
- Open an issue with specific questions
