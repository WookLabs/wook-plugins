#!/usr/bin/env node

/**
 * Novel-Sisyphus PreToolUse Hook: Pre-tool Reminder
 * 소설 에이전트 도구 실행 전 컨텍스트 리마인더 주입
 */

import { existsSync, readFileSync, readdirSync } from 'fs';
import { join } from 'path';

// Read all stdin
async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf-8');
}

// Find active novel project
function findNovelProject(directory) {
  const patterns = [
    join(directory, 'novels'),
    join(directory, '..')
  ];

  for (const base of [directory, ...patterns]) {
    try {
      const projectPath = findProjectInPath(base);
      if (projectPath) return projectPath;
    } catch {}
  }
  return null;
}

function findProjectInPath(basePath) {
  if (!existsSync(basePath)) return null;

  // Check if this is a novel project
  const metaPath = join(basePath, 'meta', 'project.json');
  if (existsSync(metaPath)) return basePath;

  // Check novels subdirectory
  const novelsDir = join(basePath, 'novels');
  if (existsSync(novelsDir)) {
    const novels = readdirSync(novelsDir);
    for (const novel of novels) {
      const novelPath = join(novelsDir, novel);
      const novelMeta = join(novelPath, 'meta', 'project.json');
      if (existsSync(novelMeta)) return novelPath;
    }
  }

  return null;
}

// Get project state for context
function getProjectState(projectPath) {
  const state = {
    genre: '',
    style: '',
    currentChapter: null,
    qualityScore: null,
    foreshadowingAlerts: [],
    ralphActive: false,
    criticFeedback: ''
  };

  // Read project.json for style/genre
  const projectJson = join(projectPath, 'meta', 'project.json');
  if (existsSync(projectJson)) {
    try {
      const project = JSON.parse(readFileSync(projectJson, 'utf-8'));
      state.genre = project.genre || '';
      state.style = project.style || project.tone || '';
    } catch {}
  }

  // Read ralph-state.json
  const ralphState = join(projectPath, 'meta', 'ralph-state.json');
  if (existsSync(ralphState)) {
    try {
      const ralph = JSON.parse(readFileSync(ralphState, 'utf-8'));
      state.currentChapter = ralph.current_chapter;
      state.qualityScore = ralph.last_quality_score;
      state.ralphActive = ralph.ralph_active === true;
    } catch {}
  }

  // Read foreshadowing.json for alerts
  const fsPath = join(projectPath, 'plot', 'foreshadowing.json');
  if (existsSync(fsPath) && state.currentChapter) {
    try {
      const fs = JSON.parse(readFileSync(fsPath, 'utf-8'));
      const items = fs.foreshadowing || fs.items || [];
      state.foreshadowingAlerts = items
        .filter(f => {
          // Upcoming harvest (within 3 chapters)
          if (f.harvest_chapter) {
            const diff = f.harvest_chapter - state.currentChapter;
            if (diff > 0 && diff <= 3) return true;
          }
          // Not yet planted
          if (f.plant_chapter && !f.planted && f.plant_chapter <= state.currentChapter + 2) {
            return true;
          }
          return false;
        })
        .map(f => f.id)
        .slice(0, 5);
    } catch {}
  }

  // Read recent critic feedback
  const reviewsDir = join(projectPath, 'reviews');
  if (existsSync(reviewsDir)) {
    try {
      const reviews = readdirSync(reviewsDir)
        .filter(f => f.endsWith('.json'))
        .sort()
        .reverse();

      if (reviews.length > 0) {
        const latestReview = JSON.parse(readFileSync(join(reviewsDir, reviews[0]), 'utf-8'));
        state.criticFeedback = latestReview.summary || latestReview.feedback?.substring(0, 100) || '';
      }
    } catch {}
  }

  return state;
}

// Generate reminder based on tool and agent type
function generateReminder(toolName, toolInput, state) {
  // Detect agent type from task input
  const isNovelAgent = /novelist|Task_novelist/i.test(toolInput);
  const isEditorAgent = /editor|Task_editor/i.test(toolInput);
  const isCriticAgent = /critic|Task_critic/i.test(toolInput);
  const isLoreKeeper = /lore-keeper|Task_lore-keeper/i.test(toolInput);

  const reminders = [];

  if (toolName === 'Task') {
    if (isNovelAgent) {
      // Novelist reminders
      if (state.genre) reminders.push(`장르: ${state.genre}`);
      if (state.style) reminders.push(`스타일: ${state.style}`);
      if (state.foreshadowingAlerts.length > 0) {
        reminders.push(`복선 알림: ${state.foreshadowingAlerts.join(', ')}`);
      }
      if (state.currentChapter) {
        reminders.push(`현재 ${state.currentChapter}화 집필 중`);
      }
    }

    if (isEditorAgent) {
      // Editor reminders
      if (state.qualityScore !== null) {
        reminders.push(`최근 품질 점수: ${state.qualityScore}점`);
      }
      if (state.criticFeedback) {
        reminders.push(`Critic 피드백: ${state.criticFeedback}`);
      }
    }

    if (isCriticAgent) {
      // Critic reminders - READ-ONLY enforcement
      reminders.push('⚠️ READ-ONLY 에이전트: 평가만 수행, 파일 수정 불가');
    }

    if (isLoreKeeper) {
      // Lore-keeper reminders
      reminders.push('설정 일관성 유지 필수');
      if (state.foreshadowingAlerts.length > 0) {
        reminders.push(`활성 복선: ${state.foreshadowingAlerts.join(', ')}`);
      }
    }
  }

  // Ralph Loop active reminder
  if (state.ralphActive && toolName !== 'TodoWrite') {
    reminders.push('Ralph Loop 활성: 품질 게이트 통과까지 계속');
  }

  return reminders.join(' | ');
}

async function main() {
  try {
    const input = await readStdin();
    const data = JSON.parse(input);

    const toolName = data.toolName || '';
    const toolInput = JSON.stringify(data.toolInput || {});
    const directory = data.directory || process.cwd();

    // Find novel project
    const projectPath = findNovelProject(directory);

    let message = '';

    if (projectPath) {
      const state = getProjectState(projectPath);
      message = generateReminder(toolName, toolInput, state);
    }

    const response = { continue: true };
    if (message) {
      response.message = `[Novel-Sisyphus] ${message}`;
    }

    console.log(JSON.stringify(response, null, 2));
  } catch (error) {
    // On error, always continue
    console.log(JSON.stringify({ continue: true }));
  }
}

main();
