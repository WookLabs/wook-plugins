---
name: 18-evaluate
description: 챕터/막 단위 다차원 품질 평가
user-invocable: true
---

# /evaluate - 품질 평가

챕터 또는 막 단위 품질을 다차원적으로 평가합니다.

## 평가 모드

| 모드 | 설명 | 에이전트 수 | 비용 |
|------|------|------------|------|
| 기본 (default) | 4축 표준 평가 | 3 | 낮음 |
| `--deep` | 8축 심층 평가 | 8 | 높음 |
| `--quick` | 빠른 평가 (haiku) | 1 | 최소 |
| `--axis=PLOT,CHA` | 특정 축만 평가 | 1-8 | 가변 |

### 사용 예시
```
/evaluate 5                    -- 5화 표준 평가
/evaluate 5 --deep             -- 5화 8축 심층 평가
/evaluate 5 --quick            -- 5화 빠른 평가
/evaluate 5 --deep --axis=PLOT,CHA  -- 5화 특정 축만 심층 평가
```

## Quick Start
```bash
/evaluate 5      # 5화 평가
/evaluate        # 현재 막 전체 평가
/evaluate 5-10   # 5~10화 일괄 평가
```

## Evaluation Framework

### 4-Dimensional Scoring (100 points total)

1. **Narrative/Prose Quality** (25 pts)
   - Prose style, sentence rhythm
   - Description quality and balance
   - Technical execution (grammar, spelling)

2. **Plot Consistency** (25 pts)
   - Coverage of planned plot points
   - Logical causality and flow
   - Foreshadowing and payoff

3. **Character Consistency** (25 pts)
   - Voice and speech patterns
   - Motivation alignment with profile
   - Natural character development

4. **Setting Adherence** (25 pts)
   - World rules consistency
   - Environment matching established descriptions
   - Worldbuilding details

### Grading Scale

| Score | Grade | Meaning | Recommendation |
|-------|-------|---------|----------------|
| 90-100 | S | Publication quality | Publish as-is |
| 80-89 | A | Excellent | Minor polish optional |
| 70-79 | B | Good/Acceptable | Light revision |
| 60-69 | C | Needs improvement | Targeted revision |
| 0-59 | F | Significant issues | Major rewrite |

## Key Features

### Version History
- Tracks all evaluations for each chapter
- Compares scores across revisions
- Shows improvement trajectory

### Multi-Validator Mode
For write-all integration:
- critic (quality)
- beta-reader (engagement)
- genre-validator (compliance)

### Act-Level Analysis
- Cross-chapter consistency checking
- Pacing analysis across chapters
- Character arc completeness verification

## Deep Evaluation Mode (--deep)

When `--deep` flag is passed, the evaluation delegates to the LongStoryEval 8-axis framework:
- **Objective axes (5)**: PLOT, CHA, WRI, THE, WOR
- **Subjective axes (3)**: EMO, ENJ, EXP
- **8 parallel agents** for comprehensive analysis
- **Radar chart visualization** of all 8 dimensions
- **Actionable improvement items** with file:line references

For full details on the 8-axis framework, see `skills/deep-evaluate/SKILL.md`.

## Documentation

**Detailed Guide**: See `references/detailed-guide.md`
- Evaluation criteria breakdown
- Critic agent integration
- Multi-validator consensus
- Version history system
- Review file formats

**Usage Examples**: See `examples/example-usage.md`
- Basic evaluation workflows
- Re-evaluation after revision
- Multi-validator mode examples
- Act-level evaluation
- Error recovery scenarios
