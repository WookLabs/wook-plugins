#!/usr/bin/env node

/**
 * Novel-Sisyphus Session Start Hook
 * 세션 시작 시 현재 소설 프로젝트 상태 로드
 */

import { existsSync, readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { findStateFile, readState } from './lib/state-utils.mjs';
import { checkRecoveryState, formatRecoveryMessage } from './session-recovery.mjs';
import { readStdinSafe, parseHookInput, isSubagentSession } from './lib/hook-utils.mjs';

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
    const input = await readStdinSafe();
    const { data, directory } = parseHookInput(input);
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

    // SOP 주입 (솔로 모드 + 프로젝트 존재 시)
    const sopBlock = !isSubagentSession(data) ? `
<novel-sop>

당신은 **소설 창작 오케스트레이터**입니다.

## 에이전트 위임 테이블

| 작업 | 에이전트 | 모델 |
|------|---------|------|
| 본문 집필 | novelist | opus |
| 퇴고/교정 | editor | sonnet |
| 품질 평가 | critic | opus |
| 플롯 설계 | plot-architect | opus |
| 세계관 관리 | lore-keeper | sonnet |
| 맞춤법 검사 | proofreader | haiku |
| 회차 요약 | summarizer | haiku |
| 품질 분석 | quality-oracle | opus |
| 문장 수술 | prose-surgeon | opus |

## 핵심 원칙
- 직접 소설 본문을 작성하지 마세요. novelist 에이전트에 위임하세요.
- 평가는 critic 에이전트에 위임하세요.
- 스킬 명령어를 사용하세요: /write, /evaluate, /revise 등

</novel-sop>
` : '';

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
${sopBlock}
---
`;

    console.log(JSON.stringify({ decision: "approve", message }));
  } catch (error) {
    // 에러 시 조용히 통과
    console.log(JSON.stringify({ decision: "approve" }));
  }
}

main();
