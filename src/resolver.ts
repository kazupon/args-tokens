/**
 * Entry point of argument options resolver.
 * @module
 */

/**
 * @author kazuya kawaguchi (a.k.a. kazupon)
 * @license MIT
 */

import { hasLongOptionPrefix, isShortOption } from './parser.ts'

import type { ArgToken } from './parser.ts'

/**
 * An option schema for an argument.
 * This schema is similar to the schema of the `node:utils`.
 * difference is that:
 * - `multiple` property is not supported
 * - `required` property and `description` property are added
 * - `type` is not only 'string' and 'boolean', but also 'number' and 'enum' too.
 * - `default` property type, not support multiple types
 */
export interface ArgOptionSchema {
  /**
   * Type of argument.
   */
  type: 'string' | 'boolean' | 'number' | 'enum'
  /**
   * A single character alias for the option.
   */
  short?: string
  /**
   * A description of the argument.
   */
  description?: string
  /**
   * Whether the argument is required or not.
   */
  required?: true
  /**
   * The allowed values of the argument, and string only. This property is only used when the type is 'enum'.
   */
  choices?: string[]
  /**
   * The default value of the argument.
   * if the type is 'enum', the default value must be one of the allowed values.
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

/**
 * @internal
 */
export type ExtractOptionValue<O extends ArgOptionSchema> = O['type'] extends 'string'
  ? string
  : O['type'] extends 'boolean'
    ? boolean
    : O['type'] extends 'number'
      ? number
      : O['type'] extends 'enum'
        ? O['choices'] extends string[]
          ? O['choices'][number]
          : never
        : string | boolean | number

/**
 * @internal
 */
export type ResolveArgValues<O extends ArgOptions, V extends Record<keyof O, unknown>> = {
  -readonly [Option in keyof O]?: V[Option]
} & FilterArgs<O, V, 'default'> &
  FilterArgs<O, V, 'required'> extends infer P
  ? { [K in keyof P]: P[K] }
  : never

/**
 * @internal
 */
export type FilterArgs<
  O extends ArgOptions,
  V extends Record<keyof O, unknown>,
  K extends keyof ArgOptionSchema
> = {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  [Option in keyof O as O[Option][K] extends {} ? Option : never]: V[Option]
}

/**
 * An options for {@link resolveArgs | resolve arguments}.
 */
export interface ResolveArgsOptions {
  /**
   * Whether to group short options.
   * @default false
   * @see guideline 5 in https://pubs.opengroup.org/onlinepubs/9799919799/basedefs/V1_chap12.html
   */
  optionGrouping?: boolean
}

/**
 * Resolve command line arguments.
 * @param options - An options that contains {@link ArgOptionSchema | options schema}.
 * @param tokens - An array of {@link ArgToken | tokens}.
 * @param resolveArgsOptions - An options that contains {@link resolveArgsOptions | resolve arguments options}.
 * @returns An object that contains the values of the arguments, positional arguments, and {@link AggregateError | validation errors}.
 */
export function resolveArgs<T extends ArgOptions>(
  options: T,
  tokens: ArgToken[],
  { optionGrouping = false }: ResolveArgsOptions = {}
): { values: ArgValues<T>; positionals: string[]; error: AggregateError | undefined } {
  const positionals = [] as string[]

  const longOptionTokens: ArgToken[] = []
  const shortOptionTokens: ArgToken[] = []

  let currentLongOption: ArgToken | undefined
  let currentShortOption: ArgToken | undefined
  const expandableShortOptions: ArgToken[] = []

  function toShortValue(): string | undefined {
    if (expandableShortOptions.length === 0) {
      return undefined
    } else {
      const value = expandableShortOptions.map(token => token.name).join('')
      expandableShortOptions.length = 0
      return value
    }
  }

  function applyLongOptionValue(value: string | undefined = undefined): void {
    if (currentLongOption) {
      currentLongOption.value = value
      longOptionTokens.push({ ...currentLongOption })
      currentLongOption = undefined
    }
  }

  function applyShortOptionValue(value: string | undefined = undefined): void {
    if (currentShortOption) {
      currentShortOption.value = value || toShortValue()
      shortOptionTokens.push({ ...currentShortOption })
      currentShortOption = undefined
    }
  }

  /**
   * analyze phase to resolve value
   * separate tokens into positionals, long and short options, after that resolve values
   */

  const schemas = Object.values(options)

  // eslint-disable-next-line unicorn/no-for-loop
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]
    if (token.kind === 'positional') {
      if (currentShortOption) {
        const found = schemas.find(
          schema => schema.short === currentShortOption!.name && schema.type === 'boolean'
        )
        if (found) {
          positionals.push(token.value!)
        }
      } else if (currentLongOption) {
        const found = options[currentLongOption.name!]?.type === 'boolean'
        if (found) {
          positionals.push(token.value!)
        }
      } else {
        positionals.push(token.value!)
      }
      // check if previous option is not resolved
      applyLongOptionValue(token.value)
      applyShortOptionValue(token.value)
    } else if (token.kind === 'option') {
      if (token.rawName) {
        if (hasLongOptionPrefix(token.rawName)) {
          if (token.inlineValue) {
            longOptionTokens.push({ ...token })
          } else {
            currentLongOption = { ...token }
          }
          // check if previous short option is not resolved
          applyShortOptionValue()
        } else if (isShortOption(token.rawName)) {
          if (currentShortOption) {
            if (currentShortOption.index === token.index) {
              if (optionGrouping) {
                currentShortOption.value = token.value
                shortOptionTokens.push({ ...currentShortOption })
                currentShortOption = { ...token }
              } else {
                expandableShortOptions.push({ ...token })
              }
            } else {
              currentShortOption.value = toShortValue()
              shortOptionTokens.push({ ...currentShortOption })
              currentShortOption = { ...token }
            }
            // check if previous long option is not resolved
            applyLongOptionValue()
          } else {
            currentShortOption = { ...token }
            // check if previous long option is not resolved
            applyLongOptionValue()
          }
        }
      } else {
        // short option value
        if (currentShortOption && currentShortOption.index == token.index && token.inlineValue) {
          currentShortOption.value = token.value
          shortOptionTokens.push({ ...currentShortOption })
          currentShortOption = undefined
        }
        // check if previous long option is not resolved
        applyLongOptionValue()
      }
    } else {
      // check if previous option is not resolved
      applyLongOptionValue()
      applyShortOptionValue()
    }
  }

  /**
   * check if the last long or short option is not resolved
   */

  applyLongOptionValue()
  applyShortOptionValue()

  /**
   * resolve values
   */

  const values = Object.create(null) as ArgValues<T>
  const errors: Error[] = []

  for (const [option, schema] of Object.entries(options)) {
    if (schema.required) {
      const found =
        longOptionTokens.find(token => token.name === option) ||
        (schema.short && shortOptionTokens.find(token => token.name === schema.short))
      if (!found) {
        errors.push(createRequireError(option, schema))
        continue
      }
    }

    // eslint-disable-next-line unicorn/no-for-loop
    for (let i = 0; i < longOptionTokens.length; i++) {
      const token = longOptionTokens[i]
      // eslint-disable-next-line unicorn/no-null
      if (option === token.name && token.rawName != null && hasLongOptionPrefix(token.rawName)) {
        const invalid = validateRequire(token, option, schema)
        if (invalid) {
          errors.push(invalid)
          continue
        }

        if (schema.type === 'boolean') {
          // NOTE: re-set value to undefined, because long boolean type option is set on analyze phase
          token.value = undefined
        } else {
          const invalid = validateValue(token, option, schema)
          if (invalid) {
            errors.push(invalid)
            continue
          }
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(values as any)[option] = resolveOptionValue(token, schema)
        continue
      }
    }

    // eslint-disable-next-line unicorn/no-for-loop
    for (let i = 0; i < shortOptionTokens.length; i++) {
      const token = shortOptionTokens[i]

      // eslint-disable-next-line unicorn/no-null
      if (schema.short === token.name && token.rawName != null && isShortOption(token.rawName)) {
        const invalid = validateRequire(token, option, schema)
        if (invalid) {
          errors.push(invalid)
          continue
        }

        if (schema.type === 'boolean') {
          // NOTE: re-set value to undefined, because short boolean type option is set on analyze phase
          token.value = undefined
        } else {
          const invalid = validateValue(token, option, schema)
          if (invalid) {
            errors.push(invalid)
            continue
          }
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(values as any)[option] = resolveOptionValue(token, schema)
        continue
      }
    }

    // eslint-disable-next-line unicorn/no-null
    if (values[option] == null && schema.default != null) {
      // check if the default value is in values
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(values as any)[option] = schema.default
    }
  }

  // eslint-disable-next-line unicorn/error-message
  return { values, positionals, error: errors.length > 0 ? new AggregateError(errors) : undefined }
}

function createRequireError(option: string, schema: ArgOptionSchema): OptionResolveError {
  return new OptionResolveError(
    `Option '--${option}' ${schema.short ? `or '-${schema.short}' ` : ''}is required`,
    option,
    'required',
    schema
  )
}

/**
 * An error type for {@link OptionResolveError}.
 */
export type OptionResolveErrorType = 'type' | 'required'

/**
 * An error that occurs when resolving options.
 * This error is thrown when the option is not valid.
 */
export class OptionResolveError extends Error {
  override name: string
  schema: ArgOptionSchema
  type: OptionResolveErrorType
  constructor(
    message: string,
    name: string,
    type: OptionResolveErrorType,
    schema: ArgOptionSchema
  ) {
    super(message)
    this.name = name
    this.type = type
    this.schema = schema
  }
}

function validateRequire(
  token: ArgToken,
  option: string,
  schema: ArgOptionSchema
): Error | undefined {
  if (schema.required && schema.type !== 'boolean' && !token.value) {
    return createRequireError(option, schema)
  }
}

function validateValue(
  token: ArgToken,
  option: string,
  schema: ArgOptionSchema
): Error | undefined {
  switch (schema.type) {
    case 'number': {
      if (!isNumeric(token.value!)) {
        return createTypeError(option, schema)
      }
      break
    }
    case 'string': {
      if (typeof token.value !== 'string') {
        return createTypeError(option, schema)
      }
      break
    }
    case 'enum': {
      if (schema.choices && !schema.choices.includes(token.value!)) {
        return new OptionResolveError(
          `Option '--${option}' ${schema.short ? `or '-${schema.short}' ` : ''}should be choiced from '${schema.type}' [${schema.choices.map(c => JSON.stringify(c)).join(', ')}] values`,
          option,
          'type',
          schema
        )
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
  return new OptionResolveError(
    `Option '--${option}' ${schema.short ? `or '-${schema.short}' ` : ''}should be '${schema.type}'`,
    option,
    'type',
    schema
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
