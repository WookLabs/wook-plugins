/**
 * Context Loader Module
 *
 * Main loading logic with budget management.
 * Collects context candidates, prioritizes them, and loads within token budget.
 */

import * as fs from 'fs/promises';
import * as path from 'path';

import {
  ContextItem,
  ContextBudget,
  ContextType,
  ItemMetadata,
  BudgetConfig,
  DEFAULT_BUDGET_CONFIG,
  ContextOverflowError,
  LoadContextResult,
  LoadingStats,
} from './types.js';

import { estimateTokens, estimateTokensByPath, detectContentType } from './estimator.js';
import { getPriority, isRequired, sortByPriority } from './priorities.js';

// ============================================================================
// File Loading
// ============================================================================

/**
 * Loads file content from disk
 *
 * @param filePath - Path to the file
 * @returns File content as string, or null if file doesn't exist
 */
async function loadFile(filePath: string): Promise<string | null> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return content;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

/**
 * Checks if a file exists
 *
 * @param filePath - Path to check
 * @returns True if file exists
 */
async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

// ============================================================================
// Candidate Collection
// ============================================================================

/**
 * Collects all context candidates for a given chapter
 *
 * @param chapterNumber - Current chapter number
 * @param projectPath - Path to the novel project
 * @param config - Budget configuration
 * @returns Array of context item candidates
 */
async function collectCandidates(
  chapterNumber: number,
  projectPath: string,
  config: Required<BudgetConfig>
): Promise<ContextItem[]> {
  const candidates: ContextItem[] = [];
  const metaPath = path.join(projectPath, 'meta');
  const chaptersPath = path.join(projectPath, 'chapters');

  // 1. Style Guide (always required)
  const styleGuidePath = path.join(metaPath, 'style-guide.json');
  if (await fileExists(styleGuidePath)) {
    candidates.push({
      id: 'style-guide',
      type: 'style',
      path: styleGuidePath,
      estimatedTokens: estimateTokensByPath(styleGuidePath),
      priority: getPriority('style', { currentChapter: chapterNumber }),
      required: true,
    });
  }

  // 2. Current Chapter Plot (required)
  const chapterPlotPath = path.join(chaptersPath, `chapter_${String(chapterNumber).padStart(3, '0')}.json`);
  if (await fileExists(chapterPlotPath)) {
    candidates.push({
      id: `plot-${chapterNumber}`,
      type: 'plot',
      path: chapterPlotPath,
      estimatedTokens: estimateTokensByPath(chapterPlotPath),
      priority: getPriority('plot', { currentChapter: chapterNumber }),
      required: true,
    });
  }

  // 3. Previous Chapter Summaries
  for (let i = 1; i <= config.summaryDepth; i++) {
    const summaryChapter = chapterNumber - i;
    if (summaryChapter < 1) continue;

    const summaryPath = path.join(
      projectPath,
      'context',
      'summaries',
      `chapter_${String(summaryChapter).padStart(3, '0')}_summary.md`
    );

    if (await fileExists(summaryPath)) {
      const metadata: ItemMetadata = {
        currentChapter: chapterNumber,
        summaryChapter,
      };

      candidates.push({
        id: `summary-${summaryChapter}`,
        type: 'summary',
        path: summaryPath,
        estimatedTokens: estimateTokensByPath(summaryPath),
        priority: getPriority('summary', metadata),
        required: isRequired('summary', metadata),
      });
    }
  }

  // 4. Characters
  await collectCharacterCandidates(
    candidates,
    chapterNumber,
    projectPath,
    config
  );

  // 5. Locations/World
  await collectWorldCandidates(
    candidates,
    chapterNumber,
    projectPath,
    config
  );

  // 6. Foreshadowing
  await collectForeshadowingCandidates(
    candidates,
    chapterNumber,
    projectPath,
    config
  );

  // 7. Act Summary (if at act boundary)
  await collectActSummaryCandidates(
    candidates,
    chapterNumber,
    projectPath
  );

  return candidates;
}

/**
 * Collects character context candidates
 */
async function collectCharacterCandidates(
  candidates: ContextItem[],
  chapterNumber: number,
  projectPath: string,
  config: Required<BudgetConfig>
): Promise<void> {
  const charactersDir = path.join(projectPath, 'characters');

  // Try to read character manifest (characters.json or index.json fallback)
  const manifestPath = path.join(charactersDir, 'characters.json');
  const indexPath = path.join(charactersDir, 'index.json');

  // Check for manifest file (characters.json preferred, index.json as fallback)
  const actualManifestPath = (await fileExists(manifestPath))
    ? manifestPath
    : (await fileExists(indexPath)) ? indexPath : null;

  if (actualManifestPath) {
    // Load manifest to get character list
    const manifestContent = await loadFile(actualManifestPath);
    if (manifestContent) {
      try {
        const manifest = JSON.parse(manifestContent);
        const characters = manifest.characters || manifest;

        // Get appearing characters from current chapter plot
        const appearingIds = await getAppearingCharacters(chapterNumber, projectPath);

        for (const char of Array.isArray(characters) ? characters : Object.values(characters)) {
          const charId = (char as { id?: string }).id || 'unknown';
          const charPath = path.join(charactersDir, `${charId}.json`);

          const appearsInCurrentChapter = appearingIds.includes(charId);
          const metadata: ItemMetadata = {
            currentChapter: chapterNumber,
            appearsInCurrentChapter,
          };

          // Skip non-appearing characters unless config says otherwise
          if (!config.includeAllCharacters && !appearsInCurrentChapter) {
            continue;
          }

          if (await fileExists(charPath)) {
            candidates.push({
              id: `character-${charId}`,
              type: 'character',
              path: charPath,
              estimatedTokens: estimateTokensByPath(charPath),
              priority: getPriority('character', metadata),
              required: isRequired('character', metadata),
            });
          }
        }
      } catch {
        // Manifest parsing failed, skip
      }
    }
  }
}

/**
 * Gets list of character IDs appearing in current chapter
 */
async function getAppearingCharacters(
  chapterNumber: number,
  projectPath: string
): Promise<string[]> {
  const chapterPlotPath = path.join(
    projectPath,
    'chapters',
    `chapter_${String(chapterNumber).padStart(3, '0')}.json`
  );

  try {
    const content = await loadFile(chapterPlotPath);
    if (content) {
      const plot = JSON.parse(content);
      return plot.meta?.characters || plot.characters || [];
    }
  } catch {
    // Failed to parse, return empty
  }

  return [];
}

/**
 * Collects world/location context candidates
 */
async function collectWorldCandidates(
  candidates: ContextItem[],
  chapterNumber: number,
  projectPath: string,
  _config: Required<BudgetConfig>
): Promise<void> {
  const locationsPath = path.join(projectPath, 'world', 'locations.json');

  if (await fileExists(locationsPath)) {
    // Get locations used in current chapter
    const usedLocations = await getUsedLocations(chapterNumber, projectPath);

    const metadata: ItemMetadata = {
      currentChapter: chapterNumber,
      appearsInCurrentChapter: usedLocations.length > 0,
    };

    candidates.push({
      id: 'world-locations',
      type: 'world',
      path: locationsPath,
      estimatedTokens: estimateTokensByPath(locationsPath),
      priority: getPriority('world', metadata),
      required: isRequired('world', metadata),
    });
  }
}

/**
 * Gets list of location IDs used in current chapter
 */
async function getUsedLocations(
  chapterNumber: number,
  projectPath: string
): Promise<string[]> {
  const chapterPlotPath = path.join(
    projectPath,
    'chapters',
    `chapter_${String(chapterNumber).padStart(3, '0')}.json`
  );

  try {
    const content = await loadFile(chapterPlotPath);
    if (content) {
      const plot = JSON.parse(content);
      return plot.meta?.locations || plot.locations || [];
    }
  } catch {
    // Failed to parse, return empty
  }

  return [];
}

/**
 * Collects foreshadowing context candidates
 *
 * NOTE: Foreshadowing is loaded as a SINGLE item containing only
 * the relevant items for the current chapter, not individual items.
 * This prevents token waste from duplicate file loading.
 */
async function collectForeshadowingCandidates(
  candidates: ContextItem[],
  chapterNumber: number,
  projectPath: string,
  config: Required<BudgetConfig>
): Promise<void> {
  const foreshadowingPath = path.join(projectPath, 'plot', 'foreshadowing.json');

  if (await fileExists(foreshadowingPath)) {
    const content = await loadFile(foreshadowingPath);
    if (content) {
      try {
        const foreshadowing = JSON.parse(content);
        const items = foreshadowing.items || foreshadowing;
        const itemsArray = Array.isArray(items) ? items : Object.values(items);

        // Filter relevant foreshadowing items for this chapter
        const relevantItems = itemsArray.filter((item) => {
          const fore = item as {
            id?: string;
            plant_chapter?: number;
            payoff_chapter?: number;
            status?: string;
          };

          // Skip paid off items unless config says otherwise
          if (!config.includeAllForeshadowing && fore.status === 'paid_off') {
            return false;
          }

          // Include if planted before/at current chapter and not yet paid off
          const planted = (fore.plant_chapter ?? 0) <= chapterNumber;
          const notPaidOff = !fore.payoff_chapter || fore.payoff_chapter >= chapterNumber;

          return planted && notPaidOff;
        });

        if (relevantItems.length > 0) {
          // Calculate priority based on highest-priority item (closest payoff)
          let maxPriority = 0;
          let hasRequired = false;

          for (const item of relevantItems) {
            const fore = item as { payoff_chapter?: number };
            const metadata: ItemMetadata = {
              currentChapter: chapterNumber,
              payoffChapter: fore.payoff_chapter,
            };
            const itemPriority = getPriority('foreshadowing', metadata);
            const itemRequired = isRequired('foreshadowing', metadata);

            if (itemPriority > maxPriority) maxPriority = itemPriority;
            if (itemRequired) hasRequired = true;
          }

          // Add as SINGLE consolidated item with filtered content
          candidates.push({
            id: 'foreshadowing-relevant',
            type: 'foreshadowing',
            path: foreshadowingPath,
            // Store filtered content directly to avoid re-loading full file
            content: JSON.stringify(relevantItems, null, 2),
            estimatedTokens: estimateTokens(JSON.stringify(relevantItems), 'json'),
            priority: maxPriority,
            required: hasRequired,
          });
        }
      } catch {
        // Parsing failed, add whole file
        candidates.push({
          id: 'foreshadowing-all',
          type: 'foreshadowing',
          path: foreshadowingPath,
          estimatedTokens: estimateTokensByPath(foreshadowingPath),
          priority: getPriority('foreshadowing', { currentChapter: chapterNumber }),
          required: false,
        });
      }
    }
  }
}

/**
 * Collects act summary candidates
 */
async function collectActSummaryCandidates(
  candidates: ContextItem[],
  chapterNumber: number,
  projectPath: string
): Promise<void> {
  const actsPath = path.join(projectPath, 'plot', 'acts');

  // Determine which act we're in (simple heuristic: 10 chapters per act)
  const currentAct = Math.ceil(chapterNumber / 10);

  // Include summary of previous act
  if (currentAct > 1) {
    const prevActPath = path.join(actsPath, `act_${currentAct - 1}_summary.md`);

    if (await fileExists(prevActPath)) {
      candidates.push({
        id: `act-summary-${currentAct - 1}`,
        type: 'act_summary',
        path: prevActPath,
        estimatedTokens: estimateTokensByPath(prevActPath),
        priority: getPriority('act_summary', { currentChapter: chapterNumber }),
        required: false,
      });
    }
  }
}

// ============================================================================
// Main Loader Function
// ============================================================================

/**
 * Loads context within the specified token budget
 *
 * Algorithm:
 * 1. Collect all context candidates
 * 2. Sort by priority (required first, then by priority score)
 * 3. Load items until budget is exhausted
 * 4. Record overflow items for reporting
 *
 * @param chapterNumber - Current chapter number
 * @param projectPath - Path to the novel project
 * @param budgetOrConfig - Token budget (number) or full config
 * @returns Context budget with loaded items
 *
 * @throws ContextOverflowError if required items exceed budget
 *
 * @example
 * ```typescript
 * const context = await loadContextWithBudget(50, '/path/to/novel', 80000);
 * console.log(`Loaded ${context.items.length} items using ${context.currentTokens} tokens`);
 * ```
 */
export async function loadContextWithBudget(
  chapterNumber: number,
  projectPath: string,
  budgetOrConfig: number | BudgetConfig = DEFAULT_BUDGET_CONFIG
): Promise<ContextBudget> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _startTime = Date.now();

  // Normalize config
  const config: Required<BudgetConfig> =
    typeof budgetOrConfig === 'number'
      ? { ...DEFAULT_BUDGET_CONFIG, maxTokens: budgetOrConfig }
      : { ...DEFAULT_BUDGET_CONFIG, ...budgetOrConfig };

  // Step 1: Collect all candidates
  const candidates = await collectCandidates(chapterNumber, projectPath, config);

  // Step 2: Sort by priority (required first, then by score descending)
  const sorted = sortByPriority(candidates);

  // Step 3: Load within budget
  const result: ContextBudget = {
    maxTokens: config.maxTokens,
    currentTokens: 0,
    items: [],
    overflow: [],
  };

  for (const item of sorted) {
    if (result.currentTokens + item.estimatedTokens <= config.maxTokens) {
      // Load the file content
      const content = await loadFile(item.path);
      if (content !== null) {
        // Re-estimate with actual content
        const actualTokens = estimateTokens(content, detectContentType(content));
        item.content = content;
        item.estimatedTokens = actualTokens;

        // Check again with actual tokens
        if (result.currentTokens + actualTokens <= config.maxTokens) {
          result.items.push(item);
          result.currentTokens += actualTokens;
        } else if (item.required) {
          // Required item doesn't fit
          throw new ContextOverflowError(
            `Required item ${item.id} exceeds budget. ` +
              `Need: ${actualTokens}, Available: ${config.maxTokens - result.currentTokens}`,
            actualTokens,
            config.maxTokens - result.currentTokens,
            [item]
          );
        } else {
          // Optional item doesn't fit
          result.overflow.push(item);
        }
      }
    } else if (item.required) {
      // Required item doesn't fit based on estimate
      throw new ContextOverflowError(
        `Required item ${item.id} exceeds budget. ` +
          `Need: ${item.estimatedTokens}, Available: ${config.maxTokens - result.currentTokens}`,
        item.estimatedTokens,
        config.maxTokens - result.currentTokens,
        [item]
      );
    } else {
      // Optional item exceeds budget
      result.overflow.push(item);
    }
  }

  return result;
}

/**
 * Extended loader that returns additional statistics
 *
 * @param chapterNumber - Current chapter number
 * @param projectPath - Path to the novel project
 * @param config - Budget configuration
 * @returns Load result with budget, warnings, and stats
 */
export async function loadContextWithStats(
  chapterNumber: number,
  projectPath: string,
  config: BudgetConfig = DEFAULT_BUDGET_CONFIG
): Promise<LoadContextResult> {
  const startTime = Date.now();
  const warnings: string[] = [];

  // Load context
  const budget = await loadContextWithBudget(chapterNumber, projectPath, config);

  // Generate warnings for overflow
  if (budget.overflow.length > 0) {
    const overflowIds = budget.overflow.map(i => i.id).join(', ');
    warnings.push(`Excluded items due to budget: ${overflowIds}`);
  }

  // Calculate stats
  const tokensByType: Record<ContextType, number> = {
    style: 0,
    plot: 0,
    summary: 0,
    character: 0,
    world: 0,
    foreshadowing: 0,
    act_summary: 0,
  };

  for (const item of budget.items) {
    tokensByType[item.type] += item.estimatedTokens;
  }

  const stats: LoadingStats = {
    totalCandidates: budget.items.length + budget.overflow.length,
    loadedItems: budget.items.length,
    excludedItems: budget.overflow.length,
    loadTimeMs: Date.now() - startTime,
    tokensByType,
  };

  return { budget, warnings, stats };
}

/**
 * Gets a summary of what context would be loaded without actually loading
 *
 * @param chapterNumber - Current chapter number
 * @param projectPath - Path to the novel project
 * @param config - Budget configuration
 * @returns Summary of context items
 */
export async function previewContextLoad(
  chapterNumber: number,
  projectPath: string,
  config: BudgetConfig = DEFAULT_BUDGET_CONFIG
): Promise<{
  candidates: Array<{ id: string; type: ContextType; estimatedTokens: number; priority: number }>;
  estimatedTotal: number;
  wouldOverflow: boolean;
}> {
  const fullConfig: Required<BudgetConfig> = {
    ...DEFAULT_BUDGET_CONFIG,
    ...config,
  };

  const candidates = await collectCandidates(chapterNumber, projectPath, fullConfig);
  const sorted = sortByPriority(candidates);

  const estimatedTotal = sorted.reduce((sum, item) => sum + item.estimatedTokens, 0);

  return {
    candidates: sorted.map(c => ({
      id: c.id,
      type: c.type,
      estimatedTokens: c.estimatedTokens,
      priority: c.priority,
    })),
    estimatedTotal,
    wouldOverflow: estimatedTotal > fullConfig.maxTokens,
  };
}
