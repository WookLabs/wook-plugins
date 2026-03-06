#!/usr/bin/env node

/**
 * Novel-Sisyphus State Detector Hook
 *
 * Ralph Loop 활성 상태 감지 및 리마인더 전용.
 * 스킬 라우팅은 novel-skill-router.mjs가 담당.
 */

import { existsSync } from 'fs';
import { join } from 'path';
import { findStateFile, readState } from './lib/state-utils.mjs';

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf-8');
}

function extractPrompt(input) {
  try {
    const data = JSON.parse(input);
    if (data.prompt) return data.prompt;
    if (data.message?.content) return data.message.content;
    if (Array.isArray(data.parts)) {
      return data.parts
        .filter(p => p.type === 'text')
        .map(p => p.text)
        .join(' ');
    }
    return '';
  } catch {
    const match = input.match(/"(?:prompt|content|text)"\s*:\s*"([^"]+)"/);
    return match ? match[1] : '';
  }
}

function removeCodeBlocks(text) {
  return text
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]+`/g, '');
}

async function main() {
  try {
    const input = await readStdin();
    if (!input.trim()) {
      console.log(JSON.stringify({ decision: "approve" }));
      return;
    }

    let data = {};
    try { data = JSON.parse(input); } catch {}
    const directory = data.directory || data.cwd || process.cwd();

    const prompt = extractPrompt(input);
    if (!prompt) {
      console.log(JSON.stringify({ decision: "approve" }));
      return;
    }

    const cleanPrompt = removeCodeBlocks(prompt).toLowerCase();

    // Ralph Loop 활성 상태 확인 - novels/ 하위 프로젝트에서 찾기
    const novelsDir = join(directory, 'novels');
    let ralphState = null;
    if (existsSync(novelsDir)) {
      const { readdirSync } = await import('fs');
      const projects = readdirSync(novelsDir)
        .filter(f => existsSync(join(novelsDir, f, 'meta', 'project.json')));

      for (const proj of projects) {
        const projectPath = join(novelsDir, proj);
        const stateInfo = findStateFile(projectPath);
        if (stateInfo) {
          ralphState = readState(projectPath);
          break;
        }
      }
    }

    // Ralph Loop 활성 중이면 리마인더 제공
    if (ralphState?.ralph_active) {
      const currentAct = ralphState.current_act || 1;
      const currentChapter = ralphState.current_chapter || 1;

      // 취소 명령어 감지 → passthrough (사용자가 직접 /cancel 실행)
      if (/cancel|중단|취소|stop/.test(cleanPrompt)) {
        console.log(JSON.stringify({ decision: "approve" }));
        return;
      }

      console.log(JSON.stringify({
        decision: "approve",
        hookSpecificOutput: {
          hookEventName: 'UserPromptSubmit',
          additionalContext: `<novel-ralph-reminder>

**Ralph Loop 진행 중** (막 ${currentAct}, 회차 ${currentChapter})

현재 작업을 계속 진행해주세요.
- 중단하려면: 사용자에게 확인 후 \`/cancel-ralph\` 사용
- 현재 상태: \`${ralphState.project_id}\`

</novel-ralph-reminder>`
        }
      }));
      return;
    }

    // 기본: 통과 (스킬 라우팅은 novel-skill-router.mjs가 처리)
    console.log(JSON.stringify({ decision: "approve" }));
  } catch (error) {
    console.log(JSON.stringify({ decision: "approve" }));
  }
}

main();
