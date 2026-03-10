#!/usr/bin/env node

/**
 * Skill Validation Script
 *
 * Validates:
 * 1. Each skill directory has SKILL.md
 * 2. SKILL.md has valid frontmatter (name, description)
 * 3. Description length 50-500 chars
 * 4. Description format follows "Use this skill when..." pattern (warning)
 */

import { readdirSync, readFileSync, existsSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const skillsDir = join(__dirname, '..', 'skills');

let errorCount = 0;
let warningCount = 0;
let successCount = 0;

function logError(msg) {
  console.error(`❌ ${msg}`);
  errorCount++;
}

function logWarning(msg) {
  console.log(`⚠️  ${msg}`);
  warningCount++;
}

function logSuccess(msg) {
  console.log(`✓ ${msg}`);
  successCount++;
}

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
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    fm[key] = value;
  }
  return fm;
}

console.log('\n=== Validating Skill Files ===\n');

if (!existsSync(skillsDir)) {
  logError('skills/ directory not found');
  process.exit(1);
}

const skillDirs = readdirSync(skillsDir)
  .filter(f => {
    const fullPath = join(skillsDir, f);
    return statSync(fullPath).isDirectory();
  });

console.log(`Found ${skillDirs.length} skill directories\n`);

for (const dir of skillDirs) {
  const skillMd = join(skillsDir, dir, 'SKILL.md');

  if (!existsSync(skillMd)) {
    logError(`${dir}: Missing SKILL.md`);
    continue;
  }

  const fm = parseFrontmatter(skillMd);

  if (!fm) {
    logError(`${dir}/SKILL.md: Missing frontmatter (--- block)`);
    continue;
  }

  // name required
  if (!fm.name) {
    logError(`${dir}/SKILL.md: Missing required field 'name'`);
  }

  // description required, 50-500 chars
  if (!fm.description) {
    logError(`${dir}/SKILL.md: Missing required field 'description'`);
  } else {
    if (fm.description.length < 50) {
      logError(`${dir}/SKILL.md: 'description' too short (${fm.description.length} chars, minimum 50)`);
    } else if (fm.description.length > 500) {
      logWarning(`${dir}/SKILL.md: 'description' too long (${fm.description.length} chars, maximum 500)`);
    } else {
      // Check format
      const goodPattern = /^(Use this skill when|This skill should be used when)/i;
      if (!goodPattern.test(fm.description)) {
        logWarning(`${dir}/SKILL.md: 'description' should start with "Use this skill when..." or "This skill should be used when..."`);
      }
      logSuccess(`${dir}/SKILL.md: Valid (${fm.description.length} chars)`);
    }
  }
}

// Summary
console.log('\n=== Summary ===\n');
console.log(`✓ Success: ${successCount}`);
if (warningCount > 0) console.log(`⚠️  Warnings: ${warningCount}`);
if (errorCount > 0) console.error(`❌ Errors: ${errorCount}`);
console.log(`Total: ${skillDirs.length} skills\n`);

if (errorCount > 0) {
  console.error('❌ Skill validation FAILED');
  process.exit(1);
} else {
  console.log(`✓ All ${skillDirs.length} skills validated successfully`);
  process.exit(0);
}
