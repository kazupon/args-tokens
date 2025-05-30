import { describe, expect, test } from 'vitest'
import { kebabnize } from './utils.ts'

describe('kebabnize', () => {
  test('simple camelCase to kebab-case', () => {
    expect(kebabnize('camelCase')).toBe('camel-case')
  })

  test('complext camelCase to kebab-case', () => {
    expect(kebabnize('camelCaseComplextCase')).toBe('camel-case-complext-case')
  })
})
