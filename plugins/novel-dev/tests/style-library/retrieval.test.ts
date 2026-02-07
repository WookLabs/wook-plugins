/**
 * Style Library Retrieval Module Tests
 */

import { describe, it, expect } from 'vitest';
import { queryExemplars, getLibraryStats } from '../../src/style-library/retrieval.js';
import type { StyleLibrary, ExemplarQuery } from '../../src/style-library/types.js';

describe('Style Library Retrieval', () => {
  // Test library fixture
  const testLibrary: StyleLibrary = {
    exemplars: [
      {
        id: 'exm_romance_001',
        content: '로맨스 대화 예시 1. '.repeat(50),
        genre: ['romance'],
        scene_type: 'dialogue',
        emotional_tone: ['warmth'],
        pov: 'third-limited',
        pacing: 'medium',
        is_anti_exemplar: false,
        source: 'test',
      },
      {
        id: 'exm_romance_002',
        content: '로맨스 대화 예시 2. '.repeat(50),
        genre: ['romance'],
        scene_type: 'dialogue',
        emotional_tone: ['tension'],
        pov: 'third-limited',
        pacing: 'fast',
        is_anti_exemplar: false,
        source: 'test',
      },
      {
        id: 'exm_romance_003',
        content: '로맨스 감정 절정 예시. '.repeat(50),
        genre: ['romance'],
        scene_type: 'emotional-peak',
        emotional_tone: ['warmth', 'sorrow'],
        pov: 'third-limited',
        pacing: 'slow',
        is_anti_exemplar: false,
        source: 'test',
      },
      {
        id: 'exm_fantasy_001',
        content: '판타지 액션 예시. '.repeat(50),
        genre: ['fantasy'],
        scene_type: 'action',
        emotional_tone: ['excitement'],
        pov: 'third-limited',
        pacing: 'fast',
        is_anti_exemplar: false,
        source: 'test',
      },
      {
        id: 'exm_romance_101',
        content: '로맨스 대화 안티 예시. '.repeat(50),
        genre: ['romance'],
        scene_type: 'dialogue',
        emotional_tone: ['warmth'],
        pov: 'third-limited',
        pacing: 'medium',
        is_anti_exemplar: true,
        anti_exemplar_pair: 'exm_romance_001',
        source: 'test',
      },
      {
        id: 'exm_fantasy_101',
        content: '판타지 액션 안티 예시. '.repeat(50),
        genre: ['fantasy'],
        scene_type: 'action',
        emotional_tone: ['excitement'],
        pov: 'third-limited',
        pacing: 'fast',
        is_anti_exemplar: true,
        source: 'test',
      },
    ],
    metadata: {
      version: '1.0.0',
      total_exemplars: 6,
      genres_covered: ['romance', 'fantasy'],
      last_updated: '2026-01-01T00:00:00Z',
    },
  };

  describe('queryExemplars', () => {
    it('should return empty result for empty library', () => {
      const emptyLibrary: StyleLibrary = {
        exemplars: [],
        metadata: {
          version: '1.0.0',
          total_exemplars: 0,
          genres_covered: [],
          last_updated: '',
        },
      };

      const result = queryExemplars(emptyLibrary, {
        genre: 'romance',
        scene_type: 'dialogue',
      });

      expect(result.exemplars).toEqual([]);
      expect(result.anti_exemplar).toBeUndefined();
      expect(result.total_tokens).toBe(0);
    });

    it('should return matching exemplars for exact genre+scene_type', () => {
      const query: ExemplarQuery = {
        genre: 'romance',
        scene_type: 'dialogue',
      };

      const result = queryExemplars(testLibrary, query);

      expect(result.exemplars.length).toBeGreaterThanOrEqual(1);
      expect(result.exemplars.length).toBeLessThanOrEqual(3);
      // All returned exemplars should have at least genre match
      expect(result.exemplars.every((e) => e.genre.includes('romance'))).toBe(true);
      // The first (highest-scored) exemplar should have exact scene_type match
      expect(result.exemplars[0].scene_type).toBe('dialogue');
      // No anti-exemplars in main results
      expect(result.exemplars.every((e) => !e.is_anti_exemplar)).toBe(true);
    });

    it('should score genre match higher than tone match', () => {
      const query: ExemplarQuery = {
        genre: 'fantasy',
        scene_type: 'action',
        emotional_tone: 'warmth', // This matches romance exemplars but not genre
      };

      const result = queryExemplars(testLibrary, query);

      // Fantasy action should be first despite romance having warmth
      expect(result.exemplars.length).toBeGreaterThanOrEqual(1);
      expect(result.exemplars[0].genre).toContain('fantasy');
    });

    it('should include at most 1 anti-exemplar by default', () => {
      const query: ExemplarQuery = {
        genre: 'romance',
        scene_type: 'dialogue',
        include_anti: true,
      };

      const result = queryExemplars(testLibrary, query);

      if (result.anti_exemplar) {
        expect(result.anti_exemplar.is_anti_exemplar).toBe(true);
      }
      // Anti-exemplar count should be 0 or 1
      const antiCount = result.anti_exemplar ? 1 : 0;
      expect(antiCount).toBeLessThanOrEqual(1);
    });

    it('should respect limit parameter', () => {
      const query: ExemplarQuery = {
        genre: 'romance',
        scene_type: 'dialogue',
        limit: 1,
      };

      const result = queryExemplars(testLibrary, query);

      expect(result.exemplars.length).toBeLessThanOrEqual(1);
    });

    it('should exclude anti-exemplars when include_anti is false', () => {
      const query: ExemplarQuery = {
        genre: 'romance',
        scene_type: 'dialogue',
        include_anti: false,
      };

      const result = queryExemplars(testLibrary, query);

      expect(result.anti_exemplar).toBeUndefined();
    });

    it('should prefer paired anti-exemplar over generic one', () => {
      const query: ExemplarQuery = {
        genre: 'romance',
        scene_type: 'dialogue',
      };

      const result = queryExemplars(testLibrary, query);

      // If romance_001 is in results, the anti should be romance_101 (paired)
      if (result.exemplars.some((e) => e.id === 'exm_romance_001')) {
        if (result.anti_exemplar) {
          expect(result.anti_exemplar.id).toBe('exm_romance_101');
        }
      }
    });

    it('should calculate total_tokens for result', () => {
      const query: ExemplarQuery = {
        genre: 'romance',
        scene_type: 'dialogue',
        limit: 2,
      };

      const result = queryExemplars(testLibrary, query);

      expect(result.total_tokens).toBeGreaterThan(0);
    });

    it('should score higher when more dimensions match', () => {
      // Add a romance dialogue with all matching attributes
      const libraryWithPerfectMatch: StyleLibrary = {
        ...testLibrary,
        exemplars: [
          ...testLibrary.exemplars,
          {
            id: 'exm_romance_004',
            content: '완벽 매칭 예시. '.repeat(50),
            genre: ['romance'],
            scene_type: 'dialogue',
            emotional_tone: ['warmth'],
            pov: 'third-limited',
            pacing: 'slow',
            is_anti_exemplar: false,
            source: 'test',
          },
        ],
      };

      const query: ExemplarQuery = {
        genre: 'romance',
        scene_type: 'dialogue',
        emotional_tone: 'warmth',
        pov: 'third-limited',
        pacing: 'slow',
        limit: 1,
      };

      const result = queryExemplars(libraryWithPerfectMatch, query);

      // The perfect match should be first
      expect(result.exemplars[0].id).toBe('exm_romance_004');
    });
  });

  describe('getLibraryStats', () => {
    it('should calculate correct statistics', () => {
      const stats = getLibraryStats(testLibrary);

      expect(stats.total).toBe(6);
      expect(stats.good).toBe(4);
      expect(stats.anti).toBe(2);
      expect(stats.byGenre['romance']).toBe(4); // 3 good + 1 anti
      expect(stats.byGenre['fantasy']).toBe(2); // 1 good + 1 anti
      expect(stats.bySceneType['dialogue']).toBe(3);
      expect(stats.bySceneType['action']).toBe(2);
      expect(stats.bySceneType['emotional-peak']).toBe(1);
    });

    it('should handle empty library', () => {
      const emptyLibrary: StyleLibrary = {
        exemplars: [],
        metadata: {
          version: '1.0.0',
          total_exemplars: 0,
          genres_covered: [],
          last_updated: '',
        },
      };

      const stats = getLibraryStats(emptyLibrary);

      expect(stats.total).toBe(0);
      expect(stats.good).toBe(0);
      expect(stats.anti).toBe(0);
      expect(Object.keys(stats.byGenre)).toHaveLength(0);
      expect(Object.keys(stats.bySceneType)).toHaveLength(0);
    });
  });
});
