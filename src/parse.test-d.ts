import { expectTypeOf, test } from 'vite-plus/test'
import { parse } from './parse.ts'

import type { ParsedArgs, ParseOptions } from './parse.ts'
import type { Args } from './resolver.ts'

test('parse passthrough', () => {
  expectTypeOf<ParseOptions<Args>['passthrough']>().toEqualTypeOf<boolean | undefined>()
  expectTypeOf<ParsedArgs<Args>>().not.toHaveProperty('passthroughIndices')
  expectTypeOf<ParsedArgs<Args>>().not.toHaveProperty('passthrough')

  const args = { file: { type: 'positional' } } as const satisfies Args
  // with `passthrough: true`, the result has `passthroughIndices` and `passthrough`
  const withPassthrough = parse([], { args, passthrough: true })
  expectTypeOf(withPassthrough.passthroughIndices).toEqualTypeOf<number[]>()
  expectTypeOf(withPassthrough.passthrough).toEqualTypeOf<string[]>()
  expectTypeOf(withPassthrough.values).toEqualTypeOf<{ file: string }>()
  // without it, or with `false`, the result does not have them
  expectTypeOf(parse([], { args })).not.toHaveProperty('passthrough')
  expectTypeOf(parse([], { args, passthrough: false })).not.toHaveProperty('passthroughIndices')
  // with a boolean, the result may have them
  const passthrough = Math.random() > 0.5
  const result = parse([], { args, passthrough })
  expectTypeOf(result.passthroughIndices).toEqualTypeOf<number[] | undefined>()
  expectTypeOf(result.passthrough).toEqualTypeOf<string[] | undefined>()
})
