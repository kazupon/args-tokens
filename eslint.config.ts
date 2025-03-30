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
      '@typescript-eslint/ban-ts-comment': 'off',
      'unicorn/prevent-abbreviations': 'off',
      'unicorn/filename-case': 'off'
    }
  },
  {
    ignores: [
      '.vscode',
      'lib',
      'tsconfig.json',
      'playground/deno/**',
      'playground/bun/**',
      'pnpm-lock.yaml'
    ]
  }
)

export default config
