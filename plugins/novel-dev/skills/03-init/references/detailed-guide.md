# Init Skill - Detailed Guide

## Project Initialization System

The init skill bootstraps a new novel project from a high-level idea, creating all necessary directory structures, configuration files, and initial metadata.

## Initialization Process

### Phase 1: Project ID Generation

**Format**: `novel_{YYYYMMDD}_{HHmmss}`

**Examples**:
- `novel_20250117_143052`
- `novel_20260121_093000`

**Implementation**:
```javascript
function generateProjectId() {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const time = now.toTimeString().slice(0, 8).replace(/:/g, '');
  return `novel_${date}_${time}`;
}
```

**Purpose**:
- Unique identifier for each novel project
- Timestamp-based for chronological sorting
- Prevents naming conflicts

### Phase 2: Directory Structure Creation

Creates complete project hierarchy:

```
novels/{novel_id}/
├── meta/                  # Project metadata and state
│   ├── project.json       # Core project info
│   ├── style-guide.json   # Writing style configuration
│   ├── ralph-state.json   # Ralph loop state (created on /write-all)
│   └── backups/           # State backups
│
├── world/                 # Worldbuilding
│   └── world.json         # Setting, rules, locations
│
├── characters/            # Character profiles
│   ├── protagonist.json   # Main character(s)
│   ├── love_interest.json # Romance lead
│   └── supporting.json    # Side characters
│
├── plot/                  # Story structure
│   ├── structure.json     # Act/chapter breakdown
│   └── themes.json        # Themes and motifs
│
├── chapters/              # Plot and manuscript
│   ├── chapter_001.json   # Chapter 1 plot
│   ├── chapter_001.md     # Chapter 1 manuscript
│   └── ...
│
├── context/               # Context summaries
│   └── summaries/         # Chapter summaries for context
│       ├── chapter_001_summary.md
│       └── ...
│
├── reviews/               # Quality evaluations
│   ├── chapter_reviews/   # Individual chapter reviews
│   │   └── chapter_001_review.json
│   ├── history/           # Evaluation version history
│   │   └── chapter_001.json
│   └── act_1_review.json  # Act-level reviews
│
└── exports/               # Publication formats
    ├── epub/              # EPUB exports
    ├── pdf/               # PDF exports
    └── txt/               # Plain text exports
```

**Creation Logic**:
```javascript
function createProjectStructure(projectId) {
  const basePath = `novels/${projectId}`;

  const directories = [
    'meta',
    'meta/backups',
    'world',
    'characters',
    'plot',
    'chapters',
    'context/summaries',
    'reviews/chapter_reviews',
    'reviews/history',
    'exports/epub',
    'exports/pdf',
    'exports/txt'
  ];

  directories.forEach(dir => {
    mkdirSync(`${basePath}/${dir}`, { recursive: true });
  });

  return basePath;
}
```

### Phase 3: Plot Architect Agent Invocation

Delegates to `plot-architect` agent to design initial story structure.

**Agent Prompt Template**:
```javascript
const architectPrompt = `
# Novel Project Initialization

## User's Idea
${userIdea}

## Task
Design the foundational structure for this novel project.

## Required Outputs

### 1. Basic Info
- **Title**: Working title (can be refined later)
- **Genre**: Primary genre (romance, fantasy, thriller, etc.)
- **Sub-genre**: 2-3 sub-categories (e.g., "contract romance", "office romance")
- **Tropes**: Key story tropes (e.g., "contract dating", "enemies to lovers")
- **Tone**: 2-3 descriptors (e.g., "sweet", "comedic", "dark")
- **Rating**: Age rating (15+, 18+, All ages)

### 2. Project Scope
- **Target Chapters**: Total chapter count (20-100 typical for web novels)
- **Words per Chapter**: Target length (3000-7000 typical)

### 3. Story Structure
Choose one structure type:
- **3-Act Structure**: Setup (25%) → Confrontation (50%) → Resolution (25%)
- **5-Act Structure**: Exposition → Rising Action → Climax → Falling Action → Denouement
- **Hero's Journey**: 12-stage monomyth
- **Save the Cat**: 15-beat screenplay structure

For chosen structure, define:
- Act/section names
- Chapter ranges for each section
- Purpose of each section

### 4. Story Synopsis
- **Logline**: One-sentence hook (25 words max)
- **Short Synopsis**: 200 characters (for marketing)
- **Long Synopsis**: 1000 characters (full story overview)

## Output Format
Return JSON matching the schemas for:
- meta/project.json
- plot/structure.json
- meta/style-guide.json (initial defaults based on genre)

Be creative but grounded. Consider genre conventions.
`;
```

**Agent Invocation**:
```javascript
const architectResult = await Task({
  subagent_type: "novel-dev:plot-architect",
  model: "opus",  // High-quality planning
  prompt: architectPrompt
});
```

### Phase 4: File Generation

#### project.json

**Purpose**: Core project metadata and configuration

**Schema**:
```json
{
  "id": "novel_20250117_143052",
  "title": "계약 연애의 정석",
  "genre": ["romance"],
  "sub_genre": ["contemporary romance", "contract relationship"],
  "tropes": ["contract dating", "fake relationship", "push-pull dynamic"],
  "tone": ["sweet", "comedic"],
  "rating": "15+",
  "target_chapters": 50,
  "target_words_per_chapter": 5000,
  "current_chapter": 0,
  "status": "planning",
  "created_at": "2025-01-17T14:30:52Z",
  "updated_at": "2025-01-17T14:30:52Z",
  "metadata": {
    "author": "",
    "description": "계약 연애로 시작된 두 사람의 진짜 사랑 찾기",
    "tags": ["로맨스", "계약연애", "오피스"],
    "language": "ko"
  }
}
```

**Key Fields**:
- `id`: Project identifier
- `title`: Working title (can change)
- `genre`, `sub_genre`, `tropes`: Categorization
- `target_chapters`: Scope definition
- `current_chapter`: Progress tracking (0 = not started)
- `status`: Lifecycle stage (planning → writing → revision → complete)

#### structure.json

**Purpose**: Narrative structure and act breakdown

**Schema** (3-Act example):
```json
{
  "structure_type": "3-act",
  "logline": "완벽주의 CEO와 자유로운 디자이너, 계약 연애로 시작해 진짜 사랑을 찾다",
  "synopsis_short": "계약 연애로 만난 두 사람이 진짜 감정을 발견하는 현대 로맨스",
  "synopsis_long": "완벽주의자 CEO 민준은 집안의 압박을 피하기 위해 계약 연애를 제안한다. 상대는 자유분방한 디자이너 서연. 서로 다른 두 사람은 1년의 계약 기간 동안 점차 진짜 감정을 발견하게 되고, 계약 종료일이 다가올수록 선택의 기로에 서게 된다.",
  "acts": [
    {
      "act_number": 1,
      "name": "Setup - 계약의 시작",
      "chapters": [1, 15],
      "chapter_count": 15,
      "purpose": "세계관 소개, 주인공 일상, 계약 제안과 수락",
      "key_events": [
        "민준의 집안 압박 소개",
        "서연과의 첫 만남",
        "계약 제안",
        "계약 체결",
        "가짜 연애 시작"
      ],
      "character_arcs": {
        "민준": "완벽주의 → 혼란의 시작",
        "서연": "자유로움 → 호기심"
      }
    },
    {
      "act_number": 2,
      "name": "Confrontation - 진짜와 가짜 사이",
      "chapters": [16, 40],
      "chapter_count": 25,
      "purpose": "관계 발전, 진짜 감정 자각, 갈등 고조",
      "key_events": [
        "가족/친구들에게 소개",
        "첫 키스",
        "진짜 감정 자각",
        "외부 갈등 (경쟁자/오해)",
        "관계 위기"
      ],
      "character_arcs": {
        "민준": "혼란 → 사랑 인정",
        "서연": "호기심 → 진짜 사랑"
      }
    },
    {
      "act_number": 3,
      "name": "Resolution - 진짜 사랑의 선택",
      "chapters": [41, 50],
      "chapter_count": 10,
      "purpose": "갈등 해결, 진짜 관계로 전환, 해피엔딩",
      "key_events": [
        "계약 종료일 도래",
        "헤어질 위기",
        "진심 고백",
        "외부 문제 해결",
        "진짜 연애 시작"
      ],
      "character_arcs": {
        "민준": "사랑 인정 → 행동",
        "서연": "진짜 사랑 → 선택"
      }
    }
  ],
  "structure_notes": "전형적인 로맨스 3막 구조. 1막에서 관계 설정, 2막에서 감정 발전과 갈등, 3막에서 해피엔딩."
}
```

**Key Components**:
- `structure_type`: Framework (3-act, 5-act, etc.)
- `acts`: Array of act definitions
- Each act has: chapters range, purpose, key events, character arcs

#### style-guide.json

**Purpose**: Writing style configuration and constraints

**Schema**:
```json
{
  "narrative_voice": "3인칭 제한 시점",
  "pov_type": "single",
  "pov_character": "민준",
  "tense": "과거형",
  "tone": ["sweet", "comedic"],
  "pacing_default": "medium",
  "dialogue_style": "natural contemporary Korean",
  "description_density": "medium",
  "sentence_rhythm": "varied",
  "taboo_words": [
    "갑자기",
    "문득",
    "그런데",
    "어느새",
    "하지만"
  ],
  "preferred_expressions": [
    {
      "context": "romantic_tension",
      "words": ["설레다", "두근거리다", "아찔하다", "떨리다"]
    },
    {
      "context": "conflict",
      "words": ["팽팽하다", "날카롭다", "차갑다", "얼어붙다"]
    },
    {
      "context": "comedic",
      "words": ["황당하다", "어이없다", "당황하다"]
    }
  ],
  "chapter_structure": {
    "opening_hook": true,
    "scene_count_range": [2, 4],
    "target_word_count": 5000,
    "ending_hook": true
  },
  "genre_specific": {
    "romance": {
      "intimacy_level": "sweet",
      "conflict_type": "internal",
      "required_elements": ["chemistry", "obstacles", "resolution"]
    }
  }
}
```

**Purpose of Each Section**:

**Narrative Configuration**:
- `narrative_voice`: POV style (3rd limited, 1st person, etc.)
- `pov_type`: Single or multiple POV characters
- `tense`: Past or present tense

**Style Preferences**:
- `tone`: Emotional quality
- `pacing_default`: Rhythm (slow/medium/fast)
- `dialogue_style`: Speech patterns
- `sentence_rhythm`: Sentence variety

**Quality Control**:
- `taboo_words`: Overused words to avoid
- `preferred_expressions`: Context-appropriate vocabulary

**Structure**:
- `chapter_structure`: Chapter formatting rules
- `genre_specific`: Genre convention requirements

## Interview Mode

When user provides insufficient information, init enters interview mode to gather requirements.

### Interview Questions

```javascript
const interviewQuestions = [
  {
    type: "genre",
    question: "What's the primary genre of your novel?",
    options: ["Romance", "Fantasy", "Thriller", "Sci-Fi", "Mystery", "Literary", "Other"],
    required: true
  },
  {
    type: "scope",
    question: "How many chapters are you planning?",
    hint: "Web novels typically: 20-50 (novella), 50-100 (standard), 100+ (epic)",
    required: true
  },
  {
    type: "length",
    question: "Target words per chapter?",
    hint: "Typical: 3000-5000 (light), 5000-7000 (standard), 7000+ (dense)",
    default: 5000,
    required: false
  },
  {
    type: "tone",
    question: "What's the tone/mood?",
    options: ["Light/Comedic", "Serious/Dark", "Bittersweet", "Intense", "Romantic", "Mysterious"],
    multiple: true,
    required: true
  },
  {
    type: "rating",
    question: "Age rating?",
    options: ["All Ages", "15+", "18+"],
    default: "15+",
    required: false
  },
  {
    type: "structure",
    question: "Preferred story structure?",
    options: ["3-Act (simple)", "5-Act (detailed)", "Hero's Journey", "Save the Cat", "Let agent decide"],
    default: "3-Act (simple)",
    required: false
  }
];
```

### Interview Flow

```
/init "두 사람의 로맨스"

Initializing novel project...

Your idea: "두 사람의 로맨스"

I need a bit more information:

[1/6] What's the primary genre?
  1. Romance
  2. Fantasy
  3. Thriller
  4. Sci-Fi
  5. Mystery
  6. Literary
  7. Other

Choose [1-7]:
```

User responds: `1`

```
✓ Genre: Romance

[2/6] How many chapters are you planning?
(Typical: 20-50 novella, 50-100 standard, 100+ epic)

Enter number:
```

User: `50`

```
✓ Target chapters: 50

[3/6] Target words per chapter?
(Typical: 3000-5000 light, 5000-7000 standard, 7000+ dense)
[Default: 5000]

Enter number or press Enter for default:
```

User: `<Enter>`

```
✓ Words per chapter: 5000 (default)

[4/6] What's the tone/mood? (Select multiple)
  1. Light/Comedic
  2. Serious/Dark
  3. Bittersweet
  4. Intense
  5. Romantic
  6. Mysterious

Choose (comma-separated, e.g., 1,5):
```

User: `1,5`

```
✓ Tone: Light/Comedic, Romantic

[5/6] Age rating?
  1. All Ages
  2. 15+
  3. 18+
[Default: 15+]

Choose [1-3] or press Enter for default:
```

User: `<Enter>`

```
✓ Rating: 15+ (default)

[6/6] Preferred story structure?
  1. 3-Act (simple)
  2. 5-Act (detailed)
  3. Hero's Journey
  4. Save the Cat
  5. Let agent decide
[Default: 3-Act]

Choose [1-5] or press Enter:
```

User: `<Enter>`

```
✓ Structure: 3-Act (default)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Requirements gathered!

Genre: Romance
Chapters: 50
Words/chapter: 5000
Tone: Light/Comedic, Romantic
Rating: 15+
Structure: 3-Act

Calling plot-architect agent to design your novel...
```

## Plot Architect Agent Output

Agent generates creative content based on requirements:

```json
{
  "title": "계약 연애의 정석",
  "rationale": "Title captures the contract romance trope with a playful twist",
  "genre_analysis": {
    "primary": "romance",
    "sub_genres": ["contemporary", "contract relationship"],
    "tropes": ["fake dating", "contract romance", "enemies to lovers"],
    "comparable_works": ["비즈니스 프로포즈", "계약연애"]
  },
  "act_breakdown": {
    "act_1": {
      "chapters": "1-15",
      "arc": "계약의 시작 - Setup",
      "key_beats": [
        "Ch 1: 민준 introduces, family pressure",
        "Ch 3: 서연 introduces, first meeting",
        "Ch 5: Contract proposal",
        "Ch 8: Contract signed",
        "Ch 12: First public appearance",
        "Ch 15: First real moment (act climax)"
      ]
    },
    // ... more acts
  },
  "character_seeds": [
    {
      "name": "민준",
      "role": "protagonist",
      "archetype": "Perfectionist CEO",
      "arc": "Learns to embrace imperfection and vulnerability"
    },
    {
      "name": "서연",
      "role": "love interest",
      "archetype": "Free-spirited designer",
      "arc": "Discovers value in commitment and stability"
    }
  ]
}
```

## Conflict Resolution

### Duplicate Project ID

If project ID already exists (rare, but possible if two projects created in same second):

```
Project ID collision detected: novel_20260121_103052

This should be rare. Possible causes:
- Two init commands run simultaneously
- System clock issue

Generating alternative ID...
✓ New ID: novel_20260121_103052_alt

Continue with alternative ID? [Y/n]
```

### Invalid User Input

```
/init ""

ERROR: Empty idea provided.

Please provide a basic story idea:
  /init "로맨스 스토리"
  /init "Two people fall in love"
  /init "Sci-fi adventure on Mars"

Or run interview mode:
  /init --interview
```

### Directory Creation Failure

```
ERROR: Failed to create project directory
Path: novels/novel_20260121_103052
Reason: Permission denied

Possible solutions:
1. Check write permissions for novels/ directory
2. Run with appropriate permissions
3. Choose different base directory

Manual creation:
  mkdir -p novels/novel_20260121_103052/meta
  mkdir -p novels/novel_20260121_103052/chapters
  ...
```

## Post-Initialization Steps

After successful init:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Project Initialized Successfully!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Project ID: novel_20260121_103052
Title: 계약 연애의 정석
Genre: Romance (Contemporary, Contract Relationship)
Structure: 3-Act (50 chapters)

Created files:
  ✓ meta/project.json
  ✓ meta/style-guide.json
  ✓ plot/structure.json
  ✓ world/world.json (template)
  ✓ characters/ (templates)

Next steps:

1. Refine world and characters:
   /worldbuild
   /character-create

2. Generate detailed plot:
   /outline-all

3. Start writing:
   /write-all

Or jump straight to writing:
   /write 1

Project location:
  novels/novel_20260121_103052/
```

## Templates Created

### world.json Template

```json
{
  "setting": "Contemporary Seoul, South Korea",
  "time_period": "Present day (2025)",
  "locations": [
    {
      "name": "신성그룹 본사",
      "type": "office",
      "description": "Modern skyscraper in Gangnam",
      "significance": "민준's workplace, primary setting"
    }
  ],
  "rules": {
    "magic": false,
    "technology": "contemporary",
    "social": "Korean corporate hierarchy"
  },
  "notes": "Realistic contemporary setting. Focus on office and urban environments."
}
```

### Character Templates

```json
{
  "name": "민준",
  "role": "protagonist",
  "age": 32,
  "occupation": "CEO, 신성그룹",
  "personality": {
    "traits": ["perfectionist", "reserved", "responsible"],
    "goals": ["Escape family pressure", "Maintain company success"],
    "fears": ["Loss of control", "Disappointing family"],
    "arc": "Learn to balance perfection with authenticity"
  },
  "appearance": {
    "description": "Tall, well-dressed, cold exterior"
  },
  "speech_patterns": {
    "formality": "formal (존댓말)",
    "quirks": ["Measured speech", "Rarely uses contractions"]
  },
  "relationships": {
    "서연": "Contract girlfriend → real love"
  }
}
```

These templates are expanded in subsequent worldbuild/character-create steps.
