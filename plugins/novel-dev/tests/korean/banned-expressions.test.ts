import { describe, it, expect, beforeEach } from 'vitest';
import {
  detectBannedExpressions,
  getSuggestedReplacement,
  getBannedReason,
  countBySeverity,
  countByCategory,
  getUniqueCategories,
  BANNED_EXPRESSIONS,
  loadBannedExpressions,
} from '../../src/korean/banned-expressions.js';

// ============================================================================
// Setup
// ============================================================================

beforeEach(() => {
  // Ensure expressions are loaded for each test
  loadBannedExpressions();
});

// ============================================================================
// BANNED_EXPRESSIONS Data Tests
// ============================================================================

describe('BANNED_EXPRESSIONS', () => {
  it('should load expressions from JSON', () => {
    expect(BANNED_EXPRESSIONS.length).toBeGreaterThan(10);
  });

  it('should include critical AI-tell patterns', () => {
    const critical = BANNED_EXPRESSIONS.filter(e => e.severity === 'critical');
    expect(critical.length).toBeGreaterThan(0);
    expect(critical.some(e => e.pattern.includes('한편'))).toBe(true);
  });

  it('should include all severity levels', () => {
    const severities = new Set(BANNED_EXPRESSIONS.map(e => e.severity));
    expect(severities.has('critical')).toBe(true);
    expect(severities.has('high')).toBe(true);
    expect(severities.has('medium')).toBe(true);
    expect(severities.has('low')).toBe(true);
  });

  it('should include all categories', () => {
    const categories = new Set(BANNED_EXPRESSIONS.map(e => e.category));
    expect(categories.has('ai-tell')).toBe(true);
    expect(categories.has('archaic-verb')).toBe(true);
    expect(categories.has('translationese')).toBe(true);
    expect(categories.has('punctuation')).toBe(true);
    expect(categories.has('pronoun-overuse')).toBe(true);
  });

  it('should have replacements for each expression', () => {
    for (const expr of BANNED_EXPRESSIONS) {
      expect(expr.replacements.length).toBeGreaterThan(0);
    }
  });
});

// ============================================================================
// detectBannedExpressions Tests
// ============================================================================

describe('detectBannedExpressions', () => {
  describe('AI-tell detection', () => {
    it('should detect "한편," AI-tell pattern', () => {
      const content = '그는 문을 열었다. 한편, 그녀는 창가에 서 있었다.';
      const matches = detectBannedExpressions(content, 'narration', 'critical');

      expect(matches.length).toBeGreaterThan(0);
      expect(matches[0].matchedText).toBe('한편,');
      expect(matches[0].severity).toBe('critical');
      expect(matches[0].category).toBe('ai-tell');
    });

    it('should detect "그러나," pattern', () => {
      const content = '그러나, 그것은 사실이 아니었다.';
      const matches = detectBannedExpressions(content, 'narration', 'critical');

      expect(matches.some(m => m.matchedText === '그러나,')).toBe(true);
    });

    it('should detect "따라서," pattern', () => {
      const content = '따라서, 우리는 출발했다.';
      const matches = detectBannedExpressions(content, 'narration', 'critical');

      expect(matches.some(m => m.matchedText === '따라서,')).toBe(true);
    });
  });

  describe('archaic verb detection', () => {
    it('should detect "~하였다" archaic verb form', () => {
      const content = '그는 그녀에게 말하였다.';
      const matches = detectBannedExpressions(content, 'narration', 'critical');

      expect(matches.some(m => m.matchedText.includes('하였다'))).toBe(true);
    });

    it('should detect "~되었다" archaic verb form', () => {
      const content = '그것이 발견되었다.';
      const matches = detectBannedExpressions(content, 'narration', 'critical');

      expect(matches.some(m => m.matchedText.includes('되었다'))).toBe(true);
    });
  });

  describe('translationese detection', () => {
    it('should detect "에 있어서" translationese pattern', () => {
      const content = '이것은 한국 문화에 있어서 중요한 요소다.';
      const matches = detectBannedExpressions(content, 'narration', 'high');

      expect(matches.some(m => m.matchedText.includes('에 있어서'))).toBe(true);
    });

    it('should detect "로 인한" translationese pattern', () => {
      const content = '그 사고로 인한 피해가 컸다.';
      const matches = detectBannedExpressions(content, 'narration', 'high');

      expect(matches.some(m => m.matchedText.includes('로 인한'))).toBe(true);
    });
  });

  describe('dialogue context handling', () => {
    it('should skip narration patterns inside dialogue', () => {
      const content = '"한편, 나는 그렇게 생각해." 그녀가 말했다.';
      const matches = detectBannedExpressions(content, 'narration', 'critical');

      // "한편," is in dialogue, should be skipped for narration context
      expect(matches.filter(m => m.matchedText === '한편,').length).toBe(0);
    });

    it('should detect patterns outside dialogue', () => {
      const content = '그녀가 말했다. 한편, 그는 침묵했다.';
      const matches = detectBannedExpressions(content, 'narration', 'critical');

      expect(matches.some(m => m.matchedText === '한편,')).toBe(true);
      expect(matches[0].inDialogue).toBe(false);
    });
  });

  describe('severity filtering', () => {
    it('should respect minimum severity filter', () => {
      const content = '한편, 그녀는 , 그리고 기다렸다.';
      const criticalOnly = detectBannedExpressions(content, 'narration', 'critical');
      const allSeverities = detectBannedExpressions(content, 'narration', 'low');

      expect(allSeverities.length).toBeGreaterThanOrEqual(criticalOnly.length);
    });

    it('should filter out low severity when minimum is medium', () => {
      const content = '그녀는 창밖을 보았다. 그것은 아름다웠다.';
      const mediumUp = detectBannedExpressions(content, 'narration', 'medium');
      const lowUp = detectBannedExpressions(content, 'narration', 'low');

      // If there are low severity matches, they should be filtered out in mediumUp
      const lowOnlyMatches = lowUp.filter(m => m.severity === 'low');
      if (lowOnlyMatches.length > 0) {
        expect(mediumUp.length).toBeLessThan(lowUp.length);
      }
    });
  });

  describe('sorting behavior', () => {
    it('should sort results by severity then position', () => {
      const content = ', 그리고 한편, 다음으로 , 또한 말했다.';
      const matches = detectBannedExpressions(content, 'narration', 'medium');

      if (matches.length >= 2) {
        const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        // First match should have equal or higher severity than second
        expect(severityOrder[matches[0].severity]).toBeLessThanOrEqual(severityOrder[matches[1].severity]);
      }
    });

    it('should sort by position when severity is equal', () => {
      const content = '한편, 그리고 그러나, 다음으로';
      const matches = detectBannedExpressions(content, 'narration', 'critical');

      const criticalMatches = matches.filter(m => m.severity === 'critical');
      if (criticalMatches.length >= 2) {
        expect(criticalMatches[0].position).toBeLessThan(criticalMatches[1].position);
      }
    });
  });
});

// ============================================================================
// getSuggestedReplacement Tests
// ============================================================================

describe('getSuggestedReplacement', () => {
  it('should return first non-empty replacement', () => {
    const content = '한편, 그녀는 기다렸다.';
    const matches = detectBannedExpressions(content, 'narration', 'critical');

    if (matches.length > 0) {
      const replacement = getSuggestedReplacement(matches[0]);
      // First non-empty replacement for 한편, is "그때"
      expect(replacement).not.toBe('');
      expect(replacement).not.toBe('[삭제]');
    }
  });

  it('should return [삭제] when all replacements are empty', () => {
    // Create a mock match with only empty replacements
    const match = {
      expression: {
        pattern: '테스트',
        replacements: ['', ''],
        context: 'narration' as const,
      },
      category: 'ai-tell' as const,
      severity: 'critical' as const,
      position: 0,
      matchedText: '테스트',
      inDialogue: false,
    };

    expect(getSuggestedReplacement(match)).toBe('[삭제]');
  });
});

// ============================================================================
// getBannedReason Tests
// ============================================================================

describe('getBannedReason', () => {
  it('should return reason from expression', () => {
    const content = '한편, 그녀는 기다렸다.';
    const matches = detectBannedExpressions(content, 'narration', 'critical');

    if (matches.length > 0) {
      const reason = getBannedReason(matches[0]);
      expect(reason).toBeTruthy();
      expect(typeof reason).toBe('string');
    }
  });

  it('should return default reason when none provided', () => {
    const match = {
      expression: {
        pattern: '테스트',
        replacements: ['대체'],
        context: 'narration' as const,
      },
      category: 'ai-tell' as const,
      severity: 'critical' as const,
      position: 0,
      matchedText: '테스트',
      inDialogue: false,
    };

    expect(getBannedReason(match)).toBe('AI 특유 표현');
  });
});

// ============================================================================
// Statistics Functions Tests
// ============================================================================

describe('countBySeverity', () => {
  it('should count matches by severity', () => {
    const content = '한편, 그녀는 에 있어서 , 그리고 기다렸다.';
    const matches = detectBannedExpressions(content, 'narration', 'low');
    const counts = countBySeverity(matches);

    expect(typeof counts.critical).toBe('number');
    expect(typeof counts.high).toBe('number');
    expect(typeof counts.medium).toBe('number');
    expect(typeof counts.low).toBe('number');

    // Total should match
    const total = counts.critical + counts.high + counts.medium + counts.low;
    expect(total).toBe(matches.length);
  });
});

describe('countByCategory', () => {
  it('should count matches by category', () => {
    const content = '한편, 그녀는 에 있어서 하였다. , 그리고 기다렸다.';
    const matches = detectBannedExpressions(content, 'narration', 'low');
    const counts = countByCategory(matches);

    expect(typeof counts['ai-tell']).toBe('number');
    expect(typeof counts['archaic-verb']).toBe('number');
    expect(typeof counts['translationese']).toBe('number');
    expect(typeof counts['punctuation']).toBe('number');
    expect(typeof counts['pronoun-overuse']).toBe('number');
  });
});

describe('getUniqueCategories', () => {
  it('should return unique categories present in matches', () => {
    const content = '한편, 그녀는 에 있어서 기다렸다.';
    const matches = detectBannedExpressions(content, 'narration', 'high');
    const categories = getUniqueCategories(matches);

    expect(Array.isArray(categories)).toBe(true);
    // Should have unique values only
    expect(categories.length).toBe(new Set(categories).size);
  });

  it('should return empty array for no matches', () => {
    const categories = getUniqueCategories([]);
    expect(categories).toEqual([]);
  });
});

// ============================================================================
// Integration with Quality Oracle Tests
// ============================================================================

describe('Integration with Quality Oracle', () => {
  it('should detect AI-tell in sample Korean text', () => {
    const sampleText = `
그는 천천히 문을 열었다. 한편, 그녀는 창가에 서 있었다.
그러나, 아무도 그 사실을 알지 못했다.
그것은 예상치 못한 결과였다.
    `.trim();

    const matches = detectBannedExpressions(sampleText, 'narration', 'critical');

    // Should detect at least 한편, and 그러나,
    expect(matches.length).toBeGreaterThanOrEqual(2);
  });

  it('should provide actionable replacement suggestions', () => {
    const content = '한편, 그녀는 말하였다.';
    const matches = detectBannedExpressions(content, 'narration', 'critical');

    for (const match of matches) {
      const replacement = getSuggestedReplacement(match);
      // Replacement should be actionable (not empty or just brackets)
      expect(replacement.length).toBeGreaterThan(0);
    }
  });
});
