# Runtime Safety Hardening (Sub-project 1)

Zod 런타임 검증 + 캐릭터 압축 안전성 + 에러 로깅 체계화를 하나로 묶은 서브 프로젝트.

## 1. Problem Statement

- `JSON.parse()` 8곳이 런타임 검증 없이 사용됨 → 잘못된 데이터가 파이프라인에 침투
- `compressCharacter()`가 필수 필드 누락 시 손상된 출력을 생성
- catch 블록 7곳이 에러를 반환만 하고 로깅하지 않아 디버깅 어려움
- Zod가 의존성에 있지만 사용되지 않음

## 2. Solution Overview

### A. JSON Parse Guard (Zod 기반)

각 `JSON.parse` 호출 후 Zod 스키마로 최소 필수 필드를 검증하는 가드 함수 도입.

**새 파일**: `src/validation/guards.ts`

```typescript
import { z } from 'zod';

// 각 JSON 타입별 최소 스키마 (필수 필드만)
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

/**
 * Safe JSON parse with Zod validation.
 * Returns parsed data on success, null on failure.
 * Logs validation errors via logger.
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
      console.error(`[validation] ${context}: ${result.error.message}`);
      return null;
    }
    return result.data;
  } catch (err) {
    console.error(`[validation] ${context}: JSON parse failed - ${err}`);
    return null;
  }
}

/**
 * Safe JSON parse that returns raw object with type assertion.
 * Validates minimum required fields, passes through all other fields.
 */
export function safeParsePassthrough<T>(
  content: string,
  schema: z.ZodType<T>,
  context: string
): (T & Record<string, unknown>) | null {
  try {
    const raw = JSON.parse(content);
    const result = schema.passthrough().safeParse(raw);
    if (!result.success) {
      console.error(`[validation] ${context}: ${result.error.message}`);
      return null;
    }
    return result.data as T & Record<string, unknown>;
  } catch (err) {
    console.error(`[validation] ${context}: JSON parse failed - ${err}`);
    return null;
  }
}
```

### B. Character Compression Safety

`overflow-handler.ts`의 `compressCharacter()`에 필수 필드 검증 추가:

```typescript
function compressCharacter(content: string, maxLength: number, stripDetails: boolean): string {
  const char = safeParsePassthrough(content, CharacterGuard, 'compressCharacter');
  if (!char) return content; // 검증 실패 시 원본 반환 (안전한 fallback)

  const compressed: Record<string, unknown> = {
    id: char.id,
    name: char.name,
    role: char.role,
  };

  // basic이 있으면 안전하게 접근
  if (char.basic && typeof char.basic === 'object') {
    const basic = char.basic as Record<string, unknown>;
    compressed.basic = {
      age: basic.age ?? 'unknown',
      gender: basic.gender ?? 'unknown',
    };

    if (!stripDetails && basic.appearance && typeof basic.appearance === 'object') {
      const appearance = basic.appearance as Record<string, unknown>;
      const features = Array.isArray(appearance.features) ? appearance.features.slice(0, 2) : [];
      compressed.basic = { ...compressed.basic as object, appearance: { features } };
    }
  }

  // inner가 있으면 안전하게 접근
  if (char.inner && typeof char.inner === 'object') {
    const inner = char.inner as Record<string, unknown>;
    compressed.inner = {
      want: inner.want ?? '',
      need: inner.need ?? '',
      fatal_flaw: inner.fatal_flaw ?? '',
    };
  }
  // ... 나머지 기존 로직
}
```

핵심: 검증 실패 시 원본 content를 그대로 반환 (데이터 손실 방지).

### C. Logger Utility

**새 파일**: `src/utils/logger.ts`

```typescript
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface Logger {
  debug(msg: string, ...args: unknown[]): void;
  info(msg: string, ...args: unknown[]): void;
  warn(msg: string, ...args: unknown[]): void;
  error(msg: string, ...args: unknown[]): void;
}

export function createLogger(module: string): Logger {
  const log = (level: LogLevel, msg: string, ...args: unknown[]) => {
    const prefix = `[${module}]`;
    switch (level) {
      case 'debug': console.debug(prefix, msg, ...args); break;
      case 'info': console.error(prefix, msg, ...args); break; // stderr for info
      case 'warn': console.error(prefix, '⚠', msg, ...args); break;
      case 'error': console.error(prefix, '✗', msg, ...args); break;
    }
  };

  return {
    debug: (msg, ...args) => log('debug', msg, ...args),
    info: (msg, ...args) => log('info', msg, ...args),
    warn: (msg, ...args) => log('warn', msg, ...args),
    error: (msg, ...args) => log('error', msg, ...args),
  };
}
```

### 적용 대상 catch 블록 (7곳)

| 파일 | 위치 | 현재 | 변경 |
|------|------|------|------|
| `loader.ts:40` | loadFileContent | 에러 반환 | + `logger.warn('파일 로드 실패', path, err)` |
| `backup.ts:26` | createBackup | 에러 반환 | + `logger.error('백업 생성 실패', err)` |
| `storage.ts:72` | loadLibrary | 에러 반환 | + `logger.warn('라이브러리 로드 실패', err)` |
| `prose-surgeon.ts:531` | executeSurgery | 에러 반환 | + `logger.error('수술 실행 실패', err)` |
| `revision-stages.ts:144` | executeStage | 에러 반환 | + `logger.error('단계 실행 실패', err)` |
| `lock.ts:40` | acquireLock | 에러 반환 | + `logger.warn('잠금 획득 실패', err)` |
| `lock.ts:55` | releaseLock | 무시 | + `logger.debug('잠금 해제 실패 (무시)', err)` |

## 3. File Changes Summary

### 신규 생성

| 파일 | 설명 |
|------|------|
| `src/validation/guards.ts` | Zod 기반 JSON parse guard 함수 + 최소 스키마 |
| `src/validation/index.ts` | 모듈 exports |
| `src/utils/logger.ts` | createLogger 유틸리티 |
| `src/utils/index.ts` | 모듈 exports |
| `tests/validation/guards.test.ts` | guard 함수 테스트 |
| `tests/utils/logger.test.ts` | logger 테스트 |

### 수정

| 파일 | 변경 |
|------|------|
| `src/context/loader.ts` | JSON.parse 5곳 → safeParse/safeParsePassthrough |
| `src/context/overflow-handler.ts` | compressCharacter에 CharacterGuard + fallback |
| `src/self-improvement/quality-tracker.ts` | JSON.parse → safeParse |
| `src/style-library/storage.ts` | JSON.parse → safeParse |
| `src/state/backup.ts` | + logger.error |
| `src/state/lock.ts` | + logger.warn/debug |
| `src/pipeline/prose-surgeon.ts` | + logger.error |
| `src/quality/revision-stages.ts` | + logger.error |

## 4. Testing Strategy

### guards.test.ts

```typescript
describe('safeParse', () => {
  test('valid JSON + valid schema → parsed data', ...);
  test('valid JSON + invalid schema → null + error logged', ...);
  test('invalid JSON → null + error logged', ...);
  test('safeParsePassthrough preserves extra fields', ...);
});

describe('CharacterGuard', () => {
  test('valid character → passes', ...);
  test('missing id → fails', ...);
  test('missing name → fails', ...);
});
```

### logger.test.ts

```typescript
describe('createLogger', () => {
  test('prefixes module name', ...);
  test('warn outputs to stderr', ...);
  test('error outputs to stderr', ...);
});
```

## 5. Non-Goals

- 전체 JSON Schema를 Zod로 변환하지 않음 (필수 필드만)
- 기존 에러 반환 로직을 변경하지 않음 (로깅만 추가)
- 기존 타입 시스템을 Zod로 대체하지 않음 (보완만)
