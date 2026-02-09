# Evaluate Skill - Usage Examples

## Basic Chapter Evaluation

### Evaluate Specific Chapter

```
/evaluate 5
```

Evaluates chapter 5 and saves detailed review:

**Expected output:**
```
Evaluating Chapter 5...

Loading context...
✓ Chapter text (5,234 chars)
✓ Chapter plot
✓ Character profiles: 민준, 서연
✓ World data
✓ Style guide

Calling critic agent...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Chapter 5 Review
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Scores:
  Narrative Quality    23/25 ███████████████████████░░
  Plot Consistency     22/25 ██████████████████████░░░
  Character Consistency 21/25 █████████████████████░░░░
  Setting Adherence    21/25 █████████████████████░░░░
  ────────────────────────────────────────
  Total                87/100 (Grade: A)

✓ PASSED (threshold: 85)

Strengths:
  • Excellent sentence rhythm with varied structure
  • All 4 plot points from outline hit effectively
  • 민준 and 서연 maintain consistent voices
  • Good sensory detail in office scenes

Weaknesses:
  • Minor repetitive phrasing ("그녀는...") in Scene 1
  • Scene 2 transition feels slightly abrupt
  • One instance of unclear pronoun reference

Suggestions:
  • Vary sentence openings in Scene 1, paragraph 3
  • Add 1-2 sentences bridging Scene 1 to Scene 2
  • Clarify pronoun "그" in Scene 3, paragraph 2

Review saved to:
  reviews/chapter_reviews/chapter_005_review.json

History updated:
  reviews/history/chapter_005.json (version 1)
```

### Evaluate Current Chapter

```
/evaluate
```

Without arguments, evaluates current chapter based on ralph-state.json:

**Expected output:**
```
Current chapter: 12 (from ralph-state.json)

Evaluating Chapter 12...

[Same detailed output as above]
```

## Act Evaluation

### Evaluate Current Act

```
/evaluate
```

When used after act completion or for multi-chapter review:

**Expected output:**
```
Determining evaluation scope...
Current act: 1 (Chapters 1-15)

Evaluate entire Act 1? [Y/n]
```

**User confirms:**
```
Evaluating Act 1 (Chapters 1-15)...

[Chapter 1/15] ░░░░░░░░░░░░░░░░░░░░ 0%
Calling critic agent...
✓ Chapter 1: 92/100 (S)

[Chapter 2/15] █░░░░░░░░░░░░░░░░░░░ 7%
Calling critic agent...
✓ Chapter 2: 88/100 (A)

[Chapter 3/15] ██░░░░░░░░░░░░░░░░░░ 13%
Calling critic agent...
✓ Chapter 3: 91/100 (S)

...

[Chapter 15/15] ████████████████████ 100%
Calling critic agent...
✓ Chapter 15: 93/100 (S)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Act 1 Review
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Chapter Scores:
  Ch 1:  92 (S) ████████████████████████░
  Ch 2:  88 (A) ███████████████████████░░
  Ch 3:  91 (S) ████████████████████████░
  Ch 4:  85 (A) ██████████████████████░░░
  Ch 5:  87 (A) ███████████████████████░░
  Ch 6:  90 (S) ████████████████████████░
  Ch 7:  89 (A) ███████████████████████░░
  Ch 8:  86 (A) ███████████████████████░░
  Ch 9:  88 (A) ███████████████████████░░
  Ch 10: 81 (B) █████████████████████░░░░
  Ch 11: 90 (S) ████████████████████████░
  Ch 12: 92 (S) ████████████████████████░
  Ch 13: 87 (A) ███████████████████████░░
  Ch 14: 89 (A) ███████████████████████░░
  Ch 15: 93 (S) █████████████████████████

Average: 88.3/100 (Grade: A)

Distribution:
  S (90-100): ████████ 6 chapters (40%)
  A (80-89):  ████████████ 8 chapters (53%)
  B (70-79):  ██ 1 chapter (7%)
  C (60-69):  0 chapters
  F (0-59):   0 chapters

Cross-Chapter Consistency: 92/100 ✓
  ✓ No plot holes detected
  ✓ Character arcs coherent
  ✓ Timeline consistent

Pacing Analysis: 85/100
  Overall rhythm: Good
  Slow chapters: Chapter 10
  Fast chapters: None
  Recommendation: Light revision of Chapter 10

Character Arcs:
  민준: 95/100 ✓
    Trajectory: Clear progression from reluctant to invested
    Notes: Well-executed setup arc

  서연: 90/100 ⚠
    Trajectory: Good growth but minor gap
    Notes: Chapter 7-8 transition feels abrupt
    Suggestion: Add bridging introspection in Chapter 8

Act Strengths:
  • Strong setup establishing world and relationships
  • Consistent character voices throughout
  • Good pacing with effective act climax
  • Clear genre positioning (romance/contract dating)

Act Weaknesses:
  • Chapter 10 pacing dip in middle
  • 서연 character arc gap between Ch 7-8
  • Minor: Office setting details vary slightly

Act Suggestions:
  • Consider light revision of Chapter 10 for pacing
  • Add 1-2 paragraphs in Chapter 8 for 서연 introspection
  • Standardize office description (floor count, layout)

Report saved to:
  reviews/act_1_review.json
```

## Re-evaluation After Revision

### Version Comparison

After revising a chapter:

```
/revise 5
```

Then re-evaluate:

```
/evaluate 5
```

**Expected output:**
```
Evaluating Chapter 5...

Previous evaluation detected!
Version 1: 72/100 (B) - 2026-01-21 10:00:00

Evaluating current version...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Chapter 5 Review (Version 2)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Scores:
  Narrative Quality    23/25 ███████████████████████░░ (+5)
  Plot Consistency     22/25 ██████████████████████░░░ (+4)
  Character Consistency 21/25 █████████████████████░░░░ (+3)
  Setting Adherence    21/25 █████████████████████░░░░ (+3)
  ────────────────────────────────────────
  Total                87/100 (Grade: A) (+15)

✓ PASSED (threshold: 85)

Comparison with Version 1:
  Score improvement: 72 → 87 (+15 points)
  Grade improvement: B → A

Improvements:
  • Scene 2 pacing significantly improved
  • Dialogue much more natural and character-appropriate
  • Reduced exposition, better show-don't-tell balance

Remaining suggestions:
  • Minor polish on Scene 1 openings

Version History:
  v1: 72/100 (B) - Failed
  v2: 87/100 (A) - Passed ✓

History updated:
  reviews/history/chapter_005.json (version 2)
```

## Integration with Write-All

### Multi-Validator Evaluation

When called from write-all:

```
[Within /write-all loop, after chapter 5 written]
```

**Expected output:**
```
[Chapter 5/50] ━━━━━━━━━━━━━━━━━━━━━━ 10%

Writing Chapter 5...
✓ Written: 5,456 characters

Multi-validator evaluation...

Running validators in parallel...
├─ critic...
├─ beta-reader...
└─ genre-validator...

Results:

┌─────────────────┬──────────┬───────────┬────────┐
│ Validator       │ Score    │ Threshold │ Status │
├─────────────────┼──────────┼───────────┼────────┤
│ critic          │ 88/100   │ 85        │ ✓ PASS │
│ beta-reader     │ 82/100   │ 75        │ ✓ PASS │
│ genre-validator │ 93/100   │ 90        │ ✓ PASS │
└─────────────────┴──────────┴───────────┴────────┘

Consensus: ALL VALIDATORS PASSED ✓

Individual Feedback:

Critic:
  • Strong narrative quality
  • Plot points covered well
  • Minor: One scene transition abrupt

Beta-Reader:
  • High engagement predicted (82%)
  • No predicted drop-off points
  • Emotional peaks effective

Genre-Validator:
  • Romance elements clear
  • Contract dating trope well-executed
  • Tone consistent with genre

<promise>CHAPTER_5_DONE</promise>

Proceeding to Chapter 6...
```

### Validation Failure with Diagnostic

```
[Within /write-all loop, chapter fails validation]
```

**Expected output:**
```
[Chapter 10/50] ━━━━━━━━━━━━━━━━━━━━━━ 20%

Writing Chapter 10...
✓ Written: 5,234 characters

Multi-validator evaluation...

Results:

┌─────────────────┬──────────┬───────────┬────────┐
│ Validator       │ Score    │ Threshold │ Status │
├─────────────────┼──────────┼───────────┼────────┤
│ critic          │ 78/100   │ 85        │ ✗ FAIL │
│ beta-reader     │ 76/100   │ 75        │ ✓ PASS │
│ genre-validator │ 92/100   │ 90        │ ✓ PASS │
└─────────────────┴──────────┴───────────┴────────┘

Consensus: FAILED (1/3 validators failed)

Generating diagnostic...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Diagnostic Report
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Severity: MAJOR
Root Cause: Character motivation unclear in Scene 3

Failed Validators: critic

Specific Issues:

  [Critic - Plot Consistency]
  Location: Scene 3, when 서연 agrees to extend contract
  Problem: Decision feels unmotivated
  Context: In previous chapters, 서연 wanted to end the arrangement
  Suggested Fix: Add internal monologue showing her reasoning
  Effort: Moderate (2-3 paragraphs)

Revision Strategy: Focused
Add character introspection before key decision point.

Entering revision loop (attempt 1/3)...
```

## Special Cases

### Evaluating Chapter 1

Chapter 1 has higher thresholds:

```
/evaluate 1
```

**Expected output:**
```
Evaluating Chapter 1...

Note: Chapter 1 uses elevated thresholds:
  critic: 90 (vs standard 85)
  beta-reader: 80 (vs standard 75)
  genre-validator: 95 (vs standard 90)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Chapter 1 Review
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Scores:
  Narrative Quality    24/25 ████████████████████████░
  Plot Consistency     23/25 ███████████████████████░░
  Character Consistency 23/25 ███████████████████████░░
  Setting Adherence    22/25 ██████████████████████░░░
  ────────────────────────────────────────
  Total                92/100 (Grade: S)

✓ PASSED (Chapter 1 threshold: 90)

Chapter 1 Checklist:
  ✓ Strong hook in first paragraph (crisis present)
  ✓ Protagonist uniqueness shown within 3 paragraphs
  ✓ Promise of payoff within 3-5 chapters established
  ✓ Genre core elements clearly visible
  ✓ Predicted retention rate: 85% (target: ≥75%)

All Chapter 1 requirements met!

Strengths:
  • Excellent opening hook (immediate conflict)
  • 민준 character uniqueness clear from start
  • Strong genre positioning (contract romance)
  • High reader retention predicted

Weaknesses:
  • Minor: Office description could be more vivid

Suggestions:
  • Add 1-2 sensory details to office setting
```

### Evaluating Adult Content Chapter

```
/evaluate 7
```

If chapter 7 was generated with Grok:

**Expected output:**
```
Evaluating Chapter 7...

Note: Chapter generated with Grok API (adult content)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Chapter 7 Review
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Scores:
  Narrative Quality    22/25 ██████████████████████░░░
  Plot Consistency     23/25 ███████████████████████░░
  Character Consistency 21/25 █████████████████████░░░░
  Setting Adherence    20/25 ████████████████████░░░░░
  ────────────────────────────────────────
  Total                86/100 (Grade: A)

✓ PASSED (threshold: 85)

Adult Content Notes:
  • Intimacy scene handled with appropriate sensuality
  • Emotional context maintained throughout
  • Character consent and agency clear

Strengths:
  • Intimate scene feels earned (good buildup)
  • Character emotions authentic and complex
  • Good balance of sensuality and plot progression

Weaknesses:
  • Minor: Setting description sparse in latter half
  • One transition feels slightly rushed

Suggestions:
  • Add environmental detail in Scene 2
  • Slow transition between emotional beats

Warning: Editing with Claude may censor content.
For adult content revisions, use '/revise-grok 7'
```

## Batch Evaluation

### Evaluate Chapter Range

```
/evaluate 5-10
```

Evaluate chapters 5 through 10:

**Expected output:**
```
Evaluating chapters 5-10...

[Chapter 5/6] ███░░░░░░░░░░░░░░░░░ 17%
✓ Chapter 5: 87/100 (A)

[Chapter 6/6] ██████░░░░░░░░░░░░░░ 33%
✓ Chapter 6: 90/100 (S)

[Chapter 7/6] █████████░░░░░░░░░░░ 50%
✓ Chapter 7: 86/100 (A)

[Chapter 8/6] ████████████░░░░░░░░ 67%
✓ Chapter 8: 85/100 (A)

[Chapter 9/6] ███████████████░░░░░ 83%
✓ Chapter 9: 88/100 (A)

[Chapter 10/6] ████████████████████ 100%
✓ Chapter 10: 81/100 (B)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Batch Evaluation Summary
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Chapters evaluated: 6 (5-10)
Average score: 86.2/100 (Grade: A)

Distribution:
  S (90-100): 1 chapter (17%)
  A (80-89):  4 chapters (67%)
  B (70-79):  1 chapter (17%)

Outliers:
  Highest: Chapter 6 (90/100)
  Lowest: Chapter 10 (81/100)

Recommendation:
  Consider revision of Chapter 10 to bring closer to average.
```

## Error Recovery

### Missing Chapter

```
/evaluate 5
```

If chapter doesn't exist:

**Expected output:**
```
ERROR: Chapter file not found
Path: novels/novel_20250117_143052/chapters/chapter_005.md

Cannot evaluate chapter that hasn't been written.

Actions:
1. Write the chapter: /write 5
2. Check path: Verify project is correct
```

### Missing Plot File

```
/evaluate 5
```

If plot file missing:

**Expected output:**
```
WARNING: Plot file not found
Path: chapters/chapter_005.json

Proceeding with limited evaluation:
  ✓ Narrative Quality (scored)
  ✗ Plot Consistency (N/A - no plot to compare)
  ✓ Character Consistency (scored)
  ✓ Setting Adherence (scored)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Chapter 5 Review (Limited)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Scores:
  Narrative Quality    23/25 ███████████████████████░░
  Plot Consistency     N/A   (no plot file available)
  Character Consistency 21/25 █████████████████████░░░░
  Setting Adherence    21/25 █████████████████████░░░░
  ────────────────────────────────────────
  Total                65/75 (87% - equivalent to A)

Note: Score adjusted for missing plot evaluation.
```

### Critic Agent Failure

```
/evaluate 5
```

If critic agent crashes:

**Expected output:**
```
Calling critic agent...
ERROR: Critic agent failed to respond
Reason: Timeout after 120 seconds

Attempting fallback evaluation...

Using legacy scoring method...
✓ Heuristic analysis complete

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Chapter 5 Review (Fallback Mode)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Scores (Heuristic):
  Narrative Quality    ~22/25
  Plot Consistency     ~20/25
  Character Consistency ~20/25
  Setting Adherence    ~19/25
  ────────────────────────────────────────
  Total                ~81/100 (Grade: B)

⚠ Warning: Fallback evaluation is less accurate.
Detailed feedback not available.

Recommendation: Retry evaluation when critic agent is available.
```

## Best Practices

### When to Evaluate

**After writing each chapter:**
```
/write 5
/evaluate 5
```

Immediate feedback prevents accumulating issues.

**After revisions:**
```
/revise 5
/evaluate 5
```

Verify improvements worked.

**At act boundaries:**
```
/evaluate  # Evaluates entire current act
```

Ensure act-level coherence.

### Interpreting Results

**Grade S (90-100)**: Excellent, ready to proceed

**Grade A (80-89)**: Good, minor polish optional

**Grade B (70-79)**: Acceptable but revision recommended
- Focus on lowest-scoring dimension
- Address specific suggestions

**Grade C (60-69)**: Needs improvement
- Targeted revision required
- Re-evaluate after changes

**Grade F (<60)**: Major issues
- Consider rewrite
- May need plot adjustment

### Acting on Feedback

```
/evaluate 5
```

Results show low plot consistency (18/25).

**Action:**
```
# Read the detailed feedback
cat reviews/chapter_reviews/chapter_005_review.json

# Revise with focus on plot
/revise 5 --notes="Fix plot consistency issues from evaluation"

# Re-evaluate
/evaluate 5
```
