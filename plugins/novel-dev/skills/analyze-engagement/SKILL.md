---
name: analyze-engagement
description: "Use this skill when analyzing per-chapter engagement and detecting reader drop-off risk. Triggers on: '몰입도 분석', 'engagement analysis'."
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
- Works with `/review` - measure improvement after revision and evaluate quality metrics

## Retention Analysis (integrated from /check-retention)

회차 간 독자 유지율을 예측합니다:

| 구간 | 목표 유지율 | 설명 |
|------|-----------|------|
| 1→2화 | 75%+ | 첫 인상 → 지속 판단 |
| 2→10화 | 65%+ | 초기 정착 구간 |
| 10화+ | 60%+ | 안정 구간 |

- **Genre Compliance 가중치**: 15% (장르별 필수 요소 충족이 유지율에 직접 영향)
- **Chapter 1 특별 분석**: 1화는 강화된 기준 적용 (첫인상 최적화)

## Emotion Arc Analysis (integrated from /emotion-arc)

감정 곡선을 분석하여 emotional beats를 최적화합니다:
- 6가지 기본 아크 패턴 비교 (상승, 하강, 상승-하강, 하강-상승, 롤러코스터, 평탄)
- 장면별 감정 강도 매핑
- 감정 전환점(emotional turning points) 식별
- 감정 곡선과 긴장 곡선의 상관관계 분석

## Learn More

- [Detailed Guide](references/detailed-guide.md) - Full agent prompts and JSON schemas
- [Usage Examples](examples/example-usage.md) - Real-world analysis examples
