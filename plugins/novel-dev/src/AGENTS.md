<!-- Generated: 2026-01-18 -->

# src

## Purpose

Core source directory for Novel Sisyphus. Contains shared type definitions and three specialized modules for context management, retry logic, and state file operations. Acts as the foundation for the novel generation system's token budgeting, quality assurance, and persistent state handling.

## Key Files

- **types.ts** - Comprehensive TypeScript type definitions for all novel-related structures including Project, StyleGuide, Character, Plot, Chapter, and State types. Central type repository for the entire system.

## Subdirectories

- **context/** - Context budget system for loading novel context files within LLM token limits
- **retry/** - Retry logic and quality gate strategies for content generation
- **state/** - State file management with locking and backup mechanisms

## For AI Agents

When working in the src directory:
1. Refer to src/types.ts for all shared type definitions before creating new types
2. Each subdirectory is self-contained with its own index.ts barrel export
3. All modules use TypeScript with strict typing and JSDoc documentation
4. When adding features, update relevant types in types.ts first, then implement in specific modules
5. State mutations should always use state/ module utilities (locks, backups)
6. Context loading respects token budgets - coordinate with context/ module for token estimates

## Dependencies

- **types.ts** is imported by all three modules (context, retry, state)
- context/ module handles token budgeting for context items
- retry/ module determines retry strategies based on quality scores
- state/ module protects concurrent access to state files

## Technology

- **Language**: TypeScript with strict mode
- **Environment**: Node.js runtime
- **File I/O**: Uses async fs/promises for all file operations
- **Token System**: Specialized token estimation for Korean and English content
