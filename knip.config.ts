import type { KnipConfig } from 'knip'

export default {
  entry: ['src/index.ts', 'bench/index.mjs', 'eslint.config.ts'],
  ignoreDependencies: ['lint-staged']
} satisfies KnipConfig
