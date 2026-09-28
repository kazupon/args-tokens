import { lintJsrExports } from 'jsr-exports-lint/tsdown'
import { configDefaults, defineConfig } from 'vite-plus'
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
    projects: [
      {
        extends: true,
        test: {
          name: 'default',
          typecheck: {
            enabled: true,
            exclude: [...configDefaults.typecheck.exclude, 'src/**/*.inexact.test-d.ts']
          }
        }
      },
      {
        // type-check the sources and all the type tests without exactOptionalPropertyTypes too,
        // which tsconfig.json turns on. A type test that can only be written without it goes into a
        // *.inexact.test-d.ts file, which tsconfig.json and the default project leave out; vp check
        // and the editor type-check such a file with the default options, without @types/node
        extends: true,
        test: {
          name: 'inexact',
          include: [],
          benchmark: { include: [] },
          typecheck: {
            enabled: true,
            only: true,
            include: ['src/**/*.test-d.ts'],
            tsconfig: './tsconfig.inexact.json'
          }
        }
      }
    ]
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
    ignorePatterns: ['CHANGELOG.md', 'playground/**'],
    overrides: [
      {
        // the API references keep the line breaks of the JSDoc prose, which 'never' would join
        files: ['docs/**/*.md'],
        options: { proseWrap: 'preserve' }
      }
    ]
  })
})
