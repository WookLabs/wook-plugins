# External Integrations

**Analysis Date:** 2026-02-05

## APIs & External Services

**Claude AI Integration:**
- Claude Code plugin system - Core execution environment
  - Multi-agent orchestration for novel writing (18 specialized agents)
  - Model routing: Opus (complex tasks), Sonnet (standard), Haiku (simple)
  - Context management with token budgeting (~80K token limit per chapter)

**Alternative Model API (Reference):**
- Grok API - Optional fallback for generation (mentioned in `/write-grok` command)
  - Usage: Generation when Claude capacity is constrained
  - Location in code: Referenced in README.md, not actively integrated in src/

## Data Storage

**Databases:**
- None - Project uses local filesystem only

**File Storage:**
- Local filesystem structure: `novels/{novel_id}/`
  - Metadata: `meta/` (project.json, style-guide.json)
  - World-building: `world/` (world.json, locations.json, terms.json)
  - Characters: `characters/` (individual character JSONs, relationships.json)
  - Plot structure: `plot/` (structure.json, main-arc.json, sub-arcs/, foreshadowing.json, hooks.json)
  - Chapter content: `chapters/` (chapter_{N}.json metadata, chapter_{N}.md content)
  - Context: `context/summaries/` (chapter summaries for token budgeting)
  - Reviews: `reviews/` (evaluation results)
  - Exports: `exports/` (project archives via archiver)

**Caching:**
- In-memory token estimators: `src/context/estimator.ts`
  - `ESTIMATED_TOKENS_BY_FILE_TYPE` - Lookup table for file size to token conversion
  - `AVERAGE_TOKENS_BY_TYPE` - Per-category token estimates
- State caching: Ralph loop state persisted to `ralph-state.json`

## Authentication & Identity

**Auth Provider:**
- Claude Code session context - No explicit external auth
  - User identity managed by Claude Code environment
  - Plugin operates within authenticated Claude Code session
  - No API keys or external authentication required

**Implementation:**
- File-based state management: `src/state/lock.ts`, `src/state/backup.ts`
- Atomic writes with filesystem locks for concurrent safety
- Backup mechanism before state mutations

## Monitoring & Observability

**Error Tracking:**
- None - Local only

**Logs:**
- Console output via Claude Code standard output
- Python hook validation logging: `hooks/pretooluse.py` (schema validation messages)
- State detection logging: `scripts/novel-state-detector.mjs`

## CI/CD & Deployment

**Hosting:**
- Claude Marketplace (plugin distribution)
- GitHub repository: WookLabs/novel-dev (private repo)
  - GitHub authentication required: `GITHUB_TOKEN` for marketplace add

**CI Pipeline:**
- npm scripts for local validation:
  - `npm run validate:schemas` - JSON schema validation
  - `npm run validate:agents` - Agent configuration validation
  - `npm run verify:build` - Build verification
  - `npm run test` - Unit tests via Vitest
  - `npm run test:coverage` - Coverage reports

**Installation Methods:**
1. Marketplace via `GITHUB_TOKEN`: `claude plugin install novel-dev@novel-dev`
2. Local installation: Git clone + `.claude/settings.json` plugin registration

## Environment Configuration

**Required env vars:**
- `GITHUB_TOKEN` - For marketplace installation and updates (optional, for private repo)
- `CLAUDE_PLUGIN_ROOT` - Runtime variable for hook script paths (set by plugin system)

**Secrets location:**
- None - No external secrets needed
- GitHub token only used for initial installation/updates

## Webhooks & Callbacks

**Incoming:**
- None

**Outgoing (Hook System):**

The plugin uses Claude Code hooks for workflow control and validation:

**SessionStart Hook:**
- Purpose: Display project status on session initialization
- Implementation: `scripts/session-start.mjs`
- Timeout: 5000ms

**UserPromptSubmit Hook:**
- Purpose: Detect novel writing state and Ralph loop mode
- Implementation: `scripts/novel-state-detector.mjs`
- Timeout: 5000ms

**PreToolUse Hook:**
- General reminder for all tools: `scripts/pre-tool-reminder.mjs` (3000ms)
- JSON schema validation for Write operations: `hooks/pretooluse.py` (10000ms)
  - Validates: chapter.json, project.json, character.json, world.json, plot.json, foreshadowing.json, ralph-state.json, hooks.json, sub-arc.json
  - Patterns: `SCHEMA_PATTERNS` dictionary in pretooluse.py
  - Decision: Block write if validation fails, approve otherwise

**PostToolUse Hook:**
- Purpose: Verify tool output and trigger quality gates
- Implementation: `scripts/post-tool-verifier.mjs`
- Timeout: 3000ms

**Stop Hook:**
- Act completion tracking: `scripts/act-completion.mjs` (5000ms)
- Ralph loop persistence: `hooks/stop.py` (5000ms)
  - Prevents premature exit during write-all execution
  - Manages ralph-state.json updates
  - Timeout: 5000ms

## Integration Patterns

**State Management:**
- Location: `src/state/` module
  - Lock-based concurrency: `lock.ts` (filesystem-based locks)
  - Backup on mutations: `backup.ts` (atomic write safety)
- Ralph Loop State: `ralph-state.json` structure defined in `src/types.ts`
- State files validated by PreToolUse hook before write

**Context Budgeting:**
- Module: `src/context/`
- Features:
  - Token estimation: `estimator.ts` (file-type based, language-aware for Korean)
  - Priority-based loading: `priorities.ts` (required vs optional content)
  - Overflow handling: `overflow-handler.ts` (graceful degradation when budget exceeded)
  - Batch loading: `loader.ts` with stats tracking

**Quality Gate:**
- Module: `src/retry/quality-gate.ts`
- Threshold: 70 points
- Retry strategy escalation:
  1. Revise only
  2. Revise with critic feedback
  3. Partial rewrite of lowest-scoring section
  4. User intervention required

---

*Integration audit: 2026-02-05*
