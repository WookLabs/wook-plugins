<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-01-18 -->

# context

## Purpose

Context budget system that manages token allocation for loading novel context files. Ensures context stays within LLM token limits while intelligently prioritizing the most relevant information for each chapter. Handles candidate collection, priority scoring, token estimation, and overflow management.

## Key Files

- **types.ts** - Type definitions for context system (ContextItem, ContextBudget, ContextType, BudgetConfig, LoadContextResult)
- **index.ts** - Main module barrel export; re-exports all submodule APIs
- **estimator.ts** - Token estimation engine with Korean/English language detection and per-file-type estimation
- **loader.ts** - Main loading logic: collects candidates, prioritizes, and loads within token budget
- **priorities.ts** - Priority calculation system based on chapter relevance and metadata
- **config.ts** - Configuration definitions and defaults
- **overflow-handler.ts** - Handles budget overflow: user choices, compression options, and validation

## Context Types Supported

- **style** - style-guide.json (600 tokens estimated)
- **plot** - chapter_N.json (900 tokens estimated)
- **summary** - chapter summaries (1400 tokens estimated)
- **character** - character profiles (1500 tokens estimated)
- **world** - locations and world settings (1000 tokens estimated)
- **foreshadowing** - active foreshadowing elements (400 tokens per item estimated)
- **act_summary** - act-level summaries (800 tokens estimated)

## For AI Agents

When working in context/:
1. Token estimation is critical - always use estimateTokens() for content and estimateTokensByPath() for files
2. Items marked as 'required' cannot be dropped; prioritize these first
3. Priority is calculated dynamically based on proximity to current chapter
4. Loader runs three phases: collect candidates → sort by priority → load within budget
5. When modifying candidate collection, update corresponding getter functions (getAppearingCharacters, getUsedLocations)
6. The system handles both exact token estimation (reading file) and quick estimation (by file type)
7. Foreshadowing items are virtualized from single file - modifications may need virtual item tracking

## Key Algorithms

**Token Estimation**: Counts Korean characters (~0.7 tokens), English words (~1.3 tokens), special chars (~0.5), with JSON overhead (+20%)

**Priority Sorting**: Required items first, then by priority score (higher=more important)

**Budget Loading**: Linear scan through sorted items, loading those that fit within remaining budget

## Dependencies

- **types.ts** - Context type definitions and error classes
- Imports file system utilities from Node.js fs/promises
- Uses path.js for file path handling

## Typical Usage

```typescript
// Load context for chapter with token budget
const result = await loadContextWithBudget(chapterNum, projectPath, 80000);

// Get preview without loading
const preview = await previewContextLoad(chapterNum, projectPath);

// Handle overflow interactively
if (result.overflow.length > 0) {
  const choice = await handleOverflow(result);
}
```

## Configuration

Default budget config (can be overridden):
- maxTokens: 80,000
- summaryDepth: 3 (include 3 previous chapter summaries)
- includeAllCharacters: false (only include appearing characters)
- includeAllForeshadowing: false (exclude paid-off foreshadowing)
