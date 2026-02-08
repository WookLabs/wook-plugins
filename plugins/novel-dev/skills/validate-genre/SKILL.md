---
name: validate-genre
description: 장르 적합성 검증 및 상업적 요소 확인
user-invocable: true
---

# validate-genre

Validates that a chapter meets genre requirements, commercial elements, and cliche usage appropriateness.

## Quick Start

```
/validate-genre [chapter]
```

- `chapter` (optional): Chapter to validate. Defaults to current chapter.

## What It Does

1. **Genre Requirements Check** - Verifies genre-specific mandatory elements
2. **Commercial Elements Analysis** - Hook density, cliffhanger, dialogue ratio, length
3. **Cliche Usage Analysis** - Identifies cliches, checks overuse, evaluates freshness
4. **Emotional Continuity** - Ensures consistency with previous chapter context
5. **Compliance Score** - 0-100 points with specific recommendations

## Genre-Specific Checks

### Romance
- Heart flutter moments (심쿵 포인트) - min 1 per chapter
- Push-pull tension (밀당)
- Emotional progression
- Relationship advancement

### Fantasy
- World-building elements
- Magic/ability system usage
- Adventure/growth elements

### Thriller/Mystery
- Sustained tension
- Clues and hints (떡밥)
- Plot twists

### Contemporary
- Realistic dialogue
- Period accuracy
- Social context

## Commercial Factors

- **Hook density**: 3-4 hooks per chapter (recommended)
- **Cliffhanger**: Must be present (critical for web novels)
- **Dialogue ratio**: Genre-appropriate percentage
- **Episode length**: Genre-appropriate word count

## Output

- Compliance score (0-100)
- Verdict: GENRE_COMPLIANT / NEEDS_IMPROVEMENT / GENRE_MISMATCH
- Required elements checklist with line numbers
- Commercial factors analysis
- Cliche usage report
- Specific improvement recommendations with locations

## Multi-Genre Support

For projects with multiple genres (e.g., Romance Fantasy):
- Checks all genre requirements
- Provides separate compliance scores
- Evaluates genre balance

## Agent Workflow

**genre-validator** (sonnet) → Comprehensive genre compliance analysis with line-by-line evidence

## Next Steps

- **GENRE_COMPLIANT**: Ready to publish or proceed to next chapter
- **NEEDS_IMPROVEMENT**: Run `/revise {chapter}` then re-validate
- **GENRE_MISMATCH**: Full chapter rewrite recommended

## Learn More

- [Detailed Guide](references/detailed-guide.md) - Full validation criteria and agent prompts
- [Usage Examples](examples/example-usage.md) - Real validation results with fixes
