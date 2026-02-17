---
name: plugin-scaffold
description: Create a new plugin skeleton with standard directory structure. Use when starting a new plugin project.
allowed-tools: Bash, Read, Write
---

# plugin-scaffold

Creates a complete plugin skeleton with all standard directories, configuration files, and templates.

## When to Use

- Starting a new plugin from scratch
- Need standard plugin directory structure
- Want templated starter files (plugin.json, README, AGENTS.md)

## What It Creates

```
plugins/[name]/
├── .claude-plugin/        # Plugin metadata
├── agents/                # Agent definitions
├── commands/              # Command implementations
├── skills/                # Skill definitions
├── hooks/                 # Lifecycle hooks
├── scripts/               # Utility scripts
├── schemas/               # JSON schemas
├── plugin.json            # Plugin manifest
├── README.md              # Plugin documentation
└── AGENTS.md              # AI-readable documentation
```

## Usage

### Basic Usage

```bash
node tools/plugin-scaffold/scaffold.mjs my-plugin "Description of my plugin"
```

### Interactive Mode (No Arguments)

```bash
node tools/plugin-scaffold/scaffold.mjs
# Prompts for:
# - Plugin name
# - Description
# - Author (optional)
```

### With All Options

```bash
node tools/plugin-scaffold/scaffold.mjs \
  my-plugin \
  "A plugin that does amazing things" \
  --author "Your Name" \
  --version "1.0.0"
```

## What Gets Generated

### plugin.json
```json
{
  "name": "my-plugin",
  "version": "1.0.0",
  "description": "A plugin that does amazing things",
  "author": "Your Name",
  "agents": [],
  "commands": [],
  "skills": [],
  "hooks": {}
}
```

### README.md
Standard plugin documentation template with sections for:
- Installation
- Features
- Usage
- Development
- License

### AGENTS.md
AI-readable documentation template explaining the plugin's purpose and components.

## Examples

### Create a Git Plugin
```bash
node tools/plugin-scaffold/scaffold.mjs \
  git-enhanced \
  "Enhanced git operations with atomic commits and smart workflows"
```

### Create a Testing Plugin
```bash
node tools/plugin-scaffold/scaffold.mjs \
  test-master \
  "Advanced testing workflows with parallel execution and coverage tracking"
```

### Create a UI/UX Plugin
```bash
node tools/plugin-scaffold/scaffold.mjs \
  design-system \
  "Design system tools and component scaffolding"
```

## Features

- Creates all standard directories
- Generates templated configuration files
- Validates plugin name (kebab-case, alphanumeric)
- Checks for existing plugins to avoid conflicts
- Colored terminal output for progress tracking
- Interactive prompts when arguments missing

## After Scaffolding

1. Navigate to the new plugin directory
2. Review and customize the generated files
3. Add your agent definitions to `agents/`
4. Add your command implementations to `commands/`
5. Add your skill definitions to `skills/`
6. Update `plugin.json` with your components
7. Test your plugin with the plugin manager

## Integration with Plugin Manager

The generated plugin is immediately compatible with:
```bash
node tools/plugin-manager/manager.mjs install ./plugins/my-plugin
node tools/plugin-manager/manager.mjs enable my-plugin
```

## Validation

The scaffold script validates:
- Plugin name format (lowercase, kebab-case, no special chars)
- Directory doesn't already exist
- Required Node.js version (14+)
- Write permissions in plugins/ directory

## Error Handling

- Existing plugin: Aborts with error message
- Invalid name: Suggests valid format
- Permission issues: Reports specific error
- Missing plugins/ directory: Creates it automatically
