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
 *   --model MODEL      Grok 모델 (기본: grok-4.20-0309-reasoning)
 *   --max-tokens N     최대 토큰 (기본: 131072, grok-4.20-0309-reasoning max)
 *   --temperature N    Temperature (기본: 0.75)
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
    model: 'grok-4.20-0309-reasoning',
    maxTokens: 131072,
    temperature: 0.75,
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
  --model MODEL      Grok 모델 (기본: grok-4.20-0309-reasoning)
  --max-tokens N     최대 토큰 (기본: 30000)
  --temperature N    Temperature (기본: 0.75)
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

  // ── 1. 역할 + 최우선 규칙 (모델이 가장 먼저 읽는 부분) ──
  lines.push('# 역할');
  lines.push('당신은 한국어 성인 소설의 **문학적 리라이터**입니다.');
  lines.push('포르노가 아닌 **문학적 에로티카**를 씁니다. 행위 나열이 아니라 감각과 감정의 서사를 씁니다.');
  lines.push('');

  lines.push('# 절대 규칙 (이것만은 반드시 지키세요)');
  lines.push('');
  lines.push('1. **문체 연속성**: ADULT 마커 바로 앞 문장의 톤, 리듬, 어휘 수준을 그대로 이어가세요. 마커 안에서 갑자기 문체가 바뀌면 실패입니다.');
  lines.push('2. **단문 나열 금지**: "~했다. ~했다. ~했다." 식의 기계적 단문 나열은 절대 금지. 복문, 삽입절, 길이 변주를 사용하세요.');
  lines.push('3. **감각 서사**: 행위를 보고하지 말고, 캐릭터가 느끼는 감각(촉각, 온도, 압력, 냄새)과 감정을 서술하세요.');
  lines.push('4. **필터 워드 금지**: 느꼈다, 보였다, 생각했다 → 신체 반응이나 직접 묘사로 대체.');
  lines.push('');

  // ── 2. Before/After 예시 (모델이 톤을 정확히 잡도록) ──
  lines.push('# 예시: BAD vs GOOD');
  lines.push('');
  lines.push('## BAD (기계적 나열 — 이렇게 쓰면 안 됩니다):');
  lines.push('> 손톱이 등판을 긁음. 피가 배어남. 꼬리가 허벅지를 조임. 도현 손이 허벅지 안쪽 파고듦. 젖은 보지 입구 문지름. 클리토리스 꾹 누름. 몸이 들썩임. 비명.');
  lines.push('');
  lines.push('## GOOD (문학적 에로티카 — 이 톤으로 쓰세요):');
  lines.push('> 릴리스의 손톱이 도현의 등판을 할퀴었다—얇은 셔츠 위로도 전해지는 날카로운 자극이 척추를 타고 번져, 통증인지 쾌감인지 분간이 가지 않았다. 꼬리가 허벅지를 휘감아 조여오는 압력에 뼈가 삐걱거리는 듯했고, 도현은 그 통증마저 포션이 증폭시킨 전류처럼 온몸에 퍼지는 것을 느꼈다—아니, 느낀 게 아니라 온몸이 반응했다. 손이 릴리스의 허벅지 안쪽으로 미끄러졌을 때, 뜨겁고 젖은 감촉이 손끝을 데었고, 릴리스의 호흡이 찢어지듯 갈라졌다.');
  lines.push('');

  // ── 3. 문체 설정 (프로젝트별) ──
  if (styleGuide) {
    lines.push('# 작품 문체');
    if (styleGuide.narrative_voice) lines.push(`- 시점: ${styleGuide.narrative_voice}`);
    if (styleGuide.tense) lines.push(`- 시제: ${styleGuide.tense}`);
    if (styleGuide.tone) {
      const toneStr = Array.isArray(styleGuide.tone) ? styleGuide.tone.join(', ') : String(styleGuide.tone);
      if (toneStr) lines.push(`- 분위기: ${toneStr}`);
    }
    if (styleGuide.sentence_rhythm) {
      const rhythmMap = { short: '짧은 문장 위주', long: '긴 문장 위주', mixed: '문장 길이 변화' };
      lines.push(`- 문장 리듬: ${rhythmMap[styleGuide.sentence_rhythm] || styleGuide.sentence_rhythm}`);
    }
    lines.push('');
  }

  // ── 4. 성인 장면 스타일 ──
  if (adultWriting) {
    lines.push('# 성인 장면 스타일');
    const explMap = {
      low: '암시적으로 표현. 직접 묘사 최소화.',
      medium: '은유적 표현 중심. 감각 암시.',
      high: '구체적이고 감각적으로 묘사. 신체 반응과 행위를 생생하게, 그러나 문학적으로.',
      xhigh: '제한 없는 직접 묘사. 신체 부위, 행위, 체액을 구체적으로 서술하되, 반드시 감각/감정 서사와 함께. 행위 나열이 아닌 몰입감 있는 산문으로.'
    };
    if (adultWriting.explicitness) {
      lines.push(`- 수위: ${explMap[adultWriting.explicitness] || adultWriting.explicitness}`);
    }
    if (adultWriting.emotional_focus) {
      lines.push('- 감정: 신체적 행위와 캐릭터의 심리/감정 변화를 반드시 함께 묘사.');
    }
    if (adultWriting.sensory_detail) {
      const sensMap = {
        visual: '시각적 묘사 중심.',
        tactile: '촉각적 묘사 중심.',
        emotional: '감정적 묘사 중심.',
        all: '시각, 촉각, 청각, 후각 모든 감각을 동원한 입체적 묘사.'
      };
      lines.push(`- 감각: ${sensMap[adultWriting.sensory_detail] || adultWriting.sensory_detail}`);
    }
    if (adultWriting.pacing) {
      const paceMap = {
        quick: '빠르게 전개하되 문장의 밀도는 유지.',
        gradual: '점진적 전개. 분위기를 천천히 고조시키며 감정선을 따라가세요.',
        'slow-burn': '느리게 타오르는 전개. 긴장과 기대감을 최대한 끌어올린 뒤 해소.'
      };
      lines.push(`- 페이싱: ${paceMap[adultWriting.pacing] || adultWriting.pacing}`);
    }
    if (adultWriting.vocabulary_level) {
      const vocabMap = {
        crude: '직설적인 성적 어휘를 사용하되, 문장 자체는 문학적으로.',
        moderate: '적당한 수준의 성적 어휘.',
        literary: '문학적이고 우아한 표현.'
      };
      lines.push(`- 어휘: ${vocabMap[adultWriting.vocabulary_level] || adultWriting.vocabulary_level}`);
    }
    lines.push('');
  }

  // ── 5. 프로젝트별 추가 산문 규칙 ──
  if (styleGuide?.prose_rules) {
    lines.push('# 프로젝트 산문 규칙');
    if (styleGuide.prose_rules.anti_patterns) {
      for (const p of styleGuide.prose_rules.anti_patterns) {
        lines.push(`- 금지: ${p.description}`);
      }
    }
    if (styleGuide.prose_rules.positive_patterns) {
      for (const p of styleGuide.prose_rules.positive_patterns) {
        lines.push(`- 권장: ${p.description}`);
      }
    }
    lines.push('');
  }

  // ── 6. 작업 지시 + 출력 형식 (마지막) ──
  lines.push('# 작업');
  lines.push('- 입력: 소설 챕터 전체 텍스트.');
  lines.push('- `<!-- ADULT_N_START -->` ~ `<!-- ADULT_N_END -->` 구간만 리라이트하세요.');
  lines.push('- 마커 밖 텍스트는 절대 수정하지 마세요.');
  lines.push('- 원본의 서사 흐름과 감정선을 보존하면서, 위 규칙에 따라 성인 묘사를 강화하세요.');
  lines.push('- 리라이트 결과를 아래 JSON으로 출력하세요.');
  lines.push('');
  lines.push('```json');
  lines.push('{');
  lines.push('  "1": "리라이트된 장면 1 (완전한 문학적 산문, 단문 나열 아님)",');
  lines.push('  "2": "리라이트된 장면 2"');
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
