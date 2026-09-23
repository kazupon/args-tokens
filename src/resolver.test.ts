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

import type { Args } from './resolver.ts'

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

  test('invalid default', () => {
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
    expect((error?.errors[0] as ArgResolveError).message).toEqual(
      `Optional argument '--log' or '-l' should be chosen from 'enum' ["debug", "info", "warn", "error"] values`
    )
    expect((error?.errors[0] as ArgResolveError).name).toEqual('log')
    expect((error?.errors[0] as ArgResolveError).type).toEqual('type')
    expect((error?.errors[0] as ArgResolveError).schema.type).toEqual('enum')
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
    const argv = ['test', '--to-kebab=foo', '--no-kebab-case', '--noKebab']
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
    const argv = ['test', '--to-kebab=foo', '--no-kebab-case', '--foo-bar']
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
