/**
 * Style Exemplar Classifier
 *
 * Heuristic-based classifier for Korean prose content.
 * Detects scene type, emotional tone, pacing, and POV from text patterns.
 */

import type { ExemplarCategory, SceneType, POV, PacingSpeed } from './types.js';

// ============================================================================
// Pattern Definitions (Korean Text Analysis)
// ============================================================================

/**
 * Patterns for detecting scene types in Korean text
 */
const SCENE_TYPE_PATTERNS: Record<SceneType, RegExp[]> = {
  'opening-hook': [
    /^[가-힣]{1,10}[은는이가]/,       // Sentence starting with subject particle
    /처음|시작|눈을 떴다|일어났다/,    // Beginning indicators
    /그날|그때|어느 날/,              // Time markers for story start
  ],
  'dialogue': [
    /[""][^""]+[""]|「[^」]+」/g,     // Quoted dialogue
    /말했다|대답했다|물었다|외쳤다/,    // Speech verbs
    /~요|~다고|~냐고|~라고/,          // Reported speech
  ],
  'action': [
    /달렸다|뛰었다|때렸다|막았다/,     // Action verbs
    /움직|공격|싸움|전투/,            // Combat/movement
    /빠르게|급히|갑자기/,             // Speed indicators
    /피했다|베었다|찔렀다/,           // Combat actions
  ],
  'emotional-peak': [
    /심장|눈물|떨|울|웃/,             // Physical emotion
    /사랑|미움|분노|기쁨|슬픔/,        // Emotion words
    /가슴이|마음이|눈시울/,            // Emotional body references
  ],
  'transition': [
    /며칠|몇 주|한 달|시간이 지나/,    // Time transitions
    /그로부터|이후|다음 날/,           // Temporal connectors
    /장소를 옮|이동했|도착했/,         // Location transitions
  ],
  'description': [
    /보였다|들렸다|냄새|맛|느껴졌다/,  // Sensory descriptions
    /하늘|바람|공기|빛/,              // Environment
    /~처럼|~같은|~듯/,                // Similes
  ],
  'climax': [
    /결국|마침내|드디어/,             // Culmination markers
    /모든 것이|마지막|최후/,           // Finality
    /승리|패배|결정적/,               // Resolution
  ],
  'denouement': [
    /그 후|그리고 나서|이후/,          // After-markers
    /평화|일상|돌아왔다/,              // Return to normalcy
    /끝|마무리|정리/,                 // Closure words
  ],
};

/**
 * Patterns for detecting emotional tones
 */
const EMOTIONAL_TONE_PATTERNS: Record<string, RegExp[]> = {
  tension: [/긴장|떨|숨|조마조마|불안|초조/],
  warmth: [/따뜻|포근|부드러|온기|정겨운/],
  sorrow: [/슬픔|눈물|아픔|상처|이별/],
  humor: [/웃음|재미|장난|농담|우스운/],
  awe: [/경이|놀라움|신비|대단|압도/],
  dread: [/두려움|공포|무서운|소름|전율/],
  excitement: [/흥분|설렘|두근|기대|신나는/],
  serenity: [/평화|고요|잔잔|평온|차분/],
};

/**
 * Patterns for detecting POV
 */
const POV_PATTERNS: Record<POV, RegExp[]> = {
  'first-person': [/나는|내가|나의|나를|내 /],
  'third-limited': [/그는|그녀는|그의|그녀의/],
  'third-omniscient': [/~생각했다|~느꼈다|모두가|한편/],
};

// ============================================================================
// Main Classifier
// ============================================================================

/**
 * Classifies Korean prose content into the 5-dimension taxonomy.
 *
 * Uses heuristic pattern matching for classification.
 * Hints can be provided to override automatic detection.
 *
 * @param content - The prose content to classify
 * @param hints - Optional partial category to use as hints
 * @returns The classified exemplar category
 *
 * @example
 * ```typescript
 * const category = classifyExemplar(
 *   '"사랑해." 그가 속삭였다. 그녀의 심장이 빠르게 뛰기 시작했다.',
 *   { genre: 'romance' }
 * );
 * // Returns: { genre: 'romance', scene_type: 'dialogue', emotional_tone: 'warmth', ... }
 * ```
 */
export function classifyExemplar(
  content: string,
  hints?: Partial<ExemplarCategory>
): ExemplarCategory {
  return {
    genre: hints?.genre ?? 'general',
    scene_type: hints?.scene_type ?? detectSceneType(content),
    emotional_tone: hints?.emotional_tone ?? detectEmotionalTone(content),
    pov: hints?.pov ?? detectPOV(content),
    pacing: hints?.pacing ?? detectPacing(content),
  };
}

// ============================================================================
// Detection Functions
// ============================================================================

/**
 * Detects the most likely scene type from content
 */
function detectSceneType(content: string): SceneType {
  const scores: Record<SceneType, number> = {
    'opening-hook': 0,
    'dialogue': 0,
    'action': 0,
    'emotional-peak': 0,
    'transition': 0,
    'description': 0,
    'climax': 0,
    'denouement': 0,
  };

  // Score each scene type based on pattern matches
  for (const [sceneType, patterns] of Object.entries(SCENE_TYPE_PATTERNS)) {
    for (const pattern of patterns) {
      const matches = content.match(pattern);
      if (matches) {
        scores[sceneType as SceneType] += matches.length;
      }
    }
  }

  // Find highest scoring type
  let maxScore = 0;
  let detectedType: SceneType = 'description'; // Default fallback

  for (const [type, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      detectedType = type as SceneType;
    }
  }

  return detectedType;
}

/**
 * Detects the dominant emotional tone from content
 */
function detectEmotionalTone(content: string): string | undefined {
  let maxMatches = 0;
  let detectedTone: string | undefined;

  for (const [tone, patterns] of Object.entries(EMOTIONAL_TONE_PATTERNS)) {
    let matches = 0;
    for (const pattern of patterns) {
      const found = content.match(pattern);
      if (found) {
        matches += found.length;
      }
    }
    if (matches > maxMatches) {
      maxMatches = matches;
      detectedTone = tone;
    }
  }

  return detectedTone;
}

/**
 * Detects the narrative POV from content
 */
function detectPOV(content: string): POV | undefined {
  const scores: Record<POV, number> = {
    'first-person': 0,
    'third-limited': 0,
    'third-omniscient': 0,
  };

  for (const [pov, patterns] of Object.entries(POV_PATTERNS)) {
    for (const pattern of patterns) {
      const matches = content.match(pattern);
      if (matches) {
        scores[pov as POV] += matches.length;
      }
    }
  }

  // First-person is usually very clear
  if (scores['first-person'] > 0) {
    return 'first-person';
  }

  // Between third-limited and third-omniscient
  if (scores['third-omniscient'] > scores['third-limited']) {
    return 'third-omniscient';
  }

  if (scores['third-limited'] > 0) {
    return 'third-limited';
  }

  return undefined;
}

/**
 * Detects pacing from sentence structure and word choice
 */
function detectPacing(content: string): PacingSpeed | undefined {
  // Split into sentences (Korean sentence endings)
  const sentences = content.split(/[.!?。！？]/g).filter((s) => s.trim().length > 0);

  if (sentences.length === 0) {
    return undefined;
  }

  // Calculate average sentence length (in characters)
  const avgLength = sentences.reduce((sum, s) => sum + s.length, 0) / sentences.length;

  // Short sentences (< 30 chars) suggest fast pacing
  // Long sentences (> 60 chars) suggest slow pacing
  if (avgLength < 30) {
    return 'fast';
  } else if (avgLength > 60) {
    return 'slow';
  }

  // Check for action-heavy content (fast pacing)
  const actionPatterns = /달렸다|뛰었다|급히|빠르게|순간/g;
  const actionMatches = content.match(actionPatterns);
  if (actionMatches && actionMatches.length > 2) {
    return 'fast';
  }

  // Check for descriptive content (slow pacing)
  const descPatterns = /천천히|조용히|느긋|여유|바라보았다/g;
  const descMatches = content.match(descPatterns);
  if (descMatches && descMatches.length > 2) {
    return 'slow';
  }

  return 'medium';
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Extracts notable Korean language features from content
 */
export function extractLanguageFeatures(content: string): string[] {
  const features: string[] = [];

  // Onomatopoeia (의성어)
  if (/[가-힣]{2,3}[가-힣]{2,3}/.test(content) && /쾅|쿵|뚝|삐|짹/.test(content)) {
    features.push('onomatopoeia');
  }

  // Mimetic words (의태어)
  if (/살금|빙글|꿈틀|찌릿|콩닥/.test(content)) {
    features.push('mimetic-words');
  }

  // Metaphor/Simile
  if (/~처럼|~같은|~듯|마치/.test(content)) {
    features.push('simile');
  }

  // Sensory details
  const sensoryCount = (content.match(/보였|들렸|냄새|맛|느껴/g) || []).length;
  if (sensoryCount >= 2) {
    features.push('sensory-rich');
  }

  // Varied sentence rhythm
  const sentences = content.split(/[.!?。！？]/g).filter((s) => s.trim().length > 0);
  if (sentences.length >= 3) {
    const lengths = sentences.map((s) => s.length);
    const variance =
      lengths.reduce((sum, l, _, arr) => {
        const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
        return sum + Math.pow(l - mean, 2);
      }, 0) / lengths.length;
    if (variance > 400) {
      // High variance in sentence length
      features.push('varied-rhythm');
    }
  }

  // Internal monologue markers
  if (/생각했다|느꼈다|의문이|떠올랐다/.test(content)) {
    features.push('internal-monologue');
  }

  return features;
}
