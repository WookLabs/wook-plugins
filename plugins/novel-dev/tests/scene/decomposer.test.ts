/**
 * Scene Decomposer and Validator Tests
 *
 * Tests for chapter-to-scene decomposition and scene validation.
 */

import { describe, it, expect } from 'vitest';
import { decomposeChapter } from '../../src/scene/decomposer.js';
import { validateScenes } from '../../src/scene/validator.js';
import { SceneV5, DecompositionConfig } from '../../src/scene/types.js';
import { ChapterMeta, Scene } from '../../src/types.js';

// ============================================================================
// Test Fixtures
// ============================================================================

/**
 * Create a minimal ChapterMeta fixture for testing
 */
function createChapterFixture(
  scenes: Scene[],
  overrides: Partial<ChapterMeta> = {}
): ChapterMeta {
  return {
    chapter_number: 1,
    chapter_title: '제1장: 시작',
    status: 'planned',
    word_count_target: 3000,
    meta: {
      pov_character: 'char_001',
      characters: ['char_001', 'char_002'],
      locations: ['loc_001'],
      in_story_time: '20XX년 3월 15일 오후',
    },
    context: {
      previous_summary: '',
      current_plot:
        '주인공 서연은 오랜만에 고향에 돌아왔다. 버스에서 내리자마자 익숙한 냄새가 코끝을 스쳤다. 마을 입구에서 오랜 친구 민호를 만났다. 두 사람은 어색한 인사를 나누고, 서연은 자신의 비밀을 숨기며 대화했다.',
      next_plot: '서연이 숨겨왔던 비밀이 드러나기 시작한다.',
    },
    narrative_elements: {
      foreshadowing_plant: ['fore_001'],
      foreshadowing_payoff: ['fore_002'],
      hooks_plant: [],
      hooks_reveal: [],
      character_development: '서연의 내면 갈등 표현',
      emotional_goal: '향수와 불안의 교차',
    },
    scenes,
    style_guide: {
      tone: '서정적',
      pacing: 'medium',
      focus: 'introspection',
    },
    ...overrides,
  };
}

/**
 * Create a basic scene fixture
 */
function createSceneFixture(
  scene_number: number,
  overrides: Partial<Scene> = {}
): Scene {
  return {
    scene_number,
    purpose: `씬 ${scene_number}의 목적`,
    characters: ['char_001'],
    location: 'loc_001',
    conflict: '내면의 갈등',
    beat: '주요 사건 발생',
    estimated_words: 800,
    ...overrides,
  };
}

/**
 * Create a valid SceneV5 fixture for validator tests
 */
function createSceneV5Fixture(
  scene_number: number,
  totalScenes: number,
  overrides: Partial<SceneV5> = {}
): SceneV5 {
  const isFirst = scene_number === 1;
  const isLast = scene_number === totalScenes;

  return {
    scene_number,
    purpose: `씬 ${scene_number}의 목적`,
    characters: ['char_001'],
    location: 'loc_001',
    conflict: '갈등 상황',
    beat: '이야기 비트',
    pov_character: 'char_001',
    sensory_anchors: ['sight', 'sound'],
    emotional_arc: {
      entry_emotion: 'neutral',
      exit_emotion: 'anticipation',
      peak_moment: '클라이맥스 순간',
      tension_target: 5,
    },
    foreshadowing: {
      plant: [],
      payoff: [],
      hint: [],
    },
    transition: {
      from_previous: isFirst ? 'chapter opening' : 'continuation from neutral',
      to_next: isLast ? 'chapter ending hook' : 'emotional shift: anticipation to neutral',
    },
    ...overrides,
  };
}

// ============================================================================
// decomposeChapter Tests
// ============================================================================

describe('decomposeChapter', () => {
  describe('Basic decomposition', () => {
    it('should produce SceneV5 objects with all new fields populated', () => {
      const scenes = [
        createSceneFixture(1, { purpose: '도착 장면 - 버스에서 내리는 주인공' }),
        createSceneFixture(2, { purpose: '재회 장면 - 친구와의 만남' }),
        createSceneFixture(3, { purpose: '대화 장면 - 어색한 인사' }),
      ];
      const chapter = createChapterFixture(scenes);

      const result = decomposeChapter(chapter);

      expect(result.scenes).toHaveLength(3);
      expect(result.original_beat_count).toBe(3);

      // Check all new fields are populated
      for (const scene of result.scenes) {
        expect(scene.pov_character).toBeDefined();
        expect(scene.sensory_anchors).toBeDefined();
        expect(scene.sensory_anchors.length).toBeGreaterThanOrEqual(2);
        expect(scene.emotional_arc).toBeDefined();
        expect(scene.emotional_arc.entry_emotion).toBeDefined();
        expect(scene.emotional_arc.exit_emotion).toBeDefined();
        expect(scene.emotional_arc.peak_moment).toBeDefined();
        expect(scene.emotional_arc.tension_target).toBeGreaterThanOrEqual(1);
        expect(scene.emotional_arc.tension_target).toBeLessThanOrEqual(10);
        expect(scene.foreshadowing).toBeDefined();
        expect(scene.transition).toBeDefined();
      }
    });
  });

  describe('POV assignment', () => {
    it('should assign chapter pov_character to all scenes by default', () => {
      const scenes = [
        createSceneFixture(1),
        createSceneFixture(2),
        createSceneFixture(3),
      ];
      const chapter = createChapterFixture(scenes, {
        meta: {
          pov_character: 'char_main',
          characters: ['char_main', 'char_002'],
          locations: ['loc_001'],
          in_story_time: '20XX년 3월 15일',
        },
      });

      const result = decomposeChapter(chapter);

      for (const scene of result.scenes) {
        expect(scene.pov_character).toBe('char_main');
      }
    });
  });

  describe('Sensory anchors', () => {
    it('should assign at least 2 sensory anchors per scene', () => {
      const scenes = [
        createSceneFixture(1),
        createSceneFixture(2),
      ];
      const chapter = createChapterFixture(scenes);

      const result = decomposeChapter(chapter);

      for (const scene of result.scenes) {
        expect(scene.sensory_anchors.length).toBeGreaterThanOrEqual(2);
      }
    });

    it('should detect sensory anchors from scene content', () => {
      const scenes = [
        createSceneFixture(1, {
          purpose: '소리를 듣고 바라보는 장면',
          beat: '어디선가 소리가 들렸다. 눈을 크게 뜨고 주위를 둘러보았다.',
        }),
      ];
      const chapter = createChapterFixture(scenes);

      const result = decomposeChapter(chapter);

      expect(result.scenes[0].sensory_anchors).toContain('sight');
      expect(result.scenes[0].sensory_anchors).toContain('sound');
    });
  });

  describe('Emotional arc continuity', () => {
    it('should chain exit_emotion to next scene entry_emotion', () => {
      const scenes = [
        createSceneFixture(1),
        createSceneFixture(2),
        createSceneFixture(3),
      ];
      const chapter = createChapterFixture(scenes);

      const result = decomposeChapter(chapter);

      // First scene starts with neutral (no previous)
      expect(result.scenes[0].emotional_arc.entry_emotion).toBe('neutral');

      // Each subsequent scene's entry should match previous exit
      for (let i = 1; i < result.scenes.length; i++) {
        expect(result.scenes[i].emotional_arc.entry_emotion).toBe(
          result.scenes[i - 1].emotional_arc.exit_emotion
        );
      }
    });
  });

  describe('Foreshadowing mapping', () => {
    it('should map chapter foreshadowing_plant to at least one scene', () => {
      const scenes = [
        createSceneFixture(1, {
          purpose: '시작 장면',
          beat: '처음 등장하는 캐릭터',
        }),
        createSceneFixture(2),
      ];
      const chapter = createChapterFixture(scenes, {
        narrative_elements: {
          foreshadowing_plant: ['fore_001', 'fore_002'],
          foreshadowing_payoff: [],
          hooks_plant: [],
          hooks_reveal: [],
          character_development: '',
          emotional_goal: '',
        },
      });

      const result = decomposeChapter(chapter);

      // At least one scene should have foreshadowing plant
      const hasPlant = result.scenes.some(
        (scene) => scene.foreshadowing.plant.length > 0
      );
      expect(hasPlant).toBe(true);
    });
  });

  describe('Transition chain', () => {
    it('should have "chapter opening" for first scene from_previous', () => {
      const scenes = [createSceneFixture(1), createSceneFixture(2)];
      const chapter = createChapterFixture(scenes);

      const result = decomposeChapter(chapter);

      expect(result.scenes[0].transition.from_previous).toBe('chapter opening');
    });

    it('should have "chapter ending hook" for last scene to_next', () => {
      const scenes = [createSceneFixture(1), createSceneFixture(2)];
      const chapter = createChapterFixture(scenes);

      const result = decomposeChapter(chapter);

      expect(result.scenes[result.scenes.length - 1].transition.to_next).toBe(
        'chapter ending hook'
      );
    });
  });

  describe('Scene merging', () => {
    it('should merge scenes under min_scene_chars threshold', () => {
      const scenes = [
        createSceneFixture(1, { estimated_words: 200 }), // 400 chars, under 800
        createSceneFixture(2, { estimated_words: 200 }), // 400 chars, under 800
        createSceneFixture(3, { estimated_words: 500 }), // 1000 chars, ok
      ];
      const chapter = createChapterFixture(scenes);

      const result = decomposeChapter(chapter, { min_scene_chars: 800 });

      // First two should be merged
      expect(result.scenes.length).toBeLessThan(3);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should respect merge_threshold configuration', () => {
      const scenes = [
        createSceneFixture(1, { estimated_words: 400 }), // 800 chars
        createSceneFixture(2, { estimated_words: 400 }), // 800 chars
      ];
      const chapter = createChapterFixture(scenes);

      const resultStrict = decomposeChapter(chapter, {
        merge_threshold: 1000,
        min_scene_chars: 1000,
      });
      const resultLenient = decomposeChapter(chapter, {
        merge_threshold: 500,
        min_scene_chars: 500,
      });

      // Strict should merge, lenient should not
      expect(resultStrict.scenes.length).toBeLessThanOrEqual(
        resultLenient.scenes.length
      );
    });
  });

  describe('Max scenes cap', () => {
    it('should cap scenes at max_scenes (default 5)', () => {
      const scenes = Array.from({ length: 7 }, (_, i) =>
        createSceneFixture(i + 1, { estimated_words: 600 })
      );
      const chapter = createChapterFixture(scenes);

      const result = decomposeChapter(chapter);

      expect(result.scenes.length).toBeLessThanOrEqual(5);
      expect(result.original_beat_count).toBe(7);
    });

    it('should respect custom max_scenes configuration', () => {
      const scenes = Array.from({ length: 7 }, (_, i) =>
        createSceneFixture(i + 1, { estimated_words: 600 })
      );
      const chapter = createChapterFixture(scenes);

      const result = decomposeChapter(chapter, { max_scenes: 3 });

      expect(result.scenes.length).toBeLessThanOrEqual(3);
    });
  });

  describe('Empty scenes array', () => {
    it('should return empty result with warning for chapters with no scenes', () => {
      const chapter = createChapterFixture([]);

      const result = decomposeChapter(chapter);

      expect(result.scenes).toHaveLength(0);
      expect(result.warnings).toContain('Chapter has no scenes defined');
      expect(result.original_beat_count).toBe(0);
    });
  });

  describe('Scene renumbering', () => {
    it('should renumber scenes sequentially after merges', () => {
      const scenes = [
        createSceneFixture(1, { estimated_words: 200 }),
        createSceneFixture(2, { estimated_words: 200 }),
        createSceneFixture(3, { estimated_words: 500 }),
      ];
      const chapter = createChapterFixture(scenes);

      const result = decomposeChapter(chapter, { min_scene_chars: 800 });

      // After merge, scene numbers should be sequential from 1
      for (let i = 0; i < result.scenes.length; i++) {
        expect(result.scenes[i].scene_number).toBe(i + 1);
      }
    });
  });
});

// ============================================================================
// validateScenes Tests
// ============================================================================

describe('validateScenes', () => {
  describe('Valid scenes', () => {
    it('should return valid: true for well-formed SceneV5 array', () => {
      const scenes: SceneV5[] = [
        createSceneV5Fixture(1, 3),
        createSceneV5Fixture(2, 3),
        createSceneV5Fixture(3, 3),
      ];

      const result = validateScenes(scenes);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Sensory anchors validation', () => {
    it('should return error for scene with less than 2 sensory_anchors', () => {
      const scenes: SceneV5[] = [
        createSceneV5Fixture(1, 2, { sensory_anchors: ['sight'] }), // Only 1
        createSceneV5Fixture(2, 2),
      ];

      const result = validateScenes(scenes);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('sensory anchors'))).toBe(true);
    });

    it('should return error for scene with no sensory_anchors', () => {
      const scenes: SceneV5[] = [
        createSceneV5Fixture(1, 1, { sensory_anchors: [] }),
      ];

      const result = validateScenes(scenes);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('sensory anchors'))).toBe(true);
    });
  });

  describe('Tension target validation', () => {
    it('should return error for tension_target > 10', () => {
      const scenes: SceneV5[] = [
        createSceneV5Fixture(1, 1, {
          emotional_arc: {
            entry_emotion: 'neutral',
            exit_emotion: 'joy',
            peak_moment: 'peak',
            tension_target: 15, // Invalid
          },
        }),
      ];

      const result = validateScenes(scenes);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('tension_target'))).toBe(true);
    });

    it('should return error for tension_target < 1', () => {
      const scenes: SceneV5[] = [
        createSceneV5Fixture(1, 1, {
          emotional_arc: {
            entry_emotion: 'neutral',
            exit_emotion: 'joy',
            peak_moment: 'peak',
            tension_target: 0, // Invalid
          },
        }),
      ];

      const result = validateScenes(scenes);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('tension_target'))).toBe(true);
    });
  });

  describe('Scene number validation', () => {
    it('should return error for non-sequential scene numbers', () => {
      const scenes: SceneV5[] = [
        createSceneV5Fixture(1, 3),
        createSceneV5Fixture(3, 3), // Gap: missing 2
        createSceneV5Fixture(4, 3),
      ];

      const result = validateScenes(scenes);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('Scene number'))).toBe(true);
    });

    it('should return error for duplicate scene numbers', () => {
      const scenes: SceneV5[] = [
        createSceneV5Fixture(1, 2),
        createSceneV5Fixture(1, 2), // Duplicate
      ];

      const result = validateScenes(scenes);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('Duplicate'))).toBe(true);
    });
  });

  describe('Scene count validation', () => {
    it('should return warning for more than 6 scenes', () => {
      const scenes: SceneV5[] = Array.from({ length: 7 }, (_, i) =>
        createSceneV5Fixture(i + 1, 7)
      );

      const result = validateScenes(scenes);

      // This should be a warning, not an error
      expect(result.warnings.some((w) => w.includes('exceeds'))).toBe(true);
    });

    it('should return error for empty scenes array', () => {
      const result = validateScenes([]);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('No scenes'))).toBe(true);
    });
  });

  describe('Foreshadowing ID validation', () => {
    it('should return error for invalid foreshadowing ID format', () => {
      const scenes: SceneV5[] = [
        createSceneV5Fixture(1, 1, {
          foreshadowing: {
            plant: ['invalid_id'], // Should be fore_xxx
            payoff: [],
            hint: [],
          },
        }),
      ];

      const result = validateScenes(scenes);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('foreshadowing ID'))).toBe(true);
    });

    it('should accept valid fore_xxx format IDs', () => {
      const scenes: SceneV5[] = [
        createSceneV5Fixture(1, 1, {
          foreshadowing: {
            plant: ['fore_001', 'fore_secret_reveal'],
            payoff: ['fore_002'],
            hint: [],
          },
        }),
      ];

      const result = validateScenes(scenes);

      // No foreshadowing ID errors
      expect(
        result.errors.some((e) => e.includes('foreshadowing ID'))
      ).toBe(false);
    });
  });

  describe('Transition validation', () => {
    it('should return error for missing from_previous on scene > 1', () => {
      const scenes: SceneV5[] = [
        createSceneV5Fixture(1, 2),
        createSceneV5Fixture(2, 2, {
          transition: { from_previous: '', to_next: 'chapter ending hook' },
        }),
      ];

      const result = validateScenes(scenes);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('from_previous'))).toBe(true);
    });

    it('should return error for missing to_next on scene < last', () => {
      const scenes: SceneV5[] = [
        createSceneV5Fixture(1, 2, {
          transition: { from_previous: 'chapter opening', to_next: '' },
        }),
        createSceneV5Fixture(2, 2),
      ];

      const result = validateScenes(scenes);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('to_next'))).toBe(true);
    });
  });

  describe('POV character validation', () => {
    it('should return error for missing pov_character', () => {
      const scenes: SceneV5[] = [
        createSceneV5Fixture(1, 1, { pov_character: '' }),
      ];

      const result = validateScenes(scenes);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('pov_character'))).toBe(true);
    });
  });

  describe('Emotional continuity', () => {
    it('should warn when exit_emotion does not match next entry_emotion', () => {
      const scenes: SceneV5[] = [
        createSceneV5Fixture(1, 2, {
          emotional_arc: {
            entry_emotion: 'neutral',
            exit_emotion: 'joy', // Exit is joy
            peak_moment: 'peak',
            tension_target: 5,
          },
        }),
        createSceneV5Fixture(2, 2, {
          emotional_arc: {
            entry_emotion: 'sadness', // Entry is sadness - mismatch!
            exit_emotion: 'neutral',
            peak_moment: 'peak',
            tension_target: 5,
          },
        }),
      ];

      const result = validateScenes(scenes);

      // Should be a warning, not an error (continuity is soft constraint)
      expect(result.warnings.some((w) => w.includes('discontinuity'))).toBe(true);
    });
  });
});
