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
    const json = '{"id": "char_001"}';
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
    expect(spy).toHaveBeenCalled();
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
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

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
