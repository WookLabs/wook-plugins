---
name: check-retention
description: |
  Triggers when user wants to predict reader retention rates between chapters.
  <example>회차간 이탈률 예측해줘</example>
  <example>1화 독자 유지율 체크해줘</example>
  <example>retention rate 확인</example>
  <example>check retention for chapter 1</example>
  <example>predict drop-off between chapters</example>
user-invocable: true
---

# check-retention

Predicts reader retention rates between chapters, especially critical for chapter 1→2 drop-off.

## Quick Start

```
/check-retention [chapter]
/check-retention --first
```

- `[chapter]` (optional): Analyze specific chapter. Defaults to last 3 chapters.
- `--first`: Focus on chapter 1→2 retention (most critical)

## What It Does

Analyzes reader retention factors across chapters:

1. **Hook Strength** (25%) - First 3 paragraphs impact
2. **Cliffhanger** (25%) - End-of-chapter pull to next
3. **Character Appeal** (20%) - Likability and relatability
4. **Pacing** (15%) - Tempo without lulls
5. **Genre Compliance** (15%) - Meeting genre expectations

## Retention Targets

| Transition | Target | Status |
|------------|--------|--------|
| 1 → 2 | 75%+ | Critical |
| 2 → 10 | 65%+ | Important |
| 10+ | 60%+ | Acceptable |

## Output

- Predicted retention % for each chapter transition
- Weighted breakdown by factor (hook, cliffhanger, character, pacing, genre)
- Specific improvement actions with location (para N)
- Projected impact after fixes
- Series fatigue check (10+ chapters)

## Special Focus: Chapter 1

First chapter retention is critical - 75%+ required:
- First paragraph impact analysis
- First 3 paragraphs hook check
- Promise to reader evaluation
- Mid-chapter re-engagement points
- Ending cliffhanger strength

## Agent Workflow

**beta-reader** (opus) → Evaluates each retention factor with specific scores and evidence

## Example Flow

```
Analyze chapters 1, 2, 3
→ Chapter 1→2: 78% (PASS)
→ Chapter 2→3: 71% (PASS)
→ Chapter 3→4: 68% (WARNING)
→ Trend: Declining
→ Actions: Urgent fixes for Chapter 3
```

## Integration Points

- Auto-runs after `/write` for new chapters
- Triggers `/revise` suggestions when retention < 70%
- Feeds into `/evaluate` overall quality score

## Learn More

- [Detailed Guide](references/detailed-guide.md) - Retention calculation formulas and agent prompts
- [Usage Examples](examples/example-usage.md) - Real retention predictions with fixes
