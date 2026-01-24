---
name: evaluate
description: |
  Triggers when user wants to evaluate chapter or act quality.
  <example>5화 평가해줘</example>
  <example>품질 검사</example>
  <example>evaluate chapter 5</example>
  <example>/evaluate 5</example>
  <example>현재 막 평가</example>
  <example>5-10화 일괄 평가</example>
user-invocable: true
---

# /evaluate - 품질 평가

챕터 또는 막 단위 품질을 다차원적으로 평가합니다.

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
