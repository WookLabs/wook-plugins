/**
 * Context Budget wrapper for Hook scripts
 * Calls compiled TypeScript module
 */
export async function loadChapterContext(chapterNumber, projectPath, budget = 80000) {
  try {
    // Dynamic import of compiled TypeScript
    const { loadContextWithBudget } = await import('../../dist/context/index.js');

    const context = await loadContextWithBudget(chapterNumber, projectPath, budget);

    if (context.overflow.length > 0) {
      console.warn(`[Context Budget] ${context.overflow.length} items excluded due to budget limit`);
      console.warn(`Excluded: ${context.overflow.map(i => i.id).join(', ')}`);
    }

    console.log(`[Context Budget] Loaded ${context.items.length} items (${context.currentTokens}/${context.maxTokens} tokens)`);

    return context;
  } catch (error) {
    console.error('[Context Budget] Error loading context:', error.message);
    throw error;
  }
}
