import type { KnipConfig } from 'knip'

const config: KnipConfig = {
  entry: ['playground/bun/index.ts'],
  ignore: ['playground/deno/**', 'bench/mitata.js'],
  ignoreDependencies: [
    'lint-staged',
    'mitata',
    'deno',
    '@kazupon/eslint-plugin',
    '@typescript/native-preview'
  ]
}

export default config
