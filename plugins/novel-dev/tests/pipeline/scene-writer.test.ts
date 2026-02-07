import { describe, it, expect } from 'vitest';
import {
  // Scene writer functions
  mapSceneTypeFromTags,
  buildExemplarQuery,
  buildSceneContextItems,
  extractEnding,
  prepareSceneDraft,
  prepareChapterScenes,
  createSceneDraftResult,
  DEFAULT_SCENE_WRITER_CONFIG,
  // Assembler functions
  detectTransitionGaps,
  assembleScenes,
  assembleScenesWithGaps,
  validateAssembly,
} from '../../src/pipeline/index.js';

import type { SceneV5 } from '../../src/scene/types.js';
import type { StyleLibrary } from '../../src/style-library/types.js';
import type { ContextItem, ItemMetadata } from '../../src/context/types.js';
import type { SceneDraftResult } from '../../src/pipeline/types.js';

// ============================================================================
// Test Data
// ============================================================================

const createMockScene = (overrides: Partial<SceneV5> = {}): SceneV5 => ({
  scene_number: 1,
  purpose: 'Test scene purpose',
  characters: ['char_001'],
  location: 'loc_001',
  pov_character: 'char_001',
  sensory_anchors: ['visual anchor', 'auditory anchor'],
  emotional_arc: {
    entry_emotion: 'neutral',
    exit_emotion: 'hopeful',
    peak_moment: 'realization moment',
    tension_target: 5,
  },
  foreshadowing: {
    plant: [],
    payoff: [],
    hint: [],
  },
  transition: {
    from_previous: 'chapter opening',
    to_next: 'leads to confrontation',
  },
  ...overrides,
});

const createMockLibrary = (): StyleLibrary => ({
  exemplars: [
    {
      id: 'exm_romance_001',
      content: '그녀의 눈빛이 흔들렸다. 말하지 않아도 알 수 있었다. '.repeat(20), // ~500 chars
      genre: ['romance'],
      scene_type: 'dialogue',
      emotional_tone: ['warmth', 'longing'],
      pov: 'third-limited',
      pacing: 'slow',
      is_anti_exemplar: false,
      source: 'curated',
    },
    {
      id: 'exm_romance_002',
      content: '창밖으로 비가 내렸다. 그는 창가에 서서 멀리 바라보았다. '.repeat(20),
      genre: ['romance'],
      scene_type: 'emotional-peak',
      emotional_tone: ['melancholy'],
      pov: 'third-limited',
      pacing: 'slow',
      is_anti_exemplar: false,
      source: 'curated',
    },
    {
      id: 'exm_romance_anti_001',
      content: '그는 슬펐다. 그녀가 보고 싶었다. 마음이 아팠다. '.repeat(20),
      genre: ['romance'],
      scene_type: 'dialogue',
      is_anti_exemplar: true,
      anti_exemplar_pair: 'exm_romance_001',
      source: 'curated',
    },
  ],
  metadata: {
    version: '1.0.0',
    total_exemplars: 3,
    genres_covered: ['romance'],
    last_updated: new Date().toISOString(),
  },
});

const createMockContextItems = (): ContextItem[] => [
  {
    id: 'style_guide',
    type: 'style',
    path: 'context/style-guide.json',
    content: 'Style guide content',
    estimatedTokens: 100,
    priority: 10,
    required: true,
  },
  {
    id: 'plot_001',
    type: 'plot',
    path: 'context/chapter_1.json',
    content: 'Plot content',
    estimatedTokens: 100,
    priority: 9,
    required: true,
  },
  {
    id: 'char_001',
    type: 'character',
    path: 'characters/char_001.json',
    content: 'Character profile',
    estimatedTokens: 500,
    priority: 8,
    required: false,
  },
];

const createMockMetadata = (): ItemMetadata => ({
  currentChapter: 5,
  genre: 'romance',
});

// ============================================================================
// Scene Type Mapping Tests
// ============================================================================

describe('mapSceneTypeFromTags', () => {
  it('should map dialogue tags to dialogue scene type', () => {
    expect(mapSceneTypeFromTags(['dialogue', 'tension'], 'conversation scene')).toBe('dialogue');
  });

  it('should map action tags to action scene type', () => {
    expect(mapSceneTypeFromTags(['action'], 'fight sequence')).toBe('action');
  });

  it('should map emotional tags to emotional-peak', () => {
    expect(mapSceneTypeFromTags(['emotional', 'revelation'], 'emotional moment')).toBe('emotional-peak');
  });

  it('should detect scene type from purpose when no matching tags', () => {
    expect(mapSceneTypeFromTags([], 'opening hook for chapter')).toBe('opening-hook');
    expect(mapSceneTypeFromTags([], 'climax confrontation')).toBe('climax');
    expect(mapSceneTypeFromTags([], 'resolution and denouement')).toBe('denouement');
  });

  it('should default to transition for unrecognized scenes', () => {
    expect(mapSceneTypeFromTags([], 'some generic scene')).toBe('transition');
  });

  it('should handle undefined tags', () => {
    expect(mapSceneTypeFromTags(undefined, 'dialogue scene')).toBe('dialogue');
  });
});

// ============================================================================
// Exemplar Query Building Tests
// ============================================================================

describe('buildExemplarQuery', () => {
  it('should build query from scene data', () => {
    const scene = createMockScene({
      exemplar_tags: ['dialogue'],
      style_override: { pacing: 'slow', focus: 'emotion', tone: 'melancholy' },
    });

    const query = buildExemplarQuery(scene, 'romance', DEFAULT_SCENE_WRITER_CONFIG);

    expect(query.genre).toBe('romance');
    expect(query.scene_type).toBe('dialogue');
    expect(query.pacing).toBe('slow');
    expect(query.limit).toBe(2); // 3 max - 1 anti
    expect(query.include_anti).toBe(true);
  });

  it('should extract emotional tone from emotional arc', () => {
    const scene = createMockScene({
      emotional_arc: {
        entry_emotion: 'calm',
        exit_emotion: 'excited',
        peak_moment: 'moment of warmth and connection',
        tension_target: 6,
      },
    });

    const query = buildExemplarQuery(scene, 'romance', DEFAULT_SCENE_WRITER_CONFIG);

    expect(query.emotional_tone).toBe('moment of warmth and connection');
  });

  it('should respect config for anti-exemplar inclusion', () => {
    const scene = createMockScene();
    const configNoAnti = { ...DEFAULT_SCENE_WRITER_CONFIG, includeAntiExemplar: false };

    const query = buildExemplarQuery(scene, 'romance', configNoAnti);

    expect(query.limit).toBe(3); // Full limit without anti
    expect(query.include_anti).toBe(false);
  });
});

// ============================================================================
// Context Building Tests
// ============================================================================

describe('buildSceneContextItems', () => {
  it('should create scene plan context item', () => {
    const scene = createMockScene();
    const library = createMockLibrary();
    const exemplars = {
      exemplars: library.exemplars.filter(e => !e.is_anti_exemplar).slice(0, 2),
      anti_exemplar: library.exemplars.find(e => e.is_anti_exemplar),
      total_tokens: 500,
    };

    const items = buildSceneContextItems(scene, 1, exemplars);

    // Should have scene_plan + 2 exemplars + 1 anti
    expect(items.length).toBe(4);

    const scenePlan = items.find(i => i.type === 'scene_plan');
    expect(scenePlan).toBeDefined();
    expect(scenePlan?.id).toBe('scene_plan_1');

    const exemplarItems = items.filter(i => i.type === 'exemplar');
    expect(exemplarItems.length).toBe(3);
  });

  it('should mark anti-exemplar with warning prefix', () => {
    const scene = createMockScene();
    const library = createMockLibrary();
    const antiExemplar = library.exemplars.find(e => e.is_anti_exemplar)!;
    const exemplars = {
      exemplars: [],
      anti_exemplar: antiExemplar,
      total_tokens: 200,
    };

    const items = buildSceneContextItems(scene, 1, exemplars);

    const antiItem = items.find(i => i.id === antiExemplar.id);
    expect(antiItem?.content).toContain('ANTI-EXEMPLAR');
    expect(antiItem?.content).toContain('DO NOT WRITE LIKE THIS');
  });
});

// ============================================================================
// Ending Extraction Tests
// ============================================================================

describe('extractEnding', () => {
  it('should extract last paragraph when short', () => {
    const content = '첫 번째 문단입니다.\n\n마지막 문단입니다.';
    expect(extractEnding(content)).toBe('마지막 문단입니다.');
  });

  it('should truncate long paragraphs to ~200 chars', () => {
    const longContent = '시작. ' + '가나다라마바사아자차카타파하. '.repeat(20);
    const ending = extractEnding(longContent);
    expect(ending.length).toBeLessThanOrEqual(200);
  });

  it('should return empty string for empty content', () => {
    expect(extractEnding('')).toBe('');
  });

  it('should handle content without paragraph breaks', () => {
    const content = '단일 문단 내용입니다.';
    expect(extractEnding(content)).toBe('단일 문단 내용입니다.');
  });
});

// ============================================================================
// Scene Draft Preparation Tests
// ============================================================================

describe('prepareSceneDraft', () => {
  it('should prepare context with exemplars', () => {
    const scene = createMockScene({ exemplar_tags: ['dialogue'] });
    const library = createMockLibrary();
    const baseItems = createMockContextItems();
    const metadata = createMockMetadata();

    const context = prepareSceneDraft(scene, 1, library, baseItems, metadata);

    expect(context.sceneNumber).toBe(1);
    expect(context.scene).toBe(scene);
    expect(context.exemplars.exemplars.length).toBeGreaterThan(0);
    expect(context.contextBundle).toBeDefined();
    expect(context.targetLength).toEqual({ min: 800, max: 1500 });
  });

  it('should pass previous ending for continuity', () => {
    const scene = createMockScene();
    const library = createMockLibrary();
    const baseItems = createMockContextItems();
    const metadata = createMockMetadata();
    const previousEnding = '이전 장면의 마지막 문장.';

    const context = prepareSceneDraft(
      scene, 1, library, baseItems, metadata,
      DEFAULT_SCENE_WRITER_CONFIG, previousEnding
    );

    expect(context.previousEnding).toBe(previousEnding);
  });
});

describe('prepareChapterScenes', () => {
  it('should prepare contexts for all scenes', () => {
    const scenes = [
      createMockScene({ scene_number: 1, purpose: 'opening' }),
      createMockScene({ scene_number: 2, purpose: 'dialogue scene' }),
      createMockScene({ scene_number: 3, purpose: 'climax' }),
    ];
    const library = createMockLibrary();
    const baseItems = createMockContextItems();
    const metadata = createMockMetadata();

    const result = prepareChapterScenes(scenes, 5, library, baseItems, metadata);

    expect(result.chapterNumber).toBe(5);
    expect(result.sceneContexts.length).toBe(3);
    expect(result.sceneContexts[0].sceneNumber).toBe(1);
    expect(result.sceneContexts[1].sceneNumber).toBe(2);
    expect(result.sceneContexts[2].sceneNumber).toBe(3);
  });
});

// ============================================================================
// Scene Draft Result Creation Tests
// ============================================================================

describe('createSceneDraftResult', () => {
  it('should create result with token estimation', () => {
    const content = '한글 내용입니다. '.repeat(50); // ~500 chars
    const result = createSceneDraftResult(1, content, ['exm_001', 'exm_002']);

    expect(result.sceneNumber).toBe(1);
    expect(result.content).toBe(content);
    expect(result.exemplarsUsed).toEqual(['exm_001', 'exm_002']);
    expect(result.estimatedTokens).toBe(Math.ceil(content.length / 2));
  });

  it('should include pre-writing thoughts when provided', () => {
    const result = createSceneDraftResult(
      1,
      'Content',
      ['exm_001'],
      'Chain of thought output'
    );

    expect(result.preWritingThoughts).toBe('Chain of thought output');
  });
});

// ============================================================================
// Transition Gap Detection Tests
// ============================================================================

describe('detectTransitionGaps', () => {
  it('should detect spatial gaps when location changes', () => {
    const scenes = [
      createMockScene({ scene_number: 1, location: 'loc_001' }),
      createMockScene({ scene_number: 2, location: 'loc_002', transition: { from_previous: 'sudden cut', to_next: '' } }),
    ];

    const gaps = detectTransitionGaps(scenes);

    expect(gaps.some(g => g.gapType === 'spatial')).toBe(true);
    expect(gaps.find(g => g.gapType === 'spatial')?.fromScene).toBe(1);
    expect(gaps.find(g => g.gapType === 'spatial')?.toScene).toBe(2);
  });

  it('should not flag spatial gap when location is same', () => {
    const scenes = [
      createMockScene({ scene_number: 1, location: 'loc_001' }),
      createMockScene({ scene_number: 2, location: 'loc_001' }),
    ];

    const gaps = detectTransitionGaps(scenes);

    expect(gaps.some(g => g.gapType === 'spatial')).toBe(false);
  });

  it('should detect emotional gaps for abrupt shifts', () => {
    const scenes = [
      createMockScene({
        scene_number: 1,
        emotional_arc: {
          entry_emotion: 'calm',
          exit_emotion: 'rage',
          peak_moment: 'explosion',
          tension_target: 9,
        },
      }),
      createMockScene({
        scene_number: 2,
        emotional_arc: {
          entry_emotion: 'calm',
          exit_emotion: 'happy',
          peak_moment: 'peace',
          tension_target: 3,
        },
      }),
    ];

    const gaps = detectTransitionGaps(scenes);

    // Rage to calm is a drastic shift
    expect(gaps.some(g => g.gapType === 'emotional')).toBe(true);
  });

  it('should return empty array when no gaps', () => {
    const scenes = [
      createMockScene({
        scene_number: 1,
        location: 'loc_001',
        emotional_arc: {
          entry_emotion: 'calm',
          exit_emotion: 'hopeful',
          peak_moment: 'moment',
          tension_target: 5,
        },
      }),
      createMockScene({
        scene_number: 2,
        location: 'loc_001',
        emotional_arc: {
          entry_emotion: 'hopeful',
          exit_emotion: 'happy',
          peak_moment: 'moment',
          tension_target: 5,
        },
      }),
    ];

    const gaps = detectTransitionGaps(scenes);

    // Same location, smooth emotional progression
    expect(gaps.length).toBe(0);
  });
});

// ============================================================================
// Scene Assembly Tests
// ============================================================================

describe('assembleScenes', () => {
  it('should combine scene content with breaks', () => {
    const drafts: SceneDraftResult[] = [
      { sceneNumber: 1, content: '첫 번째 장면.', estimatedTokens: 10, exemplarsUsed: [] },
      { sceneNumber: 2, content: '두 번째 장면.', estimatedTokens: 10, exemplarsUsed: [] },
    ];

    const result = assembleScenes(drafts);

    expect(result.assembledContent).toContain('첫 번째 장면.');
    expect(result.assembledContent).toContain('두 번째 장면.');
    expect(result.assembledContent).toContain('* * *');
    expect(result.sceneBreakPositions.length).toBe(1);
  });

  it('should assemble without breaks when disabled', () => {
    const drafts: SceneDraftResult[] = [
      { sceneNumber: 1, content: '첫 번째.', estimatedTokens: 5, exemplarsUsed: [] },
      { sceneNumber: 2, content: '두 번째.', estimatedTokens: 5, exemplarsUsed: [] },
    ];

    const result = assembleScenes(drafts, false);

    expect(result.assembledContent).not.toContain('* * *');
    expect(result.assembledContent).toContain('\n\n');
  });

  it('should return empty result for empty drafts', () => {
    const result = assembleScenes([]);

    expect(result.assembledContent).toBe('');
    expect(result.totalCharacters).toBe(0);
    expect(result.sceneBreakPositions).toEqual([]);
  });

  it('should track total characters', () => {
    const content1 = '장면 1 내용';
    const content2 = '장면 2 내용';
    const drafts: SceneDraftResult[] = [
      { sceneNumber: 1, content: content1, estimatedTokens: 10, exemplarsUsed: [] },
      { sceneNumber: 2, content: content2, estimatedTokens: 10, exemplarsUsed: [] },
    ];

    const result = assembleScenes(drafts);

    expect(result.totalCharacters).toBe(result.assembledContent.length);
  });
});

describe('assembleScenesWithGaps', () => {
  it('should combine assembly with gap detection', () => {
    const scenes = [
      createMockScene({ scene_number: 1, location: 'loc_001' }),
      createMockScene({ scene_number: 2, location: 'loc_002' }),
    ];
    const drafts: SceneDraftResult[] = [
      { sceneNumber: 1, content: '장면 1', estimatedTokens: 5, exemplarsUsed: [] },
      { sceneNumber: 2, content: '장면 2', estimatedTokens: 5, exemplarsUsed: [] },
    ];

    const result = assembleScenesWithGaps(scenes, drafts);

    expect(result.assembledContent).toBeDefined();
    expect(result.transitionGaps.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// Assembly Validation Tests
// ============================================================================

describe('validateAssembly', () => {
  it('should pass valid assembly', () => {
    const result = {
      assembledContent: '가나다라. '.repeat(500), // ~3000 chars
      transitionGaps: [],
      totalCharacters: 3000,
      sceneBreakPositions: [1000, 2000],
    };

    const validation = validateAssembly(result, 3);

    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  it('should fail for too short content', () => {
    const result = {
      assembledContent: '짧은 내용.',
      transitionGaps: [],
      totalCharacters: 10,
      sceneBreakPositions: [],
    };

    const validation = validateAssembly(result, 1);

    expect(validation.valid).toBe(false);
    expect(validation.errors.some(e => e.includes('too short'))).toBe(true);
  });

  it('should warn for too long content', () => {
    const result = {
      assembledContent: '긴 내용. '.repeat(3000), // ~15000 chars
      transitionGaps: [],
      totalCharacters: 15000,
      sceneBreakPositions: [],
    };

    const validation = validateAssembly(result, 1);

    expect(validation.valid).toBe(true); // Warning, not error
    expect(validation.warnings.some(w => w.includes('too long'))).toBe(true);
  });

  it('should fail for severe transition gaps', () => {
    const result = {
      assembledContent: '가나다라. '.repeat(500),
      transitionGaps: [
        { fromScene: 1, toScene: 2, gapType: 'emotional' as const, severity: 'severe' as const },
      ],
      totalCharacters: 3000,
      sceneBreakPositions: [1500],
    };

    const validation = validateAssembly(result, 2);

    expect(validation.valid).toBe(false);
    expect(validation.errors.some(e => e.includes('Severe'))).toBe(true);
  });

  it('should warn for scene count mismatch', () => {
    const result = {
      assembledContent: '가나다라. '.repeat(500),
      transitionGaps: [],
      totalCharacters: 3000,
      sceneBreakPositions: [1500], // 2 scenes
    };

    const validation = validateAssembly(result, 3); // Expected 3

    expect(validation.warnings.some(w => w.includes('mismatch'))).toBe(true);
  });
});
