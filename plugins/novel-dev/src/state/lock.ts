import { promises as fs, constants } from 'fs';
import { open } from 'fs/promises';

const LOCK_TIMEOUT_MS = 30000; // 30 seconds

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Acquires an exclusive lock on a state file using atomic file creation.
 *
 * Uses O_CREAT | O_EXCL flags (Node.js 'wx' mode) for atomic lock acquisition,
 * preventing TOCTTOU (Time-Of-Check-Time-Of-Use) race conditions.
 *
 * @param stateFilePath - Path to the state file to lock
 * @returns A function to release the lock (async)
 * @throws Error if lock cannot be acquired within timeout
 */
export async function acquireLock(stateFilePath: string): Promise<() => Promise<void>> {
  const lockPath = stateFilePath + '.lock';
  const startTime = Date.now();

  while (true) {
    try {
      // Atomic lock acquisition: O_CREAT | O_EXCL
      // If file already exists, this throws EEXIST
      const fd = await open(lockPath, 'wx');
      await fd.write(process.pid.toString());
      await fd.close();

      // Successfully acquired lock - return async release function
      return async () => {
        try {
          await fs.unlink(lockPath);
        } catch {
          // Ignore errors during unlock (file may already be deleted)
        }
      };
    } catch (err: unknown) {
      const error = err as NodeJS.ErrnoException;

      if (error.code !== 'EEXIST') {
        // Unexpected error (not "file exists")
        throw error;
      }

      // Lock file exists - check if it's stale
      try {
        const stats = await fs.stat(lockPath);
        const lockAge = Date.now() - stats.mtimeMs;

        if (lockAge > LOCK_TIMEOUT_MS) {
          // Stale lock - force remove and retry
          await fs.unlink(lockPath).catch(() => {});
          continue;
        }
      } catch {
        // stat failed, lock file may have been just deleted - retry
        continue;
      }

      // Check timeout
      if (Date.now() - startTime > LOCK_TIMEOUT_MS) {
        throw new Error('Failed to acquire state file lock. Another process may be running.');
      }

      // Wait and retry
      await sleep(100);
    }
  }
}
