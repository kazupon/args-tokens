// SPDX-License-Identifier: MIT
// Modifier: kazuya kawaguchi (a.k.a. kazupon)

import { hasLongOptionPrefix } from './parser'

import type { ArgToken } from './parser'

/**
 * An option schema for an argument.
 */
export interface ArgOptionSchema {
  /**
   * Type of argument.
   */
  type: 'string' | 'boolean' | 'number'
  /**
   * A single character alias for the option.
   */
  short?: string
  /**
   * Whether the argument is required or not.
   */
  required?: true
  /**
   * The default value of the argument.
   */
  default?: string | boolean | number
}

/**
 * An object that contains {@link ArgOptionSchema | options schema}.
 */
export interface ArgOptions {
  [option: string]: ArgOptionSchema
}

/**
 * An object that contains the values of the arguments.
 */
export type ArgValues<T> = T extends ArgOptions
  ? ResolveArgValues<
      T,
      {
        [Option in keyof T]: ExtractOptionValue<T[Option]>
      }
    >
  : {
      [option: string]: string | boolean | number | undefined
    }

type ExtractOptionValue<O extends ArgOptionSchema> = O['type'] extends 'string'
  ? string
  : O['type'] extends 'boolean'
    ? boolean
    : O['type'] extends 'number'
      ? number
      : string | boolean | number

type ResolveArgValues<O extends ArgOptions, V extends Record<keyof O, unknown>> = {
  -readonly [Option in keyof O]?: V[Option]
} & FilterArgs<O, V, 'default'> &
  FilterArgs<O, V, 'required'> extends infer P
  ? { [K in keyof P]: P[K] }
  : never

type FilterArgs<
  O extends ArgOptions,
  V extends Record<keyof O, unknown>,
  K extends keyof ArgOptionSchema
> = {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  [Option in keyof O as O[Option][K] extends {} ? Option : never]: V[Option]
}

export function resolveArgs<T extends ArgOptions>(
  options: T,
  tokens: ArgToken[]
): { values: ArgValues<T>; positionals: string[] } {
  // console.log('tokens', tokens)
  const positionals = [] as string[]
  const values = {} as ArgValues<T>

  // eslint-disable-next-line unicorn/no-for-loop
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]
    if (token.kind === 'positional') {
      positionals.push(token.value!)
      continue
    }

    // eslint-disable-next-line unicorn/no-null
    if (token.rawName != null && hasLongOptionPrefix(token.rawName) && token.name != null) {
      const schema = options[token.name]

      validateRequire(token, schema)

      if (schema.type !== 'boolean') {
        validateValue(token, schema)
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
      ;(values as any)[token.name] = resolveOptionValue(token, schema)
    }
  }

  return { values, positionals }
}

function validateRequire(token: ArgToken, schema: ArgOptionSchema): void {
  if (schema.required && schema.type !== 'boolean' && !token.value) {
    throw new Error(`Option ${token.rawName} is required`)
  }
}

function validateValue(token: ArgToken, schema: ArgOptionSchema): void {
  if (typeof token.value !== schema.type) {
    throw new TypeError(`Option ${token.rawName} should be ${schema.type}`)
  }
}

function resolveOptionValue(
  token: ArgToken,
  schema: ArgOptionSchema
): string | boolean | number | undefined {
  if (token.value) {
    return token.value
  }

  if (schema.type === 'boolean') {
    return true
  }

  console.log('resolveOptionValue', schema, token)
  return schema.default
}
