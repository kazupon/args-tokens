import { lintJsrExports } from 'jsr-exports-lint/tsdown'
import { defineConfig } from 'tsdown'

const config: ReturnType<typeof defineConfig> = defineConfig({
  entry: ['src/index.ts', 'src/parser.ts', 'src/resolver.ts', 'src/utils.ts'],
  outDir: 'lib',
  clean: true,
  dts: true,
  hooks: {
    'build:done': lintJsrExports()
  }
})

export default config
