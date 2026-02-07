import { describe, it, expect } from 'vitest';
import {
  TEXTURE_ENTRIES,
  suggestTexture,
  assessTexturePresence,
  getTexturesByCategory,
  getTexturesByContext,
  getTexturesBySubcategory,
  getTexturesByIntensity,
  type TextureContext,
} from '../../src/korean/texture-library.js';

// ============================================================================
// TEXTURE_ENTRIES Tests
// ============================================================================

describe('TEXTURE_ENTRIES', () => {
  it('loads entries from JSON', () => {
    expect(TEXTURE_ENTRIES.length).toBeGreaterThan(30);
  });

  it('has more than 40 entries (requirement)', () => {
    expect(TEXTURE_ENTRIES.length).toBeGreaterThanOrEqual(40);
  });

  it('includes all main categories', () => {
    const categories = new Set(TEXTURE_ENTRIES.map(e => e.category));
    expect(categories.has('emotion')).toBe(true);
    expect(categories.has('sound')).toBe(true);
    expect(categories.has('movement')).toBe(true);
    expect(categories.has('visual')).toBe(true);
    expect(categories.has('nature')).toBe(true);
  });

  it('includes verb forms where applicable', () => {
    const withVerbForms = TEXTURE_ENTRIES.filter(e => e.verbForm !== null);
    expect(withVerbForms.length).toBeGreaterThan(20);
    expect(withVerbForms.some(e => e.verbForm?.includes('거리다'))).toBe(true);
  });

  it('includes classic Korean onomatopoeia', () => {
    expect(TEXTURE_ENTRIES.some(e => e.korean === '두근두근')).toBe(true);
    expect(TEXTURE_ENTRIES.some(e => e.korean === '엉엉')).toBe(true);
    expect(TEXTURE_ENTRIES.some(e => e.korean === '살금살금')).toBe(true);
    expect(TEXTURE_ENTRIES.some(e => e.korean === '반짝반짝')).toBe(true);
    expect(TEXTURE_ENTRIES.some(e => e.korean === '주룩주룩')).toBe(true);
  });

  it('has subcategories for each category', () => {
    const subcategoriesByCategory = new Map<string, Set<string>>();
    for (const entry of TEXTURE_ENTRIES) {
      if (!subcategoriesByCategory.has(entry.category)) {
        subcategoriesByCategory.set(entry.category, new Set());
      }
      subcategoriesByCategory.get(entry.category)!.add(entry.subcategory);
    }

    // Each category should have multiple subcategories
    for (const [category, subcategories] of subcategoriesByCategory) {
      expect(subcategories.size).toBeGreaterThanOrEqual(2);
    }
  });

  it('all entries have required fields', () => {
    for (const entry of TEXTURE_ENTRIES) {
      expect(entry.korean).toBeDefined();
      expect(entry.korean.length).toBeGreaterThan(0);
      expect(entry.intensity).toMatch(/^(soft|medium|strong)$/);
      expect(entry.contexts).toBeInstanceOf(Array);
      expect(entry.contexts.length).toBeGreaterThan(0);
      expect(entry.category).toBeDefined();
      expect(entry.subcategory).toBeDefined();
    }
  });
});

// ============================================================================
// suggestTexture Tests
// ============================================================================

describe('suggestTexture', () => {
  it('suggests textures matching emotion context', () => {
    const context: TextureContext = {
      sceneEmotion: ['sadness', 'grief'],
      sceneAction: [],
    };
    const suggestions = suggestTexture(context);
    expect(suggestions.length).toBeGreaterThan(0);
    // Should include crying-related textures
    expect(suggestions.some(s =>
      s.texture.contexts.some(c => c.includes('grief') || c.includes('sadness'))
    )).toBe(true);
  });

  it('suggests textures matching action context', () => {
    const context: TextureContext = {
      sceneEmotion: [],
      sceneAction: ['walking', 'sneaking'],
    };
    const suggestions = suggestTexture(context);
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions.some(s => s.texture.subcategory === 'walking')).toBe(true);
  });

  it('respects intensity preference', () => {
    const softContext: TextureContext = {
      sceneEmotion: ['nervousness'],
      sceneAction: [],
      intensity: 'soft',
    };
    const suggestions = suggestTexture(softContext);
    // All suggestions should be soft intensity
    expect(suggestions.every(s => s.texture.intensity === 'soft')).toBe(true);
  });

  it('limits suggestions to maxSuggestions', () => {
    const context: TextureContext = {
      sceneEmotion: ['fear', 'anger', 'sadness'],
      sceneAction: ['running', 'crying'],
    };
    const suggestions = suggestTexture(context, 2);
    expect(suggestions.length).toBeLessThanOrEqual(2);
  });

  it('recommends verb forms for action contexts', () => {
    const context: TextureContext = {
      sceneEmotion: [],
      sceneAction: ['walking'],
    };
    const suggestions = suggestTexture(context);
    const withVerbForm = suggestions.filter(s => s.useVerbForm && s.texture.verbForm);
    expect(withVerbForm.length).toBeGreaterThan(0);
  });

  it('prioritizes emotion matches over action matches', () => {
    const context: TextureContext = {
      sceneEmotion: ['fear'],
      sceneAction: ['walking'],
    };
    const suggestions = suggestTexture(context, 5);
    // First suggestion should have priority 1 (emotion match)
    if (suggestions.length > 0) {
      expect(suggestions[0].priority).toBe(1);
    }
  });

  it('deduplicates suggestions', () => {
    const context: TextureContext = {
      sceneEmotion: ['fear', 'terror', 'shock'],
      sceneAction: ['trembling'],
    };
    const suggestions = suggestTexture(context);
    const koreanWords = suggestions.map(s => s.texture.korean);
    const uniqueWords = new Set(koreanWords);
    expect(koreanWords.length).toBe(uniqueWords.size);
  });

  it('returns empty array when no matches', () => {
    const context: TextureContext = {
      sceneEmotion: ['nonexistent-emotion'],
      sceneAction: ['nonexistent-action'],
    };
    const suggestions = suggestTexture(context);
    expect(suggestions.length).toBe(0);
  });

  it('includes reason for each suggestion', () => {
    const context: TextureContext = {
      sceneEmotion: ['fear'],
      sceneAction: [],
    };
    const suggestions = suggestTexture(context);
    for (const suggestion of suggestions) {
      expect(suggestion.reason).toBeDefined();
      expect(suggestion.reason.length).toBeGreaterThan(0);
    }
  });
});

// ============================================================================
// assessTexturePresence Tests
// ============================================================================

describe('assessTexturePresence', () => {
  it('detects texture words in content', () => {
    const content = '그녀의 심장이 두근두근 뛰었다. 빗방울이 주룩주룩 떨어졌다.';
    const assessment = assessTexturePresence(content);
    expect(assessment.textureCount).toBeGreaterThanOrEqual(2);
    expect(assessment.foundTextures).toContain('두근두근');
    expect(assessment.foundTextures).toContain('주룩주룩');
  });

  it('detects verb forms as texture (exact dictionary form)', () => {
    // Note: assessTexturePresence checks for exact string matches
    // Verb forms like "살금거리다" are stored in dictionary form
    const content = '그는 살금거리다 동작으로 방으로 들어갔다. 심장이 두근거리다.';
    const assessment = assessTexturePresence(content);
    expect(assessment.textureCount).toBeGreaterThanOrEqual(1);
    // Also detects base form
    const content2 = '살금살금 다가갔다.';
    const assessment2 = assessTexturePresence(content2);
    expect(assessment2.textureCount).toBeGreaterThanOrEqual(1);
  });

  it('identifies deficient segments', () => {
    const content = '그는 문을 열었다. 방 안은 어두웠다. 창문으로 달빛이 들어왔다. ' +
      '그녀가 의자에 앉아 있었다. 그는 천천히 다가갔다.';
    const assessment = assessTexturePresence(content);
    // Short content with no texture should have deficient segments
    expect(assessment.deficientSegments.length).toBeGreaterThan(0);
  });

  it('returns high score for texture-rich content', () => {
    const content = '심장이 두근두근 뛰었다. 발걸음이 살금살금. ' +
      '눈물이 훌쩍훌쩍. 바람이 살랑살랑 불었다.';
    const assessment = assessTexturePresence(content, 1);
    expect(assessment.score).toBeGreaterThanOrEqual(80);
  });

  it('returns low score for texture-lacking content', () => {
    const content = '그는 걸었다. 그녀는 말했다. 날씨가 좋았다. 시간이 흘렀다.'.repeat(5);
    const assessment = assessTexturePresence(content);
    expect(assessment.score).toBeLessThan(50);
  });

  it('deduplicates found textures', () => {
    const content = '두근두근 두근두근 두근두근 심장이 뛴다.';
    const assessment = assessTexturePresence(content);
    // Should only list 두근두근 once in foundTextures
    const dugunCount = assessment.foundTextures.filter(t => t === '두근두근').length;
    expect(dugunCount).toBe(1);
  });

  it('handles empty content', () => {
    const assessment = assessTexturePresence('');
    expect(assessment.score).toBe(0);
    expect(assessment.textureCount).toBe(0);
    expect(assessment.foundTextures).toHaveLength(0);
  });

  it('calculates correct segment boundaries', () => {
    // 1000 characters should have 2 segments
    const content = 'a'.repeat(1000);
    const assessment = assessTexturePresence(content);
    // Should have 2 deficient segments (0-500, 500-1000)
    expect(assessment.deficientSegments.length).toBe(2);
    expect(assessment.deficientSegments[0].start).toBe(0);
    expect(assessment.deficientSegments[0].end).toBe(500);
    expect(assessment.deficientSegments[1].start).toBe(500);
    expect(assessment.deficientSegments[1].end).toBe(1000);
  });
});

// ============================================================================
// Filter Functions Tests
// ============================================================================

describe('getTexturesByCategory', () => {
  it('filters by category', () => {
    const emotions = getTexturesByCategory('emotion');
    expect(emotions.length).toBeGreaterThan(0);
    expect(emotions.every(e => e.category === 'emotion')).toBe(true);
  });

  it('returns empty array for unknown category', () => {
    const result = getTexturesByCategory('nonexistent');
    expect(result).toHaveLength(0);
  });

  it('returns different results for different categories', () => {
    const emotions = getTexturesByCategory('emotion');
    const sounds = getTexturesByCategory('sound');
    expect(emotions).not.toEqual(sounds);
  });
});

describe('getTexturesByContext', () => {
  it('finds textures by context keyword', () => {
    const fearTextures = getTexturesByContext('fear');
    expect(fearTextures.length).toBeGreaterThan(0);
    expect(fearTextures.every(t =>
      t.contexts.some(c => c.toLowerCase().includes('fear'))
    )).toBe(true);
  });

  it('is case insensitive', () => {
    const lower = getTexturesByContext('fear');
    const upper = getTexturesByContext('Fear');
    expect(lower.length).toBe(upper.length);
  });

  it('returns empty array for unknown context', () => {
    const result = getTexturesByContext('nonexistent-context');
    expect(result).toHaveLength(0);
  });
});

describe('getTexturesBySubcategory', () => {
  it('finds textures by subcategory', () => {
    const walkingTextures = getTexturesBySubcategory('walking');
    expect(walkingTextures.length).toBeGreaterThan(0);
    expect(walkingTextures.every(t =>
      t.subcategory.toLowerCase().includes('walking')
    )).toBe(true);
  });

  it('is case insensitive', () => {
    const lower = getTexturesBySubcategory('crying');
    const upper = getTexturesBySubcategory('Crying');
    expect(lower.length).toBe(upper.length);
  });
});

describe('getTexturesByIntensity', () => {
  it('filters by soft intensity', () => {
    const softTextures = getTexturesByIntensity('soft');
    expect(softTextures.length).toBeGreaterThan(0);
    expect(softTextures.every(t => t.intensity === 'soft')).toBe(true);
  });

  it('filters by medium intensity', () => {
    const mediumTextures = getTexturesByIntensity('medium');
    expect(mediumTextures.length).toBeGreaterThan(0);
    expect(mediumTextures.every(t => t.intensity === 'medium')).toBe(true);
  });

  it('filters by strong intensity', () => {
    const strongTextures = getTexturesByIntensity('strong');
    expect(strongTextures.length).toBeGreaterThan(0);
    expect(strongTextures.every(t => t.intensity === 'strong')).toBe(true);
  });

  it('returns different results for different intensities', () => {
    const soft = getTexturesByIntensity('soft');
    const strong = getTexturesByIntensity('strong');
    // Should have no overlap
    const softKorean = new Set(soft.map(t => t.korean));
    const strongOverlap = strong.filter(t => softKorean.has(t.korean));
    expect(strongOverlap).toHaveLength(0);
  });
});

// ============================================================================
// Integration Tests
// ============================================================================

describe('Integration: suggestTexture + assessTexturePresence', () => {
  it('suggestions match deficient segments', () => {
    // Content lacking texture
    const content = '그는 방으로 들어갔다. 그녀가 거기 있었다. 둘은 서로 바라보았다.';
    const assessment = assessTexturePresence(content);

    expect(assessment.deficientSegments.length).toBeGreaterThan(0);

    // Get suggestions for a fear/nervousness scene
    const context: TextureContext = {
      sceneEmotion: ['nervousness', 'anticipation'],
      sceneAction: [],
    };
    const suggestions = suggestTexture(context);

    // Suggestions should provide textures that could enrich the content
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions.some(s => s.texture.category === 'emotion')).toBe(true);
  });

  it('texture-rich content needs fewer suggestions', () => {
    const richContent = '심장이 두근두근 뛰고, 손이 덜덜 떨렸다. 바람이 살랑살랑 불었다.';
    const assessment = assessTexturePresence(richContent);

    // Content is short but has textures
    expect(assessment.textureCount).toBeGreaterThan(0);
    expect(assessment.score).toBeGreaterThan(50);
  });
});
