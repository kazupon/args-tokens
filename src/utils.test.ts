import { describe, expect, test } from 'vitest'
import { kebabnize } from './utils.ts'

describe('kebabnize', () => {
  test('simple camelCase to kebab-case', () => {
    expect(kebabnize('camelCase')).toBe('camel-case')
  })

  test('complex camelCase to kebab-case', () => {
    expect(kebabnize('camelCaseComplexCase')).toBe('camel-case-complex-case')
  })
})
