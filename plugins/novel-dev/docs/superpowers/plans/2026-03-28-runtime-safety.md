# Runtime Safety Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Zod 런타임 검증 + 캐릭터 압축 안전성 + 에러 로깅 체계화를 통해 novel-dev 파이프라인의 런타임 안전성을 강화한다

**Architecture:** `src/utils/logger.ts`에 간단한 로거를 만들고, `src/validation/guards.ts`에 Zod 기반 safeParse 유틸리티 + 최소 스키마를 정의한다. 기존 8개 JSON.parse 호출을 safeParse로 교체하고, 7개 catch 블록에 로깅을 추가한다. compressCharacter()에 검증 + fallback을 추가한다.

**Tech Stack:** TypeScript, Zod (^3.25.0, already installed), Vitest

---

## File Structure

### 신규 생성

| 파일 | 책임 |
|------|------|
| `src/utils/logger.ts` | createLogger(module) 유틸리티 |
| `src/utils/index.ts` | utils 모듈 exports |
| `src/validation/guards.ts` | safeParse, safeParsePassthrough + 7개 Zod 최소 스키마 |
| `src/validation/index.ts` | validation 모듈 exports |
| `tests/utils/logger.test.ts` | logger 테스트 |
| `tests/validation/guards.test.ts` | safeParse + 스키마 테스트 |

### 수정

| 파일 | 변경 |
|------|------|
| `src/context/loader.ts` | JSON.parse 5곳 → safeParse, catch 1곳 + logger |
| `src/context/overflow-handler.ts` | compressCharacter JSON.parse → safeParsePassthrough + fallback |
| `src/self-improvement/quality-tracker.ts` | JSON.parse → safeParse |
| `src/style-library/storage.ts` | JSON.parse → safeParse, catch + logger |
| `src/state/backup.ts` | catch + logger |
| `src/state/lock.ts` | catch 2곳 + logger |
| `src/pipeline/prose-surgeon.ts` | catch + logger |
| `src/quality/revision-stages.ts` | catch + logger |

---

### Task 1: Logger Utility

**Files:**
- Create: `src/utils/logger.ts`
- Create: `src/utils/index.ts`
- Test: `tests/utils/logger.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/utils/logger.test.ts
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { createLogger } from '../../src/utils/logger.js';

describe('createLogger', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  test('prefixes module name to warn messages', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const logger = createLogger('loader');
    logger.warn('file not found');
    expect(spy).toHaveBeenCalledWith('[loader]', '⚠', 'file not found');
  });

  test('prefixes module name to error messages', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const logger = createLogger('backup');
    logger.error('backup failed', { path: '/tmp' });
    expect(spy).toHaveBeenCalledWith('[backup]', '✗', 'backup failed', { path: '/tmp' });
  });

  test('debug uses console.debug', () => {
    const spy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    const logger = createLogger('lock');
    logger.debug('lock released');
    expect(spy).toHaveBeenCalledWith('[lock]', 'lock released');
  });

  test('info uses console.error (stderr)', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const logger = createLogger('test');
    logger.info('loading context');
    expect(spy).toHaveBeenCalledWith('[test]', 'loading context');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/utils/logger.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write implementation**

```typescript
// src/utils/logger.ts
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface Logger {
  debug(msg: string, ...args: unknown[]): void;
  info(msg: string, ...args: unknown[]): void;
  warn(msg: string, ...args: unknown[]): void;
  error(msg: string, ...args: unknown[]): void;
}

export function createLogger(module: string): Logger {
  const prefix = `[${module}]`;

  return {
    debug: (msg, ...args) => console.debug(prefix, msg, ...args),
    info: (msg, ...args) => console.error(prefix, msg, ...args),
    warn: (msg, ...args) => console.error(prefix, '⚠', msg, ...args),
    error: (msg, ...args) => console.error(prefix, '✗', msg, ...args),
  };
}
```

```typescript
// src/utils/index.ts
export { createLogger } from './logger.js';
export type { Logger } from './logger.js';
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/utils/logger.test.ts`
Expected: 4 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/utils/logger.ts src/utils/index.ts tests/utils/logger.test.ts
git commit -m "feat(novel-dev): add createLogger utility"
```

---

### Task 2: Validation Guards (safeParse + Zod Schemas)

**Files:**
- Create: `src/validation/guards.ts`
- Create: `src/validation/index.ts`
- Test: `tests/validation/guards.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/validation/guards.test.ts
import { describe, test, expect, vi, beforeEach } from 'vitest';
import {
  safeParse,
  safeParsePassthrough,
  CharacterGuard,
  ChapterPlotGuard,
  ForeshadowingGuard,
  StructureGuard,
  ManifestGuard,
  TrendDataGuard,
  StyleLibraryGuard,
} from '../../src/validation/guards.js';

describe('safeParse', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  test('valid JSON + valid schema returns parsed data', () => {
    const json = '{"id": "char_001", "name": "유나", "role": "protagonist"}';
    const result = safeParse(json, CharacterGuard, 'test');
    expect(result).toEqual({ id: 'char_001', name: '유나', role: 'protagonist' });
  });

  test('valid JSON + invalid schema returns null', () => {
    const json = '{"id": "char_001"}'; // missing name, role
    const result = safeParse(json, CharacterGuard, 'test');
    expect(result).toBeNull();
  });

  test('invalid JSON returns null', () => {
    const result = safeParse('not json{', CharacterGuard, 'test');
    expect(result).toBeNull();
  });

  test('logs error on validation failure', () => {
    const spy = vi.spyOn(console, 'error');
    safeParse('{"id": 123}', CharacterGuard, 'myContext');
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining('[validation] myContext:'),
      expect.anything()
    );
  });
});

describe('safeParsePassthrough', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  test('preserves extra fields beyond schema', () => {
    const json = JSON.stringify({
      id: 'char_001', name: '유나', role: 'protagonist',
      basic: { age: 25 }, inner: { want: '승진' },
    });
    const result = safeParsePassthrough(json, CharacterGuard, 'test');
    expect(result).not.toBeNull();
    expect(result!.id).toBe('char_001');
    expect((result as Record<string, unknown>).basic).toEqual({ age: 25 });
    expect((result as Record<string, unknown>).inner).toEqual({ want: '승진' });
  });

  test('returns null on schema failure', () => {
    const result = safeParsePassthrough('{"name": "유나"}', CharacterGuard, 'test');
    expect(result).toBeNull();
  });
});

describe('Guard schemas', () => {
  test('ChapterPlotGuard accepts valid plot', () => {
    const json = '{"chapter_number": 1, "scenes": [{"scene_number": 1}]}';
    expect(safeParse(json, ChapterPlotGuard, 'test')).not.toBeNull();
  });

  test('ForeshadowingGuard accepts valid foreshadowing', () => {
    const json = '{"items": [{"id": "fs_001"}]}';
    expect(safeParse(json, ForeshadowingGuard, 'test')).not.toBeNull();
  });

  test('StructureGuard accepts valid structure', () => {
    const json = '{"acts": [{"act_number": 1}]}';
    expect(safeParse(json, StructureGuard, 'test')).not.toBeNull();
  });

  test('ManifestGuard accepts valid manifest', () => {
    const json = '{"total_chapters": 50}';
    expect(safeParse(json, ManifestGuard, 'test')).not.toBeNull();
  });

  test('TrendDataGuard accepts valid trend data', () => {
    const json = '{"chapters": []}';
    expect(safeParse(json, TrendDataGuard, 'test')).not.toBeNull();
  });

  test('StyleLibraryGuard accepts valid library', () => {
    const json = '{"exemplars": []}';
    expect(safeParse(json, StyleLibraryGuard, 'test')).not.toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/validation/guards.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write implementation**

```typescript
// src/validation/guards.ts
import { z } from 'zod';

// ============================================================================
// Minimal Guard Schemas (required fields only — passthrough preserves the rest)
// ============================================================================

export const CharacterGuard = z.object({
  id: z.string(),
  name: z.string(),
  role: z.string(),
});

export const ChapterPlotGuard = z.object({
  chapter_number: z.number(),
  scenes: z.array(z.object({ scene_number: z.number() })),
});

export const ForeshadowingGuard = z.object({
  items: z.array(z.object({ id: z.string() })),
});

export const StructureGuard = z.object({
  acts: z.array(z.object({ act_number: z.number() })),
});

export const ManifestGuard = z.object({
  total_chapters: z.number(),
});

export const TrendDataGuard = z.object({
  chapters: z.array(z.unknown()),
});

export const StyleLibraryGuard = z.object({
  exemplars: z.array(z.unknown()),
});

// ============================================================================
// Safe Parse Functions
// ============================================================================

/**
 * Safe JSON parse with Zod validation.
 * Returns validated data on success, null on failure.
 * Strips fields not in schema.
 */
export function safeParse<T>(
  content: string,
  schema: z.ZodType<T>,
  context: string
): T | null {
  try {
    const raw = JSON.parse(content);
    const result = schema.safeParse(raw);
    if (!result.success) {
      console.error(`[validation] ${context}:`, result.error.message);
      return null;
    }
    return result.data;
  } catch (err) {
    console.error(`[validation] ${context}:`, `JSON parse failed — ${err}`);
    return null;
  }
}

/**
 * Safe JSON parse that validates minimum required fields
 * but preserves ALL additional fields (passthrough mode).
 * Use when you need the full object but want guard rails on required fields.
 */
export function safeParsePassthrough<T extends z.ZodRawShape>(
  content: string,
  schema: z.ZodObject<T>,
  context: string
): z.infer<z.ZodObject<T>> & Record<string, unknown> | null {
  try {
    const raw = JSON.parse(content);
    const result = schema.passthrough().safeParse(raw);
    if (!result.success) {
      console.error(`[validation] ${context}:`, result.error.message);
      return null;
    }
    return result.data as z.infer<z.ZodObject<T>> & Record<string, unknown>;
  } catch (err) {
    console.error(`[validation] ${context}:`, `JSON parse failed — ${err}`);
    return null;
  }
}
```

```typescript
// src/validation/index.ts
export {
  safeParse,
  safeParsePassthrough,
  CharacterGuard,
  ChapterPlotGuard,
  ForeshadowingGuard,
  StructureGuard,
  ManifestGuard,
  TrendDataGuard,
  StyleLibraryGuard,
} from './guards.js';
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/validation/guards.test.ts`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/validation/guards.ts src/validation/index.ts tests/validation/guards.test.ts
git commit -m "feat(novel-dev): add Zod-based safeParse guards"
```

---

### Task 3: Apply safeParse to loader.ts (5 parse sites)

**Files:**
- Modify: `src/context/loader.ts`

- [ ] **Step 1: Add imports at top of loader.ts**

After existing imports (line 24), add:

```typescript
import { safeParsePassthrough, ManifestGuard, ChapterPlotGuard, ForeshadowingGuard, StructureGuard } from '../validation/guards.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('context-loader');
```

- [ ] **Step 2: Replace manifest parse (line 199)**

Replace:
```typescript
        const manifest = JSON.parse(manifestContent);
```

With:
```typescript
        const manifest = safeParsePassthrough(manifestContent, ManifestGuard, 'character manifest') as Record<string, unknown> | null;
        if (!manifest) {
          logger.warn('캐릭터 매니페스트 파싱 실패, 건너뜀');
          return;
        }
```

Note: ManifestGuard expects `total_chapters` but character manifest has `characters`. Since character manifests are flexible (characters.json or index.json), change this to a simple JSON.parse with try-catch + logger instead:

```typescript
        let manifest: Record<string, unknown>;
        try {
          manifest = JSON.parse(manifestContent);
        } catch {
          logger.warn('캐릭터 매니페스트 파싱 실패', actualManifestPath);
          return;
        }
```

- [ ] **Step 3: Replace chapter plot parse in getAppearingCharacters (line 254)**

Replace:
```typescript
      const plot = JSON.parse(content);
```

With:
```typescript
      const plot = safeParsePassthrough(content, ChapterPlotGuard, `chapter plot ${chapterNumber}`);
      if (!plot) return [];
```

- [ ] **Step 4: Replace chapter plot parse in getUsedLocations (line 311)**

Replace:
```typescript
      const plot = JSON.parse(content);
```

With:
```typescript
      const plot = safeParsePassthrough(content, ChapterPlotGuard, `chapter plot locations ${chapterNumber}`);
      if (!plot) return [];
```

- [ ] **Step 5: Replace foreshadowing parse (line 340)**

Replace:
```typescript
        const foreshadowing = JSON.parse(content);
```

With:
```typescript
        const foreshadowing = safeParsePassthrough(content, ForeshadowingGuard, 'foreshadowing');
        if (!foreshadowing) {
          // Fallback: add whole file without filtering
          candidates.push({
            id: 'foreshadowing-all',
            type: 'foreshadowing',
            path: foreshadowingPath,
            estimatedTokens: estimateTokensByPath(foreshadowingPath),
            priority: getPriority('foreshadowing', { currentChapter: chapterNumber }),
            required: false,
          });
          return;
        }
```

- [ ] **Step 6: Replace structure parse (line 423)**

Replace:
```typescript
    const structure = JSON.parse(content);
```

With:
```typescript
    const structure = safeParsePassthrough(content, StructureGuard, 'plot structure');
    if (!structure) return Math.ceil(chapterNumber / chaptersPerAct);
```

- [ ] **Step 7: Add logger to loadFile catch block (line 40-45)**

The existing catch already handles ENOENT correctly. Add logger for non-ENOENT errors. Replace:

```typescript
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null;
    }
    throw error;
  }
```

With:

```typescript
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null;
    }
    logger.error('파일 로드 실패', filePath, error);
    throw error;
  }
```

- [ ] **Step 8: Run existing tests + build**

Run: `npx vitest run && npx tsc --noEmit`
Expected: All tests pass, no type errors

- [ ] **Step 9: Commit**

```bash
git add src/context/loader.ts
git commit -m "feat(novel-dev): apply safeParse to context loader (5 parse sites)"
```

---

### Task 4: Apply safeParse to overflow-handler.ts (compressCharacter)

**Files:**
- Modify: `src/context/overflow-handler.ts`

- [ ] **Step 1: Add imports at top of file**

```typescript
import { safeParsePassthrough, CharacterGuard } from '../validation/guards.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('overflow-handler');
```

- [ ] **Step 2: Replace compressCharacter function (lines 303-360)**

Replace the entire function body:

```typescript
function compressCharacter(
  content: string,
  maxLength: number,
  stripDetails: boolean
): string {
  const char = safeParsePassthrough(content, CharacterGuard, 'compressCharacter');
  if (!char) {
    // Validation failed — return truncated original (safe fallback)
    logger.warn('캐릭터 압축 실패: 검증 미통과, 원본 잘라서 반환');
    return content.substring(0, maxLength - 3) + '...';
  }

  // Create compressed version with essentials only
  const compressed: Record<string, unknown> = {
    id: char.id,
    name: char.name,
    role: char.role,
  };

  // Keep basic info (safe access)
  const basic = char.basic as Record<string, unknown> | undefined;
  if (basic && typeof basic === 'object') {
    compressed.basic = {
      age: basic.age ?? 'unknown',
      gender: basic.gender ?? 'unknown',
    };

    if (!stripDetails) {
      const appearance = basic.appearance as Record<string, unknown> | undefined;
      if (appearance && typeof appearance === 'object') {
        const features = Array.isArray(appearance.features)
          ? appearance.features.slice(0, 2)
          : [];
        compressed.basic = {
          ...(compressed.basic as object),
          appearance: { features },
        };
      }
    }
  }

  // Keep inner motivation (safe access)
  const inner = char.inner as Record<string, unknown> | undefined;
  if (inner && typeof inner === 'object') {
    compressed.inner = {
      want: inner.want ?? '',
      need: inner.need ?? '',
      fatal_flaw: inner.fatal_flaw ?? '',
    };
  }

  const result = JSON.stringify(compressed, null, 2);

  // If still too long, strip more
  if (result.length > maxLength) {
    const minimal = {
      id: char.id,
      name: char.name,
      role: char.role,
      summary: `${(basic?.age as string | number) ?? '?'}세 ${(basic?.gender as string) ?? '?'}, ${(inner?.fatal_flaw as string) ?? ''}`,
    };
    return JSON.stringify(minimal, null, 2);
  }

  return result;
}
```

- [ ] **Step 3: Run build + tests**

Run: `npx tsc --noEmit && npx vitest run`
Expected: No type errors, all tests pass

- [ ] **Step 4: Commit**

```bash
git add src/context/overflow-handler.ts
git commit -m "feat(novel-dev): add validation + safe fallback to compressCharacter"
```

---

### Task 5: Apply safeParse to remaining files (quality-tracker, storage)

**Files:**
- Modify: `src/self-improvement/quality-tracker.ts`
- Modify: `src/style-library/storage.ts`

- [ ] **Step 1: Update quality-tracker.ts (line 70)**

Add import at top:
```typescript
import { createLogger } from '../utils/logger.js';
const logger = createLogger('quality-tracker');
```

Replace line 70:
```typescript
  const parsed = JSON.parse(content) as TrendData;
```

With:
```typescript
  let parsed: TrendData;
  try {
    parsed = JSON.parse(content) as TrendData;
  } catch {
    logger.warn('quality-trend.json 파싱 실패, 빈 데이터로 초기화');
    return createEmptyTrendData(projectId);
  }
```

- [ ] **Step 2: Update storage.ts (lines 64, 72-74)**

Add import at top:
```typescript
import { createLogger } from '../utils/logger.js';
const logger = createLogger('style-library');
```

Replace lines 62-75:
```typescript
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    let library: StyleLibrary;
    try {
      library = JSON.parse(content) as StyleLibrary;
    } catch {
      logger.warn('스타일 라이브러리 JSON 파싱 실패, 빈 라이브러리로 초기화');
      return createEmptyLibrary();
    }

    // Ensure required fields exist for backward compatibility
    if (!library.metadata) {
      library.metadata = createEmptyLibrary().metadata;
    }

    return library;
  } catch (error) {
    logger.error('스타일 라이브러리 로드 실패', error);
    return createEmptyLibrary();
  }
```

- [ ] **Step 3: Run build + tests**

Run: `npx tsc --noEmit && npx vitest run`
Expected: No type errors, all tests pass

- [ ] **Step 4: Commit**

```bash
git add src/self-improvement/quality-tracker.ts src/style-library/storage.ts
git commit -m "feat(novel-dev): add safeParse + logging to quality-tracker and style-library"
```

---

### Task 6: Add logging to remaining catch blocks (4 files)

**Files:**
- Modify: `src/state/backup.ts`
- Modify: `src/state/lock.ts`
- Modify: `src/pipeline/prose-surgeon.ts`
- Modify: `src/quality/revision-stages.ts`

- [ ] **Step 1: Update backup.ts**

Add import at top:
```typescript
import { createLogger } from '../utils/logger.js';
const logger = createLogger('state-backup');
```

Replace line 30:
```typescript
      console.warn('State restored from backup due to error.');
```
With:
```typescript
      logger.warn('에러로 인해 백업에서 상태 복원됨', stateFilePath);
```

- [ ] **Step 2: Update lock.ts**

Add import at top:
```typescript
import { createLogger } from '../utils/logger.js';
const logger = createLogger('state-lock');
```

Replace line 36-38 (unlock catch):
```typescript
        } catch {
          // Ignore errors during unlock (file may already be deleted)
        }
```
With:
```typescript
        } catch (unlockErr) {
          logger.debug('잠금 해제 실패 (무시)', unlockErr);
        }
```

Add logging at line 44-46 (unexpected error during lock):
```typescript
      if (error.code !== 'EEXIST') {
        logger.error('잠금 획득 중 예기치 않은 에러', error);
        throw error;
      }
```

- [ ] **Step 3: Update prose-surgeon.ts**

Add import at top:
```typescript
import { createLogger } from '../utils/logger.js';
const logger = createLogger('prose-surgeon');
```

Replace line 531 catch block — add logging before the return:
```typescript
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('수술 실행 실패', directive.id, errorMessage);
    return {
```

- [ ] **Step 4: Update revision-stages.ts**

Add import at top:
```typescript
import { createLogger } from '../utils/logger.js';
const logger = createLogger('revision-stages');
```

Replace line 144-146 catch block:
```typescript
      } catch (error) {
        // Continue with next directive on error
      }
```
With:
```typescript
      } catch (error) {
        logger.warn('디렉티브 처리 실패, 다음으로 진행', directive?.id, error);
      }
```

- [ ] **Step 5: Run build + tests**

Run: `npx tsc --noEmit && npx vitest run`
Expected: No type errors, all tests pass

- [ ] **Step 6: Commit**

```bash
git add src/state/backup.ts src/state/lock.ts src/pipeline/prose-surgeon.ts src/quality/revision-stages.ts
git commit -m "feat(novel-dev): add structured logging to catch blocks (4 files)"
```

---

### Task 7: Final Validation + Version Bump

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Run full test suite**

Run: `npx vitest run`
Expected: All tests pass (existing + 2 new test files)

- [ ] **Step 2: Run TypeScript build**

Run: `npx tsc`
Expected: Build succeeds, dist/ updated

- [ ] **Step 3: Run post-build verification**

Run: `npm run verify:build`
Expected: All required files present in dist/

- [ ] **Step 4: Verify new files in dist/**

Run: `ls dist/utils/logger.js dist/validation/guards.js`
Expected: Both files exist

- [ ] **Step 5: Version bump**

`package.json`: `1.2.0` → `1.2.1` (patch — safety improvement, no API change)
`.claude-plugin/plugin.json`: `1.2.0` → `1.2.1`

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "feat(novel-dev): v1.2.1 — runtime safety hardening (Zod validation + logging)"
```
