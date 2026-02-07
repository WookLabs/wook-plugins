# Phase 5: Self-Improvement - Research

**Researched:** 2026-02-06
**Domain:** Exemplar auto-accumulation, quality trend tracking, statistical regression detection
**Confidence:** HIGH

## Summary

Phase 5 adds two autonomous capabilities to the novel-dev system: (1) automatically accumulating the best passages into the Style Library as new exemplars, and (2) tracking quality metrics chapter-by-chapter to detect regression trends. Both features build directly on the existing Quality Oracle (`src/pipeline/quality-oracle.ts`), Style Library (`src/style-library/`), and the multi-stage revision pipeline (`src/quality/`).

The exemplar auto-accumulation system (SELF-01) requires a passage extraction and scoring pipeline that identifies top passages from chapters that pass quality evaluation, classifies them using the existing `classifyExemplar()` function, and adds them to the Style Library using the existing `addExemplar()` and `saveLibrary()` storage functions. The key design decision is what constitutes "high enough quality" for auto-promotion -- this should use the Quality Oracle's assessment scores combined with the Style Analyzer's `computeStyleMatch()` to ensure exemplars align with the reference style.

The quality trend tracking system (SELF-02) requires a persistent data store for per-chapter quality metrics, a rolling average calculator, and a regression detection algorithm. The existing `chapter-history.schema.json` already tracks `total_score` per version but lacks the granular per-dimension scores needed. A new `quality-trend.schema.json` is needed. For regression detection, an EWMA (Exponentially Weighted Moving Average) approach combined with z-score alerting provides the right sensitivity without false positives.

**Primary recommendation:** Build both features as pure TypeScript modules under `src/self-improvement/` with no external dependencies beyond `simple-statistics` for z-score and linear regression math, reusing all existing Style Library and Quality Oracle APIs.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| simple-statistics | ^7.8 | z-score, linear regression, mean, stddev | Zero-dependency, TypeScript types included, battle-tested for exactly this kind of statistical analysis |
| vitest | ^3.0 (existing) | Testing | Already in project devDependencies |
| zod | ^3.25 (existing) | Runtime schema validation | Already in project dependencies |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none needed) | - | - | All other functionality built on existing codebase modules |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| simple-statistics | Hand-roll math | simple-statistics is 0-dep, tiny, well-tested; hand-rolling z-score/regression is error-prone |
| simple-statistics | danfojs | Massively overweight for this use case (~20MB); we need 5 functions, not a dataframe library |
| EWMA regression detection | CUSUM | EWMA is simpler to implement and better for gradual drift; CUSUM better for abrupt shifts. Novel quality degrades gradually, so EWMA is the right choice |

**Installation:**
```bash
npm install simple-statistics
```

## Architecture Patterns

### Recommended Project Structure
```
src/
  self-improvement/
    types.ts              # QualitySnapshot, TrendData, RegressionAlert, ExemplarCandidate types
    exemplar-collector.ts  # Passage extraction + scoring + promotion to Style Library
    quality-tracker.ts     # Per-chapter quality recording + persistence
    regression-detector.ts # Rolling average, EWMA, z-score alerting
    index.ts              # Public API re-exports
schemas/
  quality-trend.schema.json  # Persistent quality trend data
tests/
  self-improvement/
    exemplar-collector.test.ts
    quality-tracker.test.ts
    regression-detector.test.ts
```

### Pattern 1: Passage-to-Exemplar Pipeline
**What:** A pipeline that extracts the best passages from a chapter, scores them, and conditionally promotes them to the Style Library.
**When to use:** After a chapter passes the Quality Oracle evaluation (verdict === 'PASS').

```typescript
// Source: Derived from existing codebase patterns
interface ExemplarCandidate {
  /** The passage text (500-2000 chars per StyleExemplar constraint) */
  content: string;
  /** Quality Oracle assessment scores for this passage */
  qualityScore: number;
  /** Style match score against reference profile (0-100) */
  styleMatchScore: number;
  /** Combined score used for threshold comparison */
  combinedScore: number;
  /** Auto-classified category from classifyExemplar() */
  category: ExemplarCategory;
  /** Chapter number this passage came from */
  sourceChapter: number;
  /** Paragraph range in original chapter */
  paragraphRange: [number, number];
}

// Promotion threshold: combinedScore >= 85
// combinedScore = 0.6 * qualityScore + 0.4 * styleMatchScore
```

### Pattern 2: Quality Snapshot per Chapter
**What:** After each chapter evaluation, record a comprehensive quality snapshot with all dimension scores.
**When to use:** Every time `analyzeChapter()` is called on a completed chapter.

```typescript
// Source: Derived from QualityAssessment in src/pipeline/types.ts
interface QualitySnapshot {
  chapterNumber: number;
  timestamp: string;  // ISO 8601
  version: number;    // revision version
  overallScore: number;
  dimensions: {
    proseQuality: number;
    sensoryGrounding: number;
    filterWordDensity: number;  // inverted: 100 - penalty
    rhythmVariation: number;
    characterVoice: number;
    transitionQuality: number;
    honorificConsistency?: number;
    koreanTexture?: number;
    styleAlignment?: number;  // from computeStyleMatch if profile exists
  };
  verdict: 'PASS' | 'REVISE';
  stageResults?: StageResult[];  // from multi-stage pipeline if available
}
```

### Pattern 3: EWMA-Based Regression Detection
**What:** Use Exponentially Weighted Moving Average with z-score alerting to detect quality regression.
**When to use:** After recording each new QualitySnapshot to check if quality is declining.

```typescript
// Source: Statistical process control best practices (EWMA method)
interface TrendAnalysis {
  /** Rolling average of last N chapters (configurable, default 5) */
  rollingAverage: number;
  /** EWMA value (lambda=0.2, giving 80% weight to history) */
  ewma: number;
  /** Linear regression slope over recent window */
  trendSlope: number;
  /** Whether regression is detected */
  regressionDetected: boolean;
  /** Alert severity */
  alertLevel: 'none' | 'warning' | 'critical';
  /** Human-readable alert message */
  alertMessage?: string;
  /** Per-dimension trends for detailed diagnostics */
  dimensionTrends: Record<string, { slope: number; declining: boolean }>;
}

// Alert thresholds:
// - warning: current score < EWMA - 1.5 * stdDev (z-score < -1.5)
// - critical: current score < EWMA - 2.0 * stdDev (z-score < -2.0)
// - OR: linear regression slope < -1.0 over last 5 chapters
```

### Pattern 4: Deduplication Before Promotion
**What:** Before adding a passage as an exemplar, check for semantic/structural similarity with existing exemplars.
**When to use:** Inside the exemplar promotion pipeline, to prevent library bloat.

```typescript
// Source: Existing style-analyzer computeStylometrics pattern
function isDuplicate(
  candidate: string,
  existingExemplars: StyleExemplar[],
  threshold: number = 0.85
): boolean {
  // Compare stylometric fingerprints
  const candidateMetrics = computeStylometrics(candidate);
  for (const existing of existingExemplars) {
    const existingMetrics = computeStylometrics(existing.content);
    const similarity = computeMetricSimilarity(candidateMetrics, existingMetrics);
    if (similarity > threshold) return true;
  }
  return false;
}
```

### Anti-Patterns to Avoid
- **Promoting every passing passage:** Without a high threshold (>=85 combined score), the library will fill with mediocre exemplars that dilute the signal. Quality must be exceptional, not just passing.
- **Storing quality trends in memory only:** Trends must persist to JSON files so they survive across sessions. The novel-dev system is session-based (Claude conversations).
- **Using fixed thresholds without adaptation:** The rolling average IS the adaptive baseline. Alert against the rolling average, not against fixed numbers.
- **Ignoring library size limits:** Uncapped exemplar growth degrades retrieval quality. Implement a soft cap (e.g., 50 exemplars per scene_type) with lowest-score eviction.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Exemplar ID generation | Custom ID logic | `generateExemplarId()` in storage.ts | Already handles collision avoidance and genre-based naming |
| Exemplar classification | Manual scene_type/tone detection | `classifyExemplar()` in classifier.ts | 5-dimension taxonomy with Korean-specific patterns |
| Style matching scores | Custom metric comparison | `computeStyleMatch()` in style-analyzer.ts | Already computes per-aspect scores and deviations |
| Prose quality scoring | Re-implement quality checks | `analyzeChapter()` in quality-oracle.ts | Already computes all needed dimension scores |
| Exemplar CRUD | Custom file I/O | `addExemplar()`, `saveLibrary()`, `loadLibrary()` in storage.ts | Already handles metadata updates, genre extraction |
| Statistical functions | Hand-rolled math | `simple-statistics` (mean, standardDeviation, zScore, linearRegression) | Edge cases in variance calculation, numerical stability |
| State file backup | Manual backup logic | `withStateBackup()` in src/state/backup.ts | Already handles backup-restore on failure |

**Key insight:** Phase 5 is primarily an integration phase. Almost all the computational building blocks exist. The new code orchestrates existing functions into two autonomous loops: accumulate-best and detect-regression.

## Common Pitfalls

### Pitfall 1: Exemplar Quality Inflation
**What goes wrong:** Auto-accumulated exemplars gradually lower the quality bar because they were "best of what we had" not "objectively excellent."
**Why it happens:** The promotion threshold is relative to the rolling average rather than absolute.
**How to avoid:** Use a DUAL threshold: (1) absolute minimum combinedScore >= 85, AND (2) passage must be in top 10% of all evaluated passages. Store the promotion threshold in the quality-trend data so it can be reviewed.
**Warning signs:** Library size growing faster than 1 exemplar per 5 chapters.

### Pitfall 2: False Regression Alerts
**What goes wrong:** The system alerts on natural variation (e.g., an action chapter scores differently than a dialogue chapter).
**Why it happens:** Different scene types have inherently different quality profiles.
**How to avoid:** Track trends per-dimension, not just overall score. Use a generous z-score threshold (-1.5 for warning, not -1.0). Require at least 5 data points before enabling alerts. Alert on sustained decline (2+ consecutive below-average), not single dips.
**Warning signs:** Alert firing on every other chapter.

### Pitfall 3: Library Bloat
**What goes wrong:** After 50+ chapters, the library has 200+ auto-accumulated exemplars, degrading retrieval relevance.
**Why it happens:** No cap on exemplar count per category.
**How to avoid:** Implement soft caps per scene_type (default: 50). When exceeded, evict the lowest-scoring exemplar of the same scene_type. Track provenance (`source: 'auto-accumulated'` vs `source: 'curated'`) and never evict curated exemplars.
**Warning signs:** `getLibraryStats()` showing unbalanced distribution.

### Pitfall 4: Stale Trend Data After Rewrites
**What goes wrong:** User rewrites chapters 5-10, but trend data still shows old scores.
**Why it happens:** Quality snapshots are append-only with version numbers, but trend calculations use latest-version-only.
**How to avoid:** When recording a new snapshot for an existing chapter, mark previous versions as superseded. Trend calculations should only use the latest version per chapter. Provide a `recalculateTrends()` function.
**Warning signs:** Trend line showing inconsistent jumps.

### Pitfall 5: Passage Extraction Boundary Issues
**What goes wrong:** Extracted passages cut mid-sentence or include incomplete dialogue.
**Why it happens:** Naive paragraph-boundary extraction doesn't account for Korean sentence structure.
**How to avoid:** Extract passages at paragraph boundaries (using existing `getParagraphs()`). Validate extracted passage length is within 500-2000 chars (StyleExemplar schema constraint). If too short, merge adjacent paragraphs. If too long, split at the nearest sentence boundary using `extractSentences()`.
**Warning signs:** Exemplars with trailing `...` or orphaned dialogue markers.

## Code Examples

Verified patterns from existing codebase:

### Recording a Quality Snapshot
```typescript
// Source: Derived from analyzeChapter() in src/pipeline/quality-oracle.ts
import { analyzeChapter } from '../pipeline/quality-oracle.js';
import { computeStyleMatch } from '../style-library/index.js';

function createSnapshot(
  content: string,
  chapterNumber: number,
  version: number,
  styleProfile?: StyleProfile,
  options?: AnalyzeChapterOptions
): QualitySnapshot {
  const result = analyzeChapter(content, 1, options);
  const styleScore = styleProfile
    ? computeStyleMatch(content, styleProfile).overallMatch
    : undefined;

  return {
    chapterNumber,
    timestamp: new Date().toISOString(),
    version,
    overallScore: calculateOverallScore(result.assessment),
    dimensions: {
      proseQuality: result.assessment.proseQuality.score,
      sensoryGrounding: result.assessment.sensoryGrounding.score,
      filterWordDensity: 100 - Math.min(100, result.assessment.filterWordDensity.count * 5),
      rhythmVariation: result.assessment.rhythmVariation.score,
      characterVoice: result.assessment.characterVoice.score,
      transitionQuality: result.assessment.transitionQuality.score,
      honorificConsistency: result.assessment.honorificConsistency?.score,
      koreanTexture: result.assessment.koreanTexture?.score,
      styleAlignment: styleScore,
    },
    verdict: result.verdict,
  };
}
```

### Extracting Exemplar Candidates from a Chapter
```typescript
// Source: Derived from getParagraphs() in quality-oracle.ts + classifyExemplar() in classifier.ts
import { getParagraphs } from '../pipeline/quality-oracle.js';
import { classifyExemplar } from '../style-library/classifier.js';
import { computeStyleMatch, computeStylometrics } from '../style-library/index.js';

function extractCandidates(
  content: string,
  chapterNumber: number,
  styleProfile?: StyleProfile
): ExemplarCandidate[] {
  const paragraphs = getParagraphs(content);
  const candidates: ExemplarCandidate[] = [];

  // Sliding window over paragraphs (2-4 paragraphs per candidate)
  for (let i = 0; i < paragraphs.length; i++) {
    for (let windowSize = 2; windowSize <= 4 && i + windowSize <= paragraphs.length; windowSize++) {
      const passage = paragraphs
        .slice(i, i + windowSize)
        .map(p => p.text)
        .join('\n\n');

      // Check length constraint (500-2000 chars per schema)
      if (passage.length < 500 || passage.length > 2000) continue;

      // Score the passage
      const qualityResult = analyzeChapter(passage, 1);
      const qualityScore = calculateOverallScore(qualityResult.assessment);
      const styleMatchScore = styleProfile
        ? computeStyleMatch(passage, styleProfile).overallMatch
        : qualityScore; // fallback to quality if no profile

      const combinedScore = 0.6 * qualityScore + 0.4 * styleMatchScore;

      if (combinedScore >= 85) {
        const category = classifyExemplar(passage, {
          genre: undefined, // will use 'general', caller should override
        });

        candidates.push({
          content: passage,
          qualityScore,
          styleMatchScore,
          combinedScore,
          category,
          sourceChapter: chapterNumber,
          paragraphRange: [i, i + windowSize - 1],
        });
      }
    }
  }

  // Return top candidates, deduplicated
  return deduplicateAndRank(candidates);
}
```

### EWMA Regression Detection
```typescript
// Source: Statistical process control EWMA method + simple-statistics API
import { mean, standardDeviation, zScore, linearRegression, linearRegressionLine } from 'simple-statistics';

interface RegressionConfig {
  /** EWMA smoothing factor (0-1, default 0.2) */
  lambda: number;
  /** Minimum snapshots before alerting */
  minDataPoints: number;
  /** Rolling window size for moving average */
  windowSize: number;
  /** Z-score threshold for warning */
  warningThreshold: number;
  /** Z-score threshold for critical */
  criticalThreshold: number;
}

const DEFAULT_CONFIG: RegressionConfig = {
  lambda: 0.2,
  minDataPoints: 5,
  windowSize: 5,
  warningThreshold: -1.5,
  criticalThreshold: -2.0,
};

function detectRegression(
  snapshots: QualitySnapshot[],
  config: RegressionConfig = DEFAULT_CONFIG
): TrendAnalysis {
  if (snapshots.length < config.minDataPoints) {
    return { regressionDetected: false, alertLevel: 'none', /* ... */ };
  }

  const scores = snapshots.map(s => s.overallScore);
  const recent = scores.slice(-config.windowSize);

  // Rolling average
  const rollingAvg = mean(recent);

  // EWMA
  let ewma = scores[0];
  for (let i = 1; i < scores.length; i++) {
    ewma = config.lambda * scores[i] + (1 - config.lambda) * ewma;
  }

  // Linear regression on recent window
  const regressionData: [number, number][] = recent.map((score, i) => [i, score]);
  const regression = linearRegression(regressionData);
  const trendSlope = regression.m;

  // Z-score of latest score against history
  const historicalMean = mean(scores.slice(0, -1));
  const historicalStdDev = standardDeviation(scores.slice(0, -1));
  const latestZScore = historicalStdDev > 0
    ? zScore(scores[scores.length - 1], historicalMean, historicalStdDev)
    : 0;

  // Determine alert level
  let alertLevel: 'none' | 'warning' | 'critical' = 'none';
  if (latestZScore <= config.criticalThreshold || trendSlope < -2.0) {
    alertLevel = 'critical';
  } else if (latestZScore <= config.warningThreshold || trendSlope < -1.0) {
    alertLevel = 'warning';
  }

  return {
    rollingAverage: rollingAvg,
    ewma,
    trendSlope,
    regressionDetected: alertLevel !== 'none',
    alertLevel,
    alertMessage: buildAlertMessage(alertLevel, latestZScore, trendSlope, rollingAvg),
    dimensionTrends: computeDimensionTrends(snapshots, config.windowSize),
  };
}
```

### Quality Trend Schema Structure
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "quality-trend.schema.json",
  "title": "QualityTrend",
  "description": "Per-project quality trend tracking data",
  "type": "object",
  "required": ["project_id", "snapshots", "metadata"],
  "properties": {
    "project_id": { "type": "string" },
    "snapshots": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["chapter_number", "timestamp", "version", "overall_score", "verdict"],
        "properties": {
          "chapter_number": { "type": "integer", "minimum": 1 },
          "timestamp": { "type": "string", "format": "date-time" },
          "version": { "type": "integer", "minimum": 1 },
          "overall_score": { "type": "number", "minimum": 0, "maximum": 100 },
          "dimensions": {
            "type": "object",
            "properties": {
              "prose_quality": { "type": "number" },
              "sensory_grounding": { "type": "number" },
              "filter_word_density": { "type": "number" },
              "rhythm_variation": { "type": "number" },
              "character_voice": { "type": "number" },
              "transition_quality": { "type": "number" },
              "honorific_consistency": { "type": "number" },
              "korean_texture": { "type": "number" },
              "style_alignment": { "type": "number" }
            }
          },
          "verdict": { "type": "string", "enum": ["PASS", "REVISE"] }
        }
      }
    },
    "metadata": {
      "type": "object",
      "properties": {
        "total_snapshots": { "type": "integer" },
        "last_updated": { "type": "string", "format": "date-time" },
        "auto_exemplars_added": { "type": "integer" },
        "regression_alerts_fired": { "type": "integer" }
      }
    }
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Fixed quality thresholds | EWMA-based adaptive baselines | Industry standard since SPC | Reduces false positives from natural variation |
| Manual exemplar curation | Auto-accumulation with quality gates | This phase | Eliminates manual step, grows library organically |
| Total score only tracking | Per-dimension trend analysis | This phase | Pinpoints which specific quality aspects are declining |
| chapter-history.schema.json (basic scores) | quality-trend.schema.json (full dimensional snapshots) | This phase | Enables regression detection with enough granularity |

**Deprecated/outdated:**
- The existing `chapter-history.schema.json` tracks `total_score` and `scores.critic/beta_reader/genre_validator` -- these are legacy evaluation dimensions. Phase 5 should use the Quality Oracle dimensions instead. The old schema remains for backward compatibility but new tracking uses `quality-trend.schema.json`.

## Open Questions

Things that couldn't be fully resolved:

1. **Trend visualization format**
   - What we know: The success criteria says "trend visualization" but this is a CLI/prompt-based system with no GUI
   - What's unclear: What form should visualization take? ASCII chart? Markdown table? JSON data for external tool?
   - Recommendation: Generate a markdown table with sparkline-style indicators (arrows, colors via text) and optionally an ASCII chart using box-drawing characters. Keep it text-based since the system outputs to Claude conversations.

2. **Exemplar library cap size**
   - What we know: Uncapped growth is bad, but too-aggressive pruning loses good exemplars
   - What's unclear: Exact cap number per scene_type
   - Recommendation: Start with 50 per scene_type (400 total across 8 scene types). This is generous enough for diversity while bounded. Make configurable.

3. **Cross-chapter passage extraction**
   - What we know: Best passages might span scene transitions
   - What's unclear: Should passages ever cross scene boundaries?
   - Recommendation: No. Keep extraction within contiguous paragraph groups. Scene transitions are different scene_types and shouldn't be mixed in a single exemplar.

## Sources

### Primary (HIGH confidence)
- Existing codebase: `src/style-library/storage.ts` - addExemplar(), saveLibrary(), loadLibrary() APIs verified
- Existing codebase: `src/style-library/classifier.ts` - classifyExemplar() 5-dimension taxonomy verified
- Existing codebase: `src/style-library/style-analyzer.ts` - computeStyleMatch(), computeStylometrics() verified
- Existing codebase: `src/pipeline/quality-oracle.ts` - analyzeChapter(), QualityAssessment structure verified
- Existing codebase: `src/quality/types.ts` - StageResult, MultiStageResult types verified
- Existing codebase: `src/state/backup.ts` - withStateBackup() pattern verified
- Existing codebase: `schemas/style-library.schema.json` - exemplar constraints (500-2000 chars) verified
- Existing codebase: `schemas/chapter-history.schema.json` - legacy tracking structure verified
- [simple-statistics docs](https://simple-statistics.github.io/docs/) - API: mean, standardDeviation, zScore, linearRegression, linearRegressionLine confirmed with TypeScript types

### Secondary (MEDIUM confidence)
- [CUSUM and EWMA Control Charts](https://www.jmp.com/en/statistics-knowledge-portal/quality-and-reliability-methods/control-charts/cusum-and-ewma-control-charts) - EWMA lambda=0.2 standard, z-score thresholds for alerting
- [Moving Averages in Time Series](https://otexts.com/fpp2/moving-averages.html) - Rolling window approach for trend estimation

### Tertiary (LOW confidence)
- None. All critical claims verified against codebase or official documentation.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - simple-statistics verified via official docs, all other deps already in project
- Architecture: HIGH - All integration points verified against actual source code in the codebase
- Pitfalls: HIGH - Derived from domain knowledge of statistical process control + analysis of existing schema constraints

**Research date:** 2026-02-06
**Valid until:** 2026-03-08 (30 days - stable domain, no rapidly changing dependencies)
