import {
  comments,
  defineConfig,
  javascript,
  jsdoc,
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
import { globalIgnores } from 'eslint/config'

import type { Linter } from 'eslint'

const config: ReturnType<typeof defineConfig> = defineConfig(
  javascript(),
  typescript(),
  comments({
    kazupon: {
      ignores: [
        '**/*.test.ts',
        '**/*.test.js',
        '**/*.test-d.ts',
        '**/*.spec.ts',
        '**/*.spec.js',
        'bench/**.js'
      ]
    }
  }),
  jsdoc({
    typescript: 'syntax'
  }),
  promise(),
  regexp(),
  unicorn(),
  jsonc({
    json: true,
    json5: true,
    jsonc: true
  }),
  yaml({
    rules: {
      'yml/quotes': 'off'
    }
  }),
  markdown({
    inlineCodeWords: [
      'args-tokens',
      'util.parseArgs',
      'pkgjs/parseargs',
      'parseArgs',
      'resolveArgs',
      'ArgSchema'
    ]
  }),
  vitest(),
  prettier(),
  {
    rules: {
      '@typescript-eslint/ban-ts-comment': 'off',
      'unicorn/prevent-abbreviations': 'off',
      'unicorn/filename-case': 'off'
    }
  },
  globalIgnores([
    '.vscode',
    'lib',
    'tsconfig.json',
    'CHANGELOG.md',
    'playground/deno/**',
    'playground/bun/**',
    'pnpm-lock.yaml'
  ]) as Linter.Config
)

export default config
