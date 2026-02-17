#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function success(message) {
  log(`✓ ${message}`, 'green');
}

function info(message) {
  log(`ℹ ${message}`, 'blue');
}

function warn(message) {
  log(`⚠ ${message}`, 'yellow');
}

function error(message) {
  log(`✗ ${message}`, 'red');
}

function header(message) {
  log(`\n${message}`, 'bright');
  log('='.repeat(message.length), 'gray');
}

// Validate plugin name
function validatePluginName(name) {
  const kebabCaseRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/;

  if (!name) {
    return { valid: false, error: 'Plugin name is required' };
  }

  if (!kebabCaseRegex.test(name)) {
    return {
      valid: false,
      error: 'Plugin name must be lowercase kebab-case (e.g., my-plugin, test-utils)'
    };
  }

  if (name.length < 2) {
    return { valid: false, error: 'Plugin name must be at least 2 characters' };
  }

  if (name.length > 50) {
    return { valid: false, error: 'Plugin name must be at most 50 characters' };
  }

  return { valid: true };
}

// Prompt user for input
function prompt(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(`${colors.cyan}${question}${colors.reset} `, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

// Create directory if it doesn't exist
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    return true;
  }
  return false;
}

// Process template string with placeholders
function processTemplate(template, data) {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return data[key] !== undefined ? data[key] : match;
  });
}

// Templates
const templates = {
  pluginJson: (data) => ({
    name: data.name,
    version: data.version || '1.0.0',
    description: data.description,
    author: data.author || '',
    agents: [],
    commands: [],
    skills: [],
    hooks: {}
  }),

  readme: (data) => `# ${data.displayName || data.name}

${data.description}

## Installation

\`\`\`bash
node tools/plugin-manager/manager.mjs install ./plugins/${data.name}
node tools/plugin-manager/manager.mjs enable ${data.name}
\`\`\`

## Features

- Feature 1
- Feature 2
- Feature 3

## Usage

### Commands

\`\`\`bash
# Example command usage
\`\`\`

### Skills

\`\`\`markdown
# Example skill invocation
\`\`\`

## Development

### Directory Structure

\`\`\`
${data.name}/
├── .claude-plugin/    # Plugin metadata
├── agents/            # Agent definitions
├── commands/          # Command implementations
├── skills/            # Skill definitions
├── hooks/             # Lifecycle hooks
├── scripts/           # Utility scripts
├── schemas/           # JSON schemas
├── plugin.json        # Plugin manifest
├── README.md          # This file
└── AGENTS.md          # AI documentation
\`\`\`

### Adding Components

#### Add an Agent
1. Create agent definition in \`agents/my-agent.json\`
2. Add agent entry to \`plugin.json\`

#### Add a Command
1. Create command implementation in \`commands/my-command.mjs\`
2. Add command entry to \`plugin.json\`

#### Add a Skill
1. Create skill definition in \`skills/my-skill/SKILL.md\`
2. Add skill entry to \`plugin.json\`

## Testing

\`\`\`bash
# Test your plugin
node tools/plugin-manager/manager.mjs validate ./plugins/${data.name}
\`\`\`

## License

MIT

## Author

${data.author || 'Your Name'}

## Version

${data.version || '1.0.0'}
`,

  agentsMd: (data) => `# ${data.displayName || data.name}

${data.description}

## Purpose

This plugin provides [describe the main purpose].

## Components

### Agents

[List and describe agents provided by this plugin]

### Commands

[List and describe commands provided by this plugin]

### Skills

[List and describe skills provided by this plugin]

## Usage Patterns

### Pattern 1: [Name]

[Describe when and how to use this pattern]

### Pattern 2: [Name]

[Describe when and how to use this pattern]

## Integration

This plugin integrates with:
- [Other plugin or system]
- [Other plugin or system]

## Examples

### Example 1: [Task]

\`\`\`
[Show example usage]
\`\`\`

### Example 2: [Task]

\`\`\`
[Show example usage]
\`\`\`

## Implementation Notes

[Technical details for AI agents to understand implementation]

## Version

${data.version || '1.0.0'}
`,

  exampleAgent: (data) => ({
    name: 'example-agent',
    description: 'Example agent for demonstration purposes',
    type: 'oh-my-claudecode:executor',
    model: 'sonnet',
    capabilities: ['example-capability'],
    configuration: {
      temperature: 0.7,
      maxTokens: 4000
    }
  }),

  exampleCommand: (data) => `#!/usr/bin/env node

/**
 * Example command for ${data.name}
 *
 * Usage: node commands/example.mjs [args]
 */

export default async function exampleCommand(args) {
  console.log('Example command executed');
  console.log('Arguments:', args);

  // Your command logic here

  return {
    success: true,
    message: 'Command completed successfully'
  };
}

// CLI entry point
if (import.meta.url === \`file://\${process.argv[1]}\`) {
  const args = process.argv.slice(2);
  exampleCommand(args)
    .then(result => {
      console.log(result.message);
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Error:', error.message);
      process.exit(1);
    });
}
`,

  exampleSkill: (data) => `---
name: example-skill
description: Example skill for demonstration purposes
allowed-tools: Bash, Read, Write
---

# example-skill

An example skill showing the basic structure.

## When to Use

Describe when this skill should be invoked.

## Usage

\`\`\`bash
# Example usage
\`\`\`

## Examples

### Example 1

Description of example.

### Example 2

Description of example.
`,

  packageJson: (data) => ({
    name: data.name,
    version: data.version || '1.0.0',
    description: data.description,
    type: 'module',
    scripts: {
      test: 'echo "No tests yet"'
    },
    keywords: [
      'claude-plugin',
      'oh-my-plugin'
    ],
    author: data.author || '',
    license: 'MIT'
  })
};

// Main scaffold function
async function scaffoldPlugin(options) {
  const { name, description, author, version } = options;

  header(`Creating Plugin: ${name}`);

  // Validate name
  const validation = validatePluginName(name);
  if (!validation.valid) {
    error(validation.error);
    process.exit(1);
  }

  // Determine project root (two levels up from tools/plugin-scaffold)
  const projectRoot = path.resolve(__dirname, '../..');
  const pluginsDir = path.join(projectRoot, 'plugins');
  const pluginDir = path.join(pluginsDir, name);

  // Check if plugin already exists
  if (fs.existsSync(pluginDir)) {
    error(`Plugin directory already exists: ${pluginDir}`);
    warn('Choose a different name or remove the existing directory');
    process.exit(1);
  }

  // Ensure plugins directory exists
  info('Preparing plugin directory...');
  ensureDir(pluginsDir);
  success(`Plugins directory ready: ${pluginsDir}`);

  // Create main plugin directory
  info(`Creating plugin structure in ${pluginDir}...`);
  ensureDir(pluginDir);

  // Create standard directories
  const dirs = [
    '.claude-plugin',
    'agents',
    'commands',
    'skills',
    'hooks',
    'scripts',
    'schemas'
  ];

  for (const dir of dirs) {
    const dirPath = path.join(pluginDir, dir);
    ensureDir(dirPath);
    success(`Created ${dir}/`);
  }

  // Prepare template data
  const templateData = {
    name,
    description,
    author,
    version: version || '1.0.0',
    displayName: name.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    date: new Date().toISOString().split('T')[0]
  };

  // Create plugin.json in .claude-plugin/
  info('Generating configuration files...');
  const pluginJsonPath = path.join(pluginDir, '.claude-plugin', 'plugin.json');
  fs.writeFileSync(
    pluginJsonPath,
    JSON.stringify(templates.pluginJson(templateData), null, 2)
  );
  success('Created .claude-plugin/plugin.json');

  // Create README.md
  const readmePath = path.join(pluginDir, 'README.md');
  fs.writeFileSync(readmePath, templates.readme(templateData));
  success('Created README.md');

  // Create AGENTS.md
  const agentsMdPath = path.join(pluginDir, 'AGENTS.md');
  fs.writeFileSync(agentsMdPath, templates.agentsMd(templateData));
  success('Created AGENTS.md');

  // Create package.json
  const packageJsonPath = path.join(pluginDir, 'package.json');
  fs.writeFileSync(
    packageJsonPath,
    JSON.stringify(templates.packageJson(templateData), null, 2)
  );
  success('Created package.json');

  // Create example files
  info('Creating example files...');

  // Example agent
  const exampleAgentPath = path.join(pluginDir, 'agents', 'example-agent.json');
  fs.writeFileSync(
    exampleAgentPath,
    JSON.stringify(templates.exampleAgent(templateData), null, 2)
  );
  success('Created agents/example-agent.json');

  // Example command
  const exampleCommandPath = path.join(pluginDir, 'commands', 'example.mjs');
  fs.writeFileSync(exampleCommandPath, templates.exampleCommand(templateData));
  success('Created commands/example.mjs');

  // Example skill
  const exampleSkillDir = path.join(pluginDir, 'skills', 'example-skill');
  ensureDir(exampleSkillDir);
  const exampleSkillPath = path.join(exampleSkillDir, 'SKILL.md');
  fs.writeFileSync(exampleSkillPath, templates.exampleSkill(templateData));
  success('Created skills/example-skill/SKILL.md');

  // Create .gitignore if needed
  const gitignorePath = path.join(pluginDir, '.gitignore');
  fs.writeFileSync(gitignorePath, `node_modules/
*.log
.DS_Store
.env
*.tmp
`);
  success('Created .gitignore');

  // Summary
  header('Plugin Created Successfully!');
  log('');
  success(`Plugin: ${colors.bright}${name}${colors.reset}`);
  info(`Location: ${pluginDir}`);
  info(`Description: ${description}`);
  log('');

  log('Next steps:', 'bright');
  log(`  1. cd plugins/${name}`, 'cyan');
  log(`  2. Review and customize the generated files`, 'cyan');
  log(`  3. Add your agents, commands, and skills`, 'cyan');
  log(`  4. Update plugin.json with your components`, 'cyan');
  log(`  5. Install: node tools/plugin-manager/manager.mjs install ./plugins/${name}`, 'cyan');
  log(`  6. Enable: node tools/plugin-manager/manager.mjs enable ${name}`, 'cyan');
  log('');

  log('Documentation:', 'bright');
  log(`  README.md  - Plugin documentation`, 'gray');
  log(`  AGENTS.md  - AI-readable documentation`, 'gray');
  log('');
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);

  let name, description, author, version;

  // Parse arguments
  if (args.length === 0) {
    // Interactive mode
    header('Plugin Scaffold - Interactive Mode');
    log('');

    name = await prompt('Plugin name (kebab-case):');
    description = await prompt('Description:');
    author = await prompt('Author (optional):');
    version = await prompt('Version (default: 1.0.0):') || '1.0.0';
  } else {
    // Command-line mode
    name = args[0];
    description = args[1] || 'A new Claude plugin';

    // Parse optional flags
    for (let i = 2; i < args.length; i++) {
      if (args[i] === '--author' && args[i + 1]) {
        author = args[i + 1];
        i++;
      } else if (args[i] === '--version' && args[i + 1]) {
        version = args[i + 1];
        i++;
      }
    }
  }

  // Validate required fields
  if (!name || !description) {
    error('Plugin name and description are required');
    log('');
    log('Usage:', 'bright');
    log('  node scaffold.mjs <name> <description> [--author "Name"] [--version "1.0.0"]', 'cyan');
    log('  node scaffold.mjs  (interactive mode)', 'cyan');
    log('');
    log('Example:', 'bright');
    log('  node scaffold.mjs my-plugin "A plugin that does things" --author "John Doe"', 'cyan');
    process.exit(1);
  }

  await scaffoldPlugin({ name, description, author, version });
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
