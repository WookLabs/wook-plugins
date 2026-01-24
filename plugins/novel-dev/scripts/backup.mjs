#!/usr/bin/env node

/**
 * Cross-Platform Backup Script (v5)
 *
 * Uses archiver npm package instead of tar command for Windows compatibility.
 * Creates .zip archives (supported on all platforms).
 */

import archiver from 'archiver';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createWriteStream } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Creates a timestamped backup of the novel project state.
 *
 * Backs up:
 * - meta/ralph-state.json or .sisyphus/novel-state.json
 * - All chapter*.md and chapter*.json files in chapters/
 * - plot/structure.json
 * - plot/foreshadowing.json
 *
 * @param {string} projectPath - Path to the novel project (default: current directory)
 */
async function createBackup(projectPath = process.cwd()) {
  const absolutePath = path.resolve(projectPath);

  // Verify project path exists
  if (!fs.existsSync(absolutePath)) {
    console.error(`Error: Project path does not exist: ${absolutePath}`);
    process.exit(1);
  }

  // Create backup directory if it doesn't exist
  const backupDir = path.join(absolutePath, '.sisyphus', 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  // Generate timestamp for backup filename
  const timestamp = new Date()
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\..+/, '')
    .replace('T', '_');

  // Use .zip format for cross-platform compatibility
  const backupFilename = `backup_${timestamp}.zip`;
  const backupPath = path.join(backupDir, backupFilename);

  // Collect files to backup
  const filesToBackup = [];

  // 1. Ralph state (try both locations)
  const ralphStateNew = path.join(absolutePath, 'meta', 'ralph-state.json');
  const ralphStateLegacy = path.join(absolutePath, '.sisyphus', 'novel-state.json');

  if (fs.existsSync(ralphStateNew)) {
    filesToBackup.push({ src: ralphStateNew, dest: 'meta/ralph-state.json' });
  }
  if (fs.existsSync(ralphStateLegacy)) {
    filesToBackup.push({ src: ralphStateLegacy, dest: '.sisyphus/novel-state.json' });
  }

  // 2. Find all chapter*.md and chapter*.json files in chapters/
  const chaptersDir = path.join(absolutePath, 'chapters');
  if (fs.existsSync(chaptersDir)) {
    const chapterFiles = fs.readdirSync(chaptersDir)
      .filter(f => f.match(/^chapter.*\.(md|json)$/i));

    for (const file of chapterFiles) {
      filesToBackup.push({
        src: path.join(chaptersDir, file),
        dest: `chapters/${file}`
      });
    }
  }

  // 3. Plot structure
  const structureFile = path.join(absolutePath, 'plot', 'structure.json');
  if (fs.existsSync(structureFile)) {
    filesToBackup.push({ src: structureFile, dest: 'plot/structure.json' });
  }

  // 4. Plot foreshadowing
  const foreshadowingFile = path.join(absolutePath, 'plot', 'foreshadowing.json');
  if (fs.existsSync(foreshadowingFile)) {
    filesToBackup.push({ src: foreshadowingFile, dest: 'plot/foreshadowing.json' });
  }

  // Check if there are any files to backup
  if (filesToBackup.length === 0) {
    console.error('Error: No files found to backup');
    process.exit(1);
  }

  // Create zip archive using archiver (cross-platform)
  try {
    const output = createWriteStream(backupPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    // Pipe archive data to file
    archive.pipe(output);

    // Add each file to the archive
    for (const { src, dest } of filesToBackup) {
      archive.file(src, { name: dest });
    }

    // Wait for archive to finalize
    await new Promise((resolve, reject) => {
      output.on('close', resolve);
      archive.on('error', reject);
      archive.finalize();
    });

    // Verify backup was created
    if (!fs.existsSync(backupPath)) {
      console.error('Error: Backup file was not created');
      process.exit(1);
    }

    // Get backup file size for confirmation
    const stats = fs.statSync(backupPath);
    const sizeKB = (stats.size / 1024).toFixed(2);

    console.log(`Backup created: ${path.relative(process.cwd(), backupPath)}`);
    console.log(`Files backed up: ${filesToBackup.length}`);
    console.log(`Backup size: ${sizeKB} KB`);

  } catch (error) {
    console.error('Error creating backup:', error.message);
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const projectPath = args[0] || process.cwd();

// Run backup
createBackup(projectPath);
