#!/usr/bin/env node

/**
 * Agent Validation Script
 *
 * Validates:
 * 1. Only allowed agents exist (20 agents)
 * 2. No duplicate agents
 * 3. All required agents are present
 */

import { readdirSync, existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const agentsDir = join(__dirname, '..', 'agents');

// Parse YAML-like frontmatter from markdown
function parseFrontmatter(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;

  const fm = {};
  for (const line of match[1].split(/\r?\n/)) {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    const key = line.substring(0, colonIdx).trim();
    let value = line.substring(colonIdx + 1).trim();
    // Remove quotes
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    fm[key] = value;
  }
  return fm;
}

// Validate frontmatter fields
function validateFrontmatter(filePath, agentName) {
  const fm = parseFrontmatter(filePath);
  const warnings = [];
  const errors = [];

  if (!fm) {
    errors.push(`${agentName}: Missing frontmatter (--- block)`);
    return { errors, warnings };
  }

  // name: required, kebab-case, 3-50 chars
  if (!fm.name) {
    errors.push(`${agentName}: Missing required field 'name'`);
  } else {
    if (!/^[a-z][a-z0-9-]{2,49}$/.test(fm.name)) {
      errors.push(`${agentName}: 'name' must be kebab-case, 3-50 chars (got: "${fm.name}")`);
    }
    const expectedName = agentName.replace('.md', '');
    if (fm.name !== expectedName) {
      warnings.push(`${agentName}: 'name' (${fm.name}) doesn't match filename (${expectedName})`);
    }
  }

  // description: required, 50+ chars recommended
  if (!fm.description) {
    errors.push(`${agentName}: Missing required field 'description'`);
  } else if (fm.description.length < 50) {
    warnings.push(`${agentName}: 'description' is short (${fm.description.length} chars, recommend 50+)`);
  }

  // model: must be opus/sonnet/haiku
  if (!fm.model) {
    errors.push(`${agentName}: Missing required field 'model'`);
  } else if (!['opus', 'sonnet', 'haiku'].includes(fm.model)) {
    errors.push(`${agentName}: Invalid 'model' value "${fm.model}" (must be opus/sonnet/haiku)`);
  }

  // color: optional, must be valid if present
  const validColors = ['blue', 'cyan', 'green', 'yellow', 'magenta', 'red'];
  if (fm.color && !validColors.includes(fm.color)) {
    errors.push(`${agentName}: Invalid 'color' value "${fm.color}" (must be one of: ${validColors.join(', ')})`);
  }

  // permissionMode: optional, must be valid if present
  const validModes = ['default', 'plan', 'bypassPermissions'];
  if (fm.permissionMode && !validModes.includes(fm.permissionMode)) {
    errors.push(`${agentName}: Invalid 'permissionMode' value "${fm.permissionMode}" (must be one of: ${validModes.join(', ')})`);
  }

  return { errors, warnings };
}

// Canonical list of allowed agents (v7.0)
const ALLOWED_AGENTS = new Set([
  // Core agents
  'novelist.md',               // opus - 본문 집필
  'editor.md',                 // sonnet - 퇴고/교정
  'critic.md',                 // opus - 품질 평가 (READ-ONLY)
  'lore-keeper.md',            // sonnet - 설정 관리
  'plot-architect.md',         // opus - 플롯 설계
  'proofreader.md',            // haiku - 맞춤법 검사
  'summarizer.md',             // haiku - 회차 요약
  // Pipeline agents
  'prose-surgeon.md',          // opus - 문장 수술
  'quality-oracle.md',         // opus - 품질 게이트
  // Specialized agents
  'beta-reader.md',            // sonnet - 독자 시뮬레이션
  'chapter-verifier.md',       // sonnet - 회차 검증
  'character-voice-analyzer.md', // sonnet - 캐릭터 목소리 분석
  'consistency-verifier.md',   // sonnet - 일관성 검증
  'engagement-optimizer.md',   // sonnet - 몰입도 최적화
  'genre-validator.md',        // sonnet - 장르 검증
  'style-curator.md',          // sonnet - 문체 큐레이션
  // Orchestration
  'team-orchestrator.md',      // opus - 팀 오케스트레이터
  // Additional agents
  'narrator.md',
  'character-designer.md',
  'arc-designer.md',
]);

// Files to ignore (not agents)
const IGNORE_FILES = new Set([
  'AGENTS.md',        // Documentation file
]);

let hasErrors = false;

function error(msg) {
  console.error(`❌ ${msg}`);
  hasErrors = true;
}

function success(msg) {
  console.log(`✓ ${msg}`);
}

console.log('\n=== Validating Agent Files ===\n');

if (!existsSync(agentsDir)) {
  error('agents/ directory not found');
  process.exit(1);
}

const agentFiles = readdirSync(agentsDir)
  .filter(f => f.endsWith('.md') && !IGNORE_FILES.has(f));

console.log(`Found ${agentFiles.length} agent files\n`);

// Check for unauthorized agents
const unauthorizedAgents = agentFiles.filter(f => !ALLOWED_AGENTS.has(f));
if (unauthorizedAgents.length > 0) {
  error('Unauthorized agent files found:');
  for (const agent of unauthorizedAgents) {
    console.error(`  - ${agent} (DELETE THIS FILE)`);
  }
}

// Check for missing required agents
const missingAgents = [...ALLOWED_AGENTS].filter(f => !agentFiles.includes(f));
if (missingAgents.length > 0) {
  error('Missing required agents:');
  for (const agent of missingAgents) {
    console.error(`  - ${agent}`);
  }
}

// List valid agents
const validAgents = agentFiles.filter(f => ALLOWED_AGENTS.has(f));
if (validAgents.length > 0) {
  success(`Valid agents (${validAgents.length}/${ALLOWED_AGENTS.size}):`);
  for (const agent of validAgents) {
    console.log(`  - ${agent}`);
  }
}

// === Frontmatter Validation ===
console.log('\n=== Validating Agent Frontmatter ===\n');

let fmErrors = [];
let fmWarnings = [];

for (const agent of validAgents) {
  const agentPath = join(agentsDir, agent);
  const result = validateFrontmatter(agentPath, agent);
  fmErrors.push(...result.errors);
  fmWarnings.push(...result.warnings);
}

if (fmWarnings.length > 0) {
  console.log(`⚠️  Warnings (${fmWarnings.length}):`);
  for (const w of fmWarnings) {
    console.log(`  ⚠️  ${w}`);
  }
}

if (fmErrors.length > 0) {
  for (const e of fmErrors) {
    error(e);
  }
} else {
  success('All agent frontmatter validated');
}

// Summary
console.log('\n=== Summary ===\n');

if (hasErrors) {
  console.error('❌ Agent validation FAILED');
  console.error('\nAllowed agents:');
  for (const agent of ALLOWED_AGENTS) {
    console.error(`  - ${agent}`);
  }
  process.exit(1);
} else {
  console.log(`✓ All ${ALLOWED_AGENTS.size} agents validated successfully`);
  process.exit(0);
}
