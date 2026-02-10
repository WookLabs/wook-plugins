#!/usr/bin/env node
/**
 * Adult Rewriter — Grok API로 ADULT 마커 구간만 성인소설 수준으로 리라이트
 *
 * 2-Pass 파이프라인의 Pass 2 담당:
 *   Pass 1: Claude가 전체 챕터 집필 + ADULT 마커 삽입
 *   Pass 2: 이 스크립트가 마커 구간을 Grok으로 리라이트
 *
 * Usage:
 *   node scripts/adult-rewriter.mjs --input chapter.md --project ./novels/my-novel
 *   node scripts/adult-rewriter.mjs --input chapter.md --project ./novels/my-novel --output chapter.md
 *   node scripts/adult-rewriter.mjs --input chapter.md --project ./novels/my-novel --dry-run
 *
 * Options:
 *   --input FILE       입력 챕터 파일 (필수)
 *   --project PATH     소설 프로젝트 경로 (필수, adult_writing 스타일 로드용)
 *   --output FILE      출력 파일 (선택, 없으면 stdout)
 *   --model MODEL      Grok 모델 (기본: grok-4-1-fast-reasoning)
 *   --max-tokens N     최대 토큰 (기본: 30000)
 *   --temperature N    Temperature (기본: 0.85)
 *   --dry-run          마커 감지만, API 호출 안 함
 *   --max-retries N    JSON 파싱 실패 시 재시도 횟수 (기본: 2)
 *   --help, -h         도움말
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
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
  reset: '\x1b[0m'
};

// ─── CLI Argument Parsing ────────────────────────────────────────────────────

function parseArgs(argv) {
  const result = {
    input: null,
    project: null,
    output: null,
    model: 'grok-4-1-fast-reasoning',
    maxTokens: 30000,
    temperature: 0.85,
    dryRun: false,
    maxRetries: 2
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--input' && argv[i + 1]) {
      result.input = argv[++i];
    } else if (arg === '--project' && argv[i + 1]) {
      result.project = argv[++i];
    } else if (arg === '--output' && argv[i + 1]) {
      result.output = argv[++i];
    } else if (arg === '--model' && argv[i + 1]) {
      result.model = argv[++i];
    } else if (arg === '--max-tokens' && argv[i + 1]) {
      result.maxTokens = parseInt(argv[++i], 10);
    } else if (arg === '--temperature' && argv[i + 1]) {
      result.temperature = parseFloat(argv[++i]);
    } else if (arg === '--dry-run') {
      result.dryRun = true;
    } else if (arg === '--max-retries' && argv[i + 1]) {
      result.maxRetries = parseInt(argv[++i], 10);
    } else if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    }
  }

  return result;
}

function printHelp() {
  console.log(`
${colors.blue}Adult Rewriter${colors.reset} — Grok API로 ADULT 마커 구간을 성인소설 수준으로 리라이트

${colors.yellow}사용법:${colors.reset}
  node scripts/adult-rewriter.mjs --input <FILE> --project <PATH>

${colors.yellow}옵션:${colors.reset}
  --input FILE       입력 챕터 파일 (필수)
  --project PATH     소설 프로젝트 경로 (필수)
  --output FILE      출력 파일 (선택, 없으면 stdout)
  --model MODEL      Grok 모델 (기본: grok-4-1-fast-reasoning)
  --max-tokens N     최대 토큰 (기본: 30000)
  --temperature N    Temperature (기본: 0.85)
  --dry-run          마커 감지만, API 호출 안 함
  --max-retries N    JSON 파싱 실패 시 재시도 횟수 (기본: 2)
  --help, -h         도움말

${colors.yellow}환경 설정:${colors.reset}
  ~/.env 파일에 XAI_API_KEY를 설정하세요:
  XAI_API_KEY=xai-xxxxxxxxxxxx

${colors.yellow}마커 형식:${colors.reset}
  <!-- ADULT_1_START -->
  성인 장면 텍스트...
  <!-- ADULT_1_END -->

${colors.yellow}예시:${colors.reset}
  node scripts/adult-rewriter.mjs --input chapters/chapter_001.md --project ./novels/my-novel --dry-run
  node scripts/adult-rewriter.mjs --input chapters/chapter_001.md --project ./novels/my-novel --output chapters/chapter_001.md
`);
}

// ─── API Key Loading ─────────────────────────────────────────────────────────

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

// ─── Marker Parsing ──────────────────────────────────────────────────────────

/**
 * ADULT 마커를 파싱하여 구간 목록을 반환
 * @returns {{ id: string, content: string, startIdx: number, endIdx: number }[]}
 */
function parseMarkers(text) {
  const markers = [];
  const regex = /<!-- ADULT_(\d+)_START -->[\r\n]*([\s\S]*?)<!-- ADULT_\1_END -->/g;

  let match;
  while ((match = regex.exec(text)) !== null) {
    markers.push({
      id: match[1],
      content: match[2].trim(),
      fullMatch: match[0],
      startIdx: match.index,
      endIdx: match.index + match[0].length
    });
  }

  return markers;
}

/**
 * 마커 구간을 리라이트된 텍스트로 교체하고 마커 태그 제거
 */
function replaceMarkers(originalText, markers, rewrites) {
  let result = originalText;

  // 뒤에서부터 교체 (인덱스 밀림 방지)
  for (let i = markers.length - 1; i >= 0; i--) {
    const marker = markers[i];
    const rewrite = rewrites[marker.id];

    if (rewrite) {
      result = result.slice(0, marker.startIdx) + rewrite + result.slice(marker.endIdx);
    } else {
      // 리라이트 없으면 마커만 제거하고 원본 내용 유지
      result = result.slice(0, marker.startIdx) + marker.content + result.slice(marker.endIdx);
    }
  }

  return result;
}

// ─── Style Guide Loading ─────────────────────────────────────────────────────

function loadAdultWritingStyle(projectDir) {
  const stylePath = path.join(projectDir, 'meta', 'style-guide.json');

  try {
    const data = JSON.parse(fs.readFileSync(stylePath, 'utf-8'));
    return data.adult_writing || null;
  } catch {
    return null;
  }
}

function loadFullStyleGuide(projectDir) {
  const stylePath = path.join(projectDir, 'meta', 'style-guide.json');

  try {
    return JSON.parse(fs.readFileSync(stylePath, 'utf-8'));
  } catch {
    return null;
  }
}

// ─── System Prompt Builder ───────────────────────────────────────────────────

function buildSystemPrompt(styleGuide, adultWriting) {
  const lines = [];

  lines.push('당신은 한국어 성인 소설 리라이터입니다.');
  lines.push('');

  // 문체 가이드 (톤 참조용)
  if (styleGuide) {
    if (styleGuide.narrative_voice) {
      lines.push(`- 시점: ${styleGuide.narrative_voice}`);
    }
    if (styleGuide.tense) {
      lines.push(`- 시제: ${styleGuide.tense}`);
    }
    if (styleGuide.tone) {
      const toneStr = Array.isArray(styleGuide.tone)
        ? styleGuide.tone.join(', ')
        : String(styleGuide.tone);
      if (toneStr) {
        lines.push(`- 분위기: ${toneStr}`);
      }
    }
    if (styleGuide.sentence_rhythm) {
      const rhythmMap = { short: '짧은 문장 위주', long: '긴 문장 위주', mixed: '문장 길이 변화' };
      lines.push(`- 문장 리듬: ${rhythmMap[styleGuide.sentence_rhythm] || styleGuide.sentence_rhythm}`);
    }
    lines.push('');
  }

  // 성인 장면 스타일
  if (adultWriting) {
    lines.push('## 성인 장면 스타일');

    const explMap = {
      low: '암시적으로 표현하세요.',
      medium: '은유적 표현을 사용하세요.',
      high: '구체적이고 감각적으로 묘사하세요. 신체 반응과 행위를 생생하게.'
    };
    if (adultWriting.explicitness) {
      lines.push(`- 수위: ${explMap[adultWriting.explicitness] || adultWriting.explicitness}`);
    }
    if (adultWriting.emotional_focus) {
      lines.push('- 감정: 신체적 행위만이 아닌, 캐릭터의 심리와 감정 변화를 함께 묘사하세요.');
    }
    if (adultWriting.sensory_detail) {
      const sensMap = {
        visual: '시각적 묘사 중심.',
        tactile: '촉각적 묘사 중심.',
        emotional: '감정적 묘사 중심.',
        all: '시각, 촉각, 청각, 후각 등 모든 감각을 활용한 입체적 묘사.'
      };
      lines.push(`- 감각: ${sensMap[adultWriting.sensory_detail] || adultWriting.sensory_detail}`);
    }
    if (adultWriting.pacing) {
      const paceMap = {
        quick: '빠르게 전개. 짧은 문장, 호흡 가빠지는 리듬.',
        gradual: '점진적 전개. 분위기를 천천히 고조시키며 감정선을 따라가세요.',
        'slow-burn': '느리게 타오르는 전개. 긴장과 기대감을 최대한 끌어올린 뒤 해소.'
      };
      lines.push(`- 페이싱: ${paceMap[adultWriting.pacing] || adultWriting.pacing}`);
    }
    if (adultWriting.vocabulary_level) {
      const vocabMap = {
        crude: '직설적인 어휘를 사용하세요.',
        moderate: '적당한 수준의 성적 어휘를 사용하세요.',
        literary: '문학적이고 우아한 표현을 사용하세요.'
      };
      lines.push(`- 어휘: ${vocabMap[adultWriting.vocabulary_level] || adultWriting.vocabulary_level}`);
    }
    lines.push('');
  }

  // 작업 지시
  lines.push('## 작업 지시');
  lines.push('- 입력으로 소설 챕터 전체가 주어집니다.');
  lines.push('- <!-- ADULT_N_START --> 와 <!-- ADULT_N_END --> 사이의 장면만 성인소설 수준으로 리라이트하세요.');
  lines.push('- 마커 밖의 텍스트는 절대 수정하지 마세요.');
  lines.push('- 주변 문장의 톤과 문체를 유지하세요.');
  lines.push('- 리라이트 시 원본의 서사 흐름과 감정선을 보존하되, 성인 묘사를 강화하세요.');
  lines.push('- 결과를 반드시 아래 JSON 형식으로만 출력하세요. JSON 외의 텍스트는 포함하지 마세요.');
  lines.push('');
  lines.push('## 출력 형식');
  lines.push('```json');
  lines.push('{');
  lines.push('  "1": "리라이트된 장면 1 텍스트...",');
  lines.push('  "2": "리라이트된 장면 2 텍스트..."');
  lines.push('}');
  lines.push('```');

  return lines.join('\n');
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

/**
 * Grok 응답에서 JSON을 추출하고 파싱
 */
function parseGrokResponse(content) {
  // JSON 블록 추출 (```json ... ``` 또는 순수 JSON)
  const jsonBlockMatch = content.match(/```(?:json)?\s*\n?([\s\S]*?)```/);
  const jsonStr = jsonBlockMatch ? jsonBlockMatch[1].trim() : content.trim();

  try {
    return JSON.parse(jsonStr);
  } catch (err) {
    const preview = content.slice(0, 500);
    throw new Error(
      `JSON 파싱 실패: ${err.message}\n` +
      `응답 미리보기 (처음 500자):\n${preview}`
    );
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const args = parseArgs(process.argv.slice(2));

  // 필수 인자 확인
  if (!args.input) {
    console.error(`${colors.red}[ERROR]${colors.reset} --input 옵션이 필요합니다.`);
    printHelp();
    process.exit(1);
  }

  if (!args.project) {
    console.error(`${colors.red}[ERROR]${colors.reset} --project 옵션이 필요합니다.`);
    printHelp();
    process.exit(1);
  }

  const inputPath = path.resolve(args.input);
  const projectDir = path.resolve(args.project);

  if (!fs.existsSync(inputPath)) {
    console.error(`${colors.red}[ERROR]${colors.reset} 입력 파일을 찾을 수 없습니다: ${inputPath}`);
    process.exit(1);
  }

  if (!fs.existsSync(projectDir)) {
    console.error(`${colors.red}[ERROR]${colors.reset} 프로젝트 경로를 찾을 수 없습니다: ${projectDir}`);
    process.exit(1);
  }

  // 챕터 읽기
  const originalText = fs.readFileSync(inputPath, 'utf-8');

  // 마커 파싱
  const markers = parseMarkers(originalText);

  if (markers.length === 0) {
    console.error(`${colors.yellow}[INFO]${colors.reset} ADULT 마커가 없습니다. 리라이트 대상 없음.`);

    // stdout JSON 출력
    console.log(JSON.stringify({
      success: true,
      markersFound: 0,
      message: '리라이트 대상 없음'
    }, null, 2));
    return;
  }

  console.error(`${colors.blue}[Adult Rewriter]${colors.reset} ADULT 마커 ${markers.length}개 감지:`);
  for (const m of markers) {
    console.error(`  마커 #${m.id}: ${m.content.length}자 (원본)`);
  }

  // dry-run 모드
  if (args.dryRun) {
    console.error(`${colors.yellow}[DRY-RUN]${colors.reset} API 호출 없이 마커 감지만 수행.`);
    console.log(JSON.stringify({
      success: true,
      dryRun: true,
      markersFound: markers.length,
      markers: markers.map(m => ({
        id: m.id,
        contentLength: m.content.length,
        preview: m.content.slice(0, 100) + (m.content.length > 100 ? '...' : '')
      }))
    }, null, 2));
    return;
  }

  // API 키 확인
  const apiKey = getApiKey();
  if (!apiKey) {
    console.error(`${colors.red}[ERROR] XAI_API_KEY를 찾을 수 없습니다.${colors.reset}

~/.env 파일에 추가하세요:
${colors.yellow}XAI_API_KEY=xai-xxxxxxxxxxxx${colors.reset}

API 키는 https://console.x.ai 에서 발급받을 수 있습니다.
`);
    process.exit(1);
  }

  // 스타일가이드 로드
  const styleGuide = loadFullStyleGuide(projectDir);
  const adultWriting = loadAdultWritingStyle(projectDir);

  if (!adultWriting) {
    console.error(`${colors.yellow}[WARNING]${colors.reset} adult_writing 스타일이 없습니다. 기본값으로 진행합니다.`);
  }

  // 시스템 프롬프트 빌드
  const systemPrompt = buildSystemPrompt(styleGuide, adultWriting);

  // 백업 생성
  const backupPath = inputPath + '.bak';
  fs.writeFileSync(backupPath, originalText, 'utf-8');
  console.error(`${colors.dim}[BACKUP]${colors.reset} ${backupPath}`);

  // Grok API 호출 (재시도 포함)
  let rewrites = null;

  for (let attempt = 1; attempt <= args.maxRetries + 1; attempt++) {
    console.error(`${colors.blue}[Grok API]${colors.reset} 호출 중... (시도 ${attempt}/${args.maxRetries + 1})`);
    console.error(`  모델: ${args.model}`);
    console.error(`  최대 토큰: ${args.maxTokens}`);

    try {
      const apiResult = await callGrokAPI(
        apiKey,
        systemPrompt,
        originalText,
        args.model,
        args.maxTokens,
        args.temperature
      );

      const content = apiResult.choices?.[0]?.message?.content || '';
      const usage = apiResult.usage || {};

      console.error(`${colors.green}[API 응답]${colors.reset} ${usage.completion_tokens || 'N/A'} tokens`);

      // JSON 파싱
      rewrites = parseGrokResponse(content);

      // 마커 ID 검증
      const missingIds = markers.filter(m => !(m.id in rewrites)).map(m => m.id);
      if (missingIds.length > 0) {
        console.error(`${colors.yellow}[WARNING]${colors.reset} 누락된 마커: #${missingIds.join(', #')}`);
      }

      break; // 성공

    } catch (err) {
      console.error(`${colors.red}[시도 ${attempt} 실패]${colors.reset} ${err.message}`);

      if (attempt > args.maxRetries) {
        // 모든 재시도 실패 → 백업에서 복구
        console.error(`${colors.red}[ERROR]${colors.reset} 모든 재시도 실패. 원본을 유지합니다.`);
        fs.unlinkSync(backupPath);

        console.log(JSON.stringify({
          success: false,
          markersFound: markers.length,
          error: err.message
        }, null, 2));
        process.exit(1);
      }
    }
  }

  // 리라이트 결과 null 체크
  if (!rewrites) {
    console.error(`${colors.red}[ERROR]${colors.reset} 리라이트 결과가 없습니다.`);
    fs.unlinkSync(backupPath);
    process.exit(1);
  }

  // 마커 교체
  const finalText = replaceMarkers(originalText, markers, rewrites);

  // 출력
  if (args.output) {
    const outputPath = path.resolve(args.output);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, finalText, 'utf-8');
    console.error(`${colors.green}[SUCCESS]${colors.reset} 저장됨: ${outputPath}`);
  } else {
    process.stdout.write(finalText);
  }

  // 백업 삭제
  fs.unlinkSync(backupPath);
  console.error(`${colors.dim}[CLEANUP]${colors.reset} 백업 삭제됨`);

  // 결과 JSON (stderr로)
  const rewrittenIds = Object.keys(rewrites);
  console.error('');
  console.error(`${colors.blue}[결과]${colors.reset}`);
  console.error(`  마커 감지: ${markers.length}개`);
  console.error(`  리라이트: ${rewrittenIds.length}개`);

  for (const m of markers) {
    const rewrite = rewrites[m.id];
    if (rewrite) {
      console.error(`  마커 #${m.id}: ${m.content.length}자 → ${rewrite.length}자`);
    } else {
      console.error(`  마커 #${m.id}: 원본 유지 (리라이트 없음)`);
    }
  }

  // stdout JSON (파이프라인용, --output 지정 시에만)
  if (args.output) {
    console.log(JSON.stringify({
      success: true,
      markersFound: markers.length,
      rewritten: rewrittenIds.length,
      details: markers.map(m => ({
        id: m.id,
        originalLength: m.content.length,
        rewrittenLength: rewrites[m.id]?.length || 0
      }))
    }, null, 2));
  }
}

main();
