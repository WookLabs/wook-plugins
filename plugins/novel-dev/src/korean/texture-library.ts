/**
 * Korean Texture Library Module
 *
 * Provides texture matching and suggestion for Korean prose enrichment.
 * Korean prose gains richness from onomatopoeia (의성어) and mimetic words (의태어)
 * that have no English equivalents. This module matches textures to scene context.
 *
 * @module korean/texture-library
 */

import textureData from './data/texture-library.json' with { type: 'json' };

// ============================================================================
// Types
// ============================================================================

/**
 * A single texture entry from the library
 */
export interface TextureEntry {
  /** Korean texture word */
  korean: string;
  /** Intensity level for matching */
  intensity: 'soft' | 'medium' | 'strong';
  /** Verb form (~거리다) if applicable */
  verbForm: string | null;
  /** Usage contexts for matching */
  contexts: string[];
  /** Category (emotion, sound, movement, visual, nature) */
  category: string;
  /** Subcategory (heartbeat, crying, walking, etc.) */
  subcategory: string;
}

/**
 * A texture suggestion with matching reason
 */
export interface TextureSuggestion {
  /** The matched texture entry */
  texture: TextureEntry;
  /** Reason for the suggestion */
  reason: string;
  /** Priority (lower = better match) */
  priority: number;
  /** Whether to prefer verb form */
  useVerbForm: boolean;
}

/**
 * Context for texture matching
 */
export interface TextureContext {
  /** Scene emotions to match (e.g., ['sadness', 'loss']) */
  sceneEmotion: string[];
  /** Scene actions to match (e.g., ['crying', 'walking']) */
  sceneAction: string[];
  /** Genre for filtering (optional) */
  genre?: string;
  /** Preferred intensity level (optional) */
  intensity?: 'soft' | 'medium' | 'strong';
}

/**
 * Result of texture presence assessment
 */
export interface TextureAssessmentResult {
  /** Overall texture score (0-100) */
  score: number;
  /** Number of texture words found */
  textureCount: number;
  /** Unique texture words found */
  foundTextures: string[];
  /** Segments lacking texture (for directive generation) */
  deficientSegments: Array<{ start: number; end: number }>;
}

// ============================================================================
// Texture Entry Storage
// ============================================================================

/**
 * All texture entries loaded from JSON
 */
export const TEXTURE_ENTRIES: TextureEntry[] = [];

/**
 * Load texture library from JSON data
 * Called on module initialization
 */
export function loadTextureLibrary(): void {
  TEXTURE_ENTRIES.length = 0;
  const data = textureData as {
    categories: Record<string, Record<string, Array<{
      korean: string;
      intensity: 'soft' | 'medium' | 'strong';
      verbForm: string | null;
      contexts: string[];
    }>>>;
  };

  for (const [category, subcategories] of Object.entries(data.categories)) {
    for (const [subcategory, entries] of Object.entries(subcategories)) {
      for (const entry of entries) {
        TEXTURE_ENTRIES.push({
          korean: entry.korean,
          intensity: entry.intensity,
          verbForm: entry.verbForm,
          contexts: entry.contexts,
          category,
          subcategory,
        });
      }
    }
  }
}

// Initialize on module load
loadTextureLibrary();

// ============================================================================
// Suggestion Functions
// ============================================================================

/**
 * Suggest texture words based on scene context
 *
 * Matches texture entries to scene emotion and action, returning prioritized
 * suggestions. Respects intensity preference if provided.
 *
 * @param context - Scene emotion and action context
 * @param maxSuggestions - Maximum suggestions to return (default: 3)
 * @returns Prioritized texture suggestions
 */
export function suggestTexture(
  context: TextureContext,
  maxSuggestions: number = 3
): TextureSuggestion[] {
  const suggestions: TextureSuggestion[] = [];
  const seenKorean = new Set<string>();

  // Match by emotion context (priority 1)
  for (const emotion of context.sceneEmotion) {
    const emotionLower = emotion.toLowerCase();
    const matches = TEXTURE_ENTRIES.filter(t =>
      t.contexts.some(c => c.toLowerCase().includes(emotionLower))
    );

    for (const match of matches) {
      if (seenKorean.has(match.korean)) continue;
      if (context.intensity && match.intensity !== context.intensity) continue;

      seenKorean.add(match.korean);
      suggestions.push({
        texture: match,
        reason: `Matches scene emotion: ${emotion}`,
        priority: 1,
        useVerbForm: match.verbForm !== null && shouldUseVerbForm(context),
      });
    }
  }

  // Match by action context (priority 2)
  for (const action of context.sceneAction) {
    const actionLower = action.toLowerCase();
    const matches = TEXTURE_ENTRIES.filter(t =>
      t.subcategory.toLowerCase().includes(actionLower) ||
      t.contexts.some(c => c.toLowerCase().includes(actionLower))
    );

    for (const match of matches) {
      if (seenKorean.has(match.korean)) continue;
      if (context.intensity && match.intensity !== context.intensity) continue;

      seenKorean.add(match.korean);
      suggestions.push({
        texture: match,
        reason: `Matches scene action: ${action}`,
        priority: 2,
        useVerbForm: match.verbForm !== null && shouldUseVerbForm(context),
      });
    }
  }

  // Sort by priority and limit
  return suggestions
    .sort((a, b) => a.priority - b.priority)
    .slice(0, maxSuggestions);
}

/**
 * Determine if verb form should be preferred
 * Action-heavy scenes benefit from verb forms
 */
function shouldUseVerbForm(context: TextureContext): boolean {
  return context.sceneAction.length > 0;
}

// ============================================================================
// Assessment Functions
// ============================================================================

/**
 * Assess texture presence in content
 *
 * Scans content for texture words and identifies segments lacking texture.
 * Target density: 1-2 texture words per 500 characters.
 *
 * @param content - Text to analyze
 * @param targetPer500Chars - Target texture count per 500 chars (default: 1)
 * @returns Assessment with score, found textures, and deficient segments
 */
export function assessTexturePresence(
  content: string,
  targetPer500Chars: number = 1
): TextureAssessmentResult {
  const foundTextures: string[] = [];

  // Find all texture words in content
  for (const entry of TEXTURE_ENTRIES) {
    if (content.includes(entry.korean)) {
      foundTextures.push(entry.korean);
    }
    if (entry.verbForm && content.includes(entry.verbForm)) {
      foundTextures.push(entry.verbForm);
    }
  }

  const charCount = content.length;
  const segments = Math.ceil(charCount / 500);
  const deficientSegments: Array<{ start: number; end: number }> = [];

  // Check each 500-char segment
  for (let i = 0; i < segments; i++) {
    const start = i * 500;
    const end = Math.min(start + 500, charCount);
    const segment = content.slice(start, end);

    let segmentTextureCount = 0;
    for (const entry of TEXTURE_ENTRIES) {
      if (segment.includes(entry.korean)) segmentTextureCount++;
      if (entry.verbForm && segment.includes(entry.verbForm)) segmentTextureCount++;
    }

    if (segmentTextureCount < targetPer500Chars) {
      deficientSegments.push({ start, end });
    }
  }

  // Calculate score (higher is better)
  // Score = (found / ideal) * 100, capped at 100
  const idealCount = Math.max(1, segments * targetPer500Chars);
  const uniqueCount = new Set(foundTextures).size;
  const score = Math.min(100, Math.round((uniqueCount / idealCount) * 100));

  return {
    score,
    textureCount: foundTextures.length,
    foundTextures: [...new Set(foundTextures)], // Deduplicate
    deficientSegments,
  };
}

// ============================================================================
// Filter Functions
// ============================================================================

/**
 * Get texture entries by category
 *
 * @param category - Category to filter (emotion, sound, movement, visual, nature)
 * @returns Filtered texture entries
 */
export function getTexturesByCategory(category: string): TextureEntry[] {
  return TEXTURE_ENTRIES.filter(t => t.category === category);
}

/**
 * Get texture entries by context keyword
 *
 * @param contextKeyword - Keyword to match in contexts
 * @returns Filtered texture entries
 */
export function getTexturesByContext(contextKeyword: string): TextureEntry[] {
  const keywordLower = contextKeyword.toLowerCase();
  return TEXTURE_ENTRIES.filter(t =>
    t.contexts.some(c => c.toLowerCase().includes(keywordLower))
  );
}

/**
 * Get texture entries by subcategory
 *
 * @param subcategory - Subcategory to filter (heartbeat, crying, walking, etc.)
 * @returns Filtered texture entries
 */
export function getTexturesBySubcategory(subcategory: string): TextureEntry[] {
  const subcategoryLower = subcategory.toLowerCase();
  return TEXTURE_ENTRIES.filter(t =>
    t.subcategory.toLowerCase().includes(subcategoryLower)
  );
}

/**
 * Get texture entries by intensity
 *
 * @param intensity - Intensity level to filter
 * @returns Filtered texture entries
 */
export function getTexturesByIntensity(intensity: 'soft' | 'medium' | 'strong'): TextureEntry[] {
  return TEXTURE_ENTRIES.filter(t => t.intensity === intensity);
}
