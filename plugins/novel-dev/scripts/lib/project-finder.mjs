/**
 * Project Finder Utilities
 *
 * Provides functions for discovering novel projects and state files.
 * Handles both new (v5) and legacy (v4) file locations.
 */

import { readdirSync, statSync, existsSync } from 'fs';
import { join } from 'path';

/**
 * Finds the most recently modified novel project in the novels/ directory.
 *
 * @param {string} workspaceDir - Path to the workspace containing novels/
 * @returns {{ id: string, path: string, mtime: Date } | null} - Most recent project or null
 */
export function findActiveProject(workspaceDir) {
  const novelsDir = join(workspaceDir, 'novels');

  if (!existsSync(novelsDir)) {
    return null;
  }

  try {
    const novels = readdirSync(novelsDir)
      .filter(d => d.startsWith('novel_'))
      .map(d => {
        const projectPath = join(novelsDir, d);
        const metaPath = join(projectPath, 'meta', 'project.json');

        try {
          const mtime = statSync(metaPath).mtime;
          return { id: d, path: projectPath, mtime };
        } catch {
          // project.json doesn't exist, use directory mtime
          try {
            const mtime = statSync(projectPath).mtime;
            return { id: d, path: projectPath, mtime };
          } catch {
            return null;
          }
        }
      })
      .filter(Boolean)
      .sort((a, b) => b.mtime - a.mtime); // Most recent first

    return novels[0] || null;
  } catch {
    return null;
  }
}

/**
 * Finds the state file for a novel project.
 * Checks both v5 (meta/ralph-state.json) and legacy (.sisyphus/novel-state.json) locations.
 *
 * @param {string} novelPath - Path to the novel project directory
 * @returns {{ path: string, isLegacy: boolean } | null} - State file info or null
 */
export function findStateFile(novelPath) {
  // v5 location: novels/{id}/meta/ralph-state.json
  const newPath = join(novelPath, 'meta', 'ralph-state.json');
  if (existsSync(newPath)) {
    return { path: newPath, isLegacy: false };
  }

  // Legacy location: novels/{id}/.sisyphus/novel-state.json
  const legacyPathInProject = join(novelPath, '.sisyphus', 'novel-state.json');
  if (existsSync(legacyPathInProject)) {
    return { path: legacyPathInProject, isLegacy: true };
  }

  // Very old legacy: workspace root .sisyphus/novel-state.json
  const workspaceRoot = join(novelPath, '..', '..');
  const legacyPathInWorkspace = join(workspaceRoot, '.sisyphus', 'novel-state.json');
  if (existsSync(legacyPathInWorkspace)) {
    return { path: legacyPathInWorkspace, isLegacy: true };
  }

  return null;
}

/**
 * Gets the canonical state file path for a novel project.
 * Returns the v5 path regardless of whether the file exists.
 *
 * @param {string} novelPath - Path to the novel project directory
 * @returns {string} - Canonical state file path (v5 format)
 */
export function getCanonicalStatePath(novelPath) {
  return join(novelPath, 'meta', 'ralph-state.json');
}

/**
 * Checks if a state file needs migration from legacy to v5 location.
 *
 * @param {string} novelPath - Path to the novel project directory
 * @returns {{ needsMigration: boolean, from?: string, to?: string }}
 */
export function checkStateMigration(novelPath) {
  const stateInfo = findStateFile(novelPath);

  if (!stateInfo) {
    return { needsMigration: false };
  }

  if (stateInfo.isLegacy) {
    return {
      needsMigration: true,
      from: stateInfo.path,
      to: getCanonicalStatePath(novelPath)
    };
  }

  return { needsMigration: false };
}
