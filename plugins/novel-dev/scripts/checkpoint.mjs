#!/usr/bin/env node

/**
 * Novel-Sisyphus Checkpoint System
 * 회차 완료 시 상태 저장 및 백업
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';

// Circuit Breaker State
const CIRCUIT_BREAKER = {
  max_same_failures: 3,
  failure_history: []
};

/**
 * Save checkpoint after chapter completion
 * @param {string} projectPath - Path to novel project
 * @param {object} state - Current write-all state
 */
export async function saveCheckpoint(projectPath, state) {
  const checkpointPath = join(projectPath, 'meta', 'ralph-state.json');

  // Ensure directory exists
  const dir = dirname(checkpointPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  const checkpointData = {
    ...state,
    last_checkpoint: new Date().toISOString(),
    last_updated: new Date().toISOString(),
    can_resume: true
  };

  // Save current state
  writeFileSync(checkpointPath, JSON.stringify(checkpointData, null, 2));

  // Create backup (keep last 3)
  await rotateBackups(projectPath, 'ralph-state', 3);

  return checkpointPath;
}

/**
 * Mark a chapter as completed
 * @param {string} projectPath
 * @param {number} chapter - Chapter number that was completed
 * @param {number} qualityScore - Quality score if evaluated
 */
export async function markChapterComplete(projectPath, chapter, qualityScore = null) {
  const statePath = join(projectPath, 'meta', 'ralph-state.json');

  if (!existsSync(statePath)) {
    console.warn('[Checkpoint] No state file found');
    return;
  }

  try {
    const state = JSON.parse(readFileSync(statePath, 'utf-8'));

    // Initialize arrays if not present
    if (!state.completed_chapters) state.completed_chapters = [];
    if (!state.failed_chapters) state.failed_chapters = [];

    // Add to completed if not already there
    if (!state.completed_chapters.includes(chapter)) {
      state.completed_chapters.push(chapter);
      state.completed_chapters.sort((a, b) => a - b);
    }

    // Remove from failed if it was there
    state.failed_chapters = state.failed_chapters.filter(c => c !== chapter);

    // Update current chapter to next
    state.current_chapter = chapter + 1;
    state.last_quality_score = qualityScore;

    await saveCheckpoint(projectPath, state);
  } catch (error) {
    console.error('[Checkpoint] Failed to mark chapter complete:', error.message);
  }
}

/**
 * Mark a chapter as failed
 * @param {string} projectPath
 * @param {number} chapter - Chapter number that failed
 * @param {string} reason - Failure reason
 */
export async function markChapterFailed(projectPath, chapter, reason = '') {
  const statePath = join(projectPath, 'meta', 'ralph-state.json');

  if (!existsSync(statePath)) return;

  try {
    const state = JSON.parse(readFileSync(statePath, 'utf-8'));

    if (!state.failed_chapters) state.failed_chapters = [];

    if (!state.failed_chapters.includes(chapter)) {
      state.failed_chapters.push(chapter);
    }

    state.last_failure_reason = reason;
    state.retry_count = (state.retry_count || 0) + 1;

    await saveCheckpoint(projectPath, state);
  } catch (error) {
    console.error('[Checkpoint] Failed to mark chapter failed:', error.message);
  }
}

/**
 * Initialize write-all mode checkpoint
 * @param {string} projectPath
 * @param {object} options - { totalChapters, totalActs, projectId }
 */
export async function initWriteAllCheckpoint(projectPath, options) {
  const { totalChapters, totalActs, projectId } = options;

  const state = {
    ralph_active: true,
    mode: 'write-all',
    project_id: projectId,
    current_act: 1,
    current_chapter: 1,
    total_chapters: totalChapters,
    total_acts: totalActs,
    completed_chapters: [],
    failed_chapters: [],
    retry_count: 0,
    iteration: 1,
    max_iterations: 100,
    can_resume: true,
    started_at: new Date().toISOString()
  };

  await saveCheckpoint(projectPath, state);
  return state;
}

/**
 * Finalize write-all (mark as complete, disable resume)
 * @param {string} projectPath
 */
export async function finalizeWriteAll(projectPath) {
  const statePath = join(projectPath, 'meta', 'ralph-state.json');

  if (!existsSync(statePath)) return;

  try {
    const state = JSON.parse(readFileSync(statePath, 'utf-8'));

    state.ralph_active = false;
    state.can_resume = false;
    state.mode = null;
    state.completed_at = new Date().toISOString();

    writeFileSync(statePath, JSON.stringify(state, null, 2));
  } catch (error) {
    console.error('[Checkpoint] Failed to finalize:', error.message);
  }
}

/**
 * Rotate backups - keep only the most recent N backups
 * @param {string} projectPath
 * @param {string} baseName - Base filename (e.g., 'ralph-state')
 * @param {number} keepCount - Number of backups to keep
 */
async function rotateBackups(projectPath, baseName, keepCount) {
  const backupDir = join(projectPath, 'meta', 'backups');

  // Create backup directory if needed
  if (!existsSync(backupDir)) {
    mkdirSync(backupDir, { recursive: true });
  }

  // Create new backup with timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = join(backupDir, `${baseName}-${timestamp}.json`);

  const currentPath = join(projectPath, 'meta', `${baseName}.json`);
  if (existsSync(currentPath)) {
    const content = readFileSync(currentPath, 'utf-8');
    writeFileSync(backupPath, content);
  }

  // Clean up old backups
  try {
    const backups = readdirSync(backupDir)
      .filter(f => f.startsWith(baseName) && f.endsWith('.json'))
      .sort()
      .reverse();

    // Remove excess backups
    for (let i = keepCount; i < backups.length; i++) {
      const oldBackup = join(backupDir, backups[i]);
      unlinkSync(oldBackup);
    }
  } catch {
    // Ignore cleanup errors
  }
}

/**
 * Check circuit breaker status
 * @param {object} currentFailure - { reason: string, validator: string, chapter: number }
 * @returns {object} { action: 'RETRY' | 'STOP', message?: string, options?: array }
 */
export function checkCircuitBreaker(currentFailure) {
  const sameFailures = CIRCUIT_BREAKER.failure_history.filter(
    f => f.reason === currentFailure.reason && f.validator === currentFailure.validator
  );

  if (sameFailures.length >= CIRCUIT_BREAKER.max_same_failures - 1) {
    return {
      action: 'STOP',
      message: `동일 이유로 ${CIRCUIT_BREAKER.max_same_failures}회 실패. 사용자 개입 필요.`,
      diagnosis: currentFailure,
      options: [
        'A) 수동 수정 후 재시도',
        'B) 기준 완화 (legacy 70점)',
        'C) 해당 회차 스킵',
        'D) 집필 중단'
      ]
    };
  }

  CIRCUIT_BREAKER.failure_history.push({
    ...currentFailure,
    timestamp: new Date().toISOString()
  });

  return { action: 'RETRY' };
}

/**
 * Reset circuit breaker (after successful validation or user intervention)
 */
export function resetCircuitBreaker() {
  CIRCUIT_BREAKER.failure_history = [];
}

/**
 * Get circuit breaker status
 */
export function getCircuitBreakerStatus() {
  return {
    failure_count: CIRCUIT_BREAKER.failure_history.length,
    failure_reasons: [...new Set(CIRCUIT_BREAKER.failure_history.map(f => f.reason))],
    triggered: CIRCUIT_BREAKER.failure_history.length >= CIRCUIT_BREAKER.max_same_failures
  };
}

/**
 * Save circuit breaker state to ralph-state.json
 */
export function saveCircuitBreakerState(projectPath) {
  const statePath = join(projectPath, 'meta', 'ralph-state.json');

  if (!existsSync(statePath)) return;

  try {
    const state = JSON.parse(readFileSync(statePath, 'utf-8'));
    state.circuit_breaker = getCircuitBreakerStatus();
    writeFileSync(statePath, JSON.stringify(state, null, 2));
  } catch (e) {
    console.error('[Checkpoint] Failed to save circuit breaker state:', e.message);
  }
}

/**
 * Load circuit breaker state from ralph-state.json
 */
export function loadCircuitBreakerState(projectPath) {
  const statePath = join(projectPath, 'meta', 'ralph-state.json');

  if (!existsSync(statePath)) return;

  try {
    const state = JSON.parse(readFileSync(statePath, 'utf-8'));
    if (state.circuit_breaker?.failure_reasons) {
      // Restore failure history
      CIRCUIT_BREAKER.failure_history = state.circuit_breaker.failure_reasons.map(reason => ({
        reason,
        timestamp: new Date().toISOString()
      }));
    }
  } catch (e) {
    console.error('[Checkpoint] Failed to load circuit breaker state:', e.message);
  }
}
