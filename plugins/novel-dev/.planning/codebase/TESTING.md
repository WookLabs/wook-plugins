# Testing Patterns

**Analysis Date:** 2026-02-05

## Test Framework

**Runner:**
- Vitest 3.0.0
- Config: `vitest.config.ts`
- Environment: Node.js (not browser)

**Assertion Library:**
- Vitest built-in (uses Chai-compatible assertions)
- Methods: `expect()`, `.toBe()`, `.toBeGreaterThan()`, `.toHaveLength()`, `.rejects.toThrow()`, etc.

**Run Commands:**
```bash
npm test                    # Run all tests once
npm run test:watch         # Watch mode for development
npm run test:coverage      # Generate coverage report
npm run test:integration   # Integration tests
```

## Test File Organization

**Location:**
- Tests colocated in `tests/` directory at project root (not alongside source)
- Directory structure mirrors `src/`: `tests/context/`, `tests/state/`, `tests/retry/`

**Naming:**
- Pattern: `<module>.test.ts` (e.g., `estimator.test.ts`, `state.test.ts`, `quality-gate.test.ts`)
- Test directories: `tests/context/`, `tests/state/`, `tests/retry/`, etc.
- Fixtures: `tests/fixtures/sample-project/` for test data

**Structure:**
```
tests/
├── context/
│   ├── estimator.test.ts
│   └── priorities.test.ts
├── state/
│   └── state.test.ts
├── retry/
│   └── quality-gate.test.ts
├── smoke.test.ts
└── fixtures/
    └── sample-project/
```

## Test Structure

**Suite Organization:**
```typescript
import { describe, it, expect } from 'vitest';

describe('estimateTokens', () => {
  it('should return 0 for empty string', () => {
    expect(estimateTokens('')).toBe(0);
  });

  it('should estimate Korean text tokens', () => {
    const result = estimateTokens('안녕하세요', 'korean');
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThan(10);
  });
});
```

**Patterns:**
- Each function gets its own `describe` block: `describe('functionName', () => { ... })`
- Each test case is one `it` block with clear name: `it('should <expected behavior>', () => { ... })`
- Multiple assertions per test allowed when testing variations of same input

**Setup/Teardown:**
- `beforeEach`: Initialize temporary directories and state
- `afterEach`: Clean up filesystem artifacts
- Pattern from state tests:
  ```typescript
  beforeEach(async () => {
    tmpDir = path.join(os.tmpdir(), `novel-dev-test-${Date.now()}`);
    await fs.mkdir(tmpDir, { recursive: true });
    stateFile = path.join(tmpDir, 'test-state.json');
    await fs.writeFile(stateFile, '{}');
  });

  afterEach(async () => {
    try {
      await fs.rm(tmpDir, { recursive: true, force: true });
    } catch {}
  });
  ```

## Mocking

**Framework:** Vitest built-in `vi` mock utilities

**Patterns:**
- Async module imports for fresh module state: `const mod = await import('../../src/state/lock.js')`
- Dynamic imports reset module cache between tests (prevents state leakage)
- Example from `state.test.ts`:
  ```typescript
  beforeEach(async () => {
    const mod = await import('../../src/state/lock.js');
    acquireLock = mod.acquireLock;
  });
  ```

**What to Mock:**
- Filesystem operations via real temp directories (not mocked)
- Module imports via dynamic `import()` to reset state

**What NOT to Mock:**
- Filesystem: Tests use real `fs/promises` with temp directories
- Date/time: Real `Date.now()` used for lock timeout testing
- Pure functions: No mocking of utility functions (estimateTokens, detectContentType)

## Fixtures and Factories

**Test Data:**
- Helper factories for creating test objects:
  ```typescript
  const makeScore = (total: number, breakdown: { category: string; score: number; feedback: string }[] = []): QualityScore => ({
    total,
    breakdown,
  });

  const makeContext = (overrides: Partial<RetryContext> = {}): RetryContext => ({
    chapterNumber: 5,
    attemptNumber: 1,
    maxRetries: 3,
    lastScore: makeScore(60, [
      { category: '플롯', score: 70, feedback: '괜찮음' },
      { category: '캐릭터', score: 50, feedback: '개선 필요' },
    ]),
    threshold: 70,
    ...overrides,
  });
  ```

**Location:**
- Factories defined inline within test files near the top
- Reused across multiple test suites in same file
- Fixtures directory: `tests/fixtures/sample-project/` for sample data files

## Coverage

**Requirements:**
- 80% line coverage threshold enforced by Vitest configuration
- Measured via v8 provider

**View Coverage:**
```bash
npm run test:coverage
```

**Coverage Configuration** (from `vitest.config.ts`):
```typescript
coverage: {
  provider: 'v8',
  include: ['src/**/*.ts'],
  exclude: ['src/**/*.d.ts'],
  thresholds: {
    lines: 80,
  },
}
```

## Test Types

**Unit Tests:**
- Scope: Single functions in isolation
- Example: `estimator.test.ts` tests token estimation functions independently
- Approach: Direct function calls with known inputs, assert output
- Coverage: Edge cases, language variants (Korean, English, mixed), special characters

**Integration Tests:**
- Scope: Multi-module interactions (loader with estimator, priorities, overflow-handler)
- Trigger: `npm run test:integration` (separate script, not in standard test run)
- Script: `scripts/integration-test.mjs`
- Approach: Load actual project context with budget constraints, verify coordination

**E2E Tests:**
- Framework: Not implemented
- Manual testing via plugin in Claude Code context

## Common Patterns

**Async Testing:**
```typescript
beforeEach(async () => {
  tmpDir = path.join(os.tmpdir(), `novel-dev-test-${Date.now()}`);
  await fs.mkdir(tmpDir, { recursive: true });
});

afterEach(async () => {
  try {
    await fs.rm(tmpDir, { recursive: true, force: true });
  } catch {}
});

it('should acquire and release a lock', async () => {
  const release = await acquireLock(stateFile);
  expect(existsSync(lockPath)).toBe(true);
  await release();
  expect(existsSync(lockPath)).toBe(false);
});
```

**Error Testing:**
```typescript
it('should propagate operation errors', async () => {
  await fs.writeFile(stateFile, '{}');

  await expect(
    withStateBackup(stateFile, async () => {
      throw new Error('test error');
    })
  ).rejects.toThrow('test error');
});

it('should restore from backup on failure', async () => {
  await fs.writeFile(stateFile, '{"version": 1}');

  try {
    await withStateBackup(stateFile, async () => {
      await fs.writeFile(stateFile, '{"version": 999}');
      throw new Error('Operation failed');
    });
  } catch (e) {
    // Expected
  }

  const content = await fs.readFile(stateFile, 'utf-8');
  expect(JSON.parse(content)).toEqual({ version: 1 });
});
```

**Range/Threshold Testing:**
```typescript
it('should estimate Korean text tokens', () => {
  const result = estimateTokens('안녕하세요', 'korean');
  expect(result).toBeGreaterThan(0);
  expect(result).toBeLessThan(10);
});

it('should return true when exactly one below threshold', () => {
  expect(shouldContinueRetry(makeContext({
    attemptNumber: 1,
    lastScore: makeScore(69),
    threshold: 70
  }))).toBe(true);
});
```

**Batch/Collection Testing:**
```typescript
it('should estimate multiple items', () => {
  const result = estimateTokensBatch([
    { content: '안녕하세요' },
    { content: '{"key": "value"}', type: 'json' as const },
  ]);
  expect(result.total).toBeGreaterThan(0);
  expect(result.individual).toHaveLength(2);
  expect(result.total).toBe(result.individual[0] + result.individual[1]);
});
```

## Test Coverage by Module

**Context Module** (`tests/context/`):
- `estimator.test.ts`:
  - Token estimation for Korean, English, mixed content
  - File path estimation
  - Content type detection
  - Batch estimation
  - Budget fitting validation
  - Special characters and numbers handling

- `priorities.test.ts`:
  - Base priority calculations by type
  - Dynamic priority adjustments (distance-based, appearance-based)
  - Sorting and comparison
  - Droppable item identification
  - Priority aggregation

**State Module** (`tests/state/`):
- `state.test.ts`:
  - Lock acquisition with timeout
  - Lock file creation with process ID
  - Graceful error handling
  - Backup creation before operations
  - Restore on failure
  - Missing state file handling

**Retry Module** (`tests/retry/`):
- `quality-gate.test.ts`:
  - Retry strategy determination (revise, revise_with_feedback, partial_rewrite, user_intervention)
  - Lowest-scoring section identification
  - Retry prompt generation with context-specific content (Korean chapter numbers)
  - Continuation logic based on scores and limits

**Smoke Tests** (`tests/smoke.test.ts`):
- Infrastructure verification
- Test framework availability
- Fixtures directory accessibility

## Test Statistics

**Total Test Files:** 5
- `tests/smoke.test.ts`: 2 tests
- `tests/context/estimator.test.ts`: 20+ tests
- `tests/context/priorities.test.ts`: 20+ tests
- `tests/state/state.test.ts`: 10+ tests
- `tests/retry/quality-gate.test.ts`: 15+ tests

**Coverage Focus:** Pure functions (estimator, priorities, quality-gate) have comprehensive coverage. Integration tests exist separately.

---

*Testing analysis: 2026-02-05*
