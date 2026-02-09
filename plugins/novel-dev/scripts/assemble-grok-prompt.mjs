#!/usr/bin/env node
/**
 * Grok Prompt Assembler - 소설 프로젝트 파일을 읽어 Grok API용 프롬프트를 조립
 *
 * Usage:
 *   node scripts/assemble-grok-prompt.mjs --chapter 5 --project ./novels/my-novel
 *
 * Output (stdout):
 *   { "system": "...", "prompt": "...", "outputPath": "...", "chapter": N, "contextStats": {...} }
 *
 * Options:
 *   --chapter N      회차 번호 (필수)
 *   --project PATH   소설 프로젝트 경로 (필수)
 */

import fs from 'fs';
import path from 'path';

// ─── CLI Argument Parsing ────────────────────────────────────────────────────

function parseArgs(argv) {
  const result = { chapter: null, project: null, batch: false };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--chapter' && argv[i + 1]) {
      result.chapter = parseInt(argv[++i], 10);
    } else if (arg === '--project' && argv[i + 1]) {
      result.project = argv[++i];
    } else if (arg === '--batch') {
      result.batch = true;
    } else if (arg === '--help' || arg === '-h') {
      printUsage();
      process.exit(0);
    }
  }

  return result;
}

function printUsage() {
  console.error(`
Grok Prompt Assembler - 소설 프로젝트 파일을 읽어 Grok API용 프롬프트를 조립합니다.

사용법:
  node scripts/assemble-grok-prompt.mjs --chapter <N> --project <PATH>

옵션:
  --chapter N      회차 번호 (필수)
  --project PATH   소설 프로젝트 경로 (필수)
  --batch          배치 모드 (요약/직전챕터 스킵, 플롯 기반 깨끗한 컨텍스트)
  --help, -h       도움말

출력:
  stdout으로 JSON을 출력합니다:
  {
    "system":       "시스템 프롬프트 (문체 가이드 기반)",
    "prompt":       "유저 프롬프트 (플롯 + 요약 + 캐릭터 + 세계관 + 복선 + 직전 회차)",
    "outputPath":   "chapters/chapter_005.md",
    "chapter":      5,
    "contextStats": { ... }
  }

예시:
  node scripts/assemble-grok-prompt.mjs --chapter 5 --project ./novels/my-novel
`);
}

// ─── File Reading Utilities ──────────────────────────────────────────────────

/**
 * 파일을 안전하게 읽기. 파일이 없으면 null 반환.
 */
function tryReadText(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return null;
  }
}

/**
 * JSON 파일을 안전하게 읽기. 파일이 없거나 파싱 실패 시 null 반환.
 */
function tryReadJSON(filePath) {
  const text = tryReadText(filePath);
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/**
 * 회차 번호를 3자리 zero-padded 문자열로 변환
 */
function padChapter(n) {
  return String(n).padStart(3, '0');
}

// ─── System Prompt Builder ───────────────────────────────────────────────────

function buildSystemPrompt(styleGuide) {
  const lines = [];

  lines.push('당신은 한국어 성인 소설 전문 작가입니다.');
  lines.push('');

  if (styleGuide) {
    // 시점
    if (styleGuide.narrative_voice) {
      lines.push(`- 시점: ${styleGuide.narrative_voice}`);
    }

    // 시제
    if (styleGuide.tense) {
      lines.push(`- 시제: ${styleGuide.tense}`);
    }

    // 분위기/톤
    if (styleGuide.tone) {
      const toneStr = Array.isArray(styleGuide.tone)
        ? styleGuide.tone.join(', ')
        : String(styleGuide.tone);
      if (toneStr) {
        lines.push(`- 분위기: ${toneStr}`);
      }
    }

    // 대화 스타일
    if (styleGuide.dialogue_style) {
      lines.push(`- 대화체: ${styleGuide.dialogue_style}`);
    }

    // 묘사 밀도
    if (styleGuide.description_density) {
      const densityMap = { high: '높음', medium: '보통', low: '낮음' };
      lines.push(`- 묘사 밀도: ${densityMap[styleGuide.description_density] || styleGuide.description_density}`);
    }

    // 문장 리듬
    if (styleGuide.sentence_rhythm) {
      const rhythmMap = { short: '짧은 문장 위주', long: '긴 문장 위주', mixed: '문장 길이 변화' };
      lines.push(`- 문장 리듬: ${rhythmMap[styleGuide.sentence_rhythm] || styleGuide.sentence_rhythm}`);
    }

    // 금기 단어
    if (styleGuide.taboo_words && styleGuide.taboo_words.length > 0) {
      lines.push(`- 금지어: ${styleGuide.taboo_words.join(', ')}`);
    }

    // 필터 단어
    if (styleGuide.filter_words && styleGuide.filter_words.length > 0) {
      lines.push(`- 피해야 할 표현: ${styleGuide.filter_words.join(', ')}`);
    }

    // 선호 표현
    if (styleGuide.preferred_expressions && styleGuide.preferred_expressions.length > 0) {
      lines.push(`- 선호 표현: ${styleGuide.preferred_expressions.join(', ')}`);
    }

    // Show don't tell
    if (styleGuide.show_dont_tell) {
      const sdtMap = { strict: '엄격 적용', balanced: '균형 있게', flexible: '유연하게' };
      lines.push(`- Show don't tell: ${sdtMap[styleGuide.show_dont_tell] || styleGuide.show_dont_tell}`);
    }

    // 한국어 기법
    if (styleGuide.korean_techniques) {
      const kt = styleGuide.korean_techniques;
      const techniques = [];
      if (kt.use_onomatopoeia) techniques.push('의성어/의태어 활용');
      if (kt.use_metaphors) techniques.push('비유/은유 활용');
      if (kt.sentence_variation) techniques.push('문장 길이 변화');
      if (techniques.length > 0) {
        lines.push(`- 한국어 기법: ${techniques.join(', ')}`);
      }
    }

    // 특별 지시
    if (styleGuide.special_instructions) {
      lines.push('');
      lines.push(`추가 지시: ${styleGuide.special_instructions}`);
    }

    // 성인 장면 스타일
    if (styleGuide.adult_writing) {
      const aw = styleGuide.adult_writing;
      lines.push('');
      lines.push('## 성인 장면 작성 가이드');

      if (aw.explicitness) {
        const explMap = {
          low: '암시적으로 표현하세요. 직접적인 묘사 대신 분위기와 감정으로.',
          medium: '은유적 표현을 사용하세요. 감각적이되 노골적이지 않게.',
          high: '구체적이고 감각적으로 묘사하세요. 신체 반응과 행위를 생생하게.'
        };
        lines.push(`- 수위: ${explMap[aw.explicitness] || aw.explicitness}`);
      }

      if (aw.emotional_focus) {
        lines.push('- 감정 묘사: 신체적 행위만이 아닌, 캐릭터의 심리와 감정 변화를 함께 묘사하세요.');
      }

      if (aw.sensory_detail) {
        const sensMap = {
          visual: '시각적 묘사 중심 (표정, 몸짓, 시선).',
          tactile: '촉각적 묘사 중심 (피부 감촉, 체온, 접촉).',
          emotional: '감정적 묘사 중심 (내면 독백, 감정 파도).',
          all: '시각, 촉각, 청각, 후각 등 모든 감각을 활용한 입체적 묘사.'
        };
        lines.push(`- 감각: ${sensMap[aw.sensory_detail] || aw.sensory_detail}`);
      }

      if (aw.pacing) {
        const paceMap = {
          quick: '빠르게 전개. 짧은 문장, 호흡 가빠지는 리듬.',
          gradual: '점진적 전개. 분위기를 천천히 고조시키며 감정선을 따라가세요.',
          'slow-burn': '느리게 타오르는 전개. 긴장과 기대감을 최대한 끌어올린 뒤 해소.'
        };
        lines.push(`- 페이싱: ${paceMap[aw.pacing] || aw.pacing}`);
      }

      if (aw.vocabulary_level) {
        const vocabMap = {
          crude: '직설적인 어휘를 사용하세요.',
          moderate: '적당한 수준의 성적 어휘를 사용하세요.',
          literary: '문학적이고 우아한 표현을 사용하세요. 저속한 표현은 피하세요.'
        };
        lines.push(`- 어휘: ${vocabMap[aw.vocabulary_level] || aw.vocabulary_level}`);
      }
    }
  }

  // 공통 작문 규칙
  lines.push('');
  lines.push('## 작문 규칙');
  lines.push('- Show, don\'t tell: 감정을 직접 서술하지 말고, 행동/표정/신체 반응으로 보여주세요.');
  lines.push('- 감각적 묘사: 시각, 청각, 촉각, 후각, 미각을 활용한 생생한 묘사를 작성하세요.');
  lines.push('- 캐릭터 일관성: 각 캐릭터의 말투, 성격, 행동 패턴을 일관되게 유지하세요.');
  lines.push('- 자연스러운 대화: 대화는 캐릭터의 성격과 관계를 반영하세요.');
  lines.push('- 장면 전환: ***를 사용하여 장면을 구분하세요.');

  return lines.join('\n');
}

// ─── User Prompt Builder ─────────────────────────────────────────────────────

function buildUserPrompt(chapter, data) {
  const {
    chapterPlot,
    summaries,
    characters,
    world,
    foreshadowing,
    prevChapterTail,
  } = data;

  const sections = [];

  // 제목
  sections.push(`# ${chapter}화 집필`);
  sections.push('');

  // 이번 회차 플롯
  sections.push('## 이번 회차 플롯');
  if (chapterPlot) {
    sections.push('```json');
    sections.push(JSON.stringify(chapterPlot, null, 2));
    sections.push('```');
  } else {
    sections.push('(플롯 정보 없음)');
  }
  sections.push('');

  // 이전 회차 요약 (최대 3개, 시간순)
  sections.push('## 이전 회차 요약');
  if (summaries.length > 0) {
    // summaries는 이미 시간순 정렬됨 (가장 오래된 것부터)
    for (const s of summaries) {
      sections.push(`### ${s.chapter}화 요약`);
      sections.push(s.content);
      sections.push('');
    }
  } else {
    sections.push('(이전 요약 없음 - 첫 회차이거나 요약 파일이 없습니다)');
    sections.push('');
  }

  // 등장 캐릭터
  sections.push('## 등장 캐릭터');
  if (characters.length > 0) {
    for (const char of characters) {
      sections.push(`### ${char.name} (${char.id})`);
      sections.push(`- 역할: ${char.role || '미정'}`);

      // 성격
      if (char.personality && char.personality.traits) {
        sections.push(`- 성격: ${char.personality.traits.join(', ')}`);
      }

      // 말투
      if (char.basic?.voice?.speech_pattern) {
        sections.push(`- 말투: ${char.basic.voice.speech_pattern}`);
      }
      if (char.basic?.voice?.signature_phrases && char.basic.voice.signature_phrases.length > 0) {
        sections.push(`- 말버릇: "${char.basic.voice.signature_phrases.join('", "')}"`);
      }

      // 외모
      if (char.basic?.appearance) {
        const app = char.basic.appearance;
        const parts = [];
        if (app.height) parts.push(app.height);
        if (app.build) parts.push(app.build);
        if (app.features && app.features.length > 0) {
          parts.push(app.features.join(', '));
        }
        if (parts.length > 0) {
          sections.push(`- 외모: ${parts.join(' / ')}`);
        }
      }

      sections.push('');
    }
  } else {
    sections.push('(등장인물 정보 없음)');
    sections.push('');
  }

  // 세계관 요약
  sections.push('## 세계관 요약');
  if (world) {
    if (world.era) {
      sections.push(`- 시대: ${world.era}${world.year ? ` (${world.year})` : ''}`);
    }
    if (world.location) {
      const loc = world.location;
      const locParts = [loc.country, loc.city, loc.region, loc.district].filter(Boolean);
      if (locParts.length > 0) {
        sections.push(`- 배경: ${locParts.join(', ')}`);
      }
    }
    if (world.technology_level) {
      sections.push(`- 기술 수준: ${world.technology_level}`);
    }
    if (world.special_rules && world.special_rules.length > 0) {
      sections.push(`- 특수 규칙: ${world.special_rules.join('; ')}`);
    }
    if (world.magic_system && world.magic_system.exists) {
      sections.push(`- 마법 체계: ${world.magic_system.type || '있음'}`);
      if (world.magic_system.rules && world.magic_system.rules.length > 0) {
        sections.push(`  - 규칙: ${world.magic_system.rules.join('; ')}`);
      }
    }
    if (world.social_context && world.social_context.norms && world.social_context.norms.length > 0) {
      sections.push(`- 사회적 규범: ${world.social_context.norms.join('; ')}`);
    }
  } else {
    sections.push('(세계관 정보 없음)');
  }
  sections.push('');

  // 활성 복선
  sections.push('## 활성 복선');
  if (foreshadowing.length > 0) {
    for (const f of foreshadowing) {
      let tag = '';
      if (f.payoff_chapter === chapter) {
        tag = ' [이번 화에서 회수!]';
      }
      sections.push(`- [${f.id}] ${f.content} (중요도: ${f.importance}, 심기: ${f.plant_chapter}화, 회수: ${f.payoff_chapter}화)${tag}`);
    }
  } else {
    sections.push('(활성 복선 없음)');
  }
  sections.push('');

  // 직전 회차 마지막 장면
  sections.push('## 직전 회차 마지막 장면');
  if (prevChapterTail) {
    sections.push(prevChapterTail);
  } else {
    if (chapter === 1) {
      sections.push('(첫 회차입니다)');
    } else {
      sections.push('(직전 회차 텍스트를 찾을 수 없습니다)');
    }
  }
  sections.push('');

  // 작성 지시
  sections.push('## 작성 지시');
  sections.push('- 분량: 5000~8000자를 목표로 작성하세요.');
  sections.push('- 장면 구분: *** 로 장면을 나누세요.');
  sections.push('- 결말: 독자가 다음 화를 궁금해할 훅(hook)으로 마무리하세요.');
  sections.push('- 출력: 소설 본문만 출력하세요. 제목, 회차 번호, 작가 노트 등은 포함하지 마세요.');

  return sections.join('\n');
}

// ─── Main ────────────────────────────────────────────────────────────────────

function main() {
  const args = parseArgs(process.argv.slice(2));

  // 필수 인자 확인
  if (args.chapter == null || isNaN(args.chapter)) {
    console.error('[ERROR] --chapter 옵션이 필요합니다. (예: --chapter 5)');
    printUsage();
    process.exit(1);
  }

  if (!args.project) {
    console.error('[ERROR] --project 옵션이 필요합니다. (예: --project ./novels/my-novel)');
    printUsage();
    process.exit(1);
  }

  const chapter = args.chapter;
  const projectDir = path.resolve(args.project);

  // 프로젝트 디렉토리 존재 확인
  if (!fs.existsSync(projectDir)) {
    console.error(`[ERROR] 프로젝트 경로를 찾을 수 없습니다: ${projectDir}`);
    process.exit(1);
  }

  // ── 파일 읽기 ──────────────────────────────────────────────────────────────

  // 1. Style guide
  const styleGuide = tryReadJSON(path.join(projectDir, 'meta', 'style-guide.json'));

  // 2. Chapter plot (chapter_XXX.json)
  const chapterPlot = tryReadJSON(
    path.join(projectDir, 'chapters', `chapter_${padChapter(chapter)}.json`)
  );

  // 3. Previous summaries (up to 3, reverse chronological collection then chronological output)
  //    batch 모드에서는 스킵 (플롯 기반 깨끗한 컨텍스트)
  const summaries = [];
  if (!args.batch) {
    for (let i = chapter - 1; i >= Math.max(1, chapter - 3); i--) {
      const summaryPath = path.join(
        projectDir, 'context', 'summaries', `chapter_${padChapter(i)}_summary.md`
      );
      const content = tryReadText(summaryPath);
      if (content) {
        summaries.unshift({ chapter: i, content: content.trim() });
      }
    }
  }

  // 4. Characters from plot metadata
  const characters = [];
  const characterIds = new Set();

  // Collect character IDs from chapter plot
  if (chapterPlot) {
    // meta.characters
    if (chapterPlot.meta && Array.isArray(chapterPlot.meta.characters)) {
      for (const id of chapterPlot.meta.characters) {
        characterIds.add(id);
      }
    }
    // Also check scenes for additional characters
    if (Array.isArray(chapterPlot.scenes)) {
      for (const scene of chapterPlot.scenes) {
        if (Array.isArray(scene.characters)) {
          for (const id of scene.characters) {
            characterIds.add(id);
          }
        }
      }
    }
  }

  // Read each character file
  for (const charId of characterIds) {
    const charData = tryReadJSON(path.join(projectDir, 'characters', `${charId}.json`));
    if (charData) {
      characters.push(charData);
    }
  }

  // 5. World
  const world = tryReadJSON(path.join(projectDir, 'world', 'world.json'));

  // 6. Foreshadowing (active items only)
  const foreshadowingData = tryReadJSON(path.join(projectDir, 'plot', 'foreshadowing.json'));
  const activeForeshadowing = [];
  if (foreshadowingData && Array.isArray(foreshadowingData.foreshadowing)) {
    for (const f of foreshadowingData.foreshadowing) {
      // Active = planted/hinting and not yet paid off, OR payoff is this chapter
      const isActive =
        (f.status === 'planted' || f.status === 'hinting') ||
        f.payoff_chapter === chapter;
      // Also include items that should be planted this chapter
      const shouldPlant = f.plant_chapter === chapter && f.status === 'not_planted';

      if (isActive || shouldPlant) {
        activeForeshadowing.push(f);
      }
    }
  }

  // 7. Previous chapter tail (last 1500 chars)
  //    batch 모드에서는 스킵 (플롯 기반 깨끗한 컨텍스트)
  let prevChapterTail = null;
  if (!args.batch && chapter > 1) {
    const prevPath = path.join(
      projectDir, 'chapters', `chapter_${padChapter(chapter - 1)}.md`
    );
    const prevText = tryReadText(prevPath);
    if (prevText) {
      const trimmed = prevText.trim();
      prevChapterTail = trimmed.length > 1500
        ? '...' + trimmed.slice(-1500)
        : trimmed;
    }
  }

  // ── 프롬프트 조립 ──────────────────────────────────────────────────────────

  const systemPrompt = buildSystemPrompt(styleGuide);

  const userPrompt = buildUserPrompt(chapter, {
    chapterPlot,
    summaries,
    characters,
    world,
    foreshadowing: activeForeshadowing,
    prevChapterTail,
  });

  // ── 출력 경로 ──────────────────────────────────────────────────────────────

  const outputPath = path.join(
    path.relative(process.cwd(), projectDir) || '.',
    'chapters',
    `chapter_${padChapter(chapter)}.md`
  ).replace(/\\/g, '/');

  // ── Context stats ──────────────────────────────────────────────────────────

  const contextStats = {
    batchMode: args.batch,
    hasStyleGuide: styleGuide !== null,
    hasPlot: chapterPlot !== null,
    summaryCount: summaries.length,
    characterCount: characters.length,
    hasWorld: world !== null,
    activeForeshadowingCount: activeForeshadowing.length,
    hasPrevChapter: prevChapterTail !== null,
    estimatedPromptLength: systemPrompt.length + userPrompt.length,
  };

  // ── stdout JSON 출력 ──────────────────────────────────────────────────────

  const output = {
    system: systemPrompt,
    prompt: userPrompt,
    outputPath,
    chapter,
    contextStats,
  };

  console.log(JSON.stringify(output, null, 2));
}

main();
