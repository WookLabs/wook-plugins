#!/usr/bin/env node

/**
 * Novel-Sisyphus Notepad Manager
 * 컴팩션 복원력을 위한 notepad.md 자동 관리
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync } from 'fs';
import { join } from 'path';

/**
 * Generate or update notepad.md for a project
 * @param {string} projectPath - Path to novel project
 */
export async function updateNotepad(projectPath) {
  const notepadPath = join(projectPath, 'notepad.md');

  // Read existing notepad to preserve user sections
  let userNotes = '';
  if (existsSync(notepadPath)) {
    const existing = readFileSync(notepadPath, 'utf-8');
    userNotes = extractUserSection(existing);
  }

  // Gather project state
  const state = await gatherProjectState(projectPath);

  // Generate new notepad content
  const content = generateNotepadContent(state, userNotes);

  // Write notepad
  writeFileSync(notepadPath, content);
  return notepadPath;
}

/**
 * Extract user section from existing notepad
 * @param {string} content - Existing notepad content
 * @returns {string} User notes section
 */
function extractUserSection(content) {
  const marker = '<!-- 사용자 섹션 -->';
  const idx = content.indexOf(marker);
  if (idx === -1) return '';

  // Extract everything from the marker onwards
  const afterMarker = content.substring(idx + marker.length);

  // Find the "## 작가 노트" section and get its content
  const notesMatch = afterMarker.match(/## 작가 노트\s*([\s\S]*?)(?=\n## |\n---|$)/);
  return notesMatch ? notesMatch[1].trim() : '';
}

/**
 * Gather current project state
 * @param {string} projectPath
 * @returns {object} Project state
 */
async function gatherProjectState(projectPath) {
  const state = {
    title: '',
    currentChapter: null,
    lastQualityScore: null,
    currentAct: 1,
    actProgress: '0/0',
    completedChapters: 0,
    totalChapters: 0,
    foreshadowingAlerts: [],
    ralphActive: false
  };

  // Read project.json
  const projectPath2 = join(projectPath, 'meta', 'project.json');
  if (existsSync(projectPath2)) {
    try {
      const project = JSON.parse(readFileSync(projectPath2, 'utf-8'));
      state.title = project.title || '';
      state.totalChapters = project.target_chapters || 0;
    } catch {}
  }

  // Read ralph-state.json
  const statePath = join(projectPath, 'meta', 'ralph-state.json');
  if (existsSync(statePath)) {
    try {
      const ralphState = JSON.parse(readFileSync(statePath, 'utf-8'));
      state.currentChapter = ralphState.current_chapter;
      state.lastQualityScore = ralphState.last_quality_score;
      state.currentAct = ralphState.current_act || 1;
      state.ralphActive = ralphState.ralph_active === true;
      state.completedChapters = ralphState.completed_chapters?.length || 0;
    } catch {}
  }

  // Count completed chapters from files
  const chaptersDir = join(projectPath, 'chapters');
  if (existsSync(chaptersDir)) {
    try {
      const files = readdirSync(chaptersDir)
        .filter(f => f.match(/^chapter_\d+\.md$/i));
      state.completedChapters = Math.max(state.completedChapters, files.length);
    } catch {}
  }

  // Gather foreshadowing alerts
  state.foreshadowingAlerts = await gatherForeshadowingAlerts(projectPath, state.currentChapter);

  // Calculate act progress
  const chaptersPerAct = Math.ceil(state.totalChapters / 3); // Assume 3 acts
  const actStart = (state.currentAct - 1) * chaptersPerAct + 1;
  const actEnd = Math.min(state.currentAct * chaptersPerAct, state.totalChapters);
  const actCompleted = state.completedChapters - actStart + 1;
  state.actProgress = `${Math.max(0, actCompleted)}/${actEnd - actStart + 1}`;

  return state;
}

/**
 * Gather foreshadowing alerts (to plant or harvest soon)
 * @param {string} projectPath
 * @param {number} currentChapter
 * @returns {Array} Alerts
 */
async function gatherForeshadowingAlerts(projectPath, currentChapter) {
  const alerts = [];
  const fsPath = join(projectPath, 'plot', 'foreshadowing.json');

  if (!existsSync(fsPath)) return alerts;

  try {
    const foreshadowing = JSON.parse(readFileSync(fsPath, 'utf-8'));
    const items = foreshadowing.foreshadowing || foreshadowing.items || [];

    for (const fs of items) {
      // Alert for upcoming harvest
      if (fs.harvest_chapter && currentChapter) {
        const diff = fs.harvest_chapter - currentChapter;
        if (diff > 0 && diff <= 3) {
          alerts.push({
            type: 'harvest',
            id: fs.id,
            name: fs.name || fs.description?.substring(0, 20),
            chapter: fs.harvest_chapter,
            message: `[${fs.harvest_chapter}화 회수] ${fs.id} "${fs.name || ''}"`
          });
        }
      }

      // Alert for not-yet-planted items
      if (fs.plant_chapter && currentChapter && fs.plant_chapter <= currentChapter + 2) {
        if (!fs.planted) {
          alerts.push({
            type: 'plant',
            id: fs.id,
            name: fs.name || fs.description?.substring(0, 20),
            chapter: fs.plant_chapter,
            message: `[미심기] ${fs.id} "${fs.name || ''}" (${fs.plant_chapter}화 예정)`
          });
        }
      }
    }
  } catch {}

  return alerts;
}

/**
 * Generate notepad.md content
 * @param {object} state - Project state
 * @param {string} userNotes - Preserved user notes
 * @returns {string} Notepad content
 */
function generateNotepadContent(state, userNotes) {
  const qualityDisplay = state.lastQualityScore !== null
    ? `${state.lastQualityScore}점`
    : '평가 전';

  let foreshadowingSection = '';
  if (state.foreshadowingAlerts.length > 0) {
    foreshadowingSection = `## 복선 알림
${state.foreshadowingAlerts.map(a => `- ${a.message}`).join('\n')}
`;
  } else {
    foreshadowingSection = `## 복선 알림
- (예정된 복선 없음)
`;
  }

  const ralphNote = state.ralphActive
    ? `- Ralph Loop: 활성 (막 ${state.currentAct})\n`
    : '';

  return `# ${state.title || 'Novel'} - 집필 노트

<!-- 자동 생성 섹션 (시스템) - 수정 금지 -->
## 집필 상태
- 활성 회차: ${state.currentChapter || '시작 전'}화
- 최근 품질: ${qualityDisplay}
- 진행: Act ${state.currentAct} (${state.actProgress}화)
- 전체 진행: ${state.completedChapters}/${state.totalChapters}화
${ralphNote}
${foreshadowingSection}
<!-- 사용자 섹션 -->
## 작가 노트
${userNotes || '(여기에 메모를 작성하세요)'}
`;
}

/**
 * Update notepad after specific events
 */
export const NotepadEvents = {
  CHAPTER_COMPLETE: 'chapter_complete',
  QUALITY_GATE: 'quality_gate',
  FORESHADOWING_UPDATE: 'foreshadowing_update',
  ACT_COMPLETE: 'act_complete'
};

/**
 * Event-based notepad update
 * @param {string} projectPath
 * @param {string} event - Event type from NotepadEvents
 * @param {object} data - Event-specific data
 */
export async function onNotepadEvent(projectPath, event, data = {}) {
  // Simply update the notepad - it will gather fresh state
  await updateNotepad(projectPath);
}
