#!/usr/bin/env node

/**
 * Novel-Sisyphus Act Completion Hook
 * Stop 이벤트에서 Ralph Loop 지속 및 막 완료 확인
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { findStateFile, readState, writeState } from './lib/state-utils.mjs';
import { saveCheckpoint, markChapterComplete } from './checkpoint.mjs';
import { updateNotepad } from './notepad-manager.mjs';
import { readStdinSafe } from './lib/hook-utils.mjs';

function readJsonFile(path) {
  try {
    if (!existsSync(path)) return null;
    return JSON.parse(readFileSync(path, 'utf-8'));
  } catch {
    return null;
  }
}

function writeJsonFile(path, data) {
  try {
    const dir = join(path, '..');
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    writeFileSync(path, JSON.stringify(data, null, 2));
    return true;
  } catch {
    return false;
  }
}

/**
 * ✅ FIX: transcript_path에서 어시스턴트의 마지막 메시지 추출
 * Stop 훅은 data.message를 제공하지 않으므로 transcript 파일을 직접 읽어야 함
 */
function getLastAssistantMessage(transcriptPath) {
  try {
    if (!transcriptPath || !existsSync(transcriptPath)) return '';

    const content = readFileSync(transcriptPath, 'utf-8');
    const lines = content.trim().split('\n').filter(Boolean);

    // JSONL 파일을 역순으로 탐색하여 마지막 assistant 메시지 찾기
    for (let i = lines.length - 1; i >= 0; i--) {
      try {
        const entry = JSON.parse(lines[i]);
        if (entry.role === 'assistant') {
          // content가 문자열인 경우
          if (typeof entry.content === 'string') {
            return entry.content;
          }
          // content가 배열인 경우 (multipart message)
          if (Array.isArray(entry.content)) {
            return entry.content
              .filter(part => part.type === 'text')
              .map(part => part.text)
              .join(' ');
          }
        }
      } catch {
        // 파싱 실패한 줄은 건너뛰기
        continue;
      }
    }
    return '';
  } catch {
    return '';
  }
}

async function main() {
  try {
    const input = await readStdinSafe();
    let data = {};
    try { data = JSON.parse(input); } catch {}

    const directory = data.directory || data.cwd || process.cwd();
    const novelsDir = join(directory, 'novels');

    // Find and read state file from active project (not workspace root)
    let state = null;
    let activeProjectPath = null;

    if (existsSync(novelsDir)) {
      const { readdirSync } = await import('fs');
      const projects = readdirSync(novelsDir)
        .filter(f => existsSync(join(novelsDir, f, 'meta', 'project.json')));

      // Search through projects for active Ralph state
      for (const proj of projects) {
        const projectPath = join(novelsDir, proj);
        const stateInfo = findStateFile(projectPath);
        if (stateInfo) {
          const projectState = readState(projectPath);
          if (projectState?.ralph_active) {
            state = projectState;
            activeProjectPath = projectPath;
            break;
          }
        }
      }
    }

    if (!state) {
      console.log(JSON.stringify({ decision: "approve" }));
      return;
    }

    // Ralph Loop가 비활성이면 통과
    if (!state.ralph_active) {
      console.log(JSON.stringify({ decision: "approve" }));
      return;
    }

    // ✅ FIX: transcript_path에서 어시스턴트 메시지 추출하여 Promise 태그 검색
    const assistantMessage = getLastAssistantMessage(data.transcript_path);
    const searchText = input + assistantMessage;
    const actPromiseMatch = searchText.match(/<promise>ACT_(\d+)_DONE<\/promise>/);
    const novelDoneMatch = searchText.match(/<promise>NOVEL_DONE<\/promise>/);

    if (novelDoneMatch) {
      // 전체 소설 완료
      state.ralph_active = false;
      state.act_complete = true;
      writeState(activeProjectPath, state);
      // Update notepad
      await updateNotepad(activeProjectPath);
      console.log(JSON.stringify({ decision: "approve", reason: "Novel completion detected." }));
      return;
    }

    if (actPromiseMatch) {
      const completedAct = parseInt(actPromiseMatch[1]);
      if (completedAct === state.current_act) {
        state.act_complete = true;

        // Style Dice: rotate seed for next act
        const currentSeed = state.style_seed ?? 42;
        state.style_seed = (Math.imul(currentSeed, 1103515245) + 12345) & 0x7fffffff;
        console.error(`[style-dice] Seed rotated: ${currentSeed} -> ${state.style_seed}`);

        writeState(activeProjectPath, state);
        // Update notepad after act completion
        await updateNotepad(activeProjectPath);
        console.log(JSON.stringify({ decision: "approve", reason: `Act ${completedAct} completion detected.` }));
        return;
      }
    }

    const currentAct = state.current_act || 1;
    const iteration = state.iteration || 1;
    const maxIterations = state.max_iterations || 100;

    // 최대 반복 횟수 도달
    if (iteration >= maxIterations) {
      state.ralph_active = false;
      writeState(activeProjectPath, state);
      // Update notepad
      await updateNotepad(activeProjectPath);

      console.log(JSON.stringify({
        decision: "approve",
        reason: `[NOVEL RALPH LOOP - MAX ITERATIONS] 최대 반복 횟수(${maxIterations})에 도달했습니다. 루프를 종료합니다.`
      }));
      return;
    }

    // 막 완료 여부 확인
    if (state.act_complete) {
      // 막 완료 상태 - 다음 막으로 이동 또는 완료 처리
      if (state.current_act >= state.total_acts) {
        // 전체 완료
        console.log(JSON.stringify({
          decision: "approve",
          reason: `<novel-complete>

✅ **소설 집필이 완료되었습니다!**

프로젝트: ${state.project_id}
총 회차: ${state.total_chapters}화
상태: 완료

다음 단계:
- \`/stats\` - 최종 통계 확인
- \`/export\` - 원고 내보내기

</novel-complete>

---
`
        }));

        state.ralph_active = false;
        writeState(activeProjectPath, state);
        // Update notepad
        await updateNotepad(activeProjectPath);
        return;
      }

      // 다음 막 시작
      state.current_act += 1;
      state.act_complete = false;
      state.iteration = 1;
      writeState(activeProjectPath, state);
      // Save checkpoint for next act
      await saveCheckpoint(activeProjectPath, state);
      await updateNotepad(activeProjectPath);

      console.log(JSON.stringify({ decision: "approve", reason: `Next act ${state.current_act} starting.` }));
      return;
    }

    // 막 진행 중 - 계속 진행 강제
    state.iteration = iteration + 1;
    writeState(activeProjectPath, state);
    // Periodic checkpoint and notepad update
    await saveCheckpoint(activeProjectPath, state);
    await updateNotepad(activeProjectPath);

    console.log(JSON.stringify({
      decision: "block",
      reason: `<novel-ralph-continuation>

[NOVEL RALPH LOOP - 막 ${currentAct} 진행 중 (반복 ${iteration + 1}/${maxIterations})]

🔄 막 ${currentAct}의 집필이 완료되지 않았습니다.

**현재 상태:**
- 프로젝트: ${state.project_id}
- 현재 회차: ${state.current_chapter || '?'}
- 품질 점수: ${state.quality_score || '평가 전'}
- 재시도: ${state.retry_count || 0}/3

**다음 단계:**
1. 미완료 회차 확인
2. 집필 계속
3. 막 완료 시: \`<promise>ACT_${currentAct}_DONE</promise>\` 출력

**중단하려면:** 사용자에게 확인 후 Ralph Loop 비활성화

</novel-ralph-continuation>

---
`
    }));
  } catch (error) {
    // 에러 시 통과
    console.log(JSON.stringify({ decision: "approve" }));
  }
}

main();
