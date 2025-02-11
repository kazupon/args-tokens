import {
  comments,
  defineConfig,
  javascript,
  jsonc,
  markdown,
  prettier,
  promise,
  regexp,
  typescript,
  unicorn,
  vitest,
  yaml
} from '@kazupon/eslint-config'

const config: ReturnType<typeof defineConfig> = defineConfig(
  javascript(),
  typescript(),
  comments(),
  promise(),
  regexp(),
  unicorn(),
  jsonc({
    json: true,
    json5: true,
    jsonc: true
  }),
  yaml(),
  markdown(),
  vitest(),
  prettier(),
  {
    rules: {
      '@typescript-eslint/ban-ts-comment': 'off'
    }
  },
  {
    ignores: ['.vscode', '.github', 'lib', 'tsconfig.json', 'pnpm-lock.yaml', 'eslint.config.ts']
  }
)

export default config
