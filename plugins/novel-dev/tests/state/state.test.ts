import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import { existsSync } from 'fs';
import path from 'path';
import os from 'os';

// We need to test with real filesystem for lock tests
// Use a temp directory for isolation

describe('acquireLock', () => {
  let tmpDir: string;
  let stateFile: string;
  let acquireLock: typeof import('../../src/state/lock.js').acquireLock;

  beforeEach(async () => {
    tmpDir = path.join(os.tmpdir(), `novel-dev-test-${Date.now()}`);
    await fs.mkdir(tmpDir, { recursive: true });
    stateFile = path.join(tmpDir, 'test-state.json');
    await fs.writeFile(stateFile, '{}');
    // Dynamic import to get fresh module
    const mod = await import('../../src/state/lock.js');
    acquireLock = mod.acquireLock;
  });

  afterEach(async () => {
    // Clean up
    try {
      await fs.rm(tmpDir, { recursive: true, force: true });
    } catch {}
  });

  it('should acquire and release a lock', async () => {
    const release = await acquireLock(stateFile);
    const lockPath = stateFile + '.lock';

    // Lock file should exist
    expect(existsSync(lockPath)).toBe(true);

    // Release the lock
    await release();

    // Lock file should be gone
    expect(existsSync(lockPath)).toBe(false);
  });

  it('should create lock file with pid', async () => {
    const release = await acquireLock(stateFile);
    const lockPath = stateFile + '.lock';

    const content = await fs.readFile(lockPath, 'utf-8');
    expect(content).toBe(process.pid.toString());

    await release();
  });

  it('should handle release errors gracefully', async () => {
    const release = await acquireLock(stateFile);
    const lockPath = stateFile + '.lock';

    // Delete lock manually before release
    await fs.unlink(lockPath);

    // Release should not throw
    await expect(release()).resolves.toBeUndefined();
  });
});

describe('withStateBackup', () => {
  let tmpDir: string;
  let stateFile: string;
  let withStateBackup: typeof import('../../src/state/backup.js').withStateBackup;

  beforeEach(async () => {
    tmpDir = path.join(os.tmpdir(), `novel-dev-test-${Date.now()}`);
    await fs.mkdir(tmpDir, { recursive: true });
    stateFile = path.join(tmpDir, 'test-state.json');
    const mod = await import('../../src/state/backup.js');
    withStateBackup = mod.withStateBackup;
  });

  afterEach(async () => {
    try {
      await fs.rm(tmpDir, { recursive: true, force: true });
    } catch {}
  });

  it('should execute operation successfully', async () => {
    await fs.writeFile(stateFile, '{"version": 1}');

    const result = await withStateBackup(stateFile, async () => {
      return 'success';
    });

    expect(result).toBe('success');
  });

  it('should create backup before operation', async () => {
    await fs.writeFile(stateFile, '{"version": 1}');
    const backupPath = stateFile.replace('.json', '.backup.json');

    await withStateBackup(stateFile, async () => {
      // During operation, backup should exist
      expect(existsSync(backupPath)).toBe(true);
      const backup = await fs.readFile(backupPath, 'utf-8');
      expect(JSON.parse(backup)).toEqual({ version: 1 });
      return 'ok';
    });
  });

  it('should restore from backup on failure', async () => {
    await fs.writeFile(stateFile, '{"version": 1}');

    try {
      await withStateBackup(stateFile, async () => {
        // Corrupt the state file
        await fs.writeFile(stateFile, '{"version": 999}');
        throw new Error('Operation failed');
      });
    } catch (e) {
      // Expected
    }

    // State should be restored
    const content = await fs.readFile(stateFile, 'utf-8');
    expect(JSON.parse(content)).toEqual({ version: 1 });
  });

  it('should handle missing state file gracefully', async () => {
    // No state file exists - should still run operation
    const result = await withStateBackup(stateFile, async () => {
      return 'created';
    });

    expect(result).toBe('created');
  });

  it('should propagate operation errors', async () => {
    await fs.writeFile(stateFile, '{}');

    await expect(
      withStateBackup(stateFile, async () => {
        throw new Error('test error');
      })
    ).rejects.toThrow('test error');
  });
});
