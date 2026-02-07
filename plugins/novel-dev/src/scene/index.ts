/**
 * Scene Module
 *
 * Exports scene data model types, chapter decomposition, and validation.
 */

// Types
export type {
  EmotionalArc,
  SceneForeshadowing,
  SceneTransition,
  SceneStyleOverride,
  SceneV5,
  DecompositionConfig,
  DecompositionResult,
  ValidationResult,
} from './types.js';

export { DEFAULT_DECOMPOSITION_CONFIG } from './types.js';

// Functions
export { decomposeChapter } from './decomposer.js';
export { validateScenes } from './validator.js';
