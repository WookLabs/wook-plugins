#!/usr/bin/env node

/**
 * Novel-Sisyphus Session Start Hook
 * 세션 시작 시 현재 소설 프로젝트 상태 로드
 */

import { existsSync, readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { findStateFile, readState } from './lib/state-utils.mjs';
import { checkRecoveryState, formatRecoveryMessage } from './session-recovery.mjs';

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf-8');
}

function readJsonFile(path) {
  try {
    if (!existsSync(path)) return null;
    return JSON.parse(readFileSync(path, 'utf-8'));
  } catch {
    return null;
  }
}

async function main() {
  try {
    const input = await readStdin();
    let data = {};
    try { data = JSON.parse(input); } catch {}

    const directory = data.directory || data.cwd || process.cwd();
    const novelsDir = join(directory, 'novels');

    // novels 폴더가 없으면 통과
    if (!existsSync(novelsDir)) {
      console.log(JSON.stringify({ decision: "approve" }));
      return;
    }

    // 프로젝트 목록 조회
    let projects = [];
    try {
      projects = readdirSync(novelsDir)
        .filter(f => existsSync(join(novelsDir, f, 'meta', 'project.json')));
    } catch {
      console.log(JSON.stringify({ decision: "approve" }));
      return;
    }

    if (projects.length === 0) {
      console.log(JSON.stringify({ decision: "approve" }));
      return;
    }

    // ✅ FIX #5: 가장 최근 프로젝트 찾기 - created_at 기준 정렬
    let latestProject = null;
    let latestTime = null;

    for (const proj of projects) {
      const projFile = join(novelsDir, proj, 'meta', 'project.json');
      const projData = readJsonFile(projFile);
      if (projData) {
        const createdAt = projData.created_at ? new Date(projData.created_at) : null;
        if (createdAt && (!latestTime || createdAt > latestTime)) {
          latestTime = createdAt;
          latestProject = proj;
        }
      }
    }

    // 타임스탬프 없으면 알파벳 정렬 폴백
    if (!latestProject) {
      projects.sort();
      latestProject = projects[projects.length - 1];
    }
    const projectJsonPath = join(novelsDir, latestProject, 'meta', 'project.json');
    const project = readJsonFile(projectJsonPath);

    if (!project) {
      console.log(JSON.stringify({ decision: "approve" }));
      return;
    }

    // 진행 상황 계산
    const chaptersDir = join(novelsDir, latestProject, 'chapters');
    let completedChapters = 0;
    if (existsSync(chaptersDir)) {
      try {
        // ✅ FIX: 제로패딩 및 대소문자 지원
        const chapterFiles = readdirSync(chaptersDir)
          .filter(f => f.match(/^chapter_\d{1,4}\.md$/i));
        completedChapters = chapterFiles.length;
      } catch {}
    }

    // Ralph Loop 상태 확인 - 프로젝트 경로 사용 (워크스페이스 경로 아님)
    const projectPath = join(novelsDir, latestProject);
    const stateInfo = findStateFile(projectPath);
    const ralphState = stateInfo ? readState(projectPath) : null;
    const isRalphActive = ralphState?.ralph_active === true;

    // Session recovery check
    const recoveryState = await checkRecoveryState(projectPath);
    const hasRecovery = recoveryState !== null && !isRalphActive;

    // 상태 메시지 생성
    let statusIcon = '';
    switch (project.status) {
      case 'planning': statusIcon = '📝'; break;
      case 'writing': statusIcon = '✍️'; break;
      case 'editing': statusIcon = '📖'; break;
      case 'complete': statusIcon = '✅'; break;
      default: statusIcon = '📄';
    }

    const progressPercent = project.target_chapters > 0
      ? Math.round((completedChapters / project.target_chapters) * 100)
      : 0;

    const message = `<novel-session>

${statusIcon} **현재 활성 프로젝트**: ${project.title} (\`${latestProject}\`)

| 항목 | 내용 |
|------|------|
| 장르 | ${Array.isArray(project.genre) ? project.genre.join(', ') : project.genre || '미정'} |
| 진행 | ${completedChapters}/${project.target_chapters}화 (${progressPercent}%) |
| 상태 | ${project.status || 'planning'} |
${isRalphActive ? `| Ralph Loop | 활성 (막 ${ralphState.current_act || 1}) |` : ''}

${isRalphActive ? '⚠️ **Ralph Loop가 활성 상태입니다.** 중단하려면 `/cancel-ralph`를 사용하세요.' : ''}
${hasRecovery ? formatRecoveryMessage(recoveryState) : ''}

사용 가능한 커맨드: \`/init\`, \`/design_*\`, \`/write\`, \`/write_all\`, \`/stats\`, \`/export\`

</novel-session>

---
`;

    console.log(JSON.stringify({ decision: "approve", message }));
  } catch (error) {
    // 에러 시 조용히 통과
    console.log(JSON.stringify({ decision: "approve" }));
  }
}

main();
