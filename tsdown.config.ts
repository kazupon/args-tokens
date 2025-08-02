import { lintJsrExports } from 'jsr-exports-lint/tsdown'
import { defineConfig } from 'tsdown'

import type { UserConfig } from 'tsdown'

const config: UserConfig = defineConfig({
  entry: ['src/index.ts', 'src/parser.ts', 'src/resolver.ts', 'src/utils.ts'],
  outDir: 'lib',
  clean: true,
  dts: true,
  hooks: {
    'build:done': lintJsrExports()
  }
})

export default config
