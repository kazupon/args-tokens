import type { KnipConfig } from 'knip'

export default {
  entry: ['src/index.ts', 'playground/bun/index.ts', 'bench/index.mjs', 'eslint.config.ts'],
  ignore: ['playground/deno/**'],
  ignoreDependencies: ['lint-staged']
} satisfies KnipConfig
