/**
 * Scene Assembler Module
 *
 * Combines multiple scene drafts into a cohesive chapter with
 * transition gap detection and assembly validation.
 *
 * Key features:
 * - Detects temporal, spatial, and emotional transition gaps
 * - Assembles scenes with configurable scene breaks
 * - Validates assembly quality and length
 */

import type { SceneV5 } from '../scene/types.js';
import type {
  SceneDraftResult,
  TransitionGap,
  TransitionGapType,
  TransitionSeverity,
  AssemblyResult,
} from './types.js';

// ============================================================================
// Constants
// ============================================================================

/** Scene break marker for assembled content */
const SCENE_BREAK = '\n\n* * *\n\n';

/** Minimum expected chapter length (characters) */
const MIN_CHAPTER_LENGTH = 2000;

/** Maximum expected chapter length (characters) */
const MAX_CHAPTER_LENGTH = 10000;

// ============================================================================
// Transition Gap Detection
// ============================================================================

/**
 * Detects transition gaps between adjacent scenes
 *
 * Analyzes scene metadata to identify potential discontinuities:
 * - Temporal: Time jumps without clear indication
 * - Spatial: Location changes without transition
 * - Emotional: Abrupt emotional tone shifts
 *
 * @param scenes - Array of SceneV5 objects (enriched scene data)
 * @param drafts - Array of scene drafts (may be empty for pre-draft analysis)
 * @returns Array of detected transition gaps
 */
export function detectTransitionGaps(
  scenes: SceneV5[],
  drafts: SceneDraftResult[] = []
): TransitionGap[] {
  const gaps: TransitionGap[] = [];

  for (let i = 0; i < scenes.length - 1; i++) {
    const currentScene = scenes[i];
    const nextScene = scenes[i + 1];
    const fromScene = i + 1;
    const toScene = i + 2;

    // Check for spatial gap (location change)
    const spatialGap = detectSpatialGap(currentScene, nextScene);
    if (spatialGap) {
      gaps.push({
        fromScene,
        toScene,
        gapType: 'spatial',
        severity: spatialGap.severity,
        suggestedBridge: spatialGap.suggestion,
      });
    }

    // Check for temporal gap (time jump)
    const temporalGap = detectTemporalGap(currentScene, nextScene);
    if (temporalGap) {
      gaps.push({
        fromScene,
        toScene,
        gapType: 'temporal',
        severity: temporalGap.severity,
        suggestedBridge: temporalGap.suggestion,
      });
    }

    // Check for emotional gap (abrupt tone shift)
    const emotionalGap = detectEmotionalGap(currentScene, nextScene);
    if (emotionalGap) {
      gaps.push({
        fromScene,
        toScene,
        gapType: 'emotional',
        severity: emotionalGap.severity,
        suggestedBridge: emotionalGap.suggestion,
      });
    }
  }

  return gaps;
}

/**
 * Detects spatial (location) gaps between scenes
 */
function detectSpatialGap(
  current: SceneV5,
  next: SceneV5
): { severity: TransitionSeverity; suggestion?: string } | null {
  // No gap if same location
  if (current.location === next.location) {
    return null;
  }

  // Check if transition metadata indicates movement
  const hasTransitionInfo = next.transition?.from_previous;
  if (hasTransitionInfo && hasTransitionInfo.toLowerCase().includes('move')) {
    // Transition is documented
    return { severity: 'minor', suggestion: undefined };
  }

  // Location change without explicit transition
  return {
    severity: 'moderate',
    suggestion: `Scene moves from ${current.location} to ${next.location}. Consider adding transition.`,
  };
}

/**
 * Detects temporal (time) gaps between scenes
 */
function detectTemporalGap(
  current: SceneV5,
  next: SceneV5
): { severity: TransitionSeverity; suggestion?: string } | null {
  // Check transition metadata for time indicators
  const transitionText = next.transition?.from_previous?.toLowerCase() || '';

  // Time jump indicators
  const timeJumpIndicators = [
    'later', 'next', 'following', 'hours', 'days', 'weeks',
    '후', '뒤', '다음', '이튿날', '며칠'
  ];

  const hasTimeJump = timeJumpIndicators.some(indicator =>
    transitionText.includes(indicator)
  );

  if (hasTimeJump) {
    // Time jump is documented in transition
    return { severity: 'minor', suggestion: undefined };
  }

  // If scenes have different emotional arcs exit/entry, might indicate time passage
  if (current.emotional_arc && next.emotional_arc) {
    const exitEmotion = current.emotional_arc.exit_emotion?.toLowerCase();
    const entryEmotion = next.emotional_arc.entry_emotion?.toLowerCase();

    // Dramatic emotional shift without documented transition
    if (exitEmotion && entryEmotion && exitEmotion !== entryEmotion) {
      // Check if shift is drastic
      const drasticShifts = [
        ['despair', 'joy'],
        ['anger', 'calm'],
        ['fear', 'confidence'],
        ['절망', '기쁨'],
        ['분노', '평온'],
      ];

      for (const [from, to] of drasticShifts) {
        if (
          (exitEmotion.includes(from) && entryEmotion.includes(to)) ||
          (exitEmotion.includes(to) && entryEmotion.includes(from))
        ) {
          return {
            severity: 'moderate',
            suggestion: `Emotional shift from "${exitEmotion}" to "${entryEmotion}" may need time passage indication.`,
          };
        }
      }
    }
  }

  return null;
}

/**
 * Detects emotional gaps between scenes
 */
function detectEmotionalGap(
  current: SceneV5,
  next: SceneV5
): { severity: TransitionSeverity; suggestion?: string } | null {
  if (!current.emotional_arc || !next.emotional_arc) {
    return null;
  }

  const exitEmotion = current.emotional_arc.exit_emotion?.toLowerCase() || '';
  const entryEmotion = next.emotional_arc.entry_emotion?.toLowerCase() || '';

  // Check if emotions chain properly
  // The exit emotion of one scene should reasonably lead to entry emotion of next

  // Emotional intensity mapping (rough approximation)
  const highIntensity = ['fear', 'rage', 'despair', 'ecstasy', '공포', '분노', '절망', '환희'];
  const lowIntensity = ['calm', 'neutral', 'relaxed', '평온', '중립', '편안'];

  const exitIsHigh = highIntensity.some(e => exitEmotion.includes(e));
  const entryIsLow = lowIntensity.some(e => entryEmotion.includes(e));
  const exitIsLow = lowIntensity.some(e => exitEmotion.includes(e));
  const entryIsHigh = highIntensity.some(e => entryEmotion.includes(e));

  // High to low without transition is abrupt
  if (exitIsHigh && entryIsLow) {
    return {
      severity: 'moderate',
      suggestion: `Abrupt emotional drop from "${exitEmotion}" to "${entryEmotion}". Consider gradual transition.`,
    };
  }

  // Low to high is usually fine (building tension)
  // But check for documented transition
  if (exitIsLow && entryIsHigh) {
    const hasTransition = next.transition?.from_previous;
    if (!hasTransition) {
      return {
        severity: 'minor',
        suggestion: `Emotional escalation from "${exitEmotion}" to "${entryEmotion}". Ensure buildup is present.`,
      };
    }
  }

  return null;
}

// ============================================================================
// Scene Assembly
// ============================================================================

/**
 * Assembles multiple scene drafts into chapter content
 *
 * Combines scene content with scene breaks and tracks break positions.
 *
 * @param drafts - Array of scene draft results
 * @param useSceneBreaks - Whether to insert scene break markers (default: true)
 * @returns Assembly result with combined content and metadata
 */
export function assembleScenes(
  drafts: SceneDraftResult[],
  useSceneBreaks: boolean = true
): AssemblyResult {
  if (drafts.length === 0) {
    return {
      assembledContent: '',
      transitionGaps: [],
      totalCharacters: 0,
      sceneBreakPositions: [],
    };
  }

  const sceneBreakPositions: number[] = [];
  let assembledContent = '';

  for (let i = 0; i < drafts.length; i++) {
    const draft = drafts[i];

    if (i > 0) {
      // Track scene break position before adding break
      sceneBreakPositions.push(assembledContent.length);

      if (useSceneBreaks) {
        assembledContent += SCENE_BREAK;
      } else {
        // Just double newline without visual break
        assembledContent += '\n\n';
      }
    }

    assembledContent += draft.content;
  }

  return {
    assembledContent,
    transitionGaps: [], // Gaps should be detected separately with scene metadata
    totalCharacters: assembledContent.length,
    sceneBreakPositions,
  };
}

/**
 * Assembles scenes with transition gap detection
 *
 * Combines assembleScenes with detectTransitionGaps for complete assembly.
 *
 * @param scenes - Array of SceneV5 objects
 * @param drafts - Array of scene drafts
 * @param useSceneBreaks - Whether to insert scene break markers
 * @returns Assembly result with gaps detected
 */
export function assembleScenesWithGaps(
  scenes: SceneV5[],
  drafts: SceneDraftResult[],
  useSceneBreaks: boolean = true
): AssemblyResult {
  // Assemble content
  const result = assembleScenes(drafts, useSceneBreaks);

  // Detect transition gaps
  const gaps = detectTransitionGaps(scenes, drafts);

  return {
    ...result,
    transitionGaps: gaps,
  };
}

// ============================================================================
// Assembly Validation
// ============================================================================

/**
 * Validation result for assembled chapter
 */
export interface AssemblyValidation {
  /** Whether assembly is valid */
  valid: boolean;
  /** Validation errors (must be fixed) */
  errors: string[];
  /** Validation warnings (should be reviewed) */
  warnings: string[];
}

/**
 * Validates assembled chapter content
 *
 * Checks for:
 * - Minimum/maximum length
 * - Severe transition gaps
 * - Scene count
 *
 * @param result - Assembly result to validate
 * @param expectedScenes - Expected number of scenes
 * @returns Validation result
 */
export function validateAssembly(
  result: AssemblyResult,
  expectedScenes: number
): AssemblyValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check length
  if (result.totalCharacters < MIN_CHAPTER_LENGTH) {
    errors.push(
      `Chapter too short: ${result.totalCharacters} chars (minimum: ${MIN_CHAPTER_LENGTH})`
    );
  }

  if (result.totalCharacters > MAX_CHAPTER_LENGTH) {
    warnings.push(
      `Chapter may be too long: ${result.totalCharacters} chars (suggested max: ${MAX_CHAPTER_LENGTH})`
    );
  }

  // Check scene count (break positions + 1 = scene count)
  const actualScenes = result.sceneBreakPositions.length + 1;
  if (actualScenes !== expectedScenes) {
    warnings.push(
      `Scene count mismatch: expected ${expectedScenes}, got ${actualScenes}`
    );
  }

  // Check for severe transition gaps
  const severeGaps = result.transitionGaps.filter(g => g.severity === 'severe');
  if (severeGaps.length > 0) {
    for (const gap of severeGaps) {
      errors.push(
        `Severe ${gap.gapType} transition gap between scenes ${gap.fromScene} and ${gap.toScene}`
      );
    }
  }

  // Check for moderate gaps (warnings only)
  const moderateGaps = result.transitionGaps.filter(g => g.severity === 'moderate');
  if (moderateGaps.length > 0) {
    for (const gap of moderateGaps) {
      warnings.push(
        `${gap.gapType} transition gap between scenes ${gap.fromScene} and ${gap.toScene}: ${gap.suggestedBridge || 'Consider smoothing'}`
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
