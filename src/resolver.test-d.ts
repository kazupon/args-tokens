/* eslint-disable @typescript-eslint/no-empty-object-type */
import { expectTypeOf, test } from 'vitest'

import type { ArgValues, ExtractOptionValue, FilterArgs, ResolveArgValues } from './resolver.ts'

test('ExtractOptionValue', () => {
  // string type
  expectTypeOf<
    ExtractOptionValue<{
      type: 'string'
      short: 's'
    }>
  >().toEqualTypeOf<string>()
  expectTypeOf<
    ExtractOptionValue<{
      type: 'string'
      short: 's'
      multiple: true
    }>
  >().toEqualTypeOf<string[]>()

  // boolean type
  expectTypeOf<
    ExtractOptionValue<{
      type: 'boolean'
      short: 's'
    }>
  >().toEqualTypeOf<boolean>()
  expectTypeOf<
    ExtractOptionValue<{
      type: 'boolean'
      short: 's'
      multiple: true
    }>
  >().toEqualTypeOf<boolean[]>()

  // number type
  expectTypeOf<
    ExtractOptionValue<{
      type: 'number'
      short: 's'
    }>
  >().toEqualTypeOf<number>()
  expectTypeOf<
    ExtractOptionValue<{
      type: 'number'
      short: 's'
      multiple: true
    }>
  >().toEqualTypeOf<number[]>()

  // enum type
  expectTypeOf<
    ExtractOptionValue<{
      type: 'enum'
      short: 's'
      choices: ['a', 'b', 'c']
    }>
  >().toEqualTypeOf<'a' | 'b' | 'c'>()
  expectTypeOf<
    ExtractOptionValue<{
      type: 'enum'
      short: 's'
      choices: readonly ['a', 'b']
    }>
  >().toEqualTypeOf<'a' | 'b'>()
  expectTypeOf<
    ExtractOptionValue<{
      type: 'enum'
      short: 's'
    }>
  >().toEqualTypeOf<never>()
  expectTypeOf<
    ExtractOptionValue<{
      type: 'enum'
      short: 's'
      choices: ['a', 'b', 'c']
      multiple: true
    }>
  >().toEqualTypeOf<('a' | 'b' | 'c')[]>()
})

test('FilterArgs', () => {
  expectTypeOf<
    FilterArgs<
      {
        help: {
          type: 'boolean'
          short: 'h'
        }
      },
      { help: true },
      'type'
    >
  >().toEqualTypeOf<{ help: true }>()
  expectTypeOf<
    FilterArgs<
      {
        help: {
          type: 'boolean'
          short: 'h'
        }
      },
      { help: true },
      'short'
    >
  >().toEqualTypeOf<{ help: true }>()

  expectTypeOf<
    FilterArgs<
      {
        help: {
          type: 'boolean'
          short: 'h'
        }
      },
      { help: true },
      'required'
    >
  >().toEqualTypeOf<{}>()
})

test('ResolveArgValues', () => {
  // basic
  expectTypeOf<
    ResolveArgValues<
      {
        help: {
          type: 'boolean'
          short: 'h'
        }
      },
      { help: true }
    >
  >().toEqualTypeOf<{ help?: true | undefined }>()

  // required
  expectTypeOf<
    ResolveArgValues<
      {
        help: {
          type: 'boolean'
          short: 'h'
          required: true
        }
      },
      { help: true }
    >
  >().toEqualTypeOf<{ help: true }>()

  // default
  expectTypeOf<
    ResolveArgValues<
      {
        help: {
          type: 'boolean'
          short: 'h'
          default: false
        }
      },
      { help: false }
    >
  >().toEqualTypeOf<{ help: false }>()

  // enum & choices
  expectTypeOf<
    ResolveArgValues<
      {
        log: {
          type: 'enum'
          short: 'l'
          choices: ['debug', 'info', 'warn', 'error']
        }
      },
      { log: 'debug' }
    >
  >().toEqualTypeOf<{ log?: 'debug' | undefined }>()
})

test('ArgValues', () => {
  type Args = {
    help: {
      type: 'boolean'
      short: 'h'
    }
    version: {
      type: 'boolean'
      short: 'v'
    }
    port: {
      type: 'number'
      short: 'n'
      default: 8080
    }
    host: {
      type: 'string'
      short: 'o'
      required: true
    }
    define: {
      type: 'string'
      short: 'd'
      multiple: true
    }
    log: {
      type: 'enum'
      short: 'l'
      choices: ['debug', 'info', 'warn', 'error']
    }
  }

  expectTypeOf<ArgValues<Args>>().toEqualTypeOf<{
    help?: boolean
    version?: boolean
    port: number
    host: string
    define?: string[]
    log?: 'debug' | 'info' | 'warn' | 'error'
  }>()
})

/* eslint-enable @typescript-eslint/no-empty-object-type */
