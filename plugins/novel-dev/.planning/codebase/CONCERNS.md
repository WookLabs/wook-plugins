# Codebase Concerns

**Analysis Date:** 2026-02-05

## Tech Debt

**Token Estimation Accuracy:**
- Issue: Token estimation uses hardcoded factors (Korean: 0.7, English: 1.3, JSON overhead: 1.2x) without validation against actual Claude tokenizer behavior
- Files: `src/context/estimator.ts` (lines 22-26, 77-109), `src/context/loader.ts` (lines 531)
- Impact: Actual token usage can diverge from estimates by 10-30%, causing context overflow errors or wasted budget headroom
- Fix approach: Implement real tokenizer validation in test suite; track variance between estimated vs actual tokens; adjust factors based on empirical data from failed loads; consider adding config flag to calibrate factors

**Character Compression Fragility:**
- Issue: `compressCharacter()` uses unsafe optional chaining and assumes JSON structure without schema validation
- Files: `src/context/overflow-handler.ts` (lines 303-360)
- Impact: Malformed character JSON (missing `basic`, `inner`, or `appearance` fields) can produce incorrect compressed output that omits critical character information
- Fix approach: Validate character objects against schema before compression; add fallback handling for missing fields; test with 10+ edge case character structures; consider using Zod schema for runtime type safety

**Silent Error Swallowing:**
- Issue: Multiple `try/catch` blocks catch all errors and continue silently, hiding file parsing or data loading issues
- Files: `src/context/loader.ts` (lines 230-233, 257-259, 395, 434), `src/context/overflow-handler.ts` (line 356), `src/retry/quality-gate.ts` (no error handling)
- Impact: When character manifests, chapter plots, or location data is malformed, entire context items are silently dropped, potentially causing script inconsistencies without warning
- Fix approach: Log all caught exceptions with context; differentiate between "file not found" (expected) and "parse error" (unexpected); add debug mode flag to rethrow parse errors

**Priority Calculation Gaps:**
- Issue: `getPriority()` uses hardcoded distance thresholds (1-3 chapters) and priority values without documented basis for why these thresholds matter
- Files: `src/context/priorities.ts` (lines 71-100)
- Impact: Summaries from 4+ chapters back are assigned very low priority (priority = 3) and may be dropped, even if they contain critical foreshadowing payoffs; character priority doesn't account for importance to plot
- Fix approach: Document why each threshold and priority value was chosen; make configurable; add metadata field for "critical" characters/summaries that always load

**Stale Lock File Handling:**
- Issue: Lock timeout is hardcoded to 30 seconds, which may be too short for slow systems or too long for fast iteration
- Files: `src/state/lock.ts` (line 4)
- Impact: On slow systems, legitimate operations may timeout; on fast systems, stale locks from crashed processes delay acquisition by full timeout
- Fix approach: Make lock timeout configurable; improve stale lock detection by checking PID validity on Unix systems; add logarithmic backoff (100ms → 200ms → 400ms)

## Known Bugs

**Backup File Naming Collision:**
- Symptoms: Running multiple failed state operations in rapid succession may cause backup files to be overwritten
- Files: `src/state/backup.ts` (line 16)
- Trigger: Call `withStateBackup()` twice on same state file, where first operation fails after backup is created; second operation will restore first backup, not maintain independent backups
- Workaround: Add timestamps to backup file names; current design assumes single operation per file

**Overflow Handler Token Accounting Mismatch:**
- Symptoms: After calling `handleOverflow()` with Level 2 compression, `budget.currentTokens` may not accurately reflect the freed tokens
- Files: `src/context/overflow-handler.ts` (lines 234-247, 249-268)
- Trigger: Level 2 compression modifies `summary.estimatedTokens` and `budget.currentTokens` in place, but doesn't recalculate for all modified items before checking `targetFreed`
- Workaround: Always call `validateBudget()` after `handleOverflow()`; estimated tokens may not match actual content tokens

**Character Appearing Check Assumes Structure:**
- Symptoms: Chapters with missing or differently-structured `meta.characters` array cause character deduplication to fail
- Files: `src/context/loader.ts` (lines 252-259)
- Trigger: Chapter plot JSON with `characters` at root instead of `meta.characters`, or using character names instead of IDs
- Workaround: Ensure all chapter plots follow consistent structure with `meta.characters` as array of character IDs

## Security Considerations

**File Path Traversal Risk (Low):**
- Risk: `loadFile()` and file existence checks use user-provided project paths without validation
- Files: `src/context/loader.ts` (lines 36-46, 54-61), `src/state/backup.ts` (line 16, 20, 29)
- Current mitigation: Node.js `fs.promises` API prevents `../../../etc/passwd` style attacks; project path is typically set by plugin initialization
- Recommendations: Add path.resolve() to normalize project path; validate it's within expected plugin directory; reject paths containing `..` segments

**Lock File Creation Vulnerability (Low):**
- Risk: Lock file written with process PID but no timestamp validation; could allow fork bombing if process IDs are reused
- Files: `src/state/lock.ts` (lines 28-30)
- Current mitigation: 30-second stale lock timeout; lock file deleted after operation
- Recommendations: Add creation timestamp to lock file; validate PID is still running before assuming lock is stale (Unix: check `/proc/{pid}`)

**JSON Parse without Validation:**
- Risk: `JSON.parse()` called on untrusted file content from project directory; if project directory is user-writable, malicious JSON could cause issues
- Files: `src/context/loader.ts` (lines 254, 299), `src/context/overflow-handler.ts` (line 309)
- Current mitigation: Files are in user's own project directory; plugin initialization typically validates project structure
- Recommendations: Add schema validation with Zod after parsing; catch `SyntaxError` separately from other errors; return default/empty object instead of throwing

## Performance Bottlenecks

**Token Estimation is O(n) per file:**
- Problem: `estimateTokens()` scans entire content for Unicode ranges (Korean, Jamo, English, special chars) every call
- Files: `src/context/estimator.ts` (lines 82-101)
- Cause: 6 regex patterns applied to content on every estimation
- Improvement path: Cache estimation results by content hash; batch estimate multiple files in one pass; consider approximate estimation for very long content (sample first/last N chars)

**Priority Calculation Recalculates for Every Item:**
- Problem: `sortByPriority()` recalculates metadata and priority for each candidate, even identical types
- Files: `src/context/priorities.ts` (getPriority called per candidate), `src/context/loader.ts` (line 515)
- Cause: No memoization of priority values; metadata duplicated across candidates of same type
- Improvement path: Pre-calculate static metadata once per load call; use lookup tables instead of function calls

**Backup Copies Entire File Without Streaming:**
- Problem: `withStateBackup()` uses `copyFile()` which loads entire file into memory
- Files: `src/state/backup.ts` (lines 20, 29)
- Cause: State files can be large (100KB+) for long novels; backup operation blocks
- Improvement path: Use streaming copy for large files; compress backups; implement incremental backup tracking

**Context Loader Does Double Token Estimation:**
- Problem: Estimates tokens twice for each content item: once before load, once after with actual content
- Files: `src/context/loader.ts` (lines 531, 536)
- Cause: Estimated tokens may differ from actual; loader reestimates to get accurate budget accounting
- Improvement path: Use streaming estimate function that validates estimate + actual in single pass; batch load candidates before estimation

## Fragile Areas

**Compression Logic (Character and Summary):**
- Files: `src/context/overflow-handler.ts` (lines 276-298, 303-360), `src/context/overflow-handler.ts` (lines 369-436)
- Why fragile: Hard-coded max lengths, field selection, and fallback logic assumes specific character/summary JSON structure; no recovery for edge cases
- Safe modification: Before changing compression thresholds, test with actual generated character profiles; add fuzzing for malformed JSON; document what happens when compressed size still exceeds target
- Test coverage: `tests/` directory has no tests for overflow handler compression; only smoke tests for context loading

**Priority Thresholds (Summary Distance):**
- Files: `src/context/priorities.ts` (lines 71-100)
- Why fragile: Distance-based priority for summaries (distance=1 → priority 9, distance=2 → priority 7) has no documented reasoning; changing thresholds could break foreshadowing payoffs
- Safe modification: Add foreshadowing metadata that marks "must-keep" summaries; document why 3-chapter window is correct; add integration test that loads summaries for a chapter with active foreshadowing
- Test coverage: `tests/context/priorities.test.ts` exists but only tests base priority values, not dynamic calculations

**Lock Acquisition Retry Logic:**
- Files: `src/state/lock.ts` (lines 24-71)
- Why fragile: Stale lock detection based solely on mtime; no PID validation; retry loop has unbounded spin potential if timeout is very long
- Safe modification: Add `process.platform` check to validate PID on Unix; add exponential backoff formula; document timeout selection rationale; test with actual concurrent file operations
- Test coverage: `tests/state/state.test.ts` exists but doesn't test concurrent lock scenarios

**User Choice Generation (Level 3 Overflow):**
- Files: `src/context/overflow-handler.ts` (lines 369-436)
- Why fragile: Generates choices based on item type and priority, but `affectedItems` list may be stale if concurrent modifications happen; choice UI never implemented
- Safe modification: User choices are generated but have no corresponding `applyUserChoice()` integration in main loader; ensure choices are always applied before context returned
- Test coverage: Zero tests for user choice generation or application

## Scaling Limits

**Context Budget Hard Cap at Config.maxTokens:**
- Current capacity: 128k tokens (typical Claude context window)
- Limit: Cannot increase maxTokens beyond 128k without changing LLM model; cannot split context across requests
- Scaling path: Implement multi-request context loading (split chapters); implement priority-based shedding; cache frequently-accessed context (style guide, main arc) across requests

**Lock File Scalability:**
- Current capacity: Single exclusive lock per state file; no read-write lock differentiation
- Limit: Multiple concurrent readers blocked by single writer; stale lock timeout of 30s becomes blocking contention point
- Scaling path: Implement reader-writer lock pattern; add per-lock logging for debugging contention; consider moving to persistent key-value store (sqlite, redis) for state management

**Candidate Collection is O(n) File System Calls:**
- Current capacity: ~50 context items scanned per chapter load
- Limit: Each candidate requires `fileExists()` call (async stat); scales poorly with 50+ candidates
- Scaling path: Use `readdirSync()` once to cache directory contents; batch stat operations; implement lazy loading for optional candidates

**Character Manifest Parsing (Linear Scan):**
- Current capacity: Can handle ~100 characters per chapter
- Limit: `collectCandidates()` iterates all characters in manifest to find appearing ones; no indexing
- Scaling path: Index character IDs in chapter plot; implement quick skip for non-appearing characters; cache character manifest in memory

## Dependencies at Risk

**Zod (^3.25.0):**
- Risk: Currently imported but NOT used for validation; all JSON parsing is unvalidated `JSON.parse()`
- Impact: Schema drift between code assumptions and actual JSON files goes undetected
- Migration plan: Use Zod to validate all parsed JSON: `Character.parse()`, `Plot.parse()`, `StyleGuide.parse()`; add runtime validation in critical paths

**Archiver (^6.0.1):**
- Risk: Listed in dependencies but never imported or used in codebase
- Impact: Unused dependency inflates bundle size; suggests incomplete feature removal
- Migration plan: Remove if not planned for v4.x; if needed for export feature, implement and test compression

## Missing Critical Features

**No Incremental Backup/Restore:**
- Problem: Backup strategy only supports full file restore; no transaction support
- Blocks: Cannot implement "undo last change" feature; cannot implement partial state rollback
- Fix: Implement journal-based state management with sequence numbers; store incremental changes instead of full backups

**No Context Version Control:**
- Problem: Context items loaded have no metadata about when they were generated or which source version
- Blocks: Cannot detect stale context; cannot implement "context expired" warnings
- Fix: Add timestamp to each context item; track source file modification time; warn if context is older than source

**No Concurrent Write Protection at Plugin Level:**
- Problem: Multiple Claude instances could write to same state file simultaneously
- Blocks: Cannot safely run `/write-all` in parallel; lock file is best-effort
- Fix: Implement distributed lock (database-backed); add operation queue; implement conflict resolution for simultaneous writes

**No Token Budget Warnings:**
- Problem: Context loader silently drops items when overflow happens at Level 3
- Blocks: Users don't know what context was excluded; cannot make informed decisions about chapter length
- Fix: Add warning/debug output showing what was dropped and why; expose available choices to plugin UI; track overflow frequency in stats

## Test Coverage Gaps

**Overflow Handler:**
- What's not tested: Compression logic, Level 2 and Level 3 behavior, `applyUserChoice()` function, token counting accuracy after compression
- Files: `src/context/overflow-handler.ts` (522 lines, 0 tests)
- Risk: Core memory management feature has zero automated validation; compression could silently corrupt character data
- Priority: **High** - implement tests for: Level 2 compression with real character JSON, token accounting validation, multiple compression iterations

**Context Loader with Real Files:**
- What's not tested: `collectCandidates()` with missing optional files, `getAppearingCharacters()` with malformed chapter JSON, overflow handling integration
- Files: `src/context/loader.ts` (659 lines, ~5 integration tests in `smoke.test.ts`)
- Risk: Main entry point has minimal coverage; file path assumptions and fallback behavior untested
- Priority: **High** - implement tests for: missing files, malformed JSON, incomplete candidates, realistic project structures

**Priority Calculation with Metadata:**
- What's not tested: Dynamic priority adjustments based on chapter distance, character appearance, foreshadowing activation
- Files: `src/context/priorities.ts` (248 lines, basic tests exist)
- Risk: Priority thresholds have no validation; changing distances could break foreshadowing payoffs
- Priority: **Medium** - add tests for: summary distance penalties, character appearing flags, foreshadowing activation

**State Lock Concurrency:**
- What's not tested: Multiple simultaneous lock attempts, stale lock cleanup, lock timeout behavior
- Files: `src/state/lock.ts` (72 lines, 0 dedicated tests)
- Risk: Lock acquisition is critical path; race conditions could cause data corruption
- Priority: **Medium** - implement tests for: concurrent lock attempts, stale lock removal, timeout enforcement

**Character Compression Edge Cases:**
- What's not tested: Missing `inner`, `basic`, or `appearance` fields, very long names, special characters in fields
- Files: `src/context/overflow-handler.ts` (lines 303-360)
- Risk: Unsafe optional chaining and field access could produce corrupted compressed output
- Priority: **High** - add 15+ test cases with edge case character structures

---

*Concerns audit: 2026-02-05*
