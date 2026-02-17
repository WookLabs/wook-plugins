#!/usr/bin/env node

/**
 * ref-sync: Update all reference repositories
 *
 * Usage: node sync.mjs [--verbose]
 */

import { execSync } from 'child_process';
import { readdirSync, statSync, existsSync, writeFileSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, '..', '..');
const REF_DIR = join(ROOT_DIR, 'ref');
const INDEX_FILE = join(REF_DIR, '_index.json');
const LOG_FILE = join(ROOT_DIR, '.workspace', 'logs', 'ref-sync.log');

const verbose = process.argv.includes('--verbose');

function log(message) {
  const timestamp = new Date().toISOString();
  const logLine = `[${timestamp}] ${message}`;
  console.log(logLine);

  try {
    const logDir = dirname(LOG_FILE);
    if (!existsSync(logDir)) {
      execSync(`mkdir -p "${logDir}"`);
    }
    const existingLog = existsSync(LOG_FILE) ? readFileSync(LOG_FILE, 'utf-8') : '';
    writeFileSync(LOG_FILE, existingLog + logLine + '\n');
  } catch (e) {
    // Ignore log write errors
  }
}

function isGitRepo(dir) {
  return existsSync(join(dir, '.git'));
}

function syncRepo(repoPath, repoName) {
  try {
    // Fetch first
    execSync('git fetch', { cwd: repoPath, stdio: 'pipe' });

    // Check if there are updates
    const status = execSync('git status -uno', { cwd: repoPath, encoding: 'utf-8' });

    if (status.includes('Your branch is behind')) {
      // Pull changes
      const result = execSync('git pull', { cwd: repoPath, encoding: 'utf-8' });
      const filesChanged = result.match(/(\d+) files? changed/)?.[1] || '?';
      return { status: 'updated', message: `${filesChanged} files changed` };
    } else if (status.includes('Your branch is up to date')) {
      return { status: 'current', message: 'Already up to date' };
    } else {
      return { status: 'current', message: 'No remote tracking branch' };
    }
  } catch (error) {
    return { status: 'error', message: error.message.split('\n')[0] };
  }
}

function countPluginComponents(repoPath) {
  const counts = {
    agents: 0,
    skills: 0,
    commands: 0,
    hooks: 0
  };

  const checkDirs = [
    ['agents', 'agents'],
    ['skills', 'skills'],
    ['commands', 'commands'],
    ['hooks', 'hooks'],
    ['plugins', 'plugins'] // For marketplaces
  ];

  for (const [dir, type] of checkDirs) {
    const fullPath = join(repoPath, dir);
    if (existsSync(fullPath)) {
      try {
        const items = readdirSync(fullPath);
        if (type === 'plugins') {
          // Count plugins in marketplace
          counts.plugins = items.filter(i =>
            statSync(join(fullPath, i)).isDirectory() &&
            !i.startsWith('.')
          ).length;
        } else {
          counts[type] = items.filter(i =>
            !i.startsWith('.') && !i.startsWith('_')
          ).length;
        }
      } catch (e) {
        // Ignore errors
      }
    }
  }

  return counts;
}

function main() {
  console.log('');
  console.log('=== ref-sync: Updating Reference Repositories ===');
  console.log('');

  if (!existsSync(REF_DIR)) {
    console.error(`Error: ref/ directory not found at ${REF_DIR}`);
    process.exit(1);
  }

  const repos = readdirSync(REF_DIR)
    .filter(name => !name.startsWith('.') && !name.startsWith('_'))
    .filter(name => {
      const fullPath = join(REF_DIR, name);
      return statSync(fullPath).isDirectory() && isGitRepo(fullPath);
    });

  if (repos.length === 0) {
    console.log('No git repositories found in ref/');
    return;
  }

  log(`Starting sync of ${repos.length} repositories`);

  const results = {};
  const index = {
    lastSync: new Date().toISOString(),
    repositories: {}
  };

  for (const repo of repos) {
    const repoPath = join(REF_DIR, repo);
    process.stdout.write(`  ${repo}... `);

    const result = syncRepo(repoPath, repo);
    results[repo] = result;

    // Get component counts
    const counts = countPluginComponents(repoPath);

    index.repositories[repo] = {
      ...counts,
      lastSync: new Date().toISOString(),
      status: result.status
    };

    // Color output
    if (result.status === 'updated') {
      console.log(`\x1b[32m${result.message}\x1b[0m`);
    } else if (result.status === 'error') {
      console.log(`\x1b[31mError: ${result.message}\x1b[0m`);
    } else {
      console.log(`\x1b[90m${result.message}\x1b[0m`);
    }

    if (verbose) {
      console.log(`    Agents: ${counts.agents}, Skills: ${counts.skills}, Commands: ${counts.commands}`);
    }
  }

  // Write index file
  try {
    writeFileSync(INDEX_FILE, JSON.stringify(index, null, 2));
    log(`Updated ${INDEX_FILE}`);
  } catch (e) {
    console.error(`Failed to write index: ${e.message}`);
  }

  // Summary
  console.log('');
  const updated = Object.values(results).filter(r => r.status === 'updated').length;
  const errors = Object.values(results).filter(r => r.status === 'error').length;

  console.log(`Summary: ${updated} updated, ${repos.length - updated - errors} current, ${errors} errors`);
  log(`Sync complete: ${updated} updated, ${errors} errors`);
  console.log('');
}

main();
