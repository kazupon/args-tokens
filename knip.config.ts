import type { KnipConfig } from 'knip'

export default {
  entry: ['src/index.ts', 'playground/bun/index.ts', 'eslint.config.ts'],
  ignore: ['playground/deno/**', 'bench/index.js'],
  ignoreDependencies: ['lint-staged']
} satisfies KnipConfig
