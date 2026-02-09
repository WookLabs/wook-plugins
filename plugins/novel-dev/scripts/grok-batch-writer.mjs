#!/usr/bin/env node
/**
 * Grok Batch Writer — 여러 챕터를 병렬 배치로 생성
 *
 * Usage:
 *   node scripts/grok-batch-writer.mjs --start 1 --end 15 --project ./novels/my-novel
 *   node scripts/grok-batch-writer.mjs --start 1 --end 15 --project ./novels/my-novel --parallel 3
 *
 * Options:
 *   --start N        시작 회차 (필수)
 *   --end N          끝 회차 (필수)
 *   --project PATH   소설 프로젝트 경로 (필수)
 *   --parallel N     병렬 배치 수 (기본: 3)
 *   --model MODEL    Grok 모델 (기본: grok-4-1-fast-reasoning)
 *   --max-tokens N   최대 토큰 (기본: 16000)
 *   --temperature N  Temperature (기본: 0.85)
 *   --help, -h       도움말
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ANSI 색상 코드
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
    start: null,
    end: null,
    project: null,
    parallel: 3,
    model: 'grok-4-1-fast-reasoning',
    maxTokens: 16000,
    temperature: 0.85
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--start' && argv[i + 1]) {
      result.start = parseInt(argv[++i], 10);
    } else if (arg === '--end' && argv[i + 1]) {
      result.end = parseInt(argv[++i], 10);
    } else if (arg === '--project' && argv[i + 1]) {
      result.project = argv[++i];
    } else if (arg === '--parallel' && argv[i + 1]) {
      result.parallel = parseInt(argv[++i], 10);
    } else if (arg === '--model' && argv[i + 1]) {
      result.model = argv[++i];
    } else if (arg === '--max-tokens' && argv[i + 1]) {
      result.maxTokens = parseInt(argv[++i], 10);
    } else if (arg === '--temperature' && argv[i + 1]) {
      result.temperature = parseFloat(argv[++i]);
    } else if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    }
  }

  return result;
}

function printHelp() {
  console.log(`
${colors.blue}Grok Batch Writer${colors.reset} — 여러 챕터를 병렬 배치로 생성

${colors.yellow}사용법:${colors.reset}
  node scripts/grok-batch-writer.mjs --start <N> --end <N> --project <PATH>

${colors.yellow}옵션:${colors.reset}
  --start N        시작 회차 (필수)
  --end N          끝 회차 (필수)
  --project PATH   소설 프로젝트 경로 (필수)
  --parallel N     병렬 배치 수 (기본: 3)
  --model MODEL    Grok 모델 (기본: grok-4-1-fast-reasoning)
  --max-tokens N   최대 토큰 (기본: 16000)
  --temperature N  Temperature (기본: 0.85)
  --help, -h       도움말

${colors.yellow}환경 설정:${colors.reset}
  ~/.env 파일에 XAI_API_KEY를 설정하세요:
  XAI_API_KEY=xai-xxxxxxxxxxxx

${colors.yellow}예시:${colors.reset}
  node scripts/grok-batch-writer.mjs --start 1 --end 15 --project ./novels/my-novel
  node scripts/grok-batch-writer.mjs --start 1 --end 50 --project ./novels/my-novel --parallel 5

${colors.yellow}참고:${colors.reset}
  - 배치 모드는 플롯 기반 깨끗한 컨텍스트로 초안을 생성합니다.
  - 이전 요약/직전 챕터 의존성 없이 병렬 실행됩니다.
  - 각 배치 내에서는 순차 실행 (rate limit 방지), 배치 간은 병렬입니다.
  - 생성 후 /consistency-check과 /revise를 실행하세요.
`);
}

// ─── API Key Loading (grok-writer.mjs 동일 패턴) ────────────────────────────

function loadEnvFile() {
  const homeDir = process.env.HOME || process.env.USERPROFILE;
  const envPath = path.join(homeDir, '.env');

  if (!fs.existsSync(envPath)) {
    return null;
  }

  const content = fs.readFileSync(envPath, 'utf-8');
  const env = {};

  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key) {
        let value = valueParts.join('=');
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        env[key.trim()] = value.trim();
      }
    }
  }

  return env;
}

function getApiKey() {
  if (process.env.XAI_API_KEY) {
    return process.env.XAI_API_KEY;
  }

  const envVars = loadEnvFile();
  if (envVars && envVars.XAI_API_KEY) {
    return envVars.XAI_API_KEY;
  }

  return null;
}

// ─── Grok API Call ───────────────────────────────────────────────────────────

async function callGrokAPI(apiKey, systemPrompt, userPrompt, model, maxTokens, temperature) {
  const messages = [];

  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  messages.push({ role: 'user', content: userPrompt });

  const response = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: maxTokens,
      temperature,
      stream: false
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Grok API Error (${response.status}): ${errorText}`);
  }

  return response.json();
}

// ─── Single Chapter Writer ───────────────────────────────────────────────────

async function writeChapter(chapter, projectDir, model, maxTokens, temperature, apiKey) {
  // 1. assemble-grok-prompt.mjs --batch 호출
  const assembleScript = path.join(__dirname, 'assemble-grok-prompt.mjs');
  const assembleCmd = `node "${assembleScript}" --batch --chapter ${chapter} --project "${projectDir}"`;

  let assembleResult;
  try {
    const stdout = execSync(assembleCmd, { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 });
    assembleResult = JSON.parse(stdout);
  } catch (err) {
    throw new Error(`[${chapter}화] 프롬프트 조립 실패: ${err.message}`);
  }

  // 2. Grok API 호출
  const apiResult = await callGrokAPI(
    apiKey,
    assembleResult.system,
    assembleResult.prompt,
    model,
    maxTokens,
    temperature
  );

  const content = apiResult.choices?.[0]?.message?.content || '';
  const usage = apiResult.usage || {};

  if (!content) {
    throw new Error(`[${chapter}화] Grok API가 빈 응답을 반환했습니다.`);
  }

  // 3. 챕터 파일 저장
  const outputPath = path.resolve(assembleResult.outputPath);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, content, 'utf-8');

  return {
    chapter,
    outputPath: assembleResult.outputPath,
    promptTokens: usage.prompt_tokens || 0,
    completionTokens: usage.completion_tokens || 0,
    contentLength: content.length,
    contextStats: assembleResult.contextStats
  };
}

// ─── Batch Runner ────────────────────────────────────────────────────────────

async function runBatches(chapters, parallel, projectDir, model, maxTokens, temperature, apiKey) {
  // 챕터를 N개 배치로 분할
  const batchSize = Math.ceil(chapters.length / parallel);
  const batches = [];
  for (let i = 0; i < chapters.length; i += batchSize) {
    batches.push(chapters.slice(i, i + batchSize));
  }

  console.error(`${colors.blue}[Batch Writer]${colors.reset} 총 ${chapters.length}화, ${batches.length}개 배치 (배치당 최대 ${batchSize}화)`);
  console.error(`  모델: ${model}`);
  console.error(`  최대 토큰: ${maxTokens}`);
  console.error(`  Temperature: ${temperature}`);
  console.error('');

  for (let idx = 0; idx < batches.length; idx++) {
    const batch = batches[idx];
    console.error(`${colors.cyan}[배치 ${idx + 1}/${batches.length}]${colors.reset} ${batch[0]}~${batch[batch.length - 1]}화`);
  }
  console.error('');

  const startTime = Date.now();

  // 각 배치를 병렬 실행 (배치 내에서는 순차)
  const batchPromises = batches.map((batch, batchIdx) =>
    (async () => {
      const results = [];
      for (const ch of batch) {
        const batchLabel = `${colors.cyan}[배치 ${batchIdx + 1}]${colors.reset}`;
        console.error(`${batchLabel} ${ch}화 생성 중...`);
        try {
          const result = await writeChapter(ch, projectDir, model, maxTokens, temperature, apiKey);
          console.error(`${batchLabel} ${colors.green}${ch}화 완료${colors.reset} (${result.completionTokens} tokens, ${result.contentLength}자)`);
          results.push({ ...result, success: true });
        } catch (err) {
          console.error(`${batchLabel} ${colors.red}${ch}화 실패${colors.reset}: ${err.message}`);
          results.push({ chapter: ch, success: false, error: err.message });
        }
      }
      return results;
    })()
  );

  const allResults = (await Promise.all(batchPromises)).flat();
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  return { results: allResults, elapsed };
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const args = parseArgs(process.argv.slice(2));

  // 필수 인자 확인
  if (args.start == null || isNaN(args.start)) {
    console.error(`${colors.red}[ERROR]${colors.reset} --start 옵션이 필요합니다.`);
    printHelp();
    process.exit(1);
  }

  if (args.end == null || isNaN(args.end)) {
    console.error(`${colors.red}[ERROR]${colors.reset} --end 옵션이 필요합니다.`);
    printHelp();
    process.exit(1);
  }

  if (!args.project) {
    console.error(`${colors.red}[ERROR]${colors.reset} --project 옵션이 필요합니다.`);
    printHelp();
    process.exit(1);
  }

  if (args.start > args.end) {
    console.error(`${colors.red}[ERROR]${colors.reset} --start(${args.start})가 --end(${args.end})보다 클 수 없습니다.`);
    process.exit(1);
  }

  if (args.parallel < 1) {
    console.error(`${colors.red}[ERROR]${colors.reset} --parallel은 1 이상이어야 합니다.`);
    process.exit(1);
  }

  const projectDir = path.resolve(args.project);
  if (!fs.existsSync(projectDir)) {
    console.error(`${colors.red}[ERROR]${colors.reset} 프로젝트 경로를 찾을 수 없습니다: ${projectDir}`);
    process.exit(1);
  }

  // API 키 확인
  const apiKey = getApiKey();
  if (!apiKey) {
    console.error(`${colors.red}[ERROR] XAI_API_KEY를 찾을 수 없습니다.${colors.reset}

다음 중 하나의 방법으로 API 키를 설정하세요:

1. ~/.env 파일에 추가:
   ${colors.yellow}XAI_API_KEY=xai-xxxxxxxxxxxx${colors.reset}

2. 환경 변수로 설정:
   ${colors.yellow}export XAI_API_KEY=xai-xxxxxxxxxxxx${colors.reset}

API 키는 https://console.x.ai 에서 발급받을 수 있습니다.
`);
    process.exit(1);
  }

  // 챕터 범위 생성
  const chapters = [];
  for (let i = args.start; i <= args.end; i++) {
    chapters.push(i);
  }

  // 플롯 파일 존재 확인
  const missingPlots = [];
  for (const ch of chapters) {
    const plotPath = path.join(projectDir, 'chapters', `chapter_${String(ch).padStart(3, '0')}.json`);
    if (!fs.existsSync(plotPath)) {
      missingPlots.push(ch);
    }
  }

  if (missingPlots.length > 0) {
    console.error(`${colors.yellow}[WARNING]${colors.reset} 플롯 파일이 없는 회차: ${missingPlots.join(', ')}`);
    console.error(`  /gen-plot으로 먼저 플롯을 생성하세요.`);
    if (missingPlots.length === chapters.length) {
      console.error(`${colors.red}[ERROR]${colors.reset} 모든 회차의 플롯 파일이 없습니다. 중단합니다.`);
      process.exit(1);
    }
    console.error(`  플롯이 있는 회차만 진행합니다.\n`);
  }

  // 배치 실행
  const { results, elapsed } = await runBatches(
    chapters, args.parallel, projectDir,
    args.model, args.maxTokens, args.temperature, apiKey
  );

  // ── 결과 요약 ──────────────────────────────────────────────────────────────

  const succeeded = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  const totalPromptTokens = succeeded.reduce((sum, r) => sum + r.promptTokens, 0);
  const totalCompletionTokens = succeeded.reduce((sum, r) => sum + r.completionTokens, 0);
  const totalChars = succeeded.reduce((sum, r) => sum + r.contentLength, 0);

  console.error('');
  console.error(`${'═'.repeat(60)}`);
  console.error(`${colors.blue}[Batch Writer 결과]${colors.reset}`);
  console.error(`${'─'.repeat(60)}`);
  console.error(`  소요 시간:     ${elapsed}초`);
  console.error(`  성공:          ${succeeded.length}화`);
  if (failed.length > 0) {
    console.error(`  ${colors.red}실패:          ${failed.length}화 (${failed.map(r => r.chapter + '화').join(', ')})${colors.reset}`);
  }
  console.error(`  총 입력 토큰:  ${totalPromptTokens.toLocaleString()}`);
  console.error(`  총 출력 토큰:  ${totalCompletionTokens.toLocaleString()}`);
  console.error(`  총 글자 수:    ${totalChars.toLocaleString()}자`);
  console.error(`${'═'.repeat(60)}`);

  // stdout으로 JSON 결과 출력 (Claude가 파싱할 수 있도록)
  const output = {
    success: failed.length === 0,
    elapsed: parseFloat(elapsed),
    summary: {
      total: chapters.length,
      succeeded: succeeded.length,
      failed: failed.length,
      totalPromptTokens,
      totalCompletionTokens,
      totalChars
    },
    chapters: results.map(r => r.success
      ? { chapter: r.chapter, success: true, outputPath: r.outputPath, promptTokens: r.promptTokens, completionTokens: r.completionTokens, contentLength: r.contentLength }
      : { chapter: r.chapter, success: false, error: r.error }
    )
  };

  console.log(JSON.stringify(output, null, 2));

  if (failed.length > 0) {
    process.exit(1);
  }
}

main();
