#!/usr/bin/env node
/**
 * Codex Writer — Codex CLI(GPT-5.4)로 챕터 집필
 *
 * write-act-2pass --codex 파이프라인의 Pass 1 담당:
 *   Pass 1: 이 스크립트가 Codex CLI로 GPT-5.4 집필
 *   Pass 2: adult-rewriter.mjs가 Grok으로 성인 장면 리라이트
 *
 * Usage:
 *   node scripts/codex-writer.mjs --chapter 1 --project ./novels/my-novel
 *   node scripts/codex-writer.mjs --chapter 5 --project ./novels/my-novel --model gpt-5.4
 *   node scripts/codex-writer.mjs --chapter 1 --project ./novels/my-novel --dry-run
 *
 * Options:
 *   --chapter N        회차 번호 (필수)
 *   --project PATH     소설 프로젝트 경로 (필수)
 *   --model MODEL      GPT 모델 (기본: gpt-5.4)
 *   --dry-run          프롬프트 생성만, Codex 호출 안 함
 *   --help, -h         도움말
 *
 * Environment:
 *   Codex CLI가 자체적으로 인증을 처리합니다 (별도 API 키 불필요)
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
  dim: '\x1b[2m',
  reset: '\x1b[0m'
};

// ─── CLI Argument Parsing ────────────────────────────────────────────────────

function parseArgs(argv) {
  const result = {
    chapter: null,
    project: null,
    model: 'gpt-5.4',
    mode: 'write',
    feedback: null,
    dryRun: false
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--chapter' && argv[i + 1]) {
      result.chapter = parseInt(argv[++i], 10);
    } else if (arg === '--project' && argv[i + 1]) {
      result.project = argv[++i];
    } else if (arg === '--model' && argv[i + 1]) {
      result.model = argv[++i];
    } else if (arg === '--mode' && argv[i + 1]) {
      result.mode = argv[++i];
    } else if (arg === '--feedback' && argv[i + 1]) {
      result.feedback = argv[++i];
    } else if (arg === '--dry-run') {
      result.dryRun = true;
    } else if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    }
  }

  return result;
}

function printHelp() {
  console.log(`
${colors.cyan}codex-writer.mjs${colors.reset} — Codex CLI(GPT-5.4)로 챕터 집필

${colors.yellow}Usage:${colors.reset}
  node scripts/codex-writer.mjs --chapter N --project PATH

${colors.yellow}Options:${colors.reset}
  --chapter N        회차 번호 (필수)
  --project PATH     소설 프로젝트 경로 (필수)
  --model MODEL      GPT 모델 (기본: gpt-5.4)
  --mode MODE        write(초고, 기본) | revise(퇴고)
  --feedback PATH    퇴고 시 리뷰 피드백 JSON 경로
  --dry-run          프롬프트 생성만, Codex 호출 안 함
  --help, -h         도움말

${colors.yellow}Environment:${colors.reset}
  Codex CLI가 자체적으로 인증 처리 (별도 API 키 불필요)
`);
}

function log(msg) { console.error(`${colors.blue}[codex-writer]${colors.reset} ${msg}`); }
function warn(msg) { console.error(`${colors.yellow}[WARN]${colors.reset} ${msg}`); }
function error(msg) { console.error(`${colors.red}[ERROR]${colors.reset} ${msg}`); }

// ─── File Loading ────────────────────────────────────────────────────────────

function readIfExists(filePath) {
  try { return fs.readFileSync(filePath, 'utf-8'); } catch { return null; }
}

function padChapter(n) {
  return String(n).padStart(3, '0');
}

function loadContext(projectPath, chapterNum) {
  const pad = padChapter(chapterNum);

  const chapterPlot = readIfExists(path.join(projectPath, `chapters/chapter_${pad}.json`));
  if (!chapterPlot) throw new Error(`chapters/chapter_${pad}.json not found in ${projectPath}`);

  const styleGuide = readIfExists(path.join(projectPath, 'meta/style-guide.json'));
  const project = readIfExists(path.join(projectPath, 'meta/project.json'));

  // 이전 요약 로드 (최대 3개)
  const summaries = [];
  for (let i = Math.max(1, chapterNum - 3); i < chapterNum; i++) {
    const s = readIfExists(path.join(projectPath, `context/summaries/chapter_${padChapter(i)}_summary.md`));
    if (s) summaries.push(s);
  }

  // 캐릭터 파일 로드 (플롯에 등장하는 캐릭터)
  const plotData = JSON.parse(chapterPlot);
  const characterIds = plotData.meta?.characters || [];
  const characters = [];
  for (const id of characterIds) {
    const agentMd = readIfExists(path.join(PLUGIN_ROOT, `agents/characters/${id}.md`));
    if (agentMd) {
      characters.push({ id, agentContent: agentMd });
    } else {
      const charJson = readIfExists(path.join(projectPath, `characters/${id}.json`));
      if (charJson) characters.push({ id, jsonContent: charJson });
    }
  }

  return { chapterPlot, styleGuide, project, summaries, characters, plotData };
}

// ─── System Prompt Assembly ──────────────────────────────────────────────────

function buildSystemPrompt(ctx) {
  const novelistMd = readIfExists(path.join(PLUGIN_ROOT, 'agents/novelist.md'));
  if (!novelistMd) throw new Error('agents/novelist.md not found');

  let prompt = `# 역할: 한국어 소설 집필 AI\n\n`;
  prompt += `아래 규칙을 모두 준수하여 챕터를 집필하세요.\n\n`;

  // novelist.md의 핵심 규칙 (Critical_Constraints 섹션)
  const constraintsMatch = novelistMd.match(/<Critical_Constraints>([\s\S]*?)<\/Critical_Constraints>/);
  if (constraintsMatch) {
    prompt += `## 집필 규칙\n\n${constraintsMatch[1].trim()}\n\n`;
  }

  // 스타일 가이드
  if (ctx.styleGuide) {
    prompt += `## 스타일 가이드\n\n\`\`\`json\n${ctx.styleGuide}\n\`\`\`\n\n`;
  }

  // 캐릭터 보이스 프로필
  if (ctx.characters.length > 0) {
    prompt += `## 등장인물 보이스 프로필\n\n`;
    for (const char of ctx.characters) {
      if (char.agentContent) {
        prompt += `### ${char.id}\n${char.agentContent}\n\n`;
      } else if (char.jsonContent) {
        prompt += `### ${char.id}\n\`\`\`json\n${char.jsonContent}\n\`\`\`\n\n`;
      }
    }
  }

  // ADULT 마커 지시
  prompt += `## ADULT 마커 규칙\n\n`;
  prompt += `성인 장면(정사, 신체 접촉, 관능적 묘사)을 작성할 때는\n`;
  prompt += `<!-- ADULT_N_START --> 와 <!-- ADULT_N_END --> 마커로 감싸세요. (N은 1부터 순번)\n`;
  prompt += `마커 안에서는 행위, 신체 부위, 감정 반응을 구체적으로 서술하세요.\n`;
  prompt += `마커 밖의 일반 장면은 평소대로 작성하세요.\n\n`;

  return prompt;
}

function buildUserPrompt(ctx, mode, feedbackContent) {
  if (mode === 'revise') {
    return buildRevisePrompt(ctx, feedbackContent);
  }

  let prompt = `# 집필 대상\n\n`;
  prompt += `## 플롯\n\`\`\`json\n${ctx.chapterPlot}\n\`\`\`\n\n`;

  if (ctx.summaries.length > 0) {
    prompt += `## 이전 회차 요약\n\n`;
    ctx.summaries.forEach((s, i) => {
      prompt += `### 이전 ${ctx.summaries.length - i}화 전\n${s}\n\n`;
    });
  }

  prompt += `위 플롯에 따라 완전한 챕터를 집필하세요. 목표 분량: 5000~8000자.\n`;
  prompt += `출력은 마크다운 형식으로, 본문만 출력하세요 (메타 코멘트 없음).\n`;

  return prompt;
}

function buildRevisePrompt(ctx, feedbackContent) {
  const pad3 = padChapter(ctx.plotData?.meta?.chapter || 0);
  const manuscript = readIfExists(path.join(ctx._projectPath, `chapters/ch${pad3}.md`))
    || readIfExists(path.join(ctx._projectPath, `chapters/chapter_${pad3}.md`));

  let prompt = `# 퇴고 대상\n\n`;
  prompt += `## 원고\n${manuscript || '(원고 없음)'}\n\n`;
  prompt += `## 플롯\n\`\`\`json\n${ctx.chapterPlot}\n\`\`\`\n\n`;

  if (feedbackContent) {
    prompt += `## 리뷰 피드백\n\`\`\`json\n${feedbackContent}\n\`\`\`\n\n`;
  }

  prompt += `위 피드백을 반영하여 원고를 퇴고하세요.\n`;
  prompt += `- 피드백에서 지적한 문제를 우선 수정\n`;
  prompt += `- 캐릭터 보이스 일관성 유지\n`;
  prompt += `- 기존 분량 유지 (±10%)\n`;
  prompt += `- ADULT 마커가 있으면 그대로 유지\n`;
  prompt += `출력은 마크다운 형식으로, 수정된 본문 전체를 출력하세요.\n`;

  return prompt;
}

// ─── Codex CLI Execution ─────────────────────────────────────────────────────

function checkPrerequisites() {
  try {
    execFileSync('codex', ['--version'], { stdio: 'pipe', shell: true });
  } catch {
    error('codex CLI를 찾을 수 없습니다.');
    error('OpenAI Codex CLI를 설치하세요: npm install -g @openai/codex');
    process.exit(1);
  }
}

function runCodex(systemPrompt, userPrompt, model) {
  // 임시 파일로 프롬프트 전달 (CLI 인자 길이 제한 우회)
  const tmpDir = path.join(process.env.TEMP || '/tmp', 'codex-writer');
  fs.mkdirSync(tmpDir, { recursive: true });

  const promptFile = path.join(tmpDir, 'prompt.md');
  const outputFile = path.join(tmpDir, 'output.md');
  const combinedPrompt = `# System Instructions\n\n${systemPrompt}\n\n# Task\n\n${userPrompt}`;
  fs.writeFileSync(promptFile, combinedPrompt, 'utf-8');

  try {
    // codex exec 모드: 파일에서 읽어 stdin으로 파이프 (Windows ENAMETOOLONG 우회)
    const promptPath = promptFile.replace(/\\/g, '/');
    const outputPath = outputFile.replace(/\\/g, '/');
    const cmd = `cat "${promptPath}" | codex exec --model ${model} -o "${outputPath}" -`;
    log(`Codex CLI 실행: model=${model}`);

    execFileSync('bash', ['-c', cmd], {
      encoding: 'utf-8',
      maxBuffer: 1024 * 1024 * 10, // 10MB
      timeout: 600000, // 10분
      env: { ...process.env }
    });

    if (fs.existsSync(outputFile)) {
      return fs.readFileSync(outputFile, 'utf-8');
    }
    return '';
  } finally {
    try { fs.unlinkSync(promptFile); } catch { /* ignore */ }
    try { fs.unlinkSync(outputFile); } catch { /* ignore */ }
    try { fs.rmdirSync(tmpDir); } catch { /* ignore */ }
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!args.chapter) { error('--chapter N 필수'); process.exit(1); }
  if (!args.project) { error('--project PATH 필수'); process.exit(1); }

  const modeLabel = args.mode === 'revise' ? '퇴고' : '집필';
  log(`Chapter ${args.chapter} ${modeLabel} 시작 (model: ${args.model}, mode: ${args.mode})`);

  // 컨텍스트 로드
  const ctx = loadContext(args.project, args.chapter);
  ctx._projectPath = args.project; // revise 모드에서 원고 로드용
  log(`플롯 로드 완료. 등장인물: ${ctx.characters.map(c => c.id).join(', ') || 'none'}`);

  // 피드백 로드 (revise 모드)
  let feedbackContent = null;
  if (args.mode === 'revise' && args.feedback) {
    feedbackContent = readIfExists(args.feedback);
    if (feedbackContent) log(`피드백 로드 완료: ${args.feedback}`);
    else warn(`피드백 파일을 찾을 수 없습니다: ${args.feedback}`);
  }

  // 프롬프트 조립
  const systemPrompt = buildSystemPrompt(ctx);
  const userPrompt = buildUserPrompt(ctx, args.mode, feedbackContent);
  log(`시스템 프롬프트: ${systemPrompt.length}자, 유저 프롬프트: ${userPrompt.length}자`);

  if (args.dryRun) {
    log('--dry-run 모드. Codex 호출 건너뜀.');
    console.log('=== SYSTEM PROMPT ===\n');
    console.log(systemPrompt);
    console.log('\n=== USER PROMPT ===\n');
    console.log(userPrompt);
    return;
  }

  // 사전 조건 확인
  checkPrerequisites();

  // Codex CLI 실행
  const result = runCodex(systemPrompt, userPrompt, args.model);

  // 결과 저장
  const pad = padChapter(args.chapter);
  // ch${pad}.md 우선, 없으면 chapter_${pad}.md (프로젝트 파일명 호환)
  const chPath = path.join(args.project, `chapters/ch${pad}.md`);
  const chapterPath = path.join(args.project, `chapters/chapter_${pad}.md`);
  const outputPath = fs.existsSync(chPath) ? chPath : (fs.existsSync(chapterPath) ? chapterPath : chPath);

  // 백업
  if (fs.existsSync(outputPath)) {
    const bakPath = outputPath + '.bak';
    fs.copyFileSync(outputPath, bakPath);
    log(`기존 파일 백업: ${bakPath}`);
  }

  fs.writeFileSync(outputPath, result, 'utf-8');
  log(`${colors.green}완료!${colors.reset} ${outputPath} (${result.length}자)`);

  // ADULT 마커 감지 보고
  const adultCount = (result.match(/<!-- ADULT_\d+_START -->/g) || []).length;
  if (adultCount > 0) {
    log(`ADULT 마커 ${adultCount}개 감지 → Pass 2(Grok)에서 리라이트됩니다.`);
  } else {
    log('ADULT 마커 없음 → Pass 2 건너뜁니다.');
  }
}

main().catch(e => {
  error(e.message);
  process.exit(1);
});
