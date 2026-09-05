import type { KnipConfig } from 'knip'

const config: KnipConfig = {
  entry: [
    'src/index.ts',
    'src/parser.ts',
    'src/resolver.ts',
    'src/utils.ts',
    'src/combinators.ts',
    'playground/bun/index.ts'
  ],
  ignore: ['playground/deno/**', 'bench/mitata.js', 'bench/positionals.js'],
  ignoreDependencies: ['mitata', 'pkg-pr-new'],
  rules: {
    catalog: 'off'
  }
}

export default config
