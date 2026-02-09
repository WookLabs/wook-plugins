#!/usr/bin/env node
/**
 * Grok API Writer - xAI Grok을 사용한 소설 생성
 *
 * Usage:
 *   node scripts/grok-writer.mjs --prompt "소설 프롬프트" [options]
 *
 * Options:
 *   --prompt      생성 프롬프트 (필수, --prompt-file과 택1)
 *   --prompt-file 프롬프트를 파일에서 읽기 (--prompt 대신 사용)
 *   --system      시스템 프롬프트 (선택)
 *   --system-file 시스템 프롬프트를 파일에서 읽기 (--system 대신 사용)
 *   --model       모델 선택 (기본: grok-4-1-fast-reasoning)
 *   --max-tokens  최대 토큰 (기본: 8192)
 *   --output      출력 파일 경로 (선택, 없으면 stdout)
 */

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
  reset: '\x1b[0m'
};

/**
 * ~/.env 파일에서 환경 변수 읽기
 */
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
        // 따옴표 제거
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

/**
 * XAI_API_KEY 가져오기
 */
function getApiKey() {
  // 1. 환경 변수에서 먼저 확인
  if (process.env.XAI_API_KEY) {
    return process.env.XAI_API_KEY;
  }

  // 2. ~/.env 파일에서 확인
  const envVars = loadEnvFile();
  if (envVars && envVars.XAI_API_KEY) {
    return envVars.XAI_API_KEY;
  }

  return null;
}

/**
 * Grok API 호출
 */
async function callGrokAPI(options) {
  const {
    apiKey,
    prompt,
    systemPrompt,
    model = 'grok-4-1-fast-reasoning',
    maxTokens = 8192,
    temperature = 0.8
  } = options;

  const messages = [];

  if (systemPrompt) {
    messages.push({
      role: 'system',
      content: systemPrompt
    });
  }

  messages.push({
    role: 'user',
    content: prompt
  });

  const requestBody = {
    model,
    messages,
    max_tokens: maxTokens,
    temperature,
    stream: false
  };

  const response = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Grok API Error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return data;
}

/**
 * CLI 인자 파싱
 */
function parseArgs(args) {
  const result = {
    prompt: null,
    system: null,
    model: 'grok-4-1-fast-reasoning',
    maxTokens: 8192,
    output: null,
    temperature: 0.8
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--prompt' && args[i + 1]) {
      result.prompt = args[++i];
    } else if (arg === '--prompt-file' && args[i + 1]) {
      result.prompt = fs.readFileSync(args[++i], 'utf-8');
    } else if (arg === '--system' && args[i + 1]) {
      result.system = args[++i];
    } else if (arg === '--system-file' && args[i + 1]) {
      result.system = fs.readFileSync(args[++i], 'utf-8');
    } else if (arg === '--model' && args[i + 1]) {
      result.model = args[++i];
    } else if (arg === '--max-tokens' && args[i + 1]) {
      result.maxTokens = parseInt(args[++i], 10);
    } else if (arg === '--output' && args[i + 1]) {
      result.output = args[++i];
    } else if (arg === '--temperature' && args[i + 1]) {
      result.temperature = parseFloat(args[++i]);
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
${colors.blue}Grok Writer - xAI Grok API를 사용한 소설 생성${colors.reset}

${colors.yellow}사용법:${colors.reset}
  node scripts/grok-writer.mjs --prompt "프롬프트" [options]

${colors.yellow}옵션:${colors.reset}
  --prompt       생성 프롬프트 (필수, --prompt-file과 택1)
  --prompt-file  프롬프트를 파일에서 읽기 (--prompt 대신 사용)
  --system       시스템 프롬프트 (선택)
  --system-file  시스템 프롬프트를 파일에서 읽기 (--system 대신 사용)
  --model        모델 (기본: grok-4-1-fast-reasoning)
  --max-tokens   최대 토큰 (기본: 8192)
  --temperature  창의성 (기본: 0.8)
  --output       출력 파일 경로 (선택)
  --help, -h     도움말

${colors.yellow}환경 설정:${colors.reset}
  ~/.env 파일에 XAI_API_KEY를 설정하세요:
  XAI_API_KEY=xai-xxxxxxxxxxxx

${colors.yellow}예시:${colors.reset}
  node scripts/grok-writer.mjs --prompt "로맨스 소설의 첫 장면을 써줘"
  node scripts/grok-writer.mjs --prompt "다음 장면" --system "당신은 한국어 로맨스 소설 작가입니다"
`);
      process.exit(0);
    }
  }

  return result;
}

/**
 * 메인 함수
 */
async function main() {
  const args = parseArgs(process.argv.slice(2));

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

  // 프롬프트 확인
  if (!args.prompt) {
    console.error(`${colors.red}[ERROR] --prompt 옵션이 필요합니다.${colors.reset}

사용법: node scripts/grok-writer.mjs --prompt "프롬프트"
도움말: node scripts/grok-writer.mjs --help
`);
    process.exit(1);
  }

  console.error(`${colors.blue}[Grok Writer]${colors.reset} API 호출 중...`);
  console.error(`  모델: ${args.model}`);
  console.error(`  최대 토큰: ${args.maxTokens}`);
  console.error(`  Temperature: ${args.temperature}`);

  try {
    const result = await callGrokAPI({
      apiKey,
      prompt: args.prompt,
      systemPrompt: args.system,
      model: args.model,
      maxTokens: args.maxTokens,
      temperature: args.temperature
    });

    const content = result.choices?.[0]?.message?.content || '';
    const usage = result.usage || {};

    console.error(`${colors.green}[SUCCESS]${colors.reset} 생성 완료`);
    console.error(`  입력 토큰: ${usage.prompt_tokens || 'N/A'}`);
    console.error(`  출력 토큰: ${usage.completion_tokens || 'N/A'}`);

    // 출력
    if (args.output) {
      const outputDir = path.dirname(args.output);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      fs.writeFileSync(args.output, content, 'utf-8');
      console.error(`  저장됨: ${args.output}`);
    } else {
      // stdout으로 출력 (Claude가 읽을 수 있도록)
      console.log(content);
    }

    // JSON 결과도 stderr로 출력 (디버깅용)
    console.error(`\n${colors.blue}[Response Metadata]${colors.reset}`);
    console.error(JSON.stringify({
      model: result.model,
      usage: result.usage,
      finish_reason: result.choices?.[0]?.finish_reason
    }, null, 2));

  } catch (error) {
    console.error(`${colors.red}[ERROR]${colors.reset} ${error.message}`);
    process.exit(1);
  }
}

// 실행
main();
