import { promises as fs } from 'fs';
import { existsSync } from 'fs';

/**
 * Executes an operation with automatic backup and restore on failure
 *
 * @param stateFilePath - Path to the state file
 * @param operation - Async operation to execute
 * @returns Result of the operation
 * @throws Error from operation (after restoring backup)
 */
export async function withStateBackup<T>(
  stateFilePath: string,
  operation: () => Promise<T>
): Promise<T> {
  const backupPath = stateFilePath.replace('.json', '.backup.json');

  // 1. Create backup if state file exists
  if (existsSync(stateFilePath)) {
    await fs.copyFile(stateFilePath, backupPath);
  }

  try {
    // 2. Execute operation
    return await operation();
  } catch (error) {
    // 3. Restore from backup on failure
    if (existsSync(backupPath)) {
      await fs.copyFile(backupPath, stateFilePath);
      console.warn('State restored from backup due to error.');
    }
    throw error;
  }
}
