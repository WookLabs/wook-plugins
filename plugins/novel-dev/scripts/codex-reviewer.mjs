#!/usr/bin/env node
/**
 * Codex Reviewer — Codex CLI(GPT-5.4)로 챕터/플롯 리뷰
 *
 * /plot-review --codex, /act-review --codex 파이프라인 담당.
 * 여러 리뷰 에이전트(critic, consistency-verifier 등)의 관점을
 * 하나의 GPT-5.4 호출로 통합 수행.
 *
 * Usage:
 *   node scripts/codex-reviewer.mjs --mode plot --chapters 1-5 --project ./novels/my-novel
 *   node scripts/codex-reviewer.mjs --mode act --act 1 --project ./novels/my-novel
 *   node scripts/codex-reviewer.mjs --mode plot --chapters 3 --project ./novels/my-novel --dry-run
 *
 * Options:
 *   --mode MODE        리뷰 모드: plot | act (필수)
 *   --chapters RANGE   회차 범위 (plot 모드, 예: 1-5 또는 3)
 *   --act N            막 번호 (act 모드)
 *   --project PATH     소설 프로젝트 경로 (필수)
 *   --model MODEL      GPT 모델 (기본: gpt-5.4-xhigh)
 *   --dry-run          프롬프트 생성만, Codex 호출 안 함
 *   --help, -h         도움말
 */

import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PLUGIN_ROOT = path.resolve(__dirname, '..');

const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

// ─── CLI Argument Parsing ────────────────────────────────────────────────────

function parseArgs(argv) {
  const result = {
    mode: null,
    chapters: null,
    act: null,
    project: null,
    model: 'gpt-5.4-xhigh',
    dryRun: false
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--mode' && argv[i + 1]) result.mode = argv[++i];
    else if (arg === '--chapters' && argv[i + 1]) result.chapters = argv[++i];
    else if (arg === '--act' && argv[i + 1]) result.act = parseInt(argv[++i], 10);
    else if (arg === '--project' && argv[i + 1]) result.project = argv[++i];
    else if (arg === '--model' && argv[i + 1]) result.model = argv[++i];
    else if (arg === '--dry-run') result.dryRun = true;
    else if (arg === '--help' || arg === '-h') { printHelp(); process.exit(0); }
  }
  return result;
}

function printHelp() {
  console.log(`
${colors.cyan}codex-reviewer.mjs${colors.reset} — Codex CLI(GPT-5.4)로 리뷰

${colors.yellow}Usage:${colors.reset}
  node scripts/codex-reviewer.mjs --mode plot --chapters 1-5 --project PATH
  node scripts/codex-reviewer.mjs --mode act --act 1 --project PATH

${colors.yellow}Modes:${colors.reset}
  plot   플롯 파일 리뷰 (극적 구조, 연속성, 장르, 아크)
  act    막 원고 리뷰 (거시 평가 + 문제 회차 심층)
`);
}

function log(msg) { console.error(`${colors.blue}[codex-reviewer]${colors.reset} ${msg}`); }
function error(msg) { console.error(`${colors.red}[ERROR]${colors.reset} ${msg}`); }

function readIfExists(p) { try { return fs.readFileSync(p, 'utf-8'); } catch { return null; } }
function pad(n) { return String(n).padStart(3, '0'); }

// ─── Chapter Range Parsing ───────────────────────────────────────────────────

function parseChapterRange(rangeStr) {
  if (rangeStr.includes('-')) {
    const [start, end] = rangeStr.split('-').map(Number);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }
  return [parseInt(rangeStr, 10)];
}

function getActChapters(projectPath, actNum) {
  const structure = readIfExists(path.join(projectPath, 'plot/structure.json'));
  if (!structure) throw new Error('plot/structure.json not found');
  const data = JSON.parse(structure);
  const act = data.acts?.find(a => a.act_number === actNum || a.number === actNum);
  if (!act) throw new Error(`Act ${actNum} not found in structure.json`);
  const start = act.start_chapter || act.chapters?.[0] || 1;
  const end = act.end_chapter || act.chapters?.[act.chapters.length - 1] || start;
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

// ─── Prompt Assembly ─────────────────────────────────────────────────────────

function buildPlotReviewPrompt(projectPath, chapters) {
  let system = `# 역할: 소설 플롯 리뷰어 (4관점 통합)\n\n`;
  system += `당신은 4명의 전문 리뷰어의 관점을 모두 갖춘 통합 플롯 평가자입니다.\n\n`;
  system += `## 평가 관점\n`;
  system += `1. **critic** (극적 긴장, 전환점, 페이싱)\n`;
  system += `2. **consistency-verifier** (회차 간 연속성, 캐릭터 동선, 시간 정합성)\n`;
  system += `3. **genre-validator** (장르 비트, 클리프행어 밀도, 상업성)\n`;
  system += `4. **plot-architect** (아크 진행률, 복선 타이밍, 서브플롯 밸런스)\n\n`;
  system += `## 출력 형식\n`;
  system += `각 관점별 점수(0-100)와 구체적 피드백을 JSON으로 출력하세요.\n`;
  system += `Quality Gates: critic>=80, consistency>=85, genre>=85, plot-architect>=80\n`;

  let user = `# 리뷰 대상 플롯\n\n`;
  for (const ch of chapters) {
    const plot = readIfExists(path.join(projectPath, `chapters/chapter_${pad(ch)}.json`));
    if (plot) user += `## Chapter ${ch}\n\`\`\`json\n${plot}\n\`\`\`\n\n`;
  }

  // 메인 아크, 복선 참조
  const mainArc = readIfExists(path.join(projectPath, 'plot/main-arc.json'));
  if (mainArc) user += `## 메인 아크\n\`\`\`json\n${mainArc}\n\`\`\`\n\n`;
  const foreshadowing = readIfExists(path.join(projectPath, 'plot/foreshadowing.json'));
  if (foreshadowing) user += `## 복선\n\`\`\`json\n${foreshadowing}\n\`\`\`\n\n`;

  return { system, user };
}

function buildActReviewPrompt(projectPath, chapters) {
  let system = `# 역할: 소설 막 리뷰어 (6관점 통합)\n\n`;
  system += `당신은 6명의 전문 리뷰어의 관점을 모두 갖춘 통합 원고 평가자입니다.\n\n`;
  system += `## 평가 관점\n`;
  system += `1. **critic** (문학 품질, 서사적 깊이, 구조적 완성도)\n`;
  system += `2. **beta-reader** (독자 몰입도, 감정 반응, 이탈 위험 구간)\n`;
  system += `3. **consistency-verifier** (설정 일관성, 캐릭터 동선, 타임라인)\n`;
  system += `4. **engagement-optimizer** (긴장 곡선, 장면 리듬, 비트 타이밍)\n`;
  system += `5. **character-voice-analyzer** (말투 일관성, OOC 감지, 대화 자연스러움)\n`;
  system += `6. **quality-oracle** (show vs tell, 감각 묘사, 필터 단어, 구체성)\n\n`;
  system += `## 2단계 리뷰\n`;
  system += `1단계: 막 전체 거시 평가 (각 관점별 점수 + 피드백)\n`;
  system += `2단계: 문제 회차 식별 후 해당 회차만 심층 리뷰\n\n`;
  system += `## 출력 형식\n`;
  system += `각 관점별 점수(0-100), 거시 피드백, 문제 회차 목록, 심층 피드백을 JSON으로 출력.\n`;

  let user = `# 리뷰 대상 원고\n\n`;
  for (const ch of chapters) {
    const manuscript = readIfExists(path.join(projectPath, `chapters/chapter_${pad(ch)}.md`));
    if (manuscript) {
      // 토큰 절약을 위해 원고를 요약하지 않고 전문 전달
      user += `## Chapter ${ch}\n${manuscript}\n\n---\n\n`;
    }
  }

  return { system, user };
}

// ─── Codex CLI Execution ─────────────────────────────────────────────────────

function checkPrerequisites() {
  try {
    execFileSync('codex', ['--version'], { stdio: 'pipe' });
  } catch {
    error('codex CLI를 찾을 수 없습니다.');
    error('OpenAI Codex CLI를 설치하세요: npm install -g @openai/codex');
    process.exit(1);
  }
}

function runCodex(systemPrompt, userPrompt, model) {
  const tmpDir = path.join(process.env.TEMP || '/tmp', 'codex-reviewer');
  fs.mkdirSync(tmpDir, { recursive: true });

  const sysFile = path.join(tmpDir, 'system.md');
  const userFile = path.join(tmpDir, 'user.md');
  fs.writeFileSync(sysFile, systemPrompt, 'utf-8');
  fs.writeFileSync(userFile, userPrompt, 'utf-8');

  try {
    const args = [
      '--model', model,
      '--system-prompt-file', sysFile,
      '--prompt-file', userFile,
      '--no-interactive'
    ];
    log(`Codex CLI 실행: model=${model}`);

    return execFileSync('codex', args, {
      encoding: 'utf-8',
      maxBuffer: 1024 * 1024 * 10,
      timeout: 300000,
      env: { ...process.env }
    });
  } finally {
    try { fs.unlinkSync(sysFile); } catch { /* ignore */ }
    try { fs.unlinkSync(userFile); } catch { /* ignore */ }
    try { fs.rmdirSync(tmpDir); } catch { /* ignore */ }
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!args.mode) { error('--mode plot|act 필수'); process.exit(1); }
  if (!args.project) { error('--project PATH 필수'); process.exit(1); }

  let chapters;
  if (args.mode === 'plot') {
    if (!args.chapters) { error('--chapters RANGE 필수 (예: 1-5)'); process.exit(1); }
    chapters = parseChapterRange(args.chapters);
    log(`Plot review: chapters ${chapters.join(', ')}`);
  } else if (args.mode === 'act') {
    if (!args.act) { error('--act N 필수'); process.exit(1); }
    chapters = getActChapters(args.project, args.act);
    log(`Act ${args.act} review: chapters ${chapters.join(', ')}`);
  } else {
    error(`알 수 없는 모드: ${args.mode}. plot 또는 act를 사용하세요.`);
    process.exit(1);
  }

  // 프롬프트 조립
  const { system, user } = args.mode === 'plot'
    ? buildPlotReviewPrompt(args.project, chapters)
    : buildActReviewPrompt(args.project, chapters);

  log(`시스템 프롬프트: ${system.length}자, 유저 프롬프트: ${user.length}자`);

  if (args.dryRun) {
    log('--dry-run 모드.');
    console.log('=== SYSTEM ===\n' + system + '\n=== USER ===\n' + user);
    return;
  }

  checkPrerequisites();
  const result = runCodex(system, user, args.model);

  // 결과 저장
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const reviewDir = path.join(args.project, 'reviews');
  fs.mkdirSync(reviewDir, { recursive: true });

  const filename = args.mode === 'plot'
    ? `plot-review_ch${chapters[0]}-${chapters[chapters.length - 1]}_${timestamp}.json`
    : `act-review_act${args.act}_${timestamp}.json`;

  const outputPath = path.join(reviewDir, filename);
  fs.writeFileSync(outputPath, result, 'utf-8');
  log(`${colors.green}완료!${colors.reset} ${outputPath}`);
}

main().catch(e => { error(e.message); process.exit(1); });
