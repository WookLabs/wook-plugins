#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync, readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEST_PROJECT = join(__dirname, '..', 'test-project', 'novels', 'novel_20250117_100000');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (e) {
    console.log(`  ✗ ${name}: ${e.message}`);
    failed++;
  }
}

async function asyncTest(name, fn) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (e) {
    console.log(`  ✗ ${name}: ${e.message}`);
    failed++;
  }
}

console.log('=== Novel-Sisyphus Integration Test ===\n');

// Test 1: State file detection
console.log('Test 1: State file detection');
const statePath = join(TEST_PROJECT, 'meta', 'ralph-state.json');
test('State file exists at new location', () => {
  if (!existsSync(statePath)) throw new Error('File not found at meta/ralph-state.json');
});
test('State file valid JSON', () => {
  const state = JSON.parse(readFileSync(statePath, 'utf-8'));
  if (!state.novel_id) throw new Error('Missing novel_id');
  if (!state.mode) throw new Error('Missing mode');
  if (!state.schema_version) throw new Error('Missing schema_version');
  console.log(`    novel_id: ${state.novel_id}`);
  console.log(`    current_chapter: ${state.current_chapter}`);
  console.log(`    mode: ${state.mode}`);
});

// Test 2: Context Budget (requires build)
console.log('\nTest 2: Context Budget System');
const distPath = join(__dirname, '..', 'dist');
test('dist/ directory exists', () => {
  if (!existsSync(distPath)) throw new Error('Run "npm run build" first');
});
test('dist/context/index.js exists', () => {
  const indexPath = join(distPath, 'context', 'index.js');
  if (!existsSync(indexPath)) throw new Error('Context module not compiled');
});

// Test context import and execution
await asyncTest('loadContextWithBudget function works', async () => {
  const { loadContextWithBudget } = await import('../dist/context/index.js');
  if (typeof loadContextWithBudget !== 'function') throw new Error('Not a function');

  const context = await loadContextWithBudget(6, TEST_PROJECT, 80000);
  if (!context.items) throw new Error('No items returned');
  if (typeof context.currentTokens !== 'number') throw new Error('No token count');
  console.log(`    Loaded ${context.items.length} items`);
  console.log(`    Token usage: ${context.currentTokens}/${context.maxTokens}`);
  console.log(`    Overflow: ${context.overflow.length} items`);
});

// Test 3: Schema validation
console.log('\nTest 3: Schema validation (sample)');
const chapterPath = join(TEST_PROJECT, 'chapters', 'chapter_006.json');
test('Chapter file exists', () => {
  if (!existsSync(chapterPath)) throw new Error('File not found');
});
test('Chapter has required fields', () => {
  const chapter = JSON.parse(readFileSync(chapterPath, 'utf-8'));
  const required = ['chapter_number', 'chapter_title', 'meta', 'context', 'style_guide', 'narrative_elements', 'scenes'];
  for (const field of required) {
    if (!chapter[field]) throw new Error(`Missing ${field}`);
  }
});
test('narrative_elements has correct field names', () => {
  const chapter = JSON.parse(readFileSync(chapterPath, 'utf-8'));
  const ne = chapter.narrative_elements;
  if (!Array.isArray(ne.foreshadowing_plant)) throw new Error('Missing foreshadowing_plant');
  if (!Array.isArray(ne.foreshadowing_payoff)) throw new Error('Missing foreshadowing_payoff');
  if (!Array.isArray(ne.hooks_plant)) throw new Error('Missing hooks_plant');
  if (!Array.isArray(ne.hooks_reveal)) throw new Error('Missing hooks_reveal');
  // Verify OLD names are NOT present
  if (ne.foreshadowing_to_plant) throw new Error('Found wrong field: foreshadowing_to_plant');
  if (ne.hooks_to_resolve) throw new Error('Found wrong field: hooks_to_resolve');
});
test('context.current_plot >= 100 characters', () => {
  const chapter = JSON.parse(readFileSync(chapterPath, 'utf-8'));
  if (!chapter.context.current_plot) throw new Error('Missing current_plot');
  if (chapter.context.current_plot.length < 100) {
    throw new Error(`Only ${chapter.context.current_plot.length} chars, need 100+`);
  }
  console.log(`    current_plot length: ${chapter.context.current_plot.length} chars`);
});
test('scenes use emotional_tone (not mood)', () => {
  const chapter = JSON.parse(readFileSync(chapterPath, 'utf-8'));
  for (const scene of chapter.scenes) {
    if (scene.mood) throw new Error('Found wrong field: mood (should be emotional_tone)');
    if (!scene.emotional_tone) throw new Error('Missing emotional_tone');
  }
});

// Test 4: Hook scripts
console.log('\nTest 4: Hook scripts');
test('state-utils.mjs exists', () => {
  const utilsPath = join(__dirname, 'lib', 'state-utils.mjs');
  if (!existsSync(utilsPath)) throw new Error('File not found');
});
test('context-budget.mjs exists', () => {
  const budgetPath = join(__dirname, 'lib', 'context-budget.mjs');
  if (!existsSync(budgetPath)) throw new Error('File not found');
});
test('state-utils.mjs exports findStateFile', async () => {
  const { findStateFile } = await import('./lib/state-utils.mjs');
  if (typeof findStateFile !== 'function') throw new Error('Not a function');
});

// Test 5: File count verification
console.log('\nTest 5: Test project completeness');
test('100 chapter JSON files exist', () => {
  const chaptersDir = join(TEST_PROJECT, 'chapters');
  const jsonFiles = readdirSync(chaptersDir).filter(f => f.endsWith('.json'));
  if (jsonFiles.length < 100) throw new Error(`Only ${jsonFiles.length} files`);
  console.log(`    Found ${jsonFiles.length} chapter JSON files`);
});
test('10 character files exist', () => {
  const charsDir = join(TEST_PROJECT, 'characters');
  const charFiles = readdirSync(charsDir).filter(f => f.startsWith('char_'));
  if (charFiles.length < 10) throw new Error(`Only ${charFiles.length} files`);
  console.log(`    Found ${charFiles.length} character files`);
});
test('World locations file exists', () => {
  const locPath = join(TEST_PROJECT, 'world', 'locations.json');
  if (!existsSync(locPath)) throw new Error('File not found');
});
test('Foreshadowing file exists', () => {
  const forePath = join(TEST_PROJECT, 'plot', 'foreshadowing.json');
  if (!existsSync(forePath)) throw new Error('File not found');
});

// Test 6: Path resolution
console.log('\nTest 6: Path resolution');
test('Context loader resolves chapters path correctly', async () => {
  const { previewContextLoad } = await import('../dist/context/index.js');
  const preview = await previewContextLoad(6, TEST_PROJECT, { maxTokens: 80000 });

  // Should find plot item
  const plotItem = preview.candidates.find(c => c.id.startsWith('plot-'));
  if (!plotItem) throw new Error('Plot item not found - path resolution may be broken');
  console.log(`    Found: ${plotItem.id}`);
});

// Summary
console.log('\n=== Test Summary ===');
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Total:  ${passed + failed}`);

if (failed > 0) {
  console.log('\n❌ Some tests failed. Review the errors above.');
  process.exit(1);
} else {
  console.log('\n✅ All tests passed!');
  process.exit(0);
}
