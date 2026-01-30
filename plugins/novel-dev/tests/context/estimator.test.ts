import { describe, it, expect } from 'vitest';
import {
  estimateTokens,
  estimateTokensByPath,
  detectContentType,
  estimateTokensAuto,
  estimateTokensBatch,
  fitsInBudget,
} from '../../src/context/estimator.js';

describe('estimateTokens', () => {
  it('should return 0 for empty string', () => {
    expect(estimateTokens('')).toBe(0);
  });

  it('should return 0 for null-ish content', () => {
    expect(estimateTokens(null as any)).toBe(0);
  });

  it('should estimate Korean text tokens', () => {
    // 5 Korean chars * 0.7 = 3.5 -> ceil = 4
    const result = estimateTokens('안녕하세요', 'korean');
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThan(10);
  });

  it('should estimate English text tokens', () => {
    // 3 English words * 1.3 = 3.9 -> ceil = 4
    const result = estimateTokens('hello world test', 'mixed');
    expect(result).toBeGreaterThan(0);
  });

  it('should apply JSON overhead factor', () => {
    const content = '{"name": "test", "value": 42}';
    const jsonTokens = estimateTokens(content, 'json');
    const mixedTokens = estimateTokens(content, 'mixed');
    // JSON should be higher due to 1.2x overhead
    expect(jsonTokens).toBeGreaterThanOrEqual(mixedTokens);
  });

  it('should handle mixed Korean and English content', () => {
    const result = estimateTokens('안녕 hello 세계 world');
    expect(result).toBeGreaterThan(0);
  });

  it('should handle numbers', () => {
    const result = estimateTokens('12345 67890');
    expect(result).toBeGreaterThan(0);
  });

  it('should handle special characters', () => {
    const result = estimateTokens('!@#$%^&*()');
    expect(result).toBeGreaterThan(0);
  });

  it('should handle very long content', () => {
    const content = '한글테스트'.repeat(1000);
    const result = estimateTokens(content, 'korean');
    expect(result).toBeGreaterThan(1000);
  });
});

describe('estimateTokensByPath', () => {
  it('should return estimate for style-guide.json', () => {
    expect(estimateTokensByPath('/project/meta/style-guide.json')).toBe(600);
  });

  it('should return estimate for chapter JSON files', () => {
    expect(estimateTokensByPath('/project/chapters/chapter_001.json')).toBe(900);
  });

  it('should return estimate for chapter summary', () => {
    expect(estimateTokensByPath('/project/summaries/chapter_005_summary.md')).toBe(1400);
  });

  it('should return estimate for character files', () => {
    expect(estimateTokensByPath('/project/characters/char_1.json')).toBe(1500);
  });

  it('should return estimate for locations.json', () => {
    expect(estimateTokensByPath('/project/world/locations.json')).toBe(3000);
  });

  it('should return estimate for foreshadowing.json', () => {
    expect(estimateTokensByPath('/project/plot/foreshadowing.json')).toBe(2400);
  });

  it('should return estimate for act summary', () => {
    expect(estimateTokensByPath('/project/summaries/act_1_summary.md')).toBe(800);
  });

  it('should return default for unknown file types', () => {
    expect(estimateTokensByPath('/project/unknown.txt')).toBe(500);
  });
});

describe('detectContentType', () => {
  it('should detect JSON objects', () => {
    expect(detectContentType('{"key": "value"}')).toBe('json');
  });

  it('should detect JSON arrays', () => {
    expect(detectContentType('[1, 2, 3]')).toBe('json');
  });

  it('should detect Korean-dominant content', () => {
    // Korean chars > English chars * 2
    expect(detectContentType('안녕하세요 반갑습니다 한글 테스트')).toBe('korean');
  });

  it('should detect mixed content', () => {
    expect(detectContentType('Hello World 안녕')).toBe('mixed');
  });

  it('should handle whitespace-padded JSON', () => {
    expect(detectContentType('  {"key": "value"}  ')).toBe('json');
  });
});

describe('estimateTokensAuto', () => {
  it('should auto-detect type and estimate', () => {
    const jsonResult = estimateTokensAuto('{"name": "test"}');
    expect(jsonResult).toBeGreaterThan(0);
  });
});

describe('estimateTokensBatch', () => {
  it('should estimate multiple items', () => {
    const result = estimateTokensBatch([
      { content: '안녕하세요' },
      { content: '{"key": "value"}', type: 'json' as const },
    ]);
    expect(result.total).toBeGreaterThan(0);
    expect(result.individual).toHaveLength(2);
    expect(result.total).toBe(result.individual[0] + result.individual[1]);
  });

  it('should handle empty array', () => {
    const result = estimateTokensBatch([]);
    expect(result.total).toBe(0);
    expect(result.individual).toHaveLength(0);
  });
});

describe('fitsInBudget', () => {
  it('should report content fits within budget', () => {
    const result = fitsInBudget('안녕', 100);
    expect(result.fits).toBe(true);
    expect(result.remaining).toBeGreaterThan(0);
    expect(result.overBy).toBe(0);
  });

  it('should report content exceeds budget', () => {
    const longContent = '한글'.repeat(1000);
    const result = fitsInBudget(longContent, 1);
    expect(result.fits).toBe(false);
    expect(result.overBy).toBeGreaterThan(0);
    expect(result.remaining).toBe(0);
  });
});
