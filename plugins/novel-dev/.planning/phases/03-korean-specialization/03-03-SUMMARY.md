---
phase: "03"
plan: "03"
subsystem: korean-texture
tags: [korean, texture, onomatopoeia, mimetic, 의성어, 의태어]
requires:
  - 02-02 (Quality Oracle foundation)
  - 02-02 (Prose Surgeon routing)
provides:
  - Korean texture detection
  - Texture suggestion engine
  - Texture-enrichment directives
affects:
  - 03-04 (banned expressions may add more directives)
  - 04-* (quality assessment includes texture scoring)
tech-stack:
  added: []
  patterns:
    - "Context-aware texture matching"
    - "Segment-based density assessment"
key-files:
  created:
    - "src/korean/data/texture-library.json"
    - "src/korean/texture-library.ts"
    - "tests/korean/texture-library.test.ts"
  modified:
    - "src/pipeline/quality-oracle.ts"
    - "src/pipeline/prose-surgeon.ts"
    - "src/pipeline/types.ts"
    - "src/pipeline/revision-loop.ts"
decisions:
  - "[03-03-01] Texture library uses JSON data file for easy expansion"
  - "[03-03-02] Target texture density: 1 per 500 chars (configurable)"
  - "[03-03-03] Texture-enrichment is lowest priority directive (priority 6)"
  - "[03-03-04] assessKoreanTexture option defaults to true"
metrics:
  duration: "10 min"
  completed: "2026-02-05"
---

# Phase 03 Plan 03: Korean Texture Library Summary

Korean onomatopoeia (의성어) and mimetic words (의태어) injection system for natural prose texture.

## One-liner

Korean texture library with 73 categorized entries (emotion/sound/movement/visual/nature), context-aware suggestion engine (suggestTexture matching emotion/action), segment-based presence assessment (assessTexturePresence), and Quality Oracle integration generating 'texture-enrichment' directives for deficient passages.

## What Was Built

### 1. Texture Library Data (src/korean/data/texture-library.json)
- **73 entries** across 5 categories:
  - emotion (heartbeat, trembling, anxiety): 10 entries
  - sound (crying, laughter, speaking, breathing): 18 entries
  - movement (walking, running, falling, swaying): 17 entries
  - visual (light, appearance, gaze): 12 entries
  - nature (rain, wind, sun, cold): 16 entries
- Each entry includes:
  - `korean`: The Korean texture word
  - `intensity`: soft | medium | strong
  - `verbForm`: ~거리다 conjugation when applicable
  - `contexts`: Usage contexts for matching

### 2. Texture Suggestion Engine (src/korean/texture-library.ts)
- **suggestTexture(context, maxSuggestions)**: Context-aware matching
  - Matches by scene emotion (priority 1)
  - Matches by scene action (priority 2)
  - Respects intensity preference
  - Recommends verb forms for action contexts
  - Deduplicates suggestions
- **assessTexturePresence(content, targetPer500Chars)**: Density assessment
  - Scans for texture words and verb forms
  - Identifies deficient 500-char segments
  - Returns score (0-100), found textures, deficient segment locations
- **Filter functions**: getTexturesByCategory, getTexturesByContext, getTexturesBySubcategory, getTexturesByIntensity

### 3. Quality Oracle Integration (src/pipeline/quality-oracle.ts)
- Added `assessKoreanTexture` option (default: true)
- Added `textureContext` option for better suggestions
- New analysis step (step 5) assesses texture presence
- Generates `texture-enrichment` directives for deficient segments
  - Priority 6 (lowest - enhancement not fix)
  - Max 1 per pass
  - Max scope: 2 paragraphs
- Includes contextual suggestions when `textureContext` provided
- Added `koreanTexture` field to QualityAssessment output

### 4. Prose Surgeon Updates (src/pipeline/prose-surgeon.ts)
- Added `texture-enrichment` to MODEL_ROUTING
  - Model: opus (creative task)
  - Temperature: 0.7
- Added `texture-enrichment` to MAX_SCOPE_LIMITS: 2 paragraphs

### 5. Test Suite (tests/korean/texture-library.test.ts)
- **38 test cases** covering:
  - TEXTURE_ENTRIES loading and structure (7 tests)
  - suggestTexture context matching (10 tests)
  - assessTexturePresence detection and scoring (8 tests)
  - Filter functions (9 tests)
  - Integration scenarios (2 tests)

## Verification Evidence

```bash
# TypeScript build
$ npx tsc
# No errors

# Texture library tests
$ npm test -- tests/korean/texture-library.test.ts
# 38 passed

# Quality Oracle tests
$ npm test -- tests/pipeline/quality-oracle.test.ts
# 53 passed

# Revision Loop tests
$ npm test -- tests/pipeline/revision-loop.test.ts
# 28 passed

# Entry count
$ node -e "const fs=require('fs'); const d=JSON.parse(fs.readFileSync('src/korean/data/texture-library.json')); let c=0; for(const [k,v] of Object.entries(d.categories)) for(const [k2,v2] of Object.entries(v)) c+=v2.length; console.log(c);"
# 73
```

## Decisions Made

| ID | Decision | Rationale |
|----|----------|-----------|
| 03-03-01 | Texture library uses JSON data file | Easy expansion without code changes |
| 03-03-02 | Target: 1 texture per 500 chars | Per RESEARCH.md: 1-2 per 500 chars avoids forced feeling |
| 03-03-03 | Priority 6 for texture directives | Enhancement, not fix - lower than filter words (2), sensory (4), rhythm (5) |
| 03-03-04 | assessKoreanTexture defaults to true | Korean texture is expected for natural Korean prose |

## Known Issues

- Verb form detection uses exact dictionary form match ("살금거리다") not conjugated forms ("살금거렸다")
  - This is intentional for simplicity; real prose rarely uses dictionary form verbatim
  - Future enhancement: Add stem-based matching for conjugated forms

## Deviations from Plan

None - plan executed exactly as written.

## Next Phase Readiness

Phase 3 Plan 4 (Banned Expressions) can proceed:
- Quality Oracle now supports Korean-specific directive types
- Prose Surgeon has routing for Korean fixes
- Pattern established for keyword-based detection -> directive generation

## Commits

| Hash | Type | Description |
|------|------|-------------|
| f5c8287 | feat | Create Korean texture library data and module |
| a649b37 | feat | Integrate texture assessment with Quality Oracle and Prose Surgeon |
| fb4f6d2 | test | Add comprehensive tests for Korean texture library |
