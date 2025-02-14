// SPDX-License-Identifier: MIT
// Modifier: kazuya kawaguchi (a.k.a. kazupon)

import { hasLongOptionPrefix, isShortOption } from './parser.js'

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
  const values = {} as ArgValues<T>
  const positionals = [] as string[]

  const longOptionTokens: ArgToken[] = []
  const shortOptionTokens: ArgToken[] = []

  let currentShortOption: ArgToken | undefined
  const expandableShortOptions: ArgToken[] = []

  function toValue(): string | undefined {
    if (expandableShortOptions.length === 0) {
      return undefined
    } else {
      const value = expandableShortOptions.map(token => token.name).join('')
      expandableShortOptions.length = 0
      return value
    }
  }

  function applyShortOptionValue(): void {
    if (currentShortOption) {
      currentShortOption.value = toValue()
      shortOptionTokens.push({ ...currentShortOption })
      currentShortOption = undefined
    }
  }

  /**
   * separate tokens into positionals, long options, and short options, after that resolve values
   */

  // eslint-disable-next-line unicorn/no-for-loop
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]
    if (token.kind === 'positional') {
      positionals.push(token.value!)
      applyShortOptionValue() // check if previous short option is not resolved
    } else if (token.kind === 'option') {
      if (token.rawName) {
        if (hasLongOptionPrefix(token.rawName)) {
          longOptionTokens.push({ ...token })
          applyShortOptionValue() // check if previous short option is not resolved
        } else if (isShortOption(token.rawName)) {
          if (currentShortOption) {
            if (currentShortOption.index === token.index) {
              expandableShortOptions.push({ ...token })
            } else {
              currentShortOption.value = toValue()
              shortOptionTokens.push({ ...currentShortOption })
              currentShortOption = { ...token }
            }
          } else {
            currentShortOption = { ...token }
          }
        }
      } else {
        // short option value
        if (currentShortOption && currentShortOption.index == token.index) {
          currentShortOption.value = token.value
          shortOptionTokens.push({ ...currentShortOption })
          currentShortOption = undefined
        }
      }
    } else {
      applyShortOptionValue() // check if previous short option is not resolved
    }
  }

  /**
   * check if the last short option is not resolved
   */

  applyShortOptionValue()

  /**
   * resolve values
   */

  for (const [option, schema] of Object.entries(options)) {
    if (longOptionTokens.length === 0 && shortOptionTokens.length === 0 && schema.required) {
      throw createRequireError(option, schema)
    }

    // eslint-disable-next-line unicorn/no-for-loop
    for (let i = 0; i < longOptionTokens.length; i++) {
      const token = longOptionTokens[i]
      // eslint-disable-next-line unicorn/no-null
      if (option === token.name && token.rawName != null && hasLongOptionPrefix(token.rawName)) {
        validateRequire(token, option, schema)

        if (schema.type !== 'boolean') {
          validateValue(token, option, schema)
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
        ;(values as any)[option] = resolveOptionValue(token, schema)
        continue
      }
    }

    // eslint-disable-next-line unicorn/no-for-loop
    for (let i = 0; i < shortOptionTokens.length; i++) {
      const token = shortOptionTokens[i]

      // eslint-disable-next-line unicorn/no-null
      if (schema.short === token.name && token.rawName != null && isShortOption(token.rawName)) {
        validateRequire(token, option, schema)

        if (schema.type !== 'boolean') {
          validateValue(token, option, schema)
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
        ;(values as any)[option] = resolveOptionValue(token, schema)
        continue
      }
    }

    // eslint-disable-next-line unicorn/no-null
    if (values[option] == null && schema.default != null) {
      // check if the default value is in values
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
      ;(values as any)[option] = schema.default
    }
  }

  return { values, positionals }
}

function createRequireError(option: string, schema: ArgOptionSchema): Error {
  return new Error(
    `Option '--${option}' ${schema.short ? `or '-${schema.short}'` : ''} is required`
  )
}

function validateRequire(token: ArgToken, option: string, schema: ArgOptionSchema): void {
  if (schema.required && schema.type !== 'boolean' && !token.value) {
    throw createRequireError(option, schema)
  }
}

function validateValue(token: ArgToken, option: string, schema: ArgOptionSchema): void {
  switch (schema.type) {
    case 'number': {
      if (!isNumeric(token.value!)) {
        throw createTypeError(option, schema)
      }
      break
    }
    case 'string': {
      if (typeof token.value !== 'string') {
        throw createTypeError(option, schema)
      }
      break
    }
  }
}

function isNumeric(str: string): boolean {
  // @ts-ignore
  // eslint-disable-next-line unicorn/prefer-number-properties
  return str.trim() !== '' && !isNaN(str)
}

function createTypeError(option: string, schema: ArgOptionSchema): TypeError {
  return new TypeError(
    `Option '--${option}' ${schema.short ? `or '-${schema.short}'` : ''} should be '${schema.type}'`
  )
}

function resolveOptionValue(
  token: ArgToken,
  schema: ArgOptionSchema
): string | boolean | number | undefined {
  if (token.value) {
    return schema.type === 'number' ? +token.value : token.value
  }

  if (schema.type === 'boolean') {
    return true
  }

  return schema.type === 'number' ? +(schema.default || '') : schema.default
}
