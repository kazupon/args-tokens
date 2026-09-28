import { expectTypeOf, test } from 'vite-plus/test'
import { string } from './combinators.ts'

import type { ArgValues } from './resolver.ts'

// type-checked without exactOptionalPropertyTypes only: with it, the options do not take undefined

test('a required option that may be undefined leaves the value optional', () => {
  const strict = Math.random() > 0.5
  const args = { name: string({ required: strict || undefined }) }
  expectTypeOf<ArgValues<typeof args>>().toEqualTypeOf<{ name?: string }>()
})
