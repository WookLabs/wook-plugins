# Phase 3: Korean Specialization - Research

**Researched:** 2026-02-05
**Domain:** Korean language naturalization for AI-generated fiction
**Confidence:** MEDIUM (linguistic domain knowledge + verified research, requires native writer validation)

## Summary

This phase implements three interconnected Korean language specialization systems: honorific speech level consistency, AI-tell expression elimination, and Korean prose texture enrichment. Research reveals that AI-generated Korean text exhibits distinct patterns detectable through comma usage, spacing consistency, and conjunction patterns (KatFishNet research: 94.88% AUROC using punctuation alone). The honorific system requires modeling 7 speech levels with modern usage focusing on 3 active levels (해요체, 하십시오체, 해체). Korean prose texture relies heavily on onomatopoeia (의성어) and mimetic words (의태어) that have no English equivalents.

The existing Phase 2 pipeline (quality-oracle.ts, prose-surgeon.ts, revision-loop.ts) provides a solid foundation. The research recommends extending the directive system with 3 new Korean-specific directive types and building data-driven detection using curated word lists rather than ML models.

**Primary recommendation:** Build a character relationship matrix that tracks per-pair speech levels, integrate a comprehensive AI-banned expression list (~100 patterns) into Quality Oracle, and create a Korean texture injection system using categorized onomatopoeia/metaphor databases.

## Standard Stack

This phase uses the existing TypeScript pipeline infrastructure. No new libraries required.

### Core
| Component | Location | Purpose | Why Standard |
|-----------|----------|---------|--------------|
| quality-oracle.ts | src/pipeline/ | Detection engine | Existing heuristic detection pattern |
| prose-surgeon.ts | src/pipeline/ | Targeted revision | Scope-limited surgical fixes |
| revision-loop.ts | src/pipeline/ | Orchestration | Proven iteration pattern |
| types.ts | src/pipeline/ | Type definitions | Extend with Korean-specific types |

### Supporting
| Component | Purpose | When to Use |
|-----------|---------|-------------|
| JSON data files | Banned expression lists, honorific rules | Data-driven detection |
| Character profiles | Store relationship matrices | Per-project character management |
| Style library | Korean texture exemplars | Few-shot injection |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Keyword detection | ML-based detection | Decision [02-02]: No ML, keyword heuristics only |
| Hardcoded rules | External config files | Config files enable validation without code changes |
| Single banned list | Categorized lists | Categories enable severity-based prioritization |

**Installation:**
No new packages required. Uses existing TypeScript pipeline infrastructure.

## Architecture Patterns

### Recommended Project Structure
```
src/
  korean/
    honorific-matrix.ts      # Relationship-based speech level tracking
    banned-expressions.ts    # AI-tell detection with categorized lists
    texture-library.ts       # Onomatopoeia/metaphor injection
    types.ts                 # Korean-specific type definitions
  pipeline/
    quality-oracle.ts        # Extended with Korean directives
    prose-surgeon.ts         # Extended routing for Korean fixes
data/
  korean/
    banned-expressions.json  # Categorized banned word lists
    honorific-rules.json     # Speech level definitions
    onomatopoeia.json        # Categorized sound/mimetic words
    metaphors.json           # Genre-appropriate metaphor patterns
```

### Pattern 1: Honorific Relationship Matrix
**What:** Per-character-pair speech level tracking with context modifiers
**When to use:** All dialogue generation and revision

```typescript
// Source: Korean speech level research
interface HonorificMatrix {
  characters: Map<string, CharacterHonorificProfile>;
  relationships: Map<string, RelationshipSpeechLevel>;
}

interface RelationshipSpeechLevel {
  speakerId: string;
  listenerId: string;
  defaultLevel: SpeechLevel;  // 해체 | 해요체 | 하십시오체
  contextOverrides: {
    public?: SpeechLevel;     // Formal in public
    private?: SpeechLevel;    // Casual in private
    emotional?: SpeechLevel;  // Under stress
  };
}

type SpeechLevel = 'haeche' | 'haeyoche' | 'hapsyoche';
// Modern Korean uses only 3 of 7 traditional levels
```

### Pattern 2: Categorized Banned Expression Detection
**What:** Tiered detection with severity and replacement suggestions
**When to use:** Quality Oracle analysis pass

```typescript
// Source: KatFishNet research, 나무위키 번역체 patterns
interface BannedExpression {
  pattern: string | RegExp;
  category: 'ai-tell' | 'translationese' | 'filter-word' | 'punctuation';
  severity: 'critical' | 'high' | 'medium' | 'low';
  replacements: string[];  // Suggested alternatives
  context?: 'narration' | 'dialogue' | 'any';
}

// Critical AI-tell patterns (immediate replacement)
const AI_TELL_CRITICAL = [
  { pattern: '한편', category: 'ai-tell', severity: 'critical' },
  { pattern: '그러나', category: 'ai-tell', severity: 'critical' },
  { pattern: /~하였다$/, category: 'ai-tell', severity: 'critical' },
  { pattern: '~인 것 중 하나', category: 'translationese', severity: 'high' },
];
```

### Pattern 3: Korean Texture Injection
**What:** Categorized onomatopoeia/mimetic word and metaphor database with contextual matching
**When to use:** Prose enrichment during scene drafting and revision

```typescript
// Source: TOPIK Guide, Korean mimetic word research
interface TextureEntry {
  korean: string;
  category: 'sound' | 'movement' | 'state' | 'emotion' | 'nature';
  subcategory: string;  // e.g., 'crying', 'weather', 'texture'
  intensity: 'soft' | 'medium' | 'strong';
  verbForm?: string;  // ~거리다 conjugation if applicable
  usageContext: string[];  // ['sadness', 'loss', 'grief']
}

// Example entries
const TEXTURE_DB: TextureEntry[] = [
  { korean: '엉엉', category: 'sound', subcategory: 'crying', intensity: 'strong' },
  { korean: '훌쩍훌쩍', category: 'sound', subcategory: 'crying', intensity: 'soft' },
  { korean: '두근두근', category: 'emotion', subcategory: 'heartbeat', intensity: 'medium' },
];
```

### Anti-Patterns to Avoid
- **Global speech level:** Characters must NOT use single speech level throughout; relationships require per-pair tracking
- **Simple string replacement:** Banned expressions need context-aware replacement, not blind substitution
- **Decorative texture:** Onomatopoeia should feel natural, not inserted for effect
- **Over-correction:** Some "AI patterns" appear in natural Korean; severity thresholds prevent over-flagging

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Speech level detection | Custom regex | Morphological patterns | Korean verb endings are complex |
| Dialogue extraction | Simple quote matching | Existing countFilterWords() | Already handles Korean quote marks |
| Context detection | Paragraph-only | Scene + character context | Speech levels change by scene |
| Replacement generation | Random selection | Context-matched suggestions | Tone must match surrounding prose |

**Key insight:** Korean language rules appear simple but have extensive exceptions. Data-driven approaches with curated lists outperform rule-based systems. The existing Phase 2 architecture (keyword detection, directive-based fixes, scope limits) scales well to Korean specialization without fundamental changes.

## Common Pitfalls

### Pitfall 1: Inconsistent Honorific Shifts
**What goes wrong:** Character A uses 반말 to B in scene 1, then 존댓말 in scene 5 without explanation
**Why it happens:** No centralized tracking of relationship speech levels
**How to avoid:** Honorific matrix must be initialized at chapter start and passed to all generation/revision calls
**Warning signs:** Quality Oracle should flag speech level changes without context modifiers

### Pitfall 2: Over-Aggressive Banned Expression Removal
**What goes wrong:** Legitimate uses of "한편" or "그러나" in appropriate contexts get flagged
**Why it happens:** Context-blind pattern matching
**How to avoid:**
- Check for dialogue context (allowed in character speech reflecting personality)
- Check for intentional style (narrator voice may use formal connectors)
- Severity tiers prevent low-priority matches from triggering revision
**Warning signs:** Prose loses natural flow after revision; over-simplified connector usage

### Pitfall 3: Forced Texture Insertion
**What goes wrong:** Onomatopoeia feels decorative, not organic; "반짝반짝" appears where nothing sparkles
**Why it happens:** Texture added to meet quota rather than enhance meaning
**How to avoid:**
- Match texture to scene emotion/action context
- Limit injection to 1-2 texture words per 500 characters
- Prefer verb forms (~거리다) over standalone words when showing action
**Warning signs:** Reader notices "Korean-ness" as artificial; texture words cluster

### Pitfall 4: Comma Overuse Detection False Positives
**What goes wrong:** Stylistic comma usage flagged as AI-tell
**Why it happens:** KatFishNet research shows AI uses more commas, but some authors naturally use more
**How to avoid:** Set thresholds based on project style guide; allow style override config
**Warning signs:** Literary fiction with intentionally complex sentences fails repeatedly

### Pitfall 5: Ignoring Speech Level Context Shifts
**What goes wrong:** Character maintains same speech level in all contexts
**Why it happens:** Only tracking default level, not context overrides
**How to avoid:** Matrix must include public/private/emotional overrides; scene metadata indicates context
**Warning signs:** Intimate scenes read too formal; public confrontations too casual

## Code Examples

### Honorific Matrix Initialization
```typescript
// Source: Korean honorific system research
function initializeHonorificMatrix(characters: Character[]): HonorificMatrix {
  const matrix: HonorificMatrix = {
    characters: new Map(),
    relationships: new Map(),
  };

  for (const char of characters) {
    matrix.characters.set(char.id, {
      id: char.id,
      age: char.age,
      socialStatus: char.socialStatus,  // e.g., 'student', 'teacher', 'boss'
      defaultSpeechToStrangers: 'haeyoche',  // Safe default
    });
  }

  // Auto-derive relationships from character data
  for (const charA of characters) {
    for (const charB of characters) {
      if (charA.id === charB.id) continue;

      const key = `${charA.id}_to_${charB.id}`;
      const level = deriveSpeechLevel(charA, charB);

      matrix.relationships.set(key, {
        speakerId: charA.id,
        listenerId: charB.id,
        defaultLevel: level,
        contextOverrides: {},  // Can be user-configured
      });
    }
  }

  return matrix;
}

function deriveSpeechLevel(speaker: Character, listener: Character): SpeechLevel {
  // Age-based defaults (can be overridden by relationship type)
  const ageDiff = speaker.age - listener.age;

  if (ageDiff > 5) return 'haeche';      // Significantly older -> casual
  if (ageDiff < -5) return 'haeyoche';   // Significantly younger -> polite
  return 'haeyoche';  // Similar age -> start polite, relationship develops
}
```

### AI-Tell Detection Extension
```typescript
// Source: KatFishNet research, 나무위키 번역체
// Extends existing FILTER_WORDS in quality-oracle.ts

export const BANNED_EXPRESSIONS: BannedExpression[] = [
  // Critical AI-tell (번역체 connectors)
  { pattern: '한편,', category: 'ai-tell', severity: 'critical',
    replacements: ['', '그때', '그런데'], context: 'narration' },
  { pattern: '그러나,', category: 'ai-tell', severity: 'critical',
    replacements: ['하지만', '그런데', ''], context: 'narration' },
  { pattern: /하였다\.?$/, category: 'ai-tell', severity: 'critical',
    replacements: ['했다', '~ㅆ다'], context: 'any' },

  // High-severity translationese
  { pattern: '~인 것 중 하나', category: 'translationese', severity: 'high',
    replacements: ['~인 것 하나', '대표적인 ~'], context: 'narration' },
  { pattern: '~에 있어(서)?', category: 'translationese', severity: 'high',
    replacements: ['~에서', '~에'], context: 'any' },
  { pattern: '~(으)?로 인한', category: 'translationese', severity: 'medium',
    replacements: ['~ 때문에', '~로'], context: 'any' },

  // Punctuation patterns (AI overuses)
  { pattern: /,\s*그리고\s/, category: 'punctuation', severity: 'medium',
    replacements: ['그리고 ', ' 그리고 '], context: 'any' },
  { pattern: /,\s*그러나\s/, category: 'punctuation', severity: 'high',
    replacements: ['그러나 ', '. 그러나 '], context: 'any' },
];

// Detection function extending analyzeChapter
function detectBannedExpressions(content: string, context: 'narration' | 'dialogue'): BannedMatch[] {
  const matches: BannedMatch[] = [];

  for (const expr of BANNED_EXPRESSIONS) {
    if (expr.context !== 'any' && expr.context !== context) continue;

    const pattern = typeof expr.pattern === 'string'
      ? new RegExp(expr.pattern, 'g')
      : expr.pattern;

    let match;
    while ((match = pattern.exec(content)) !== null) {
      matches.push({
        expression: expr,
        position: match.index,
        matchedText: match[0],
      });
    }
  }

  return matches.sort((a, b) => {
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return severityOrder[a.expression.severity] - severityOrder[b.expression.severity];
  });
}
```

### Korean Texture Matching
```typescript
// Source: Korean mimetic word research, TOPIK Guide
interface TextureContext {
  sceneEmotion: string[];  // ['sadness', 'loss']
  sceneAction: string[];   // ['crying', 'walking']
  currentSensoryCount: number;
  targetSensoryCount: number;
}

function suggestTexture(context: TextureContext): TextureSuggestion[] {
  const suggestions: TextureSuggestion[] = [];
  const needed = context.targetSensoryCount - context.currentSensoryCount;

  if (needed <= 0) return suggestions;

  // Match by emotion
  for (const emotion of context.sceneEmotion) {
    const matches = TEXTURE_DB.filter(t =>
      t.usageContext.some(c => c.includes(emotion))
    );
    if (matches.length > 0) {
      suggestions.push({
        texture: matches[0],
        reason: `Matches scene emotion: ${emotion}`,
        priority: 1,
      });
    }
  }

  // Match by action
  for (const action of context.sceneAction) {
    const matches = TEXTURE_DB.filter(t =>
      t.subcategory === action || t.usageContext.includes(action)
    );
    if (matches.length > 0) {
      suggestions.push({
        texture: matches[0],
        reason: `Matches scene action: ${action}`,
        priority: 2,
      });
    }
  }

  return suggestions.slice(0, needed);
}
```

### New Directive Types
```typescript
// Source: Extension of existing DirectiveType in types.ts
export type KoreanDirectiveType =
  | 'honorific-violation'      // Speech level inconsistency
  | 'banned-expression'        // AI-tell or translationese
  | 'texture-enrichment';      // Missing Korean prose texture

// Directive type extension for quality-oracle.ts
const KOREAN_DIRECTIVE_PRIORITIES: Record<KoreanDirectiveType, number> = {
  'banned-expression': 1,      // Highest - AI-tell is critical
  'honorific-violation': 2,    // High - breaks immersion
  'texture-enrichment': 6,     // Medium - enhancement not fix
};
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| 7 speech levels | 3 active levels (해요체, 하십시오체, 해체) | Modern Korean | Simplifies matrix; middle levels archaic |
| Manual AI detection | Feature-based detection (comma, POS) | KatFishNet 2025 | 94.88% AUROC without ML |
| Generic filter words | Categorized severity tiers | This research | Enables prioritized correction |

**Deprecated/outdated:**
- 하오체, 하게체: Virtually unused in modern Korean fiction; do not model
- Simple comma rules: Korean comma usage is flexible; don't over-flag
- ML-based detection: Per decision [02-02], use keyword heuristics only

## Open Questions

1. **Native Writer Validation**
   - What we know: Research identifies patterns, but native fluency needed for threshold tuning
   - What's unclear: Exact severity thresholds for each banned expression category
   - Recommendation: Phase includes validation task with native Korean writer review
   - Noted in STATE.md: "Korean banned expression lists need native writer validation"

2. **Context-Specific Honorific Rules**
   - What we know: Default levels derivable from age/status; contexts (public/private) shift levels
   - What's unclear: How to detect scene context automatically (public gathering vs private conversation)
   - Recommendation: Require scene metadata to include context type; manual annotation initially

3. **Texture Density Thresholds**
   - What we know: Too little texture feels flat; too much feels forced
   - What's unclear: Optimal onomatopoeia/mimetic density per genre (romance vs thriller)
   - Recommendation: Start with 1-2 per 500 chars, allow genre-based config override

4. **Replacement Quality Assurance**
   - What we know: Banned expression removal needs natural replacements
   - What's unclear: How to ensure replacement matches surrounding tone/style
   - Recommendation: Surgeon prompt should include surrounding context; Opus model for creative replacements

## Sources

### Primary (HIGH confidence)
- KatFishNet research (arXiv 2503.00032): AI-generated Korean text detection features
- Existing codebase: quality-oracle.ts, prose-surgeon.ts, revision-loop.ts, types.ts

### Secondary (MEDIUM confidence)
- [나무위키 번역체 문장](https://namu.wiki/w/%EB%B2%88%EC%97%AD%EC%B2%B4%20%EB%AC%B8%EC%9E%A5): Translationese patterns and examples
- [90DayKorean Speech Levels](https://www.90daykorean.com/korean-speech-levels/): Modern Korean honorific usage
- [HowToStudyKorean Lesson 152](https://www.howtostudykorean.com/unit-7/lessons-151-158/lesson-152/): Mimetic word patterns
- [나무위키 소설 작법/문체](https://namu.wiki/w/%EC%86%8C%EC%84%A4%20%EC%9E%91%EB%B2%95/%EA%B5%AC%EC%B2%B4%EC%A0%81%20%EC%9A%94%EC%86%8C/%EB%AC%B8%EC%B2%B4): Korean fiction style techniques

### Tertiary (LOW confidence - needs native validation)
- AI-tell expression specific severity rankings
- Exact thresholds for texture density by genre
- Context detection heuristics for scene type

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Uses existing proven infrastructure
- Architecture: HIGH - Follows established directive pattern
- Banned expressions: MEDIUM - Patterns identified, severity needs validation
- Honorific rules: MEDIUM - System understood, edge cases need testing
- Texture library: MEDIUM - Categories identified, density thresholds TBD
- Pitfalls: HIGH - Common failure modes well-documented

**Research date:** 2026-02-05
**Valid until:** 2026-03-05 (30 days - stable linguistic domain)

---

## Appendix A: Comprehensive AI-Banned Expression List

### Category 1: AI-Tell Connectors (Critical)
```
한편,     -> (삭제) / 그때 / 그런데
그러나,   -> 하지만 / 그런데 / (삭제)
따라서,   -> 그래서 / (문장 재구성)
결과적으로 -> (삭제) / 결국
```

### Category 2: Archaic/Translation Verb Forms (Critical)
```
~하였다   -> ~했다 / ~ㅆ다
~되었다   -> ~됐다
~있었다   -> ~있었다 (context-dependent)
```

### Category 3: Translationese Patterns (High)
```
~인 것 중 하나        -> 대표적인 ~ / ~인 것 하나
~에 있어(서)          -> ~에서 / ~에
~(으)로 인한          -> ~ 때문에
~하지 않을 수 없다    -> ~해야 한다 / 어쩔 수 없이 ~
그녀 (과용)           -> 이름 / 그 / (생략)
```

### Category 4: Comma Placement (Medium)
```
", 그리고"  -> "그리고" / ". 그리고"
", 그러나"  -> ". 그러나" / "그러나"
", 따라서"  -> ". 따라서"
```

### Category 5: Filter Words (Already in Phase 2)
```
느꼈다, 보였다, 생각했다, 들렸다, 알 수 있었다, 깨달았다, 것 같았다
(Extend existing FILTER_WORDS list)
```

## Appendix B: Korean Mimetic Words by Category

### Emotion/Physical State
| Korean | Meaning | Intensity | Verb Form |
|--------|---------|-----------|-----------|
| 두근두근 | heart pounding | medium | 두근거리다 |
| 콩닥콩닥 | heart fluttering | soft | 콩닥거리다 |
| 부들부들 | shaking/trembling | strong | 부들거리다 |
| 오들오들 | shivering | medium | 오들거리다 |

### Sound/Crying
| Korean | Meaning | Intensity | Verb Form |
|--------|---------|-----------|-----------|
| 엉엉 | bawling | strong | 엉엉거리다 |
| 훌쩍훌쩍 | sniffling | soft | 훌쩍거리다 |
| 흐느끼다 | sobbing | medium | - |
| 낄낄 | giggling | soft | 낄낄거리다 |

### Movement
| Korean | Meaning | Intensity | Verb Form |
|--------|---------|-----------|-----------|
| 살금살금 | sneaking | soft | 살금거리다 |
| 쿵쿵 | stomping/thudding | strong | 쿵쿵거리다 |
| 데굴데굴 | rolling | medium | 데굴거리다 |
| 휘청휘청 | staggering | medium | 휘청거리다 |

### Visual/State
| Korean | Meaning | Intensity | Verb Form |
|--------|---------|-----------|-----------|
| 반짝반짝 | sparkling | soft | 반짝거리다 |
| 번쩍번쩍 | flashing | strong | 번쩍거리다 |
| 끈적끈적 | sticky | medium | 끈적거리다 |
| 알록달록 | colorful/varied | medium | - |

### Weather/Nature
| Korean | Meaning | Intensity | Verb Form |
|--------|---------|-----------|-----------|
| 주룩주룩 | rain pouring | medium | 주룩거리다 |
| 쨍쨍 | blazing sun | strong | - |
| 살랑살랑 | gentle breeze | soft | 살랑거리다 |
| 쏴아 | water rushing | medium | - |

## Appendix C: Speech Level Quick Reference

### Modern Korean Speech Levels (3 Active)
| Level | Name | Ending | When to Use |
|-------|------|--------|-------------|
| 해체 | Informal casual | -해, -야 | Close friends, younger people, family |
| 해요체 | Informal polite | -해요, -요 | Default safe choice, strangers, acquaintances |
| 하십시오체 | Formal polite | -합니다, -습니다 | Very formal settings, business, ceremonies |

### Relationship-Based Defaults
| Speaker -> Listener | Default Level | Context Shifts |
|---------------------|---------------|----------------|
| Older -> Younger | 해체 | +1 level in public |
| Younger -> Older | 해요체 or 하십시오체 | -1 if intimate |
| Same age, not close | 해요체 | -1 after establishing friendship |
| Same age, close | 해체 | +1 in public/formal |
| Boss -> Subordinate | 해요체 or 해체 | Varies by workplace culture |
| Subordinate -> Boss | 하십시오체 | -1 if very familiar |
