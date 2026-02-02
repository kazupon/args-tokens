import {
  comments,
  defineConfig,
  jsdoc,
  jsonc,
  markdown,
  oxlint,
  typescript,
  yaml
} from '@kazupon/eslint-config'

const config: ReturnType<typeof defineConfig> = defineConfig(
  typescript({
    parserOptions: {
      tsconfigRootDir: import.meta.dirname,
      project: true
    }
  }),
  comments({ kazupon: false }),
  jsdoc({
    typescript: 'syntax'
  }),
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
    preferences: true
  }),
  oxlint({
    presets: ['typescript'],
    configFile: './.oxlintrc.json'
  })
)

export default config
