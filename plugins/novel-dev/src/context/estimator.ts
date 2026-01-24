/**
 * Token Estimation Module
 *
 * Estimates token count for content based on language composition.
 * Uses empirical factors for Korean and English text with Claude models.
 */

import path from 'path';
import { ContentType, ContextType } from './types.js';

// ============================================================================
// Constants
// ============================================================================

/**
 * Token estimation factors
 * - Korean characters average ~0.7 tokens each (Claude tokenizer)
 * - English words average ~1.3 tokens each
 * - JSON structural overhead adds ~20%
 * - Special characters and numbers average ~0.5 tokens each
 */
const KOREAN_CHAR_FACTOR = 0.7;
const ENGLISH_WORD_FACTOR = 1.3;
const JSON_OVERHEAD_FACTOR = 1.2;
const SPECIAL_CHAR_FACTOR = 0.5;
const NUMBER_FACTOR = 0.3;

/**
 * Average token estimates by file type (for quick estimation without reading file)
 */
export const ESTIMATED_TOKENS_BY_FILE_TYPE: Record<string, number> = {
  'style-guide.json': 600,
  'chapter_plot.json': 900,
  'chapter_summary.md': 1400,
  'character.json': 1500,
  'locations.json': 3000,
  'foreshadowing.json': 2400,
  'act_summary.md': 800,
};

/**
 * Average tokens per context type (rough estimates)
 */
export const AVERAGE_TOKENS_BY_TYPE: Record<ContextType, number> = {
  style: 600,
  plot: 900,
  summary: 1400,
  character: 1500,
  world: 1000,
  foreshadowing: 400,
  act_summary: 800,
};

// ============================================================================
// Main Estimation Function
// ============================================================================

/**
 * Estimates token count for given content
 *
 * Algorithm:
 * 1. Count Korean characters (Hangul syllables: U+AC00-U+D7AF)
 * 2. Count English words
 * 3. Count numbers and special characters
 * 4. Apply type-specific overhead (JSON adds 20%)
 *
 * @param content - The text content to estimate
 * @param type - Content type: 'korean', 'json', or 'mixed'
 * @returns Estimated token count
 *
 * @example
 * ```typescript
 * estimateTokens('안녕하세요', 'korean'); // ~4 tokens
 * estimateTokens('{"name": "test"}', 'json'); // ~5 tokens
 * ```
 */
export function estimateTokens(content: string, type: ContentType = 'mixed'): number {
  if (!content || content.length === 0) {
    return 0;
  }

  // Count Korean characters (Hangul syllables)
  const koreanChars = (content.match(/[\uAC00-\uD7AF]/g) || []).length;

  // Count Korean Jamo (consonants/vowels) - less common but can appear
  const koreanJamo = (content.match(/[\u1100-\u11FF\u3130-\u318F]/g) || []).length;

  // Count English words (sequences of letters)
  const englishWords = (content.match(/[a-zA-Z]+/g) || []).length;

  // Count numbers (each digit sequence counts as partial token)
  const numbers = (content.match(/\d+/g) || []).length;

  // Count special/punctuation characters
  const specialChars = (content.match(/[^\w\s\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]/g) || []).length;

  // Calculate base tokens
  const koreanTokens = (koreanChars + koreanJamo * 0.5) * KOREAN_CHAR_FACTOR;
  const englishTokens = englishWords * ENGLISH_WORD_FACTOR;
  const numberTokens = numbers * NUMBER_FACTOR;
  const specialTokens = specialChars * SPECIAL_CHAR_FACTOR;

  const baseTokens = koreanTokens + englishTokens + numberTokens + specialTokens;

  // Apply JSON overhead if applicable
  const jsonOverhead = type === 'json' ? JSON_OVERHEAD_FACTOR : 1.0;

  return Math.ceil(baseTokens * jsonOverhead);
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Estimates tokens for a file based on its path (without reading content)
 *
 * @param filePath - Path to the file
 * @returns Estimated token count based on file type
 */
export function estimateTokensByPath(filePath: string): number {
  const fileName = path.basename(filePath);

  // Check for known file patterns
  if (fileName === 'style-guide.json') {
    return ESTIMATED_TOKENS_BY_FILE_TYPE['style-guide.json'];
  }

  if (fileName.match(/chapter_\d+\.json/)) {
    return ESTIMATED_TOKENS_BY_FILE_TYPE['chapter_plot.json'];
  }

  if (fileName.match(/chapter_\d+_summary\.md/)) {
    return ESTIMATED_TOKENS_BY_FILE_TYPE['chapter_summary.md'];
  }

  if (fileName.match(/char_\d+\.json/) || fileName === 'characters.json') {
    return ESTIMATED_TOKENS_BY_FILE_TYPE['character.json'];
  }

  if (fileName === 'locations.json') {
    return ESTIMATED_TOKENS_BY_FILE_TYPE['locations.json'];
  }

  if (fileName === 'foreshadowing.json') {
    return ESTIMATED_TOKENS_BY_FILE_TYPE['foreshadowing.json'];
  }

  if (fileName.match(/act_\d+_summary\.md/)) {
    return ESTIMATED_TOKENS_BY_FILE_TYPE['act_summary.md'];
  }

  // Default estimate based on typical file size
  return 500;
}

/**
 * Detects the content type from content string
 *
 * @param content - The content to analyze
 * @returns Detected content type
 */
export function detectContentType(content: string): ContentType {
  // Check if it looks like JSON
  const trimmed = content.trim();
  if (
    (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
    (trimmed.startsWith('[') && trimmed.endsWith(']'))
  ) {
    return 'json';
  }

  // Count Korean vs English ratio
  const koreanChars = (content.match(/[\uAC00-\uD7AF]/g) || []).length;
  const englishChars = (content.match(/[a-zA-Z]/g) || []).length;

  if (koreanChars > englishChars * 2) {
    return 'korean';
  }

  return 'mixed';
}

/**
 * Estimates tokens for content with auto-detected type
 *
 * @param content - The content to estimate
 * @returns Estimated token count
 */
export function estimateTokensAuto(content: string): number {
  const type = detectContentType(content);
  return estimateTokens(content, type);
}

/**
 * Calculates token usage summary for multiple content items
 *
 * @param items - Array of content strings
 * @returns Object with total and individual estimates
 */
export function estimateTokensBatch(
  items: Array<{ content: string; type?: ContentType }>
): {
  total: number;
  individual: number[];
} {
  const individual = items.map(item =>
    estimateTokens(item.content, item.type || detectContentType(item.content))
  );

  return {
    total: individual.reduce((sum, tokens) => sum + tokens, 0),
    individual,
  };
}

/**
 * Validates if content fits within a token budget
 *
 * @param content - Content to check
 * @param budget - Maximum allowed tokens
 * @param type - Content type
 * @returns Object with fit status and details
 */
export function fitsInBudget(
  content: string,
  budget: number,
  type: ContentType = 'mixed'
): {
  fits: boolean;
  estimated: number;
  remaining: number;
  overBy: number;
} {
  const estimated = estimateTokens(content, type);
  const remaining = budget - estimated;

  return {
    fits: remaining >= 0,
    estimated,
    remaining: Math.max(0, remaining),
    overBy: Math.max(0, -remaining),
  };
}
