---
name: analyze-engagement
description: 회차별 몰입도 분석 및 독자 이탈 위험 구간 탐지
user-invocable: true
---

# analyze-engagement

Analyzes chapter-by-chapter reader engagement and identifies drop-off risk zones.

## Quick Start

```
/analyze-engagement [chapter]
```

- `chapter` (optional): Chapter number to analyze. Defaults to current chapter.

## What It Does

1. **Beta-Reader Analysis** → Evaluates engagement from reader perspective
2. **Tension Tracking** → Analyzes tension curve across scenes
3. **Drop-off Detection** → Identifies risky paragraphs where readers might leave
4. **Emotional Beats** → Extracts key emotional impact moments
5. **Cliffhanger Evaluation** → Measures ending strength

## Output

- Overall engagement score (0-100)
- Tension curve visualization (ASCII chart)
- Drop-off risk zones with specific paragraph locations
- Emotional beat moments (심쿵, 긴장, 호기심, etc.)
- Cliffhanger strength rating (0-10)
- Actionable recommendations

## Agent Workflow

1. **beta-reader** (opus) → Engagement analysis with drop-off risks
2. **engagement-optimizer** (sonnet) → Scene-by-scene tension levels & pacing
3. Results combined → `validations/engagement/chapter_{N}_engagement.json`

## Scoring Guide

| Score | Rating | Action |
|-------|--------|--------|
| 90-100 | EXCELLENT | Perfect - proceed as is |
| 80-89 | GOOD | Minor tweaks recommended |
| 70-79 | ACCEPTABLE | Some improvements needed |
| 60-69 | NEEDS WORK | Fix problem zones |
| 0-59 | POOR | Major revision or rewrite |

## Drop-off Risk Levels

| Risk % | Severity | Action |
|--------|----------|--------|
| 0-5% | LOW | Good - maintain |
| 6-10% | MODERATE | Watch - improve if possible |
| 11-20% | HIGH | Warning - fix required |
| 21%+ | CRITICAL | Urgent - immediate fix |

## Integration Points

- Works with `/write` - auto-analyze after writing
- Works with `/revise` - measure improvement after revision
- Works with `/evaluate` - engagement score included in quality metrics

## Learn More

- [Detailed Guide](references/detailed-guide.md) - Full agent prompts and JSON schemas
- [Usage Examples](examples/example-usage.md) - Real-world analysis examples
