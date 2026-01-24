#!/usr/bin/env node

/**
 * Novel-Sisyphus Session Recovery
 * 이전 세션에서 중단된 write-all 작업 복구 확인
 */

import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

/**
 * Check if there's a recoverable write-all session
 * @param {string} projectPath - Path to the novel project
 * @returns {object|null} Recovery state or null if no recovery available
 */
export async function checkRecoveryState(projectPath) {
  const statePath = join(projectPath, 'meta', 'ralph-state.json');

  if (!existsSync(statePath)) return null;

  try {
    const state = JSON.parse(readFileSync(statePath, 'utf-8'));

    // Only offer recovery if:
    // 1. can_resume flag is true
    // 2. mode is 'write-all'
    // 3. Ralph Loop is NOT currently active (either gracefully paused or crashed)
    //
    // Recovery scenarios:
    // - Graceful cancel: ralph_active=false, can_resume=true → Offer recovery
    // - Crash/interrupt: ralph_active=true, can_resume=true → Offer recovery (crash recovery)
    // - Completed: ralph_active=false, can_resume=false → No recovery needed
    if (state.can_resume && state.mode === 'write-all') {
      const completedCount = state.completed_chapters?.length || 0;
      const failedCount = state.failed_chapters?.length || 0;

      return {
        resumeFrom: state.current_chapter,
        currentAct: state.current_act,
        completedChapters: state.completed_chapters || [],
        failedChapters: state.failed_chapters || [],
        lastCheckpoint: state.last_checkpoint,
        totalChapters: state.total_chapters,
        projectId: state.project_id,
        suggestion: `이전 세션에서 ${state.current_chapter}화 집필 중 중단되었습니다. (완료: ${completedCount}화, 실패: ${failedCount}화)\n이어서 진행할까요? (/write_all --resume)`
      };
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Format recovery message for display
 * @param {object} recoveryState - State from checkRecoveryState
 * @returns {string} Formatted message
 */
export function formatRecoveryMessage(recoveryState) {
  if (!recoveryState) return '';

  const timeSince = recoveryState.lastCheckpoint
    ? formatTimeSince(new Date(recoveryState.lastCheckpoint))
    : '알 수 없음';

  return `<session-recovery>

⚠️ **이전 세션 복구 가능**

| 항목 | 내용 |
|------|------|
| 프로젝트 | ${recoveryState.projectId} |
| 중단 위치 | ${recoveryState.currentAct}막 ${recoveryState.resumeFrom}화 |
| 완료된 회차 | ${recoveryState.completedChapters.length}화 |
| 실패한 회차 | ${recoveryState.failedChapters.length}화 |
| 마지막 체크포인트 | ${timeSince} 전 |

**복구 옵션:**
- \`/write_all --resume\` - 중단점에서 이어서 집필
- \`/write_all --restart\` - 처음부터 다시 시작
- \`/cancel-ralph\` - 복구 취소

</session-recovery>

---
`;
}

/**
 * Format time since a date
 * @param {Date} date
 * @returns {string}
 */
function formatTimeSince(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) return `${diffDays}일`;
  if (diffHours > 0) return `${diffHours}시간`;
  if (diffMins > 0) return `${diffMins}분`;
  return '방금';
}

/**
 * Clear recovery state (when user chooses to restart)
 * @param {string} projectPath
 */
export async function clearRecoveryState(projectPath) {
  const statePath = join(projectPath, 'meta', 'ralph-state.json');

  if (!existsSync(statePath)) return;

  try {
    const state = JSON.parse(readFileSync(statePath, 'utf-8'));
    state.can_resume = false;
    state.completed_chapters = [];
    state.failed_chapters = [];
    state.mode = null;

    writeFileSync(statePath, JSON.stringify(state, null, 2));
  } catch {
    // Ignore errors
  }
}
