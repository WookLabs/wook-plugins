/**
 * Quality Tracker Tests
 *
 * Tests for the quality trend tracking system:
 * - recordSnapshot: idempotency, versioning, superseding
 * - getLatestSnapshots: filtering, sorting, empty handling
 * - loadTrendData / saveTrendData: file I/O, round-trip, backup
 * - renderTrendTable: markdown output, trend arrows, summary row
 * - recalculateTrends: metadata recalculation
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import { existsSync } from 'fs';
import path from 'path';
import os from 'os';
import type { QualitySnapshot, TrendData } from '../../src/self-improvement/types.js';
import {
  recordSnapshot,
  loadTrendData,
  saveTrendData,
  getLatestSnapshots,
  renderTrendTable,
  recalculateTrends,
} from '../../src/self-improvement/quality-tracker.js';

// ============================================================================
// Helpers
// ============================================================================

/**
 * Factory function to create a QualitySnapshot with sensible defaults.
 */
function makeSnapshot(
  chapter: number,
  score: number,
  dims?: Partial<Record<string, number>>,
  overrides?: Partial<QualitySnapshot>
): QualitySnapshot {
  return {
    chapterNumber: chapter,
    timestamp: new Date().toISOString(),
    version: overrides?.version ?? 1,
    overallScore: score,
    dimensions: {
      proseQuality: dims?.proseQuality ?? score,
      sensoryGrounding: dims?.sensoryGrounding ?? score - 5,
      rhythmVariation: dims?.rhythmVariation ?? score - 2,
      characterVoice: dims?.characterVoice ?? score - 3,
      ...dims,
    },
    verdict: score >= 70 ? 'PASS' : 'REVISE',
    ...overrides,
  };
}

/**
 * Create an empty TrendData for testing.
 */
function emptyTrend(projectId: string = 'test-project'): TrendData {
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

// ============================================================================
// recordSnapshot Tests
// ============================================================================

describe('recordSnapshot', () => {
  it('should record a new snapshot for a new chapter', () => {
    const trend = emptyTrend();
    const snap = makeSnapshot(1, 80);

    const result = recordSnapshot(trend, snap);

    expect(result.snapshots).toHaveLength(1);
    expect(result.snapshots[0].chapterNumber).toBe(1);
    expect(result.snapshots[0].overallScore).toBe(80);
  });

  it('should be idempotent: same chapterNumber+version is not duplicated', () => {
    const trend = emptyTrend();
    const snap = makeSnapshot(1, 80, undefined, { version: 1 });

    const after1 = recordSnapshot(trend, snap);
    const after2 = recordSnapshot(after1, snap);

    expect(after2.snapshots).toHaveLength(1);
  });

  it('should mark older versions as superseded when new version is recorded', () => {
    const trend = emptyTrend();
    const v1 = makeSnapshot(1, 70, undefined, { version: 1 });
    const v2 = makeSnapshot(1, 85, undefined, { version: 2 });

    const after1 = recordSnapshot(trend, v1);
    const after2 = recordSnapshot(after1, v2);

    expect(after2.snapshots).toHaveLength(2);
    // v1 should be superseded
    const oldSnap = after2.snapshots.find(s => s.version === 1);
    expect(oldSnap?.superseded).toBe(true);
    // v2 should not be superseded
    const newSnap = after2.snapshots.find(s => s.version === 2);
    expect(newSnap?.superseded).toBeUndefined();
  });

  it('should have correct timestamp format (ISO 8601)', () => {
    const trend = emptyTrend();
    const snap = makeSnapshot(1, 80);

    const result = recordSnapshot(trend, snap);

    const ts = result.snapshots[0].timestamp;
    // ISO 8601 pattern: YYYY-MM-DDTHH:MM:SS.sssZ
    expect(() => new Date(ts)).not.toThrow();
    expect(new Date(ts).toISOString()).toBeTruthy();
  });
});

// ============================================================================
// getLatestSnapshots Tests
// ============================================================================

describe('getLatestSnapshots', () => {
  it('should return only non-superseded highest-version snapshots', () => {
    let trend = emptyTrend();
    trend = recordSnapshot(trend, makeSnapshot(1, 70, undefined, { version: 1 }));
    trend = recordSnapshot(trend, makeSnapshot(1, 85, undefined, { version: 2 }));
    trend = recordSnapshot(trend, makeSnapshot(2, 78, undefined, { version: 1 }));

    const latest = getLatestSnapshots(trend);

    expect(latest).toHaveLength(2);
    expect(latest[0].chapterNumber).toBe(1);
    expect(latest[0].version).toBe(2);
    expect(latest[0].overallScore).toBe(85);
    expect(latest[1].chapterNumber).toBe(2);
  });

  it('should return sorted by chapterNumber ascending', () => {
    let trend = emptyTrend();
    // Add chapters out of order
    trend = recordSnapshot(trend, makeSnapshot(3, 75));
    trend = recordSnapshot(trend, makeSnapshot(1, 80));
    trend = recordSnapshot(trend, makeSnapshot(2, 82));

    const latest = getLatestSnapshots(trend);

    expect(latest.map(s => s.chapterNumber)).toEqual([1, 2, 3]);
  });

  it('should return empty array for empty trendData', () => {
    const trend = emptyTrend();

    const latest = getLatestSnapshots(trend);

    expect(latest).toHaveLength(0);
  });
});

// ============================================================================
// loadTrendData / saveTrendData Tests
// ============================================================================

describe('loadTrendData / saveTrendData', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'quality-tracker-test-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('should round-trip save and load correctly', async () => {
    let trend = emptyTrend('my-novel');
    trend = recordSnapshot(trend, makeSnapshot(1, 80));
    trend = recordSnapshot(trend, makeSnapshot(2, 85));

    await saveTrendData(tempDir, trend);
    const loaded = await loadTrendData(tempDir, 'my-novel');

    expect(loaded.projectId).toBe('my-novel');
    expect(loaded.snapshots).toHaveLength(2);
    expect(loaded.metadata.totalSnapshots).toBe(2);
  });

  it('should return empty TrendData when file does not exist', async () => {
    const loaded = await loadTrendData(tempDir, 'nonexistent');

    expect(loaded.projectId).toBe('nonexistent');
    expect(loaded.snapshots).toHaveLength(0);
    expect(loaded.metadata.totalSnapshots).toBe(0);
  });

  it('should create backup file during save (withStateBackup integration)', async () => {
    let trend = emptyTrend('backup-test');
    trend = recordSnapshot(trend, makeSnapshot(1, 80));

    // First save creates the file
    await saveTrendData(tempDir, trend);

    // Second save should create a backup
    trend = recordSnapshot(trend, makeSnapshot(2, 85));
    await saveTrendData(tempDir, trend);

    const backupPath = path.join(tempDir, 'meta', 'quality-trend.backup.json');
    expect(existsSync(backupPath)).toBe(true);
  });
});

// ============================================================================
// renderTrendTable Tests
// ============================================================================

describe('renderTrendTable', () => {
  it('should return minimal table with header only for empty data', () => {
    const trend = emptyTrend();
    const table = renderTrendTable(trend);

    expect(table).toContain('| Chapter |');
    expect(table).toContain('|---------|');
    expect(table).toContain('Average: -');
  });

  it('should show single chapter with score and no trend indicator', () => {
    let trend = emptyTrend();
    trend = recordSnapshot(trend, makeSnapshot(1, 80, {
      proseQuality: 82,
      sensoryGrounding: 78,
      rhythmVariation: 80,
      characterVoice: 76,
    }));

    const table = renderTrendTable(trend);

    expect(table).toContain('| 1 |');
    expect(table).toContain('80.0');
    expect(table).toContain('PASS');
    // First chapter has no trend indicator -- the trend column should be empty
    const dataRow = table.split('\n').find(line => line.includes('| 1 |'));
    expect(dataRow).toBeDefined();
    // Should end with empty trend cell: "| |"
    expect(dataRow!).toMatch(/\|\s*\|$/);
  });

  it('should show correct trend arrows for multiple chapters', () => {
    let trend = emptyTrend();
    trend = recordSnapshot(trend, makeSnapshot(1, 80));
    trend = recordSnapshot(trend, makeSnapshot(2, 85)); // +5 -> ^
    trend = recordSnapshot(trend, makeSnapshot(3, 84)); // -1 -> -
    trend = recordSnapshot(trend, makeSnapshot(4, 70)); // -14 -> v

    const table = renderTrendTable(trend);
    const lines = table.split('\n');

    // Find data rows
    const ch2Row = lines.find(l => l.includes('| 2 |'));
    const ch3Row = lines.find(l => l.includes('| 3 |'));
    const ch4Row = lines.find(l => l.includes('| 4 |'));

    expect(ch2Row).toContain('^');
    expect(ch3Row).toContain('-');
    expect(ch4Row).toContain('v');
  });

  it('should show correct summary row with average, best, worst', () => {
    let trend = emptyTrend();
    trend = recordSnapshot(trend, makeSnapshot(1, 70));
    trend = recordSnapshot(trend, makeSnapshot(2, 80));
    trend = recordSnapshot(trend, makeSnapshot(3, 90));

    const table = renderTrendTable(trend);

    // Average: (70+80+90)/3 = 80.0
    expect(table).toContain('Average: 80.0');
    expect(table).toContain('Best: 90.0');
    expect(table).toContain('Worst: 70.0');
  });

  it('should output valid markdown (starts with |, has separator row)', () => {
    let trend = emptyTrend();
    trend = recordSnapshot(trend, makeSnapshot(1, 80));

    const table = renderTrendTable(trend);
    const lines = table.split('\n').filter(l => l.trim());

    // First line should start with |
    expect(lines[0]).toMatch(/^\|/);
    // Second line should be separator with ---
    expect(lines[1]).toMatch(/^\|[-|]+\|$/);
  });
});

// ============================================================================
// recalculateTrends Tests
// ============================================================================

describe('recalculateTrends', () => {
  it('should recalculate totalSnapshots correctly after manual edits', () => {
    let trend = emptyTrend();
    trend = recordSnapshot(trend, makeSnapshot(1, 70, undefined, { version: 1 }));
    trend = recordSnapshot(trend, makeSnapshot(1, 85, undefined, { version: 2 }));
    trend = recordSnapshot(trend, makeSnapshot(2, 78));

    // Manually set incorrect metadata
    trend.metadata.totalSnapshots = 999;

    const recalculated = recalculateTrends(trend);

    // Should be 2 (ch1 v2 + ch2 v1), not 3 (excludes superseded)
    expect(recalculated.metadata.totalSnapshots).toBe(2);
  });
});
