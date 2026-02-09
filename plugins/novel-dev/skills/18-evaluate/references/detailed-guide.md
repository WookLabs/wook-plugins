# Evaluate Skill - Detailed Guide

## Evaluation Framework

The evaluate skill provides multi-dimensional quality assessment of novel chapters and acts using the critic agent.

### Evaluation Criteria

Each chapter is evaluated on four 25-point dimensions:

#### 1. Narrative/Prose Quality (25 points)

**Focus**: Writing craft and readability

**Scoring breakdown**:
- **Prose style** (10 pts): Sentence variety, rhythm, voice
- **Description quality** (8 pts): Sensory detail, vividness, balance
- **Technical execution** (7 pts): Grammar, spelling, formatting

**Example high score (23/25)**:
```
Strengths:
- Excellent sentence rhythm with varied length and structure
- Rich sensory descriptions without being overwrought
- Clean prose with strong verb choices
- No grammar or technical issues

Minor notes:
- One instance of repetitive phrasing ("그녀는..." 3x in paragraph)
```

**Example low score (15/25)**:
```
Issues:
- Monotonous sentence structure (mostly compound sentences)
- Sparse description, scenes lack grounding
- Multiple grammar errors (subject-verb agreement)
- Overuse of adverbs
```

#### 2. Plot Consistency (25 points)

**Focus**: Adherence to planned plot and logical progression

**Scoring breakdown**:
- **Plot point coverage** (12 pts): All planned beats hit
- **Causality** (8 pts): Events flow logically
- **Foreshadowing/payoff** (5 pts): Setup matches execution

**Example high score (24/25)**:
```
Strengths:
- All 4 plot points from outline executed
- Character decisions follow naturally from previous events
- Nice callback to Chapter 3 setup (계약서 reveal)

Minor notes:
- Rushed transition in Scene 2 could be smoother
```

**Example low score (18/25)**:
```
Issues:
- Missed plot point: "민준 discovers company secret" not addressed
- Character decision feels unmotivated (why did 서연 agree?)
- Timeline confusion: This should be Tuesday but text says weekend
```

#### 3. Character Consistency (25 points)

**Focus**: Characters behave according to established profiles

**Scoring breakdown**:
- **Voice consistency** (10 pts): Speech patterns, vocabulary
- **Motivation alignment** (10 pts): Actions match goals/personality
- **Development** (5 pts): Growth feels natural

**Example high score (22/25)**:
```
Strengths:
- 민준's formal speech pattern maintained
- 서연's growth feels earned (previous chapters built to this)
- Supporting characters (지훈) stay in established roles

Minor notes:
- 서연's sudden confidence in Scene 3 needs more internal justification
```

**Example low score (16/25)**:
```
Issues:
- 민준 uses casual speech (반말) but profile says he's always formal
- 서연 acts confidently but character arc isn't there yet
- 지훈 personality shift unexplained (funny → serious)
```

#### 4. Setting Adherence (25 points)

**Focus**: Worldbuilding consistency and immersion

**Scoring breakdown**:
- **World rules** (10 pts): Magic/tech/social rules consistent
- **Environment** (8 pts): Settings match established descriptions
- **Details** (7 pts): Small touches reinforce world

**Example high score (23/25)**:
```
Strengths:
- Office hierarchy accurately portrayed (Korean corporate culture)
- 신성그룹 building layout consistent with Chapter 1
- Small details reinforce setting (명찰, 직급)

Minor notes:
- Coffee shop name changed from "카페모카" to "모카카페"
```

**Example low score (17/25)**:
```
Issues:
- Character takes subway but world.json says city has no subway
- Company rank system contradicts earlier chapters
- Season is spring but references winter clothing
```

### Total Score Interpretation

| Range | Grade | Meaning | Action |
|-------|-------|---------|--------|
| 90-100 | S | Publication quality | Publish as-is |
| 80-89 | A | Excellent | Minor polish |
| 70-79 | B | Good, acceptable | Light revision |
| 60-69 | C | Needs improvement | Targeted revision |
| 0-59 | F | Significant issues | Major rewrite |

## Evaluation Targets

### Single Chapter Evaluation

```
/evaluate 5
```

Evaluates chapter 5 only.

**Process**:
1. Load chapter text from `chapters/chapter_005.md`
2. Load plot from `chapters/chapter_005.json`
3. Load character profiles for characters in chapter
4. Load world/setting data
5. Call critic agent with all context
6. Save results to `reviews/chapter_reviews/chapter_005_review.json`
7. Update history at `reviews/history/chapter_005.json`

### Current Act Evaluation

```
/evaluate
```

With no arguments, evaluates all chapters in current act.

**Process**:
1. Determine current act from `ralph-state.json`
2. Get chapter range for act from `plot/structure.json`
3. Evaluate each chapter individually
4. Generate act-level aggregate report
5. Save to `reviews/act_{N}_review.json`

**Act report includes**:
- Individual chapter scores
- Act average
- Consistency across chapters
- Pacing analysis
- Character arc completeness

## Review File Formats

### Chapter Review JSON

```json
{
  "chapter": 5,
  "timestamp": "2026-01-21T10:30:00Z",
  "version": 1,
  "scores": {
    "narrative_quality": 23,
    "plot_consistency": 22,
    "character_consistency": 21,
    "setting_adherence": 21,
    "total": 87
  },
  "grade": "A",
  "passed": true,
  "threshold": 85,
  "feedback": {
    "strengths": [
      "Excellent sentence rhythm and varied structure",
      "All plot points covered effectively",
      "Characters maintain consistent voices"
    ],
    "weaknesses": [
      "Minor repetitive phrasing in Scene 1",
      "Scene 2 transition slightly abrupt"
    ],
    "suggestions": [
      "Vary sentence openings in Scene 1 paragraph 3",
      "Add transitional sentence between Scene 1 and 2"
    ]
  },
  "detailed_breakdown": {
    "narrative_quality": {
      "score": 23,
      "prose_style": 9,
      "description_quality": 8,
      "technical_execution": 6,
      "notes": "Strong prose with minor repetition issue"
    },
    "plot_consistency": {
      "score": 22,
      "plot_coverage": 11,
      "causality": 8,
      "foreshadowing": 3,
      "notes": "All beats hit, good logic, light on setup"
    },
    "character_consistency": {
      "score": 21,
      "voice": 9,
      "motivation": 8,
      "development": 4,
      "notes": "Voices consistent, one unmotivated action"
    },
    "setting_adherence": {
      "score": 21,
      "world_rules": 9,
      "environment": 7,
      "details": 5,
      "notes": "Good adherence, minor location description variance"
    }
  }
}
```

### Act Review JSON

```json
{
  "act": 1,
  "chapters": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
  "timestamp": "2026-01-21T15:00:00Z",
  "chapter_scores": [
    { "chapter": 1, "score": 92, "grade": "S" },
    { "chapter": 2, "score": 88, "grade": "A" },
    { "chapter": 3, "score": 91, "grade": "S" },
    // ...
  ],
  "aggregate": {
    "average_score": 88.3,
    "grade": "A",
    "distribution": {
      "S": 6,
      "A": 8,
      "B": 1,
      "C": 0,
      "F": 0
    }
  },
  "act_specific": {
    "cross_chapter_consistency": {
      "score": 92,
      "issues": []
    },
    "pacing": {
      "score": 85,
      "notes": "Good overall, Chapter 10 slightly slow",
      "slow_chapters": [10],
      "fast_chapters": []
    },
    "character_arcs": {
      "민준": {
        "completeness": 95,
        "trajectory": "clear",
        "notes": "Setup arc well executed"
      },
      "서연": {
        "completeness": 90,
        "trajectory": "clear",
        "notes": "Good progression, minor gap in Ch 7-8"
      }
    }
  },
  "feedback": {
    "act_strengths": [
      "Strong setup and world introduction",
      "Consistent character voices throughout",
      "Good pacing with effective act climax"
    ],
    "act_weaknesses": [
      "Chapter 10 pacing dip",
      "서연 arc gap in middle"
    ],
    "act_suggestions": [
      "Consider light revision of Chapter 10 for pacing",
      "Add bridging introspection in Chapter 8 for 서연"
    ]
  }
}
```

## Version History System

The evaluate skill tracks evaluation history for each chapter, allowing comparison across revisions.

### History File Structure

Location: `reviews/history/chapter_{N}.json`

```json
{
  "chapter": 5,
  "versions": [
    {
      "version": 1,
      "timestamp": "2026-01-21T10:00:00Z",
      "score": 72,
      "grade": "B",
      "passed": false,
      "issues": ["Pacing too slow", "Dialogue stiff"],
      "revision_notes": "Need to improve Scene 2"
    },
    {
      "version": 2,
      "timestamp": "2026-01-21T10:30:00Z",
      "score": 87,
      "grade": "A",
      "passed": true,
      "improvements": [
        "Scene 2 pacing improved",
        "Dialogue more natural"
      ],
      "changes_from_v1": [
        "Rewrote Scene 2 dialogue",
        "Cut 200 words of exposition"
      ]
    }
  ],
  "current_version": 2,
  "score_progression": [72, 87],
  "grade_progression": ["B", "A"]
}
```

### History Updates

**First evaluation**: Creates new history file with version 1

**Re-evaluation**: Appends new version to existing history

```javascript
function updateHistory(chapterNum, newReview) {
  const historyPath = `reviews/history/chapter_${chapterNum}.json`;

  let history;
  if (fileExists(historyPath)) {
    history = readJSON(historyPath);
    history.versions.push({
      version: history.current_version + 1,
      timestamp: newReview.timestamp,
      score: newReview.scores.total,
      grade: newReview.grade,
      passed: newReview.passed,
      // ... other fields
    });
    history.current_version++;
  } else {
    history = {
      chapter: chapterNum,
      versions: [{
        version: 1,
        timestamp: newReview.timestamp,
        score: newReview.scores.total,
        // ...
      }],
      current_version: 1
    };
  }

  // Update progression arrays
  history.score_progression.push(newReview.scores.total);
  history.grade_progression.push(newReview.grade);

  writeJSON(historyPath, history);
}
```

## Critic Agent Integration

The evaluate skill delegates to the `novel-dev:critic` agent.

### Critic Prompt Template

```javascript
const criticPrompt = `
# Chapter ${chapterNum} Evaluation

## Chapter Text
${chapterText}

## Planned Plot
${chapterPlot}

## Character Profiles
${characterProfiles}

## World/Setting
${worldData}

## Style Guide
${styleGuide}

## Evaluation Task

Please evaluate this chapter on four 25-point dimensions:

1. **Narrative/Prose Quality (25 pts)**
   - Prose style: 10 pts
   - Description quality: 8 pts
   - Technical execution: 7 pts

2. **Plot Consistency (25 pts)**
   - Plot point coverage: 12 pts
   - Causality: 8 pts
   - Foreshadowing/payoff: 5 pts

3. **Character Consistency (25 pts)**
   - Voice consistency: 10 pts
   - Motivation alignment: 10 pts
   - Development: 5 pts

4. **Setting Adherence (25 pts)**
   - World rules: 10 pts
   - Environment: 8 pts
   - Details: 7 pts

**Total: 100 points**

## Output Format

Return JSON:
{
  "scores": {
    "narrative_quality": <number>,
    "plot_consistency": <number>,
    "character_consistency": <number>,
    "setting_adherence": <number>,
    "total": <sum>
  },
  "grade": "<S/A/B/C/F>",
  "passed": <boolean>,
  "feedback": {
    "strengths": [<array of strings>],
    "weaknesses": [<array of strings>],
    "suggestions": [<array of strings>]
  },
  "detailed_breakdown": { /* ... */ }
}
`;
```

### Task Invocation

```javascript
const review = await Task({
  subagent_type: "novel-dev:critic",
  model: "opus",  // High-quality evaluation
  prompt: criticPrompt
});

// Save review
writeJSON(`reviews/chapter_reviews/chapter_${chapterNum}_review.json`, review);

// Update history
updateHistory(chapterNum, review);
```

## Multi-Validator Mode

For write-all integration, evaluate skill can run multi-validator consensus.

### Validator Roles

1. **Critic**: Overall quality (existing)
2. **Beta-Reader**: Engagement and retention
3. **Genre-Validator**: Genre compliance

### Consensus Evaluation

```javascript
async function multiValidate(chapterNum) {
  const [criticResult, betaResult, genreResult] = await Promise.all([
    Task({
      subagent_type: "novel-dev:critic",
      prompt: buildCriticPrompt(chapterNum)
    }),
    Task({
      subagent_type: "novel-dev:beta-reader",
      prompt: buildBetaPrompt(chapterNum)
    }),
    Task({
      subagent_type: "novel-dev:genre-validator",
      prompt: buildGenrePrompt(chapterNum)
    })
  ]);

  // Check thresholds
  const thresholds = getThresholds(chapterNum);
  const passed =
    criticResult.score >= thresholds.critic &&
    betaResult.engagement_score >= thresholds.beta &&
    genreResult.compliance_score >= thresholds.genre;

  // Save comprehensive review
  const review = {
    chapter: chapterNum,
    timestamp: new Date().toISOString(),
    validators: {
      critic: criticResult,
      beta_reader: betaResult,
      genre_validator: genreResult
    },
    consensus: {
      passed: passed,
      all_scores: {
        critic: criticResult.score,
        engagement: betaResult.engagement_score,
        compliance: genreResult.compliance_score
      }
    }
  };

  writeJSON(`reviews/chapter_reviews/chapter_${chapterNum}_review.json`, review);

  return review;
}
```

## Usage in Write-All Loop

```javascript
// After writing chapter
const chapter = await writeChapter(chapterNum);

// Multi-validator evaluation
const review = await multiValidate(chapterNum);

if (review.consensus.passed) {
  console.log(`<promise>CHAPTER_${chapterNum}_DONE</promise>`);
  continue;
}

// Failed - enter revision loop
for (let retry = 0; retry < 3; retry++) {
  const diagnostic = generateDiagnostic(review);

  // Revise with diagnostic
  await reviseChapter(chapterNum, diagnostic);

  // Re-evaluate
  const newReview = await multiValidate(chapterNum);

  if (newReview.consensus.passed) {
    break;
  }

  // Check circuit breaker
  if (sameIssue3Times(diagnostic)) {
    await handleCircuitBreaker(chapterNum);
    break;
  }
}
```

## Evaluation Reports

### Chapter Report (Console Output)

```
Evaluating Chapter 5...

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
  • Excellent sentence rhythm and variety
  • All plot points covered effectively
  • Characters maintain consistent voices

Weaknesses:
  • Minor repetitive phrasing in Scene 1
  • Scene 2 transition slightly abrupt

Suggestions:
  • Vary sentence openings in Scene 1 para 3
  • Add transitional sentence between scenes

Review saved to:
  reviews/chapter_reviews/chapter_005_review.json
History updated:
  reviews/history/chapter_005.json (version 2)
```

### Act Report (Console Output)

```
Evaluating Act 1 (Chapters 1-15)...

Processing chapters: ████████████████████ 100%

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
  S (90-100): 6 chapters (40%)
  A (80-89):  8 chapters (53%)
  B (70-79):  1 chapter  (7%)

Pacing Analysis:
  Overall: Good (85/100)
  Slow chapters: Chapter 10
  Fast chapters: None

Character Arcs:
  민준: 95/100 (clear trajectory)
  서연: 90/100 (minor gap Ch 7-8)

Act Strengths:
  • Strong setup and world introduction
  • Consistent character voices
  • Good climax at end of act

Act Weaknesses:
  • Chapter 10 pacing dip
  • 서연 arc gap in middle

Suggestions:
  • Consider light revision of Chapter 10
  • Add bridging introspection in Chapter 8

Report saved to:
  reviews/act_1_review.json
```

## Error Handling

### Missing Chapter File

```
/evaluate 5

ERROR: Chapter file not found
Path: chapters/chapter_005.md

Cannot evaluate chapter that hasn't been written.
Run '/write 5' first.
```

### Missing Plot File

```
/evaluate 5

WARNING: Plot file not found
Path: chapters/chapter_005.json

Proceeding with evaluation (plot consistency scoring disabled)
```

**Adjusted scoring**: Plot consistency dimension receives N/A, total out of 75 points instead of 100.

### Critic Agent Failure

```
/evaluate 5

Calling critic agent...
ERROR: Critic agent failed to respond

Attempting fallback evaluation...
✓ Using legacy scoring method

Note: Results may be less detailed than standard evaluation.
```
