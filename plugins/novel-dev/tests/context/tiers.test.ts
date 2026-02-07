import { describe, it, expect } from 'vitest';
import {
  assignTier,
  assembleTieredContext,
  formatPromptOrder,
  getTierStats,
} from '../../src/context/tiers.js';
import type { ContextItem, ItemMetadata } from '../../src/context/types.js';

// ============================================================================
// Test Fixtures
// ============================================================================

/**
 * Creates a mock ContextItem for testing
 */
function createMockItem(
  overrides: Partial<ContextItem> & { id: string; type: ContextItem['type'] }
): ContextItem {
  return {
    path: `/mock/${overrides.id}.json`,
    content: 'mock content',
    estimatedTokens: 1000,
    priority: 5,
    required: false,
    ...overrides,
  };
}

/**
 * Default metadata for testing
 */
const defaultMetadata: ItemMetadata = {
  currentChapter: 10,
};

// ============================================================================
// assignTier Tests
// ============================================================================

describe('assignTier', () => {
  describe('hot tier assignments', () => {
    it('should assign exemplar to hot tier', () => {
      expect(assignTier('exemplar', defaultMetadata)).toBe('hot');
    });

    it('should assign scene_plan to hot tier', () => {
      expect(assignTier('scene_plan', defaultMetadata)).toBe('hot');
    });

    it('should assign emotional_directive to hot tier', () => {
      expect(assignTier('emotional_directive', defaultMetadata)).toBe('hot');
    });

    it('should assign character with appearsInCurrentScene: true to hot tier', () => {
      expect(assignTier('character', { ...defaultMetadata, appearsInCurrentScene: true })).toBe('hot');
    });

    it('should assign character with appearsInCurrentScene: false to cold tier', () => {
      expect(assignTier('character', { ...defaultMetadata, appearsInCurrentScene: false })).toBe('cold');
    });
  });

  describe('warm tier assignments', () => {
    it('should assign summary within 5-chapter window to warm tier', () => {
      // Chapter 9 is 1 chapter away from 10
      expect(assignTier('summary', { currentChapter: 10, summaryChapter: 9 })).toBe('warm');
      // Chapter 6 is 4 chapters away from 10
      expect(assignTier('summary', { currentChapter: 10, summaryChapter: 6 })).toBe('warm');
      // Chapter 5 is 5 chapters away from 10
      expect(assignTier('summary', { currentChapter: 10, summaryChapter: 5 })).toBe('warm');
    });

    it('should assign summary outside 5-chapter window to cold tier', () => {
      // Chapter 4 is 6 chapters away from 10
      expect(assignTier('summary', { currentChapter: 10, summaryChapter: 4 })).toBe('cold');
      // Chapter 1 is 9 chapters away from 10
      expect(assignTier('summary', { currentChapter: 10, summaryChapter: 1 })).toBe('cold');
    });

    it('should assign relationship_state to warm tier', () => {
      expect(assignTier('relationship_state', defaultMetadata)).toBe('warm');
    });

    it('should assign foreshadowing with isActive: true to warm tier', () => {
      expect(assignTier('foreshadowing', { ...defaultMetadata, isActive: true })).toBe('warm');
    });

    it('should assign foreshadowing with isActive: false to cold tier', () => {
      expect(assignTier('foreshadowing', { ...defaultMetadata, isActive: false })).toBe('cold');
    });

    it('should assign style to warm tier', () => {
      expect(assignTier('style', defaultMetadata)).toBe('warm');
    });

    it('should assign plot to warm tier', () => {
      expect(assignTier('plot', defaultMetadata)).toBe('warm');
    });
  });

  describe('cold tier assignments', () => {
    it('should assign world to cold tier', () => {
      expect(assignTier('world', defaultMetadata)).toBe('cold');
    });

    it('should assign act_summary to cold tier', () => {
      expect(assignTier('act_summary', defaultMetadata)).toBe('cold');
    });
  });
});

// ============================================================================
// assembleTieredContext Tests
// ============================================================================

describe('assembleTieredContext', () => {
  describe('basic assembly', () => {
    it('should produce correct tier assignment with token breakdown', () => {
      const items: ContextItem[] = [
        createMockItem({ id: 'exemplar_1', type: 'exemplar', estimatedTokens: 1500 }),
        createMockItem({ id: 'scene_plan_1', type: 'scene_plan', estimatedTokens: 800 }),
        createMockItem({ id: 'summary_1', type: 'summary', estimatedTokens: 1000 }),
        createMockItem({ id: 'world_1', type: 'world', estimatedTokens: 2000 }),
      ];

      const metadata: ItemMetadata = {
        currentChapter: 10,
        summaryChapter: 9, // Within 5-chapter window
      };

      const bundle = assembleTieredContext(items, metadata);

      expect(bundle.hot.length).toBeGreaterThan(0);
      expect(bundle.warm.length).toBeGreaterThan(0);
      expect(bundle.cold.length).toBeGreaterThan(0);
      expect(bundle.totalTokens).toBe(1500 + 800 + 1000 + 2000);
      expect(bundle.tierBreakdown.hot).toBe(1500 + 800); // exemplar + scene_plan
      expect(bundle.tierBreakdown.warm).toBe(1000); // summary
      expect(bundle.tierBreakdown.cold).toBe(2000); // world
    });
  });

  describe('budget enforcement - character protection', () => {
    it('should drop emotional_directives before characters when hot tier exceeds budget', () => {
      const items: ContextItem[] = [
        createMockItem({ id: 'scene_plan_1', type: 'scene_plan', estimatedTokens: 1000 }),
        createMockItem({ id: 'exemplar_1', type: 'exemplar', estimatedTokens: 1500 }),
        createMockItem({
          id: 'char_1',
          type: 'character',
          estimatedTokens: 2000,
          appearsInCurrentScene: true,
        } as ContextItem & { appearsInCurrentScene: boolean }),
        createMockItem({
          id: 'char_2',
          type: 'character',
          estimatedTokens: 2000,
          appearsInCurrentScene: true,
        } as ContextItem & { appearsInCurrentScene: boolean }),
        createMockItem({ id: 'emotional_1', type: 'emotional_directive', estimatedTokens: 500 }),
        createMockItem({ id: 'emotional_2', type: 'emotional_directive', estimatedTokens: 500 }),
      ];

      const metadata: ItemMetadata = {
        currentChapter: 10,
        appearsInCurrentScene: true,
      };

      // Budget of 6000 tokens - less than total hot items
      // scene_plan (1000) + exemplar (1500) + char_1 (2000) + char_2 (2000) = 6500 base
      // emotional_1 + emotional_2 = 1000 more = 7500 total
      const bundle = assembleTieredContext(items, metadata, { hot: 6000 });

      // All characters should be kept
      const characterItems = bundle.hot.filter((i) => i.type === 'character');
      expect(characterItems.length).toBe(2);

      // Emotional directives should be dropped
      const emotionalItems = bundle.hot.filter((i) => i.type === 'emotional_directive');
      expect(emotionalItems.length).toBeLessThan(2);

      // Exemplars and scene_plan should be kept
      expect(bundle.hot.find((i) => i.type === 'exemplar')).toBeDefined();
      expect(bundle.hot.find((i) => i.type === 'scene_plan')).toBeDefined();
    });

    it('should keep POV and non-POV characters both uncompressed', () => {
      const items: ContextItem[] = [
        createMockItem({ id: 'scene_plan_1', type: 'scene_plan', estimatedTokens: 800 }),
        createMockItem({ id: 'exemplar_1', type: 'exemplar', estimatedTokens: 1500 }),
        createMockItem({
          id: 'pov_char',
          type: 'character',
          estimatedTokens: 2000,
          appearsInCurrentScene: true,
          isPovCharacter: true,
        } as ContextItem & { appearsInCurrentScene: boolean; isPovCharacter: boolean }),
        createMockItem({
          id: 'non_pov_char',
          type: 'character',
          estimatedTokens: 2000,
          appearsInCurrentScene: true,
          isPovCharacter: false,
        } as ContextItem & { appearsInCurrentScene: boolean; isPovCharacter: boolean }),
      ];

      const metadata: ItemMetadata = {
        currentChapter: 10,
        appearsInCurrentScene: true,
      };

      const bundle = assembleTieredContext(items, metadata);

      // Both characters should be at full 2000 tokens
      const povChar = bundle.hot.find((i) => i.id === 'pov_char');
      const nonPovChar = bundle.hot.find((i) => i.id === 'non_pov_char');

      expect(povChar).toBeDefined();
      expect(nonPovChar).toBeDefined();
      expect(povChar!.estimatedTokens).toBe(2000);
      expect(nonPovChar!.estimatedTokens).toBe(2000);
    });

    it('should never compress characters even with 6+ scene characters exceeding budget', () => {
      // Create 6 scene characters (~12K tokens) + exemplars + scene_plan
      const items: ContextItem[] = [
        createMockItem({ id: 'scene_plan_1', type: 'scene_plan', estimatedTokens: 800 }),
        createMockItem({ id: 'exemplar_1', type: 'exemplar', estimatedTokens: 1500 }),
        createMockItem({ id: 'exemplar_2', type: 'exemplar', estimatedTokens: 1500 }),
        // 6 characters at ~2000 tokens each = ~12000 tokens
        ...Array.from({ length: 6 }, (_, i) =>
          createMockItem({
            id: `char_${i + 1}`,
            type: 'character',
            estimatedTokens: 2000,
            appearsInCurrentScene: true,
          } as ContextItem & { appearsInCurrentScene: boolean })
        ),
        // Add some emotional_directives that should be dropped
        createMockItem({ id: 'emotional_1', type: 'emotional_directive', estimatedTokens: 300 }),
        createMockItem({ id: 'emotional_2', type: 'emotional_directive', estimatedTokens: 300 }),
        createMockItem({ id: 'relationship_1', type: 'relationship_state', estimatedTokens: 500 }),
      ];

      const metadata: ItemMetadata = {
        currentChapter: 10,
        appearsInCurrentScene: true,
      };

      // Total hot items: 800 + 1500 + 1500 + 12000 + 600 + 500 = 16900 tokens
      // Budget: 15000 tokens
      const bundle = assembleTieredContext(items, metadata, { hot: 15000 });

      // All 6 characters should remain at full 2000 tokens each
      const characters = bundle.hot.filter((i) => i.type === 'character');
      expect(characters.length).toBe(6);

      for (const char of characters) {
        expect(char.estimatedTokens).toBe(2000);
      }

      // Emotional directives and relationship_states should be dropped first
      const emotionalItems = bundle.hot.filter((i) => i.type === 'emotional_directive');
      expect(emotionalItems.length).toBe(0);

      // Allow slight budget overshoot - characters + exemplars + scene_plan should remain
      // 800 + 1500 + 1500 + 12000 = 15800 tokens (over budget but allowed)
      expect(bundle.tierBreakdown.hot).toBeGreaterThanOrEqual(15000);
    });
  });

  describe('sandwich split', () => {
    it('should place scene_plan and first exemplar in hotPrefix', () => {
      const items: ContextItem[] = [
        createMockItem({ id: 'scene_plan_1', type: 'scene_plan', estimatedTokens: 800 }),
        createMockItem({ id: 'exemplar_1', type: 'exemplar', estimatedTokens: 1500 }),
        createMockItem({ id: 'exemplar_2', type: 'exemplar', estimatedTokens: 1500 }),
        createMockItem({
          id: 'char_1',
          type: 'character',
          estimatedTokens: 2000,
          appearsInCurrentScene: true,
        } as ContextItem & { appearsInCurrentScene: boolean }),
      ];

      const metadata: ItemMetadata = {
        currentChapter: 10,
        appearsInCurrentScene: true,
      };

      const bundle = assembleTieredContext(items, metadata);

      // hotPrefix should have scene_plan + first exemplar
      expect(bundle.sandwichSplit.hotPrefix.find((i) => i.type === 'scene_plan')).toBeDefined();
      expect(bundle.sandwichSplit.hotPrefix.filter((i) => i.type === 'exemplar').length).toBe(1);

      // hotSuffix should have remaining exemplars + characters
      expect(bundle.sandwichSplit.hotSuffix.filter((i) => i.type === 'exemplar').length).toBe(1);
      expect(bundle.sandwichSplit.hotSuffix.find((i) => i.type === 'character')).toBeDefined();
    });

    it('should place remaining exemplars and character profiles in hotSuffix', () => {
      const items: ContextItem[] = [
        createMockItem({ id: 'scene_plan_1', type: 'scene_plan', estimatedTokens: 800 }),
        createMockItem({ id: 'exemplar_1', type: 'exemplar', estimatedTokens: 1500 }),
        createMockItem({ id: 'exemplar_2', type: 'exemplar', estimatedTokens: 1500 }),
        createMockItem({ id: 'exemplar_3', type: 'exemplar', estimatedTokens: 1500 }),
        createMockItem({
          id: 'char_1',
          type: 'character',
          estimatedTokens: 2000,
          appearsInCurrentScene: true,
        } as ContextItem & { appearsInCurrentScene: boolean }),
        createMockItem({ id: 'emotional_1', type: 'emotional_directive', estimatedTokens: 300 }),
      ];

      const metadata: ItemMetadata = {
        currentChapter: 10,
        appearsInCurrentScene: true,
      };

      const bundle = assembleTieredContext(items, metadata);

      // hotSuffix should have exemplar_2, exemplar_3, character, emotional_directive
      expect(bundle.sandwichSplit.hotSuffix.filter((i) => i.type === 'exemplar').length).toBe(2);
      expect(bundle.sandwichSplit.hotSuffix.find((i) => i.type === 'character')).toBeDefined();
      expect(bundle.sandwichSplit.hotSuffix.find((i) => i.type === 'emotional_directive')).toBeDefined();
    });
  });

  describe('warm window enforcement', () => {
    it('should only include summaries within 5 chapters in warm tier', () => {
      const items: ContextItem[] = [
        // Within window (chapters 5-9 when current is 10)
        createMockItem({ id: 'summary_9', type: 'summary', estimatedTokens: 1000, summaryChapter: 9 } as ContextItem & { summaryChapter: number }),
        createMockItem({ id: 'summary_7', type: 'summary', estimatedTokens: 1000, summaryChapter: 7 } as ContextItem & { summaryChapter: number }),
        createMockItem({ id: 'summary_5', type: 'summary', estimatedTokens: 1000, summaryChapter: 5 } as ContextItem & { summaryChapter: number }),
        // Outside window
        createMockItem({ id: 'summary_3', type: 'summary', estimatedTokens: 1000, summaryChapter: 3 } as ContextItem & { summaryChapter: number }),
        createMockItem({ id: 'summary_1', type: 'summary', estimatedTokens: 1000, summaryChapter: 1 } as ContextItem & { summaryChapter: number }),
      ];

      const metadata: ItemMetadata = {
        currentChapter: 10,
      };

      const bundle = assembleTieredContext(items, metadata);

      // Warm tier should have summaries 5, 7, 9
      const warmSummaries = bundle.warm.filter((i) => i.type === 'summary');
      expect(warmSummaries.length).toBe(3);

      // Cold tier should have summaries 1, 3
      const coldSummaries = bundle.cold.filter((i) => i.type === 'summary');
      expect(coldSummaries.length).toBe(2);
    });
  });

  describe('cold tier overflow', () => {
    it('should drop lowest priority items when cold tier exceeds budget', () => {
      const items: ContextItem[] = [
        createMockItem({ id: 'world_1', type: 'world', estimatedTokens: 20000, priority: 6 }),
        createMockItem({ id: 'world_2', type: 'world', estimatedTokens: 20000, priority: 5 }),
        createMockItem({ id: 'act_summary_1', type: 'act_summary', estimatedTokens: 10000, priority: 4 }),
      ];

      const metadata: ItemMetadata = {
        currentChapter: 10,
      };

      // Cold budget of 30000 - can only fit 2 items
      const bundle = assembleTieredContext(items, metadata, { cold: 30000 });

      // Should have dropped the lowest priority item (act_summary)
      expect(bundle.cold.length).toBeLessThan(3);
      expect(bundle.tierBreakdown.cold).toBeLessThanOrEqual(30000);
    });
  });
});

// ============================================================================
// formatPromptOrder Tests
// ============================================================================

describe('formatPromptOrder', () => {
  it('should return items in correct prompt assembly order', () => {
    const items: ContextItem[] = [
      createMockItem({ id: 'scene_plan_1', type: 'scene_plan', estimatedTokens: 800 }),
      createMockItem({ id: 'exemplar_1', type: 'exemplar', estimatedTokens: 1500 }),
      createMockItem({ id: 'exemplar_2', type: 'exemplar', estimatedTokens: 1500 }),
      createMockItem({
        id: 'char_1',
        type: 'character',
        estimatedTokens: 2000,
        appearsInCurrentScene: true,
      } as ContextItem & { appearsInCurrentScene: boolean }),
      createMockItem({ id: 'summary_1', type: 'summary', estimatedTokens: 1000, summaryChapter: 9 } as ContextItem & { summaryChapter: number }),
      createMockItem({ id: 'world_1', type: 'world', estimatedTokens: 2000 }),
    ];

    const metadata: ItemMetadata = {
      currentChapter: 10,
      appearsInCurrentScene: true,
    };

    const bundle = assembleTieredContext(items, metadata);
    const ordered = formatPromptOrder(bundle);

    // First items should be from hotPrefix (scene_plan + first exemplar)
    expect(ordered[0].type).toBe('scene_plan');
    expect(ordered[1].type).toBe('exemplar');

    // Last items should be from hotSuffix (remaining exemplar + character)
    const lastItems = ordered.slice(-2);
    expect(lastItems.some((i) => i.type === 'exemplar')).toBe(true);
    expect(lastItems.some((i) => i.type === 'character')).toBe(true);
  });

  it('should have at least one exemplar in prefix AND at least one in suffix', () => {
    const items: ContextItem[] = [
      createMockItem({ id: 'scene_plan_1', type: 'scene_plan', estimatedTokens: 800 }),
      createMockItem({ id: 'exemplar_1', type: 'exemplar', estimatedTokens: 1500 }),
      createMockItem({ id: 'exemplar_2', type: 'exemplar', estimatedTokens: 1500 }),
      createMockItem({ id: 'exemplar_3', type: 'exemplar', estimatedTokens: 1500 }),
    ];

    const metadata: ItemMetadata = {
      currentChapter: 10,
    };

    const bundle = assembleTieredContext(items, metadata);

    // hotPrefix should have at least 1 exemplar
    const prefixExemplars = bundle.sandwichSplit.hotPrefix.filter((i) => i.type === 'exemplar');
    expect(prefixExemplars.length).toBeGreaterThanOrEqual(1);

    // hotSuffix should have at least 1 exemplar (if more than 1 total)
    const suffixExemplars = bundle.sandwichSplit.hotSuffix.filter((i) => i.type === 'exemplar');
    expect(suffixExemplars.length).toBeGreaterThanOrEqual(1);
  });
});

// ============================================================================
// getTierStats Tests
// ============================================================================

describe('getTierStats', () => {
  it('should return human-readable stats string', () => {
    const items: ContextItem[] = [
      createMockItem({ id: 'exemplar_1', type: 'exemplar', estimatedTokens: 1500 }),
      createMockItem({ id: 'summary_1', type: 'summary', estimatedTokens: 1000, summaryChapter: 9 } as ContextItem & { summaryChapter: number }),
      createMockItem({ id: 'world_1', type: 'world', estimatedTokens: 2000 }),
    ];

    const metadata: ItemMetadata = {
      currentChapter: 10,
    };

    const bundle = assembleTieredContext(items, metadata);
    const stats = getTierStats(bundle);

    expect(stats).toContain('Hot:');
    expect(stats).toContain('Warm:');
    expect(stats).toContain('Cold:');
    expect(stats).toContain('Total:');
    expect(stats).toContain('tokens');
    expect(stats).toContain('items');
  });
});
