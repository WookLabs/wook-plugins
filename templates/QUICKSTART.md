# Template Quick Start Guide

Quick reference for using the plugin templates.

## Template Files Created

```
templates/
├── plugin/
│   ├── .claude-plugin/
│   │   └── plugin.json.template      # Plugin metadata
│   ├── README.md.template             # Plugin documentation
│   └── AGENTS.md.template             # AI navigation guide
├── agents/
│   ├── haiku-agent.md.template        # LOW tier (quick tasks)
│   ├── sonnet-agent.md.template       # MEDIUM tier (standard work)
│   └── opus-agent.md.template         # HIGH tier (complex reasoning)
├── skills/
│   └── SKILL.md.template              # Invokable skill template
├── commands/
│   └── command.md.template            # CLI command template
├── hooks/
│   └── hooks.json.template            # Lifecycle hooks
├── AGENTS.md                          # Comprehensive guide (READ THIS)
└── QUICKSTART.md                      # This file
```

## Quick Usage

### 1. Create New Plugin from Template

```bash
# Copy the entire plugin template
cp -r C:\work\17_oh-my-plugin\templates\plugin\* /path/to/my-new-plugin/

# Replace placeholders (example with sed)
cd /path/to/my-new-plugin
find . -type f -exec sed -i 's/{{name}}/my-awesome-plugin/g' {} +
find . -type f -exec sed -i 's/{{author}}/Your Name/g' {} +
find . -type f -exec sed -i 's/{{email}}/you@example.com/g' {} +
```

### 2. Add Agent to Existing Plugin

```bash
# Choose tier: haiku (quick), sonnet (standard), or opus (complex)

# Copy template
cp C:\work\17_oh-my-plugin\templates\agents\sonnet-agent.md.template \
   .claude-plugin/agents/my-executor.md

# Edit and replace {{placeholders}}
```

### 3. Add Skill

```bash
cp C:\work\17_oh-my-plugin\templates\skills\SKILL.md.template \
   .claude-plugin/skills/analyze.md

# Edit frontmatter and replace {{placeholders}}
```

### 4. Add Command

```bash
cp C:\work\17_oh-my-plugin\templates\commands\command.md.template \
   .claude-plugin/commands/process.md

# Edit and replace {{placeholders}}
```

### 5. Configure Hooks

```bash
cp C:\work\17_oh-my-plugin\templates\hooks\hooks.json.template \
   .claude-plugin/hooks/hooks.json

# Edit JSON and replace {{placeholders}}
```

## Common Placeholders

### Plugin Level
- `{{name}}` - Plugin name (e.g., "data-analyzer")
- `{{description}}` - One-line description
- `{{author}}` - Your name
- `{{email}}` - Your email
- `{{repository_url}}` - Git repo URL
- `{{license}}` - License type (e.g., "MIT")

### Agent Level
- `{{agent_name}}` - Agent identifier (e.g., "executor")
- `{{agent_role}}` - Role description (e.g., "Code executor")
- `{{agent_purpose_detailed}}` - Detailed purpose
- `{{plugin_name}}` - Parent plugin name

### Skill Level
- `{{skill_name}}` - Skill identifier (e.g., "analyze")
- `{{skill_description}}` - Brief description
- `{{trigger_pattern_N}}` - Auto-activation pattern
- `{{param_N_name}}` - Parameter name

### Command Level
- `{{command_name}}` - Command identifier (e.g., "process")
- `{{flag_N}}` - Command flag (e.g., "output")
- `{{alias_N}}` - Short flag (e.g., "o")

## Agent Tier Selection

Choose the right agent tier for your task:

| Tier | Model | Use For | Cost | Speed |
|------|-------|---------|------|-------|
| **LOW** | Haiku | Quick lookups, simple tasks, 1-3 line changes | $ | Fast |
| **MEDIUM** | Sonnet | Standard features, multi-file work, testing | $$ | Medium |
| **HIGH** | Opus | Architecture, complex debugging, novel problems | $$$ | Slower |

## Template Best Practices

1. **Start with plugin template** - Copy entire structure first
2. **Replace all placeholders** - Search for `{{` to find remaining ones
3. **Customize examples** - Replace generic examples with real ones
4. **Keep documentation** - Update rather than delete sections
5. **Follow naming conventions** - Use kebab-case for files, PascalCase for components

## Verification Checklist

Before shipping a plugin created from templates:

- [ ] No `{{placeholders}}` remain (search for `{{`)
- [ ] All file paths are correct
- [ ] Examples are tested and work
- [ ] AGENTS.md reflects actual plugin structure
- [ ] Agent tiers match task complexity
- [ ] plugin.json has valid JSON
- [ ] README has actual examples
- [ ] All cross-references are updated

## Example: Creating "data-analyzer" Plugin

```bash
# 1. Copy plugin template
cp -r templates/plugin/* ~/plugins/data-analyzer/
cd ~/plugins/data-analyzer

# 2. Replace core placeholders
find . -type f -exec sed -i 's/{{name}}/data-analyzer/g' {} +
find . -type f -exec sed -i 's/{{description}}/Analyze and visualize data/g' {} +
find . -type f -exec sed -i 's/{{author}}/Jane Doe/g' {} +
find . -type f -exec sed -i 's/{{email}}/jane@example.com/g' {} +

# 3. Add a Sonnet agent for data processing
mkdir -p .claude-plugin/agents
cp ~/templates/agents/sonnet-agent.md.template \
   .claude-plugin/agents/processor.md

# Edit processor.md and replace:
# {{agent_name}} → processor
# {{agent_role}} → Data processor
# {{plugin_name}} → data-analyzer

# 4. Add an analysis skill
mkdir -p .claude-plugin/skills
cp ~/templates/skills/SKILL.md.template \
   .claude-plugin/skills/analyze.md

# Edit analyze.md frontmatter and content

# 5. Add a CLI command
mkdir -p .claude-plugin/commands
cp ~/templates/commands/command.md.template \
   .claude-plugin/commands/process.md

# Edit process.md

# 6. Configure hooks
mkdir -p .claude-plugin/hooks
cp ~/templates/hooks/hooks.json.template \
   .claude-plugin/hooks/hooks.json

# Edit hooks.json

# 7. Test the plugin
claude-code plugin link .
claude-code plugin list  # Should show data-analyzer
```

## Next Steps

1. **Read AGENTS.md** - Comprehensive template documentation
2. **Study reference plugins** - oh-my-claudecode, superpowers, claude-code-plugin-template
3. **Test your plugin** - Use `claude-code plugin link .`
4. **Iterate** - Refine based on usage

## Need Help?

- **Template documentation**: Read `templates/AGENTS.md`
- **Plugin development**: See reference plugins
- **Issues**: Check for remaining `{{placeholders}}`

## Pro Tips

### Batch Replace Placeholders

Create a `placeholders.json`:
```json
{
  "name": "my-plugin",
  "description": "Does awesome things",
  "author": "Your Name",
  "email": "you@example.com",
  "repository_url": "https://github.com/you/my-plugin"
}
```

Then use a script to replace all at once.

### Template Inheritance

For similar plugins, create a custom base template:
```bash
cp -r templates/plugin custom-base-plugin/
# Customize common settings
# Use custom-base-plugin as your starting point
```

### Version Your Templates

Keep template versions in sync with plugin patterns:
```bash
git tag -a templates-v1.0.0 -m "Initial template release"
```

## Template Philosophy

These templates are **opinionated scaffolds** that:
- Encode best practices from proven plugins
- Guide proper agent tier selection
- Ensure comprehensive documentation
- Maintain consistency across plugins
- Help AI assistants navigate code

**Customize freely** - templates are starting points, not constraints.
