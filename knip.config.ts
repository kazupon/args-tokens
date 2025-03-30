import type { KnipConfig } from 'knip'

export default {
  entry: ['src/index.ts', 'playground/bun/index.ts', 'eslint.config.ts'],
  ignore: ['playground/deno/**', 'bench/mitata.js'],
  ignoreDependencies: ['lint-staged', 'mitata', 'deno']
} satisfies KnipConfig
