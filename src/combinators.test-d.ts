import { expectTypeOf, test } from 'vitest'
import {
  args,
  boolean,
  choice,
  combinator,
  describe,
  extend,
  float,
  integer,
  map,
  merge,
  multiple,
  number,
  positional,
  required,
  short,
  string,
  unrequired,
  withDefault
} from './combinators.ts'

import type { ArgValues, ExtractOptionValue } from './resolver.ts'

test('base combinator type inference', () => {
  // string() → string
  expectTypeOf<ExtractOptionValue<ReturnType<typeof string>>>().toEqualTypeOf<string>()

  // number() → number
  expectTypeOf<ExtractOptionValue<ReturnType<typeof number>>>().toEqualTypeOf<number>()

  // integer() → number
  expectTypeOf<ExtractOptionValue<ReturnType<typeof integer>>>().toEqualTypeOf<number>()

  // float() → number
  expectTypeOf<ExtractOptionValue<ReturnType<typeof float>>>().toEqualTypeOf<number>()

  // boolean() → boolean
  expectTypeOf<ExtractOptionValue<ReturnType<typeof boolean>>>().toEqualTypeOf<boolean>()
})

test('positional type inference', () => {
  // positional() → string
  const pos = positional()
  expectTypeOf<ExtractOptionValue<typeof pos>>().toEqualTypeOf<string>()

  // positional(integer()) → number
  const posInt = positional(integer())
  expectTypeOf<ExtractOptionValue<typeof posInt>>().toEqualTypeOf<number>()
})

test('custom combinator type inference', () => {
  // combinator({ parse: Number }) → number
  const num = combinator({ parse: Number })
  expectTypeOf<ExtractOptionValue<typeof num>>().toEqualTypeOf<number>()

  // combinator({ parse: (v) => new Date(v) }) → Date
  const date = combinator({ parse: (v: string) => new Date(v) })
  expectTypeOf<ExtractOptionValue<typeof date>>().toEqualTypeOf<Date>()

  // combinator({ parse: (v) => v }) → string
  const str = combinator({ parse: (v: string) => v })
  expectTypeOf<ExtractOptionValue<typeof str>>().toEqualTypeOf<string>()
})

test('custom combinator with modifier combinators type inference', () => {
  const num = combinator({ parse: Number })

  // multiple
  const multi = multiple(num)
  expectTypeOf<ExtractOptionValue<typeof multi>>().toEqualTypeOf<number[]>()

  // map
  const mapped = map(num, n => String(n))
  expectTypeOf<ExtractOptionValue<typeof mapped>>().toEqualTypeOf<string>()

  // withDefault
  const withDef = withDefault(num, 0)
  expectTypeOf<ExtractOptionValue<typeof withDef>>().toEqualTypeOf<number>()

  // required
  const req = required(num)
  expectTypeOf<ExtractOptionValue<typeof req>>().toEqualTypeOf<number>()

  // short
  const sh = short(num, 'n')
  expectTypeOf<ExtractOptionValue<typeof sh>>().toEqualTypeOf<number>()
})

test('choice literal type inference', () => {
  const schema = choice(['debug', 'info', 'warn'] as const)
  expectTypeOf<ExtractOptionValue<typeof schema>>().toEqualTypeOf<'debug' | 'info' | 'warn'>()
})

test('map type inference', () => {
  // map(integer(), n => String(n)) → string
  const mapped = map(integer(), n => String(n))
  expectTypeOf<ExtractOptionValue<typeof mapped>>().toEqualTypeOf<string>()

  // map(boolean(), b => b ? 1 : 0) → 0 | 1
  const boolMapped = map(boolean(), b => (b ? 1 : 0))
  expectTypeOf<ExtractOptionValue<typeof boolMapped>>().toEqualTypeOf<0 | 1>()
})

test('withDefault type inference', () => {
  const withDef = withDefault(integer(), 8080)
  expectTypeOf<ExtractOptionValue<typeof withDef>>().toEqualTypeOf<number>()

  const boolDef = withDefault(boolean(), false)
  expectTypeOf<ExtractOptionValue<typeof boolDef>>().toEqualTypeOf<boolean>()
})

test('multiple type inference', () => {
  const multi = multiple(string())
  expectTypeOf<ExtractOptionValue<typeof multi>>().toEqualTypeOf<string[]>()
})

test('required type inference', () => {
  const req = required(string())
  expectTypeOf<ExtractOptionValue<typeof req>>().toEqualTypeOf<string>()

  const reqNum = required(integer())
  expectTypeOf<ExtractOptionValue<typeof reqNum>>().toEqualTypeOf<number>()
})

test('short type inference', () => {
  const sh = short(boolean(), 'v')
  expectTypeOf<ExtractOptionValue<typeof sh>>().toEqualTypeOf<boolean>()

  const shStr = short(string(), 'n')
  expectTypeOf<ExtractOptionValue<typeof shStr>>().toEqualTypeOf<string>()
})

test('required + short composition type inference', () => {
  const composed = required(short(integer(), 'p'))
  expectTypeOf<ExtractOptionValue<typeof composed>>().toEqualTypeOf<number>()
})

test('ArgValues with combinators', () => {
  const args = {
    host: string(),
    port: { ...withDefault(integer(), 8080), short: 'p' as const },
    verbose: boolean({ negatable: true }),
    command: positional(),
    count: positional(integer()),
    level: choice(['debug', 'info'] as const),
    tags: multiple(string())
  }

  type Values = ArgValues<typeof args>
  expectTypeOf<Values['port']>().toEqualTypeOf<number>() // non-optional (has default)
  expectTypeOf<Values['command']>().toEqualTypeOf<string>() // positional is always required
  expectTypeOf<Values['count']>().toEqualTypeOf<number>() // positional is always required
})

test('args() infers exact literal type', () => {
  const schema = args({
    name: string(),
    port: withDefault(integer(), 8080),
    verbose: boolean()
  })
  type Values = ArgValues<typeof schema>
  expectTypeOf<Values['port']>().toEqualTypeOf<number>() // non-optional (has default)
})

test('merge() includes all fields', () => {
  const a = args({ foo: string() })
  const b = args({ bar: integer() })
  const merged = merge(a, b)
  type Values = ArgValues<typeof merged>
  expectTypeOf<Values>().toHaveProperty('foo')
  expectTypeOf<Values>().toHaveProperty('bar')
})

test('merge() last-write-wins on key conflict', () => {
  const a = args({ port: string() })
  const b = args({ port: withDefault(integer(), 8080) })
  const merged = merge(a, b)
  type Values = ArgValues<typeof merged>
  expectTypeOf<Values['port']>().toEqualTypeOf<number>() // b's type wins
})

test('extend() returns overridden type', () => {
  const base = args({ port: withDefault(integer(), 8080), host: string() })
  const extended = extend(base, { port: required(integer()) })
  type Values = ArgValues<typeof extended>
  expectTypeOf<Values['port']>().toEqualTypeOf<number>()
  expectTypeOf<Values>().toHaveProperty('host')
})

test('ArgValues with merge() infers required / default / optional correctly', () => {
  const schema = merge(
    args({ name: required(string()) }),
    args({ port: withDefault(integer(), 8080) }),
    args({ verbose: boolean() })
  )
  type Values = ArgValues<typeof schema>
  expectTypeOf<Values['name']>().toEqualTypeOf<string>() // required
  expectTypeOf<Values['port']>().toEqualTypeOf<number>() // non-optional (has default)
})

test('describe type inference', () => {
  const described = describe(string(), 'Your name')
  expectTypeOf<ExtractOptionValue<typeof described>>().toEqualTypeOf<string>()
  expectTypeOf(described.description).toEqualTypeOf<'Your name'>()
})

test('unrequired type inference', () => {
  const unreq = unrequired(string())
  expectTypeOf<ExtractOptionValue<typeof unreq>>().toEqualTypeOf<string>()
  expectTypeOf(unreq.required).toEqualTypeOf<false>()
})

test('describe + modifier composition type inference', () => {
  const composed = required(describe(short(integer(), 'p'), 'Port number'))
  expectTypeOf<ExtractOptionValue<typeof composed>>().toEqualTypeOf<number>()
})

test('unrequired overrides required type', () => {
  const composed = unrequired(required(string()))
  expectTypeOf(composed.required).toEqualTypeOf<false>()
  expectTypeOf<ExtractOptionValue<typeof composed>>().toEqualTypeOf<string>()
})
