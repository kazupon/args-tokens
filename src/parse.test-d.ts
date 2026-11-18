import { expectTypeOf, test } from 'vite-plus/test'
import { parse } from './parse.ts'

import type { ParsedArgs, ParseOptions } from './parse.ts'
import type { Args } from './resolver.ts'

test('parse passthrough', () => {
  expectTypeOf<ParseOptions<Args>['passthrough']>().toEqualTypeOf<boolean | undefined>()
  expectTypeOf<ParsedArgs<Args>['passthroughIndices']>().toEqualTypeOf<number[]>()
  expectTypeOf<ParsedArgs<Args>['passthrough']>().toEqualTypeOf<string[]>()

  const args = { file: { type: 'positional' } } as const satisfies Args
  // without passthrough, the result has empty arrays, of the same types
  const result = parse([], { args })
  expectTypeOf(result.passthroughIndices).toEqualTypeOf<number[]>()
  expectTypeOf(result.passthrough).toEqualTypeOf<string[]>()
  const withPassthrough = parse([], { args, passthrough: true })
  expectTypeOf(withPassthrough.passthroughIndices).toEqualTypeOf<number[]>()
  expectTypeOf(withPassthrough.passthrough).toEqualTypeOf<string[]>()
})
