/**
 * State file utilities for Novel Sisyphus
 *
 * Provides locking and backup mechanisms for safe state file operations
 */

export { acquireLock } from './lock.js';
export { withStateBackup } from './backup.js';
