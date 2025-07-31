/* eslint-disable @typescript-eslint/no-empty-object-type -- NOTE(kazupon): This is to allow empty object types in tests */
import { expectTypeOf, test } from 'vitest'
import { z } from 'zod/v4-mini'

import type {
  ArgExplicitlyProvided,
  ArgValues,
  ExtractOptionValue,
  FilterArgs,
  ResolveArgValues
} from './resolver.ts'

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

  // positional type
  expectTypeOf<
    ExtractOptionValue<{
      type: 'positional'
      short: 's'
    }>
  >().toEqualTypeOf<string>()

  // custom type
  expectTypeOf<
    ExtractOptionValue<{
      type: 'custom'
      parse: (value: string) => string[]
    }>
  >().toEqualTypeOf<string[]>()
  const _customDictionary = z.object({
    foo: z.string(),
    nest: z.object({
      bar: z.number()
    })
  })
  expectTypeOf<
    ExtractOptionValue<{
      type: 'custom'
      multiple: true
      parse: (value: string) => z.infer<typeof _customDictionary>
    }>
  >().toEqualTypeOf<
    {
      foo: string
      nest: {
        bar: number
      }
    }[]
  >()
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
        order: {
          type: 'positional'
        }
      },
      { order: string },
      'type'
    >
  >().toEqualTypeOf<{ order: string }>()

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

  // positional
  expectTypeOf<
    ResolveArgValues<
      {
        order: {
          type: 'positional'
          short: 'o'
        }
      },
      { order: string }
    >
  >().toEqualTypeOf<{ order: string }>()
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
    order: {
      type: 'positional'
      short: 'o'
    }
    csv: {
      type: 'custom'
      parse: (value: string) => string[]
    }
  }

  expectTypeOf<ArgValues<Args>>().toEqualTypeOf<{
    help?: boolean
    version?: boolean
    port: number
    host: string
    define?: string[]
    log?: 'debug' | 'info' | 'warn' | 'error'
    order: string
    csv?: string[]
  }>()
})

test('ArgExplicitlyProvided', () => {
  type Args = {
    name: {
      type: 'string'
      short: 'n'
      default: 'John'
    }
    age: {
      type: 'number'
      short: 'a'
      default: 30
    }
    verbose: {
      type: 'boolean'
      short: 'v'
      default: false
    }
    regularOption: {
      type: 'string'
      short: 'r'
    }
    custom: {
      type: 'custom'
      parse: (value: string) => string[]
    }
  }

  expectTypeOf<ArgExplicitlyProvided<Args>>().toEqualTypeOf<{
    name: boolean
    age: boolean
    verbose: boolean
    regularOption: boolean
    custom: boolean
  }>()
})

/* eslint-enable @typescript-eslint/no-empty-object-type */
