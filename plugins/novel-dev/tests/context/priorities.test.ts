import { describe, it, expect } from 'vitest';
import {
  basePriority,
  requiredByType,
  getPriority,
  isRequired,
  comparePriority,
  sortByPriority,
  getDroppableItems,
  calculateTotalPriority,
  PRIORITY_THRESHOLDS,
} from '../../src/context/priorities.js';

describe('basePriority', () => {
  it('should have style as highest priority', () => {
    expect(basePriority.style).toBe(10);
  });

  it('should have plot as second highest', () => {
    expect(basePriority.plot).toBe(9);
  });

  it('should have act_summary as lowest', () => {
    expect(basePriority.act_summary).toBe(4);
  });
});

describe('requiredByType', () => {
  it('should require style', () => {
    expect(requiredByType.style).toBe(true);
  });

  it('should require plot', () => {
    expect(requiredByType.plot).toBe(true);
  });

  it('should not require character by default', () => {
    expect(requiredByType.character).toBe(false);
  });

  it('should not require foreshadowing by default', () => {
    expect(requiredByType.foreshadowing).toBe(false);
  });
});

describe('getPriority', () => {
  it('should return base priority for style', () => {
    expect(getPriority('style', { currentChapter: 5 })).toBe(10);
  });

  it('should return base priority for plot', () => {
    expect(getPriority('plot', { currentChapter: 5 })).toBe(9);
  });

  // Summary priority by distance
  it('should give highest priority to previous chapter summary', () => {
    expect(getPriority('summary', { currentChapter: 10, summaryChapter: 9 })).toBe(9);
  });

  it('should give lower priority to 2-chapters-ago summary', () => {
    expect(getPriority('summary', { currentChapter: 10, summaryChapter: 8 })).toBe(7);
  });

  it('should give lower priority to 3-chapters-ago summary', () => {
    expect(getPriority('summary', { currentChapter: 10, summaryChapter: 7 })).toBe(5);
  });

  it('should give low priority to 4-5 chapters ago summary', () => {
    const p4 = getPriority('summary', { currentChapter: 10, summaryChapter: 6 });
    const p5 = getPriority('summary', { currentChapter: 10, summaryChapter: 5 });
    expect(p4).toBe(3);
    expect(p5).toBe(3);
  });

  it('should give lowest priority to distant summaries', () => {
    expect(getPriority('summary', { currentChapter: 10, summaryChapter: 1 })).toBe(2);
  });

  // Character priority
  it('should give high priority to appearing characters', () => {
    expect(getPriority('character', { currentChapter: 5, appearsInCurrentChapter: true })).toBe(8);
  });

  it('should give low priority to non-appearing characters', () => {
    expect(getPriority('character', { currentChapter: 5, appearsInCurrentChapter: false })).toBe(2);
  });

  // Foreshadowing priority
  it('should give highest priority when payoff is current chapter', () => {
    expect(getPriority('foreshadowing', { currentChapter: 5, payoffChapter: 5 })).toBe(9);
  });

  it('should give high priority when payoff is within 3 chapters', () => {
    expect(getPriority('foreshadowing', { currentChapter: 5, payoffChapter: 7 })).toBe(7);
  });

  it('should give lower priority for distant payoff', () => {
    expect(getPriority('foreshadowing', { currentChapter: 5, payoffChapter: 20 })).toBe(4);
  });

  // World priority
  it('should give higher priority to locations in current chapter', () => {
    expect(getPriority('world', { currentChapter: 5, appearsInCurrentChapter: true })).toBe(7);
  });

  it('should give lower priority to unused locations', () => {
    expect(getPriority('world', { currentChapter: 5, appearsInCurrentChapter: false })).toBe(3);
  });

  // Act summary at boundaries
  it('should give higher priority at act boundaries', () => {
    // chapter 10 and 11 are act boundaries (mod 10 === 0 or 1)
    expect(getPriority('act_summary', { currentChapter: 10 })).toBe(6);
    expect(getPriority('act_summary', { currentChapter: 11 })).toBe(6);
  });

  it('should give base priority for non-boundary chapters', () => {
    expect(getPriority('act_summary', { currentChapter: 5 })).toBe(4);
  });
});

describe('isRequired', () => {
  it('should require style always', () => {
    expect(isRequired('style', { currentChapter: 1 })).toBe(true);
  });

  it('should require plot always', () => {
    expect(isRequired('plot', { currentChapter: 1 })).toBe(true);
  });

  it('should require characters appearing in current chapter', () => {
    expect(isRequired('character', { currentChapter: 1, appearsInCurrentChapter: true })).toBe(true);
  });

  it('should not require non-appearing characters', () => {
    expect(isRequired('character', { currentChapter: 1, appearsInCurrentChapter: false })).toBe(false);
  });

  it('should require foreshadowing with current chapter payoff', () => {
    expect(isRequired('foreshadowing', { currentChapter: 5, payoffChapter: 5 })).toBe(true);
  });

  it('should not require foreshadowing with distant payoff', () => {
    expect(isRequired('foreshadowing', { currentChapter: 5, payoffChapter: 20 })).toBe(false);
  });
});

describe('comparePriority', () => {
  it('should sort required items first', () => {
    const a = { priority: 3, required: true };
    const b = { priority: 9, required: false };
    expect(comparePriority(a, b)).toBeLessThan(0); // a before b
  });

  it('should sort by priority when both required', () => {
    const a = { priority: 8, required: true };
    const b = { priority: 10, required: true };
    expect(comparePriority(a, b)).toBeGreaterThan(0); // b before a
  });

  it('should sort by priority when both optional', () => {
    const a = { priority: 5, required: false };
    const b = { priority: 3, required: false };
    expect(comparePriority(a, b)).toBeLessThan(0); // a before b
  });
});

describe('sortByPriority', () => {
  it('should sort items correctly', () => {
    const items = [
      { priority: 3, required: false },
      { priority: 10, required: true },
      { priority: 7, required: false },
      { priority: 9, required: true },
    ];
    const sorted = sortByPriority(items);
    // Required first (10, 9), then optional by priority (7, 3)
    expect(sorted[0].priority).toBe(10);
    expect(sorted[1].priority).toBe(9);
    expect(sorted[2].priority).toBe(7);
    expect(sorted[3].priority).toBe(3);
  });

  it('should not modify original array', () => {
    const items = [
      { priority: 1, required: false },
      { priority: 5, required: true },
    ];
    const sorted = sortByPriority(items);
    expect(items[0].priority).toBe(1); // Original unchanged
    expect(sorted[0].priority).toBe(5); // Sorted copy
  });
});

describe('getDroppableItems', () => {
  it('should return low-priority non-required items', () => {
    const items = [
      { priority: 10, required: true },
      { priority: 2, required: false },
      { priority: 1, required: false },
      { priority: 5, required: false },
    ];
    const droppable = getDroppableItems(items);
    expect(droppable).toHaveLength(2);
    expect(droppable[0].priority).toBe(1); // Sorted ascending
    expect(droppable[1].priority).toBe(2);
  });

  it('should never include required items', () => {
    const items = [
      { priority: 1, required: true },
    ];
    const droppable = getDroppableItems(items);
    expect(droppable).toHaveLength(0);
  });

  it('should respect custom threshold', () => {
    const items = [
      { priority: 4, required: false },
      { priority: 6, required: false },
    ];
    const droppable = getDroppableItems(items, 5);
    expect(droppable).toHaveLength(1);
    expect(droppable[0].priority).toBe(4);
  });
});

describe('calculateTotalPriority', () => {
  it('should sum all priorities', () => {
    const items = [
      { priority: 5 },
      { priority: 3 },
      { priority: 7 },
    ];
    expect(calculateTotalPriority(items)).toBe(15);
  });

  it('should return 0 for empty array', () => {
    expect(calculateTotalPriority([])).toBe(0);
  });
});
