<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-01-18 -->

# retry

## Purpose

Quality gate and retry logic system for novel chapter generation. Implements escalating retry strategies based on quality scores, determining when and how to retry content generation until quality thresholds are met. Includes scoring breakdown analysis, lowest-scoring section identification, and Korean language prompt generation.

## Key Files

- **index.ts** - Module barrel export; re-exports quality gate utilities
- **quality-gate.ts** - Core retry logic with scoring, strategy determination, and prompt generation

## Quality Score System

Quality scores are calculated on a scale of 0-100 with category breakdowns:

```typescript
interface QualityScore {
  total: number;  // 0-100 overall score
  breakdown: [
    { category: string, score: number, feedback: string }
  ]
}
```

Common scoring categories may include:
- narrative_quality
- plot_consistency
- character_consistency
- setting_adherence

## Retry Strategies

The system implements four escalating strategies:

1. **Attempt 1**: `revise` - Simple refinement prompt in Korean
2. **Attempt 2**: `revise_with_feedback` - Refinement with detailed category feedback
3. **Attempt 3**: `partial_rewrite` - Target rewrite of lowest-scoring section
4. **Attempt 4+**: `user_intervention` - Manual review required

## Key Functions

- **determineRetryStrategy(context)** - Returns appropriate strategy based on attempt number
- **getLowestScoringSection(score)** - Identifies weakest scoring category
- **buildRetryPrompt(strategy, context)** - Generates Korean language retry instruction
- **shouldContinueRetry(context)** - Checks if retry loop should continue

## For AI Agents

When working in retry/:
1. All prompts are generated in Korean (화 = chapter, 수정 = revise, 작성 = write)
2. Quality score breakdown is essential for strategy selection - always pass complete breakdown
3. The threshold value determines when quality is acceptable - default appears to be 70-80 range
4. Retry context tracks both attempt number AND last quality score
5. Lowest-scoring section is always targeted for partial rewrites to maximize quality improvement
6. User intervention message includes threshold and max retries for context

## For Quality Analysis

When receiving quality scores:
- Check that all required categories are present in breakdown
- Calculate improvement margin (current score vs. threshold)
- Consider category-specific weakness for targeted prompting
- Determine if current attempt allows continued retry or requires intervention

## Dependencies

- No external dependencies; pure business logic
- Designed to work with any scoring system that implements the QualityScore interface

## Integration Points

- **Ralph Loop**: Calls this module to determine retry strategy
- **Quality Evaluation**: Receives scoring results to drive retry decisions
- **Novel Generation**: Uses generated prompts to guide LLM content regeneration

## Example Usage

```typescript
// Check if retry is needed
if (shouldContinueRetry(retryContext)) {
  const strategy = determineRetryStrategy(retryContext);
  const prompt = buildRetryPrompt(strategy, retryContext);
  // Use prompt in next generation attempt
}
```
