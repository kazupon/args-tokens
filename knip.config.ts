import type { KnipConfig } from 'knip'

const config: KnipConfig = {
  entry: ['playground/bun/index.ts'],
  ignore: ['playground/deno/**', 'bench/mitata.js'],
  ignoreDependencies: ['lint-staged', 'mitata', 'deno']
}

export default config
