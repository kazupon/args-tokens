import { lintJsrExports } from 'jsr-exports-lint/tsdown'
import { defineConfig } from 'vite-plus'
import {
  defaultIgnoreFilesOfEnforceHeaderCommentRule,
  defineFmtConfig,
  defineLintConfig
} from '@kazupon/vp-config'

export default defineConfig({
  staged: {
    '*': 'vp check --fix'
  },
  pack: {
    entry: [
      'src/index.ts',
      'src/parser.ts',
      'src/resolver.ts',
      'src/utils.ts',
      'src/combinators.ts'
    ],
    outDir: 'lib',
    clean: true,
    dts: true,
    fixedExtension: false,
    hooks: {
      'build:done': lintJsrExports()
    }
  },
  test: {
    typecheck: { enabled: true }
  },
  lint: defineLintConfig({
    ignorePatterns: [
      '.plans/**',
      '.notes/**',
      '.vscode',
      'lib',
      'docs',
      'tsconfig.json',
      'CHANGELOG.md',
      'playground/deno/**',
      'playground/bun/**'
    ],
    comments: {
      noTagComments: {
        tags: ['TODO', 'FIXME', 'BUG']
      },
      enForceHeaderComment: {
        ignoreFiles: [...defaultIgnoreFilesOfEnforceHeaderCommentRule, 'bench/**']
      }
    },
    jsdoc: { typescript: 'syntax' },
    regexp: {},
    overrides: [
      {
        files: ['bench/**/*.{js,mjs,cjs,ts}'],
        rules: { '@kazupon/enforce-header-comment': 'off' }
      }
    ]
  }),
  fmt: defineFmtConfig({
    printWidth: 100,
    ignorePatterns: ['CHANGELOG.md', 'docs/**/*.md', 'playground/**']
  })
})
