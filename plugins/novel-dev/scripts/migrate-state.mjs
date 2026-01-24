#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

const SCHEMA_VERSION = '2.0';

/**
 * Formats date as YYYYMMDD
 */
function formatDate(d) {
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Formats time as HHmmss
 */
function formatTime(d) {
  return `${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}${String(d.getSeconds()).padStart(2, '0')}`;
}

/**
 * Creates a default state file
 */
async function createDefaultState(projectPath) {
  const now = new Date();
  const novelId = `novel_${formatDate(now)}_${formatTime(now)}`;
  const metaDir = path.join(projectPath, 'meta');
  const statePath = path.join(metaDir, 'ralph-state.json');

  const defaultState = {
    $schema: '../../../schemas/ralph-state.schema.json',
    schema_version: SCHEMA_VERSION,
    novel_id: novelId,
    mode: 'idle',
    current_chapter: 1,
    last_safe_chapter: 0,
    current_act: 1,
    total_acts: 3,
    quality_retries: 0,
    iteration: 1,
    max_iterations: 100,
    ralph_active: false,
    last_updated: now.toISOString(),
    backup_path: 'meta/ralph-state.backup.json'
  };

  await fs.mkdir(metaDir, { recursive: true });
  await fs.writeFile(statePath, JSON.stringify(defaultState, null, 2));
  console.log(`Created default state file: ${statePath}`);

  return defaultState;
}

/**
 * Migrates legacy state file to new format
 */
async function migrateStateFile(projectPath) {
  const oldPath = path.join(projectPath, '.sisyphus', 'novel-state.json');
  const newDir = path.join(projectPath, 'meta');
  const newPath = path.join(newDir, 'ralph-state.json');
  const backupPath = path.join(newDir, 'ralph-state.backup.json');

  // 1. Check for existing old file
  let oldState;
  try {
    const content = await fs.readFile(oldPath, 'utf-8');
    oldState = JSON.parse(content);
  } catch (e) {
    if (e.code === 'ENOENT') {
      console.log('No existing state file found. Creating new one.');
      return createDefaultState(projectPath);
    }
    throw e;
  }

  // 2. Validate and fix novel_id
  let novelId = oldState.project_id;
  const idPattern = /^novel_\d{8}_\d{6}$/;
  if (!idPattern.test(novelId)) {
    // Try to extract from directory name
    const dirName = path.basename(projectPath);
    if (idPattern.test(dirName)) {
      novelId = dirName;
    } else {
      // Generate new ID
      const now = new Date();
      novelId = `novel_${formatDate(now)}_${formatTime(now)}`;
    }
    console.log(`Migrated project_id: "${oldState.project_id}" → "${novelId}"`);
  }

  // 3. Calculate current_chapter from existing files
  const chaptersDir = path.join(projectPath, 'chapters');
  let currentChapter = 1;

  if (existsSync(chaptersDir)) {
    try {
      const chapterFiles = await fs.readdir(chaptersDir);
      const writtenChapters = chapterFiles
        .filter(f => f.match(/chapter_\d+\.md$/))
        .map(f => parseInt(f.match(/chapter_(\d+)\.md/)[1]))
        .sort((a, b) => b - a);
      currentChapter = writtenChapters[0] || 1;
    } catch (e) {
      console.warn('Could not read chapters directory:', e.message);
    }
  }

  // 4. Create new state object
  const newState = {
    $schema: '../../../schemas/ralph-state.schema.json',
    schema_version: SCHEMA_VERSION,
    novel_id: novelId,
    mode: oldState.act_complete ? 'idle' : 'writing',
    current_chapter: currentChapter,
    last_safe_chapter: Math.max(0, currentChapter - 1),
    current_act: oldState.current_act || 1,
    total_acts: oldState.total_acts || 3,
    quality_retries: 0,
    iteration: oldState.iteration || 1,
    max_iterations: oldState.max_iterations || 100,
    ralph_active: oldState.ralph_active || false,
    last_updated: new Date().toISOString(),
    backup_path: 'meta/ralph-state.backup.json'
  };

  // 5. Create meta directory
  await fs.mkdir(newDir, { recursive: true });

  // 6. Create backup of existing new file (if it exists)
  try {
    const existingNew = await fs.readFile(newPath, 'utf-8');
    await fs.writeFile(backupPath, existingNew);
    console.log(`Backup created at: ${backupPath}`);
  } catch (e) {
    // No existing new file - backup not needed
  }

  // 7. Write new state file
  await fs.writeFile(newPath, JSON.stringify(newState, null, 2));
  console.log(`Migrated state file: ${newPath}`);

  // 8. Archive old state file
  const archivePath = path.join(projectPath, '.sisyphus', 'novel-state.v1.json');
  try {
    await fs.rename(oldPath, archivePath);
    console.log(`Archived old state: ${archivePath}`);
  } catch (e) {
    console.warn('Could not archive old state file:', e.message);
  }

  return newState;
}

// CLI execution
const projectPath = process.argv[2] || process.cwd();

migrateStateFile(projectPath)
  .then(() => {
    console.log('\nMigration complete.');
    process.exit(0);
  })
  .catch(e => {
    console.error('Migration failed:', e);
    process.exit(1);
  });
