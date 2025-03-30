import { defineConfig } from 'tsdown'

const config: ReturnType<typeof defineConfig> = defineConfig({
  entry: ['src/index.ts', 'src/parser.ts', 'src/resolver.ts'],
  outDir: 'lib',
  dts: true
})

export default config
