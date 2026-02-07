/**
 * Chapter-to-Scenes Decomposition
 *
 * Transforms chapter metadata and plot beats into enriched SceneV5 objects.
 * This is a DATA ENRICHMENT function using heuristics, not an LLM call.
 * Phase 2 agents will refine these scene specifications.
 */

import { ChapterMeta, Scene } from '../types.js';
import {
  SceneV5,
  DecompositionConfig,
  DecompositionResult,
  EmotionalArc,
  SceneForeshadowing,
  SceneTransition,
  DEFAULT_DECOMPOSITION_CONFIG,
} from './types.js';

// ============================================================================
// Sensory Anchor Detection
// ============================================================================

/**
 * Keywords that suggest specific sensory focuses
 */
const SENSORY_KEYWORDS: Record<string, string[]> = {
  sight: ['보다', '바라보다', '눈', '색', '빛', '어둠', '밝', '그림자'],
  sound: ['소리', '들리다', '목소리', '침묵', '소음', '외치다', '속삭이다'],
  smell: ['냄새', '향기', '악취', '향', '맡다'],
  touch: ['만지다', '느끼다', '차갑', '따뜻', '부드럽', '거칠'],
  taste: ['맛', '달', '쓴', '짠', '먹다', '마시다'],
};

/**
 * Scene type keywords for exemplar matching
 */
const SCENE_TYPE_KEYWORDS: Record<string, string[]> = {
  'dialogue-heavy': ['대화', '말하다', '대답', '묻다', '이야기'],
  'action-sequence': ['달리다', '싸우다', '뛰다', '도망', '추격', '공격'],
  'emotional-climax': ['눈물', '울다', '분노', '기쁨', '슬픔', '감정'],
  'introspection': ['생각', '고민', '회상', '기억', '마음'],
  'tension-building': ['긴장', '불안', '두려움', '숨다', '조심'],
  'romantic': ['사랑', '설레다', '두근', '키스', '포옹'],
  'revelation': ['진실', '비밀', '발견', '알게', '드러나다'],
};

/**
 * Detect sensory anchors from scene content
 */
function detectSensoryAnchors(scene: Scene, location: string): string[] {
  const content = `${scene.purpose} ${scene.beat || ''} ${scene.conflict || ''} ${location}`.toLowerCase();
  const anchors: string[] = [];

  // Check each sensory type
  for (const [sense, keywords] of Object.entries(SENSORY_KEYWORDS)) {
    if (keywords.some((kw) => content.includes(kw))) {
      anchors.push(sense);
    }
  }

  // Ensure at least 2 anchors with sensible defaults
  if (anchors.length === 0) {
    anchors.push('sight', 'sound'); // Most common defaults
  } else if (anchors.length === 1) {
    // Add complementary sense
    if (!anchors.includes('sight')) {
      anchors.push('sight');
    } else {
      anchors.push('sound');
    }
  }

  return anchors.slice(0, 3); // Max 3 sensory anchors
}

/**
 * Detect exemplar tags from scene content
 */
function detectExemplarTags(scene: Scene): string[] {
  const content = `${scene.purpose} ${scene.beat || ''} ${scene.conflict || ''}`.toLowerCase();
  const tags: string[] = [];

  for (const [tag, keywords] of Object.entries(SCENE_TYPE_KEYWORDS)) {
    if (keywords.some((kw) => content.includes(kw))) {
      tags.push(tag);
    }
  }

  return tags;
}

// ============================================================================
// Emotional Arc Derivation
// ============================================================================

/**
 * Emotion keywords for arc detection
 */
const EMOTION_KEYWORDS: Record<string, string[]> = {
  joy: ['기쁨', '행복', '즐거', '웃다', '환호'],
  sadness: ['슬픔', '우울', '눈물', '울다', '비탄'],
  anger: ['분노', '화나다', '격분', '짜증'],
  fear: ['두려움', '공포', '불안', '무서'],
  surprise: ['놀라', '충격', '경악', '당황'],
  anticipation: ['기대', '설레', '긴장', '초조'],
  trust: ['믿음', '신뢰', '안심', '편안'],
  disgust: ['혐오', '역겨', '거부감'],
  neutral: ['평온', '차분', '무심'],
};

/**
 * Derive emotion from text content
 */
function deriveEmotion(content: string, defaultEmotion: string = 'neutral'): string {
  const lowerContent = content.toLowerCase();

  for (const [emotion, keywords] of Object.entries(EMOTION_KEYWORDS)) {
    if (keywords.some((kw) => lowerContent.includes(kw))) {
      return emotion;
    }
  }

  return defaultEmotion;
}

/**
 * Calculate tension target based on scene content and position
 */
function calculateTensionTarget(
  scene: Scene,
  sceneIndex: number,
  totalScenes: number,
  chapterPacing: string
): number {
  let baseTension = 5; // Default medium tension

  // Adjust based on chapter pacing
  if (chapterPacing === 'fast') baseTension = 6;
  if (chapterPacing === 'slow') baseTension = 4;

  // Scene position affects tension (rising toward end)
  const positionMultiplier = 0.5 + (sceneIndex / totalScenes) * 0.5;

  // Conflict keywords increase tension
  const conflictContent = `${scene.conflict || ''} ${scene.beat || ''}`.toLowerCase();
  const tensionKeywords = ['위기', '갈등', '충돌', '위험', '긴박', '절체절명'];
  const hasTension = tensionKeywords.some((kw) => conflictContent.includes(kw));

  if (hasTension) baseTension += 2;

  // Calculate final tension and clamp to 1-10
  const tension = Math.round(baseTension * positionMultiplier);
  return Math.max(1, Math.min(10, tension));
}

/**
 * Derive emotional arc for a scene
 */
function deriveEmotionalArc(
  scene: Scene,
  previousExitEmotion: string | null,
  sceneIndex: number,
  totalScenes: number,
  chapterPacing: string
): EmotionalArc {
  const content = `${scene.purpose} ${scene.beat || ''} ${scene.conflict || ''}`;

  // Entry emotion chains from previous scene's exit
  const entry_emotion = previousExitEmotion || 'neutral';

  // Exit emotion derived from scene content
  const exit_emotion = deriveEmotion(content, 'neutral');

  // Peak moment from conflict or beat
  const peak_moment = scene.conflict || scene.beat || 'Scene climax';

  // Tension target calculated from multiple factors
  const tension_target = calculateTensionTarget(scene, sceneIndex, totalScenes, chapterPacing);

  return {
    entry_emotion,
    exit_emotion,
    peak_moment,
    tension_target,
  };
}

// ============================================================================
// Foreshadowing Mapping
// ============================================================================

/**
 * Map chapter foreshadowing to specific scenes based on content matching
 */
function mapForeshadowingToScene(
  scene: Scene,
  plantIds: string[],
  payoffIds: string[]
): SceneForeshadowing {
  // In production, this would match foreshadowing content to scene content
  // For now, distribute evenly across scenes with simple heuristics
  const foreshadowing: SceneForeshadowing = {
    plant: [],
    payoff: [],
    hint: [],
  };

  // Simple heuristic: first scene gets plants, last scene gets payoffs
  // Middle scenes get hints
  const sceneContent = `${scene.purpose} ${scene.beat || ''} ${scene.conflict || ''}`.toLowerCase();

  // Check if scene content suggests planting (beginning, setup)
  const plantKeywords = ['시작', '처음', '소개', '등장', '도착'];
  if (plantKeywords.some((kw) => sceneContent.includes(kw))) {
    foreshadowing.plant = plantIds.slice(0, 1); // Take first plant if available
  }

  // Check if scene content suggests payoff (climax, reveal)
  const payoffKeywords = ['진실', '드러나다', '밝혀지다', '발견', '알게'];
  if (payoffKeywords.some((kw) => sceneContent.includes(kw))) {
    foreshadowing.payoff = payoffIds.slice(0, 1); // Take first payoff if available
  }

  return foreshadowing;
}

// ============================================================================
// Transition Generation
// ============================================================================

/**
 * Generate transition directives for a scene
 */
function generateTransition(
  sceneIndex: number,
  totalScenes: number,
  currentArc: EmotionalArc,
  nextArc: EmotionalArc | null
): SceneTransition {
  // First scene
  if (sceneIndex === 0) {
    return {
      from_previous: 'chapter opening',
      to_next: nextArc
        ? `emotional shift: ${currentArc.exit_emotion} to ${nextArc.entry_emotion}`
        : 'chapter ending hook',
    };
  }

  // Last scene
  if (sceneIndex === totalScenes - 1) {
    return {
      from_previous: `continuation from ${currentArc.entry_emotion}`,
      to_next: 'chapter ending hook',
    };
  }

  // Middle scenes
  return {
    from_previous: `continuation from ${currentArc.entry_emotion}`,
    to_next: nextArc
      ? `emotional shift: ${currentArc.exit_emotion} to ${nextArc.entry_emotion}`
      : 'scene resolution',
  };
}

// ============================================================================
// Scene Merging and Splitting
// ============================================================================

/**
 * Estimate character count from word count (Korean: ~2 chars/word)
 */
function estimateChars(words: number | undefined): number {
  return (words || 500) * 2;
}

/**
 * Check if scenes should be merged based on size
 */
function shouldMerge(scene: Scene, config: DecompositionConfig): boolean {
  const chars = estimateChars(scene.estimated_words);
  return chars < config.merge_threshold;
}

/**
 * Merge two adjacent scenes
 */
function mergeScenes(scene1: SceneV5, scene2: SceneV5): SceneV5 {
  return {
    scene_number: scene1.scene_number,
    purpose: `${scene1.purpose} / ${scene2.purpose}`,
    characters: [...new Set([...scene1.characters, ...scene2.characters])],
    location: scene1.location, // Keep first scene's location
    conflict: scene1.conflict || scene2.conflict,
    beat: `${scene1.beat || ''} ${scene2.beat || ''}`.trim(),
    emotional_tone: scene1.emotional_tone || scene2.emotional_tone,
    estimated_words: (scene1.estimated_words || 0) + (scene2.estimated_words || 0),
    pov_character: scene1.pov_character,
    sensory_anchors: [...new Set([...scene1.sensory_anchors, ...scene2.sensory_anchors])].slice(
      0,
      3
    ),
    emotional_arc: {
      entry_emotion: scene1.emotional_arc.entry_emotion,
      exit_emotion: scene2.emotional_arc.exit_emotion,
      peak_moment: scene1.emotional_arc.peak_moment || scene2.emotional_arc.peak_moment,
      tension_target: Math.max(
        scene1.emotional_arc.tension_target,
        scene2.emotional_arc.tension_target
      ),
    },
    dialogue_goals: [...(scene1.dialogue_goals || []), ...(scene2.dialogue_goals || [])],
    foreshadowing: {
      plant: [...scene1.foreshadowing.plant, ...scene2.foreshadowing.plant],
      payoff: [...scene1.foreshadowing.payoff, ...scene2.foreshadowing.payoff],
      hint: [...scene1.foreshadowing.hint, ...scene2.foreshadowing.hint],
    },
    transition: {
      from_previous: scene1.transition.from_previous,
      to_next: scene2.transition.to_next,
    },
    exemplar_tags: [...new Set([...(scene1.exemplar_tags || []), ...(scene2.exemplar_tags || [])])],
  };
}

/**
 * Renumber scenes sequentially starting from 1
 */
function renumberScenes(scenes: SceneV5[]): SceneV5[] {
  return scenes.map((scene, index) => ({
    ...scene,
    scene_number: index + 1,
  }));
}

// ============================================================================
// Main Decomposition Function
// ============================================================================

/**
 * Decompose a chapter into enriched SceneV5 objects
 *
 * This function enriches existing chapter scenes with V5 fields using heuristics:
 * - POV assignment from chapter metadata
 * - Sensory anchors detected from scene content
 * - Emotional arc with continuity across scenes
 * - Foreshadowing mapping from chapter narrative elements
 * - Transitions linking scenes together
 *
 * @param chapter - Chapter metadata with existing scenes
 * @param config - Optional decomposition configuration
 * @returns DecompositionResult with enriched scenes and warnings
 */
export function decomposeChapter(
  chapter: ChapterMeta,
  config?: Partial<DecompositionConfig>
): DecompositionResult {
  const fullConfig: DecompositionConfig = {
    ...DEFAULT_DECOMPOSITION_CONFIG,
    ...config,
  };

  const warnings: string[] = [];

  // Handle empty scenes array
  if (!chapter.scenes || chapter.scenes.length === 0) {
    warnings.push('Chapter has no scenes defined');
    return {
      scenes: [],
      warnings,
      original_beat_count: 0,
    };
  }

  const originalBeatCount = chapter.scenes.length;

  // Get chapter-level information
  const chapterPov = chapter.meta.pov_character;
  const chapterPacing = chapter.style_guide?.pacing || 'medium';
  const plantIds = chapter.narrative_elements?.foreshadowing_plant || [];
  const payoffIds = chapter.narrative_elements?.foreshadowing_payoff || [];

  // First pass: Enrich all scenes with V5 fields
  let previousExitEmotion: string | null = null;
  const enrichedScenes: SceneV5[] = chapter.scenes.map((scene, index) => {
    // Derive emotional arc
    const emotional_arc = deriveEmotionalArc(
      scene,
      previousExitEmotion,
      index,
      chapter.scenes.length,
      chapterPacing
    );
    previousExitEmotion = emotional_arc.exit_emotion;

    // Create enriched scene
    const enriched: SceneV5 = {
      ...scene,
      pov_character: chapterPov,
      sensory_anchors: detectSensoryAnchors(scene, scene.location),
      emotional_arc,
      foreshadowing: mapForeshadowingToScene(scene, plantIds, payoffIds),
      transition: { from_previous: '', to_next: '' }, // Will be set in second pass
      exemplar_tags: detectExemplarTags(scene),
    };

    return enriched;
  });

  // Second pass: Set transitions (needs next scene's arc)
  for (let i = 0; i < enrichedScenes.length; i++) {
    const nextArc = i < enrichedScenes.length - 1 ? enrichedScenes[i + 1].emotional_arc : null;
    enrichedScenes[i].transition = generateTransition(
      i,
      enrichedScenes.length,
      enrichedScenes[i].emotional_arc,
      nextArc
    );
  }

  // Third pass: Merge small scenes
  let scenes = [...enrichedScenes];
  let merged = true;
  while (merged && scenes.length > 1) {
    merged = false;
    for (let i = 0; i < scenes.length - 1; i++) {
      if (shouldMerge(scenes[i], fullConfig) || shouldMerge(scenes[i + 1], fullConfig)) {
        // Check if either scene is too small
        const chars1 = estimateChars(scenes[i].estimated_words);
        const chars2 = estimateChars(scenes[i + 1].estimated_words);

        if (chars1 < fullConfig.min_scene_chars || chars2 < fullConfig.min_scene_chars) {
          warnings.push(
            `Merged scenes ${scenes[i].scene_number} and ${scenes[i + 1].scene_number} (under ${fullConfig.min_scene_chars} chars)`
          );
          scenes = [
            ...scenes.slice(0, i),
            mergeScenes(scenes[i], scenes[i + 1]),
            ...scenes.slice(i + 2),
          ];
          merged = true;
          break;
        }
      }
    }
  }

  // Fourth pass: Cap at max scenes
  while (scenes.length > fullConfig.max_scenes) {
    // Find the two smallest adjacent scenes and merge them
    let minSize = Infinity;
    let mergeIndex = 0;

    for (let i = 0; i < scenes.length - 1; i++) {
      const combinedSize =
        estimateChars(scenes[i].estimated_words) + estimateChars(scenes[i + 1].estimated_words);
      if (combinedSize < minSize) {
        minSize = combinedSize;
        mergeIndex = i;
      }
    }

    warnings.push(
      `Merged scenes ${scenes[mergeIndex].scene_number} and ${scenes[mergeIndex + 1].scene_number} to stay under max_scenes (${fullConfig.max_scenes})`
    );
    scenes = [
      ...scenes.slice(0, mergeIndex),
      mergeScenes(scenes[mergeIndex], scenes[mergeIndex + 1]),
      ...scenes.slice(mergeIndex + 2),
    ];
  }

  // Final pass: Renumber scenes
  scenes = renumberScenes(scenes);

  // Update transitions after potential merges
  for (let i = 0; i < scenes.length; i++) {
    const nextArc = i < scenes.length - 1 ? scenes[i + 1].emotional_arc : null;
    scenes[i].transition = generateTransition(i, scenes.length, scenes[i].emotional_arc, nextArc);
  }

  return {
    scenes,
    warnings,
    original_beat_count: originalBeatCount,
  };
}
