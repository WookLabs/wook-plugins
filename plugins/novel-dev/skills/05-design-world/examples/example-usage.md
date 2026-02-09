# Design-World Skill - Usage Examples

## Basic Usage

### Example 1: First-Time World Design

```
/design-world
```

**Context**: Right after `/init`, no world files exist yet.

**Expected Output**:
```
Designing world for: {project_title}
Genre: 로맨스
Tone: 달달, 코믹

Calling lore-keeper agent...

✓ World settings created
✓ Location database created (7 locations)
✓ Terminology dictionary created (3 terms)

Files saved:
- world/world.json
- world/locations.json
- world/terms.json

Next steps:
- Review generated world settings
- Run /design-character to create characters
```

**Files Created**:

`world/world.json`:
```json
{
  "era": "현대",
  "year": "2025년",
  "location": {
    "country": "대한민국",
    "city": "서울",
    "district": "강남구"
  },
  "technology_level": "현대 기술",
  "social_context": {
    "norms": ["직장 내 서열 문화", "성공 지향적 사회"],
    "relevant_issues": ["워라밸", "경쟁적 연애 시장"]
  }
}
```

`world/locations.json`:
```json
{
  "locations": [
    {
      "id": "loc_001",
      "name": "유나의 원룸",
      "type": "거주지",
      "description": "강남역 도보 10분, 10평 원룸. 깔끔하지만 좁음.",
      "atmosphere": "아늑, 소박",
      "related_characters": ["char_001"]
    },
    {
      "id": "loc_002",
      "name": "신성기획 본사",
      "type": "사무실",
      "description": "삼성동 초고층 빌딩 15층. 오픈 오피스 구조.",
      "atmosphere": "바쁨, 긴장감",
      "related_characters": ["char_001", "char_003"]
    },
    {
      "id": "loc_003",
      "name": "청담동 바 '루나'",
      "type": "유흥",
      "description": "고급 칵테일 바. 어두운 조명, 프라이버시 중시.",
      "atmosphere": "세련됨, 은밀함",
      "related_characters": ["char_001", "char_002"]
    }
  ]
}
```

### Example 2: Fantasy World Design

```
/design-world
```

**Context**: Project initialized with genre=판타지.

**Expected Output**:
```
Designing world for: 달빛 기사단
Genre: 판타지
Tone: 장엄, 긴장감

Detected fantasy genre - including special systems

Calling lore-keeper agent...

✓ World settings with magic system created
✓ Location database created (12 locations)
✓ Terminology dictionary created (24 terms)

Files saved:
- world/world.json (includes magic system)
- world/locations.json
- world/terms.json

World includes:
- 3 kingdoms
- Magic system: 4-element mana
- 5 major locations
- 7 location types (castle, village, dungeon, etc.)
```

`world/world.json`:
```json
{
  "era": "중세 판타지",
  "year": "제국력 1023년",
  "location": {
    "continent": "엘다리아",
    "kingdoms": ["루나리스", "솔라", "노르타"],
    "focus": "루나리스 왕국"
  },
  "technology_level": "중세 (철기) + 마법 증폭",
  "social_context": {
    "norms": ["엄격한 계급제", "기사도", "마법사 길드 우위"],
    "relevant_issues": ["왕위 계승 분쟁", "마법 자원 고갈"]
  },
  "special_systems": [
    {
      "name": "4원소 마나 체계",
      "elements": ["불", "물", "바람", "땅"],
      "description": "모든 마법은 4원소 마나 조합으로 발현",
      "rules": [
        "개인은 1-2개 원소 친화성",
        "마나는 수련으로 증폭",
        "마나석으로 저장 가능"
      ]
    }
  ]
}
```

## Advanced Usage

### Example 3: Iterative Refinement

**First Run**:
```
/design-world
```

Output creates basic world. User manually edits `world/world.json` to add custom detail:

```json
{
  "era": "현대",
  "year": "2025년",
  "location": {
    "country": "대한민국",
    "city": "서울",
    "district": "강남구"
  },
  "<!-- MANUAL -->": {
    "custom_setting": "주인공 회사는 실제로는 마피아 조직 프론트"
  }
}
```

**Second Run**:
```
/design-world
```

**Expected Output**:
```
world/world.json already exists
Reading existing content...
Preserving manual edits...

✓ Manual section preserved
✓ New suggestions merged
✓ No conflicts detected

Files updated:
- world/world.json (manual edits preserved)
- world/locations.json (expanded from 5 to 8 locations)
- world/terms.json (added 2 new terms)
```

### Example 4: Specific Argument Usage

```
/design-world --expand-locations
```

**Expected Output**:
```
Expanding location database...

Current locations: 5
Target: 10-15

Calling lore-keeper agent...

✓ Added 7 new locations
  - 2 residential
  - 3 commercial
  - 2 public spaces

Total locations: 12
```

## Integration Examples

### With Character Design

**Workflow**:
```
/design-world
/design-character
```

Character design references world locations:

```json
// characters/char_001.json
{
  "name": "김유나",
  "residence": "loc_001",  // References world/locations.json
  "workplace": "loc_002",
  "frequented_places": ["loc_003", "loc_005"]
}
```

### With Plot Generation

**Workflow**:
```
/design-world
/design-character
/design-main-arc
/gen-plot
```

Generated chapter plots reference locations:

```json
// chapters/chapter_001.json
{
  "meta": {
    "locations": ["loc_002", "loc_003"]  // From world.json
  },
  "scenes": [
    {
      "scene_number": 1,
      "location": "loc_002",  // 신성기획 본사
      "description": "야근 후 동료들과 회식 가기로"
    },
    {
      "scene_number": 2,
      "location": "loc_003",  // 청담동 바 '루나'
      "description": "우연히 준혁과 마주침"
    }
  ]
}
```

## Error Scenarios

### Missing Prerequisites

```
/design-world
```

**Error Output**:
```
ERROR: Cannot design world

Missing required file: meta/project.json

Required steps:
1. Run '/init' to create project structure
2. Then run '/design-world'

Workflow: /init → /design-world → /design-character → ...
```

### Conflicting Edits

```
/design-world
```

**Warning Output**:
```
Warning: Merge conflict detected

Conflict in world/world.json:
- Auto-generated: era = "현대"
- Manual edit: era = "근미래"

Action required:
1. Review world/world.json
2. Choose desired value
3. Re-run /design-world to confirm

Proceeding with manual value: "근미래"
```

## Genre-Specific Examples

### Modern Romance

**Input**: Project with genre="로맨스", tone=["달달", "코믹"]

**Output Highlights**:
```json
{
  "locations": [
    {
      "id": "loc_001",
      "name": "주인공 원룸",
      "atmosphere": "아늑, 소박"
    },
    {
      "id": "loc_002",
      "name": "회사 사무실",
      "atmosphere": "바쁨, 긴장감"
    },
    {
      "id": "loc_003",
      "name": "고급 레스토랑",
      "atmosphere": "로맨틱, 긴장"
    },
    {
      "id": "loc_004",
      "name": "한강 공원",
      "atmosphere": "평화로움, 설렘"
    }
  ]
}
```

Focus: Relatable modern locations, romantic meeting spots.

### Thriller

**Input**: Project with genre="스릴러", tone=["긴장", "어두움"]

**Output Highlights**:
```json
{
  "locations": [
    {
      "id": "loc_001",
      "name": "폐쇄된 정신병원",
      "atmosphere": "음산함, 공포"
    },
    {
      "id": "loc_002",
      "name": "경찰서 지하 심문실",
      "atmosphere": "답답함, 압박감"
    },
    {
      "id": "loc_003",
      "name": "외딴 산장",
      "atmosphere": "고립, 불안"
    }
  ]
}
```

Focus: Isolated, tense locations that heighten suspense.

### Regression Fantasy

**Input**: Project with genre="판타지", keywords=["회귀"]

**Output Highlights**:
```json
{
  "special_systems": [
    {
      "name": "시간 회귀",
      "description": "주인공이 죽음 직전 10년 전으로 회귀",
      "rules": [
        "최대 3회 회귀 가능",
        "기억은 유지",
        "다른 사람은 기억 못함"
      ]
    }
  ],
  "timeline": {
    "original": "제국력 1030년",
    "regressed_to": "제국력 1020년",
    "divergence_points": [
      "1023년 - 주인공 첫 번째 선택 변경",
      "1027년 - 반전 사건 회피"
    ]
  }
}
```

Focus: Time mechanics, dual timeline structure.

## Best Practices Demonstrated

### Start Small, Expand Later

**Initial run**:
```
Locations created: 5 (essential only)
- Main character home
- Workplace
- 2 key meeting spots
- 1 climax location
```

**After plotting**:
```
/design-world --expand

Locations now: 12
- Added scene-specific locations
- Added background locations
- Removed unused locations
```

### Match Genre Expectations

Romance world:
- Modern, relatable
- Focus on social dynamics
- Romantic meeting spots

Fantasy world:
- Rich terminology
- Detailed magic systems
- Hierarchical locations (castles, villages, etc.)

### Preserve Custom Details

Always use `<!-- MANUAL -->` sections for:
- Unique world mechanics
- Plot-critical details
- Custom social rules

These survive re-runs of `/design-world`.

## Performance Notes

**Execution time**: 10-30 seconds depending on complexity

**Token usage**:
- Modern romance: ~3K tokens
- Complex fantasy: ~8K tokens

**File output**:
- 3 JSON files
- 2-15 KB total
