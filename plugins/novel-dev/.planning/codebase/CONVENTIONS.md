# Coding Conventions

**Analysis Date:** 2026-02-05

## Naming Patterns

**Files:**
- TypeScript source: `camelCase.ts` for modules (e.g., `estimator.ts`, `loader.ts`)
- Index files: `index.ts` for barrel exports
- Test files: `<module>.test.ts` (e.g., `estimator.test.ts`)
- Schema/config files: `lowercase-with-dashes.json` or `lowercase-with-dashes.schema.json`

**Functions:**
- Async functions use `async` keyword (e.g., `async function loadFile()`, `async function acquireLock()`)
- Helper functions prefixed with verb: `load*`, `collect*`, `estimate*`, `detect*`, `get*`, `build*`, `determine*`
- Getter functions: `getPriority()`, `getDroppableItems()`, `getLowestScoringSection()`
- Predicate functions: `isRequired()`, `fileExists()`, `fitsInBudget()`, `shouldContinueRetry()`
- Exported functions are public; prefixed underscore not used

**Variables:**
- Constants: `SCREAMING_SNAKE_CASE` (e.g., `LOCK_TIMEOUT_MS`, `KOREAN_CHAR_FACTOR`, `DEFAULT_BUDGET_CONFIG`)
- Local variables: `camelCase` (e.g., `tmpDir`, `stateFile`, `lockPath`, `koreanTokens`)
- Type/interface instances: `camelCase` (e.g., `budget`, `context`, `result`)
- Array/collection variables: plural or descriptive (e.g., `candidates`, `breakdown`, `items`, `overflow`)

**Types:**
- Interfaces: `PascalCase` with prefix context (e.g., `ContextItem`, `ContextBudget`, `RetryContext`)
- Type aliases: `PascalCase` (e.g., `ContextType`, `ContentType`, `RetryStrategy`)
- Generic/utility types: Capitalized (e.g., `Required<T>`, `Record<string, number>`)
- Error classes: `PascalCase` with `Error` suffix (e.g., `ContextOverflowError`)

## Code Style

**Formatting:**
- No explicit formatter configured (eslint not present)
- Follows TypeScript strict mode conventions
- Single quotes for strings (TypeScript standard)
- Semicolons required (strict mode)
- 2-space indentation (observed in all files)
- Line breaks after section comments (e.g., `// ============================================================================`)

**Linting:**
- TypeScript strict mode enabled: `"strict": true`
- No unused locals/parameters allowed individually: `"noUnusedLocals": false`, `"noUnusedParameters": false`
- Implicit returns forbidden: `"noImplicitReturns": true`
- Fallthrough cases in switches forbidden: `"noFallthroughCasesInSwitch": true`
- Module resolution: `NodeNext` for ES2022 modules

## Import Organization

**Order:**
1. Built-in Node.js modules (`fs`, `path`, `os`, `http`, etc.)
2. Third-party packages (`ajv`, `zod`, `archiver`, etc.)
3. Local relative imports (`./types.js`, `./estimator.js`, `./index.js`)

**Path Aliases:**
- None detected. Uses explicit relative paths with `.js` extension (ES modules)
- Example: `import { estimateTokens } from './estimator.js'` (not `@estimator`)

**Import Style:**
- Named imports for specific exports: `import { estimateTokens, estimateTokensByPath } from './estimator.js'`
- Namespace imports for utility modules: `import * as fs from 'fs/promises'`, `import * as path from 'path'`
- Type imports explicitly marked: `import type { QualityScore, RetryContext } from './quality-gate.js'`

## Error Handling

**Patterns:**
- Custom error classes extend `Error`: `ContextOverflowError extends Error`
- Error names set: `this.name = 'ContextOverflowError'`
- Error properties preserved as public readonly: `public readonly requiredTokens: number`
- Try-catch with `error as NodeJS.ErrnoException` for type narrowing on filesystem errors

**File Operation Errors:**
- Explicit error code checking: `if ((error as NodeJS.ErrnoException).code === 'ENOENT') { return null; }`
- Graceful null returns on missing files instead of throwing
- Generic catch with silent failure: `try { ... } catch { return false; }`

**Async/Lock Errors:**
- Timeout errors thrown with descriptive messages: `throw new Error('Failed to acquire state file lock...')`
- Cleanup errors silently ignored (non-critical): `.catch(() => {})`
- State operation errors propagated: `await expect(...).rejects.toThrow()`

**Validation:**
- Type narrowing at boundary functions before operations
- No explicit validation library (Zod in deps but not used in observed code)
- Null/undefined checks: `if (!content || content.length === 0) { return 0; }`

## Logging

**Framework:** `console` (no logging library imported in main code)

**Patterns:**
- Observed: Minimal logging in production code
- Errors logged in tests via try-catch and assertion
- No debug logging detected
- Performance metrics collected in return objects (e.g., `LoadingStats` with `loadTimeMs`)

## Comments

**When to Comment:**
- Module-level: JSDoc comment describing purpose, algorithm, or contract
- Function-level: JSDoc comment with `@param`, `@returns`, `@example`, `@throws` tags
- Algorithm explanation: Comments before complex logic (e.g., Hangul character matching with Unicode ranges)
- Section headers: `// ============================================================================` to organize sections
- Constants: Inline explanation of empirical factors (e.g., `// Korean characters average ~0.7 tokens each`)

**JSDoc/TSDoc:**
- All exported functions have JSDoc comments
- Example format:
  ```typescript
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
  ```
- Tags used: `@param`, `@returns`, `@example`, `@throws`, `@internal` (implied for private)
- No `@deprecated` observed

## Function Design

**Size:**
- Median function: 20-50 lines
- Large functions: 100-200 lines (e.g., `collectCandidates` 200+, `loadContextFiles` 300+)
- Longer functions handle multiple responsibilities (candidate collection, loading, priority calculation)

**Parameters:**
- Maximum 3-4 parameters typical
- Interface/config objects used for optional/multiple parameters (e.g., `BudgetConfig`)
- Async functions use promise-based callbacks
- Optional parameters in interfaces: `property?: type`

**Return Values:**
- Single-responsibility functions return simple types: `number`, `string`, `boolean`
- Complex operations return rich objects: `OverflowResult`, `LoadContextResult`, `ContextBudget`
- Async functions return `Promise<T>`
- Null returns for missing/optional resources: `Promise<string | null>`

## Module Design

**Exports:**
- Barrel exports in `index.ts` re-export from submodules
- Example from `src/index.ts`:
  ```typescript
  export * from './types.js';
  export * from './context/index.js';
  export * from './state/index.js';
  export * from './retry/index.js';
  ```
- Submodule `index.ts` files aggregate related exports (e.g., `context/index.ts` exports loader, config, estimator)

**Barrel Files:**
- Used: `src/index.ts`, `src/context/index.ts`, `src/state/index.ts`, `src/retry/index.ts`
- Purpose: Simplify public API and organize related exports
- Pattern: Each directory has `index.ts` that re-exports from its modules

**Module Organization by Layer:**
- `types.ts`: Shared type definitions for the module
- `*-handler.ts` or `*-engine.ts`: Core logic implementations
- `*.ts`: Utility modules (estimator, loader, lock)
- `index.ts`: Public API aggregation

## Directory Structure by Purpose

**Context Module** (`src/context/`):
- `config.ts`: Configuration interfaces and defaults
- `types.ts`: Type definitions (ContextItem, ContextBudget, BudgetConfig)
- `estimator.ts`: Token counting and content-type detection functions
- `priorities.ts`: Priority calculation for context items
- `loader.ts`: Main loading orchestration with budget management
- `overflow-handler.ts`: Multi-level strategies for budget overflow
- `index.ts`: Exports public API

**Retry Module** (`src/retry/`):
- `quality-gate.ts`: Retry strategy logic and prompt building
- `index.ts`: Exports quality gate functions

**State Module** (`src/state/`):
- `lock.ts`: Atomic file locking with timeout
- `backup.ts`: State file backup and restore utilities
- `index.ts`: Exports lock and backup utilities

## Cross-Module Patterns

**Type Sharing:**
- Core types defined in `types.ts` within each module
- No type duplication across modules
- Shared utilities (`ItemMetadata`, `BudgetConfig`) in `context/types.ts`

**Error Propagation:**
- Errors defined in types module: `ContextOverflowError`
- Constructors capture context: `requiredTokens`, `availableTokens`, `overflowItems`

**Dependency Injection:**
- Configuration passed as parameters: `config: Required<BudgetConfig>`
- No global state or singletons observed
- Functions remain stateless and testable

---

*Convention analysis: 2026-02-05*
