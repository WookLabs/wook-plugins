# Technology Stack

**Analysis Date:** 2026-02-05

## Languages

**Primary:**
- TypeScript 5.0.0 - Core plugin logic and type definitions (`src/**/*.ts`)

**Secondary:**
- Python 3.10+ - Schema validation hooks and Ralph loop persistence (`hooks/*.py`)
- JavaScript (Node.js) - Build scripts and CLI utilities (`scripts/*.mjs`)

## Runtime

**Environment:**
- Node.js 18.0.0+ (required)
- Python 3.10+ (required for schema validation and state persistence)

**Package Manager:**
- npm (from package.json)
- Lockfile: Not present in repository

## Frameworks

**Core:**
- TypeScript 5.0.0 - Static type system and compilation

**Testing:**
- Vitest 3.0.0 - Test runner with v8 coverage provider
- Node.js test globals - Built-in assertion framework

**Build/Dev:**
- tsc (TypeScript Compiler) - Compilation to ES2022
- rimraf 5.0.5 - Cross-platform file cleaning
- esbuild 0.24.0 - Fast bundling and transpilation
- json-schema-to-typescript 13.1.0 - Generate types from JSON schemas
- cross-env 7.0.3 - Cross-platform environment variables

## Key Dependencies

**Critical:**
- `zod` 3.25.0 - Schema validation and type parsing for runtime data validation
- `archiver` 6.0.1 - ZIP archive creation for project exports and backups

**Infrastructure:**
- `ajv` 8.12.0 (devDependency) - JSON schema validation for schema validation scripts
- `@types/node` 20.0.0 - TypeScript types for Node.js APIs (filesystem, process, paths)

## Configuration

**Environment:**
- ES2022 target for modern JavaScript features
- NodeNext module resolution for native ES modules
- Strict TypeScript compiler settings enabled
- Source maps enabled for debugging (`declarationMap: true`, `sourceMap: true`)

**Build:**
- TypeScript configuration: `tsconfig.json`
  - Output directory: `./dist`
  - Declaration files generated with source maps
  - Strict mode enforced: `"strict": true`
  - JSON module resolution enabled: `"resolveJsonModule": true`

**Testing:**
- Vitest configuration: `vitest.config.ts`
  - Node.js environment
  - Test files: `tests/**/*.test.ts`
  - Coverage provider: v8
  - Line coverage threshold: 80%
  - Global test APIs enabled

## Platform Requirements

**Development:**
- Node.js 18.0.0 or higher
- Python 3.10 or higher (for hooks)
- Git (for version control)
- npm (or compatible package manager)

**Production:**
- Claude Code environment (plugin system)
- Node.js 18.0.0+ runtime
- Python 3.10+ for hook execution
- File system access for project storage
- Estimated token budget: ~80K tokens for context loading per chapter

---

*Stack analysis: 2026-02-05*
