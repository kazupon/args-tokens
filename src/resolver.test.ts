/* oxlint-disable no-unsafe-optional-chaining */

import { runInNewContext } from 'node:vm'
import { afterEach, describe, expect, test, vi } from 'vite-plus/test'
import { z } from 'zod/v4-mini'
import { parseArgs } from './parser.ts'
import {
  ArgResolveError,
  ArgsValidationError,
  ArgsValidationErrorKeys,
  isArgsValidationError,
  resolveArgs
} from './resolver.ts'

import type { Args, ArgSchema } from './resolver.ts'

const args = {
  help: {
    type: 'boolean',
    short: 'h'
  },
  version: {
    type: 'boolean',
    short: 'v'
  },
  silent: {
    type: 'boolean',
    short: 's',
    negatable: true
  },
  port: {
    type: 'number',
    short: 'p',
    default: 8080
  },
  mode: {
    type: 'string',
    short: 'm'
  },
  host: {
    type: 'string',
    short: 'o',
    required: true
  }
} as const satisfies Args

describe('resolveArgs', () => {
  test('basic', () => {
    const argv = ['dev', '--port=9131', '--host=example.com', '--help']
    const tokens = parseArgs(argv)
    const { values, positionals, rest, error } = resolveArgs(args, tokens)
    expect(values).toEqual({
      port: 9131,
      host: 'example.com',
      help: true
    })
    expect(positionals).toEqual(['dev'])
    expect(rest).toEqual([])
    expect(error).toBeUndefined()
  })

  test('missing required option', () => {
    const argv = ['dev']
    const tokens = parseArgs(argv)
    const { error } = resolveArgs(args, tokens)
    expect(error?.errors.length).toBe(1)
    expect((error?.errors[0] as Error).message).toEqual(
      "Optional argument '--host' or '-o' is required"
    )
    expect((error?.errors[0] as ArgResolveError).name).toEqual('host')
    expect((error?.errors[0] as ArgResolveError).type).toEqual('required')
    expect((error?.errors[0] as ArgResolveError).schema.type).toEqual('string')
    expect(error?.errors[0]).toBeInstanceOf(ArgsValidationError)
    expect(isArgsValidationError(error?.errors[0])).toBe(true)
    expect((error?.errors[0] as ArgsValidationError).code).toEqual(
      ArgsValidationErrorKeys.requiredOption
    )
    expect((error?.errors[0] as ArgsValidationError).values).toEqual({
      displayName: "'--host' or '-o'",
      name: 'host'
    })
  })

  test('missing defaultable option', () => {
    const argv = ['dev', '--host=example.com']
    const tokens = parseArgs(argv)
    const { values, positionals, rest } = resolveArgs(args, tokens)
    expect(values).toEqual({
      port: 8080,
      host: 'example.com'
    })
    expect(positionals).toEqual(['dev'])
    expect(rest).toEqual([])
  })

  test('invalid value', () => {
    const argv = ['dev', '--port=foo', '--host=example.com']
    const tokens = parseArgs(argv)
    const { error } = resolveArgs(args, tokens)
    expect(error?.errors.length).toBe(1)
    expect((error?.errors[0] as ArgResolveError).message).toEqual(
      "Optional argument '--port' or '-p' should be 'number'"
    )
    expect((error?.errors[0] as ArgResolveError).name).toEqual('port')
    expect((error?.errors[0] as ArgResolveError).type).toEqual('type')
    expect((error?.errors[0] as ArgResolveError).schema.type).toEqual('number')
    expect((error?.errors[0] as ArgsValidationError).code).toEqual(
      ArgsValidationErrorKeys.invalidType
    )
    expect((error?.errors[0] as ArgsValidationError).values).toEqual({
      displayName: "'--port' or '-p'",
      name: 'port',
      expected: 'number',
      actual: 'foo'
    })
  })

  test('multiple errors', () => {
    const argv = ['dev', '--port=foo']
    const tokens = parseArgs(argv)
    const { error } = resolveArgs(args, tokens)
    expect(error?.errors.length).toBe(2)
    expect((error?.errors[0] as Error).message).toEqual(
      "Optional argument '--port' or '-p' should be 'number'"
    )
    expect((error?.errors[0] as ArgResolveError).name).toEqual('port')
    expect((error?.errors[0] as ArgResolveError).type).toEqual('type')
    expect((error?.errors[1] as ArgResolveError).message).toEqual(
      "Optional argument '--host' or '-o' is required"
    )
    expect((error?.errors[1] as ArgResolveError).name).toEqual('host')
    expect((error?.errors[1] as ArgResolveError).type).toEqual('required')
    expect((error?.errors[1] as ArgResolveError).schema.type).toEqual('string')
  })

  test('missing positionals', () => {
    const argv = ['--port=9131', '--host=example.com']
    const tokens = parseArgs(argv)
    const { values, positionals } = resolveArgs(args, tokens)
    expect(values).toEqual({
      port: 9131,
      host: 'example.com'
    })
    expect(positionals).toEqual([])
  })

  test('positionals', () => {
    const argv = ['dev', '--host=example.com', 'foo', 'bar']
    const tokens = parseArgs(argv)
    const { positionals, error } = resolveArgs(args, tokens)
    expect(positionals).toEqual(['dev', 'foo', 'bar'])
    expect(error).toBeUndefined()
  })

  test('long options value captured from positionals', () => {
    const argv = ['dev', '--port', '9131', '--host', 'example.com', 'bar']
    const tokens = parseArgs(argv)
    const { values, positionals, rest } = resolveArgs(args, tokens)
    expect(values).toEqual({
      port: 9131,
      host: 'example.com'
    })
    expect(positionals).toEqual(['dev', 'bar'])
    expect(rest).toEqual([])
  })

  test('long options boolean negative value', () => {
    const argv = ['dev', '--version', '--no-silent']
    const tokens = parseArgs(argv)
    const { values, positionals, rest } = resolveArgs(args, tokens)
    expect(values).toEqual({
      port: 8080,
      version: true,
      silent: false
    })
    expect(positionals).toEqual(['dev'])
    expect(rest).toEqual([])
  })

  test('long option matching a short alias does not satisfy required option', () => {
    const tokens = parseArgs(['--o=example.com'])
    const { error } = resolveArgs(args, tokens)

    expect(
      error?.errors.some(
        item =>
          (item as ArgResolveError).name === 'host' && (item as ArgResolveError).type === 'required'
      )
    ).toBe(true)
  })

  test('required negatable boolean accepts negated long option', () => {
    const argv = ['--no-color']
    const tokens = parseArgs(argv)
    const { values, error, explicit } = resolveArgs(
      {
        color: {
          type: 'boolean',
          negatable: true,
          required: true
        }
      },
      tokens
    )

    expect(error).toBeUndefined()
    expect(values).toEqual({
      color: false
    })
    expect(explicit.color).toBe(true)
  })

  test('short options value specified with equals', () => {
    const argv = ['dev', '-p=9131', '-o=example.com', '-h']
    const tokens = parseArgs(argv)
    const { values, positionals, rest, error } = resolveArgs(args, tokens)
    expect(values).toEqual({
      port: 9131,
      host: 'example.com',
      help: true
    })
    expect(positionals).toEqual(['dev'])
    expect(rest).toEqual([])
    expect(error).toBeUndefined()
  })

  test('short options value specified with concatenation', () => {
    const argv = ['dev', '-p9131', '-oexample.com']
    const tokens = parseArgs(argv)
    const { values, positionals, rest, error } = resolveArgs(args, tokens)
    expect(values).toEqual({
      port: 9131,
      host: 'example.com'
    })
    expect(positionals).toEqual(['dev'])
    expect(rest).toEqual([])
    expect(error).toBeUndefined()
  })

  test('short options value captured from positionals', () => {
    const argv = ['dev', '-p', '9131', '-o', 'example.com', 'bar']
    const tokens = parseArgs(argv)
    const { values, positionals, rest, error } = resolveArgs(args, tokens)
    expect(values).toEqual({
      port: 9131,
      host: 'example.com'
    })
    expect(positionals).toEqual(['dev', 'bar'])
    expect(rest).toEqual([])
    expect(error).toBeUndefined()
  })

  test('complex options', () => {
    const argv = [
      'dev',
      '-p9131',
      '--host',
      'example.com',
      'foo',
      '-m=production',
      '-h',
      '--version',
      'bar',
      'baz',
      '--',
      '--foo',
      '--bar',
      'test'
    ]
    const tokens = parseArgs(argv)
    const { values, positionals, rest, error } = resolveArgs(args, tokens)
    expect(values).toEqual({
      port: 9131,
      host: 'example.com',
      mode: 'production',
      help: true,
      version: true
    })
    expect(positionals).toEqual(['dev', 'foo', 'bar', 'baz'])
    expect(rest).toEqual(['--foo', '--bar', 'test'])
    expect(error).toBeUndefined()
  })

  test('sanitize options', () => {
    const argv = ['dev', '--__proto__', '{ "polluted": 1 }']
    const tokens = parseArgs(argv)
    const { values, positionals, rest, error } = resolveArgs(
      {
        __proto__: {
          type: 'string'
        },
        foo: {
          type: 'string',
          default: 'foo'
        }
      },
      tokens
    )
    expect(values).toEqual({
      foo: 'foo'
    })
    expect(positionals).toEqual(['dev'])
    expect(rest).toEqual([])
    expect(error).toBeUndefined()
  })
})

describe('hidden metadata', () => {
  test('hidden option resolves normally', () => {
    const tokens = parseArgs(['--legacy=compat'])
    const { values, error } = resolveArgs(
      {
        legacy: {
          type: 'string',
          hidden: true
        }
      },
      tokens
    )

    expect(values).toEqual({
      legacy: 'compat'
    })
    expect(error).toBeUndefined()
  })

  test('hidden positional resolves normally', () => {
    const tokens = parseArgs(['deploy'])
    const { values, error } = resolveArgs(
      {
        command: {
          type: 'positional',
          hidden: true
        }
      },
      tokens
    )

    expect(values).toEqual({
      command: 'deploy'
    })
    expect(error).toBeUndefined()
  })

  test('hidden required option still errors when missing', () => {
    const tokens = parseArgs([])
    const { error } = resolveArgs(
      {
        token: {
          type: 'string',
          hidden: true,
          required: true
        }
      },
      tokens
    )

    expect(error?.errors.length).toBe(1)
    expect((error?.errors[0] as ArgResolveError).message).toEqual(
      "Optional argument '--token' is required"
    )
    expect((error?.errors[0] as ArgResolveError).schema.hidden).toBe(true)
  })

  test('hidden option conflicts still error', () => {
    const tokens = parseArgs(['--legacy', '--modern'])
    const { error } = resolveArgs(
      {
        legacy: {
          type: 'boolean',
          hidden: true,
          conflicts: 'modern'
        },
        modern: {
          type: 'boolean'
        }
      },
      tokens
    )

    expect(error?.errors.length).toBe(1)
    expect((error?.errors[0] as ArgResolveError).message).toEqual(
      "Optional argument '--legacy' conflicts with '--modern'"
    )
    expect((error?.errors[0] as ArgResolveError).schema.hidden).toBe(true)
  })
})

describe('structured validation errors', () => {
  test('wraps custom parse failures with code, values and cause', () => {
    const cause = new Error('Invalid config')
    const tokens = parseArgs(['--config', 'bad'])
    const { error } = resolveArgs(
      {
        config: {
          type: 'custom',
          parse() {
            throw cause
          }
        }
      },
      tokens
    )

    expect(error?.errors.length).toBe(1)
    const validationError = error?.errors[0] as ArgsValidationError
    expect(validationError).toBeInstanceOf(ArgsValidationError)
    expect(validationError).not.toBeInstanceOf(ArgResolveError)
    expect(validationError.message).toBe('Invalid config')
    expect(validationError.code).toBe(ArgsValidationErrorKeys.customParse)
    expect(validationError.values).toEqual({
      displayName: "'--config'",
      name: 'config',
      reason: 'Invalid config'
    })
    expect(validationError.cause).toBe(cause)
  })

  test('wraps non-error parse failures with the thrown value as cause', () => {
    const tokens = parseArgs(['--config', 'bad'])
    const { error } = resolveArgs(
      {
        config: {
          type: 'custom',
          parse() {
            // eslint-disable-next-line @typescript-eslint/only-throw-error -- Verify non-Error compatibility.
            throw 'Invalid config'
          }
        }
      },
      tokens
    )

    const validationError = error?.errors[0] as ArgsValidationError
    expect(validationError.message).toBe('Invalid config')
    expect(validationError.code).toBe(ArgsValidationErrorKeys.customParse)
    expect(validationError.values).toEqual({
      displayName: "'--config'",
      name: 'config',
      reason: 'Invalid config'
    })
    expect(validationError.cause).toBe('Invalid config')
  })

  test('does not double wrap user thrown ArgsValidationError', () => {
    const thrown = new ArgsValidationError('Use a finite count', {
      code: ArgsValidationErrorKeys.invalidType,
      values: {
        expected: 'finite-count'
      }
    })
    const tokens = parseArgs(['--count', 'bad'])
    const { error } = resolveArgs(
      {
        count: {
          type: 'custom',
          parse() {
            throw thrown
          }
        }
      },
      tokens
    )

    const validationError = error?.errors[0] as ArgsValidationError
    expect(validationError).toBe(thrown)
    expect(validationError.code).toBe(ArgsValidationErrorKeys.invalidType)
    expect(validationError.values).toEqual({
      expected: 'finite-count',
      name: 'count',
      displayName: "'--count'",
      actual: 'bad'
    })
  })

  test('wraps multiple positional parse failures with positional values', () => {
    const cause = new Error('Not a count')
    const tokens = parseArgs(['1', 'bad', '2'])
    const { error } = resolveArgs(
      {
        counts: {
          type: 'positional',
          multiple: true,
          parse(value: string) {
            if (value === 'bad') {
              throw cause
            }
            return Number(value)
          }
        }
      },
      tokens
    )

    expect(error?.errors.length).toBe(1)
    const validationError = error?.errors[0] as ArgsValidationError
    expect(validationError.message).toBe('Not a count')
    expect(validationError.code).toBe(ArgsValidationErrorKeys.customParse)
    expect(validationError.values).toEqual({
      displayName: "'counts'",
      name: 'counts',
      reason: 'Not a count'
    })
    expect(validationError.cause).toBe(cause)
  })
})

describe('isArgsValidationError', () => {
  // the registry key is the contract shared with other bundled copies of `args-tokens`
  const ARGS_VALIDATION_ERROR_BRAND = Symbol.for('args-tokens.ArgsValidationError')

  afterEach(() => {
    vi.resetModules()
  })

  /**
   * Load two independent copies of the resolver module, like a host and a plugin that each
   * bundle `args-tokens`. `instanceof` does not match across the copies.
   *
   * @returns The two module copies
   */
  async function loadResolverCopies() {
    const copyA = await import('./resolver.ts')
    vi.resetModules()
    const copyB = await import('./resolver.ts')
    // guard the premise: otherwise the cross-copy tests would pass trivially
    expect(copyA.ArgsValidationError).not.toBe(copyB.ArgsValidationError)
    return { copyA, copyB }
  }

  const crossCopyCases: {
    title: string
    schema: Args
    argv: string[]
    name: string
  }[] = [
    {
      title: 'required option',
      schema: { foo: { type: 'string', required: true } },
      argv: [],
      name: 'foo'
    },
    {
      title: 'required positional',
      schema: { file: { type: 'positional' } },
      argv: [],
      name: 'file'
    },
    {
      title: 'invalid type',
      schema: { port: { type: 'number' } },
      argv: ['--port', 'abc'],
      name: 'port'
    },
    {
      title: 'invalid choice',
      schema: { level: { type: 'enum', choices: ['debug', 'info'] } },
      argv: ['--level', 'warn'],
      name: 'level'
    },
    {
      title: 'conflict',
      schema: { foo: { type: 'boolean', conflicts: 'bar' }, bar: { type: 'boolean' } },
      argv: ['--foo', '--bar'],
      name: 'foo'
    },
    {
      title: 'custom parse',
      schema: {
        config: {
          type: 'custom',
          parse() {
            throw new Error('Invalid config')
          }
        }
      },
      argv: ['--config', 'bad'],
      name: 'ArgsValidationError'
    }
  ]

  test.each(crossCopyCases)(
    'recognizes $title error created by another module copy',
    async ({ schema, argv, name }) => {
      const { copyA, copyB } = await loadResolverCopies()

      const { error } = copyA.resolveArgs(schema, parseArgs(argv))
      expect(error?.errors.length).toBe(1)
      const [thrown] = error!.errors as Error[]

      expect(thrown).not.toBeInstanceOf(copyB.ArgsValidationError)
      // `ArgResolveError` overrides `name` with the argument name, so `name` cannot be the brand
      expect(thrown.name).toBe(name)
      expect(copyB.isArgsValidationError(thrown)).toBe(true)
    }
  )

  test('recognizes ArgsValidationError and ArgResolveError instances', () => {
    const validationError = new ArgsValidationError('Invalid config', {
      code: ArgsValidationErrorKeys.customParse
    })
    const resolveError = new ArgResolveError(
      "Optional argument '--foo' is required",
      'foo',
      'required',
      { type: 'string', required: true },
      { code: ArgsValidationErrorKeys.requiredOption }
    )

    expect(isArgsValidationError(validationError)).toBe(true)
    expect(resolveError.name).toBe('foo')
    expect(isArgsValidationError(resolveError)).toBe(true)
  })

  test('brand is non-enumerable and immutable', () => {
    const error = new ArgResolveError(
      "Optional argument '--foo' is required",
      'foo',
      'required',
      { type: 'string', required: true },
      { code: ArgsValidationErrorKeys.requiredOption, values: { name: 'foo' } }
    )

    expect(Object.getOwnPropertyDescriptor(error, ARGS_VALIDATION_ERROR_BRAND)).toEqual({
      value: true,
      enumerable: false,
      writable: false,
      configurable: false
    })
    // copying own enumerable properties (string and symbol keys) must not carry the brand
    expect(ARGS_VALIDATION_ERROR_BRAND in Object.assign({}, error)).toBe(false)
    // equality with an unbranded error that has the same shape is not affected by the brand
    expect(error).toEqual(
      Object.assign(new Error("Optional argument '--foo' is required"), {
        name: 'foo',
        type: 'required',
        schema: { type: 'string', required: true },
        code: ArgsValidationErrorKeys.requiredOption,
        values: { name: 'foo' }
      })
    )

    // modules are strict mode, so writing or deleting a non-writable, non-configurable property throws
    expect(() => {
      ;(error as unknown as Record<PropertyKey, unknown>)[ARGS_VALIDATION_ERROR_BRAND] = false
    }).toThrow(TypeError)
    expect(() => {
      delete (error as unknown as Record<PropertyKey, unknown>)[ARGS_VALIDATION_ERROR_BRAND]
    }).toThrow(TypeError)
    expect(isArgsValidationError(error)).toBe(true)
  })

  test('recognizes a branded error from a foreign class that overrides name', () => {
    class ForeignArgResolveError extends Error {
      code = ArgsValidationErrorKeys.requiredOption
      values = {}
      constructor() {
        super("Optional argument '--foo' is required")
        this.name = 'foo'
        Object.defineProperty(this, ARGS_VALIDATION_ERROR_BRAND, { value: true })
      }
    }

    const error = new ForeignArgResolveError()
    expect(error).not.toBeInstanceOf(ArgsValidationError)
    expect(isArgsValidationError(error)).toBe(true)
  })

  test.each([
    { title: 'null', value: null },
    { title: 'undefined', value: undefined },
    { title: 'string', value: 'ArgsValidationError' },
    { title: 'number', value: 42 },
    { title: 'plain Error', value: new Error('Invalid config') },
    {
      title: 'Error named ArgsValidationError',
      value: Object.assign(new Error('Invalid config'), { name: 'ArgsValidationError' })
    },
    {
      title: 'object shaped like ArgsValidationError',
      value: {
        name: 'ArgsValidationError',
        message: 'Invalid config',
        code: ArgsValidationErrorKeys.customParse,
        values: {}
      }
    },
    {
      title: 'brand set to a string',
      value: { [ARGS_VALIDATION_ERROR_BRAND]: 'true', values: {} }
    },
    { title: 'brand set to 1', value: { [ARGS_VALIDATION_ERROR_BRAND]: 1, values: {} } },
    { title: 'brand set to false', value: { [ARGS_VALIDATION_ERROR_BRAND]: false, values: {} } },
    {
      title: 'brand keyed by a non-registry symbol',
      value: { [Symbol('args-tokens.ArgsValidationError')]: true, values: {} }
    },
    {
      title: 'inherited brand',
      value: Object.assign(Object.create({ [ARGS_VALIDATION_ERROR_BRAND]: true }) as object, {
        values: {}
      })
    },
    { title: 'brand without values', value: { [ARGS_VALIDATION_ERROR_BRAND]: true } },
    {
      title: 'brand with null values',
      value: { [ARGS_VALIDATION_ERROR_BRAND]: true, values: null }
    },
    {
      title: 'brand with string values',
      value: { [ARGS_VALIDATION_ERROR_BRAND]: true, values: 'name' }
    },
    { title: 'brand with number values', value: { [ARGS_VALIDATION_ERROR_BRAND]: true, values: 1 } }
  ])('rejects $title', ({ value }) => {
    expect(isArgsValidationError(value)).toBe(false)
  })

  test('recognizes a branded error created in another realm', () => {
    const error: unknown = runInNewContext(`
      const error = new Error('Invalid config')
      Object.defineProperty(error, Symbol.for('args-tokens.ArgsValidationError'), { value: true })
      error.values = {}
      error
    `)

    // the global symbol registry is shared across realms, while `Error` is not
    expect(error).not.toBeInstanceOf(Error)
    expect(isArgsValidationError(error)).toBe(true)
  })

  test('wraps a forged brand without values thrown from a custom parse', () => {
    const forged = { [ARGS_VALIDATION_ERROR_BRAND]: true }
    const tokens = parseArgs(['--config', 'bad'])

    const { error } = resolveArgs(
      {
        config: {
          type: 'custom',
          parse() {
            // eslint-disable-next-line @typescript-eslint/only-throw-error -- Verify forged brand handling.
            throw forged
          }
        }
      },
      tokens
    )

    expect(error?.errors.length).toBe(1)
    const validationError = error?.errors[0] as ArgsValidationError
    expect(validationError).not.toBe(forged)
    expect(validationError.code).toBe(ArgsValidationErrorKeys.customParse)
    expect(validationError.cause).toBe(forged)
  })

  test('ignores a brand inherited from a polluted Object.prototype', () => {
    Object.defineProperty(Object.prototype, ARGS_VALIDATION_ERROR_BRAND, {
      value: true,
      writable: true,
      configurable: true
    })
    try {
      // own `values`, so only the own-brand check can reject it
      const cause = Object.assign(new Error('Invalid config'), { values: {} })
      expect(isArgsValidationError(cause)).toBe(false)

      const { error } = resolveArgs(
        {
          config: {
            type: 'custom',
            parse() {
              throw cause
            }
          }
        },
        parseArgs(['--config', 'bad'])
      )

      expect(error?.errors.length).toBe(1)
      const validationError = error?.errors[0] as ArgsValidationError
      expect(validationError.code).toBe(ArgsValidationErrorKeys.customParse)
      expect(validationError.cause).toBe(cause)
    } finally {
      Reflect.deleteProperty(Object.prototype, ARGS_VALIDATION_ERROR_BRAND)
    }
    expect(ARGS_VALIDATION_ERROR_BRAND in {}).toBe(false)
  })

  /**
   * Resolve a custom argument whose `parse` throws the given value.
   *
   * @param thrown - The value thrown from `parse`
   * @param resolve - The `resolveArgs` implementation to use
   * @returns The resolved result
   */
  function resolveWithThrowingParse(thrown: unknown, resolve: typeof resolveArgs = resolveArgs) {
    return resolve(
      {
        count: {
          type: 'custom',
          parse() {
            // eslint-disable-next-line @typescript-eslint/only-throw-error -- Verify arbitrary thrown values.
            throw thrown
          }
        }
      },
      parseArgs(['--count', 'bad'])
    )
  }

  test('wraps an ArgsValidationError from another module copy whose values cannot be updated', async () => {
    const { copyA, copyB } = await loadResolverCopies()
    const thrown = new copyB.ArgsValidationError('Use a finite count', {
      code: copyB.ArgsValidationErrorKeys.invalidType,
      values: Object.freeze({ expected: 'finite-count' })
    })

    const { error } = resolveWithThrowingParse(thrown, copyA.resolveArgs)

    expect(error?.errors.length).toBe(1)
    const validationError = error?.errors[0] as ArgsValidationError
    expect(validationError).not.toBe(thrown)
    expect(validationError.code).toBe(ArgsValidationErrorKeys.customParse)
    expect(validationError.message).toBe('Use a finite count')
    expect(validationError.cause).toBe(thrown)
  })

  test('wraps an ArgsValidationError whose values cannot be updated', () => {
    const thrown = new ArgsValidationError('Use a finite count', {
      code: ArgsValidationErrorKeys.invalidType,
      values: Object.freeze({ expected: 'finite-count' })
    })

    const { error } = resolveWithThrowingParse(thrown)

    expect(error?.errors.length).toBe(1)
    const validationError = error?.errors[0] as ArgsValidationError
    expect(validationError).not.toBe(thrown)
    expect(validationError.code).toBe(ArgsValidationErrorKeys.customParse)
    expect(validationError.cause).toBe(thrown)
  })

  test('reuses an ArgsValidationError with frozen values that need no update', () => {
    const thrown = new ArgsValidationError('Use a finite count', {
      code: ArgsValidationErrorKeys.customParse,
      values: Object.freeze({ name: 'count', displayName: "'--count'" })
    })

    const { error } = resolveWithThrowingParse(thrown)

    expect(error?.errors[0]).toBe(thrown)
  })

  test.each([
    {
      title: 'a forged brand with frozen values',
      thrown: { [ARGS_VALIDATION_ERROR_BRAND]: true, values: Object.freeze({}) }
    },
    {
      title: 'a brand accessor that throws',
      thrown: Object.defineProperty({ values: {} }, ARGS_VALIDATION_ERROR_BRAND, {
        get() {
          throw new Error('brand getter')
        }
      })
    },
    {
      title: 'a values accessor that throws',
      thrown: Object.defineProperty({ [ARGS_VALIDATION_ERROR_BRAND]: true }, 'values', {
        get() {
          throw new Error('values getter')
        }
      })
    },
    {
      title: 'a proxy whose getOwnPropertyDescriptor trap throws',
      thrown: new Proxy(new Error('proxied'), {
        getOwnPropertyDescriptor() {
          throw new Error('getOwnPropertyDescriptor trap')
        }
      })
    }
  ])('wraps $title thrown from a custom parse without throwing', ({ thrown }) => {
    // before the fix, resolveArgs itself threw here
    const { error } = resolveWithThrowingParse(thrown)

    expect(error?.errors.length).toBe(1)
    const validationError = error?.errors[0] as ArgsValidationError
    expect(validationError).not.toBe(thrown)
    expect(validationError.code).toBe(ArgsValidationErrorKeys.customParse)
    expect(validationError.cause).toBe(thrown)
  })

  test('does not double wrap ArgsValidationError thrown from another module copy', async () => {
    const { copyA, copyB } = await loadResolverCopies()
    const thrown = new copyB.ArgsValidationError('Use a finite count', {
      code: copyB.ArgsValidationErrorKeys.invalidType,
      values: {
        expected: 'finite-count'
      }
    })

    const { error } = copyA.resolveArgs(
      {
        count: {
          type: 'custom',
          parse() {
            throw thrown
          }
        }
      },
      parseArgs(['--count', 'bad'])
    )

    expect(error?.errors.length).toBe(1)
    const validationError = error?.errors[0] as ArgsValidationError
    expect(validationError).toBe(thrown)
    expect(validationError).not.toBeInstanceOf(copyA.ArgsValidationError)
    expect(validationError.code).toBe(ArgsValidationErrorKeys.invalidType)
    expect(validationError.values).toEqual({
      expected: 'finite-count',
      name: 'count',
      displayName: "'--count'",
      actual: 'bad'
    })
  })
})

describe('option group', () => {
  test('basic', () => {
    const argv = ['dev', '-dsV']
    const tokens = parseArgs(argv)
    const { values, positionals, rest } = resolveArgs(
      {
        debug: {
          type: 'boolean',
          short: 'd'
        },
        silent: {
          type: 'boolean',
          short: 's'
        },
        verbose: {
          type: 'boolean',
          short: 'V'
        }
      },
      tokens,
      { shortGrouping: true }
    )
    expect(positionals).toEqual(['dev'])
    expect(rest).toEqual([])
    expect(values).toEqual({
      debug: true,
      silent: true,
      verbose: true
    })
  })

  test('mix option grouping and long option', () => {
    const argv = ['dev', '-ds', '--host', 'example.com', '-Vm', 'foo', 'bar']
    const tokens = parseArgs(argv)
    const { values, positionals, rest } = resolveArgs(
      {
        debug: {
          type: 'boolean',
          short: 'd'
        },
        silent: {
          type: 'boolean',
          short: 's'
        },
        verbose: {
          type: 'boolean',
          short: 'V'
        },
        host: {
          type: 'string',
          short: 'o'
        },
        minify: {
          type: 'boolean',
          short: 'm'
        }
      },
      tokens,
      { shortGrouping: true }
    )
    expect(positionals).toEqual(['dev', 'foo', 'bar'])
    expect(rest).toEqual([])
    expect(values).toEqual({
      debug: true,
      silent: true,
      verbose: true,
      minify: true,
      host: 'example.com'
    })
  })
})

describe('short option with a value after =', () => {
  const args = {
    port: {
      type: 'number',
      short: 'p'
    },
    name: {
      type: 'string',
      short: 'n'
    },
    verbose: {
      type: 'boolean',
      short: 'v'
    }
  } as const satisfies Args

  test.each([false, true])('-p=-5 resolves to -5 (shortGrouping: %s)', shortGrouping => {
    const { values, error } = resolveArgs(args, parseArgs(['-p=-5']), { shortGrouping })
    expect(error).toBeUndefined()
    expect(values.port).toBe(-5)
  })

  test('-n=-foo keeps the dash', () => {
    const { values, error } = resolveArgs(args, parseArgs(['-n=-foo']))
    expect(error).toBeUndefined()
    expect(values.name).toBe('-foo')
  })

  test('-n=-- is a value, not the option terminator', () => {
    const { values, error, rest } = resolveArgs(args, parseArgs(['-n=--', '-v']))
    expect(error).toBeUndefined()
    expect(values.name).toBe('--')
    expect(values.verbose).toBe(true)
    expect(rest).toEqual([])
  })

  test.each([false, true])(
    'a boolean option rejects a value starting with - like any other value (shortGrouping: %s)',
    shortGrouping => {
      const { values, error } = resolveArgs(args, parseArgs(['-v=-5']), { shortGrouping })
      expect(error?.errors.length).toBe(1)
      const resolveError = error?.errors[0] as ArgResolveError
      expect(resolveError.code).toBe(ArgsValidationErrorKeys.invalidType)
      expect(resolveError.values.actual).toBe('-5')
      expect(values.verbose).toBeUndefined()
    }
  )

  test('the value goes to the last option of a group with shortGrouping', () => {
    const { values, error } = resolveArgs(args, parseArgs(['-vp=-5']), { shortGrouping: true })
    expect(error).toBeUndefined()
    expect(values.port).toBe(-5)
    expect(values.verbose).toBe(true)
  })
})

describe('number option without a value', () => {
  const args = {
    port: {
      type: 'number',
      short: 'p'
    },
    verbose: {
      type: 'boolean',
      short: 'v'
    }
  } as const satisfies Args

  /**
   * Assert that the resolve error reports a missing value on the `port` number option.
   *
   * @param error - The aggregate error returned by `resolveArgs`
   * @param displayName - The expected display name of the option
   * @param hint - The expected suggestion, when the next argument may be a value starting with `-`
   */
  function expectMissingNumberValue(
    error: AggregateError | undefined,
    displayName: string,
    hint?: { next: string; suggestion: string }
  ) {
    expect(error?.errors.length).toBe(1)
    const resolveError = error?.errors[0] as ArgResolveError
    expect(resolveError).toBeInstanceOf(ArgResolveError)
    expect(resolveError.name).toBe('port')
    expect(resolveError.type).toBe('type')
    expect(resolveError.code).toBe(ArgsValidationErrorKeys.missingValue)
    expect(resolveError.message).toBe(
      `Optional argument ${displayName} requires a value${hint ? ` (to pass '${hint.next}' as its value, write '${hint.suggestion}')` : ''}`
    )
    // no `actual`: there is no value, unlike an explicit empty value (`--port=`)
    expect(resolveError.values).toStrictEqual({
      displayName,
      name: 'port',
      expected: 'number',
      ...hint
    })
  }

  test.each([
    { label: '--port', argv: ['--port'] },
    { label: '-p', argv: ['-p'] },
    {
      label: '--port -5',
      argv: ['--port', '-5'],
      hint: { next: '-5', suggestion: '--port=-5' }
    },
    // grouped short options take the `shortGrouping` path, where `-p` gets no value either
    {
      label: '-pv with shortGrouping',
      argv: ['-pv'],
      options: { shortGrouping: true },
      verbose: true
    },
    {
      label: '-vp with shortGrouping',
      argv: ['-vp'],
      options: { shortGrouping: true },
      verbose: true
    }
  ])('$label reports a missing value', ({ argv, options, verbose, hint }) => {
    const { values, error, explicit } = resolveArgs(args, parseArgs(argv), options)
    expectMissingNumberValue(error, "'--port' or '-p'", hint)
    expect(values.port).toBeUndefined()
    expect(values.verbose).toBe(verbose)
    expect(explicit.port).toBe(true)
  })

  test('kebab-case option name', () => {
    const { values, error } = resolveArgs(
      {
        serverPort: {
          type: 'number'
        }
      },
      parseArgs(['--server-port']),
      { toKebab: true }
    )
    expect(error?.errors.length).toBe(1)
    const resolveError = error?.errors[0] as ArgResolveError
    expect(resolveError.name).toBe('server-port')
    expect(resolveError.code).toBe(ArgsValidationErrorKeys.missingValue)
    expect(resolveError.message).toBe("Optional argument '--server-port' requires a value")
    expect(resolveError.values).toEqual({
      displayName: "'--server-port'",
      name: 'serverPort',
      expected: 'number'
    })
    expect(resolveError.values).not.toHaveProperty('actual')
    expect(values.serverPort).toBeUndefined()
  })

  test('before the option terminator', () => {
    const { values, error, rest } = resolveArgs(args, parseArgs(['--port', '--', 'x']))
    expectMissingNumberValue(error, "'--port' or '-p'")
    expect(values.port).toBeUndefined()
    expect(rest).toEqual(['x'])
  })

  test('followed by another option', () => {
    const { values, error } = resolveArgs(args, parseArgs(['--port', '--verbose']))
    expectMissingNumberValue(error, "'--port' or '-p'")
    expect(values.port).toBeUndefined()
    expect(values.verbose).toBe(true)
  })

  test('with a default', () => {
    const { values, error } = resolveArgs(
      {
        port: {
          type: 'number',
          default: 8080
        }
      },
      parseArgs(['--port'])
    )
    expectMissingNumberValue(error, "'--port'")
    expect(values.port).toBe(8080)
  })

  test('with multiple values', () => {
    const { values, error } = resolveArgs(
      {
        port: {
          type: 'number',
          multiple: true
        }
      },
      parseArgs(['--port', '1', '--port'])
    )
    expectMissingNumberValue(error, "'--port'")
    expect(values.port).toEqual([1])
  })

  test('a required option reports a missing value, not a required option', () => {
    const { values, error } = resolveArgs(
      {
        port: {
          type: 'number',
          required: true
        }
      },
      parseArgs(['--port'])
    )
    expectMissingNumberValue(error, "'--port'")
    expect(values.port).toBeUndefined()
  })

  test('an explicit empty value keeps its actual value', () => {
    const { values, error } = resolveArgs(args, parseArgs(['--port=']))
    expect(error?.errors.length).toBe(1)
    const resolveError = error?.errors[0] as ArgResolveError
    expect(resolveError.code).toBe(ArgsValidationErrorKeys.invalidType)
    expect(resolveError.values.actual).toBe('')
    expect(values.port).toBeUndefined()
  })

  test.each([
    { argv: ['--port=-5'], port: -5 },
    { argv: ['--port', '8080'], port: 8080 },
    { argv: ['-p', '8080'], port: 8080 },
    { argv: ['--port=0'], port: 0 }
  ])('$argv still resolves to a number', ({ argv, port }) => {
    const { values, error } = resolveArgs(args, parseArgs(argv))
    expect(error).toBeUndefined()
    expect(values.port).toBe(port)
  })

  test('a string option without a value reports the same kind of error', () => {
    const { error } = resolveArgs({ name: { type: 'string' } }, parseArgs(['--name']))
    const resolveError = error?.errors[0] as ArgResolveError
    expect(resolveError.code).toBe(ArgsValidationErrorKeys.missingValue)
    expect(resolveError.values).toEqual({
      displayName: "'--name'",
      name: 'name',
      expected: 'string'
    })
    expect(resolveError.values).not.toHaveProperty('actual')
  })

  test('a number option with a parse function reports the missing value (#617)', () => {
    const received: string[] = []
    const { values, error } = resolveArgs(
      {
        port: {
          type: 'number',
          parse: (value: string) => {
            received.push(value)
            return Number(value)
          }
        }
      },
      parseArgs(['--port'])
    )
    expectMissingNumberValue(error, "'--port'")
    expect(values.port).toBeUndefined()
    expect(received).toEqual([])
  })
})

describe('enum option', () => {
  test('basic', () => {
    const argv = ['dev', '--log=debug']
    const tokens = parseArgs(argv)
    const { values, positionals, rest } = resolveArgs(
      {
        log: {
          type: 'enum',
          short: 'l',
          choices: ['debug', 'info', 'warn', 'error']
        }
      },
      tokens
    )
    expect(values).toEqual({
      log: 'debug'
    })
    expect(positionals).toEqual(['dev'])
    expect(rest).toEqual([])
  })

  test('invalid value', () => {
    const argv = ['dev', '--log=foo']
    const tokens = parseArgs(argv)
    const { error } = resolveArgs(
      {
        log: {
          type: 'enum',
          short: 'l',
          choices: ['debug', 'info', 'warn', 'error']
        }
      },
      tokens
    )
    expect(error?.errors.length).toBe(1)
    expect((error?.errors[0] as ArgResolveError).message).toEqual(
      `Optional argument '--log' or '-l' should be chosen from 'enum' ["debug", "info", "warn", "error"] values`
    )
    expect((error?.errors[0] as ArgResolveError).name).toEqual('log')
    expect((error?.errors[0] as ArgResolveError).type).toEqual('type')
    expect((error?.errors[0] as ArgResolveError).schema.type).toEqual('enum')
    expect((error?.errors[0] as ArgsValidationError).code).toEqual(
      ArgsValidationErrorKeys.invalidChoice
    )
    expect((error?.errors[0] as ArgsValidationError).values).toEqual({
      displayName: "'--log' or '-l'",
      name: 'log',
      expected: 'enum',
      choices: '"debug", "info", "warn", "error"',
      choiceValues: ['debug', 'info', 'warn', 'error'],
      actual: 'foo'
    })
  })

  test('required', () => {
    const argv = ['dev']
    const tokens = parseArgs(argv)
    const { error } = resolveArgs(
      {
        log: {
          type: 'enum',
          short: 'l',
          choices: ['debug', 'info', 'warn', 'error'],
          required: true
        }
      },
      tokens
    )
    expect(error?.errors.length).toBe(1)
    expect((error?.errors[0] as Error).message).toEqual(
      "Optional argument '--log' or '-l' is required"
    )
    expect((error?.errors[0] as ArgResolveError).name).toEqual('log')
    expect((error?.errors[0] as ArgResolveError).type).toEqual('required')
    expect((error?.errors[0] as ArgResolveError).schema.type).toEqual('enum')
  })

  test('missing', () => {
    const argv = ['dev', '--', 'bar']
    const tokens = parseArgs(argv)
    const { error, values, positionals, rest } = resolveArgs(
      {
        log: {
          type: 'enum',
          short: 'l',
          choices: ['debug', 'info', 'warn', 'error']
        }
      },
      tokens
    )
    expect(error).toBeUndefined()
    expect(values).toEqual({})
    expect(positionals).toEqual(['dev'])
    expect(rest).toEqual(['bar'])
  })

  test('default', () => {
    const argv = ['dev']
    const tokens = parseArgs(argv)
    const { values, positionals } = resolveArgs(
      {
        log: {
          type: 'enum',
          short: 'l',
          choices: ['debug', 'info', 'warn', 'error'],
          default: 'info'
        }
      },
      tokens
    )
    expect(values).toEqual({
      log: 'info'
    })
    expect(positionals).toEqual(['dev'])
  })

  test('option without a value', () => {
    const argv = ['dev', '--log']
    const tokens = parseArgs(argv)
    const { error } = resolveArgs(
      {
        log: {
          type: 'enum',
          short: 'l',
          choices: ['debug', 'info', 'warn', 'error'],
          default: 'foo'
        }
      },
      tokens
    )
    expect(error?.errors.length).toBe(1)
    const resolveError = error?.errors[0] as ArgResolveError
    expect(resolveError.code).toBe(ArgsValidationErrorKeys.missingValue)
    expect(resolveError.message).toEqual(`Optional argument '--log' or '-l' requires a value`)
    expect(resolveError.values).toStrictEqual({
      displayName: "'--log' or '-l'",
      name: 'log',
      expected: 'enum',
      choices: '"debug", "info", "warn", "error"',
      choiceValues: ['debug', 'info', 'warn', 'error']
    })
    expect(resolveError.name).toEqual('log')
    expect(resolveError.type).toEqual('type')
    expect(resolveError.schema.type).toEqual('enum')
  })
})

describe('enum option with a parse function', () => {
  test.each([
    { label: '--level=verbose', argv: ['--level=verbose'] },
    { label: '--level verbose', argv: ['--level', 'verbose'] },
    { label: '-l verbose', argv: ['-l', 'verbose'] }
  ])('$label reports a value outside the choices without calling parse', ({ argv }) => {
    const received: string[] = []
    const { values, error } = resolveArgs(
      {
        level: {
          type: 'enum',
          short: 'l',
          choices: ['debug', 'info'],
          parse: (value: string) => {
            received.push(value)
            return value.toUpperCase()
          }
        }
      },
      parseArgs(argv)
    )
    expect(error?.errors.length).toBe(1)
    const resolveError = error?.errors[0] as ArgResolveError
    expect(resolveError).toBeInstanceOf(ArgResolveError)
    expect(resolveError.type).toBe('type')
    expect(resolveError.code).toBe(ArgsValidationErrorKeys.invalidChoice)
    expect(resolveError.message).toBe(
      `Optional argument '--level' or '-l' should be chosen from 'enum' ["debug", "info"] values`
    )
    expect(resolveError.values).toEqual({
      displayName: "'--level' or '-l'",
      name: 'level',
      expected: 'enum',
      choices: '"debug", "info"',
      choiceValues: ['debug', 'info'],
      actual: 'verbose'
    })
    expect(values.level).toBeUndefined()
    expect(received).toEqual([])
  })

  test('multiple values keep the ones in the choices', () => {
    const received: string[] = []
    const { values, error } = resolveArgs(
      {
        level: {
          type: 'enum',
          multiple: true,
          choices: ['debug', 'info'],
          parse: (value: string) => {
            received.push(value)
            return value.toUpperCase()
          }
        }
      },
      parseArgs(['--level=debug', '--level=verbose'])
    )
    expect(error?.errors.length).toBe(1)
    expect((error?.errors[0] as ArgResolveError).code).toBe(ArgsValidationErrorKeys.invalidChoice)
    expect(values.level).toEqual(['DEBUG'])
    expect(received).toEqual(['debug'])
  })

  test('a value outside the choices is reported before a parse function can throw', () => {
    const { error } = resolveArgs(
      {
        config: {
          type: 'enum',
          choices: ['a', 'b'],
          parse: (value: string) => JSON.parse(value) as unknown
        }
      },
      parseArgs(['--config=zzz'])
    )
    expect(error?.errors.length).toBe(1)
    const resolveError = error?.errors[0] as ArgResolveError
    expect(resolveError.code).toBe(ArgsValidationErrorKeys.invalidChoice)
    expect(resolveError.values.actual).toBe('zzz')
  })

  test('choices list the values given on the command line, not the parsed ones', () => {
    const { values, error } = resolveArgs(
      {
        level: {
          type: 'enum',
          choices: ['DEBUG', 'INFO'],
          parse: (value: string) => value.toUpperCase()
        }
      },
      parseArgs(['--level=debug'])
    )
    expect(error?.errors.length).toBe(1)
    expect((error?.errors[0] as ArgResolveError).code).toBe(ArgsValidationErrorKeys.invalidChoice)
    expect(values.level).toBeUndefined()
  })

  test('a value in the choices goes through parse', () => {
    const received: string[] = []
    const { values, error } = resolveArgs(
      {
        level: {
          type: 'enum',
          choices: ['debug', 'info'],
          parse: (value: string) => {
            received.push(value)
            return value.toUpperCase()
          }
        }
      },
      parseArgs(['--level=info'])
    )
    expect(error).toBeUndefined()
    expect(values.level).toBe('INFO')
    expect(received).toEqual(['info'])
  })

  test('parse can return a value that is not a string', () => {
    const { values, error } = resolveArgs(
      {
        priority: {
          type: 'enum',
          choices: ['low', 'high'],
          parse: (value: string) => (value === 'low' ? 0 : 1)
        }
      },
      parseArgs(['--priority=high'])
    )
    expect(error).toBeUndefined()
    expect(values.priority).toBe(1)
  })

  test('parse can still reject a value in the choices', () => {
    const { error } = resolveArgs(
      {
        x: {
          type: 'enum',
          choices: ['a', 'b'],
          parse: (value: string) => {
            if (value === 'b') {
              throw new Error('b is not supported yet')
            }
            return value
          }
        }
      },
      parseArgs(['--x=b'])
    )
    expect(error?.errors.length).toBe(1)
    const validationError = error?.errors[0] as ArgsValidationError
    expect(validationError.code).toBe(ArgsValidationErrorKeys.customParse)
    expect(validationError.values.reason).toBe('b is not supported yet')
  })

  test('an enum without choices passes any value to parse', () => {
    const { values, error } = resolveArgs(
      { level: { type: 'enum', parse: (value: string) => value.toUpperCase() } },
      parseArgs(['--level=anything'])
    )
    expect(error).toBeUndefined()
    expect(values.level).toBe('ANYTHING')
  })

  test('a default is filled in next to a value outside the choices', () => {
    const { values, error } = resolveArgs(
      {
        level: {
          type: 'enum',
          choices: ['debug', 'info'],
          default: 'debug',
          parse: (value: string) => value.toUpperCase()
        }
      },
      parseArgs(['--level=verbose'])
    )
    expect((error?.errors[0] as ArgResolveError).code).toBe(ArgsValidationErrorKeys.invalidChoice)
    expect(values.level).toBe('debug')
  })

  test('an explicit empty value is checked against the choices too', () => {
    const received: string[] = []
    const level = {
      type: 'enum',
      choices: ['debug', 'info'],
      parse: (value: string) => {
        received.push(value)
        return value
      }
    } as const
    const { values, error } = resolveArgs({ level }, parseArgs(['--level=']))
    expect(error?.errors.length).toBe(1)
    const resolveError = error?.errors[0] as ArgResolveError
    expect(resolveError.code).toBe(ArgsValidationErrorKeys.invalidChoice)
    expect(resolveError.values.actual).toBe('')
    expect(values.level).toBeUndefined()

    // a default does not stand in for the explicit empty value, but is filled in next to the error
    const withDefault = resolveArgs(
      { level: { ...level, default: 'debug' } },
      parseArgs(['--level='])
    )
    expect((withDefault.error?.errors[0] as ArgResolveError).code).toBe(
      ArgsValidationErrorKeys.invalidChoice
    )
    expect(withDefault.values.level).toBe('debug')

    // a required option reports an explicit empty value as required, before the choices
    const required = resolveArgs({ level: { ...level, required: true } }, parseArgs(['--level=']))
    expect((required.error?.errors[0] as ArgResolveError).code).toBe(
      ArgsValidationErrorKeys.requiredOption
    )
    expect(received).toEqual([])
  })

  test('a default outside the choices is used as is', () => {
    const { values, error } = resolveArgs(
      {
        level: {
          type: 'enum',
          choices: ['debug', 'info'],
          default: 'foo',
          parse: (value: string) => value.toUpperCase()
        }
      },
      parseArgs([])
    )
    expect(error).toBeUndefined()
    expect(values.level).toBe('foo')
  })

  test('choices are only checked for an enum option', () => {
    const { values, error } = resolveArgs(
      { x: { type: 'string', choices: ['a'] } },
      parseArgs(['--x=b'])
    )
    expect(error).toBeUndefined()
    expect(values.x).toBe('b')
  })

  test('an option without a value still reports a missing value', () => {
    const { error } = resolveArgs(
      {
        level: { type: 'enum', choices: ['debug', 'info'], parse: (value: string) => value }
      },
      parseArgs(['--level'])
    )
    expect(error?.errors.length).toBe(1)
    expect((error?.errors[0] as ArgResolveError).code).toBe(ArgsValidationErrorKeys.missingValue)
  })
})

describe('positional arguments', () => {
  test('basic', () => {
    const argv = ['dev', '--help']
    const tokens = parseArgs(argv)
    const { values, positionals, rest } = resolveArgs(
      {
        command: {
          type: 'positional'
        },
        help: {
          type: 'boolean',
          short: 'h'
        }
      },
      tokens
    )
    expect(values).toEqual({
      command: 'dev',
      help: true
    })
    expect(positionals).toEqual(['dev'])
    expect(rest).toEqual([])
  })

  test('missing', () => {
    const argv = ['--help']
    const tokens = parseArgs(argv)
    const { error } = resolveArgs(
      {
        command: {
          type: 'positional'
        },
        help: {
          type: 'boolean',
          short: 'h'
        }
      },
      tokens
    )
    expect(error?.errors.length).toBe(1)
    expect((error?.errors[0] as ArgResolveError).message).toEqual(
      `Positional argument 'command' is required`
    )
    expect((error?.errors[0] as ArgsValidationError).code).toEqual(
      ArgsValidationErrorKeys.requiredPositional
    )
    expect((error?.errors[0] as ArgsValidationError).values).toEqual({
      name: 'command'
    })
  })

  test('missing optional single positional', () => {
    const argv = ['--help']
    const tokens = parseArgs(argv)
    const { error, values, explicit } = resolveArgs(
      {
        command: {
          type: 'positional',
          required: false
        },
        help: {
          type: 'boolean',
          short: 'h'
        }
      },
      tokens
    )
    expect(error).toBeUndefined()
    expect(values).toEqual({
      help: true
    })
    expect(explicit.command).toBe(false)
  })

  test('provided optional single positional', () => {
    const argv = ['--help', 'dev']
    const tokens = parseArgs(argv)
    const { error, values, explicit } = resolveArgs(
      {
        command: {
          type: 'positional',
          required: false
        },
        help: {
          type: 'boolean',
          short: 'h'
        }
      },
      tokens
    )
    expect(error).toBeUndefined()
    expect(values).toEqual({
      command: 'dev',
      help: true
    })
    expect(explicit.command).toBe(true)
  })

  test('missing single positional with default', () => {
    const argv = ['--help']
    const tokens = parseArgs(argv)
    const { error, values, explicit } = resolveArgs(
      {
        command: {
          type: 'positional',
          default: 'dev'
        },
        help: {
          type: 'boolean',
          short: 'h'
        }
      },
      tokens
    )
    expect(error).toBeUndefined()
    expect(values).toEqual({
      command: 'dev',
      help: true
    })
    expect(explicit.command).toBe(false)
  })

  test('required single positional with default still errors when missing', () => {
    const argv = ['--help']
    const tokens = parseArgs(argv)
    const { error, values, explicit } = resolveArgs(
      {
        command: {
          type: 'positional',
          required: true,
          default: 'dev'
        },
        help: {
          type: 'boolean',
          short: 'h'
        }
      },
      tokens
    )
    expect(error?.errors.length).toBe(1)
    expect((error?.errors[0] as ArgResolveError).message).toEqual(
      `Positional argument 'command' is required`
    )
    expect(values).toEqual({
      help: true
    })
    expect(explicit.command).toBe(false)
  })

  test('missing optional single positional does not call parse', () => {
    const argv = ['--help']
    const tokens = parseArgs(argv)
    let called = 0
    const { error, values } = resolveArgs(
      {
        count: {
          type: 'positional',
          required: false,
          parse(value: string) {
            called++
            return Number(value)
          }
        },
        help: {
          type: 'boolean',
          short: 'h'
        }
      },
      tokens
    )
    expect(error).toBeUndefined()
    expect(values).toEqual({
      help: true
    })
    expect(called).toBe(0)
  })

  test('provided optional single positional calls parse', () => {
    const argv = ['--help', '42']
    const tokens = parseArgs(argv)
    const { error, values, explicit } = resolveArgs(
      {
        count: {
          type: 'positional',
          required: false,
          parse: (value: string) => Number(value)
        },
        help: {
          type: 'boolean',
          short: 'h'
        }
      },
      tokens
    )
    expect(error).toBeUndefined()
    expect(values).toEqual({
      count: 42,
      help: true
    })
    expect(explicit.count).toBe(true)
  })

  test('argument order', () => {
    const argv = ['--help', 'dev']
    const tokens = parseArgs(argv)
    const { values, positionals, rest } = resolveArgs(
      {
        command: {
          type: 'positional'
        },
        help: {
          type: 'boolean',
          short: 'h'
        }
      },
      tokens
    )
    expect(values).toEqual({
      command: 'dev',
      help: true
    })
    expect(positionals).toEqual(['dev'])
    expect(rest).toEqual([])
  })

  test('multiple positionals', () => {
    const argv = ['dev', '--help', 'info', 'foo']
    const tokens = parseArgs(argv)
    const { values, positionals, rest } = resolveArgs(
      {
        command: {
          type: 'positional'
        },
        log: {
          type: 'positional'
        },
        help: {
          type: 'boolean',
          short: 'h'
        }
      },
      tokens
    )
    expect(values).toEqual({
      command: 'dev',
      log: 'info',
      help: true
    })
    expect(positionals).toEqual(['dev', 'info', 'foo'])
    expect(rest).toEqual([])
  })

  test('optional positional before required positional leaves value for required positional', () => {
    const argv = ['users']
    const tokens = parseArgs(argv)
    const { error, values, explicit } = resolveArgs(
      {
        query: {
          type: 'positional',
          required: false
        },
        table: {
          type: 'positional'
        }
      },
      tokens
    )
    expect(error).toBeUndefined()
    expect(values).toEqual({
      table: 'users'
    })
    expect(explicit).toMatchObject({
      query: false,
      table: true
    })
  })

  test('optional positional before required positional consumes value when enough values remain', () => {
    const argv = ['select *', 'users']
    const tokens = parseArgs(argv)
    const { error, values, explicit } = resolveArgs(
      {
        query: {
          type: 'positional',
          required: false
        },
        table: {
          type: 'positional'
        }
      },
      tokens
    )
    expect(error).toBeUndefined()
    expect(values).toEqual({
      query: 'select *',
      table: 'users'
    })
    expect(explicit).toMatchObject({
      query: true,
      table: true
    })
  })

  test('default positional before required positional leaves value for required positional', () => {
    const argv = ['users']
    const tokens = parseArgs(argv)
    const { error, values, explicit } = resolveArgs(
      {
        query: {
          type: 'positional',
          default: 'select *'
        },
        table: {
          type: 'positional'
        }
      },
      tokens
    )
    expect(error).toBeUndefined()
    expect(values).toEqual({
      query: 'select *',
      table: 'users'
    })
    expect(explicit).toMatchObject({
      query: false,
      table: true
    })
  })

  test('multiple optional positionals preserve later required positional', () => {
    const argv = ['search', 'users']
    const tokens = parseArgs(argv)
    const { error, values, explicit } = resolveArgs(
      {
        namespace: {
          type: 'positional',
          required: false
        },
        query: {
          type: 'positional',
          required: false
        },
        table: {
          type: 'positional'
        }
      },
      tokens
    )
    expect(error).toBeUndefined()
    expect(values).toEqual({
      namespace: 'search',
      table: 'users'
    })
    expect(explicit).toMatchObject({
      namespace: true,
      query: false,
      table: true
    })
  })

  test('positionals & termination', () => {
    const argv = ['dev', '--help', 'info', 'foo', '--', 'bar']
    const tokens = parseArgs(argv)
    const { values, positionals, rest } = resolveArgs(
      {
        command: {
          type: 'positional'
        },
        log: {
          type: 'positional'
        },
        help: {
          type: 'boolean',
          short: 'h'
        }
      },
      tokens
    )
    expect(values).toEqual({
      command: 'dev',
      log: 'info',
      help: true
    })
    expect(positionals).toEqual(['dev', 'info', 'foo'])
    expect(rest).toEqual(['bar'])
  })

  describe('skipPositional', () => {
    test('basic', () => {
      const argv = ['dev', '--help', 'info', 'foo']
      const tokens = parseArgs(argv)
      const { values, positionals, rest } = resolveArgs(
        {
          log: {
            type: 'positional'
          },
          help: {
            type: 'boolean',
            short: 'h'
          }
        },
        tokens,
        {
          skipPositional: 0
        }
      )
      expect(values).toEqual({
        log: 'info',
        help: true
      })
      expect(positionals).toEqual(['dev', 'info', 'foo'])
      expect(rest).toEqual([])
    })

    test('multiple positional', () => {
      const argv = ['dev', '--help', 'info', 'foo', 'bar', 'baz']
      const tokens = parseArgs(argv)
      const { values, positionals, rest } = resolveArgs(
        {
          log: {
            type: 'positional'
          },
          test: {
            type: 'positional'
          },
          help: {
            type: 'boolean',
            short: 'h'
          }
        },
        tokens,
        {
          skipPositional: 0
        }
      )
      expect(values).toEqual({
        log: 'info',
        test: 'foo',
        help: true
      })
      expect(positionals).toEqual(['dev', 'info', 'foo', 'bar', 'baz'])
      expect(rest).toEqual([])
    })

    test('skipPositional < -1', () => {
      const argv = ['dev', '--help', 'info', 'foo']
      const tokens = parseArgs(argv)
      const { values, positionals, rest } = resolveArgs(
        {
          log: {
            type: 'positional'
          },
          help: {
            type: 'boolean',
            short: 'h'
          }
        },
        tokens,
        {
          skipPositional: -10
        }
      )
      expect(values).toEqual({
        log: 'dev',
        help: true
      })
      expect(positionals).toEqual(['dev', 'info', 'foo'])
      expect(rest).toEqual([])
    })

    test('skipPositional over arguments length', () => {
      const argv = ['dev', '--help', 'info', 'foo']
      const tokens = parseArgs(argv)
      const { error, positionals, rest } = resolveArgs(
        {
          log: {
            type: 'positional'
          },
          help: {
            type: 'boolean',
            short: 'h'
          }
        },
        tokens,
        {
          skipPositional: 10
        }
      )
      expect(positionals).toEqual(['dev', 'info', 'foo'])
      expect(rest).toEqual([])
      expect(error?.errors.length).toBe(1)
      expect((error?.errors[0] as ArgResolveError).message).toEqual(
        `Positional argument 'log' is required`
      )
    })

    test('skipPositional over arguments length with optional positional', () => {
      const argv = ['dev', '--help', 'info', 'foo']
      const tokens = parseArgs(argv)
      const { error, values, positionals, rest } = resolveArgs(
        {
          log: {
            type: 'positional',
            required: false
          },
          help: {
            type: 'boolean',
            short: 'h'
          }
        },
        tokens,
        {
          skipPositional: 10
        }
      )
      expect(error).toBeUndefined()
      expect(values).toEqual({
        help: true
      })
      expect(positionals).toEqual(['dev', 'info', 'foo'])
      expect(rest).toEqual([])
    })

    test('skipPositional over arguments length on termination', () => {
      const argv = ['dev', '--help', 'info', '--', 'foo']
      const tokens = parseArgs(argv)
      const { error, positionals, rest } = resolveArgs(
        {
          log: {
            type: 'positional'
          },
          help: {
            type: 'boolean',
            short: 'h'
          }
        },
        tokens,
        {
          skipPositional: 10
        }
      )
      expect(positionals).toEqual(['dev', 'info'])
      expect(rest).toEqual(['foo'])
      expect(error?.errors.length).toBe(1)
      expect((error?.errors[0] as ArgResolveError).message).toEqual(
        `Positional argument 'log' is required`
      )
    })
  })
})

describe('multiple values', () => {
  test('long option', () => {
    const argv = ['build', '--define=foo', '--define', 'bar', '--help']
    const tokens = parseArgs(argv)
    const { values, positionals, rest } = resolveArgs(
      {
        define: {
          type: 'string',
          multiple: true,
          short: 'd'
        },
        help: {
          type: 'boolean',
          short: 'h'
        }
      },
      tokens
    )
    expect(values).toEqual({
      define: ['foo', 'bar'],
      help: true
    })
    expect(positionals).toEqual(['build'])
    expect(rest).toEqual([])
  })

  test('short option', () => {
    const argv = ['build', '-d=foo', '-d', 'bar', '--help', 'baz', '--', 'one', 'two']
    const tokens = parseArgs(argv)
    const { values, positionals, rest } = resolveArgs(
      {
        define: {
          type: 'string',
          multiple: true,
          short: 'd'
        },
        help: {
          type: 'boolean',
          short: 'h'
        }
      },
      tokens
    )
    expect(values).toEqual({
      define: ['foo', 'bar'],
      help: true
    })
    expect(positionals).toEqual(['build', 'baz'])
    expect(rest).toEqual(['one', 'two'])
  })

  test('long and short option', () => {
    const argv = ['build', '-d=foo', '--define', 'bar', 'foo', 'bar', 'baz', '--help']
    const tokens = parseArgs(argv)
    const { values, positionals, rest } = resolveArgs(
      {
        define: {
          type: 'string',
          multiple: true,
          short: 'd'
        },
        help: {
          type: 'boolean',
          short: 'h'
        }
      },
      tokens
    )
    expect(values).toEqual({
      define: ['foo', 'bar'],
      help: true
    })
    expect(positionals).toEqual(['build', 'foo', 'bar', 'baz'])
    expect(rest).toEqual([])
  })

  test('boolean option', () => {
    const argv = ['build', '--foo', '--no-foo', '--foo', '--help']
    const tokens = parseArgs(argv)
    const { values, positionals, rest } = resolveArgs(
      {
        foo: {
          type: 'boolean',
          multiple: true,
          negatable: true,
          short: 'f'
        },
        help: {
          type: 'boolean',
          short: 'h'
        }
      },
      tokens
    )
    expect(values).toEqual({
      foo: [true, false, true],
      help: true
    })
    expect(positionals).toEqual(['build'])
    expect(rest).toEqual([])
  })

  test('enum option', () => {
    const argv = ['eat', '--fruits=banana', '-f', 'apple', '--fruits', 'orange']
    const tokens = parseArgs(argv)
    const { values, positionals, rest } = resolveArgs(
      {
        fruits: {
          type: 'enum',
          multiple: true,
          short: 'f',
          choices: ['banana', 'apple', 'orange']
        }
      },
      tokens
    )
    expect(values).toEqual({
      fruits: ['banana', 'apple', 'orange']
    })
    expect(positionals).toEqual(['eat'])
    expect(rest).toEqual([])
  })

  test('positional', () => {
    const argv = ['foo', 'bar']
    const tokens = parseArgs(argv)
    const { values } = resolveArgs(
      {
        files: {
          type: 'positional',
          multiple: true
        }
      },
      tokens
    )
    expect(values.files).toEqual(['foo', 'bar'])
  })

  test('positional + skipPositional', () => {
    const argv = ['foo', 'bar']
    const tokens = parseArgs(argv)
    const { values } = resolveArgs(
      {
        files: {
          type: 'positional',
          multiple: true
        }
      },
      tokens,
      {
        skipPositional: 0
      }
    )
    expect(values.files).toEqual(['bar'])
  })

  test('positional + required', () => {
    const argv = ['foo', 'bar']
    const tokens = parseArgs(argv)
    const { values, error } = resolveArgs(
      {
        files: {
          type: 'positional',
          multiple: true,
          required: true
        }
      },
      tokens
    )
    expect(error?.errors).toBeUndefined()
    expect(values.files).toEqual(['foo', 'bar'])
  })

  test('positional + required error', () => {
    const argv: string[] = []
    const tokens = parseArgs(argv)
    const { error } = resolveArgs(
      {
        files: {
          type: 'positional',
          multiple: true,
          required: true
        }
      },
      tokens
    )
    expect(error?.errors.length).toBe(1)
    expect((error?.errors[0] as Error).message).toEqual("Positional argument 'files' is required")
  })

  test('positional + named', () => {
    const argv = ['foo', 'bar', '--help']
    const tokens = parseArgs(argv)
    const { values } = resolveArgs(
      {
        files: {
          type: 'positional',
          multiple: true,
          required: true
        },
        help: {
          type: 'boolean'
        }
      },
      tokens
    )
    expect(values.files).toEqual(['foo', 'bar'])
    expect(values.help).toBeTruthy()
  })

  test('positional multiple leaves value for later required positional', () => {
    const argv = ['a.ts', 'b.ts', 'out.js']
    const tokens = parseArgs(argv)
    const { error, values, explicit } = resolveArgs(
      {
        files: {
          type: 'positional',
          multiple: true
        },
        output: {
          type: 'positional'
        }
      },
      tokens
    )
    expect(error).toBeUndefined()
    expect(values).toEqual({
      files: ['a.ts', 'b.ts'],
      output: 'out.js'
    })
    expect(explicit).toMatchObject({
      files: true,
      output: true
    })
  })

  test('positional multiple can be omitted before later required positional', () => {
    const argv = ['out.js']
    const tokens = parseArgs(argv)
    const { error, values, explicit } = resolveArgs(
      {
        files: {
          type: 'positional',
          multiple: true
        },
        output: {
          type: 'positional'
        }
      },
      tokens
    )
    expect(error).toBeUndefined()
    expect(values).toEqual({
      output: 'out.js'
    })
    expect(explicit).toMatchObject({
      files: false,
      output: true
    })
  })

  test('required positional multiple before later required positional needs one value', () => {
    const argv = ['out.js']
    const tokens = parseArgs(argv)
    const { error, values, explicit } = resolveArgs(
      {
        files: {
          type: 'positional',
          multiple: true,
          required: true
        },
        output: {
          type: 'positional'
        }
      },
      tokens
    )
    expect(error?.errors.length).toBe(1)
    expect((error?.errors[0] as Error).message).toEqual("Positional argument 'files' is required")
    expect(values).toEqual({
      output: 'out.js'
    })
    expect(explicit).toMatchObject({
      files: false,
      output: true
    })
  })

  test('required positional multiple before later required positional consumes extra values', () => {
    const argv = ['a.ts', 'out.js']
    const tokens = parseArgs(argv)
    const { error, values, explicit } = resolveArgs(
      {
        files: {
          type: 'positional',
          multiple: true,
          required: true
        },
        output: {
          type: 'positional'
        }
      },
      tokens
    )
    expect(error).toBeUndefined()
    expect(values).toEqual({
      files: ['a.ts'],
      output: 'out.js'
    })
    expect(explicit).toMatchObject({
      files: true,
      output: true
    })
  })
})

describe(`'toKebab' option`, () => {
  test('per argument', () => {
    const argv = ['test', '--to-kebab=true', '--no-kebab-case', '--noKebab']
    const tokens = parseArgs(argv)
    const { values } = resolveArgs(
      {
        toKebab: {
          type: 'boolean',
          short: 'k',
          toKebab: true
        },
        kebabCase: {
          type: 'boolean',
          short: 'n',
          negatable: true,
          toKebab: true
        },
        noKebab: {
          type: 'boolean',
          short: 'N'
        }
      },
      tokens
    )
    expect(values).toEqual({
      toKebab: true,
      kebabCase: false,
      noKebab: true
    })
  })

  test('per argument required negatable boolean accepts negated kebab-case long option', () => {
    const argv = ['--no-kebab-case']
    const tokens = parseArgs(argv)
    const { values, error, explicit } = resolveArgs(
      {
        kebabCase: {
          type: 'boolean',
          negatable: true,
          required: true,
          toKebab: true
        }
      },
      tokens
    )

    expect(error).toBeUndefined()
    expect(values).toEqual({
      kebabCase: false
    })
    expect(explicit.kebabCase).toBe(true)
  })

  test('all arguments', () => {
    const argv = ['test', '--to-kebab=true', '--no-kebab-case', '--foo-bar']
    const tokens = parseArgs(argv)
    const { values } = resolveArgs(
      {
        toKebab: {
          type: 'boolean',
          short: 'k'
        },
        kebabCase: {
          type: 'boolean',
          short: 'n',
          negatable: true
        },
        'foo-bar': {
          type: 'boolean',
          short: 'K'
        }
      },
      tokens,
      { toKebab: true }
    )
    expect(values).toEqual({
      'foo-bar': true,
      toKebab: true,
      kebabCase: false
    })
  })

  test('global required negatable boolean accepts negated kebab-case long option', () => {
    const argv = ['--no-kebab-case']
    const tokens = parseArgs(argv)
    const { values, error, explicit } = resolveArgs(
      {
        kebabCase: {
          type: 'boolean',
          negatable: true,
          required: true
        }
      },
      tokens,
      { toKebab: true }
    )

    expect(error).toBeUndefined()
    expect(values).toEqual({
      kebabCase: false
    })
    expect(explicit.kebabCase).toBe(true)
  })
})

describe('negatable option named with a no- prefix', () => {
  const args = {
    'no-cache': {
      type: 'boolean',
      negatable: true,
      short: 'n'
    }
  } as const satisfies Args

  test('own name resolves to true', () => {
    const { values, error, explicit } = resolveArgs(args, parseArgs(['--no-cache']))
    expect(error).toBeUndefined()
    expect(values).toEqual({ 'no-cache': true })
    expect(explicit['no-cache']).toBe(true)
  })

  test('negated name resolves to false', () => {
    const { values, error, explicit } = resolveArgs(args, parseArgs(['--no-no-cache']))
    expect(error).toBeUndefined()
    expect(values).toEqual({ 'no-cache': false })
    expect(explicit['no-cache']).toBe(true)
  })

  test('multiple values follow each token', () => {
    const { values, error } = resolveArgs(
      {
        'no-cache': {
          type: 'boolean',
          negatable: true,
          multiple: true
        }
      },
      parseArgs(['--no-cache', '--no-no-cache', '--no-cache'])
    )
    expect(error).toBeUndefined()
    expect(values).toEqual({ 'no-cache': [true, false, true] })
  })

  test('own name satisfies required', () => {
    const { values, error } = resolveArgs(
      {
        'no-cache': {
          type: 'boolean',
          negatable: true,
          required: true
        }
      },
      parseArgs(['--no-cache'])
    )
    expect(error).toBeUndefined()
    expect(values).toEqual({ 'no-cache': true })
  })

  test('per argument toKebab', () => {
    const kebab = {
      noVerify: {
        type: 'boolean',
        negatable: true,
        toKebab: true
      }
    } as const satisfies Args
    expect(resolveArgs(kebab, parseArgs(['--no-verify'])).values).toEqual({ noVerify: true })
    expect(resolveArgs(kebab, parseArgs(['--no-no-verify'])).values).toEqual({ noVerify: false })
  })

  test('global toKebab', () => {
    const kebab = {
      noVerify: {
        type: 'boolean',
        negatable: true
      }
    } as const satisfies Args
    const options = { toKebab: true }
    expect(resolveArgs(kebab, parseArgs(['--no-verify']), options).values).toEqual({
      noVerify: true
    })
    expect(resolveArgs(kebab, parseArgs(['--no-no-verify']), options).values).toEqual({
      noVerify: false
    })
  })

  test('parse function receives the resolved value', () => {
    const received: string[] = []
    const custom = {
      'no-cache': {
        type: 'boolean',
        negatable: true,
        parse: (v: string) => {
          received.push(v)
          return v === 'true'
        }
      }
    } as const satisfies Args
    expect(resolveArgs(custom, parseArgs(['--no-cache'])).values).toEqual({ 'no-cache': true })
    expect(resolveArgs(custom, parseArgs(['--no-no-cache'])).values).toEqual({ 'no-cache': false })
    expect(received).toEqual(['true', 'false'])
  })

  test('short alias resolves to true', () => {
    const { values, error } = resolveArgs(args, parseArgs(['-n']))
    expect(error).toBeUndefined()
    expect(values).toEqual({ 'no-cache': true })
  })

  test('a name with a no- prefix that is not negatable resolves to true', () => {
    const { values, error } = resolveArgs(
      { 'no-emit': { type: 'boolean' } },
      parseArgs(['--no-emit'])
    )
    expect(error).toBeUndefined()
    expect(values).toEqual({ 'no-emit': true })
  })

  test('negated name of an option that is not negatable is not matched', () => {
    const { values, error, explicit } = resolveArgs(
      { color: { type: 'boolean' } },
      parseArgs(['--no-color'])
    )
    expect(error).toBeUndefined()
    expect(values).toEqual({})
    expect(explicit.color).toBe(false)
  })

  test('an option and its no- prefixed sibling resolve separately', () => {
    const { values, error } = resolveArgs(
      {
        cache: { type: 'boolean', negatable: true },
        'no-cache': { type: 'boolean' }
      },
      parseArgs(['--no-cache'])
    )
    expect(error).toBeUndefined()
    expect(values).toEqual({ cache: false, 'no-cache': true })
  })

  test('an option whose name does not start with no- is unaffected', () => {
    const color = { color: { type: 'boolean', negatable: true } } as const satisfies Args
    expect(resolveArgs(color, parseArgs(['--color'])).values).toEqual({ color: true })
    expect(resolveArgs(color, parseArgs(['--no-color'])).values).toEqual({ color: false })
  })
})

test('custom type argument', () => {
  const argv = [
    'import',
    '--json={"key":"value"}',
    '--csv',
    'foo,bar,baz',
    '-c=1,2,3',
    '--zod={"key":1}'
  ]
  const tokens = parseArgs(argv)
  const dict = z.object({
    key: z.number()
  })
  const { values } = resolveArgs(
    {
      csv: {
        type: 'custom',
        short: 'c',
        multiple: true,
        parse: value => value.split(',')
      },
      json: {
        type: 'custom',
        parse: value => JSON.parse(value) as Record<string, unknown>
      },
      zod: {
        type: 'custom',
        required: true,
        parse: (value: string) => {
          return dict.parse(JSON.parse(value))
        }
      }
    },
    tokens
  )
  expect(values).toEqual({
    csv: [
      ['foo', 'bar', 'baz'],
      ['1', '2', '3']
    ],
    json: { key: 'value' },
    zod: { key: 1 }
  })
})

describe('explicit provision detection', () => {
  describe('options', () => {
    const schema = {
      command: {
        type: 'positional'
      },
      host: {
        type: 'string'
      },
      port: {
        type: 'number',
        default: 8080
      },
      tags: {
        type: 'string',
        short: 't',
        multiple: true
      },
      help: {
        type: 'boolean',
        short: 'h'
      },
      verbose: {
        type: 'boolean',
        negatable: true
      }
    } as const satisfies Args

    test('value provided', () => {
      const argv = ['dev', '--host', 'example.com', '--help']

      const tokens = parseArgs(argv)
      const { explicit } = resolveArgs(schema, tokens)

      expect(explicit).toMatchObject({
        help: true,
        host: true,
        port: false
      })
    })

    test('value provided and same as default', () => {
      const argv = ['dev', '--port', '8080']

      const tokens = parseArgs(argv)
      const { explicit } = resolveArgs(schema, tokens)

      expect(explicit.port).toBe(true)
    })

    test('value provided using short option', () => {
      const argv = ['dev', '-h']

      const tokens = parseArgs(argv)
      const { explicit } = resolveArgs(schema, tokens)

      expect(explicit.help).toBe(true)
    })

    test('value provided using inline syntax', () => {
      const argv = ['dev', '--port=9131']

      const tokens = parseArgs(argv)
      const { explicit } = resolveArgs(schema, tokens)

      expect(explicit.port).toBe(true)
    })

    test('value provided using negation for boolean option', () => {
      const argv = ['dev', '--no-verbose']

      const tokens = parseArgs(argv)
      const { explicit } = resolveArgs(schema, tokens)

      expect(explicit.verbose).toBe(true)
    })

    test('multiple values provided', () => {
      const argv = ['dev', '--tags', 'foo', '-t', 'bar']

      const tokens = parseArgs(argv)
      const { explicit } = resolveArgs(schema, tokens)

      expect(explicit.tags).toBe(true)
    })

    test('value not provided and falls back to default', () => {
      const argv = ['dev']

      const tokens = parseArgs(argv)
      const { values, explicit } = resolveArgs(schema, tokens)

      expect(values.port).toBe(8080)
      expect(explicit.port).toBe(false)
    })
  })

  describe('one positional argument', () => {
    test('value provided', () => {
      const schema = {
        command: {
          type: 'positional'
        },
        verbose: {
          type: 'boolean'
        }
      } as const satisfies Args

      const argv = ['--verbose', 'dev']
      const tokens = parseArgs(argv)
      const { explicit } = resolveArgs(schema, tokens)

      expect(explicit.command).toBe(true)
    })

    test('value provided and same as default', () => {
      const schema = {
        out: {
          type: 'positional',
          default: 'dist'
        },
        verbose: {
          type: 'boolean'
        }
      } as const satisfies Args

      const argv = ['--verbose', 'dist']
      const tokens = parseArgs(argv)
      const { explicit } = resolveArgs(schema, tokens)

      expect(explicit.out).toBe(true)
    })

    test('value not provided', () => {
      const schema = {
        out: {
          type: 'positional',
          default: 'dist'
        },
        verbose: {
          type: 'boolean'
        }
      } as const satisfies Args

      const argv = ['--verbose']
      const tokens = parseArgs(argv)
      const { explicit } = resolveArgs(schema, tokens)

      expect(explicit.out).toBe(false)
    })

    test('value provided for multiple: true', () => {
      const schema = {
        files: {
          type: 'positional',
          multiple: true
        },
        verbose: {
          type: 'boolean'
        }
      } as const satisfies Args

      const argv = ['--verbose', 'file1.ts']
      const tokens = parseArgs(argv)
      const { explicit } = resolveArgs(schema, tokens)

      expect(explicit.files).toBe(true)
    })

    test('value not provided for multiple: true', () => {
      const schema = {
        files: {
          type: 'positional',
          multiple: true
        },
        verbose: {
          type: 'boolean'
        }
      } as const satisfies Args

      const argv = ['--verbose']
      const tokens = parseArgs(argv)
      const { explicit } = resolveArgs(schema, tokens)

      expect(explicit.files).toBe(false)
    })
  })

  describe('many positional arguments', () => {
    const schema = {
      from: {
        type: 'positional'
      },
      to: {
        type: 'positional'
      },
      verbose: {
        type: 'boolean'
      }
    } as const satisfies Args

    test('value provided', () => {
      const argv = ['--verbose', 'source.txt', 'dest.txt']

      const tokens = parseArgs(argv)
      const { explicit } = resolveArgs(schema, tokens)

      expect(explicit).toMatchObject({
        from: true,
        to: true
      })
    })

    test('value partially provided', () => {
      const argv = ['--verbose', 'source.txt']

      const tokens = parseArgs(argv)
      const { explicit } = resolveArgs(schema, tokens)

      expect(explicit).toMatchObject({
        from: true,
        to: false
      })
    })

    test('value not provided', () => {
      const argv = ['--verbose']

      const tokens = parseArgs(argv)
      const { explicit } = resolveArgs(schema, tokens)

      expect(explicit).toMatchObject({
        from: false,
        to: false
      })
    })

    test('value provided for multiple: true', () => {
      const schema = {
        command: {
          type: 'positional'
        },
        files: {
          type: 'positional',
          multiple: true
        },
        verbose: {
          type: 'boolean'
        }
      } as const satisfies Args

      const argv = ['--verbose', 'compile', 'file1.ts']
      const tokens = parseArgs(argv)
      const { explicit } = resolveArgs(schema, tokens)

      expect(explicit).toMatchObject({
        command: true,
        files: true
      })
    })
  })
})

describe('conflicts', () => {
  test('detects conflict when both options are provided', () => {
    const args = {
      summer: {
        type: 'boolean',
        conflicts: 'autumn'
      },
      autumn: {
        type: 'boolean',
        conflicts: 'summer'
      }
    } as const satisfies Args

    const argv = ['--summer', '--autumn']
    const tokens = parseArgs(argv)
    const { error } = resolveArgs(args, tokens)

    expect(error).toBeDefined()
    expect(error?.errors.length).toBe(1)
    expect(error?.errors[0]).toBeInstanceOf(ArgResolveError)
    expect(error?.errors[0]).toBeInstanceOf(ArgsValidationError)
    expect((error?.errors[0] as ArgResolveError).type).toBe('conflict')
    expect((error?.errors[0] as ArgsValidationError).code).toBeUndefined()
    expect((error?.errors[0] as ArgsValidationError).values).toEqual({})
    expect((error?.errors[0] as ArgResolveError).message).toBe(
      "Optional argument '--summer' conflicts with '--autumn'"
    )
  })

  test('detects conflict with one-way conflict definition', () => {
    const args = {
      summer: {
        type: 'boolean',
        conflicts: 'autumn'
      },
      autumn: {
        type: 'boolean'
      }
    } as const satisfies Args

    const argv = ['--summer', '--autumn']
    const tokens = parseArgs(argv)
    const { error } = resolveArgs(args, tokens)

    expect(error).toBeDefined()
    expect(error?.errors.length).toBe(1)
    expect((error?.errors[0] as ArgResolveError).message).toBe(
      "Optional argument '--summer' conflicts with '--autumn'"
    )
  })

  test('detects conflict with multiple conflicting options', () => {
    const args = {
      summer: {
        type: 'boolean',
        conflicts: ['autumn', 'winter']
      },
      autumn: {
        type: 'boolean',
        conflicts: ['summer', 'winter']
      },
      winter: {
        type: 'boolean',
        conflicts: ['summer', 'autumn']
      },
      spring: {
        type: 'boolean'
      }
    } as const satisfies Args

    const argv = ['--summer', '--winter', '--spring']
    const tokens = parseArgs(argv)
    const { values, error } = resolveArgs(args, tokens)

    expect(values.spring).toBe(true)
    expect(error).toBeDefined()
    expect(error?.errors.length).toBe(1)
    expect((error?.errors[0] as ArgResolveError).message).toBe(
      "Optional argument '--summer' conflicts with '--winter'"
    )
  })

  test('detects conflict between enum and string options', () => {
    const args = {
      transport: {
        type: 'enum',
        choices: ['tcp', 'udp'],
        conflicts: 'socket'
      },
      socket: {
        type: 'string',
        conflicts: 'transport'
      }
    } as const satisfies Args

    const argv = ['--transport', 'tcp', '--socket', '/tmp/app.sock']
    const tokens = parseArgs(argv)
    const { error } = resolveArgs(args, tokens)

    expect(error).toBeDefined()
    expect(error?.errors.length).toBe(1)
    expect((error?.errors[0] as ArgResolveError).message).toBe(
      "Optional argument '--transport' conflicts with '--socket'"
    )
  })

  test('detects conflict with asymmetric conflict definitions', () => {
    const args = {
      summer: {
        type: 'boolean',
        conflicts: 'autumn'
      },
      autumn: {
        type: 'boolean',
        conflicts: 'winter'
      },
      winter: {
        type: 'boolean'
      }
    } as const satisfies Args

    const argv = ['--summer', '--autumn', '--winter']
    const tokens = parseArgs(argv)
    const { error } = resolveArgs(args, tokens)

    expect(error).toBeDefined()
    expect(error?.errors.length).toBe(1)
    expect((error?.errors[0] as ArgResolveError).message).toBe(
      "Optional argument '--summer' conflicts with '--autumn'"
    )
  })

  test('returns only first conflict error (fail-fast behavior)', () => {
    const args = {
      a: {
        type: 'boolean',
        conflicts: ['b', 'c']
      },
      b: {
        type: 'boolean',
        conflicts: ['a', 'c']
      },
      c: {
        type: 'boolean',
        conflicts: ['a', 'b']
      }
    } as const satisfies Args

    const argv = ['--a', '--b', '--c']
    const tokens = parseArgs(argv)
    const { error } = resolveArgs(args, tokens)

    expect(error).toBeDefined()
    expect(error?.errors.length).toBe(1)
    expect((error?.errors[0] as ArgResolveError).message).toBe(
      "Optional argument '--a' conflicts with '--b'"
    )
  })

  test('detects conflict with short option aliases', () => {
    const args = {
      summer: {
        type: 'boolean',
        short: 's',
        conflicts: 'autumn'
      },
      autumn: {
        type: 'boolean',
        short: 'a',
        conflicts: 'summer'
      }
    } as const satisfies Args

    const argv = ['-s', '-a']
    const tokens = parseArgs(argv)
    const { error } = resolveArgs(args, tokens)

    expect(error).toBeDefined()
    expect(error?.errors.length).toBe(1)
    expect((error?.errors[0] as ArgResolveError).message).toBe(
      "Optional argument '-s' conflicts with '-a'"
    )
  })

  test('error message reflects actual input forms (long vs short)', () => {
    const args = {
      summer: {
        type: 'boolean',
        short: 's',
        conflicts: 'autumn'
      },
      autumn: {
        type: 'boolean',
        short: 'a',
        conflicts: 'summer'
      }
    } as const satisfies Args

    const argv = ['--summer', '-a']
    const tokens = parseArgs(argv)
    const { error } = resolveArgs(args, tokens)

    expect(error).toBeDefined()
    expect(error?.errors.length).toBe(1)
    expect((error?.errors[0] as ArgResolveError).message).toBe(
      "Optional argument '--summer' conflicts with '-a'"
    )
  })

  test('detects conflict and shows kebab-case names in error message', () => {
    const args = {
      summerSeason: {
        type: 'boolean',
        conflicts: 'autumnSeason',
        toKebab: true
      },
      autumnSeason: {
        type: 'boolean',
        conflicts: 'summerSeason',
        toKebab: true
      }
    } as const satisfies Args

    const argv = ['--summer-season', '--autumn-season']
    const tokens = parseArgs(argv)
    const { error } = resolveArgs(args, tokens)

    expect(error).toBeDefined()
    expect((error?.errors[0] as ArgResolveError).message).toBe(
      "Optional argument '--summer-season' conflicts with '--autumn-season'"
    )
  })

  test('conflict error message preserves negated long option input', () => {
    const args = {
      color: {
        type: 'boolean',
        negatable: true,
        conflicts: 'format'
      },
      format: {
        type: 'string',
        conflicts: 'color'
      }
    } as const satisfies Args

    const argv = ['--no-color', '--format=json']
    const tokens = parseArgs(argv)
    const { error } = resolveArgs(args, tokens)

    expect(error).toBeDefined()
    expect(error?.errors.length).toBe(1)
    expect((error?.errors[0] as ArgResolveError).message).toBe(
      "Optional argument '--no-color' conflicts with '--format'"
    )
  })

  test('conflicts array must reference existing schema keys (not kebab-case strings)', () => {
    const args = {
      summerSeason: {
        type: 'boolean',
        conflicts: 'autumn-season',
        toKebab: true
      },
      autumnSeason: {
        type: 'boolean',
        conflicts: 'summer-season',
        toKebab: true
      }
    } as const satisfies Args

    const argv = ['--summer-season', '--autumn-season']
    const tokens = parseArgs(argv)
    const { error } = resolveArgs(args, tokens)

    expect(error).toBeUndefined()
  })

  test('no conflict when only one option is provided', () => {
    const args = {
      summer: {
        type: 'boolean',
        conflicts: 'autumn'
      },
      autumn: {
        type: 'boolean',
        conflicts: 'summer'
      }
    } as const satisfies Args

    const argv = ['--summer']
    const tokens = parseArgs(argv)
    const { values, error } = resolveArgs(args, tokens)

    expect(error).toBeUndefined()
    expect(values.summer).toBe(true)
  })

  test('no conflict when one option uses default value', () => {
    const args = {
      port: {
        type: 'number',
        default: 8080,
        conflicts: 'socket'
      },
      socket: {
        type: 'string',
        conflicts: 'port'
      }
    } as const satisfies Args

    const argv = ['--socket', '/tmp/app.sock']
    const tokens = parseArgs(argv)
    const { values, error } = resolveArgs(args, tokens)

    expect(error).toBeUndefined()
    expect(values.socket).toBe('/tmp/app.sock')
    expect(values.port).toBe(8080)
  })
})

describe('boolean inline value', () => {
  const args = {
    silent: {
      type: 'boolean',
      short: 's'
    },
    color: {
      type: 'boolean',
      negatable: true,
      default: true
    },
    verbose: {
      type: 'boolean',
      short: 'v',
      multiple: true
    }
  } as const satisfies Args

  test('long option with an explicit false', () => {
    const { values, error, explicit } = resolveArgs(args, parseArgs(['--silent=false']))
    expect(error).toBeUndefined()
    expect(values.silent).toBe(false)
    expect(explicit.silent).toBe(true)
  })

  test('short option with an explicit false', () => {
    const { values, error, explicit } = resolveArgs(args, parseArgs(['-s=false']))
    expect(error).toBeUndefined()
    expect(values.silent).toBe(false)
    expect(explicit.silent).toBe(true)
  })

  test.each(['0', '', 'TRUE', 'yes'])(
    'value %j other than true or false is a type error',
    actual => {
      const { values, error } = resolveArgs(args, parseArgs([`--silent=${actual}`]))
      expect(error?.errors.length).toBe(1)
      const resolveError = error?.errors[0] as ArgResolveError
      expect(resolveError).toBeInstanceOf(ArgResolveError)
      expect(resolveError.name).toBe('silent')
      expect(resolveError.type).toBe('type')
      expect(resolveError.code).toBe(ArgsValidationErrorKeys.invalidType)
      expect(resolveError.values).toEqual({
        displayName: "'--silent' or '-s'",
        name: 'silent',
        expected: 'boolean',
        actual
      })
      expect(values.silent).toBeUndefined()
    }
  )

  test.each(['0', 'yes', 'TRUE'])(
    'short option value %j other than true or false is a type error',
    actual => {
      const { values, error } = resolveArgs(args, parseArgs([`-s=${actual}`]))
      expect(error?.errors.length).toBe(1)
      const resolveError = error?.errors[0] as ArgResolveError
      expect(resolveError).toBeInstanceOf(ArgResolveError)
      expect(resolveError.code).toBe(ArgsValidationErrorKeys.invalidType)
      expect(resolveError.values).toEqual({
        displayName: "'--silent' or '-s'",
        name: 'silent',
        expected: 'boolean',
        actual
      })
      expect(values.silent).toBeUndefined()
    }
  )

  test('explicit false overrides a default of true', () => {
    const flag = {
      flag: {
        type: 'boolean',
        default: true
      }
    } as const satisfies Args
    const valid = resolveArgs(flag, parseArgs(['--flag=false']))
    expect(valid.error).toBeUndefined()
    expect(valid.values.flag).toBe(false)

    const invalid = resolveArgs(flag, parseArgs(['--flag=0']))
    expect(invalid.error?.errors.length).toBe(1)
    expect(invalid.values.flag).toBe(true)
  })

  test('negatable option with an explicit false', () => {
    const { values, error } = resolveArgs(args, parseArgs(['--color=false']))
    expect(error).toBeUndefined()
    expect(values.color).toBe(false)
  })

  test.each(['false', 'true', 'x', ''])(
    'negated form with value %j does not take a value',
    actual => {
      const { values, error, explicit } = resolveArgs(args, parseArgs([`--no-color=${actual}`]))
      expect(error?.errors.length).toBe(1)
      const resolveError = error?.errors[0] as ArgResolveError
      expect(resolveError).toBeInstanceOf(ArgResolveError)
      expect(resolveError.name).toBe('color')
      expect(resolveError.type).toBe('type')
      expect(resolveError.code).toBe('err:arg:unexpected-value')
      expect(resolveError.message).toBe("Optional argument '--no-color' does not take a value")
      expect(resolveError.values).toEqual({
        displayName: "'--no-color'",
        name: 'color',
        rawName: '--no-color',
        actual
      })
      expect(values.color).toBe(true)
      expect(explicit.color).toBe(true)
    }
  )

  test('negated form of a kebab-case option does not take a value', () => {
    const { values, error } = resolveArgs(
      {
        kebabCase: {
          type: 'boolean',
          negatable: true,
          toKebab: true
        }
      },
      parseArgs(['--no-kebab-case=false'])
    )
    expect(error?.errors.length).toBe(1)
    const resolveError = error?.errors[0] as ArgResolveError
    expect(resolveError.name).toBe('kebab-case')
    expect(resolveError.code).toBe('err:arg:unexpected-value')
    expect(resolveError.values).toEqual({
      displayName: "'--no-kebab-case'",
      name: 'kebabCase',
      rawName: '--no-kebab-case',
      actual: 'false'
    })
    expect(values.kebabCase).toBeUndefined()
  })

  test('multiple values follow each token', () => {
    const { values, error } = resolveArgs(args, parseArgs(['-v=false', '-v', '-v=true']))
    expect(error).toBeUndefined()
    expect(values.verbose).toEqual([false, true, true])
  })

  test('long option with an explicit true', () => {
    const { values, error } = resolveArgs(args, parseArgs(['--silent=true']))
    expect(error).toBeUndefined()
    expect(values.silent).toBe(true)
  })

  test('explicit false on a kebab-case option', () => {
    const perArgument = resolveArgs(
      {
        toKebab: {
          type: 'boolean',
          toKebab: true
        }
      },
      parseArgs(['--to-kebab=false'])
    )
    expect(perArgument.error).toBeUndefined()
    expect(perArgument.values.toKebab).toBe(false)

    const global = resolveArgs(
      {
        toKebab: {
          type: 'boolean'
        }
      },
      parseArgs(['--to-kebab=false']),
      { toKebab: true }
    )
    expect(global.error).toBeUndefined()
    expect(global.values.toKebab).toBe(false)
  })

  test('explicit false satisfies required, and an invalid value reports only the type error', () => {
    const flag = {
      flag: {
        type: 'boolean',
        required: true
      }
    } as const satisfies Args
    const valid = resolveArgs(flag, parseArgs(['--flag=false']))
    expect(valid.error).toBeUndefined()
    expect(valid.values.flag).toBe(false)

    const invalid = resolveArgs(flag, parseArgs(['--flag=0']))
    expect(invalid.error?.errors.length).toBe(1)
    expect((invalid.error?.errors[0] as ArgResolveError).code).toBe(
      ArgsValidationErrorKeys.invalidType
    )
  })

  test('multiple values keep the valid tokens when a negated form has a value', () => {
    const { values, error } = resolveArgs(
      {
        color: {
          type: 'boolean',
          negatable: true,
          multiple: true
        }
      },
      parseArgs(['--no-color=false', '--color'])
    )
    expect(error?.errors.length).toBe(1)
    expect((error?.errors[0] as ArgResolveError).code).toBe(ArgsValidationErrorKeys.unexpectedValue)
    expect(values.color).toEqual([true])
  })

  test('a rejected value still counts as provided for conflicts', () => {
    const { values, error } = resolveArgs(
      {
        a: {
          type: 'boolean',
          conflicts: 'b'
        },
        b: {
          type: 'boolean'
        }
      },
      parseArgs(['--a=0', '--b'])
    )
    expect(error?.errors.map(e => (e as ArgResolveError).type)).toEqual(['type', 'conflict'])
    expect(values.a).toBeUndefined()
    expect(values.b).toBe(true)
  })

  test('parse function receives only the resolved value', () => {
    const received: string[] = []
    const custom = {
      v: {
        type: 'boolean',
        negatable: true,
        parse: (value: string) => {
          received.push(value)
          return value === 'true'
        }
      }
    } as const satisfies Args
    expect(resolveArgs(custom, parseArgs(['--v=false'])).values.v).toBe(false)
    expect(resolveArgs(custom, parseArgs(['--v=0'])).error?.errors.length).toBe(1)
    expect(resolveArgs(custom, parseArgs(['--no-v=false'])).error?.errors.length).toBe(1)
    expect(received).toEqual(['false'])
  })

  test('short option group with shortGrouping', () => {
    const { values, error } = resolveArgs(args, parseArgs(['-vs=false']), { shortGrouping: true })
    expect(error).toBeUndefined()
    expect(values.verbose).toEqual([true])
    expect(values.silent).toBe(false)
  })

  test('explicit value on a negatable option named with a no- prefix', () => {
    const noCache = {
      'no-cache': {
        type: 'boolean',
        negatable: true
      }
    } as const satisfies Args
    expect(resolveArgs(noCache, parseArgs(['--no-cache=false'])).values).toEqual({
      'no-cache': false
    })
    expect(resolveArgs(noCache, parseArgs(['--no-cache=true'])).values).toEqual({
      'no-cache': true
    })

    const { values, error } = resolveArgs(noCache, parseArgs(['--no-no-cache=false']))
    expect(error?.errors.length).toBe(1)
    const resolveError = error?.errors[0] as ArgResolveError
    expect(resolveError.code).toBe(ArgsValidationErrorKeys.unexpectedValue)
    expect(resolveError.values.rawName).toBe('--no-no-cache')
    expect(values).toEqual({})
  })

  test.each([
    { argv: ['--silent', 'false'], silent: true, positionals: ['false'] },
    { argv: ['-s', 'false'], silent: true, positionals: ['false'] },
    { argv: ['-sfalse'], silent: true, positionals: [] },
    { argv: ['-sv'], silent: true, positionals: [] },
    { argv: ['-s='], silent: true, positionals: [] }
  ])('input without a value after = is unchanged: $argv', ({ argv, silent, positionals }) => {
    const result = resolveArgs(args, parseArgs(argv))
    expect(result.error).toBeUndefined()
    expect(result.values.silent).toBe(silent)
    expect(result.positionals).toEqual(positionals)
  })

  test('negated form without a value is unchanged', () => {
    const { values, error } = resolveArgs(args, parseArgs(['--no-color']))
    expect(error).toBeUndefined()
    expect(values.color).toBe(false)
  })
})

/**
 * Assert that the result reports the given options without a value, in order.
 *
 * @param error - The aggregate error returned by `resolveArgs`
 * @param expected - The expected interpolation values of each error
 */
function expectMissingValueErrors(
  error: AggregateError | undefined,
  expected: Record<string, unknown>[]
) {
  expect(error?.errors.length).toBe(expected.length)
  for (const [index, values] of expected.entries()) {
    const resolveError = error?.errors[index] as ArgResolveError
    expect(resolveError).toBeInstanceOf(ArgResolveError)
    expect(resolveError.type).toBe('type')
    expect(resolveError.code).toBe('err:arg:missing-value')
    // no `actual`, and the suggestion values only when there is a suggestion
    expect(resolveError.values).toStrictEqual(values)
  }
}

/**
 * Assert that the result reports one option without a value.
 *
 * @param error - The aggregate error returned by `resolveArgs`
 * @param values - The expected interpolation values
 */
function expectMissingValueError(
  error: AggregateError | undefined,
  values: Record<string, unknown>
) {
  expectMissingValueErrors(error, [values])
}

describe('option given without a value', () => {
  test.each([
    {
      label: 'string',
      schema: { type: 'string' },
      values: { displayName: "'--x'", name: 'x', expected: 'string' }
    },
    {
      label: 'number',
      schema: { type: 'number' },
      values: { displayName: "'--x'", name: 'x', expected: 'number' }
    },
    {
      label: 'custom',
      schema: { type: 'custom', parse: (value: string) => value },
      values: { displayName: "'--x'", name: 'x', expected: 'custom' }
    },
    {
      label: 'custom with a metavar',
      schema: { type: 'custom', metavar: 'date', parse: (value: string) => new Date(value) },
      values: { displayName: "'--x'", name: 'x', expected: 'date' }
    },
    {
      label: 'enum',
      schema: { type: 'enum', choices: ['a', 'b'] },
      values: {
        displayName: "'--x'",
        name: 'x',
        expected: 'enum',
        choices: '"a", "b"',
        choiceValues: ['a', 'b']
      }
    },
    {
      label: 'enum without choices',
      schema: { type: 'enum' },
      values: { displayName: "'--x'", name: 'x', expected: 'enum', choices: '', choiceValues: [] }
    },
    {
      label: 'string with a metavar and a parse function',
      schema: { type: 'string', metavar: 'path', parse: (value: string) => value },
      values: { displayName: "'--x'", name: 'x', expected: 'string' }
    },
    {
      label: 'number with a metavar and a parse function',
      schema: { type: 'number', metavar: 'port', parse: (value: string) => Number(value) },
      values: { displayName: "'--x'", name: 'x', expected: 'number' }
    }
  ])('$label reports a missing value', ({ schema, values }) => {
    const result = resolveArgs({ x: schema as ArgSchema }, parseArgs(['--x']))
    expectMissingValueError(result.error, values)
    expect(result.error?.errors[0].message).toBe("Optional argument '--x' requires a value")
    expect(result.values.x).toBeUndefined()
    expect(result.explicit.x).toBe(true)
  })

  test('a required option reports a missing value instead of a required option', () => {
    const { values, error, explicit } = resolveArgs(
      { x: { type: 'string', required: true } },
      parseArgs(['--x'])
    )
    expectMissingValueError(error, { displayName: "'--x'", name: 'x', expected: 'string' })
    expect(values.x).toBeUndefined()
    expect(explicit.x).toBe(true)
  })

  test('a default is filled in', () => {
    const { values, error } = resolveArgs(
      { x: { type: 'string', default: 'd' } },
      parseArgs(['--x'])
    )
    expectMissingValueError(error, { displayName: "'--x'", name: 'x', expected: 'string' })
    expect(values.x).toBe('d')
  })

  test.each([
    { label: 'last', argv: ['--x', 'a', '--x'] },
    { label: 'first', argv: ['--x', '--x', 'a'] }
  ])('multiple values keep the given ones when the $label one is missing', ({ argv }) => {
    const { values, error } = resolveArgs(
      { x: { type: 'custom', multiple: true, parse: (value: string) => value.toUpperCase() } },
      parseArgs(argv)
    )
    expectMissingValueError(error, { displayName: "'--x'", name: 'x', expected: 'custom' })
    expect(values.x).toEqual(['A'])
  })

  const shortArgs = {
    x: {
      type: 'string',
      short: 'x'
    },
    verbose: {
      type: 'boolean',
      short: 'v'
    }
  } as const satisfies Args

  test.each([
    { label: '-x', argv: ['-x'] },
    { label: '--x --verbose', argv: ['--x', '--verbose'], verbose: true },
    { label: '--x -- rest', argv: ['--x', '--', 'rest'], rest: ['rest'] },
    {
      label: '-xv with shortGrouping',
      argv: ['-xv'],
      options: { shortGrouping: true },
      verbose: true
    },
    { label: '-x=', argv: ['-x='] },
    { label: "-x ''", argv: ['-x', ''] }
  ])('$label reports a missing value', ({ argv, options, verbose, rest = [] }) => {
    const result = resolveArgs(shortArgs, parseArgs(argv), options)
    expectMissingValueError(result.error, {
      displayName: "'--x' or '-x'",
      name: 'x',
      expected: 'string'
    })
    expect(result.error?.errors[0].message).toBe("Optional argument '--x' or '-x' requires a value")
    expect(result.values.x).toBeUndefined()
    expect(result.values.verbose).toBe(verbose)
    expect(result.rest).toEqual(rest)
  })

  test('a lone - after an option is its value, not a missing value', () => {
    const { values, error } = resolveArgs({ port: { type: 'number' } }, parseArgs(['--port', '-']))
    expect(error?.errors.length).toBe(1)
    const resolveError = error?.errors[0] as ArgResolveError
    expect(resolveError.code).toBe(ArgsValidationErrorKeys.invalidType)
    expect(resolveError.values.actual).toBe('-')
    expect(values.port).toBeUndefined()
  })

  test('a required option given without a value takes part in conflicts', () => {
    const { error } = resolveArgs(
      {
        a: { type: 'string', short: 'a', required: true, conflicts: 'b' },
        b: { type: 'boolean' }
      },
      parseArgs(['-a', '--b'])
    )
    expect(error?.errors.map(error => (error as ArgResolveError).type)).toEqual([
      'type',
      'conflict'
    ])
    expect((error?.errors[0] as ArgResolveError).code).toBe(ArgsValidationErrorKeys.missingValue)
    // the conflict names the option the way it was given
    expect(error?.errors[1].message).toBe("Optional argument '-a' conflicts with '--b'")
  })

  test('an explicit empty value is not a missing value', () => {
    for (const argv of [['--x='], ['--x', '']]) {
      expect(resolveArgs({ x: { type: 'string' } }, parseArgs(argv)).error).toBeUndefined()
      const required = resolveArgs({ x: { type: 'string', required: true } }, parseArgs(argv))
      expect(required.error?.errors.map(error => (error as ArgResolveError).code)).toEqual([
        ArgsValidationErrorKeys.requiredOption
      ])
    }
  })

  const booleanArgs = {
    color: {
      type: 'boolean',
      negatable: true
    },
    flag: {
      type: 'boolean',
      required: true
    }
  } as const satisfies Args

  test.each([
    { label: '--color --flag', argv: ['--color', '--flag'], values: { color: true, flag: true } },
    {
      label: '--no-color --flag',
      argv: ['--no-color', '--flag'],
      values: { color: false, flag: true }
    },
    {
      label: '--no-color -5 --flag',
      argv: ['--no-color', '-5', '--flag'],
      values: { color: false, flag: true }
    }
  ])('boolean options given as $label have no missing value', ({ argv, values }) => {
    const result = resolveArgs(booleanArgs, parseArgs(argv))
    expect(result.error).toBeUndefined()
    expect(result.values).toEqual(values)
  })

  test('boolean options keep their errors for a value given with =', () => {
    const codes = (argv: string[]) =>
      resolveArgs(booleanArgs, parseArgs(argv)).error?.errors.map(
        error => (error as ArgResolveError).code
      )
    expect(codes(['--flag', '--no-color=false'])).toEqual([ArgsValidationErrorKeys.unexpectedValue])
    expect(codes(['--flag', '--color=maybe'])).toEqual([ArgsValidationErrorKeys.invalidType])
  })
})

describe('option given without a value followed by an argument starting with -', () => {
  const args = {
    port: {
      type: 'number',
      short: 'p'
    },
    name: {
      type: 'string',
      short: 'n'
    },
    verbose: {
      type: 'boolean',
      short: 'v'
    },
    exclude: {
      type: 'boolean',
      short: 'e'
    },
    color: {
      type: 'boolean',
      negatable: true
    },
    maxCount: {
      type: 'number',
      toKebab: true
    }
  } as const satisfies Args

  const port = { displayName: "'--port' or '-p'", name: 'port', expected: 'number' }
  const name = { displayName: "'--name' or '-n'", name: 'name', expected: 'string' }

  test.each([
    { label: '--port -5', argv: ['--port', '-5'], values: port, next: '-5' },
    { label: '-p -5', argv: ['-p', '-5'], values: port, next: '-5' },
    {
      label: '-vp -5 with shortGrouping',
      argv: ['-vp', '-5'],
      options: { shortGrouping: true },
      values: port,
      next: '-5'
    },
    { label: '--port -5.5', argv: ['--port', '-5.5'], values: port, next: '-5.5' },
    { label: '--port -1e3', argv: ['--port', '-1e3'], values: port, next: '-1e3' },
    { label: '--port -.5', argv: ['--port', '-.5'], values: port, next: '-.5' },
    // numeric in the same way as the value of a number option
    { label: '--port -Infinity', argv: ['--port', '-Infinity'], values: port, next: '-Infinity' },
    {
      label: '--max-count -5',
      argv: ['--max-count', '-5'],
      values: { displayName: "'--max-count'", name: 'maxCount', expected: 'number' },
      next: '-5',
      option: 'max-count'
    },
    { label: '--name -x', argv: ['--name', '-x'], values: name, next: '-x' },
    { label: '--name --foo', argv: ['--name', '--foo'], values: name, next: '--foo' },
    { label: '--name --foo=bar', argv: ['--name', '--foo=bar'], values: name, next: '--foo=bar' },
    { label: '--name --foo=', argv: ['--name', '--foo='], values: name, next: '--foo=' }
  ])('$label suggests the long form', ({ argv, options, values, next, option }) => {
    const suggestion = `--${option ?? values.name}=${next}`
    const result = resolveArgs(args, parseArgs(argv), options)
    expectMissingValueError(result.error, { ...values, next, suggestion })
    expect(result.error?.errors[0].message).toBe(
      `Optional argument ${values.displayName} requires a value (to pass '${next}' as its value, write '${suggestion}')`
    )
    expect(result.values).not.toHaveProperty(values.name)
  })

  test.each([
    { label: '--port', argv: ['--port'], values: port },
    { label: '--port --', argv: ['--port', '--'], values: port },
    { label: '--port -v', argv: ['--port', '-v'], values: port },
    { label: '--port --verbose', argv: ['--port', '--verbose'], values: port },
    { label: '--port -ve', argv: ['--port', '-ve'], values: port },
    // a number option takes only a numeric value
    { label: '--port -x', argv: ['--port', '-x'], values: port },
    { label: '--port -vx', argv: ['--port', '-vx'], values: port },
    { label: '--port --foo', argv: ['--port', '--foo'], values: port },
    // numeric only in part
    { label: '--port -5x', argv: ['--port', '-5x'], values: port },
    { label: '--name --no-color', argv: ['--name', '--no-color'], values: name },
    {
      label: '-pv -5 with shortGrouping',
      argv: ['-pv', '-5'],
      options: { shortGrouping: true },
      values: port
    },
    // a long option with an inline value comes before `-v` in the resolved order
    {
      label: '-pv --foo=bar with shortGrouping',
      argv: ['-pv', '--foo=bar'],
      options: { shortGrouping: true },
      values: port
    },
    { label: '--name -x=1', argv: ['--name', '-x=1'], values: name },
    // the value after `=` is kept, so the argument is not rebuilt as `-x5`
    { label: '--name -x=-5', argv: ['--name', '-x=-5'], values: name },
    { label: '--name --port=5', argv: ['--name', '--port=5'], values: name }
  ])('$label suggests nothing', ({ argv, options, values }) => {
    const result = resolveArgs(args, parseArgs(argv), options)
    expectMissingValueError(result.error, values)
    expect(result.error?.errors[0].message).toBe(
      `Optional argument ${values.displayName} requires a value`
    )
    expect(result.values).not.toHaveProperty(values.name)
  })

  test('--name -p-5 suggests nothing for either option', () => {
    const result = resolveArgs(args, parseArgs(['--name', '-p-5']))
    // `-p-5` is split into `-p`, the option terminator and `-5`
    expectMissingValueErrors(result.error, [port, name])
    expect(result.rest).toEqual(['-5'])
  })

  test('only the last of a repeated short option in one argument gets a suggestion', () => {
    const result = resolveArgs(args, parseArgs(['-pp', '-5']), { shortGrouping: true })
    expectMissingValueErrors(result.error, [port, { ...port, next: '-5', suggestion: '--port=-5' }])
    expect(result.values).not.toHaveProperty('port')
  })

  test('each occurrence of a multiple option is checked', () => {
    const result = resolveArgs(
      { tag: { type: 'string', multiple: true } },
      parseArgs(['--tag', '-x', '--tag'])
    )
    const tag = { displayName: "'--tag'", name: 'tag', expected: 'string' }
    expectMissingValueErrors(result.error, [{ ...tag, next: '-x', suggestion: '--tag=-x' }, tag])
    expect(result.values.tag).toBeUndefined()
  })

  test('a required option gets a suggestion too', () => {
    const result = resolveArgs(
      { name: { type: 'string', required: true } },
      parseArgs(['--name', '-x'])
    )
    expectMissingValueError(result.error, {
      displayName: "'--name'",
      name: 'name',
      expected: 'string',
      next: '-x',
      suggestion: '--name=-x'
    })
    expect(result.error?.errors[0].message).toBe(
      "Optional argument '--name' requires a value (to pass '-x' as its value, write '--name=-x')"
    )
    expect(result.explicit.name).toBe(true)
  })

  test('an enum keeps its choices next to the suggestion', () => {
    // a value starting with `-` is suggested only when it is one of the choices
    const choices = ['-1', '0', '1']
    const result = resolveArgs({ level: { type: 'enum', choices } }, parseArgs(['--level', '-1']))
    expectMissingValueError(result.error, {
      displayName: "'--level'",
      name: 'level',
      expected: 'enum',
      choices: '"-1", "0", "1"',
      choiceValues: ['-1', '0', '1'],
      next: '-1',
      suggestion: '--level=-1'
    })
    // a copy, so changing it does not change the schema
    expect((result.error?.errors[0] as ArgResolveError).values.choiceValues).not.toBe(choices)
    expect(result.values.level).toBeUndefined()
  })

  test.each([
    { label: 'an enum', schema: { type: 'enum', choices: ['debug', 'info'] } },
    {
      label: 'an enum with a parse function',
      schema: {
        type: 'enum',
        choices: ['debug', 'info'],
        parse: (value: string) => value.toUpperCase()
      }
    }
  ])('$label does not suggest a value outside its choices', ({ schema }) => {
    const result = resolveArgs({ level: schema as ArgSchema }, parseArgs(['--level', '-d']))
    expectMissingValueError(result.error, {
      displayName: "'--level'",
      name: 'level',
      expected: 'enum',
      choices: '"debug", "info"',
      choiceValues: ['debug', 'info']
    })
    expect(result.error?.errors[0].message).toBe("Optional argument '--level' requires a value")
    expect(result.values.level).toBeUndefined()
  })

  test('an enum with a parse function suggests one of its choices', () => {
    const result = resolveArgs(
      { level: { type: 'enum', choices: ['-1', '0', '1'], parse: (value: string) => value } },
      parseArgs(['--level', '-1'])
    )
    expectMissingValueError(result.error, {
      displayName: "'--level'",
      name: 'level',
      expected: 'enum',
      choices: '"-1", "0", "1"',
      choiceValues: ['-1', '0', '1'],
      next: '-1',
      suggestion: '--level=-1'
    })
    expect(result.error?.errors[0].message).toBe(
      "Optional argument '--level' requires a value (to pass '-1' as its value, write '--level=-1')"
    )
  })

  test('an enum with no choices suggests nothing', () => {
    const result = resolveArgs(
      { level: { type: 'enum', choices: [] } },
      parseArgs(['--level', '-x'])
    )
    expectMissingValueError(result.error, {
      displayName: "'--level'",
      name: 'level',
      expected: 'enum',
      choices: '',
      choiceValues: []
    })
    expect(result.error?.errors[0].message).toBe("Optional argument '--level' requires a value")
  })

  test('choices of an option that is not an enum do not limit the suggestion', () => {
    const result = resolveArgs(
      { name: { type: 'string', choices: ['a'] } },
      parseArgs(['--name', '-x'])
    )
    expectMissingValueError(result.error, {
      displayName: "'--name'",
      name: 'name',
      expected: 'string',
      next: '-x',
      suggestion: '--name=-x'
    })
    expect(result.error?.errors[0].message).toBe(
      "Optional argument '--name' requires a value (to pass '-x' as its value, write '--name=-x')"
    )
  })

  // `Number('-x')` is `NaN` and does not throw, so this `parse` would take `-x`. The error expects a
  // number, though, so a number option is checked by its type, also with a parse function.
  test('a number option with a parse function does not suggest a value that is not a number', () => {
    const result = resolveArgs(
      { x: { type: 'number', parse: (value: string) => Number(value) } },
      parseArgs(['--x', '-x'])
    )
    expectMissingValueError(result.error, { displayName: "'--x'", name: 'x', expected: 'number' })
    expect(result.error?.errors[0].message).toBe("Optional argument '--x' requires a value")
    expect(result.values.x).toBeUndefined()
  })

  test('a number option with a parse function suggests a numeric value', () => {
    const result = resolveArgs(
      { x: { type: 'number', parse: (value: string) => Number(value) } },
      parseArgs(['--x', '-5'])
    )
    expectMissingValueError(result.error, {
      displayName: "'--x'",
      name: 'x',
      expected: 'number',
      next: '-5',
      suggestion: '--x=-5'
    })
    expect(result.error?.errors[0].message).toBe(
      "Optional argument '--x' requires a value (to pass '-5' as its value, write '--x=-5')"
    )
  })

  test('an enum without choices suggests any value', () => {
    const result = resolveArgs({ mode: { type: 'enum' } }, parseArgs(['--mode', '-x']))
    expectMissingValueError(result.error, {
      displayName: "'--mode'",
      name: 'mode',
      expected: 'enum',
      choices: '',
      choiceValues: [],
      next: '-x',
      suggestion: '--mode=-x'
    })
    expect(result.error?.errors[0].message).toBe(
      "Optional argument '--mode' requires a value (to pass '-x' as its value, write '--mode=-x')"
    )
  })

  test('a custom option keeps the suggestion without calling parse', () => {
    const received: string[] = []
    const result = resolveArgs(
      {
        x: {
          type: 'custom',
          parse: (value: string) => {
            received.push(value)
            return value
          }
        }
      },
      parseArgs(['--x', '-x'])
    )
    expectMissingValueError(result.error, {
      displayName: "'--x'",
      name: 'x',
      expected: 'custom',
      next: '-x',
      suggestion: '--x=-x'
    })
    // the value is not checked by calling parse
    expect(received).toEqual([])
  })

  test('the suggested value of an enum passes as one of its choices', () => {
    const { values, error } = resolveArgs(
      { level: { type: 'enum', choices: ['-1', '0', '1'] } },
      parseArgs(['--level=-1'])
    )
    expect(error).toBeUndefined()
    expect(values.level).toBe('-1')
  })

  test('a negated form counts as a defined option only for a negatable boolean', () => {
    const missingName = { displayName: "'--name'", name: 'name', expected: 'string' }
    const negatable = resolveArgs(
      { name: { type: 'string' }, color: { type: 'boolean', negatable: true } },
      parseArgs(['--name', '--no-color'])
    )
    expectMissingValueError(negatable.error, missingName)
    expect(negatable.values.color).toBe(false)

    const notNegatable = resolveArgs(
      { name: { type: 'string' }, color: { type: 'boolean' } },
      parseArgs(['--name', '--no-color'])
    )
    expectMissingValueError(notNegatable.error, {
      ...missingName,
      next: '--no-color',
      suggestion: '--name=--no-color'
    })
    expect(notNegatable.values.color).toBeUndefined()
  })

  test.each([
    { flag: '--no-cache', value: true },
    { flag: '--no-no-cache', value: false }
  ])('$flag of a boolean named no-cache is a defined option', ({ flag, value }) => {
    const result = resolveArgs(
      { name: { type: 'string' }, 'no-cache': { type: 'boolean', negatable: true } },
      parseArgs(['--name', flag])
    )
    expectMissingValueError(result.error, {
      displayName: "'--name'",
      name: 'name',
      expected: 'string'
    })
    expect(result.values['no-cache']).toBe(value)
  })

  test('a negated form with toKebab is a defined option', () => {
    const result = resolveArgs(
      { name: { type: 'string' }, dryRun: { type: 'boolean', negatable: true, toKebab: true } },
      parseArgs(['--name', '--no-dry-run'])
    )
    expectMissingValueError(result.error, {
      displayName: "'--name'",
      name: 'name',
      expected: 'string'
    })
    expect(result.values.dryRun).toBe(false)
  })

  test('defined option names follow the toKebab option of resolveArgs', () => {
    const result = resolveArgs(
      { name: { type: 'string' }, dryRun: { type: 'boolean' } },
      parseArgs(['--name', '--dry-run']),
      { toKebab: true }
    )
    expectMissingValueError(result.error, {
      displayName: "'--name'",
      name: 'name',
      expected: 'string'
    })
    expect(result.values.dryRun).toBe(true)
  })

  test('a positional argument is not a defined option', () => {
    const result = resolveArgs(
      { name: { type: 'string' }, file: { type: 'positional', required: false } },
      parseArgs(['--name', '--file'])
    )
    expectMissingValueError(result.error, {
      displayName: "'--name'",
      name: 'name',
      expected: 'string',
      next: '--file',
      suggestion: '--name=--file'
    })
    expect(result.values.file).toBeUndefined()
  })

  test('a digit defined as a short option is not suggested as a value', () => {
    const result = resolveArgs(
      { port: { type: 'number' }, five: { type: 'boolean', short: '5' } },
      parseArgs(['--port', '-5'])
    )
    expectMissingValueError(result.error, {
      displayName: "'--port'",
      name: 'port',
      expected: 'number'
    })
    expect(result.values.five).toBe(true)
  })

  test.each([
    { label: '--port=-5', argv: ['--port=-5'], values: { port: -5 } },
    { label: '--name=-x', argv: ['--name=-x'], values: { name: '-x' } },
    { label: '--max-count=-5', argv: ['--max-count=-5'], values: { maxCount: -5 } },
    { label: '--name=--foo=bar', argv: ['--name=--foo=bar'], values: { name: '--foo=bar' } }
  ])('the suggested $label passes the value', ({ argv, values }) => {
    const result = resolveArgs(args, parseArgs(argv))
    expect(result.error).toBeUndefined()
    expect(result.values).toEqual(values)
  })

  test('a negated form is not taken for an option that takes a value', () => {
    const result = resolveArgs({ name: { type: 'string' } }, parseArgs(['--no-name']))
    expect(result.error).toBeUndefined()
    expect(result.explicit.name).toBe(false)
  })

  test('an option whose name starts with no- takes a value', () => {
    const proxyArgs = { 'no-proxy': { type: 'string' } } as const satisfies Args
    const missing = resolveArgs(proxyArgs, parseArgs(['--no-proxy']))
    expectMissingValueError(missing.error, {
      displayName: "'--no-proxy'",
      name: 'no-proxy',
      expected: 'string'
    })
    const given = resolveArgs(proxyArgs, parseArgs(['--no-proxy', 'localhost']))
    expect(given.values['no-proxy']).toBe('localhost')
  })
})

describe('option with a parse function given without a value', () => {
  test.each([
    {
      label: 'string',
      schema: { type: 'string', parse: (value: string) => value.toUpperCase() },
      message: "Optional argument '--x' requires a value",
      values: { displayName: "'--x'", name: 'x', expected: 'string' }
    },
    {
      label: 'number',
      schema: { type: 'number', parse: (value: string) => Number(value) },
      message: "Optional argument '--x' requires a value",
      values: { displayName: "'--x'", name: 'x', expected: 'number' }
    },
    {
      label: 'enum',
      schema: { type: 'enum', choices: ['a', 'b'], parse: (value: string) => value },
      message: "Optional argument '--x' requires a value",
      values: {
        displayName: "'--x'",
        name: 'x',
        expected: 'enum',
        choices: '"a", "b"',
        choiceValues: ['a', 'b']
      }
    },
    {
      label: 'custom (split)',
      schema: { type: 'custom', parse: (value: string) => value.split(',') },
      message: "Optional argument '--x' requires a value",
      values: { displayName: "'--x'", name: 'x', expected: 'custom' }
    },
    {
      label: 'custom (JSON.parse)',
      schema: { type: 'custom', parse: (value: string) => JSON.parse(value) as unknown },
      message: "Optional argument '--x' requires a value",
      values: { displayName: "'--x'", name: 'x', expected: 'custom' }
    },
    {
      label: 'custom with a metavar',
      schema: { type: 'custom', metavar: 'date', parse: (value: string) => new Date(value) },
      message: "Optional argument '--x' requires a value",
      values: { displayName: "'--x'", name: 'x', expected: 'date' }
    }
  ])('$label reports the missing value', ({ schema, message, values }) => {
    const result = resolveArgs({ x: schema as ArgSchema }, parseArgs(['--x']))
    expectMissingValueError(result.error, values)
    expect(result.error?.errors[0].message).toBe(message)
    expect(result.values.x).toBeUndefined()
    expect(result.explicit.x).toBe(true)
  })

  test('parse is not called, even with a default', () => {
    const received: string[] = []
    const parse = (value: string) => {
      received.push(value)
      return value
    }
    resolveArgs({ x: { type: 'custom', parse } }, parseArgs(['--x']))
    resolveArgs({ x: { type: 'custom', parse, default: 'dflt' } }, parseArgs(['--x']))
    resolveArgs({ x: { type: 'string', parse, default: 'd' } }, parseArgs(['--x']))
    expect(received).toEqual([])
  })

  test('a default is filled in without going through parse', () => {
    const str = resolveArgs(
      {
        x: {
          type: 'string',
          parse: (value: string) => `${value}!`,
          default: 'd'
        }
      },
      parseArgs(['--x'])
    )
    expectMissingValueError(str.error, { displayName: "'--x'", name: 'x', expected: 'string' })
    expect(str.values.x).toBe('d')

    const custom = resolveArgs(
      {
        x: {
          type: 'custom',
          parse: (value: string) => value.split(','),
          default: 'dflt'
        }
      },
      parseArgs(['--x'])
    )
    expectMissingValueError(custom.error, { displayName: "'--x'", name: 'x', expected: 'custom' })
    expect(custom.values.x).toBe('dflt')
  })

  const shortArgs = {
    x: {
      type: 'string',
      short: 'x',
      parse: (value: string) => value
    },
    verbose: {
      type: 'boolean',
      short: 'v'
    }
  } as const satisfies Args

  test.each([
    { label: '-x', argv: ['-x'] },
    { label: '--x --verbose', argv: ['--x', '--verbose'], verbose: true },
    { label: '--x -- rest', argv: ['--x', '--', 'rest'], rest: ['rest'] },
    {
      label: '-xv with shortGrouping',
      argv: ['-xv'],
      options: { shortGrouping: true },
      verbose: true
    },
    { label: '-x=', argv: ['-x='] },
    { label: "-x ''", argv: ['-x', ''] }
  ])('$label reports the missing value', ({ argv, options, verbose, rest = [] }) => {
    const result = resolveArgs(shortArgs, parseArgs(argv), options)
    expectMissingValueError(result.error, {
      displayName: "'--x' or '-x'",
      name: 'x',
      expected: 'string'
    })
    expect(result.values.x).toBeUndefined()
    expect(result.values.verbose).toBe(verbose)
    expect(result.rest).toEqual(rest)
  })

  test('an explicit empty value still reaches parse', () => {
    const received: string[] = []
    const args = {
      x: {
        type: 'string',
        parse: (value: string) => {
          received.push(value)
          return `<${value}>`
        }
      }
    } as const satisfies Args
    for (const argv of [['--x='], ['--x', '']]) {
      const { values, error } = resolveArgs(args, parseArgs(argv))
      expect(error).toBeUndefined()
      expect(values.x).toBe('<>')
    }
    expect(received).toEqual(['', ''])
  })

  test('a value still reaches parse', () => {
    const { values, error } = resolveArgs(
      { x: { type: 'custom', parse: (value: string) => value.split(',') } },
      parseArgs(['--x=a,b'])
    )
    expect(error).toBeUndefined()
    expect(values.x).toEqual(['a', 'b'])
  })

  test('required reports a missing value, and an explicit empty value as required', () => {
    const received: string[] = []
    const args = {
      x: {
        type: 'string',
        required: true,
        parse: (value: string) => {
          received.push(value)
          return value
        }
      }
    } as const satisfies Args
    const missing = resolveArgs(args, parseArgs(['--x']))
    expectMissingValueError(missing.error, { displayName: "'--x'", name: 'x', expected: 'string' })
    expect(missing.values.x).toBeUndefined()
    for (const argv of [['--x='], ['--x', '']]) {
      const { values, error } = resolveArgs(args, parseArgs(argv))
      expect(error?.errors.length).toBe(1)
      expect((error?.errors[0] as ArgResolveError).code).toBe(
        ArgsValidationErrorKeys.requiredOption
      )
      expect(values.x).toBeUndefined()
    }
    expect(received).toEqual([])
  })

  test.each([
    { type: 'string', metavar: 'path' },
    { type: 'number', metavar: 'port' }
  ] as const)(
    'a metavar does not name the expected value for a $type type',
    ({ type, metavar }) => {
      const { error } = resolveArgs(
        { x: { type, metavar, parse: (value: string) => value } },
        parseArgs(['--x'])
      )
      expectMissingValueError(error, { displayName: "'--x'", name: 'x', expected: type })
      expect(error?.errors[0].message).toBe("Optional argument '--x' requires a value")
    }
  )

  test.each([
    { label: 'last', argv: ['--x', 'a', '--x'] },
    { label: 'first', argv: ['--x', '--x', 'a'] }
  ])('multiple values keep the given ones when the $label one is missing', ({ argv }) => {
    const { values, error } = resolveArgs(
      { x: { type: 'custom', multiple: true, parse: (value: string) => value.toUpperCase() } },
      parseArgs(argv)
    )
    expectMissingValueError(error, { displayName: "'--x'", name: 'x', expected: 'custom' })
    expect(values.x).toEqual(['A'])
  })

  test.each([
    { label: 'last', argv: ['--x', 'a', '--x'] },
    { label: 'first', argv: ['--x', '--x', 'a'] }
  ])('a single value keeps the given one when the $label one is missing', ({ argv }) => {
    const { values, error } = resolveArgs(
      {
        x: {
          type: 'custom',
          parse: (value: string) => value.toUpperCase(),
          default: 'dflt'
        }
      },
      parseArgs(argv)
    )
    expectMissingValueError(error, { displayName: "'--x'", name: 'x', expected: 'custom' })
    expect(values.x).toBe('A')
  })

  test('boolean and positional parse functions are unchanged', () => {
    const received: string[] = []
    const record = (value: string) => {
      received.push(value)
      return value
    }
    const boolArgs = {
      v: {
        type: 'boolean',
        negatable: true,
        parse: (value: string) => record(value) === 'true'
      }
    } as const satisfies Args
    expect(resolveArgs(boolArgs, parseArgs(['--v'])).values.v).toBe(true)
    expect(resolveArgs(boolArgs, parseArgs(['--no-v'])).values.v).toBe(false)

    const positionalArgs = {
      p: {
        type: 'positional',
        required: false,
        default: 7,
        parse: (value: string) => Number(record(value))
      }
    } as const satisfies Args
    expect(resolveArgs(positionalArgs, parseArgs(['42'])).values.p).toBe(42)
    expect(resolveArgs(positionalArgs, parseArgs([])).values.p).toBe(7)

    expect(received).toEqual(['true', 'false', '42'])
  })
})

describe('schema.parse priority', () => {
  test('string type with parse function', () => {
    const argv = ['--port', '8080']
    const tokens = parseArgs(argv)
    const { values } = resolveArgs(
      {
        port: {
          type: 'string',
          parse: (v: string) => parseInt(v, 10)
        }
      },
      tokens
    )
    expect(values.port).toBe(8080)
  })

  test('boolean type with parse function', () => {
    const argv = ['--verbose']
    const tokens = parseArgs(argv)
    const { values } = resolveArgs(
      {
        verbose: {
          type: 'boolean',
          parse: (v: string) => v === 'true'
        }
      },
      tokens
    )
    expect(values.verbose).toBe(true)
  })

  test('boolean type with parse function and negation', () => {
    const argv = ['--no-verbose']
    const tokens = parseArgs(argv)
    const { values } = resolveArgs(
      {
        verbose: {
          type: 'boolean',
          negatable: true,
          parse: (v: string) => v === 'true'
        }
      },
      tokens
    )
    expect(values.verbose).toBe(false)
  })

  test('positional with parse function', () => {
    const argv = ['42']
    const tokens = parseArgs(argv)
    const { values } = resolveArgs(
      {
        count: {
          type: 'positional',
          parse: (v: string) => parseInt(v, 10)
        }
      },
      tokens
    )
    expect(values.count).toBe(42)
  })

  test('multiple positional with parse function', () => {
    const argv = ['1', '2', '3']
    const tokens = parseArgs(argv)
    const { values } = resolveArgs(
      {
        numbers: {
          type: 'positional',
          multiple: true,
          parse: (v: string) => parseInt(v, 10)
        }
      },
      tokens
    )
    expect(values.numbers).toEqual([1, 2, 3])
  })

  test('positional parse error handling', () => {
    const argv = ['not-a-number']
    const tokens = parseArgs(argv)
    const { error } = resolveArgs(
      {
        count: {
          type: 'positional',
          parse: (v: string) => {
            const n = parseInt(v, 10)
            if (isNaN(n)) {
              throw new Error('Expected integer')
            }
            return n
          }
        }
      },
      tokens
    )
    expect(error?.errors.length).toBe(1)
    expect((error?.errors[0] as Error).message).toBe('Expected integer')
  })

  test('analyze phase: boolean followed by positional', () => {
    const argv = ['--verbose', 'foo', '--port', '8080']
    const tokens = parseArgs(argv)
    const { values, positionals } = resolveArgs(
      {
        verbose: {
          type: 'boolean'
        },
        port: {
          type: 'number',
          short: 'p'
        }
      },
      tokens
    )
    expect(values.verbose).toBe(true)
    expect(values.port).toBe(8080)
    expect(positionals).toEqual(['foo'])
  })

  test('analyze phase: kebab-case boolean followed by positional', () => {
    const schema = {
      file: {
        type: 'positional',
        required: false
      },
      enableLogging: {
        type: 'boolean',
        toKebab: true
      },
      force: {
        type: 'boolean',
        toKebab: true
      }
    } as const

    const flagThenPositional = resolveArgs(schema, parseArgs(['--enable-logging', 'app.js']))
    expect(flagThenPositional.values.enableLogging).toBe(true)
    expect(flagThenPositional.values.file).toBe('app.js')
    expect(flagThenPositional.positionals).toEqual(['app.js'])

    const positionalThenFlag = resolveArgs(schema, parseArgs(['app.js', '--enable-logging']))
    expect(positionalThenFlag.values.enableLogging).toBe(true)
    expect(positionalThenFlag.values.file).toBe('app.js')
    expect(positionalThenFlag.positionals).toEqual(['app.js'])

    const nonHyphenatedBoolean = resolveArgs(schema, parseArgs(['--force', 'app.js']))
    expect(nonHyphenatedBoolean.values.force).toBe(true)
    expect(nonHyphenatedBoolean.values.file).toBe('app.js')
    expect(nonHyphenatedBoolean.positionals).toEqual(['app.js'])
  })

  test('analyze phase: global toKebab boolean followed by positional', () => {
    const schema = {
      file: {
        type: 'positional',
        required: false
      },
      enableLogging: {
        type: 'boolean'
      }
    } as const

    const { values, positionals } = resolveArgs(schema, parseArgs(['--enable-logging', 'app.js']), {
      toKebab: true
    })
    expect(values.enableLogging).toBe(true)
    expect(values.file).toBe('app.js')
    expect(positionals).toEqual(['app.js'])
  })

  test('analyze phase: negatable kebab-case boolean followed by positional', () => {
    const { values, positionals } = resolveArgs(
      {
        file: {
          type: 'positional',
          required: false
        },
        enableLogging: {
          type: 'boolean',
          toKebab: true,
          negatable: true
        }
      },
      parseArgs(['--no-enable-logging', 'app.js'])
    )
    expect(values.enableLogging).toBe(false)
    expect(values.file).toBe('app.js')
    expect(positionals).toEqual(['app.js'])
  })
})

/* oxlint-enable no-unsafe-optional-chaining */
