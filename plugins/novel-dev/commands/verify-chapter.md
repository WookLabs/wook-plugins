---
description: Run parallel validation on a chapter with 3 validators and confidence filtering
argument-hint: <chapter_number>
allowed-tools:
  - Read
  - Task
  - Glob
model: sonnet
---

# Verify Chapter Command

Orchestrates parallel validation using 3 specialized validators with confidence-based result filtering.

## Workflow

### Step 1: Launch Parallel Validators

Launch all 3 validators simultaneously:

```
Task(subagent_type="novel-dev:critic", model="opus", prompt="...")
Task(subagent_type="novel-dev:beta-reader", model="sonnet", prompt="...")
Task(subagent_type="novel-dev:genre-validator", model="sonnet", prompt="...")
```

### Step 2: Collect Results

Wait for all validators to complete and collect:
- Scores (0-100 for each)
- Issues found (with confidence 0-100)
- Recommendations

### Step 3: Apply Confidence Filter

Only include issues with confidence >= 75.

Thresholds:
| Validator | Normal | Chapter 1 |
|-----------|--------|-----------|
| critic | ≥85 | ≥90 |
| beta-reader | ≥75 | ≥80 |
| genre-validator | ≥90 | ≥95 |

### Step 4: Generate Verdict

```json
{
  "chapter": N,
  "verdict": "PASS" | "FAIL",
  "scores": {
    "critic": 87,
    "beta_reader": 78,
    "genre_validator": 92
  },
  "passed_validators": ["critic", "beta_reader", "genre_validator"],
  "failed_validators": [],
  "high_confidence_issues": [
    {
      "source": "critic",
      "issue": "...",
      "confidence": 85,
      "severity": "high"
    }
  ],
  "summary": "..."
}
```

### Step 5: Output

If PASS: "✅ Chapter N VERIFIED - All validators passed"
If FAIL: "❌ Chapter N FAILED - [list failed validators with scores]"

## Implementation Details

### Parallel Execution Pattern

```javascript
// Launch all 3 validators at once
const tasks = [
  Task({
    subagent_type: "novel-dev:critic",
    model: "opus",
    prompt: `Evaluate Chapter ${chapter_number}:

    Read:
    - chapters/chapter_${chapter_number}.md
    - chapters/chapter_${chapter_number}.json
    - meta/characters.json
    - meta/world.json

    Provide:
    1. Overall score (0-100)
    2. Issues with confidence (0-100) and severity
    3. Specific recommendations

    Return JSON format.`
  }),

  Task({
    subagent_type: "novel-dev:beta-reader",
    model: "sonnet",
    prompt: `Analyze reader engagement for Chapter ${chapter_number}:

    Read:
    - chapters/chapter_${chapter_number}.md

    Provide:
    1. Engagement score (0-100)
    2. Predicted retention rate
    3. Hook effectiveness
    4. Issues with confidence (0-100)

    Return JSON format.`
  }),

  Task({
    subagent_type: "novel-dev:genre-validator",
    model: "sonnet",
    prompt: `Validate genre compliance for Chapter ${chapter_number}:

    Read:
    - chapters/chapter_${chapter_number}.md
    - meta/world.json
    - meta/brief.json

    Provide:
    1. Compliance score (0-100)
    2. Genre violations with confidence (0-100)
    3. Recommendations

    Return JSON format.`
  })
];

// Execute in parallel and wait for all results
const [criticResult, betaResult, genreResult] = await Promise.all(tasks);
```

### Confidence Filtering

```javascript
// Collect all issues
const allIssues = [
  ...criticResult.issues.map(i => ({...i, source: 'critic'})),
  ...betaResult.issues.map(i => ({...i, source: 'beta-reader'})),
  ...genreResult.issues.map(i => ({...i, source: 'genre-validator'}))
];

// Filter by confidence threshold
const highConfidenceIssues = allIssues.filter(issue =>
  issue.confidence >= 75
);

// Group by severity
const criticalIssues = highConfidenceIssues.filter(i => i.severity === 'critical');
const majorIssues = highConfidenceIssues.filter(i => i.severity === 'major');
const minorIssues = highConfidenceIssues.filter(i => i.severity === 'minor');
```

### Threshold Logic

```javascript
const isChapter1 = chapter_number === 1;

const thresholds = {
  critic: isChapter1 ? 90 : 85,
  beta_reader: isChapter1 ? 80 : 75,
  genre_validator: isChapter1 ? 95 : 90
};

const passed = {
  critic: criticResult.score >= thresholds.critic,
  beta_reader: betaResult.score >= thresholds.beta_reader,
  genre_validator: genreResult.score >= thresholds.genre_validator
};

const allPassed = Object.values(passed).every(p => p === true);
const verdict = allPassed ? "PASS" : "FAIL";
```

### Output Format

```json
{
  "chapter": 5,
  "verdict": "PASS",
  "timestamp": "2026-01-24T10:30:00Z",
  "scores": {
    "critic": 87,
    "beta_reader": 78,
    "genre_validator": 92
  },
  "thresholds": {
    "critic": 85,
    "beta_reader": 75,
    "genre_validator": 90
  },
  "passed_validators": ["critic", "beta_reader", "genre_validator"],
  "failed_validators": [],
  "high_confidence_issues": [
    {
      "source": "critic",
      "issue": "Dialogue feels slightly forced in the confrontation scene",
      "confidence": 78,
      "severity": "minor",
      "location": "paragraph 12"
    }
  ],
  "issues_by_severity": {
    "critical": 0,
    "major": 0,
    "minor": 1
  },
  "summary": "Chapter 5 passes all validation thresholds. Only 1 minor issue detected with moderate confidence. Overall quality is strong across all validators.",
  "recommendations": [
    "Consider revising dialogue in paragraph 12 for more natural flow",
    "Maintain current pacing and tension build-up"
  ]
}
```

## Usage

```bash
/verify-chapter 5
```

## Integration with write-all

The write-all skill should call verify-chapter after each chapter is written:

```
/write 5
/verify-chapter 5
  -> If PASS: continue to chapter 6
  -> If FAIL: /revise 5 with diagnostic, then /verify-chapter 5 again
```

## Notes

- All 3 validators MUST pass for overall PASS
- Never claim verification without running all validators
- Include numerical scores in all outputs
- Save results to `reviews/verifications/chapter_${N}_verification.json`
- Circuit breaker activates after 3 consecutive failures with same issue
