/**
 * Scene Validation
 *
 * Validates SceneV5 arrays against constraints:
 * - Sequential scene numbering
 * - Sensory anchor minimums
 * - Tension target ranges
 * - Foreshadowing ID patterns
 * - Scene count limits
 * - Transition completeness
 */

import { SceneV5, ValidationResult } from './types.js';

// ============================================================================
// Validation Constants
// ============================================================================

const MIN_SENSORY_ANCHORS = 2;
const MAX_SENSORY_ANCHORS = 5;
const MIN_TENSION = 1;
const MAX_TENSION = 10;
const MIN_SCENES = 1;
const MAX_SCENES = 6;
const FORESHADOWING_ID_PATTERN = /^fore_[a-z0-9_]+$/;

// ============================================================================
// Individual Validators
// ============================================================================

/**
 * Validate scene numbering is sequential starting from 1
 */
function validateSceneNumbers(scenes: SceneV5[]): string[] {
  const errors: string[] = [];

  for (let i = 0; i < scenes.length; i++) {
    const expected = i + 1;
    if (scenes[i].scene_number !== expected) {
      errors.push(
        `Scene number mismatch: expected ${expected}, found ${scenes[i].scene_number} at position ${i}`
      );
    }
  }

  // Check for duplicates
  const numbers = scenes.map((s) => s.scene_number);
  const duplicates = numbers.filter((n, i) => numbers.indexOf(n) !== i);
  if (duplicates.length > 0) {
    errors.push(`Duplicate scene numbers found: ${[...new Set(duplicates)].join(', ')}`);
  }

  return errors;
}

/**
 * Validate sensory anchors have minimum required count
 */
function validateSensoryAnchors(scenes: SceneV5[]): string[] {
  const errors: string[] = [];

  for (const scene of scenes) {
    if (!scene.sensory_anchors || scene.sensory_anchors.length < MIN_SENSORY_ANCHORS) {
      errors.push(
        `Scene ${scene.scene_number}: requires at least ${MIN_SENSORY_ANCHORS} sensory anchors, found ${scene.sensory_anchors?.length || 0}`
      );
    }
    if (scene.sensory_anchors && scene.sensory_anchors.length > MAX_SENSORY_ANCHORS) {
      errors.push(
        `Scene ${scene.scene_number}: has ${scene.sensory_anchors.length} sensory anchors, maximum is ${MAX_SENSORY_ANCHORS}`
      );
    }
  }

  return errors;
}

/**
 * Validate emotional arc tension targets are within range
 */
function validateTensionTargets(scenes: SceneV5[]): string[] {
  const errors: string[] = [];

  for (const scene of scenes) {
    if (!scene.emotional_arc) {
      errors.push(`Scene ${scene.scene_number}: missing emotional_arc`);
      continue;
    }

    const tension = scene.emotional_arc.tension_target;
    if (tension < MIN_TENSION || tension > MAX_TENSION) {
      errors.push(
        `Scene ${scene.scene_number}: tension_target ${tension} is outside valid range (${MIN_TENSION}-${MAX_TENSION})`
      );
    }
  }

  return errors;
}

/**
 * Validate foreshadowing IDs follow the expected pattern
 */
function validateForeshadowingIds(scenes: SceneV5[]): string[] {
  const errors: string[] = [];

  for (const scene of scenes) {
    if (!scene.foreshadowing) continue;

    const allIds = [
      ...(scene.foreshadowing.plant || []),
      ...(scene.foreshadowing.payoff || []),
      ...(scene.foreshadowing.hint || []),
    ];

    for (const id of allIds) {
      if (!FORESHADOWING_ID_PATTERN.test(id)) {
        errors.push(
          `Scene ${scene.scene_number}: invalid foreshadowing ID format '${id}' (expected fore_xxx pattern)`
        );
      }
    }
  }

  return errors;
}

/**
 * Validate scene count is within limits
 */
function validateSceneCount(scenes: SceneV5[]): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (scenes.length < MIN_SCENES) {
    errors.push(`Scene count ${scenes.length} is below minimum (${MIN_SCENES})`);
  }

  if (scenes.length > MAX_SCENES) {
    warnings.push(`Scene count ${scenes.length} exceeds recommended maximum (${MAX_SCENES})`);
  }

  return { errors, warnings };
}

/**
 * Validate transitions are properly defined
 */
function validateTransitions(scenes: SceneV5[]): string[] {
  const errors: string[] = [];

  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];

    if (!scene.transition) {
      errors.push(`Scene ${scene.scene_number}: missing transition object`);
      continue;
    }

    // All scenes after the first need from_previous
    if (i > 0 && !scene.transition.from_previous) {
      errors.push(`Scene ${scene.scene_number}: missing transition.from_previous`);
    }

    // All scenes except the last need to_next
    if (i < scenes.length - 1 && !scene.transition.to_next) {
      errors.push(`Scene ${scene.scene_number}: missing transition.to_next`);
    }
  }

  return errors;
}

/**
 * Validate emotional arc continuity (exit matches next entry)
 */
function validateEmotionalContinuity(scenes: SceneV5[]): string[] {
  const warnings: string[] = [];

  for (let i = 0; i < scenes.length - 1; i++) {
    const currentExit = scenes[i].emotional_arc?.exit_emotion;
    const nextEntry = scenes[i + 1].emotional_arc?.entry_emotion;

    if (currentExit && nextEntry && currentExit !== nextEntry) {
      warnings.push(
        `Emotional discontinuity between scenes ${scenes[i].scene_number} and ${scenes[i + 1].scene_number}: ` +
          `exit '${currentExit}' does not match entry '${nextEntry}'`
      );
    }
  }

  return warnings;
}

/**
 * Validate POV character is set for all scenes
 */
function validatePovCharacter(scenes: SceneV5[]): string[] {
  const errors: string[] = [];

  for (const scene of scenes) {
    if (!scene.pov_character) {
      errors.push(`Scene ${scene.scene_number}: missing pov_character`);
    }
  }

  return errors;
}

// ============================================================================
// Main Validation Function
// ============================================================================

/**
 * Validate an array of SceneV5 objects
 *
 * Checks:
 * - scene_number is sequential starting from 1
 * - sensory_anchors has at least 2 items per scene
 * - emotional_arc.tension_target is 1-10
 * - foreshadowing IDs follow fore_XXX pattern
 * - No duplicate scene_numbers
 * - Total scenes between 1 and 6
 * - transition.from_previous exists for scenes > 1
 * - transition.to_next exists for scenes < last
 *
 * @param scenes - Array of SceneV5 objects to validate
 * @returns ValidationResult with valid flag, errors, and warnings
 */
export function validateScenes(scenes: SceneV5[]): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Handle empty array
  if (!scenes || scenes.length === 0) {
    return {
      valid: false,
      errors: ['No scenes provided for validation'],
      warnings: [],
    };
  }

  // Run all validators
  errors.push(...validateSceneNumbers(scenes));
  errors.push(...validateSensoryAnchors(scenes));
  errors.push(...validateTensionTargets(scenes));
  errors.push(...validateForeshadowingIds(scenes));
  errors.push(...validateTransitions(scenes));
  errors.push(...validatePovCharacter(scenes));

  const countResult = validateSceneCount(scenes);
  errors.push(...countResult.errors);
  warnings.push(...countResult.warnings);

  // Emotional continuity is a warning, not an error
  warnings.push(...validateEmotionalContinuity(scenes));

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
