# Design-Character Skill - Usage Examples

## Basic Usage

### Example 1: Design All Characters (Interview Mode)

```
/design-character
```

**Context**: After `/design-world`, no character files exist.

**Expected Output**:
```
Character Design - Interview Mode

프로젝트: 계약의 온도
장르: 로맨스
세계관: 현대 서울 강남구

주요 캐릭터를 설계합니다.

인터뷰 시작:
1. 주인공 이름은? → 김유나
2. 주인공 성별은? → 여성
3. 주인공 나이는? → 28
4. 주인공 직업은? → 마케팅 팀 대리
5. 상대역 (사랑 상대) 이름은? → 이준혁
...

Calling lore-keeper agent...

✓ 주인공 프로필 생성 (char_001_김유나.json)
✓ 상대역 프로필 생성 (char_002_이준혁.json)
✓ 지원 캐릭터 2명 생성
✓ 관계 매트릭스 생성 (relationships.json)

Files saved:
- characters/char_001_김유나.json
- characters/char_002_이준혁.json
- characters/char_003_박민지.json (베프)
- characters/char_004_한재원.json (라이벌)
- characters/index.json
- characters/relationships.json
```

**Generated File Example** (`char_001_김유나.json`):
```json
{
  "id": "char_001",
  "name": "김유나",
  "aliases": ["유나", "김대리"],
  "role": "protagonist",

  "basic": {
    "age": 28,
    "gender": "여성",
    "birthday": "3월 15일",
    "appearance": {
      "height": "165cm",
      "build": "보통",
      "features": ["단발머리", "안경", "항상 정장"]
    },
    "voice": {
      "tone": "차분하고 낮은 톤",
      "speech_pattern": "존댓말 위주, 간결한 문장",
      "vocabulary": "비즈니스 용어 자주 사용"
    }
  },

  "background": {
    "origin": "부산",
    "family": "부모님, 여동생 1명",
    "education": "서울대 경영학과",
    "occupation": "대기업 마케팅팀 대리",
    "economic_status": "중산층",
    "trauma": "과거 연인에게 배신당한 경험",
    "secret": {
      "content": "실은 재벌가 숨겨진 딸",
      "reveal_chapter": 35
    }
  },

  "inner": {
    "want": "승진해서 능력을 인정받고 싶다",
    "need": "자신의 가치를 외부 평가가 아닌 내면에서 찾기",
    "fatal_flaw": "타인의 시선에 지나치게 의존",
    "values": ["성실함", "공정함"],
    "fears": ["실패", "배신", "혼자 남겨지는 것"]
  },

  "behavior": {
    "habits": ["손톱 물어뜯기 (긴장 시)", "야근 후 편의점 맥주"],
    "hobbies": ["독서", "요가"],
    "dislikes": ["무례한 사람", "뒷담화"],
    "stress_response": "일에 몰두함",
    "lying_tell": "눈을 피하고 말이 빨라짐"
  },

  "arc": {
    "start_state": "일 중독, 감정 억압",
    "catalyst": "계약 연애 제안",
    "midpoint": "가짜 감정인 줄 알았던 것이 진짜가 됨",
    "dark_night": "비밀이 폭로되고 모든 것을 잃음",
    "transformation": "타인의 평가가 아닌 자신의 행복 선택",
    "end_state": "진정한 사랑과 자아 수용"
  }
}
```

### Example 2: Design Specific Character

```
/design-character 이준혁
```

**Expected Output**:
```
Designing character: 이준혁

Loading context:
✓ Project metadata
✓ World settings
✓ Existing characters (김유나)

Calling lore-keeper agent...

✓ 이준혁 profile created

File saved:
- characters/char_002_이준혁.json
- characters/relationships.json (updated with 이준혁 ↔ 김유나)
```

**Generated Relationship**:
```json
{
  "relationships": [
    {
      "character_a": "char_001",
      "character_b": "char_002",
      "relationship_type": "계약 연인 → 진짜 연인",
      "initial_state": "비즈니스 파트너",
      "evolution": [
        { "chapter": 1, "state": "첫 만남, 서로에 대한 편견" },
        { "chapter": 15, "state": "계약 체결, 동거 시작" },
        { "chapter": 30, "state": "감정 발생 인지" },
        { "chapter": 45, "state": "갈등과 이별" },
        { "chapter": 50, "state": "재회와 진심 고백" }
      ],
      "final_state": "연인",
      "conflict_points": ["신분 차이", "과거 트라우마", "주변 반대"],
      "chemistry_type": "밀당, 티격태격"
    }
  ]
}
```

## Advanced Usage

### Example 3: Iterative Refinement

**First run**:
```
/design-character
```

Creates basic character. User manually edits `char_001_김유나.json`:

```json
{
  "name": "김유나",
  "<!-- MANUAL -->": {
    "hidden_talent": "실은 피아노 천재, 어렸을 때 콩쿠르 우승",
    "secret_fear": "어둠 공포증 (어린 시절 사고로)"
  }
}
```

**Second run**:
```
/design-character 김유나
```

**Expected Output**:
```
char_001_김유나.json already exists
Reading existing content...
Preserving manual edits...

✓ Manual section preserved
✓ New suggestions merged
✓ Arc refined with manual details

File updated:
- characters/char_001_김유나.json (manual edits intact)
```

### Example 4: Ensemble Cast

```
/design-character --ensemble
```

**Expected Output**:
```
Ensemble Cast Mode

This mode creates 4-6 characters with:
- Balanced importance
- Interconnected arcs
- Group dynamics

Calling lore-keeper agent...

✓ Created 5 characters
✓ All have equal development
✓ Relationship web generated

Characters:
1. 김유나 (Leader type)
2. 이준혁 (Loner type)
3. 박민지 (Mediator)
4. 한재원 (Troublemaker)
5. 최서연 (Wise advisor)

Relationship matrix includes:
- 10 pairwise relationships
- 2 triangles (conflict)
- 1 core group dynamic
```

## Integration Examples

### With World Design

```
/design-world
/design-character
```

Character references world locations:

```json
// char_001_김유나.json
{
  "residence": "loc_001",  // 유나의 원룸 (from world/locations.json)
  "workplace": "loc_002",  // 신성기획 본사
  "frequented_places": ["loc_003", "loc_005"]
}
```

### With Plot Design

```
/design-character
/design-main-arc
```

Main arc uses character Want/Need:

```json
// plot/main-arc.json
{
  "conflicts": {
    "internal": "진짜 감정과 계약 조건 사이의 갈등"
    // Derived from char_001's Want vs Need
  }
}
```

### With Chapter Generation

```
/gen-plot
```

Plot references character arcs:

```json
// chapters/chapter_025.json (midpoint)
{
  "narrative_elements": {
    "character_development": "유나가 진짜 감정 인지 (arc midpoint)"
    // From char_001.arc.midpoint
  }
}
```

## Error Scenarios

### Missing Prerequisites

```
/design-character
```

**Error Output**:
```
ERROR: Cannot design characters

Missing required files:
- meta/project.json (run /init first)
- world/world.json (run /design-world first)

Recommended workflow:
/init → /design-world → /design-character
```

### Character Already Exists

```
/design-character 김유나
```

**When file exists**:
```
char_001_김유나.json already exists

Options:
1. Merge - Keep existing, add new suggestions
2. Overwrite - Replace with fresh design
3. Variant - Create char_001_v2_김유나.json
4. Cancel

Choose [1/2/3/4]:
```

## Genre-Specific Examples

### Romance Protagonist

```json
{
  "name": "김유나",
  "role": "protagonist",
  "inner": {
    "want": "승진해서 능력을 인정받고 싶다",
    "need": "자신의 가치를 외부 평가가 아닌 내면에서 찾기",
    "fatal_flaw": "타인의 시선에 지나치게 의존"
  },
  "arc": {
    "start_state": "일 중독, 감정 억압",
    "end_state": "진정한 사랑과 자아 수용"
  }
}
```

Focus: Relatable flaws, emotional growth, relationship-driven arc.

### Fantasy Hero

```json
{
  "name": "카일 아벨론",
  "role": "protagonist",
  "inner": {
    "want": "마왕을 쓰러뜨려 영웅이 되고 싶다",
    "need": "힘이 아닌 희생으로 진정한 영웅이 됨을 깨닫기",
    "fatal_flaw": "자신의 힘을 과신, 타인의 도움 거부"
  },
  "special_abilities": [
    {
      "name": "성검 계승자",
      "description": "전설의 성검을 다룰 수 있는 자격",
      "limitation": "분노에 휩싸이면 제어 불가"
    }
  ]
}
```

Focus: External goal (defeat enemy) vs internal growth (learn humility).

### Thriller Detective

```json
{
  "name": "박지훈",
  "role": "protagonist",
  "occupation": "형사, 중대범죄팀",
  "inner": {
    "want": "연쇄살인마를 잡아 과거 실패를 만회하고 싶다",
    "need": "집착을 놓고 현재의 삶을 받아들이기",
    "fatal_flaw": "과거 사건에 대한 죄책감으로 인한 자기파괴적 성향"
  },
  "trauma": "5년 전 놓친 살인범 때문에 파트너가 사망",
  "behavior": {
    "habits": ["불면증, 과음"],
    "stress_response": "더 위험한 상황에 몸을 던짐"
  }
}
```

Focus: Dark past, obsessive drive, self-destructive tendencies.

## Speech Pattern Examples

### Formal Character (김유나)

```
"저는 그렇게 생각하지 않습니다."
"죄송하지만, 그 제안은 받아들일 수 없어요."
"보고서를 먼저 확인하고 회신 드리겠습니다."
```

Vocabulary: 저, 죄송, 확인, 회신
Pattern: 존댓말, complete sentences, business terms

### Casual Character (박민지 - best friend)

```
"야, 그건 좀 아닌 것 같은데?"
"완전 대박이잖아!"
"언니 진짜 이러면 안 돼."
```

Vocabulary: 야, 완전, 대박
Pattern: 반말, fragments, exclamations

### Cold Character (이준혁 - early)

```
"그건 제 문제가 아닙니다."
"필요한 게 있으면 말씀하세요."
"......"  (침묵)
```

Vocabulary: Minimal, terse
Pattern: Short sentences, periods of silence

### Warm Character (이준혁 - late)

```
"유나 씨가 좋아할 것 같아서요."
"괜찮아요. 천천히 생각해봐요."
"내가 곁에 있을게요."
```

Vocabulary: Softens, more personal
Pattern: Concern, reassurance, intimacy

## Best Practices Demonstrated

### Start with Core Cast

**Phase 1**:
```
/design-character

Creates:
- 1 protagonist
- 1 deuteragonist (love interest or sidekick)
- 1-2 supporting cast
```

**Phase 2** (during plotting):
```
/design-character 한재원  # Add rival as needed
/design-character 최서연  # Add mentor figure
```

Incremental is better than designing 20 characters upfront.

### Use Secrets Strategically

**A-level secret** (Protagonist only):
```json
{
  "secret": {
    "content": "재벌가 숨겨진 딸",
    "reveal_chapter": 35,
    "impact": "플롯 대반전"
  }
}
```

**B-level secret** (Supporting):
```json
{
  "secret": {
    "content": "과거 주인공의 첫사랑",
    "reveal_chapter": 20,
    "impact": "관계 복잡화"
  }
}
```

**C-level secret** (Background detail):
```json
{
  "secret": {
    "content": "실은 피아노를 잘 침",
    "reveal_chapter": 12,
    "impact": "캐릭터 깊이 추가"
  }
}
```

### Differentiate Through Details

**Bad** (Generic):
```json
{
  "habits": ["커피 마심"],
  "hobbies": ["독서"]
}
```

**Good** (Specific):
```json
{
  "habits": [
    "긴장하면 손톱 물어뜯기",
    "야근 후 편의점 맥주 정확히 1캔",
    "보고서 검토할 때 안경 쓰다 빼기 반복"
  ],
  "hobbies": [
    "자기계발서 독서 (실제론 웹소설)",
    "주말 새벽 요가 (집에서 유튜브)"
  ]
}
```

Specificity = memorability.
