# Write Skill - Usage Examples

## Basic Chapter Writing

### Write Next Chapter

```
/write
```

This writes the next chapter based on `ralph-state.json`:
- Reads current chapter number
- Loads plot from `chapters/chapter_XXX.json`
- Applies context budget system
- Writes chapter using novelist agent
- Saves to `chapters/chapter_XXX.md`

**Expected output:**
```
Writing Chapter 5...

Context loaded:
✓ Style guide (8.2K tokens)
✓ Chapter plot (12.5K tokens)
✓ Previous 3 summaries (18.3K tokens)
✓ Character profiles: 민준, 서연 (22.1K tokens)
✓ World context (14.8K tokens)

Total: 75.9K / 120K tokens

Calling novelist agent...
Chapter 5 written: 5,234 characters
Saved to: novels/novel_20250117_143052/chapters/chapter_005.md

Running quality review...
editor feedback: Minor adjustments needed
- Dialogue feels slightly stiff in Scene 2
- Add more sensory detail in opening

Would you like to revise? [Y/n]
```

### Write Specific Chapter

```
/write 5
```

Explicitly write chapter 5:
- Useful for rewriting existing chapters
- Can run out of order (though not recommended)
- Automatically detects if chapter already exists

**Expected output:**
```
Chapter 5 already exists!

Options:
1. Overwrite (previous version backed up)
2. Create variant (chapter_005_v2.md)
3. Cancel

Choose [1/2/3]:
```

### Write Range

```
/write 5-10
```

Write chapters 5 through 10 in sequence:
- Useful for batch writing
- Updates context after each chapter
- Auto-generates summaries between chapters

**Expected output:**
```
Writing chapters 5-10...

[1/6] Chapter 5...
✓ Written (5,234 chars)
✓ Summary generated

[2/6] Chapter 6...
✓ Written (5,512 chars)
✓ Summary generated

[3/6] Chapter 7...
🔞 Adult content detected in plot!
Switching to Grok API...
✓ Written (5,891 chars)
✓ Summary generated

...

All chapters 5-10 completed!
Ready for evaluation.
```

## Adult Content Writing

### Auto-Detection

```
/write 5
```

If chapter 5 plot contains keywords like "베드신", "밀애", etc:

**Expected output:**
```
Writing Chapter 5...

🔞 Adult content keywords detected: [베드신, 관능적]
Switching to xAI Grok API for unrestricted content...

Grok API parameters:
- Model: grok-4-1-fast-reasoning
- Temperature: 0.85
- Max tokens: 8192

Generating...
✓ Chapter written: 5,678 characters
✓ Adult content preserved

Saved to: chapters/chapter_005.md

Note: This chapter was generated with Grok API.
Editing with Claude may censor content.
Use /revise-grok for adult content edits.
```

### Manual Grok Override

```
/write 5 --grok
```

Force Grok API even without keywords:
- Useful for potentially sensitive content
- Bypasses censorship preemptively
- Same quality as Claude for regular content

### Direct Grok Prompt

```
/write-grok "민준과 서연의 첫 키스 장면. 감정이 폭발하는 순간을 섬세하게."
```

Directly call Grok with custom prompt:
- Bypasses plot loading
- Full creative control
- Output saved to current chapter

## Advanced Options

### Focus Mode

#### Dialogue Focus

```
/write 5 --focus=dialogue
```

Emphasize character interactions:
- Loads more character personality data
- Reduces environmental description
- Increases conversation weight

**Example output difference:**

*Normal:*
```
민준은 창밖을 바라보며 말했다. "나는 그저..."
서연이 그의 말을 가로막았다. "그만해요."
```

*Dialogue Focus:*
```
"나는 그저..." 민준의 목소리가 떨렸다.
"그만해요." 서연이 차갑게 끊었다. "더 이상 듣고 싶지 않아요."
민준은 주먹을 쥐었다. "들어주세요. 제발."
"왜요?" 서연의 눈에 눈물이 맺혔다. "왜 이제 와서?"
```

#### Description Focus

```
/write 5 --focus=description
```

Rich environmental and sensory detail:
- More world/setting context loaded
- Slower pacing
- Immersive atmosphere

**Example output:**
```
봄비가 창문을 타고 흘러내렸다. 빗방울이 만드는 소리는 마치 누군가 작은 손톱으로 유리를 긁는 것 같았다. 민준은 커피잔을 들었다. 김이 피어오르며 그의 얼굴을 흐릿하게 감쌌다. 원두의 쌉싸름한 향이 코끝을 스쳤다.
```

#### Action Focus

```
/write 5 --focus=action
```

Fast-paced, kinetic writing:
- Short, punchy sentences
- Minimal introspection
- High tension

**Example output:**
```
민준이 달렸다. 뒤에서 발소리가 들렸다. 가까워지고 있다. 모퉁이를 돌았다. 막다른 길. 그가 돌아섰다. 남자가 다가왔다. 민준은 주먹을 쥐었다.
```

### Style Variation

#### Suspenseful

```
/write 5 --style=suspenseful
```

Tension and uncertainty:
- Ominous foreshadowing
- Unreliable information
- Cliffhanger emphasis

#### Comedic

```
/write 5 --style=comedic
```

Lighthearted tone:
- Increased internal monologue
- Absurd situations
- Character banter

#### Emotional

```
/write 5 --style=emotional
```

Deep feelings:
- Rich internal thoughts
- Metaphorical language
- Slower pacing for impact

## Revision Scenarios

### Rewrite with Feedback

After evaluation reveals issues:

```
/evaluate 5
```

Output shows:
```
Chapter 5 Review:
- Plot Consistency: 22/25
- Character: 20/25
- Writing Quality: 18/25
Total: 60/100 (C - Needs Improvement)

Issues:
- Pacing too slow in middle
- Dialogue feels unnatural
- Ending lacks impact
```

Then revise:
```
/write 5 --revise
```

Agent loads:
- Previous chapter version
- Critic feedback
- Specific revision notes

Focuses on identified issues.

### Manual Revision Notes

```
/write 5 --revise --notes="더 많은 감정 표현, 대화를 자연스럽게"
```

Provide explicit revision guidance.

## Error Recovery

### Missing Plot

```
/write 5
```

If `chapters/chapter_005.json` doesn't exist:

```
ERROR: Plot file not found for Chapter 5
Path: chapters/chapter_005.json

Required action:
Run '/outline 5' to create plot first.

Or generate all plots:
Run '/outline-all' to create plots for all chapters.
```

### Context Budget Issue

```
/write 5
```

If context is too large:

```
WARNING: Context budget exceeded (135K / 120K)

Automatic reductions applied:
✗ Previous chapter full text (saved 15K)
✓ Previous summaries (kept 18K)
✓ Character profiles (reduced to active only: 20K)
✗ World context (reduced to current location: 8K)

New total: 119K / 120K

Continue with reduced context? [Y/n]
```

### Grok API Failure

```
/write 5
```

Adult content detected but Grok fails:

```
🔞 Adult content detected: [베드신]
Attempting Grok API...

ERROR: Grok API request failed
Reason: API key not configured

Fallback options:
1. Configure XAI_API_KEY in .env
2. Continue with Claude (may censor content)
3. Cancel and revise plot to remove adult content

Choose [1/2/3]:
```

## Integration Examples

### With Ralph Loop

```
/write-all
```

Ralph loop calls `/write` repeatedly:

```
Ralph Loop: Writing all chapters (1-50)

[Chapter 1/50]
/write 1
✓ Written
✓ Quality: 88/100 (A)
<promise>CHAPTER_1_DONE</promise>

[Chapter 2/50]
/write 2
✓ Written
✓ Quality: 72/100 (B)
<promise>CHAPTER_2_DONE</promise>

[Chapter 3/50]
/write 3
🔞 Adult content detected
✓ Written (Grok API)
✓ Quality: 78/100 (B)
<promise>CHAPTER_3_DONE</promise>

...
```

### With Evaluation

```
/write 5
/evaluate 5
```

Standard workflow:

```
Writing Chapter 5...
✓ Written: 5,234 chars

Evaluating Chapter 5...
Running critic agent...

Results:
- Plot: 24/25
- Character: 23/25
- Quality: 22/25
- Setting: 21/25
Total: 90/100 (S - Excellent)

No revision needed!
```

### With Consistency Check

```
/write 10
/consistency-check 8-10
```

Verify recent chapters:

```
Checking consistency: Chapters 8-10...

Character tracking:
✓ 민준: Consistent personality
✗ 서연: Motivation shift unclear (Ch 8 → Ch 10)

Timeline:
✓ No chronological conflicts
✓ Scene transitions logical

Worldbuilding:
✗ Company name changed: "신성기획" (Ch 8) → "신성그룹" (Ch 10)

Recommendation: Review Chapter 10, fix company name
```

## Best Practices

### Sequential Writing

Always write in order when possible:

```
# Good
/write 1
/write 2
/write 3

# Avoid
/write 5
/write 2
/write 8
```

Context quality degrades with gaps.

### Batch with Breaks

For long sessions, batch with reviews:

```
/write 1-5      # First batch
/evaluate 1-5   # Check quality
/write 6-10     # Second batch
/evaluate 6-10  # Check quality
```

Prevents compounding errors.

### Use Ralph for Full Novels

```
/write-all
```

Automated quality gates prevent bad chapters from accumulating.
