#!/usr/bin/env node
/**
 * Design Unpacker — Codex design 출력을 개별 파일로 자동 분배
 *
 * codex-writer.mjs --mode design 이 생성하는 모놀리식 JSON을
 * 프로젝트 디렉토리의 개별 파일로 분배합니다.
 *
 * Usage:
 *   node scripts/design-unpacker.mjs --project ./novels/my-novel
 *   node scripts/design-unpacker.mjs --project ./novels/my-novel --dry-run
 *   node scripts/design-unpacker.mjs --project ./novels/my-novel --input custom-output.json
 *
 * Input: meta/design-codex-output.json (기본)
 * Output:
 *   meta/style-guide.json
 *   world/world.json
 *   characters/*.json + characters/index.json
 *   characters/relationships.json
 *   plot/timeline.json
 *   plot/main-arc.json
 *   plot/sub-arcs/*.json
 *   plot/foreshadowing.json
 *   plot/hooks.json
 */

import fs from 'fs';
import path from 'path';

// ANSI colors
const C = {
  red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m',
  blue: '\x1b[34m', dim: '\x1b[2m', reset: '\x1b[0m'
};

function parseArgs(argv) {
  const result = { project: null, input: null, dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--project' && argv[i + 1]) result.project = argv[++i];
    else if (arg === '--input' && argv[i + 1]) result.input = argv[++i];
    else if (arg === '--dry-run') result.dryRun = true;
    else if (arg === '--help' || arg === '-h') {
      console.log(`Design Unpacker — Codex design 출력을 개별 파일로 분배\n\n  --project PATH   소설 프로젝트 경로 (필수)\n  --input FILE     입력 JSON (기본: meta/design-codex-output.json)\n  --dry-run        파일 쓰지 않고 검증만\n  --help           도움말`);
      process.exit(0);
    }
  }
  return result;
}

function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function backup(filePath) {
  if (fs.existsSync(filePath)) {
    const bakPath = filePath + '.bak';
    fs.copyFileSync(filePath, bakPath);
    return bakPath;
  }
  return null;
}

function writeJson(filePath, data, dryRun) {
  ensureDir(filePath);
  if (dryRun) {
    console.error(`  ${C.dim}[DRY-RUN]${C.reset} ${filePath} (${JSON.stringify(data).length}자)`);
    return;
  }
  const bak = backup(filePath);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  console.error(`  ${C.green}[WRITE]${C.reset} ${filePath}${bak ? ` (백업: ${path.basename(bak)})` : ''}`);
}

// ─── Main ────────────────────────────────────────────────────────────────────

function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!args.project) {
    console.error(`${C.red}[ERROR]${C.reset} --project 옵션이 필요합니다.`);
    process.exit(1);
  }

  const projectDir = path.resolve(args.project);
  const inputPath = args.input
    ? path.resolve(args.input)
    : path.join(projectDir, 'meta', 'design-codex-output.json');

  if (!fs.existsSync(inputPath)) {
    console.error(`${C.red}[ERROR]${C.reset} 입력 파일을 찾을 수 없습니다: ${inputPath}`);
    process.exit(1);
  }

  let designData;
  try {
    designData = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));
  } catch (err) {
    console.error(`${C.red}[ERROR]${C.reset} JSON 파싱 실패: ${err.message}`);
    process.exit(1);
  }

  console.error(`${C.blue}[Design Unpacker]${C.reset} 입력: ${inputPath}`);
  if (args.dryRun) console.error(`${C.yellow}[DRY-RUN]${C.reset} 파일 쓰지 않고 검증만 수행합니다.`);

  let fileCount = 0;

  // 1. style_guide → meta/style-guide.json
  if (designData.style_guide) {
    writeJson(path.join(projectDir, 'meta', 'style-guide.json'), designData.style_guide, args.dryRun);
    fileCount++;
  }

  // 2. world → world/world.json
  if (designData.world) {
    writeJson(path.join(projectDir, 'world', 'world.json'), designData.world, args.dryRun);
    fileCount++;
  }

  // 3. characters → characters/*.json + index
  if (designData.characters && Array.isArray(designData.characters)) {
    const index = { characters: [] };
    for (const char of designData.characters) {
      const id = char.id || char.character_id || `char_${designData.characters.indexOf(char) + 1}`;
      writeJson(path.join(projectDir, 'characters', `${id}.json`), char, args.dryRun);
      index.characters.push({ id, name: char.name || id, role: char.role || 'unknown' });
      fileCount++;
    }
    writeJson(path.join(projectDir, 'characters', 'index.json'), index, args.dryRun);
    fileCount++;
  }

  // 4. relationships → characters/relationships.json
  if (designData.relationships) {
    writeJson(path.join(projectDir, 'characters', 'relationships.json'), designData.relationships, args.dryRun);
    fileCount++;
  }

  // 5. timeline → plot/timeline.json
  if (designData.timeline) {
    writeJson(path.join(projectDir, 'plot', 'timeline.json'), designData.timeline, args.dryRun);
    fileCount++;
  }

  // 6. main_arc → plot/main-arc.json
  if (designData.main_arc) {
    writeJson(path.join(projectDir, 'plot', 'main-arc.json'), designData.main_arc, args.dryRun);
    fileCount++;
  }

  // 7. sub_arcs → plot/sub-arcs/*.json
  if (designData.sub_arcs && Array.isArray(designData.sub_arcs)) {
    for (const arc of designData.sub_arcs) {
      const id = arc.id || arc.arc_id || `sub_arc_${designData.sub_arcs.indexOf(arc) + 1}`;
      writeJson(path.join(projectDir, 'plot', 'sub-arcs', `${id}.json`), arc, args.dryRun);
      fileCount++;
    }
  }

  // 8. foreshadowing → plot/foreshadowing.json
  if (designData.foreshadowing) {
    writeJson(path.join(projectDir, 'plot', 'foreshadowing.json'), designData.foreshadowing, args.dryRun);
    fileCount++;
  }

  // 9. hooks → plot/hooks.json
  if (designData.hooks) {
    writeJson(path.join(projectDir, 'plot', 'hooks.json'), designData.hooks, args.dryRun);
    fileCount++;
  }

  // 10. structure → plot/structure.json (if present)
  if (designData.structure) {
    writeJson(path.join(projectDir, 'plot', 'structure.json'), designData.structure, args.dryRun);
    fileCount++;
  }

  console.error(`\n${C.blue}[결과]${C.reset} ${fileCount}개 파일 ${args.dryRun ? '검증' : '생성'} 완료`);

  // stdout JSON
  console.log(JSON.stringify({
    success: true,
    dryRun: args.dryRun,
    filesProcessed: fileCount,
    inputFile: inputPath
  }, null, 2));
}

main();
