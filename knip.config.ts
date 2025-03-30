import type { KnipConfig } from 'knip'

const config: KnipConfig = {
  entry: ['src/index.ts', 'playground/bun/index.ts', 'eslint.config.ts'],
  ignore: ['playground/deno/**', 'bench/mitata.js'],
  ignoreDependencies: ['lint-staged', 'mitata', 'deno']
}

export default config
