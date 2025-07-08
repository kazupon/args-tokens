# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

`args-tokens` is a high-performance command-line argument parser written in TypeScript. It provides a `parseArgs` tokens compatibility with Node.js's built-in `util.parseArgs` but with better performance and enhanced features.

## Development Commands

### Setup

```sh
pnpm install
```

### Build

```sh
pnpm build        # Build the project using tsdown
```

### Testing

```sh
pnpm test         # Run tests with typecheck using Vitest
vitest            # Run tests in watch mode

# Run specific test file
vitest src/parser.test.ts
```

### Linting and Code Quality

```bash
pnpm lint         # Run all linters in parallel (eslint, prettier, knip, jsr)
pnpm lint:eslint  # Run ESLint only
pnpm lint:prettier # Check formatting

pnpm fix          # Fix all issues (eslint, prettier, knip)
pnpm fix:eslint   # Fix ESLint issues
pnpm fix:prettier # Fix formatting

pnpm typecheck    # Run TypeScript type checking (tsc and deno)
```

### Development

```bash
pnpm dev:eslint   # Open ESLint config inspector
```

### Benchmarking

```bash
pnpm bench:mitata # Run performance benchmarks with mitata
pnpm bench:vitest # Run performance benchmarks with vitest
```

### Release

```bash
pnpm release      # Create a new release
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

- Uses Vitest as the test runner
- Tests are colocated with source files (e.g., `parser.ts` → `parser.test.ts`)
- Snapshot testing is used for token output comparison
- Type definition tests use `.test-d.ts` suffix (e.g., `resolver.test-d.ts`)

## Important Notes

- The project uses ES modules exclusively
- TypeScript is configured with strict mode and isolated declarations
- The build output goes to the `lib/` directory
- Minimum Node.js version is 20
- The project is published to both npm and JSR (Deno registry)
- Package manager is pnpm (version 10.12.4)

## API docs style

jsdoc should be respected, not tsdoc.
