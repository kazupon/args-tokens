import { describe, expect, test } from 'vitest'
import { parseArgs } from './parser'
import { OptionResolveError, resolveArgs } from './resolver'

import type { ArgOptions } from './resolver'

const options = {
  help: {
    type: 'boolean',
    short: 'h'
  },
  version: {
    type: 'boolean',
    short: 'v'
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
} as const satisfies ArgOptions

describe('resolveArgs', () => {
  test('basic', () => {
    const args = ['dev', '--port=9131', '--host=example.com', '--help']
    const tokens = parseArgs(args)
    const { values, positionals, error } = resolveArgs(options, tokens)
    expect(values).toEqual({
      port: 9131,
      host: 'example.com',
      help: true
    })
    expect(positionals).toEqual(['dev'])
    expect(error).toBeUndefined()
  })

  test('missing required option', () => {
    const args = ['dev']
    const tokens = parseArgs(args)
    const { error } = resolveArgs(options, tokens)
    expect(error?.errors.length).toBe(1)
    expect((error?.errors[0] as Error).message).toEqual("Option '--host' or '-o' is required")
    expect((error?.errors[0] as OptionResolveError).name).toEqual('host')
    expect((error?.errors[0] as OptionResolveError).schema.type).toEqual('string')
  })

  test('missing defaultable option', () => {
    const args = ['dev', '--host=example.com']
    const tokens = parseArgs(args)
    const { values, positionals } = resolveArgs(options, tokens)
    expect(values).toEqual({
      port: 8080,
      host: 'example.com'
    })
    expect(positionals).toEqual(['dev'])
  })

  test('invalid value', () => {
    const args = ['dev', '--port=foo', '--host=example.com']
    const tokens = parseArgs(args)
    const { error } = resolveArgs(options, tokens)
    expect(error?.errors.length).toBe(1)
    expect((error?.errors[0] as OptionResolveError).message).toEqual(
      "Option '--port' or '-p' should be 'number'"
    )
    expect((error?.errors[0] as OptionResolveError).name).toEqual('port')
    expect((error?.errors[0] as OptionResolveError).schema.type).toEqual('number')
  })

  test('multiple errors', () => {
    const args = ['dev', '--port=foo']
    const tokens = parseArgs(args)
    const { error } = resolveArgs(options, tokens)
    expect(error?.errors.length).toBe(2)
    expect((error?.errors[0] as Error).message).toEqual(
      "Option '--port' or '-p' should be 'number'"
    )
    expect((error?.errors[1] as OptionResolveError).message).toEqual(
      "Option '--host' or '-o' is required"
    )
    expect((error?.errors[1] as OptionResolveError).name).toEqual('host')
    expect((error?.errors[1] as OptionResolveError).schema.type).toEqual('string')
  })

  test('missing positionals', () => {
    const args = ['--port=9131', '--host=example.com']
    const tokens = parseArgs(args)
    const { values, positionals } = resolveArgs(options, tokens)
    expect(values).toEqual({
      port: 9131,
      host: 'example.com'
    })
    expect(positionals).toEqual([])
  })

  test('positionals', () => {
    const args = ['dev', '--host=example.com', 'foo', 'bar']
    const tokens = parseArgs(args)
    const { positionals, error } = resolveArgs(options, tokens)
    expect(positionals).toEqual(['dev', 'foo', 'bar'])
    expect(error).toBeUndefined()
  })

  test('long options value captured from positionals', () => {
    const args = ['dev', '--port', '9131', '--host', 'example.com', 'bar']
    const tokens = parseArgs(args)
    const { values, positionals } = resolveArgs(options, tokens)
    expect(values).toEqual({
      port: 9131,
      host: 'example.com'
    })
    expect(positionals).toEqual(['dev', '9131', 'example.com', 'bar'])
  })

  test('short options value specified with equals', () => {
    const args = ['dev', '-p=9131', '-o=example.com', '-h']
    const tokens = parseArgs(args)
    const { values, positionals, error } = resolveArgs(options, tokens)
    expect(values).toEqual({
      port: 9131,
      host: 'example.com',
      help: true
    })
    expect(positionals).toEqual(['dev'])
    expect(error).toBeUndefined()
  })

  test('short options value specified with concatenation', () => {
    const args = ['dev', '-p9131', '-oexample.com']
    const tokens = parseArgs(args)
    const { values, positionals, error } = resolveArgs(options, tokens)
    expect(values).toEqual({
      port: 9131,
      host: 'example.com'
    })
    expect(positionals).toEqual(['dev'])
    expect(error).toBeUndefined()
  })

  test('short options value captured from positionals', () => {
    const args = ['dev', '-p', '9131', '-o', 'example.com', 'bar']
    const tokens = parseArgs(args)
    const { values, positionals, error } = resolveArgs(options, tokens)
    expect(values).toEqual({
      port: 9131,
      host: 'example.com'
    })
    expect(positionals).toEqual(['dev', '9131', 'example.com', 'bar'])
    expect(error).toBeUndefined()
  })

  test('complex options', () => {
    const args = [
      'dev',
      '-p9131',
      '--host',
      'example.com',
      'foo',
      '-m=production',
      '-h',
      '--version',
      'bar',
      'baz'
    ]
    const tokens = parseArgs(args)
    const { values, positionals, error } = resolveArgs(options, tokens)
    expect(values).toEqual({
      port: 9131,
      host: 'example.com',
      mode: 'production',
      help: true,
      version: true
    })
    expect(positionals).toEqual(['dev', 'example.com', 'foo', 'bar', 'baz'])
    expect(error).toBeUndefined()
  })

  test('sanitize options', () => {
    const args = ['dev', '--__proto__', '{ "polluted": 1 }']
    const tokens = parseArgs(args)
    const { values, positionals, error } = resolveArgs(
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
    expect(positionals).toEqual(['dev', '{ "polluted": 1 }'])
    expect(error).toBeUndefined()
  })
})
