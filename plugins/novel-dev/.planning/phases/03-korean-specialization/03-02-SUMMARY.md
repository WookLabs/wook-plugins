---
phase: 03-korean-specialization
plan: 02
subsystem: korean
tags: [ai-detection, banned-expressions, korean-prose, quality-oracle]
dependency-graph:
  requires: [01-foundation, 02-core-pipeline]
  provides: [banned-expression-detection, ai-tell-filtering]
  affects: [03-03-texture, 04-advanced-quality]
tech-stack:
  added: []
  patterns: [json-data-driven-patterns, severity-based-filtering, dialogue-context-detection]
key-files:
  created:
    - src/korean/data/banned-expressions.json
    - src/korean/banned-expressions.ts
    - tests/korean/banned-expressions.test.ts
  modified:
    - src/pipeline/types.ts
    - src/pipeline/quality-oracle.ts
    - src/pipeline/prose-surgeon.ts
decisions:
  - id: banned-5-categories
    choice: "5 categories: ai-tell, archaic-verb, translationese, punctuation, pronoun-overuse"
    rationale: "Covers all major AI-tell patterns identified in research (KatFishNet, 나무위키)"
  - id: severity-levels
    choice: "4 severity levels: critical, high, medium, low"
    rationale: "Allows fine-grained control over detection sensitivity"
  - id: dialogue-skip
    choice: "Skip narration patterns when found inside dialogue"
    rationale: "Intentional character voice may use formal/AI-like patterns"
  - id: banned-priority-1
    choice: "Banned expressions get priority 1 (highest) in directives"
    rationale: "AI-tell patterns are most damaging to prose authenticity"
metrics:
  duration: 13 min
  completed: 2026-02-05
---

# Phase 03 Plan 02: Banned Expression Detection Summary

**One-liner:** AI-tell banned expression detection with 24 patterns across 5 categories, integrated into Quality Oracle with severity-based directive generation.

## What Was Built

### 1. Banned Expressions Data (`src/korean/data/banned-expressions.json`)

Comprehensive categorized database of 24 AI-tell patterns:

| Category | Count | Examples | Severity |
|----------|-------|----------|----------|
| ai-tell | 5 | 한편, 그러나, 따라서, 결과적으로, 특히 | critical |
| archaic-verb | 5 | 하였다, 되었다, 것이었다, 인 것이다 | critical |
| translationese | 7 | 에 있어서, 로 인한, 하지 않을 수 없다 | high |
| punctuation | 4 | , 그리고 , , 그러나 , , 따라서 | medium |
| pronoun-overuse | 3 | 그녀는, 그는, 그것은 | low |

Each pattern includes:
- Korean pattern string (regex or literal)
- Multiple replacement suggestions
- Context (narration/dialogue/any)
- Reason explaining why it's banned

### 2. Detection Engine (`src/korean/banned-expressions.ts`)

Exported functions:
- `detectBannedExpressions(content, contextType, minSeverity)` - Main detection
- `getSuggestedReplacement(match)` - Get best replacement
- `getBannedReason(match)` - Get human-readable reason
- `countBySeverity(matches)` - Statistics by severity
- `countByCategory(matches)` - Statistics by category
- `getUniqueCategories(matches)` - Unique categories in matches
- `BANNED_EXPRESSIONS` - Flattened expression list

Key features:
- Dialogue context detection (quotes-based)
- Severity filtering (critical/high/medium/low)
- Regex and literal pattern support
- Results sorted by severity then position

### 3. Quality Oracle Integration

Added to `analyzeChapter`:
- New options: `detectBannedExpressions`, `bannedExpressionMinSeverity`
- Section 1b: Banned expression analysis after filter words
- Generates `banned-expression` directives (up to 2 critical/high, 1 medium)
- Assessment includes `bannedExpressions` field with counts
- Verdict fails if any critical or >2 high severity matches

Directive format:
```typescript
{
  type: 'banned-expression',
  priority: 1, // Highest priority
  issue: 'AI체 표현 "한편," 발견 (ai-tell: AI 특유의 문단 전환어)',
  instruction: '"한편,"를 "그때"(으)로 대체하거나 문장을 자연스럽게 재구성하세요.'
}
```

### 4. Prose Surgeon Routing

Added model routing for `banned-expression`:
- Model: Sonnet (mechanical replacement task)
- Temperature: 0.4 (low creativity, precise fixes)
- Max scope: 1 paragraph

### 5. Test Suite (`tests/korean/banned-expressions.test.ts`)

28 comprehensive tests covering:
- Data loading and structure validation
- AI-tell pattern detection
- Archaic verb detection
- Translationese detection
- Dialogue context handling
- Severity filtering
- Sorting behavior
- Replacement suggestions
- Statistics functions
- Integration scenarios

## Verification Evidence

```bash
$ npm test -- tests/korean/banned-expressions.test.ts
 PASS  tests/korean/banned-expressions.test.ts (28 tests) 10ms

$ npm test
 Test Files  16 passed (16)
 Tests       453 passed (453)

$ npx tsc --noEmit
# No errors
```

## Key Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Skip dialogue | Yes | Character voice may intentionally use formal/AI-like patterns |
| Priority 1 | Banned > filter words | AI-tell is more damaging to authenticity than filter words |
| 2+1 limit | Max 2 critical/high, 1 medium per pass | Prevents overwhelming surgeon with too many fixes |
| Sonnet model | Low temp (0.4) | Mechanical replacement, not creative rewriting |

## Files Changed

| File | Change |
|------|--------|
| `src/korean/data/banned-expressions.json` | Created - 24 patterns in 5 categories |
| `src/korean/banned-expressions.ts` | Created - Detection engine with 7 exports |
| `src/pipeline/types.ts` | Modified - Added `banned-expression` to DirectiveType |
| `src/pipeline/quality-oracle.ts` | Modified - Added detection, directives, verdict logic |
| `src/pipeline/prose-surgeon.ts` | Modified - Added routing and scope limit |
| `tests/korean/banned-expressions.test.ts` | Created - 28 tests |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] TypeScript import syntax**
- **Found during:** Task 1
- **Issue:** JSON import used `assert` instead of `with` keyword
- **Fix:** Changed to `import ... with { type: 'json' }`
- **Files modified:** `src/korean/banned-expressions.ts`

**2. [Rule 2 - Missing Critical] Korean directive types**
- **Found during:** Task 2
- **Issue:** Pipeline types missing `honorific-violation` and `texture-enrichment`
- **Fix:** Linter auto-added to `DirectiveType` and routing tables
- **Files modified:** `src/pipeline/types.ts`, `src/pipeline/prose-surgeon.ts`

## Next Phase Readiness

Plan 03-02 is complete. Ready for:
- **03-03 (Texture Library):** Already integrated with Quality Oracle
- **03-04 (Honorific Matrix):** Already integrated with Quality Oracle
- **04-01 (Advanced Quality):** Can build on banned expression detection

No blockers identified.
