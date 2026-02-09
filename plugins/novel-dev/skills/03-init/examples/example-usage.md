# Init Skill - Usage Examples

## Basic Initialization

### Quick Start with Idea

```
/init "계약 연애로 시작해서 진짜 사랑을 찾는 두 사람"
```

Provide a basic story idea and let the agent figure out the details:

**Expected output:**
```
Initializing novel project...

Idea: "계약 연애로 시작해서 진짜 사랑을 찾는 두 사람"

Analyzing idea...
✓ Genre detected: Romance
✓ Trope identified: Contract relationship
✓ Tone: Light/Romantic

Generating project ID...
✓ ID: novel_20260121_103052

Creating directory structure...
✓ novels/novel_20260121_103052/meta
✓ novels/novel_20260121_103052/world
✓ novels/novel_20260121_103052/characters
✓ novels/novel_20260121_103052/plot
✓ novels/novel_20260121_103052/chapters
✓ novels/novel_20260121_103052/context/summaries
✓ novels/novel_20260121_103052/reviews
✓ novels/novel_20260121_103052/exports

Calling plot-architect agent...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Plot Architect Results
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Title: 계약 연애의 정석
Genre: Romance (Contemporary, Contract Relationship)
Structure: 3-Act
Chapters: 50 (estimated)
Words/Chapter: 5000 (target)

Act Breakdown:
  Act 1 (Ch 1-15): 계약의 시작
    - Setup and contract formation
    - Main characters introduced
    - Fake relationship begins

  Act 2 (Ch 16-40): 진짜와 가짜 사이
    - Relationship develops
    - Real feelings emerge
    - External conflicts arise

  Act 3 (Ch 41-50): 진짜 사랑의 선택
    - Crisis and resolution
    - True feelings confessed
    - Happy ending

Logline:
  "완벽주의 CEO와 자유로운 디자이너, 계약 연애로 시작해 진짜 사랑을 찾다"

Files created:
✓ meta/project.json
✓ meta/style-guide.json
✓ plot/structure.json
✓ world/world.json (template)
✓ characters/protagonist.json (template)
✓ characters/love_interest.json (template)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Project Initialized Successfully!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Project ID: novel_20260121_103052
Location: novels/novel_20260121_103052/

Next steps:

1. Review and refine settings:
   - Check meta/project.json
   - Review plot/structure.json
   - Customize meta/style-guide.json

2. Develop world and characters:
   /worldbuild
   /character-create

3. Generate chapter plots:
   /outline-all

4. Start writing:
   /write 1

Or use autopilot:
   /write-all
```

### Minimal Idea with English

```
/init "Two people fall in love through a contract dating arrangement"
```

Works with English input:

**Expected output:**
```
Initializing novel project...

Idea: "Two people fall in love through a contract dating arrangement"

Language detected: English
Generating Korean-localized project...

✓ ID: novel_20260121_104500

Calling plot-architect agent...

Title: The Art of Contract Romance (계약 연애의 정석)
Note: Title provided in both English and Korean

[Same detailed output as above]
```

## Interview Mode

### Full Interview

```
/init --interview
```

Step-by-step questionnaire:

**Expected output:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Novel Project Interview
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Let's create your novel project step by step.

[1/7] What's your story idea? (1-2 sentences)

Example: "두 사람이 계약 연애로 만나 진짜 사랑을 찾다"

Enter your idea:
```

**User enters:** `계약 연애 로맨스`

```
✓ Idea: 계약 연애 로맨스

[2/7] What's the primary genre?
  1. Romance
  2. Fantasy
  3. Thriller
  4. Sci-Fi
  5. Mystery
  6. Horror
  7. Literary Fiction
  8. Historical
  9. Other

Choose [1-9]:
```

**User:** `1`

```
✓ Genre: Romance

[3/7] How many chapters are you planning?

Typical ranges:
  - 20-30: Novella (quick read)
  - 40-60: Standard web novel
  - 80-100: Epic saga
  - 100+: Long-running series

Enter number:
```

**User:** `50`

```
✓ Target chapters: 50

[4/7] Target words per chapter?

Typical ranges:
  - 3000-4000: Light, fast-paced
  - 5000-6000: Standard depth
  - 7000-8000: Dense, detailed

[Default: 5000]
Enter number or press Enter for default:
```

**User:** `<Enter>`

```
✓ Words per chapter: 5000 (default)

[5/7] What's the overall tone/mood?
(You can select multiple)

  1. Light/Comedic
  2. Serious/Dark
  3. Bittersweet
  4. Intense/Dramatic
  5. Romantic/Sweet
  6. Mysterious/Suspenseful
  7. Inspirational
  8. Satirical

Choose (comma-separated, e.g., 1,5):
```

**User:** `1,5`

```
✓ Tone: Light/Comedic, Romantic/Sweet

[6/7] Age rating?
  1. All Ages (G)
  2. 15+ (PG-13)
  3. 18+ (R)

[Default: 15+]
Choose [1-3]:
```

**User:** `<Enter>`

```
✓ Rating: 15+ (default)

[7/7] Preferred story structure?
  1. 3-Act Structure (simple, classic)
  2. 5-Act Structure (detailed, Shakespearean)
  3. Hero's Journey (monomyth, 12 stages)
  4. Save the Cat (15-beat screenplay)
  5. Let the agent decide

[Default: 3-Act]
Choose [1-5]:
```

**User:** `1`

```
✓ Structure: 3-Act Structure

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Requirements Summary
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Idea: 계약 연애 로맨스
Genre: Romance
Chapters: 50
Words/Chapter: 5000
Tone: Light/Comedic, Romantic/Sweet
Rating: 15+
Structure: 3-Act Structure

Looks good? [Y/n]
```

**User:** `Y`

```
Generating project...

[Continues with same output as basic init]
```

## Customization Options

### With Specific Chapter Count

```
/init "로맨스" --chapters=30
```

Override default chapter count:

**Expected output:**
```
Initializing novel project...

Idea: "로맨스"
Target chapters: 30 (specified)

Calling plot-architect...

Act breakdown adjusted for 30 chapters:
  Act 1 (Ch 1-10): Setup (33%)
  Act 2 (Ch 11-23): Confrontation (43%)
  Act 3 (Ch 24-30): Resolution (24%)

[Rest of output...]
```

### With Specific Genre

```
/init "우주를 배경으로 한 모험" --genre=sci-fi
```

Explicitly set genre:

**Expected output:**
```
Initializing novel project...

Idea: "우주를 배경으로 한 모험"
Genre: Sci-Fi (specified)

Calling plot-architect...

Title: 별들 사이의 항해
Genre: Science Fiction (Space Opera)
Structure: Hero's Journey (recommended for adventure)

[Rest of output...]
```

### With Structure Type

```
/init "복잡한 정치 판타지" --structure=5-act
```

Use 5-act structure:

**Expected output:**
```
Initializing novel project...

Idea: "복잡한 정치 판타지"
Structure: 5-Act (specified)

Calling plot-architect...

Act breakdown (5-Act):
  Act 1 (Ch 1-10): Exposition
  Act 2 (Ch 11-25): Rising Action
  Act 3 (Ch 26-35): Climax
  Act 4 (Ch 36-45): Falling Action
  Act 5 (Ch 46-50): Denouement

[Rest of output...]
```

## Special Cases

### Existing Project Conflict

```
/init "새 로맨스"
```

If project ID somehow already exists:

**Expected output:**
```
Initializing novel project...

Generated ID: novel_20260121_103052

ERROR: Project with this ID already exists!
Path: novels/novel_20260121_103052/

This is unusual (timestamp collision?).

Options:
  1. Use existing project
  2. Generate alternative ID
  3. Delete existing and recreate
  4. Cancel

Choose [1-4]:
```

**User chooses:** `2`

```
Generating alternative ID...
✓ New ID: novel_20260121_103052_alt

Continuing with alternative ID...

[Normal output continues...]
```

### Empty Idea

```
/init ""
```

No idea provided:

**Expected output:**
```
ERROR: No story idea provided.

Usage:
  /init "Your story idea in 1-2 sentences"

Examples:
  /init "계약 연애로 만난 두 사람의 로맨스"
  /init "Fantasy adventure in a magical world"
  /init "Detective solving mysterious murders"

Or run interview mode:
  /init --interview
```

### Permission Error

```
/init "로맨스"
```

If directory creation fails:

**Expected output:**
```
Initializing novel project...

✓ ID: novel_20260121_103052

Creating directory structure...
✗ ERROR: Permission denied

Failed to create: novels/novel_20260121_103052/meta
Reason: Write permission denied

Troubleshooting:
1. Check directory permissions:
   ls -la novels/

2. Try creating manually:
   mkdir -p novels/novel_20260121_103052

3. Run with appropriate permissions

4. Change base directory:
   export NOVEL_BASE_DIR="~/my-novels"

Initialization failed.
```

## Integration with Next Steps

### Initialize and Immediately Start Outlining

```
/init "계약 연애" && /outline-all
```

Chain commands:

**Expected output:**
```
[Init output...]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Project Initialized!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Proceeding to outline generation...

[Outline-all begins...]
```

### Initialize and Customize Before Writing

```
/init "판타지 모험"
```

After init completes, customize files:

**Expected output:**
```
[Init output...]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Project Initialized!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Customization Tips:

1. Review project settings:
   cat meta/project.json

2. Adjust style preferences:
   Edit meta/style-guide.json
   - Change POV (1st person, 3rd limited, etc.)
   - Set tone (dark, comedic, etc.)
   - Add taboo words to avoid

3. Refine story structure:
   Edit plot/structure.json
   - Adjust act breakpoints
   - Modify chapter counts
   - Update synopsis

4. Develop world:
   /worldbuild
   - Add locations
   - Define magic/tech rules
   - Set cultural norms

5. Create characters:
   /character-create "민준" --role=protagonist
   /character-create "서연" --role=love-interest

When ready to write:
   /outline-all  # Generate all chapter plots
   /write-all    # Full autopilot writing
```

## Advanced Scenarios

### Multiple Projects

Managing multiple novels:

```
# Create first project
/init "로맨스 소설"
```

**Output:** `Project ID: novel_20260121_103000`

```
# Create second project
/init "판타지 소설"
```

**Output:** `Project ID: novel_20260121_104500`

```
# Switch between projects
/project-switch novel_20260121_103000
```

**Output:**
```
Switching to project: novel_20260121_103000

✓ Loaded: novels/novel_20260121_103000/
✓ Title: 로맨스 소설
✓ Progress: 0/50 chapters

Active project changed.
All commands will now use this project.
```

### Template-Based Init

Using a genre template:

```
/init --template=romance "두 사람의 사랑"
```

**Expected output:**
```
Initializing from template: Romance

Template settings:
  ✓ Structure: 3-Act (romance standard)
  ✓ Chapter count: 50 (typical for romance)
  ✓ Rating: 15+ (default for romance)
  ✓ Required elements: Chemistry, Conflict, Resolution

Customizing for your idea: "두 사람의 사랑"

[Init continues with romance-specific defaults...]
```

Available templates:
- `romance`
- `fantasy`
- `thriller`
- `sci-fi`
- `mystery`

### Re-initialization

Reinitializing an existing project (destructive):

```
/init "새 아이디어" --reinit
```

**Expected output:**
```
⚠️ WARNING: Re-initialization detected

Current project:
  ID: novel_20260121_103000
  Title: 기존 로맨스
  Progress: 12/50 chapters written

Re-initialization will:
  ✗ Reset all metadata
  ✗ Clear plot structure
  ⚠ Preserve written chapters (backup created)

This cannot be undone!

Backup will be created at:
  novels/novel_20260121_103000_backup_20260121_110000/

Continue with re-initialization? [Y/n]
```

**User confirms:**
```
Creating backup...
✓ Backup saved: novels/novel_20260121_103000_backup_20260121_110000/

Re-initializing project...

[Normal init output, reusing same project ID]
```

## Output Files Inspection

### Viewing Generated Files

After initialization:

```
# View project metadata
cat novels/novel_20260121_103052/meta/project.json
```

**Output:**
```json
{
  "id": "novel_20260121_103052",
  "title": "계약 연애의 정석",
  "genre": ["romance"],
  "sub_genre": ["contemporary romance", "contract relationship"],
  "tropes": ["contract dating", "fake relationship"],
  "tone": ["sweet", "comedic"],
  "rating": "15+",
  "target_chapters": 50,
  "target_words_per_chapter": 5000,
  "current_chapter": 0,
  "status": "planning",
  "created_at": "2026-01-21T10:30:52Z",
  "updated_at": "2026-01-21T10:30:52Z"
}
```

```
# View story structure
cat novels/novel_20260121_103052/plot/structure.json
```

**Output:**
```json
{
  "structure_type": "3-act",
  "logline": "완벽주의 CEO와 자유로운 디자이너, 계약 연애로 시작해 진짜 사랑을 찾다",
  "acts": [
    {
      "act_number": 1,
      "name": "Setup - 계약의 시작",
      "chapters": [1, 15],
      "purpose": "세계관 소개, 주인공 일상, 계약 제안과 수락"
    }
    // ...
  ]
}
```

```
# View style guide
cat novels/novel_20260121_103052/meta/style-guide.json
```

**Output:**
```json
{
  "narrative_voice": "3인칭 제한 시점",
  "pov_type": "single",
  "tense": "과거형",
  "tone": ["sweet", "comedic"],
  "pacing_default": "medium",
  "taboo_words": ["갑자기", "문득", "그런데"],
  "chapter_structure": {
    "opening_hook": true,
    "scene_count_range": [2, 4],
    "ending_hook": true
  }
}
```

### Verifying Directory Structure

```
# Check created directories
tree novels/novel_20260121_103052
```

**Output:**
```
novels/novel_20260121_103052/
├── meta/
│   ├── project.json
│   ├── style-guide.json
│   └── backups/
├── world/
│   └── world.json
├── characters/
│   ├── protagonist.json
│   └── love_interest.json
├── plot/
│   └── structure.json
├── chapters/
├── context/
│   └── summaries/
├── reviews/
│   ├── chapter_reviews/
│   └── history/
└── exports/
    ├── epub/
    ├── pdf/
    └── txt/
```

## Best Practices

### Good Story Ideas

**Good examples:**
```
/init "계약 연애로 만난 두 사람이 진짜 사랑을 찾는 이야기"
/init "마법사 학교에서 금지된 마법을 배우는 학생"
/init "Serial killer를 쫓는 형사의 심리 스릴러"
```

**Too vague (will trigger interview mode):**
```
/init "로맨스"  # Too generic
/init "좋은 이야기"  # No details
/init "소설"  # No content
```

**Too complex (will be simplified by agent):**
```
/init "계약 연애로 시작한 두 사람이 회사 내부 음모와 가족 갈등을 겪으며 진짜 사랑을 찾고 결국 회사를 구하고 가족과 화해하는 이야기"
# Agent will focus on core: contract romance + true love
```

### When to Use Interview Mode

Use `--interview` when:
- You're unsure about genre/structure
- First time using the system
- Want guided setup
- Have only a vague idea

Skip interview when:
- You have a clear concept
- Familiar with the system
- Want to iterate quickly
- Have specific requirements (use flags)
