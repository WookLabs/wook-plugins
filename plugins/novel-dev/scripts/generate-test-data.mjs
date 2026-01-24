#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';

const PROJECT_ID = 'novel_20250117_100000';
const BASE_PATH = `test-project/novels/${PROJECT_ID}`;

async function generateTestProject() {
  console.log('Generating 100-chapter test project...');

  // 1. 디렉토리 구조 생성
  await createDirectories();

  // 2. 프로젝트 메타데이터
  await generateProjectMeta();

  // 3. 캐릭터 (10명)
  await generateCharacters(10);

  // 4. 세계관
  await generateWorld(15);  // 15개 장소

  // 5. 플롯 구조 (5막)
  await generatePlotStructure(5, 20);

  // 6. 복선 (20개)
  await generateForeshadowing(20);

  // 7. 100개 챕터 메타데이터
  await generateChapters(100);

  // 8. 100개 챕터 요약 (테스트용 더미)
  await generateSummaries(100);

  // 9. Ralph State
  await generateRalphState();

  console.log('Test project generated successfully!');
  console.log(`Location: ${BASE_PATH}`);
}

async function createDirectories() {
  const dirs = [
    'meta', 'characters', 'world', 'plot', 'plot/sub-arcs',
    'chapters', 'context', 'context/summaries', 'reviews', 'exports'
  ];

  for (const dir of dirs) {
    await fs.mkdir(path.join(BASE_PATH, dir), { recursive: true });
  }
}

async function generateProjectMeta() {
  const project = {
    $schema: '../../../schemas/project.schema.json',
    id: PROJECT_ID,
    title: '계약의 끝에서',
    author: 'Test Author',
    genre: ['로맨스', '현대'],
    logline: '계약 연애로 시작된 관계가 진심으로 변해가는 이야기',
    target_chapters: 100,
    target_words_per_chapter: 3000,
    current_chapter: 1,
    status: 'in_progress',
    rating: '15세',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  await fs.writeFile(
    path.join(BASE_PATH, 'meta', 'project.json'),
    JSON.stringify(project, null, 2)
  );

  // Style guide
  const styleGuide = {
    pov: '3인칭 제한 시점',
    pov_style: 'single',
    tense: '과거',
    tone: '달달하면서도 애틋한',
    style_notes: [
      '감정 묘사는 직접적이기보다 행동으로 보여주기',
      '대화체는 자연스럽게, 존댓말 체계 일관성 유지'
    ],
    dialogue_ratio: '40-50%',
    forbidden_words: ['갑자기', '문득', '순간'],
    preferred_expressions: ['천천히', '조심스럽게', '낮은 목소리로']
  };

  await fs.writeFile(
    path.join(BASE_PATH, 'meta', 'style-guide.json'),
    JSON.stringify(styleGuide, null, 2)
  );
}

async function generateCharacters(count) {
  const characters = [];
  const roles = ['protagonist', 'deuteragonist', 'antagonist', 'supporting', 'supporting', 'minor', 'minor', 'minor', 'minor', 'minor'];
  const names = ['강서연', '김민우', '이하준', '박지은', '최수아', '정현우', '오미래', '한도윤', '송예린', '윤재민'];

  for (let i = 0; i < count; i++) {
    const charId = `char_${String(i + 1).padStart(3, '0')}`;
    const character = {
      $schema: '../../../schemas/character.schema.json',
      id: charId,
      name: names[i],
      role: roles[i],
      age: 25 + i,
      occupation: `직업 ${i + 1}`,
      appearance: {
        height: '170cm',
        build: '보통',
        distinctive_features: [`특징 ${i + 1}`]
      },
      personality: {
        traits: ['성격1', '성격2'],
        strengths: ['장점1'],
        weaknesses: ['단점1']
      },
      background: {
        family: '가족 배경',
        education: '대학교 졸업',
        significant_events: ['중요 사건']
      },
      arc: {
        want: '원하는 것',
        need: '필요한 것',
        lie: '믿는 거짓말',
        truth: '깨달을 진실'
      },
      voice: {
        speech_pattern: '말투 패턴',
        verbal_tics: ['말버릇'],
        vocabulary_level: 'average'
      },
      first_appearance: 1,
      status: 'active'
    };

    await fs.writeFile(
      path.join(BASE_PATH, 'characters', `${charId}.json`),
      JSON.stringify(character, null, 2)
    );
    characters.push({ id: charId, name: names[i] });
  }

  // Index
  await fs.writeFile(
    path.join(BASE_PATH, 'characters', 'index.json'),
    JSON.stringify({ characters }, null, 2)
  );

  // Relationships
  const relationships = {
    relationships: [
      { from: 'char_001', to: 'char_002', type: 'romantic', description: '계약 연인' },
      { from: 'char_001', to: 'char_003', type: 'rival', description: '경쟁자' },
      { from: 'char_002', to: 'char_004', type: 'friend', description: '오랜 친구' }
    ]
  };

  await fs.writeFile(
    path.join(BASE_PATH, 'characters', 'relationships.json'),
    JSON.stringify(relationships, null, 2)
  );
}

async function generateWorld(locationCount) {
  const world = {
    $schema: '../../../schemas/world.schema.json',
    setting: {
      time_period: '현대',
      year: 2025,
      location: '서울, 대한민국'
    },
    tone: '밝지만 때로는 긴장감 있는',
    social_context: '대기업 중심의 상류층 사회'
  };

  await fs.writeFile(
    path.join(BASE_PATH, 'world', 'world.json'),
    JSON.stringify(world, null, 2)
  );

  // Locations
  const locations = { locations: [] };
  for (let i = 0; i < locationCount; i++) {
    locations.locations.push({
      id: `loc_${String(i + 1).padStart(3, '0')}`,
      name: `장소 ${i + 1}`,
      type: i < 5 ? 'primary' : 'secondary',
      description: `장소 ${i + 1}에 대한 설명`,
      atmosphere: '분위기 설명',
      related_characters: [`char_${String((i % 10) + 1).padStart(3, '0')}`]
    });
  }

  await fs.writeFile(
    path.join(BASE_PATH, 'world', 'locations.json'),
    JSON.stringify(locations, null, 2)
  );
}

async function generatePlotStructure(actCount, chaptersPerAct) {
  const structure = {
    $schema: '../../../schemas/plot.schema.json',
    total_acts: actCount,
    acts: []
  };

  for (let act = 1; act <= actCount; act++) {
    const startChapter = (act - 1) * chaptersPerAct + 1;
    const endChapter = act * chaptersPerAct;

    structure.acts.push({
      act_number: act,
      title: `${act}막: ${getActTitle(act)}`,
      chapters: [startChapter, endChapter],
      summary: `${act}막 요약: ${getActTitle(act)}`,
      key_events: [`사건 ${act}-1`, `사건 ${act}-2`],
      character_development: [`발전 ${act}`]
    });
  }

  await fs.writeFile(
    path.join(BASE_PATH, 'plot', 'structure.json'),
    JSON.stringify(structure, null, 2)
  );

  // Main arc
  const mainArc = {
    title: '계약에서 진심으로',
    premise: '가짜 연애가 진짜가 되는 과정',
    theme: '진정한 사랑의 의미',
    central_conflict: '감정과 계약 사이의 갈등',
    resolution_type: 'happy_ending'
  };

  await fs.writeFile(
    path.join(BASE_PATH, 'plot', 'main-arc.json'),
    JSON.stringify(mainArc, null, 2)
  );
}

function getActTitle(act) {
  const titles = ['만남', '갈등', '위기', '전환', '결말'];
  return titles[act - 1] || `${act}막`;
}

async function generateForeshadowing(count) {
  const foreshadowing = { items: [] };

  for (let i = 0; i < count; i++) {
    const plantChapter = Math.floor(i / 2) * 10 + 1;  // 1, 1, 11, 11, 21, ...
    const payoffChapter = plantChapter + 20 + (i % 5) * 5;  // 20-40화 후 회수

    foreshadowing.items.push({
      id: `fore_${String(i + 1).padStart(3, '0')}`,
      description: `복선 ${i + 1}: 설명`,
      importance: i < 5 ? 'A' : (i < 12 ? 'B' : 'C'),
      plant_chapter: Math.min(plantChapter, 80),
      payoff_chapter: Math.min(payoffChapter, 100),
      hints: [plantChapter + 5, plantChapter + 10].filter(c => c < payoffChapter),
      status: plantChapter <= 5 ? 'planted' : 'not_planted',
      details: {
        plant: `${plantChapter}화에서 심는 방법`,
        payoff: `${payoffChapter}화에서 회수 방법`
      }
    });
  }

  await fs.writeFile(
    path.join(BASE_PATH, 'plot', 'foreshadowing.json'),
    JSON.stringify(foreshadowing, null, 2)
  );
}

async function generateChapters(count) {
  for (let i = 1; i <= count; i++) {
    const chapterId = String(i).padStart(3, '0');
    const actNumber = Math.ceil(i / 20);

    // Complete chapter structure matching schema
    const chapter = {
      $schema: '../../../schemas/chapter.schema.json',
      chapter_number: i,
      chapter_title: `${i}화: 제목`,
      status: i <= 5 ? 'draft' : 'planned',
      word_count_target: 3000,

      // meta object (REQUIRED by schema)
      meta: {
        pov_character: 'char_001',
        characters: ['char_001', 'char_002'],
        locations: [`loc_${String((i % 15) + 1).padStart(3, '0')}`],
        in_story_time: `1막 ${i}화 시점`
      },

      // context object (REQUIRED by schema)
      // CRITICAL: current_plot must be >= 100 characters
      context: {
        previous_summary: i > 1 ? `${i-1}화에서 서연과 민우는 계약 관계의 새로운 국면을 맞이했다. 두 사람 사이의 긴장감이 고조되는 가운데, 주변 인물들의 의심도 커져가고 있다.` : '',
        current_plot: `${i}화 플롯: 주인공 서연이 민우와의 계약 관계에서 새로운 전환점을 맞이한다. 이번 화에서는 두 사람의 관계가 한 단계 발전하며, 주변 인물들의 의심이 커져간다. 중요한 결정의 순간이 다가오고, 감정의 변화가 시작된다.`,
        next_plot: i < count ? `${i+1}화에서는 더 깊어지는 감정과 새로운 갈등이 예고된다.` : ''
      },

      // narrative_elements (CRITICAL: field names must match schema exactly)
      narrative_elements: {
        foreshadowing_plant: i % 10 === 1 ? [`fore_${String(Math.floor(i/10) + 1).padStart(3, '0')}`] : [],
        foreshadowing_payoff: i % 10 === 0 && i > 20 ? [`fore_${String(Math.floor((i-20)/10) + 1).padStart(3, '0')}`] : [],
        hooks_plant: [],
        hooks_reveal: [],
        character_development: `${actNumber}막에서의 캐릭터 성장`,
        emotional_goal: '독자에게 설렘과 기대감 전달'
      },

      // scenes array (CRITICAL: use emotional_tone NOT mood)
      scenes: [{
        scene_number: 1,
        location: `loc_${String((i % 15) + 1).padStart(3, '0')}`,
        characters: ['char_001', 'char_002'],
        purpose: '두 주인공의 관계 발전',
        conflict: '감정과 계약 사이의 갈등',
        beat: '핵심 이벤트',
        emotional_tone: '달달하면서 설레는',
        estimated_words: 1500
      }, {
        scene_number: 2,
        location: `loc_${String(((i + 1) % 15) + 1).padStart(3, '0')}`,
        characters: ['char_001', 'char_003'],
        purpose: '외부 갈등 요소 도입',
        conflict: '주변 인물과의 마찰',
        beat: '전환점',
        emotional_tone: '긴장감 있는',
        estimated_words: 1500
      }],

      // style_guide (REQUIRED by schema)
      style_guide: {
        tone: '달달하면서 애틋한',
        pacing: 'medium',
        focus: 'dialogue'
      },

      notes: `${actNumber}막 ${i}화 작성 노트`
    };

    await fs.writeFile(
      path.join(BASE_PATH, 'chapters', `chapter_${chapterId}.json`),
      JSON.stringify(chapter, null, 2)
    );

    // Draft prose (for first 5 chapters)
    if (i <= 5) {
      const prose = `# ${i}화: 제목\n\n테스트용 더미 본문입니다. `.repeat(100);
      await fs.writeFile(
        path.join(BASE_PATH, 'chapters', `chapter_${chapterId}.md`),
        prose
      );
    }
  }
}

async function generateSummaries(count) {
  for (let i = 1; i <= Math.min(count, 5); i++) {
    const chapterId = String(i).padStart(3, '0');
    const summary = `## ${i}화 요약

### 주요 사건
- 사건 1 설명
- 사건 2 설명

### 캐릭터 상태
- 서연: 감정 상태 설명
- 민우: 감정 상태 설명

### 복선 진행
- fore_001: 상태 업데이트

### 다음 화 연결
다음 화에서 진행될 내용 암시
`;

    await fs.writeFile(
      path.join(BASE_PATH, 'context', 'summaries', `chapter_${chapterId}_summary.md`),
      summary
    );
  }
}

async function generateRalphState() {
  const state = {
    $schema: '../../../schemas/ralph-state.schema.json',
    schema_version: '2.0',
    novel_id: PROJECT_ID,
    mode: 'idle',
    current_chapter: 5,
    last_safe_chapter: 5,
    current_act: 1,
    total_acts: 5,
    quality_retries: 0,
    iteration: 1,
    max_iterations: 100,
    ralph_active: false,
    last_updated: new Date().toISOString(),
    backup_path: 'meta/ralph-state.backup.json'
  };

  await fs.writeFile(
    path.join(BASE_PATH, 'meta', 'ralph-state.json'),
    JSON.stringify(state, null, 2)
  );
}

// Run
generateTestProject().catch(console.error);
