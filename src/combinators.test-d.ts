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

import type {
  BaseOptions,
  CombinatorOptions,
  CombinatorSchema,
  IntegerOptions,
  StringOptions
} from './combinators.ts'
import type { ArgValues, Args, ExtractOptionValue } from './resolver.ts'

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

test('a base combinator keeps a literal required option inside other combinators', () => {
  const args = {
    name: positional(string({ required: false })),
    ratio: positional(number({ required: false })),
    scale: positional(float({ required: false })),
    force: short(boolean({ required: true }), 'f'),
    level: positional(choice(['debug', 'info'] as const, { required: false })),
    config: positional(combinator({ parse: Number, required: false })),
    query: hidden(positional({ required: false }))
  }
  expectTypeOf<ArgValues<typeof args>>().toEqualTypeOf<{
    name?: string
    ratio?: number
    scale?: number
    force: boolean
    level?: 'debug' | 'info'
    config?: number
    query?: string
  }>()
})

test('a positional argument whose required may be false is optional', () => {
  const optional = Math.random() > 0.5
  const flag = Math.random() > 0.5
  const maybe: { required?: false } = {}
  const args = {
    file: positional(string(optional ? { required: false } : {})),
    port: positional(integer({ required: flag })),
    user: positional(string(maybe)),
    mode: positional(choice(['fast', 'safe'] as const, { ...(optional && { required: false }) })),
    size: positional(combinator(optional ? { parse: Number, required: false } : { parse: Number })),
    query: positional(optional ? { required: false } : {}),
    tag: describe(positional(short(string(optional ? { required: false } : {}), 't')), 'Tag'),
    raw: { type: 'positional' as const, required: flag },
    count: positional(withDefault(integer(optional ? { required: false } : {}), 1)),
    level: positional(required(string(optional ? { required: false } : {})))
  }
  expectTypeOf<ArgValues<typeof args>>().toEqualTypeOf<{
    file?: string
    port?: number
    user?: string
    mode?: 'fast' | 'safe'
    size?: number
    query?: string
    tag?: string
    raw?: string
    count: number
    level: string
  }>()

  // options stay as they are
  const options = {
    name: string(optional ? { required: false } : {}),
    port: integer({ required: flag }),
    mode: string(optional ? { required: true } : {})
  }
  expectTypeOf<ArgValues<typeof options>>().toEqualTypeOf<{
    name?: string
    port?: number
    mode?: string
  }>()
})

test('a positional argument whose required cannot be false, or says nothing, is present', () => {
  const strict = Math.random() > 0.5
  const options: StringOptions = {}
  const args = {
    name: positional(string({ minLength: 1 })),
    mode: positional(string(strict ? { required: true } : {})),
    user: positional(string(options)),
    file: positional(string() as CombinatorSchema<string>)
  }
  expectTypeOf<ArgValues<typeof args>>().toEqualTypeOf<{
    name: string
    mode: string
    user: string
    file: string
  }>()

  // args typed from the context, as in define() of gunshi
  const define = <A extends Args>(command: { args: A }) => command
  const command = define({ args: { file: positional(), port: positional(integer()) } })
  expectTypeOf<ArgValues<typeof command.args>>().toEqualTypeOf<{ file: string; port: number }>()
})

test('a required that may be false stays an optional property of the schema', () => {
  const optional = Math.random() > 0.5
  const name = string(optional ? { required: false } : {})
  const query = positional(optional ? { required: false } : {})
  // not a required property of type false | undefined, which does not fit ArgSchema with
  // exactOptionalPropertyTypes
  expectTypeOf<{} extends Pick<typeof name, 'required'> ? true : false>().toEqualTypeOf<true>()
  expectTypeOf<{} extends Pick<typeof query, 'required'> ? true : false>().toEqualTypeOf<true>()
})

test('choice() and combinator() still take explicit type arguments', () => {
  const args = {
    level: choice<readonly ['debug', 'info']>(['debug', 'info'], { required: true }),
    config: combinator<number>({ parse: Number })
  }
  // with explicit type arguments, the literal required is not kept
  expectTypeOf<ArgValues<typeof args>>().toEqualTypeOf<{
    level?: 'debug' | 'info'
    config?: number
  }>()
})

test('the base combinators keep their signatures as their last overloads', () => {
  expectTypeOf<Parameters<typeof string>>().toEqualTypeOf<[opts?: StringOptions]>()
  expectTypeOf<Parameters<typeof integer>>().toEqualTypeOf<[opts?: IntegerOptions]>()
  expectTypeOf<Parameters<typeof positional>>().toEqualTypeOf<[parser?: BaseOptions]>()
  expectTypeOf<Parameters<typeof choice>>().toEqualTypeOf<
    [values: readonly string[], opts?: BaseOptions]
  >()
  expectTypeOf<Parameters<typeof combinator>>().toEqualTypeOf<
    [config: CombinatorOptions<unknown>]
  >()
})

test('unknown options of positional() and the base combinators are type errors', () => {
  // @ts-expect-error -- 'mx' is not an option of integer()
  integer({ min: 1, mx: 10 })
  // @ts-expect-error -- a default is set with withDefault(), not in the options
  integer({ default: 8080, min: 1 })
  // @ts-expect-error -- 'minLen' is not an option of string()
  string({ minLen: 1, required: true })
  // @ts-expect-error -- 'maxx' is not an option of number()
  number({ min: 0, maxx: 1 })
  // @ts-expect-error -- 'maxx' is not an option of float()
  float({ min: 0, maxx: 1 })
  // @ts-expect-error -- 'negateable' is not an option of boolean()
  boolean({ negateable: true, description: 'Color' })
  // @ts-expect-error -- 'desc' is not an option of positional()
  positional({ desc: 'Input file', required: false })
  // @ts-expect-error -- 'optional' is not an option of choice()
  choice(['debug', 'info'] as const, { optional: true, description: 'Level' })
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

test('a required option that the options have only in some cases leaves the value optional', () => {
  const strict = Math.random() > 0.5
  const maybe: { required?: true } = {}
  const args = {
    port: integer(strict ? { required: true } : {}),
    retries: integer({ min: 0, ...(strict ? { required: true } : {}) }),
    host: string({ description: 'Host', ...(strict && { required: true }) }),
    name: string({ required: strict || undefined }),
    user: string(maybe)
  }
  expectTypeOf<ArgValues<typeof args>>().toEqualTypeOf<{
    port?: number
    retries?: number
    host?: string
    name?: string
    user?: string
  }>()
})

test('a combinator schema is typed by what its parse function returns', () => {
  const acceptsStrings = (schema: CombinatorSchema<string>) => schema
  // @ts-expect-error -- integer() parses to a number, not a string
  acceptsStrings(integer())
  acceptsStrings(string())

  // @ts-expect-error -- the transform takes the number that integer() parses to
  map(integer(), (n: string) => n.toUpperCase())

  // @ts-expect-error -- parse can return null, which cannot be a default
  withDefault(combinator({ parse: (v: string) => (v === 'none' ? null : v) }), 'auto')

  const date = combinator({ parse: (value: string) => new Date(value) })
  // @ts-expect-error -- a schema that parses to a Date cannot have a default
  withDefault(date, '2024-12-31')
  expectTypeOf<ExtractOptionValue<typeof date>>().toEqualTypeOf<Date>()

  // calling the parse function of a combinator schema gives what it parses to
  expectTypeOf(integer().parse('1')).toEqualTypeOf<number>()
})

test('a schema typed as any still fits any combinator schema after a modifier', () => {
  const legacy = string() as any
  const args = {
    s: withDefault(short(legacy, 'x'), 1),
    d: withDefault(describe(legacy, 'D'), 'a'),
    r: withDefault(required(legacy), true),
    mu: withDefault(multiple(legacy), 'a'),
    p: withDefault(positional(legacy), 'a'),
    m: map(short(legacy, 'x'), (v: string) => v.length)
  }
  expectTypeOf<ArgValues<typeof args>>().toEqualTypeOf<{
    s: unknown
    d: unknown
    r: unknown
    mu: unknown[]
    p: unknown
    m?: number
  }>()
  const acceptsStrings = (schema: CombinatorSchema<string>) => schema
  acceptsStrings(short(legacy, 'x'))
})

test('hidden() and unrequired() read a schema typed as any as the other modifiers do', () => {
  const legacy = string() as any
  const args = {
    h: withDefault(hidden(legacy), 1),
    u: withDefault(unrequired(legacy), 'a'),
    s: short(hidden(legacy), 'x')
  }
  expectTypeOf<ArgValues<typeof args>>().toEqualTypeOf<{
    h: unknown
    u: unknown
    s?: unknown
  }>()
  const acceptsStrings = (schema: CombinatorSchema<string>) => schema
  acceptsStrings(hidden(legacy))
  acceptsStrings(unrequired(legacy))

  // short() drops the index signature of the schema typed as any
  // @ts-expect-error -- 'unknownKey' is not a property of the schema
  expectTypeOf(short(legacy, 'x').unknownKey).toBeAny()
})

test('short() and describe() take a union of schemas of different types', () => {
  const strict = Math.random() > 0.5
  const port = strict ? integer({ min: 1 }) : string()
  const args = {
    a: short(port, 'p'),
    b: describe(port, 'Port'),
    c: short(required(port), 'r'),
    d: describe(short(strict ? choice(['debug', 'info'] as const) : boolean(), 'l'), 'Level')
  }
  expectTypeOf<ArgValues<typeof args>>().toEqualTypeOf<{
    a?: string | number
    b?: string | number
    c: string | number
    d?: 'debug' | 'info' | boolean
  }>()
})

test('map() and withDefault() take a union of schemas of different types', () => {
  const strict = Math.random() > 0.5
  const port = strict ? integer({ min: 1 }) : string()
  const level = strict ? choice(['debug', 'info'] as const) : boolean()
  const args = {
    mapped: map(port, v => [v]),
    text: withDefault(port, 'x'),
    number: withDefault(port, 8080),
    level: withDefault(level, false),
    required: map(short(required(port), 'p'), v => [v]),
    multiple: withDefault(multiple(port), 'a')
  }
  expectTypeOf<ArgValues<typeof args>>().toEqualTypeOf<{
    mapped?: (string | number)[]
    text: string | number
    number: string | number
    level: 'debug' | 'info' | boolean
    required: (string | number)[]
    multiple: (string | number)[]
  }>()

  // a type that covers both schemas of the union gives the same types
  const annotated: CombinatorSchema<string | number> = port
  const covered = { m: map(annotated, v => [v]), w: withDefault(annotated, 'x') }
  expectTypeOf<ArgValues<typeof covered>>().toEqualTypeOf<{
    m?: (string | number)[]
    w: string | number
  }>()

  // Parameters<typeof map> reads the last overload, whose transform takes an unknown value
  expectTypeOf<Parameters<typeof map>[1]>().toEqualTypeOf<(value: unknown) => unknown>()

  // @ts-expect-error -- the value may be a number, which has no toUpperCase()
  map(port, v => v.toUpperCase())
  // @ts-expect-error -- the transform takes a number as well as a string
  map(port, (v: string) => v.length)
  // @ts-expect-error -- the default is a string or a number
  withDefault(port, true)
  // @ts-expect-error -- 'warn' is not one of the values
  withDefault(level, 'warn')
  // @ts-expect-error -- a schema that parses to a Date cannot have a default, in a union either
  withDefault(strict ? integer() : combinator({ parse: (value: string) => new Date(value) }), 1)
})

test('map() and withDefault() keep the parsed type of a schema typed by an interface', () => {
  interface PortSchema {
    type: 'custom'
    parse: (value: string) => number
  }
  const doubled = <S extends PortSchema>(schema: S) =>
    withDefault(
      map(schema, n => n * 2),
      1
    )
  const fixed = <S extends PortSchema>(schema: S) =>
    map(
      map(schema, n => n),
      n => n.toFixed(1)
    )
  const port: PortSchema = { type: 'custom', parse: Number }
  const args = {
    doubled: doubled(port),
    fixed: fixed(port),
    positional: withDefault(positional(integer()), 1)
  }
  expectTypeOf<ArgValues<typeof args>>().toEqualTypeOf<{
    doubled: number
    fixed?: string
    positional: number
  }>()
})

test('each combinator schema fits only where the values that it parses do', () => {
  const acceptsStrings = (schema: CombinatorSchema<string>) => schema
  const acceptsNumbers = (schema: CombinatorSchema<number>) => schema
  // @ts-expect-error -- number() parses to a number
  acceptsStrings(number())
  // @ts-expect-error -- float() parses to a number
  acceptsStrings(float())
  // @ts-expect-error -- boolean() parses to a boolean
  acceptsStrings(boolean())
  // @ts-expect-error -- choice() parses to one of its strings
  acceptsNumbers(choice(['a', 'b']))
  // @ts-expect-error -- combinator() parses to what its parse returns
  acceptsStrings(combinator({ parse: Number }))
  // @ts-expect-error -- the modifiers keep the type that parse returns
  acceptsStrings(short(withDefault(integer(), 1), 'p'))
  // @ts-expect-error -- so does hidden()
  acceptsStrings(hidden(integer()))
  // @ts-expect-error -- so does positional()
  acceptsStrings(positional(integer()))
  // a parse that returns any still fits any combinator schema
  acceptsStrings(combinator({ parse: JSON.parse }))
  acceptsNumbers(combinator({ parse: JSON.parse }))

  const registry: Record<string, CombinatorSchema<unknown>> = { port: integer() }
  // @ts-expect-error -- CombinatorSchema<unknown> may parse to anything and cannot take a default
  withDefault(registry.port, 8080)
  const anyRegistry: Record<string, CombinatorSchema<any>> = { port: integer() }
  withDefault(anyRegistry.port, 8080)

  // combinator() with a parse function typed as any (from an untyped module) parses to unknown
  const untyped: any = Number
  // @ts-expect-error -- combinator() infers unknown from a parse function typed as any
  withDefault(combinator({ parse: untyped }), 8080)
  withDefault(combinator<number>({ parse: untyped }), 8080)
})

test('a modifier on a schema typed by a type parameter fits where the type parameter does', () => {
  const withPortDefault = <S extends CombinatorSchema<number>>(schema: S) =>
    withDefault(required(schema), 8080)
  const doubled = <S extends CombinatorSchema<number>>(schema: S) =>
    map(short(schema, 'd'), (n: number) => n * 2)
  const asNumbers = <S extends CombinatorSchema<number>>(schema: S): CombinatorSchema<number> =>
    short(schema, 'c')
  const args = {
    port: withPortDefault(integer()),
    twice: doubled(integer()),
    count: asNumbers(integer())
  }
  expectTypeOf<ArgValues<typeof args>>().toEqualTypeOf<{
    port: number
    twice?: number
    count?: number
  }>()

  const asStrings = <S extends CombinatorSchema<number>>(schema: S): CombinatorSchema<string> =>
    // @ts-expect-error -- S parses to numbers, not strings
    required(schema)
  expectTypeOf(asStrings).toBeFunction()
})

test('the modifiers nest on a schema typed by a type parameter', () => {
  const count = <S extends CombinatorSchema<number>>(schema: S): CombinatorSchema<number> =>
    describe(short(schema, 'c'), 'Count')
  const port = <S extends CombinatorSchema<number>>(schema: S) =>
    withDefault(describe(short(schema, 'p'), 'Port'), 8080)
  const doubled = <S extends CombinatorSchema<number>>(schema: S) =>
    map(describe(short(schema, 'd'), 'Doubled'), n => n * 2)
  const ports = <S extends CombinatorSchema<number>>(schema: S) =>
    required(multiple(short(hidden(schema), 'P')))
  const secret = <S extends CombinatorSchema<number>>(schema: S): CombinatorSchema<number> =>
    hidden(short(schema, 's'))
  const optional = <S extends CombinatorSchema<number>>(schema: S): CombinatorSchema<number> =>
    unrequired(describe(schema, 'Optional'))
  const label = <S extends CombinatorSchema<string>>(schema: S): CombinatorSchema<string> =>
    describe(describe(schema, 'Name'), 'Label')
  const args = {
    count: count(integer()),
    port: port(integer()),
    doubled: doubled(integer()),
    ports: ports(integer()),
    secret: secret(integer()),
    optional: optional(integer()),
    label: label(string())
  }
  expectTypeOf<ArgValues<typeof args>>().toEqualTypeOf<{
    count?: number
    port: number
    doubled?: number
    ports: number[]
    secret?: number
    optional?: number
    label?: string
  }>()

  // the parse function stays callable through the modifiers
  const parsed = <S extends CombinatorSchema<number>>(schema: S) =>
    describe(short(schema, 'c'), 'Count').parse('1')
  expectTypeOf(parsed(integer())).toEqualTypeOf<number>()
})

test('positional() nests with the modifiers on a schema typed by a type parameter', () => {
  const index = <S extends CombinatorSchema<number>>(schema: S) =>
    map(positional(schema), n => n * 2)
  const file = <S extends CombinatorSchema<number>>(schema: S): CombinatorSchema<number> =>
    describe(hidden(positional(required(schema))), 'File')
  const port = <S extends CombinatorSchema<number>>(schema: S) =>
    map(describe(positional(schema), 'Port'), n => n + 1)
  const args = {
    index: index(integer()),
    file: file(integer()),
    port: port(integer())
  }
  expectTypeOf<ArgValues<typeof args>>().toEqualTypeOf<{
    index: number
    file?: number
    port: number
  }>()
})

test('the results of hidden() and unrequired() fit Omit of the schema with the flag', () => {
  const secret = <S extends CombinatorSchema<number>>(
    schema: S
  ): Omit<S, 'hidden'> & { hidden: true } => hidden(schema)
  const optional = <S extends CombinatorSchema<string>>(
    schema: S
  ): Omit<S, 'required'> & { required: false } => unrequired(schema)
  const args = {
    secret: secret(integer()),
    optional: optional(required(string()))
  }
  expectTypeOf<ArgValues<typeof args>>().toEqualTypeOf<{
    secret?: number
    optional?: string
  }>()
})

test('the modifiers take positional() without a parser', () => {
  const args = {
    entry: required(positional({ description: 'Entry file to serve' })),
    input: describe(positional(), 'Input file'),
    output: withDefault(positional(), 'dist'),
    length: map(positional(), value => value.length),
    target: withDefault(positional({ required: false }), 'out'),
    files: multiple(positional())
  }
  expectTypeOf<ArgValues<typeof args>>().toEqualTypeOf<{
    entry: string
    input: string
    output: string
    length: number
    target: string
    files?: string[]
  }>()
  expectTypeOf(positional().parse).toEqualTypeOf<(value: string) => string>()
})

test('the modifiers keep the properties of positional() without a parser', () => {
  const entry = withDefault(positional({ description: 'Entry', hidden: true }), 'main.ts')
  expectTypeOf(entry.description).toEqualTypeOf<string | undefined>()
  expectTypeOf(entry.hidden).toEqualTypeOf<boolean | undefined>()
  const length = map(positional({ description: 'Entry' }), value => value.length)
  expectTypeOf(length.description).toEqualTypeOf<string | undefined>()
  expectTypeOf(positional(positional({ description: 'Entry' })).description).toEqualTypeOf<
    string | undefined
  >()
})
