/* oxlint-disable no-unsafe-optional-chaining */

import { describe, expect, test } from 'vitest'
import { z } from 'zod/v4-mini'
import { parseArgs } from './parser.ts'
import { ArgResolveError, resolveArgs } from './resolver.ts'

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
    expect((error?.errors[0] as ArgResolveError).type).toBe('conflict')
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
            if (isNaN(n)) throw new Error('Expected integer')
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
})

/* oxlint-enable no-unsafe-optional-chaining */
