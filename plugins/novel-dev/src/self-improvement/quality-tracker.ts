/**
 * Quality Trend Tracker
 *
 * Records per-chapter quality snapshots, persists them with versioning,
 * and renders markdown trend visualizations.
 *
 * Features:
 * - Idempotent snapshot recording (same chapter+version = skip)
 * - Automatic superseding of old versions when chapters are rewritten
 * - Trend table with arrow indicators for score trajectory
 * - Safe persistence via withStateBackup()
 *
 * @module self-improvement/quality-tracker
 */

import { promises as fs } from 'fs';
import { existsSync } from 'fs';
import path from 'path';
import type { QualitySnapshot, TrendData } from './types.js';
import { withStateBackup } from '../state/backup.js';

// ============================================================================
// Constants
// ============================================================================

/** Trend arrow threshold: score difference >= this shows an arrow */
const TREND_THRESHOLD = 3;

// ============================================================================
// Trend Data Lifecycle
// ============================================================================

/**
 * Create an empty TrendData structure for a new project.
 *
 * @param projectId - Project identifier
 * @returns Empty TrendData with zeroed metadata
 */
export function createEmptyTrendData(projectId: string): TrendData {
  return {
    projectId,
    snapshots: [],
    metadata: {
      totalSnapshots: 0,
      lastUpdated: new Date().toISOString(),
      autoExemplarsAdded: 0,
      regressionAlertsFired: 0,
    },
  };
}

/**
 * Load trend data from the project directory.
 *
 * @param projectDir - Project root directory
 * @param projectId - Project identifier (used for empty default)
 * @returns TrendData loaded from disk, or empty default if file missing
 */
export async function loadTrendData(
  projectDir: string,
  projectId: string
): Promise<TrendData> {
  const filePath = path.join(projectDir, 'meta', 'quality-trend.json');

  if (!existsSync(filePath)) {
    return createEmptyTrendData(projectId);
  }

  const content = await fs.readFile(filePath, 'utf-8');
  const parsed = JSON.parse(content) as TrendData;

  // Basic structure validation
  if (!parsed.projectId || !Array.isArray(parsed.snapshots) || !parsed.metadata) {
    return createEmptyTrendData(projectId);
  }

  return parsed;
}

/**
 * Save trend data to the project directory with backup protection.
 *
 * Uses withStateBackup() to ensure data integrity on write failure.
 *
 * @param projectDir - Project root directory
 * @param trendData - TrendData to persist
 */
export async function saveTrendData(
  projectDir: string,
  trendData: TrendData
): Promise<void> {
  const filePath = path.join(projectDir, 'meta', 'quality-trend.json');
  const metaDir = path.join(projectDir, 'meta');

  // Ensure meta directory exists
  if (!existsSync(metaDir)) {
    await fs.mkdir(metaDir, { recursive: true });
  }

  // Update metadata before saving
  const latestSnapshots = getLatestSnapshots(trendData);
  const updated: TrendData = {
    ...trendData,
    metadata: {
      ...trendData.metadata,
      totalSnapshots: latestSnapshots.length,
      lastUpdated: new Date().toISOString(),
    },
  };

  await withStateBackup(filePath, async () => {
    await fs.writeFile(filePath, JSON.stringify(updated, null, 2), 'utf-8');
  });
}

// ============================================================================
// Snapshot Recording
// ============================================================================

/**
 * Record a quality snapshot for a chapter.
 *
 * Idempotent: if a snapshot with the same chapterNumber + version already
 * exists, the call is a no-op.
 *
 * If a snapshot for the same chapterNumber with a LOWER version exists,
 * that older snapshot is marked as superseded.
 *
 * @param trendData - Current trend data (not mutated)
 * @param snapshot - New snapshot to record
 * @returns Updated TrendData (new object)
 */
export function recordSnapshot(
  trendData: TrendData,
  snapshot: QualitySnapshot
): TrendData {
  // Check for existing snapshot with same chapter + version (idempotent)
  const exists = trendData.snapshots.some(
    s => s.chapterNumber === snapshot.chapterNumber && s.version === snapshot.version
  );
  if (exists) {
    return trendData;
  }

  // Mark older versions of the same chapter as superseded
  const updatedSnapshots = trendData.snapshots.map(s => {
    if (s.chapterNumber === snapshot.chapterNumber && s.version < snapshot.version) {
      return { ...s, superseded: true };
    }
    return s;
  });

  // Append the new snapshot
  updatedSnapshots.push(snapshot);

  return {
    ...trendData,
    snapshots: updatedSnapshots,
  };
}

// ============================================================================
// Snapshot Queries
// ============================================================================

/**
 * Get the latest (non-superseded, highest-version) snapshots.
 *
 * For each chapter, returns only the highest-version snapshot
 * that is not marked as superseded.
 *
 * @param trendData - Trend data to query
 * @returns Latest snapshots sorted by chapterNumber ascending
 */
export function getLatestSnapshots(trendData: TrendData): QualitySnapshot[] {
  // Filter out superseded snapshots
  const active = trendData.snapshots.filter(s => !s.superseded);

  // Group by chapterNumber, keep highest version
  const byChapter = new Map<number, QualitySnapshot>();
  for (const snapshot of active) {
    const existing = byChapter.get(snapshot.chapterNumber);
    if (!existing || snapshot.version > existing.version) {
      byChapter.set(snapshot.chapterNumber, snapshot);
    }
  }

  // Sort by chapterNumber ascending
  return Array.from(byChapter.values()).sort(
    (a, b) => a.chapterNumber - b.chapterNumber
  );
}

// ============================================================================
// Trend Visualization
// ============================================================================

/**
 * Render a markdown table showing quality trends across chapters.
 *
 * Columns: Chapter, Score, Verdict, Prose, Sensory, Rhythm, Voice, Trend
 * Trend: ^ (improved >= 3), v (declined >= 3), - (stable)
 *
 * @param trendData - Trend data to visualize
 * @returns Markdown table string
 */
export function renderTrendTable(trendData: TrendData): string {
  const snapshots = getLatestSnapshots(trendData);

  const lines: string[] = [];

  // Header
  lines.push('| Chapter | Score | Verdict | Prose | Sensory | Rhythm | Voice | Trend |');
  lines.push('|---------|-------|---------|-------|---------|--------|-------|-------|');

  if (snapshots.length === 0) {
    // Summary row for empty data
    lines.push('');
    lines.push('Average: - | Best: - | Worst: -');
    return lines.join('\n');
  }

  // Data rows
  for (let i = 0; i < snapshots.length; i++) {
    const snap = snapshots[i];
    const dims = snap.dimensions;

    // Trend indicator
    let trend = '';
    if (i === 0) {
      trend = '';
    } else {
      const diff = snap.overallScore - snapshots[i - 1].overallScore;
      if (diff >= TREND_THRESHOLD) {
        trend = '^';
      } else if (diff <= -TREND_THRESHOLD) {
        trend = 'v';
      } else {
        trend = '-';
      }
    }

    const prose = dims.proseQuality !== undefined ? dims.proseQuality.toFixed(0) : '-';
    const sensory = dims.sensoryGrounding !== undefined ? dims.sensoryGrounding.toFixed(0) : '-';
    const rhythm = dims.rhythmVariation !== undefined ? dims.rhythmVariation.toFixed(0) : '-';
    const voice = dims.characterVoice !== undefined ? dims.characterVoice.toFixed(0) : '-';

    lines.push(
      `| ${snap.chapterNumber} | ${snap.overallScore.toFixed(1)} | ${snap.verdict} | ${prose} | ${sensory} | ${rhythm} | ${voice} | ${trend} |`
    );
  }

  // Summary row
  const scores = snapshots.map(s => s.overallScore);
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  const best = Math.max(...scores);
  const worst = Math.min(...scores);

  lines.push('');
  lines.push(`Average: ${avg.toFixed(1)} | Best: ${best.toFixed(1)} | Worst: ${worst.toFixed(1)}`);

  return lines.join('\n');
}

// ============================================================================
// Trend Recalculation
// ============================================================================

/**
 * Recalculate trend metadata from snapshots.
 *
 * Useful after manual edits or data migration.
 *
 * @param trendData - Trend data to recalculate
 * @returns Updated TrendData with recalculated metadata
 */
export function recalculateTrends(trendData: TrendData): TrendData {
  const latestSnapshots = getLatestSnapshots(trendData);

  return {
    ...trendData,
    metadata: {
      ...trendData.metadata,
      totalSnapshots: latestSnapshots.length,
      lastUpdated: new Date().toISOString(),
    },
  };
}
