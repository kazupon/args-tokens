import { expectTypeOf, test } from 'vite-plus/test'
import {
  args,
  boolean,
  choice,
  combinator,
  describe,
  extend,
  float,
  hidden,
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

  // unrequired(positional()) → string value, optional in ArgValues
  const optionalPos = unrequired(positional())
  expectTypeOf<ExtractOptionValue<typeof optionalPos>>().toEqualTypeOf<string>()

  // unrequired(positional(integer())) → number value, optional in ArgValues
  const optionalPosInt = unrequired(positional(integer()))
  expectTypeOf<ExtractOptionValue<typeof optionalPosInt>>().toEqualTypeOf<number>()
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

  const choiceDef = withDefault(choice(['auto', 'always', 'never']), 'auto')
  expectTypeOf<ExtractOptionValue<typeof choiceDef>>().toEqualTypeOf<'auto' | 'always' | 'never'>()
  expectTypeOf(choiceDef.default).toEqualTypeOf<'auto' | 'always' | 'never'>()

  // the default of a mapped schema is a mapped value
  const mappedDef = withDefault(
    map(choice(['debug', 'info']), v => v.toUpperCase()),
    'INFO'
  )
  expectTypeOf<ExtractOptionValue<typeof mappedDef>>().toEqualTypeOf<string>()

  const explicitDef = withDefault<number>(integer(), 8080)
  expectTypeOf<ExtractOptionValue<typeof explicitDef>>().toEqualTypeOf<number>()

  // an explicit type argument widens the type, for a default typed wider than the choices
  const env: string = 'auto'
  const wideDef = withDefault<string>(choice(['auto', 'always', 'never']), env)
  expectTypeOf<ExtractOptionValue<typeof wideDef>>().toEqualTypeOf<string>()
})

test('short, describe and map accept explicit type arguments', () => {
  const explicitShort = short<boolean, 'v'>(boolean(), 'v')
  expectTypeOf<ExtractOptionValue<typeof explicitShort>>().toEqualTypeOf<boolean>()
  expectTypeOf(explicitShort.short).toEqualTypeOf<'v'>()

  const explicitDescribe = describe<string, 'Your name'>(string(), 'Your name')
  expectTypeOf<ExtractOptionValue<typeof explicitDescribe>>().toEqualTypeOf<string>()

  const explicitMap = map<number, string>(integer(), n => String(n))
  expectTypeOf<ExtractOptionValue<typeof explicitMap>>().toEqualTypeOf<string>()
})

test('withDefault checks the default against the type of the schema', () => {
  // @ts-expect-error -- 'awlays' is not one of the choices, and does not widen them
  withDefault(choice(['auto', 'always', 'never']), 'awlays')

  // @ts-expect-error -- a string is not a number
  withDefault(integer(), '8080')

  // a default typed wider than the choices, such as one read from an environment variable
  const env: string = 'auto'
  // @ts-expect-error -- a string is not one of the choices
  withDefault(choice(['auto', 'always', 'never']), env)

  // the error is at the default, and the type of the value stays the type of the schema
  const typo = withDefault(
    choice(['auto', 'always', 'never']),
    // @ts-expect-error -- 'awlays' is not one of the choices
    'awlays'
  )
  expectTypeOf<ExtractOptionValue<typeof typo>>().toEqualTypeOf<'auto' | 'always' | 'never'>()
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

test('required + multiple composition type inference', () => {
  const requiredMultiple = { items: required(multiple(string())) }
  type RM = ArgValues<typeof requiredMultiple>['items']
  expectTypeOf<RM>().toEqualTypeOf<string[]>()

  const multipleRequired = { items: multiple(required(string())) }
  type MR = ArgValues<typeof multipleRequired>['items']
  expectTypeOf<MR>().toEqualTypeOf<string[]>()

  const rm = required(multiple(string()))
  const mr = multiple(required(string()))
  expectTypeOf<ExtractOptionValue<typeof rm>>().toEqualTypeOf<string[]>()
  expectTypeOf<ExtractOptionValue<typeof mr>>().toEqualTypeOf<string[]>()

  const reqMultiInt = required(multiple(integer()))
  type RMI = ArgValues<{ items: typeof reqMultiInt }>['items']
  expectTypeOf<RMI>().toEqualTypeOf<number[]>()

  const unreq = unrequired(multiple(required(string())))
  type U = ArgValues<{ items: typeof unreq }>['items']
  expectTypeOf<U>().toEqualTypeOf<string[] | undefined>()
  expectTypeOf(unreq.required).toEqualTypeOf<false>()
  expectTypeOf(unreq.multiple).toEqualTypeOf<true>()
})

test('ArgValues with combinators', () => {
  const args = {
    host: string(),
    port: { ...withDefault(integer(), 8080), short: 'p' as const },
    verbose: boolean({ negatable: true }),
    command: positional(),
    count: positional(integer()),
    query: unrequired(positional()),
    maybeCount: unrequired(positional(integer())),
    level: choice(['debug', 'info'] as const),
    tags: multiple(string())
  }

  type Values = ArgValues<typeof args>
  expectTypeOf<Values['port']>().toEqualTypeOf<number>() // non-optional (has default)
  expectTypeOf<Values['command']>().toEqualTypeOf<string>() // positional is always required
  expectTypeOf<Values['count']>().toEqualTypeOf<number>() // positional is always required
  expectTypeOf<Values['query']>().toEqualTypeOf<string | undefined>() // explicitly optional positional
  expectTypeOf<Values['maybeCount']>().toEqualTypeOf<number | undefined>() // explicitly optional parsed positional
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

test('hidden metadata type inference', () => {
  const hiddenString = string({ hidden: true })
  expectTypeOf<ExtractOptionValue<typeof hiddenString>>().toEqualTypeOf<string>()
  expectTypeOf(hiddenString.hidden).toEqualTypeOf<boolean | undefined>()

  const hiddenNumber = number({ hidden: true })
  expectTypeOf<ExtractOptionValue<typeof hiddenNumber>>().toEqualTypeOf<number>()

  const hiddenInteger = integer({ hidden: true })
  expectTypeOf<ExtractOptionValue<typeof hiddenInteger>>().toEqualTypeOf<number>()

  const hiddenFloat = float({ hidden: true })
  expectTypeOf<ExtractOptionValue<typeof hiddenFloat>>().toEqualTypeOf<number>()

  const hiddenBoolean = boolean({ hidden: true })
  expectTypeOf<ExtractOptionValue<typeof hiddenBoolean>>().toEqualTypeOf<boolean>()

  const hiddenChoice = choice(['debug', 'info'] as const, { hidden: true })
  expectTypeOf<ExtractOptionValue<typeof hiddenChoice>>().toEqualTypeOf<'debug' | 'info'>()

  const hiddenPositional = positional({ hidden: true })
  expectTypeOf<ExtractOptionValue<typeof hiddenPositional>>().toEqualTypeOf<string>()

  const hiddenParsedPositional = positional(integer({ hidden: true }))
  expectTypeOf<ExtractOptionValue<typeof hiddenParsedPositional>>().toEqualTypeOf<number>()

  const hiddenCustom = combinator({ hidden: true, parse: Number })
  expectTypeOf<ExtractOptionValue<typeof hiddenCustom>>().toEqualTypeOf<number>()

  const hiddenSchema = hidden(string())
  expectTypeOf<ExtractOptionValue<typeof hiddenSchema>>().toEqualTypeOf<string>()
  expectTypeOf(hiddenSchema.hidden).toEqualTypeOf<true>()
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

test('short, describe, withDefault and map keep the modifiers applied before them', () => {
  const args = {
    tags: short(multiple(string()), 't'),
    labels: describe(multiple(string()), 'Labels'),
    latest: withDefault(multiple(string()), 'latest'),
    doubled: map(multiple(integer()), n => n * 2),
    port: short(withDefault(integer(), 8080), 'p'),
    host: short(required(string()), 'h'),
    file: describe(required(string()), 'Path to the input file'),
    count: map(required(integer()), n => n + 1),
    ids: short(describe(required(multiple(integer())), 'IDs'), 'i'),
    names: withDefault(
      describe(
        map(multiple(string()), v => v.trim()),
        'Names'
      ),
      'x'
    ),
    source: describe(positional(integer()), 'Source'),
    target: describe(unrequired(positional(integer())), 'Target')
  }
  expectTypeOf<ArgValues<typeof args>>().toEqualTypeOf<{
    tags?: string[]
    labels?: string[]
    latest: string[]
    doubled?: number[]
    port: number
    host: string
    file: string
    count: number
    ids: number[]
    names: string[]
    source: number
    target?: number
  }>()

  // what the earlier modifiers set keeps its literal type
  expectTypeOf(args.port.default).toEqualTypeOf<number>()
  expectTypeOf(args.ids.required).toEqualTypeOf<true>()
  expectTypeOf(args.ids.description).toEqualTypeOf<'IDs'>()
  expectTypeOf(withDefault(short(integer(), 'p'), 1).short).toEqualTypeOf<'p'>()
  expectTypeOf(map(short(integer(), 'n'), n => n > 0).short).toEqualTypeOf<'n'>()
  expectTypeOf(describe(hidden(string()), 'Legacy').hidden).toEqualTypeOf<true>()
  expectTypeOf(args.source.type).toEqualTypeOf<'positional'>()
})

test('short, describe and withDefault give the same value types in either order', () => {
  const before = {
    tags: short(multiple(string()), 't'),
    port: short(withDefault(integer(), 8080), 'p'),
    host: describe(required(string()), 'Host')
  }
  const after = {
    tags: multiple(short(string(), 't')),
    port: withDefault(short(integer(), 'p'), 8080),
    host: required(describe(string(), 'Host'))
  }
  expectTypeOf<ArgValues<typeof before>>().toEqualTypeOf<ArgValues<typeof after>>()
})

test('withDefault checks the default of a schema with other modifiers', () => {
  // @ts-expect-error -- 'c' is not one of the choices
  withDefault(multiple(choice(['a', 'b'])), 'c')

  // @ts-expect-error -- the default of a multiple schema is one value, not an array
  withDefault(multiple(string()), ['a'])

  // the error is at the default
  withDefault(
    short(integer(), 'p'),
    // @ts-expect-error -- a string is not a number
    '8080'
  )
})

test('map keeps a default set before it, typed as before the transform', () => {
  const mappedAfterDefault = map(withDefault(integer(), 8080), n => String(n))
  expectTypeOf(mappedAfterDefault.default).toEqualTypeOf<number>()
  expectTypeOf<ArgValues<{ port: typeof mappedAfterDefault }>>().toEqualTypeOf<{ port: string }>()
})

test('the modifiers keep a schema typed as any an argument schema', () => {
  const legacy = string() as any
  const args = {
    name: required(string()),
    s: short(legacy, 'x'),
    d: describe(legacy, 'D'),
    w: withDefault(legacy, 1),
    m: map(legacy, (v: unknown) => String(v)),
    mu: multiple(legacy),
    r: required(legacy)
  }
  expectTypeOf<ArgValues<typeof args>>().toEqualTypeOf<{
    name: string
    s?: unknown
    d?: unknown
    w: unknown
    m?: string
    mu?: unknown[]
    r: unknown
  }>()
})

test('unrequired overrides required type', () => {
  const composed = unrequired(required(string()))
  expectTypeOf(composed.required).toEqualTypeOf<false>()
  expectTypeOf<ExtractOptionValue<typeof composed>>().toEqualTypeOf<string>()
})

test('positional keeps required, default and multiple of its options and parser', () => {
  const args = {
    input: positional({ required: false }),
    count: positional(unrequired(integer())),
    ids: positional(multiple(integer())),
    names: positional(required(multiple(string()))),
    level: positional(unrequired(withDefault(integer(), 1))),
    source: positional(describe(integer(), 'Source'))
  }
  expectTypeOf<ArgValues<typeof args>>().toEqualTypeOf<{
    input?: string
    count?: number
    ids?: number[]
    names: string[]
    level: number
    source: number
  }>()
  expectTypeOf(args.source.description).toEqualTypeOf<'Source'>()
  expectTypeOf(args.ids.multiple).toEqualTypeOf<true>()
  // an explicit type argument still gives the value type
  const explicit = positional<number>(integer())
  expectTypeOf<ExtractOptionValue<typeof explicit>>().toEqualTypeOf<number>()
})

test('a base combinator keeps the literal type of its required option', () => {
  const args = {
    name: string({ required: true }),
    ratio: number({ required: true }),
    port: integer({ required: true }),
    scale: float({ required: true }),
    force: boolean({ required: true }),
    level: choice(['debug', 'info'] as const, { required: true }),
    config: combinator({ parse: Number, required: true }),
    host: string({ required: false }),
    alias: short(integer({ required: true }), 'p'),
    file: positional(integer({ required: false }))
  }
  expectTypeOf<ArgValues<typeof args>>().toEqualTypeOf<{
    name: string
    ratio: number
    port: number
    scale: number
    force: boolean
    level: 'debug' | 'info'
    config: number
    host?: string
    alias: number
    file?: number
  }>()
  // options whose required is not a literal leave the value optional, as before
  const options: { required?: boolean } = { required: true }
  const dynamic = { size: integer(options) }
  expectTypeOf<ArgValues<typeof dynamic>>().toEqualTypeOf<{ size?: number }>()
})

test('unknown options of positional() and the base combinators are type errors', () => {
  // @ts-expect-error -- 'mx' is not an option of integer()
  integer({ min: 1, mx: 10 })
  // @ts-expect-error -- a default is set with withDefault(), not in the options
  integer({ default: 8080, min: 1 })
  // @ts-expect-error -- 'minLenght' is not an option of string()
  string({ minLenght: 1, required: true })
  // @ts-expect-error -- 'maxx' is not an option of number()
  number({ min: 0, maxx: 1 })
  // @ts-expect-error -- 'maxx' is not an option of float()
  float({ min: 0, maxx: 1 })
  // @ts-expect-error -- 'negateable' is not an option of boolean()
  boolean({ negateable: true, description: 'Color' })
  // @ts-expect-error -- 'descripton' is not an option of positional()
  positional({ descripton: 'Input file', required: false })
  // @ts-expect-error -- 'requried' is not an option of choice()
  choice(['debug', 'info'] as const, { requried: true, description: 'Level' })
  // @ts-expect-error -- 'metavr' is not an option of combinator()
  combinator({ parse: Number, metavr: 'number' })
})

test('positional keeps only the properties that it copies from its parser', () => {
  const schema = positional(short(hidden(integer()), 'p'))
  expectTypeOf(schema).not.toHaveProperty('short')
  expectTypeOf(schema).not.toHaveProperty('choices')
  expectTypeOf(schema.hidden).toEqualTypeOf<true>()
  expectTypeOf(positional(integer()).metavar).toEqualTypeOf<string | undefined>()
})

test('positional reads a parser of type any as CombinatorSchema<unknown>', () => {
  const parser = integer() as any
  const args = { value: describe(positional(parser), 'Value') }
  expectTypeOf<ArgValues<typeof args>>().toEqualTypeOf<{ value: unknown }>()
})

test('a required option of type boolean leaves the value optional', () => {
  const flag = Math.random() > 0.5
  const args = { size: integer({ required: flag }) }
  expectTypeOf<ArgValues<typeof args>>().toEqualTypeOf<{ size?: number }>()
})
