#!/usr/bin/env node

/**
 * Novel-Sisyphus PostToolUse Hook: Post-tool Verifier
 * 도구 실행 결과 검증 및 기억 태그 처리
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync } from 'fs';
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
    directory,
    join(directory, '..'),
  ];

  for (const basePath of patterns) {
    const metaPath = join(basePath, 'meta', 'project.json');
    if (existsSync(metaPath)) return basePath;

    // Check novels subdirectory
    const novelsDir = join(basePath, 'novels');
    if (existsSync(novelsDir)) {
      try {
        const novels = readdirSync(novelsDir);
        for (const novel of novels) {
          const novelPath = join(novelsDir, novel);
          const novelMeta = join(novelPath, 'meta', 'project.json');
          if (existsSync(novelMeta)) return novelPath;
        }
      } catch {}
    }
  }
  return null;
}

// Extract quality score from critic output
function extractQualityScore(output) {
  const patterns = [
    /<score>(\d+)<\/score>/i,
    /품질\s*[:：]\s*(\d+)/,
    /점수\s*[:：]\s*(\d+)/,
    /quality\s*[:：]\s*(\d+)/i,
    /score\s*[:：]\s*(\d+)/i,
    /(\d+)\s*점/,
    /(\d+)\s*\/\s*100/
  ];

  for (const pattern of patterns) {
    const match = output.match(pattern);
    if (match) {
      const score = parseInt(match[1], 10);
      if (score >= 0 && score <= 100) return score;
    }
  }
  return null;
}

// Extract foreshadowing IDs from output
function extractForeshadowingIds(output) {
  const pattern = /FS-\d{3}/g;
  const matches = output.match(pattern) || [];
  return [...new Set(matches)];
}

// Process <remember> tags for author notes
function extractRememberTags(output) {
  const tags = [];

  // <remember>content</remember>
  const regularRegex = /<remember>([\s\S]*?)<\/remember>/gi;
  let match;
  while ((match = regularRegex.exec(output)) !== null) {
    tags.push({
      type: 'note',
      content: match[1].trim()
    });
  }

  // <remember priority>content</remember>
  const priorityRegex = /<remember\s+priority>([\s\S]*?)<\/remember>/gi;
  while ((match = priorityRegex.exec(output)) !== null) {
    tags.push({
      type: 'priority',
      content: match[1].trim()
    });
  }

  return tags;
}

// Save remember tags to notepad
function saveToNotepad(projectPath, tags) {
  if (!tags || tags.length === 0) return;

  const notepadPath = join(projectPath, 'notepad.md');
  let content = '';

  if (existsSync(notepadPath)) {
    content = readFileSync(notepadPath, 'utf-8');
  }

  // Find or create 작가 노트 section
  const marker = '## 작가 노트';
  const markerIdx = content.indexOf(marker);

  const timestamp = new Date().toISOString().split('T')[0];
  const newNotes = tags.map(t => {
    const prefix = t.type === 'priority' ? '⭐ ' : '';
    return `- ${prefix}[${timestamp}] ${t.content}`;
  }).join('\n');

  if (markerIdx !== -1) {
    // Insert after marker
    const beforeMarker = content.substring(0, markerIdx + marker.length);
    const afterMarker = content.substring(markerIdx + marker.length);
    content = `${beforeMarker}\n${newNotes}${afterMarker}`;
  } else {
    // Append new section
    content += `\n\n${marker}\n${newNotes}\n`;
  }

  writeFileSync(notepadPath, content);
}

// Update ralph-state with quality score
function updateQualityScore(projectPath, score) {
  const statePath = join(projectPath, 'meta', 'ralph-state.json');

  let state = {};
  if (existsSync(statePath)) {
    try {
      state = JSON.parse(readFileSync(statePath, 'utf-8'));
    } catch {}
  }

  state.last_quality_score = score;
  state.last_quality_check = new Date().toISOString();

  // Ensure meta directory exists
  const metaDir = join(projectPath, 'meta');
  if (!existsSync(metaDir)) {
    mkdirSync(metaDir, { recursive: true });
  }

  writeFileSync(statePath, JSON.stringify(state, null, 2));
}

// Generate contextual message based on tool output
function generateMessage(toolName, toolOutput, toolInput) {
  const messages = [];

  // Check for Task agent completion
  if (toolName === 'Task') {
    const inputStr = JSON.stringify(toolInput || {});

    // Critic agent output
    if (/critic|Task_critic/i.test(inputStr)) {
      const score = extractQualityScore(toolOutput);
      if (score !== null) {
        if (score >= 80) {
          messages.push(`품질 점수 ${score}점 - 우수`);
        } else if (score >= 70) {
          messages.push(`품질 점수 ${score}점 - 통과`);
        } else {
          messages.push(`⚠️ 품질 점수 ${score}점 - 재집필 필요`);
        }
      }
    }

    // Novelist agent output - check for foreshadowing
    if (/novelist|Task_novelist/i.test(inputStr)) {
      const fsIds = extractForeshadowingIds(toolOutput);
      if (fsIds.length > 0) {
        messages.push(`복선 언급: ${fsIds.join(', ')}`);
      }
    }

    // Check for remember tags
    const rememberTags = extractRememberTags(toolOutput);
    if (rememberTags.length > 0) {
      messages.push(`${rememberTags.length}개 메모 저장됨`);
    }
  }

  // Check for write failures
  if (toolName === 'Write' || toolName === 'Edit') {
    if (/error|failed|permission/i.test(toolOutput)) {
      messages.push('⚠️ 파일 작업 실패 - 확인 필요');
    }
  }

  return messages.join(' | ');
}

async function main() {
  try {
    const input = await readStdin();
    const data = JSON.parse(input);

    const toolName = data.toolName || '';
    const toolOutput = data.toolOutput || '';
    const toolInput = data.toolInput || {};
    const directory = data.directory || process.cwd();

    // Find novel project
    const projectPath = findNovelProject(directory);

    // Process results if in a novel project
    if (projectPath && toolName === 'Task') {
      const inputStr = JSON.stringify(toolInput);

      // Extract and save quality score from critic
      if (/critic/i.test(inputStr)) {
        const score = extractQualityScore(toolOutput);
        if (score !== null) {
          updateQualityScore(projectPath, score);
        }
      }

      // Extract and save remember tags
      const rememberTags = extractRememberTags(toolOutput);
      if (rememberTags.length > 0) {
        saveToNotepad(projectPath, rememberTags);
      }
    }

    // Generate message
    const message = generateMessage(toolName, toolOutput, toolInput);

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
