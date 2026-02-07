/**
 * Banned Expression Detection Module
 *
 * Detects AI-characteristic expressions in Korean prose that reveal
 * machine-generated text. These patterns include:
 * - AI-tell connectors (한편, 그러나, etc.)
 * - Archaic verb forms (하였다, 되었다)
 * - Translationese patterns (에 있어서, ~로 인한)
 * - Unusual punctuation patterns
 * - Pronoun overuse
 *
 * @module korean/banned-expressions
 */

import bannedExpressionsData from './data/banned-expressions.json' with { type: 'json' };

// ============================================================================
// Types
// ============================================================================

/**
 * Categories of banned expressions
 */
export type BannedCategory =
  | 'ai-tell'
  | 'archaic-verb'
  | 'translationese'
  | 'punctuation'
  | 'pronoun-overuse';

/**
 * Severity levels for banned expressions
 */
export type Severity = 'critical' | 'high' | 'medium' | 'low';

/**
 * Context where expression applies
 */
export type Context = 'narration' | 'dialogue' | 'any';

/**
 * A single banned expression definition
 */
export interface BannedExpression {
  pattern: string;
  isRegex?: boolean;
  regexPattern?: string;
  replacements: string[];
  context: Context;
  note?: string;
  reason?: string;
}

/**
 * A match result from banned expression detection
 */
export interface BannedExpressionMatch {
  expression: BannedExpression;
  category: BannedCategory;
  severity: Severity;
  position: number;
  matchedText: string;
  inDialogue: boolean;
}

/**
 * Flattened expression with category and severity
 */
interface FlattenedExpression extends BannedExpression {
  category: BannedCategory;
  severity: Severity;
}

// ============================================================================
// Data Loading
// ============================================================================

/**
 * Flattened list of all banned expressions for detection
 */
export const BANNED_EXPRESSIONS: FlattenedExpression[] = [];

/**
 * Load and flatten banned expressions from JSON data
 */
export function loadBannedExpressions(): void {
  BANNED_EXPRESSIONS.length = 0;
  const data = bannedExpressionsData as {
    categories: Record<
      string,
      {
        severity: Severity;
        expressions: BannedExpression[];
      }
    >;
  };

  for (const [category, info] of Object.entries(data.categories)) {
    for (const expr of info.expressions) {
      BANNED_EXPRESSIONS.push({
        ...expr,
        category: category as BannedCategory,
        severity: info.severity,
      });
    }
  }
}

// Initialize on module load
loadBannedExpressions();

// ============================================================================
// Dialogue Detection
// ============================================================================

/**
 * Detect ranges of dialogue (text within quotes)
 */
function detectDialogueRanges(content: string): Array<{ start: number; end: number }> {
  const dialogueRanges: Array<{ start: number; end: number }> = [];
  const quotePattern = /["""]([^"""]*)["""]/g;
  let match;
  while ((match = quotePattern.exec(content)) !== null) {
    dialogueRanges.push({ start: match.index, end: match.index + match[0].length });
  }
  return dialogueRanges;
}

/**
 * Check if a position is inside dialogue
 */
function isInDialogue(
  pos: number,
  dialogueRanges: Array<{ start: number; end: number }>
): boolean {
  return dialogueRanges.some((range) => pos >= range.start && pos <= range.end);
}

// ============================================================================
// Detection Functions
// ============================================================================

/**
 * Escape special regex characters in a string
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Severity order for sorting (lower number = higher severity)
 */
const SEVERITY_ORDER: Record<Severity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

/**
 * Detect banned expressions in content
 *
 * @param content - Text to analyze
 * @param contextType - Whether analyzing narration or dialogue
 * @param minSeverity - Minimum severity to report (default: 'medium')
 * @returns Array of matches sorted by severity then position
 */
export function detectBannedExpressions(
  content: string,
  contextType: 'narration' | 'dialogue' = 'narration',
  minSeverity: Severity = 'medium'
): BannedExpressionMatch[] {
  const minLevel = SEVERITY_ORDER[minSeverity];
  const dialogueRanges = detectDialogueRanges(content);
  const matches: BannedExpressionMatch[] = [];

  for (const expr of BANNED_EXPRESSIONS) {
    // Skip if severity below threshold
    if (SEVERITY_ORDER[expr.severity] > minLevel) continue;

    // Skip if context doesn't match
    if (expr.context !== 'any' && expr.context !== contextType) continue;

    // Build pattern
    const pattern =
      expr.isRegex && expr.regexPattern
        ? new RegExp(expr.regexPattern, 'gm')
        : new RegExp(escapeRegex(expr.pattern), 'g');

    let m;
    while ((m = pattern.exec(content)) !== null) {
      const inDialogueFlag = isInDialogue(m.index, dialogueRanges);

      // Skip narration patterns found in dialogue (may be intentional character voice)
      if (expr.context === 'narration' && inDialogueFlag) continue;

      matches.push({
        expression: expr,
        category: expr.category,
        severity: expr.severity,
        position: m.index,
        matchedText: m[0],
        inDialogue: inDialogueFlag,
      });
    }
  }

  // Sort by severity (critical first) then position
  return matches.sort((a, b) => {
    const severityDiff = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
    if (severityDiff !== 0) return severityDiff;
    return a.position - b.position;
  });
}

/**
 * Get suggested replacement for a match
 *
 * Returns the first non-empty replacement, or '[삭제]' if all are empty
 */
export function getSuggestedReplacement(match: BannedExpressionMatch): string {
  const replacements = match.expression.replacements.filter((r) => r !== '');
  return replacements.length > 0 ? replacements[0] : '[삭제]';
}

/**
 * Get all valid replacements for a match (excluding empty strings)
 */
export function getAllReplacements(match: BannedExpressionMatch): string[] {
  return match.expression.replacements.filter((r) => r !== '');
}

/**
 * Get the reason why an expression is banned
 */
export function getBannedReason(match: BannedExpressionMatch): string {
  return match.expression.reason || match.expression.note || 'AI 특유 표현';
}

// ============================================================================
// Statistics Functions
// ============================================================================

/**
 * Count matches by severity
 */
export function countBySeverity(matches: BannedExpressionMatch[]): Record<Severity, number> {
  const counts: Record<Severity, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  };

  for (const match of matches) {
    counts[match.severity]++;
  }

  return counts;
}

/**
 * Count matches by category
 */
export function countByCategory(matches: BannedExpressionMatch[]): Record<BannedCategory, number> {
  const counts: Record<BannedCategory, number> = {
    'ai-tell': 0,
    'archaic-verb': 0,
    translationese: 0,
    punctuation: 0,
    'pronoun-overuse': 0,
  };

  for (const match of matches) {
    counts[match.category]++;
  }

  return counts;
}

/**
 * Get unique categories present in matches
 */
export function getUniqueCategories(matches: BannedExpressionMatch[]): BannedCategory[] {
  const categories = new Set<BannedCategory>();
  for (const match of matches) {
    categories.add(match.category);
  }
  return Array.from(categories);
}
