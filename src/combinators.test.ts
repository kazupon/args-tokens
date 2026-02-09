import { describe, expect, test } from 'vitest'
import {
  args,
  boolean,
  choice,
  combinator,
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
  withDefault
} from './combinators.ts'
import { parseArgs } from './parser.ts'
import { resolveArgs } from './resolver.ts'

import type { Args, ArgSchema } from './resolver.ts'

describe('string combinator', () => {
  test('basic', () => {
    const argv = ['--name', 'hello']
    const tokens = parseArgs(argv)
    const { values } = resolveArgs({ name: string() }, tokens)
    expect(values.name).toBe('hello')
  })

  test('minLength validation', () => {
    const argv = ['--name=a']
    const tokens = parseArgs(argv)
    const { error } = resolveArgs({ name: { ...string({ minLength: 3 }), required: true } }, tokens)
    expect(error).toBeDefined()
    expect((error?.errors[0] as Error).message).toContain('at least 3 characters')
  })

  test('maxLength validation', () => {
    const argv = ['--name', 'toolong']
    const tokens = parseArgs(argv)
    const { error } = resolveArgs({ name: { ...string({ maxLength: 3 }), required: true } }, tokens)
    expect(error).toBeDefined()
    expect((error?.errors[0] as Error).message).toContain('at most 3 characters')
  })

  test('pattern validation', () => {
    const argv = ['--id', 'abc']
    const tokens = parseArgs(argv)
    const { error } = resolveArgs(
      { id: { ...string({ pattern: /^\d+$/ }), required: true } },
      tokens
    )
    expect(error).toBeDefined()
    expect((error?.errors[0] as Error).message).toContain('pattern')
  })

  test('pattern validation with email', () => {
    const emailPattern = /^[^@\s]+@[^\s@][^\s.@]*\.[^\s@]+$/
    const schema: Args = { email: { ...string({ pattern: emailPattern }), required: true } }

    // valid email
    const validTokens = parseArgs(['--email', 'user@example.com'])
    const { values, error: validError } = resolveArgs(schema, validTokens)
    expect(validError).toBeUndefined()
    expect(values.email).toBe('user@example.com')

    // invalid email
    const invalidTokens = parseArgs(['--email', 'not-an-email'])
    const { error: invalidError } = resolveArgs(schema, invalidTokens)
    expect(invalidError).toBeDefined()
    expect((invalidError?.errors[0] as Error).message).toContain('pattern')
  })
})

describe('number combinator', () => {
  test('basic', () => {
    const argv = ['--port', '8080']
    const tokens = parseArgs(argv)
    const { values } = resolveArgs({ port: number() }, tokens)
    expect(values.port).toBe(8080)
  })

  test('float value', () => {
    const argv = ['--ratio', '0.5']
    const tokens = parseArgs(argv)
    const { values } = resolveArgs({ ratio: number() }, tokens)
    expect(values.ratio).toBe(0.5)
  })

  test('invalid value', () => {
    const argv = ['--port', 'abc']
    const tokens = parseArgs(argv)
    const { error } = resolveArgs({ port: { ...number(), required: true } }, tokens)
    expect(error).toBeDefined()
    expect((error?.errors[0] as Error).message).toContain('Expected a number')
  })

  test('min validation', () => {
    const argv = ['--port', '0']
    const tokens = parseArgs(argv)
    const { error } = resolveArgs({ port: { ...number({ min: 1 }), required: true } }, tokens)
    expect(error).toBeDefined()
    expect((error?.errors[0] as Error).message).toContain('>= 1')
  })

  test('max validation', () => {
    const argv = ['--port', '70000']
    const tokens = parseArgs(argv)
    const { error } = resolveArgs({ port: { ...number({ max: 65535 }), required: true } }, tokens)
    expect(error).toBeDefined()
    expect((error?.errors[0] as Error).message).toContain('<= 65535')
  })
})

describe('integer combinator', () => {
  test('basic', () => {
    const argv = ['--count', '42']
    const tokens = parseArgs(argv)
    const { values } = resolveArgs({ count: { ...integer(), required: true } }, tokens)
    expect(values.count).toBe(42)
  })

  test('negative value (inline)', () => {
    const argv = ['--offset=-5']
    const tokens = parseArgs(argv)
    const { values } = resolveArgs({ offset: { ...integer(), required: true } }, tokens)
    expect(values.offset).toBe(-5)
  })

  test('rejects float', () => {
    const argv = ['--count', '3.14']
    const tokens = parseArgs(argv)
    const { error } = resolveArgs({ count: { ...integer(), required: true } }, tokens)
    expect(error).toBeDefined()
    expect((error?.errors[0] as Error).message).toContain('Expected an integer')
  })

  test('range validation', () => {
    const argv = ['--count', '100']
    const tokens = parseArgs(argv)
    const { error } = resolveArgs(
      { count: { ...integer({ min: 0, max: 10 }), required: true } },
      tokens
    )
    expect(error).toBeDefined()
    expect((error?.errors[0] as Error).message).toContain('<= 10')
  })
})

describe('float combinator', () => {
  test('basic', () => {
    const argv = ['--ratio', '0.75']
    const tokens = parseArgs(argv)
    const { values } = resolveArgs({ ratio: { ...float(), required: true } }, tokens)
    expect(values.ratio).toBe(0.75)
  })

  test('rejects NaN', () => {
    const argv = ['--ratio', 'abc']
    const tokens = parseArgs(argv)
    const { error } = resolveArgs({ ratio: { ...float(), required: true } }, tokens)
    expect(error).toBeDefined()
    expect((error?.errors[0] as Error).message).toContain('finite float')
  })

  test('rejects Infinity', () => {
    const argv = ['--ratio', 'Infinity']
    const tokens = parseArgs(argv)
    const { error } = resolveArgs({ ratio: { ...float(), required: true } }, tokens)
    expect(error).toBeDefined()
    expect((error?.errors[0] as Error).message).toContain('finite float')
  })

  test('range validation', () => {
    const argv = ['--ratio', '1.5']
    const tokens = parseArgs(argv)
    const { error } = resolveArgs(
      { ratio: { ...float({ min: 0, max: 1 }), required: true } },
      tokens
    )
    expect(error).toBeDefined()
    expect((error?.errors[0] as Error).message).toContain('<= 1')
  })
})

describe('boolean combinator', () => {
  test('basic', () => {
    const argv = ['--verbose']
    const tokens = parseArgs(argv)
    const { values } = resolveArgs({ verbose: boolean() }, tokens)
    expect(values.verbose).toBe(true)
  })

  test('negatable', () => {
    const argv = ['--no-color']
    const tokens = parseArgs(argv)
    const { values } = resolveArgs({ color: boolean({ negatable: true }) }, tokens)
    expect(values.color).toBe(false)
  })

  test('with modifiers: map', () => {
    const argv = ['--verbose']
    const tokens = parseArgs(argv)
    const { values } = resolveArgs(
      {
        verbose: map(boolean(), b => (b ? 'yes' : 'no'))
      },
      tokens
    )
    expect(values.verbose).toBe('yes')
  })

  test('with modifiers: withDefault', () => {
    const argv: string[] = []
    const tokens = parseArgs(argv)
    const { values } = resolveArgs(
      {
        verbose: withDefault(boolean(), false)
      },
      tokens
    )
    expect(values.verbose).toBe(false)
  })

  test('with modifiers: multiple', () => {
    const argv = ['--foo', '--no-foo', '--foo']
    const tokens = parseArgs(argv)
    const { values } = resolveArgs(
      {
        foo: multiple(boolean({ negatable: true }))
      },
      tokens
    )
    expect(values.foo).toEqual([true, false, true])
  })
})

describe('positional combinator', () => {
  test('basic (string)', () => {
    const argv = ['dev']
    const tokens = parseArgs(argv)
    const { values } = resolveArgs(
      {
        command: positional()
      } as const satisfies Args,
      tokens
    )
    expect(values.command).toBe('dev')
  })

  test('with parser', () => {
    const argv = ['42', '--help']
    const tokens = parseArgs(argv)
    const { values } = resolveArgs(
      {
        count: positional(integer()),
        help: { type: 'boolean', short: 'h' }
      } as const satisfies Args,
      tokens
    )
    expect(values.count).toBe(42)
    expect(values.help).toBe(true)
  })

  test('with parser error', () => {
    const argv = ['abc']
    const tokens = parseArgs(argv)
    const { error } = resolveArgs(
      {
        count: positional(integer())
      } as const satisfies Args,
      tokens
    )
    expect(error?.errors.length).toBe(1)
    expect((error?.errors[0] as Error).message).toContain('Expected an integer')
  })

  test('multiple with parser', () => {
    const argv = ['1', '2', '3']
    const tokens = parseArgs(argv)
    const { values } = resolveArgs(
      {
        nums: { ...positional(integer()), multiple: true as const }
      } as const satisfies Args,
      tokens
    )
    expect(values.nums).toEqual([1, 2, 3])
  })
})

describe('choice combinator', () => {
  test('valid value', () => {
    const argv = ['--level', 'info']
    const tokens = parseArgs(argv)
    const { values } = resolveArgs(
      { level: { ...choice(['debug', 'info', 'warn', 'error'] as const), required: true } },
      tokens
    )
    expect(values.level).toBe('info')
  })

  test('invalid value', () => {
    const argv = ['--level', 'trace']
    const tokens = parseArgs(argv)
    const { error } = resolveArgs(
      { level: { ...choice(['debug', 'info', 'warn', 'error'] as const), required: true } },
      tokens
    )
    expect(error).toBeDefined()
    expect((error?.errors[0] as Error).message).toContain('one of')
  })
})

describe('custom combinator', () => {
  test('basic custom parse (Date)', () => {
    const date = combinator({
      parse: (value: string) => {
        const d = new Date(value)
        if (isNaN(d.getTime())) {
          throw new Error('Invalid date format')
        }
        return d
      },
      metavar: 'date'
    })
    const argv = ['--since', '2024-01-15']
    const tokens = parseArgs(argv)
    const { values } = resolveArgs({ since: { ...date, required: true } }, tokens)
    expect(values.since).toEqual(new Date('2024-01-15'))
  })

  test('parse error is collected', () => {
    const date = combinator({
      parse: (value: string) => {
        const d = new Date(value)
        if (isNaN(d.getTime())) {
          throw new Error('Invalid date format')
        }
        return d
      }
    })
    const argv = ['--since', 'not-a-date']
    const tokens = parseArgs(argv)
    const { error } = resolveArgs({ since: { ...date, required: true } }, tokens)
    expect(error).toBeDefined()
    expect((error?.errors[0] as Error).message).toContain('Invalid date format')
  })

  test('default metavar is custom', () => {
    const schema = combinator({ parse: Number })
    expect(schema.metavar).toBe('custom')
  })

  test('custom metavar', () => {
    const schema = combinator({ parse: Number, metavar: 'num' })
    expect(schema.metavar).toBe('num')
  })

  test('type is custom', () => {
    const schema = combinator({ parse: Number })
    expect(schema.type).toBe('custom')
  })

  test('with modifier: withDefault', () => {
    const num = combinator({ parse: Number })
    const argv: string[] = []
    const tokens = parseArgs(argv)
    const { values } = resolveArgs({ count: withDefault(num, 42) }, tokens)
    expect(values.count).toBe(42)
  })

  test('with modifier: multiple', () => {
    const num = combinator({ parse: Number })
    const argv = ['--val=1', '--val', '2', '--val=3']
    const tokens = parseArgs(argv)
    const { values } = resolveArgs({ val: multiple(num) }, tokens)
    expect(values.val).toEqual([1, 2, 3])
  })

  test('with modifier: required', () => {
    const num = combinator({ parse: Number })
    const argv: string[] = []
    const tokens = parseArgs(argv)
    const { error } = resolveArgs({ count: required(num) }, tokens)
    expect(error).toBeDefined()
  })

  test('with modifier: short', () => {
    const num = combinator({ parse: Number })
    const argv = ['-c', '5']
    const tokens = parseArgs(argv)
    const { values } = resolveArgs({ count: short(num, 'c') }, tokens)
    expect(values.count).toBe(5)
  })

  test('with modifier: map', () => {
    const num = combinator({ parse: Number })
    const argv = ['--count', '5']
    const tokens = parseArgs(argv)
    const { values } = resolveArgs({ count: { ...map(num, n => n * 10), required: true } }, tokens)
    expect(values.count).toBe(50)
  })

  test('immutability', () => {
    const base = combinator({ parse: Number })
    const withDef = withDefault(base, 0)
    expect((base as ArgSchema).default).toBeUndefined()
    expect(withDef.default).toBe(0)
  })
})

describe('map combinator', () => {
  test('transforms value', () => {
    const argv = ['--count', '5']
    const tokens = parseArgs(argv)
    const { values } = resolveArgs(
      { count: { ...map(integer(), n => n * 2), required: true } },
      tokens
    )
    expect(values.count).toBe(10)
  })

  test('propagates base error', () => {
    const argv = ['--count', 'abc']
    const tokens = parseArgs(argv)
    const { error } = resolveArgs(
      { count: { ...map(integer(), n => n * 2), required: true } },
      tokens
    )
    expect(error).toBeDefined()
    expect((error?.errors[0] as Error).message).toContain('Expected an integer')
  })

  test('immutability', () => {
    const base = integer()
    const mapped = map(base, n => n * 2)
    expect(base.parse('5')).toBe(5)
    expect(mapped.parse('5')).toBe(10)
  })
})

describe('withDefault combinator', () => {
  test('applies default', () => {
    const argv: string[] = []
    const tokens = parseArgs(argv)
    const { values } = resolveArgs({ port: withDefault(integer({ min: 1 }), 8080) }, tokens)
    expect(values.port).toBe(8080)
  })

  test('immutability', () => {
    const base = integer()
    const withDef = withDefault(base, 42)
    expect(base.default).toBeUndefined()
    expect(withDef.default).toBe(42)
  })
})

describe('multiple combinator', () => {
  test('collects values', () => {
    const argv = ['--tag=foo', '--tag', 'bar']
    const tokens = parseArgs(argv)
    const { values } = resolveArgs({ tag: multiple(string()) }, tokens)
    expect(values.tag).toEqual(['foo', 'bar'])
  })
})

describe('required combinator', () => {
  test('resolves value when provided', () => {
    const argv = ['--name', 'hello']
    const tokens = parseArgs(argv)
    const { values, error } = resolveArgs({ name: required(string()) }, tokens)
    expect(error).toBeUndefined()
    expect(values.name).toBe('hello')
  })

  test('errors when value is missing', () => {
    const argv: string[] = []
    const tokens = parseArgs(argv)
    const { error } = resolveArgs({ name: required(string()) }, tokens)
    expect(error).toBeDefined()
  })

  test('immutability', () => {
    const base = string()
    const req = required(base)
    expect((base as ArgSchema).required).toBeUndefined()
    expect(req.required).toBe(true)
  })
})

describe('short combinator', () => {
  test('resolves value via short alias', () => {
    const argv = ['-v']
    const tokens = parseArgs(argv)
    const { values } = resolveArgs({ verbose: short(boolean(), 'v') }, tokens)
    expect(values.verbose).toBe(true)
  })

  test('resolves value via long name', () => {
    const argv = ['--verbose']
    const tokens = parseArgs(argv)
    const { values } = resolveArgs({ verbose: short(boolean(), 'v') }, tokens)
    expect(values.verbose).toBe(true)
  })

  test('immutability', () => {
    const base = boolean()
    const withShort = short(base, 'v')
    expect((base as ArgSchema).short).toBeUndefined()
    expect(withShort.short).toBe('v')
  })
})

describe('integration', () => {
  test('combinator + traditional schema mixed', () => {
    const argv = ['dev', '--port=9131', '--host', 'example.com', '--verbose', '--mode', 'prod']
    const tokens = parseArgs(argv)
    const { values, positionals } = resolveArgs(
      {
        command: positional(),
        port: { ...integer({ min: 1, max: 65535 }), short: 'p' },
        host: { type: 'string', short: 'o', required: true },
        verbose: boolean(),
        mode: { type: 'string', short: 'm' }
      } as const satisfies Args,
      tokens
    )
    expect(values.command).toBe('dev')
    expect(values.port).toBe(9131)
    expect(values.host).toBe('example.com')
    expect(values.verbose).toBe(true)
    expect(values.mode).toBe('prod')
    expect(positionals).toEqual(['dev'])
  })

  test('full round-trip with modifiers', () => {
    const argv = ['--tags=web', '--tags', 'api', '--level', 'info']
    const tokens = parseArgs(argv)
    const { values } = resolveArgs(
      {
        port: withDefault(integer({ min: 1, max: 65535 }), 8080),
        tags: multiple(string()),
        level: choice(['debug', 'info', 'warn', 'error'] as const)
      },
      tokens
    )
    expect(values.port).toBe(8080)
    expect(values.tags).toEqual(['web', 'api'])
    expect(values.level).toBe('info')
  })

  test('required + short + base combinator composition', () => {
    const argv = ['-n', 'hello']
    const tokens = parseArgs(argv)
    const { values, error } = resolveArgs({ name: required(short(string(), 'n')) }, tokens)
    expect(error).toBeUndefined()
    expect(values.name).toBe('hello')
  })

  test('required + short errors when missing', () => {
    const argv: string[] = []
    const tokens = parseArgs(argv)
    const { error } = resolveArgs({ name: required(short(string(), 'n')) }, tokens)
    expect(error).toBeDefined()
  })
})

describe('schema combinators', () => {
  describe('args()', () => {
    test('basic', () => {
      const schema = args({
        name: string(),
        verbose: boolean()
      })
      const tokens = parseArgs(['--name', 'hello', '--verbose'])
      const { values } = resolveArgs(schema, tokens)
      expect(values.name).toBe('hello')
      expect(values.verbose).toBe(true)
    })

    test('with resolveArgs round-trip', () => {
      const schema = args({
        port: withDefault(integer({ min: 1, max: 65535 }), 8080),
        host: required(string())
      })
      const tokens = parseArgs(['--host', 'localhost'])
      const { values, error } = resolveArgs(schema, tokens)
      expect(error).toBeUndefined()
      expect(values.port).toBe(8080)
      expect(values.host).toBe('localhost')
    })
  })

  describe('merge()', () => {
    test('two schemas', () => {
      const common = args({ verbose: boolean() })
      const network = args({ host: required(string()), port: withDefault(integer(), 8080) })
      const schema = merge(common, network)
      const tokens = parseArgs(['--verbose', '--host', 'example.com'])
      const { values, error } = resolveArgs(schema, tokens)
      expect(error).toBeUndefined()
      expect(values.verbose).toBe(true)
      expect(values.host).toBe('example.com')
      expect(values.port).toBe(8080)
    })

    test('three schemas', () => {
      const a = args({ foo: string() })
      const b = args({ bar: integer() })
      const c = args({ baz: boolean() })
      const schema = merge(a, b, c)
      const tokens = parseArgs(['--foo', 'x', '--bar', '42', '--baz'])
      const { values } = resolveArgs(schema, tokens)
      expect(values.foo).toBe('x')
      expect(values.bar).toBe(42)
      expect(values.baz).toBe(true)
    })

    test('last-write-wins on key conflict', () => {
      const a = args({ port: withDefault(string(), '80') })
      const b = args({ port: withDefault(integer(), 8080) })
      const schema = merge(a, b)
      const tokens = parseArgs(['--port', '3000'])
      const { values } = resolveArgs(schema, tokens)
      expect(values.port).toBe(3000)
    })

    test('resolveArgs round-trip', () => {
      const common = args({ help: short(boolean(), 'h') })
      const app = args({ port: withDefault(integer(), 3000), name: required(string()) })
      const schema = merge(common, app)
      const tokens = parseArgs(['-h', '--name', 'myapp'])
      const { values, error } = resolveArgs(schema, tokens)
      expect(error).toBeUndefined()
      expect(values.help).toBe(true)
      expect(values.port).toBe(3000)
      expect(values.name).toBe('myapp')
    })
  })

  describe('extend()', () => {
    test('override existing field', () => {
      const base = args({ port: withDefault(integer(), 8080) })
      const strict = extend(base, { port: required(integer({ min: 1, max: 65535 })) })
      const tokens = parseArgs([])
      const { error } = resolveArgs(strict, tokens)
      expect(error).toBeDefined()
    })

    test('add new fields', () => {
      const base = args({ verbose: boolean() })
      const extended = extend(base, { host: required(string()) })
      const tokens = parseArgs(['--verbose', '--host', 'localhost'])
      const { values, error } = resolveArgs(extended, tokens)
      expect(error).toBeUndefined()
      expect(values.verbose).toBe(true)
      expect(values.host).toBe('localhost')
    })

    test('immutability - original schema not modified', () => {
      const base = args({ port: withDefault(integer(), 8080) })
      const extended = extend(base, { port: required(integer()) })
      expect((base.port as ArgSchema).required).toBeUndefined()
      expect((extended.port as ArgSchema).required).toBe(true)
    })
  })

  describe('integration', () => {
    test('merge + extend composition', () => {
      const common = args({ verbose: boolean(), help: short(boolean(), 'h') })
      const network = args({
        host: withDefault(string(), 'localhost'),
        port: withDefault(integer(), 8080)
      })
      const base = merge(common, network)
      const strict = extend(base, { host: required(string()) })
      const tokens = parseArgs(['--host', 'example.com', '--verbose'])
      const { values, error } = resolveArgs(strict, tokens)
      expect(error).toBeUndefined()
      expect(values.verbose).toBe(true)
      expect(values.host).toBe('example.com')
      expect(values.port).toBe(8080)
    })

    test('modifier combinators with schema combinators', () => {
      const schema = merge(
        args({ tags: multiple(string()) }),
        args({ level: choice(['debug', 'info', 'warn', 'error'] as const) }),
        args({ count: map(integer(), n => n * 2) })
      )
      const tokens = parseArgs(['--tags=web', '--tags', 'api', '--level', 'info', '--count', '5'])
      const { values } = resolveArgs(schema, tokens)
      expect(values.tags).toEqual(['web', 'api'])
      expect(values.level).toBe('info')
      expect(values.count).toBe(10)
    })
  })
})
