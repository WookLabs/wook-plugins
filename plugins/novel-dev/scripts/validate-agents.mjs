#!/usr/bin/env node

/**
 * Agent Validation Script
 *
 * Validates:
 * 1. Only allowed agents exist (7 agents)
 * 2. No duplicate agents
 * 3. All required agents are present
 */

import { readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const agentsDir = join(__dirname, '..', 'agents');

// Canonical list of allowed agents (from Plan v5)
const ALLOWED_AGENTS = new Set([
  'novelist.md',      // opus - 본문 집필
  'editor.md',        // sonnet - 퇴고/교정
  'critic.md',        // opus - 품질 평가 (READ-ONLY)
  'lore-keeper.md',   // sonnet - 설정 관리
  'plot-architect.md', // opus - 플롯 설계
  'proofreader.md',   // haiku - 맞춤법 검사
  'summarizer.md',    // haiku - 회차 요약
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
