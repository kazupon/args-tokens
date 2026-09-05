# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Vite+ commands, hooks, and the review checklist are in [AGENTS.md](./AGENTS.md).

## Project Overview

`args-tokens` is a high-performance command-line argument parser written in TypeScript. It provides a `parseArgs` tokens compatibility with Node.js's built-in `util.parseArgs` but with better performance and enhanced features.

## Development Commands

See [AGENTS.md](./AGENTS.md) for `vp install`, `vp check`, `vp test`, `vp pack`, and other Vite+ built-ins.

This repository also uses:

```sh
vpr check                 # vp check plus knip and deno check src
vp run lint:jsr           # JSR publish dry-run
vp run bench:mitata       # mitata benchmarks
vp run bench:vitest       # Vitest benchmarks
vp test src/parser.test.ts
vp test watch
GH_TOKEN="$(gh auth token)" vp run release
```

## Architecture

The library is structured into four main modules:

1. **parser.ts** (`/parser` export): Low-level token parser that transforms command-line arguments into tokens
   - `parseArgs()` function that processes args array into tokens
   - Compatible with Node.js `util.parseArgs` tokens format
   - Supports `allowCompatible` option for exact Node.js compatibility

2. **resolver.ts** (`/resolver` export): Resolves values from tokens based on option schemas
   - `resolveArgs()` function that takes tokens and schema to produce values
   - Handles type conversion, defaults, and validation
   - Supports boolean, string, and number types

3. **parse.ts** (main export): High-level convenience API that combines parsing and resolving
   - `parse()` function that does both tokenization and value resolution in one step
   - The recommended API for most use cases

4. **utils.ts** (`/utils` export): Utility functions used internally

The library uses a two-phase approach:

- First phase: Parse arguments into tokens (parser)
- Second phase: Resolve tokens into typed values based on schema (resolver)

## Testing Approach

- Uses Vite+ (`vp test`, Vitest) as the test runner
- Tests are colocated with source files (e.g., `parser.ts` → `parser.test.ts`)
- Snapshot testing is used for token output comparison
- Type definition tests use `.test-d.ts` suffix (e.g., `resolver.test-d.ts`)

## Important Notes

- The project uses ES modules exclusively
- TypeScript is configured with strict mode and isolated declarations
- The build output goes to the `lib/` directory
- Minimum Node.js version is 22
- The project is published to both npm and JSR (Deno registry)
- Package manager is pnpm (via Vite+ `vp`, packageManager pnpm@11.25.0)

## API docs style

jsdoc should be respected, not tsdoc.
