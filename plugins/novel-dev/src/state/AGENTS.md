<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-01-18 -->

# state

## Purpose

State file management utilities for Novel Sisyphus. Provides safe, concurrent-friendly operations on state files through exclusive file locking and automatic backup/restore mechanisms. Prevents data corruption from concurrent access and ensures graceful recovery from operation failures.

## Key Files

- **index.ts** - Module barrel export; re-exports lock and backup utilities
- **lock.ts** - Exclusive file locking mechanism with timeout and stale lock detection
- **backup.ts** - Automatic backup and restore on operation failure

## Lock Mechanism (lock.ts)

Implements process-level exclusive locking with the following features:

**Lock File**: Creates a `.lock` file alongside the state file
- Contains the PID of the process holding the lock
- Automatically cleaned up when released
- Timeout: 30 seconds

**Stale Lock Detection**:
- Monitors lock file age via modification time
- Automatically removes locks older than 30 seconds (zombie lock recovery)
- Prevents indefinite blocking from crashed processes

**Timeout Handling**:
- Overall timeout: 30 seconds to acquire lock
- Polls every 100ms for lock release
- Returns a release function for symmetric lock/unlock

## Backup Mechanism (backup.ts)

Implements automatic point-in-time recovery for state operations:

**Backup Process**:
1. Pre-operation: Create backup copy (.backup.json)
2. Execute operation
3. On failure: Restore from backup
4. On success: Backup remains for manual recovery if needed

**Usage Pattern**:
```typescript
await withStateBackup(stateFilePath, async () => {
  // Perform state mutations here
  // Automatically backed up and restored on error
});
```

## For AI Agents

When working in state/:
1. **Always use acquireLock()** before any state file read/write to prevent race conditions
2. **Always wrap state mutations** with withStateBackup() for crash safety
3. Combine both patterns: acquire lock THEN use backup wrapper
4. Lock is released via the returned function - ensure it's called in finally block
5. Backup file location is deterministic: original.json → original.backup.json
6. Only one process can hold a lock at a time - respect timeout and stale lock boundaries

## Typical Usage Pattern

```typescript
// Safe state file operation pattern
const releaseLock = await acquireLock(stateFilePath);
try {
  await withStateBackup(stateFilePath, async () => {
    // Read state
    const state = JSON.parse(await fs.readFile(stateFilePath, 'utf-8'));

    // Modify state
    state.lastUpdate = new Date().toISOString();

    // Write state (auto-backed up, auto-restored on error)
    await fs.writeFile(stateFilePath, JSON.stringify(state, null, 2));
  });
} finally {
  releaseLock();
}
```

## Concurrent Access Guarantees

- **Mutual Exclusion**: Only one process holds lock at a time
- **Deadlock Prevention**: 30-second timeout prevents indefinite waiting
- **Zombie Prevention**: Stale locks automatically cleaned
- **Failure Recovery**: State automatically restored on operation failure

## Dependencies

- Node.js `fs` and `fs/promises` modules
- Uses existsSync and writeFile/unlink operations

## Integration Points

- **Ralph Loop**: Uses these utilities to safely persist iteration state
- **Novel State Management**: Protects NovelState object mutations
- **Multi-process Safety**: Ensures multiple agents can safely access shared state

## Error Handling

- Lock acquisition throws if timeout exceeded
- Backup restore happens silently with warning to console
- Release function suppresses errors to avoid masking operation failures
