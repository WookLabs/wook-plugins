/**
 * Style Library Storage Module Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import {
  loadLibrary,
  saveLibrary,
  addExemplar,
  removeExemplar,
  updateExemplar,
  findExemplarById,
} from '../../src/style-library/storage.js';
import type { StyleLibrary, NewExemplarInput } from '../../src/style-library/types.js';

describe('Style Library Storage', () => {
  let tempDir: string;

  beforeEach(async () => {
    // Create a temporary directory for testing
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'style-library-test-'));
  });

  afterEach(async () => {
    // Clean up temporary directory
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('loadLibrary', () => {
    it('should return empty library when file does not exist', async () => {
      const library = await loadLibrary(tempDir);

      expect(library.exemplars).toEqual([]);
      expect(library.metadata.version).toBe('1.0.0');
      expect(library.metadata.total_exemplars).toBe(0);
      expect(library.metadata.genres_covered).toEqual([]);
    });

    it('should load existing library from file', async () => {
      // Create test library file
      const testLibrary: StyleLibrary = {
        exemplars: [
          {
            id: 'exm_test_001',
            content: '테스트 예시 내용입니다. '.repeat(30), // Make it 500+ chars
            genre: ['romance'],
            scene_type: 'dialogue',
            is_anti_exemplar: false,
            source: 'test',
          },
        ],
        metadata: {
          version: '1.0.0',
          total_exemplars: 1,
          genres_covered: ['romance'],
          last_updated: '2026-01-01T00:00:00Z',
        },
      };

      await fs.mkdir(path.join(tempDir, 'meta'), { recursive: true });
      await fs.writeFile(
        path.join(tempDir, 'meta/style-library.json'),
        JSON.stringify(testLibrary),
        'utf-8'
      );

      const library = await loadLibrary(tempDir);

      expect(library.exemplars.length).toBe(1);
      expect(library.exemplars[0].id).toBe('exm_test_001');
      expect(library.metadata.total_exemplars).toBe(1);
    });
  });

  describe('saveLibrary', () => {
    it('should save library and update metadata', async () => {
      const library: StyleLibrary = {
        exemplars: [
          {
            id: 'exm_fantasy_001',
            content: '판타지 예시 내용입니다. '.repeat(30),
            genre: ['fantasy'],
            scene_type: 'action',
            is_anti_exemplar: false,
            source: 'test',
          },
          {
            id: 'exm_romance_001',
            content: '로맨스 예시 내용입니다. '.repeat(30),
            genre: ['romance'],
            scene_type: 'dialogue',
            is_anti_exemplar: false,
            source: 'test',
          },
        ],
        metadata: {
          version: '1.0.0',
          total_exemplars: 0, // Should be updated
          genres_covered: [],  // Should be updated
          last_updated: '',    // Should be updated
        },
      };

      await saveLibrary(tempDir, library);

      // Read back the file
      const content = await fs.readFile(
        path.join(tempDir, 'meta/style-library.json'),
        'utf-8'
      );
      const savedLibrary = JSON.parse(content) as StyleLibrary;

      expect(savedLibrary.metadata.total_exemplars).toBe(2);
      expect(savedLibrary.metadata.genres_covered).toContain('fantasy');
      expect(savedLibrary.metadata.genres_covered).toContain('romance');
      expect(savedLibrary.metadata.last_updated).toBeTruthy();
    });

    it('should create meta directory if it does not exist', async () => {
      const library: StyleLibrary = {
        exemplars: [],
        metadata: {
          version: '1.0.0',
          total_exemplars: 0,
          genres_covered: [],
          last_updated: '',
        },
      };

      await saveLibrary(tempDir, library);

      const exists = await fs.access(path.join(tempDir, 'meta/style-library.json'))
        .then(() => true)
        .catch(() => false);

      expect(exists).toBe(true);
    });
  });

  describe('addExemplar', () => {
    it('should generate correct ID and set created_at', () => {
      const library: StyleLibrary = {
        exemplars: [],
        metadata: {
          version: '1.0.0',
          total_exemplars: 0,
          genres_covered: [],
          last_updated: '',
        },
      };

      const newExemplar: NewExemplarInput = {
        content: '새로운 예시 내용입니다. '.repeat(30),
        genre: ['romance'],
        scene_type: 'dialogue',
        is_anti_exemplar: false,
        source: 'test',
      };

      const updatedLibrary = addExemplar(library, newExemplar);

      expect(updatedLibrary.exemplars.length).toBe(1);
      expect(updatedLibrary.exemplars[0].id).toMatch(/^exm_romance_\d{3}$/);
      expect(updatedLibrary.exemplars[0].created_at).toBeTruthy();
    });

    it('should increment ID number for same genre', () => {
      const library: StyleLibrary = {
        exemplars: [
          {
            id: 'exm_romance_001',
            content: '기존 예시 1',
            genre: ['romance'],
            scene_type: 'dialogue',
            is_anti_exemplar: false,
            source: 'test',
          },
          {
            id: 'exm_romance_002',
            content: '기존 예시 2',
            genre: ['romance'],
            scene_type: 'action',
            is_anti_exemplar: false,
            source: 'test',
          },
        ],
        metadata: {
          version: '1.0.0',
          total_exemplars: 2,
          genres_covered: ['romance'],
          last_updated: '',
        },
      };

      const newExemplar: NewExemplarInput = {
        content: '새로운 로맨스 예시입니다. '.repeat(30),
        genre: ['romance'],
        scene_type: 'emotional-peak',
        is_anti_exemplar: false,
        source: 'test',
      };

      const updatedLibrary = addExemplar(library, newExemplar);

      expect(updatedLibrary.exemplars[2].id).toBe('exm_romance_003');
    });
  });

  describe('removeExemplar', () => {
    it('should remove exemplar by ID', () => {
      const library: StyleLibrary = {
        exemplars: [
          {
            id: 'exm_romance_001',
            content: '예시 1',
            genre: ['romance'],
            scene_type: 'dialogue',
            is_anti_exemplar: false,
            source: 'test',
          },
          {
            id: 'exm_romance_002',
            content: '예시 2',
            genre: ['romance'],
            scene_type: 'action',
            is_anti_exemplar: false,
            source: 'test',
          },
        ],
        metadata: {
          version: '1.0.0',
          total_exemplars: 2,
          genres_covered: ['romance'],
          last_updated: '',
        },
      };

      const updatedLibrary = removeExemplar(library, 'exm_romance_001');

      expect(updatedLibrary.exemplars.length).toBe(1);
      expect(updatedLibrary.exemplars[0].id).toBe('exm_romance_002');
    });

    it('should clean anti_exemplar_pair references', () => {
      const library: StyleLibrary = {
        exemplars: [
          {
            id: 'exm_romance_001',
            content: '좋은 예시',
            genre: ['romance'],
            scene_type: 'dialogue',
            is_anti_exemplar: false,
            source: 'test',
          },
          {
            id: 'exm_romance_101',
            content: '나쁜 예시',
            genre: ['romance'],
            scene_type: 'dialogue',
            is_anti_exemplar: true,
            anti_exemplar_pair: 'exm_romance_001',
            source: 'test',
          },
        ],
        metadata: {
          version: '1.0.0',
          total_exemplars: 2,
          genres_covered: ['romance'],
          last_updated: '',
        },
      };

      const updatedLibrary = removeExemplar(library, 'exm_romance_001');

      expect(updatedLibrary.exemplars.length).toBe(1);
      expect(updatedLibrary.exemplars[0].anti_exemplar_pair).toBeUndefined();
    });
  });

  describe('updateExemplar', () => {
    it('should update exemplar with partial data', () => {
      const library: StyleLibrary = {
        exemplars: [
          {
            id: 'exm_romance_001',
            content: '원본 내용',
            genre: ['romance'],
            scene_type: 'dialogue',
            is_anti_exemplar: false,
            source: 'test',
          },
        ],
        metadata: {
          version: '1.0.0',
          total_exemplars: 1,
          genres_covered: ['romance'],
          last_updated: '',
        },
      };

      const updatedLibrary = updateExemplar(library, 'exm_romance_001', {
        quality_notes: '업데이트된 품질 노트',
        emotional_tone: ['warmth'],
      });

      expect(updatedLibrary.exemplars[0].quality_notes).toBe('업데이트된 품질 노트');
      expect(updatedLibrary.exemplars[0].emotional_tone).toEqual(['warmth']);
      expect(updatedLibrary.exemplars[0].content).toBe('원본 내용'); // Unchanged
      expect(updatedLibrary.exemplars[0].id).toBe('exm_romance_001'); // Preserved
    });
  });

  describe('findExemplarById', () => {
    it('should find exemplar by ID', () => {
      const library: StyleLibrary = {
        exemplars: [
          {
            id: 'exm_romance_001',
            content: '예시 1',
            genre: ['romance'],
            scene_type: 'dialogue',
            is_anti_exemplar: false,
            source: 'test',
          },
          {
            id: 'exm_fantasy_001',
            content: '예시 2',
            genre: ['fantasy'],
            scene_type: 'action',
            is_anti_exemplar: false,
            source: 'test',
          },
        ],
        metadata: {
          version: '1.0.0',
          total_exemplars: 2,
          genres_covered: ['romance', 'fantasy'],
          last_updated: '',
        },
      };

      const found = findExemplarById(library, 'exm_fantasy_001');

      expect(found).toBeDefined();
      expect(found?.genre).toEqual(['fantasy']);
    });

    it('should return undefined for non-existent ID', () => {
      const library: StyleLibrary = {
        exemplars: [],
        metadata: {
          version: '1.0.0',
          total_exemplars: 0,
          genres_covered: [],
          last_updated: '',
        },
      };

      const found = findExemplarById(library, 'exm_nonexistent_001');

      expect(found).toBeUndefined();
    });
  });

  describe('loadLibrary and saveLibrary round-trip', () => {
    it('should preserve data through load/save cycle', async () => {
      const originalLibrary: StyleLibrary = {
        exemplars: [
          {
            id: 'exm_romance_001',
            content: '테스트 예시 내용입니다. 이것은 500자 이상이어야 합니다. '.repeat(20),
            genre: ['romance', 'daily-life'],
            scene_type: 'dialogue',
            emotional_tone: ['warmth', 'tension'],
            pov: 'third-limited',
            pacing: 'medium',
            is_anti_exemplar: false,
            source: 'curated',
            quality_notes: '품질 노트 테스트',
            language_features: ['varied-rhythm', 'sensory-rich'],
            created_at: '2026-01-01T00:00:00Z',
          },
        ],
        metadata: {
          version: '1.0.0',
          total_exemplars: 1,
          genres_covered: ['romance', 'daily-life'],
          last_updated: '2026-01-01T00:00:00Z',
        },
      };

      // Save and reload
      await saveLibrary(tempDir, originalLibrary);
      const reloadedLibrary = await loadLibrary(tempDir);

      // Verify exemplar data
      expect(reloadedLibrary.exemplars.length).toBe(1);
      expect(reloadedLibrary.exemplars[0].id).toBe('exm_romance_001');
      expect(reloadedLibrary.exemplars[0].genre).toEqual(['romance', 'daily-life']);
      expect(reloadedLibrary.exemplars[0].emotional_tone).toEqual(['warmth', 'tension']);
      expect(reloadedLibrary.exemplars[0].quality_notes).toBe('품질 노트 테스트');

      // Verify metadata was updated
      expect(reloadedLibrary.metadata.total_exemplars).toBe(1);
      expect(reloadedLibrary.metadata.genres_covered).toContain('romance');
      expect(reloadedLibrary.metadata.genres_covered).toContain('daily-life');
    });
  });
});
