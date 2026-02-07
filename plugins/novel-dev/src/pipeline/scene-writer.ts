/**
 * Scene Writer Orchestration Module
 *
 * Handles scene-by-scene draft preparation with fresh exemplar injection.
 * This module prepares the context and exemplars for each scene but does NOT
 * call the LLM directly - that is handled by the orchestrator.
 *
 * Key features:
 * - Fresh exemplar injection per scene (2-3 good + 0-1 anti)
 * - Context assembly using Phase 1 tiered context system
 * - Scene-specific style matching based on scene type and tags
 */

import type { SceneV5 } from '../scene/types.js';
import type { SceneType, ExemplarResult, StyleLibrary, ExemplarQuery } from '../style-library/types.js';
import type { ContextItem, TieredContextBundle, ItemMetadata } from '../context/types.js';
import { queryExemplars } from '../style-library/index.js';
import { assembleTieredContext } from '../context/index.js';
import type {
  SceneWriterConfig,
  SceneDraftResult,
} from './types.js';
import { DEFAULT_SCENE_WRITER_CONFIG } from './types.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Prepared context for a scene draft
 */
export interface SceneDraftContext {
  /** Scene number (1-indexed) */
  sceneNumber: number;
  /** The scene being drafted */
  scene: SceneV5;
  /** Matched exemplars for style guidance */
  exemplars: ExemplarResult;
  /** Tiered context bundle (hot/warm/cold) */
  contextBundle: TieredContextBundle;
  /** Target length range */
  targetLength: { min: number; max: number };
  /** Previous scene's ending text for continuity (if available) */
  previousEnding?: string;
  /** Whether chain-of-thought is enabled */
  chainOfThoughtEnabled: boolean;
}

/**
 * Prepared contexts for all scenes in a chapter
 */
export interface ChapterSceneContexts {
  /** Chapter number */
  chapterNumber: number;
  /** Prepared context for each scene */
  sceneContexts: SceneDraftContext[];
  /** Total estimated tokens across all scenes */
  totalEstimatedTokens: number;
}

// ============================================================================
// Scene Type Mapping
// ============================================================================

/**
 * Maps scene tags to style library scene types for exemplar matching.
 *
 * SceneV5 uses freeform tags like "tension", "revelation", "confrontation"
 * while style library uses fixed SceneType enum. This function maps
 * common patterns.
 */
export function mapSceneTypeFromTags(
  tags: string[] | undefined,
  scenePurpose: string
): SceneType {
  const lowerTags = (tags || []).map(t => t.toLowerCase());
  const lowerPurpose = scenePurpose.toLowerCase();

  // Check for specific scene type indicators
  if (lowerTags.includes('opening') || lowerPurpose.includes('opening') || lowerPurpose.includes('hook')) {
    return 'opening-hook';
  }
  if (lowerTags.includes('dialogue') || lowerPurpose.includes('dialogue') || lowerPurpose.includes('conversation')) {
    return 'dialogue';
  }
  if (lowerTags.includes('action') || lowerPurpose.includes('action') || lowerPurpose.includes('fight') || lowerPurpose.includes('chase')) {
    return 'action';
  }
  if (lowerTags.includes('emotional') || lowerPurpose.includes('emotional') || lowerTags.includes('revelation')) {
    return 'emotional-peak';
  }
  if (lowerTags.includes('climax') || lowerPurpose.includes('climax') || lowerPurpose.includes('confrontation')) {
    return 'climax';
  }
  if (lowerTags.includes('ending') || lowerPurpose.includes('resolution') || lowerPurpose.includes('denouement')) {
    return 'denouement';
  }
  if (lowerTags.includes('description') || lowerPurpose.includes('description') || lowerPurpose.includes('setting')) {
    return 'description';
  }

  // Default to transition for scene-linking purposes
  return 'transition';
}

// ============================================================================
// Exemplar Query Building
// ============================================================================

/**
 * Builds an exemplar query from scene data
 */
export function buildExemplarQuery(
  scene: SceneV5,
  genre: string,
  config: SceneWriterConfig
): ExemplarQuery {
  // Map scene to style library scene type
  const sceneType = mapSceneTypeFromTags(scene.exemplar_tags, scene.purpose);

  // Extract emotional tone from scene's emotional arc
  const emotionalTone = scene.emotional_arc?.peak_moment?.toLowerCase();

  // Get pacing from style override or default
  const pacing = scene.style_override?.pacing;

  return {
    genre,
    scene_type: sceneType,
    emotional_tone: emotionalTone,
    pacing,
    limit: config.maxExemplarsPerScene - (config.includeAntiExemplar ? 1 : 0),
    include_anti: config.includeAntiExemplar,
  };
}

// ============================================================================
// Context Building
// ============================================================================

/**
 * Builds context items for a specific scene
 *
 * Creates ContextItems from scene data for tiered assembly.
 * Scene-specific items get 'hot' tier assignment in assembleTieredContext.
 */
export function buildSceneContextItems(
  scene: SceneV5,
  sceneNumber: number,
  exemplars: ExemplarResult
): ContextItem[] {
  const items: ContextItem[] = [];

  // Scene plan as hot tier item
  items.push({
    id: `scene_plan_${sceneNumber}`,
    type: 'scene_plan',
    path: `virtual://scene_plan/${sceneNumber}`,
    content: JSON.stringify({
      purpose: scene.purpose,
      characters: scene.characters,
      location: scene.location,
      emotional_arc: scene.emotional_arc,
      sensory_anchors: scene.sensory_anchors,
      dialogue_goals: scene.dialogue_goals,
      foreshadowing: scene.foreshadowing,
      transition: scene.transition,
    }),
    estimatedTokens: 300, // Approximate for scene plan
    priority: 10, // Scene plan has highest priority
    required: true, // Scene plan is always required
  });

  // Add exemplars as hot tier items
  for (const exemplar of exemplars.exemplars) {
    items.push({
      id: exemplar.id,
      type: 'exemplar',
      path: `virtual://exemplar/${exemplar.id}`,
      content: exemplar.content,
      estimatedTokens: Math.ceil(exemplar.content.length / 2), // ~2 chars per Korean token
      priority: 9, // Exemplars have high priority
      required: false, // Exemplars can be dropped under pressure
    });
  }

  // Add anti-exemplar if present
  if (exemplars.anti_exemplar) {
    items.push({
      id: exemplars.anti_exemplar.id,
      type: 'exemplar',
      path: `virtual://exemplar/${exemplars.anti_exemplar.id}`,
      content: `[ANTI-EXEMPLAR - DO NOT WRITE LIKE THIS]\n${exemplars.anti_exemplar.content}`,
      estimatedTokens: Math.ceil(exemplars.anti_exemplar.content.length / 2) + 20,
      priority: 8, // Anti-exemplars slightly lower priority than good exemplars
      required: false,
    });
  }

  return items;
}

// ============================================================================
// Ending Extraction
// ============================================================================

/**
 * Extracts the ending portion of a scene for continuity tracking
 *
 * Returns the last ~200 characters or last paragraph, whichever is shorter.
 * Used to pass to the next scene for smooth transitions.
 */
export function extractEnding(content: string): string {
  if (!content) return '';

  // Split into paragraphs
  const paragraphs = content.split(/\n\n+/).filter(p => p.trim());

  if (paragraphs.length === 0) return '';

  // Get last paragraph
  const lastParagraph = paragraphs[paragraphs.length - 1].trim();

  // Return up to 200 chars from the end
  if (lastParagraph.length <= 200) {
    return lastParagraph;
  }

  // Find a good break point near 200 chars
  const cutPoint = lastParagraph.lastIndexOf('.', 200);
  if (cutPoint > 100) {
    return lastParagraph.slice(cutPoint + 1).trim();
  }

  return lastParagraph.slice(-200);
}

// ============================================================================
// Main Functions
// ============================================================================

/**
 * Prepares context for drafting a single scene
 *
 * This function:
 * 1. Queries the style library for matching exemplars
 * 2. Builds scene-specific context items
 * 3. Assembles tiered context with the provided base items
 * 4. Returns prepared context ready for LLM drafting
 *
 * @param scene - The scene to prepare for drafting
 * @param sceneNumber - Scene number (1-indexed)
 * @param library - Style library for exemplar queries
 * @param baseContextItems - Base context items (characters, plot, etc.)
 * @param metadata - Metadata for context assembly
 * @param config - Scene writer configuration
 * @param previousEnding - Ending text from previous scene (optional)
 * @returns Prepared context for the scene
 */
export function prepareSceneDraft(
  scene: SceneV5,
  sceneNumber: number,
  library: StyleLibrary,
  baseContextItems: ContextItem[],
  metadata: ItemMetadata,
  config: SceneWriterConfig = DEFAULT_SCENE_WRITER_CONFIG,
  previousEnding?: string
): SceneDraftContext {
  // Build exemplar query from scene data
  // Genre should be passed via metadata's extensible [key: string] field
  const genre = (metadata.genre as string) || 'general';
  const query = buildExemplarQuery(scene, genre, config);

  // Query style library for matching exemplars
  const exemplars = queryExemplars(library, query);

  // Build scene-specific context items
  const sceneItems = buildSceneContextItems(scene, sceneNumber, exemplars);

  // Merge with base context items
  const allItems = [...baseContextItems, ...sceneItems];

  // Assemble tiered context
  const contextBundle = assembleTieredContext(allItems, {
    ...metadata,
    // Mark scene characters as appearing in current scene
    appearsInCurrentScene: true,
  });

  return {
    sceneNumber,
    scene,
    exemplars,
    contextBundle,
    targetLength: config.targetSceneLength,
    previousEnding,
    chainOfThoughtEnabled: config.chainOfThoughtEnabled,
  };
}

/**
 * Prepares contexts for all scenes in a chapter
 *
 * This function prepares draft contexts for all scenes sequentially,
 * tracking the estimated ending of each scene for continuity.
 *
 * Note: This does NOT actually draft the scenes - it prepares the context
 * that will be used by the LLM orchestrator to draft each scene.
 *
 * @param scenes - Array of SceneV5 objects for the chapter
 * @param chapterNumber - Chapter number
 * @param library - Style library for exemplar queries
 * @param baseContextItems - Base context items (characters, plot, etc.)
 * @param metadata - Metadata for context assembly
 * @param config - Scene writer configuration
 * @returns Prepared contexts for all scenes
 */
export function prepareChapterScenes(
  scenes: SceneV5[],
  chapterNumber: number,
  library: StyleLibrary,
  baseContextItems: ContextItem[],
  metadata: ItemMetadata,
  config: SceneWriterConfig = DEFAULT_SCENE_WRITER_CONFIG
): ChapterSceneContexts {
  const sceneContexts: SceneDraftContext[] = [];
  let totalEstimatedTokens = 0;
  let previousEnding: string | undefined;

  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];
    const sceneNumber = i + 1;

    // Prepare context for this scene
    const context = prepareSceneDraft(
      scene,
      sceneNumber,
      library,
      baseContextItems,
      {
        ...metadata,
        currentChapter: chapterNumber,
      },
      config,
      previousEnding
    );

    sceneContexts.push(context);

    // Estimate tokens for this scene's context
    totalEstimatedTokens += context.contextBundle.totalTokens;

    // For subsequent scenes, we would extract ending from drafted content
    // Since we're only preparing, we leave previousEnding undefined after first
    // The actual orchestrator will track this during drafting
    previousEnding = undefined;
  }

  return {
    chapterNumber,
    sceneContexts,
    totalEstimatedTokens,
  };
}

/**
 * Creates a scene draft result from content
 *
 * Utility function to create a SceneDraftResult from drafted content.
 * Used by the orchestrator after LLM drafting completes.
 *
 * @param sceneNumber - Scene number (1-indexed)
 * @param content - Drafted prose content
 * @param exemplarsUsed - IDs of exemplars used
 * @param preWritingThoughts - Optional chain-of-thought output
 * @returns Scene draft result
 */
export function createSceneDraftResult(
  sceneNumber: number,
  content: string,
  exemplarsUsed: string[],
  preWritingThoughts?: string
): SceneDraftResult {
  // Estimate tokens: ~2 chars per Korean token
  const estimatedTokens = Math.ceil(content.length / 2);

  return {
    sceneNumber,
    content,
    estimatedTokens,
    exemplarsUsed,
    preWritingThoughts,
  };
}
