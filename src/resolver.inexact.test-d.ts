import { expectTypeOf, test } from 'vite-plus/test'

import type { ArgValues } from './resolver.ts'

// type-checked only without exactOptionalPropertyTypes: with it, a schema whose required may be
// undefined is not an ArgSchema

test('ArgValues types a positional argument whose required may be undefined', () => {
  expectTypeOf<
    ArgValues<{
      maybe: { type: 'positional'; required: boolean | undefined }
      fallback: { type: 'positional'; required: boolean | undefined; default: 'x' }
    }>
  >().toEqualTypeOf<{ maybe?: string; fallback: string }>()
})
