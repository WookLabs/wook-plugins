#!/usr/bin/env node

/**
 * Build Verification Script
 *
 * Verifies that all required files exist in dist/ after TypeScript compilation.
 * Run automatically after `npm run build` via postbuild hook.
 */

import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const distDir = join(__dirname, '..', 'dist');

// Required build outputs that other scripts depend on
const REQUIRED_FILES = [
  // Root entry point
  'index.js',

  // Context system (used by context-budget.mjs)
  'context/index.js',
  'context/loader.js',
  'context/estimator.js',
  'context/priorities.js',
  'context/overflow-handler.js',

  // State system (used by hooks)
  'state/lock.js',
  'state/backup.js',

  // Retry system
  'retry/index.js',
  'retry/quality-gate.js',

  // Type definitions
  'types.js',
];

let hasErrors = false;
let missingCount = 0;
let foundCount = 0;

function error(msg) {
  console.error(`❌ ${msg}`);
  hasErrors = true;
}

function success(msg) {
  console.log(`✓ ${msg}`);
}

console.log('\n=== Verifying Build Output ===\n');

// Check if dist/ directory exists
if (!existsSync(distDir)) {
  error('dist/ directory does not exist');
  console.error('\nRun: npm run build');
  process.exit(1);
}

// Check each required file
for (const file of REQUIRED_FILES) {
  const filePath = join(distDir, file);

  if (existsSync(filePath)) {
    foundCount++;
  } else {
    error(`Missing: dist/${file}`);
    missingCount++;
  }
}

// Summary
console.log('\n=== Summary ===\n');

if (hasErrors) {
  console.error(`❌ Build verification FAILED`);
  console.error(`   Missing: ${missingCount}/${REQUIRED_FILES.length} files`);
  console.error('\nPossible causes:');
  console.error('  1. TypeScript compilation errors (check tsc output)');
  console.error('  2. Missing source files in src/');
  console.error('  3. Incorrect tsconfig.json settings');
  process.exit(1);
} else {
  success(`All ${foundCount} required build outputs verified`);
  process.exit(0);
}
