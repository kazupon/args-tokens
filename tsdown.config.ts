import { defineConfig } from 'tsdown'
import { jsrExportsLint } from 'tsdown-jsr-exports-lint'

const config: ReturnType<typeof defineConfig> = defineConfig({
  entry: ['src/index.ts', 'src/parser.ts', 'src/resolver.ts'],
  outDir: 'lib',
  clean: true,
  dts: true,
  onSuccess: jsrExportsLint()
})

export default config
