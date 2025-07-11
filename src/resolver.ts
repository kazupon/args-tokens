/**
 * Entry point of argument options resolver.
 * @module
 */

/**
 * @author kazuya kawaguchi (a.k.a. kazupon)
 * @license MIT
 */

import { hasLongOptionPrefix, isShortOption } from './parser.ts'
import { kebabnize } from './utils.ts'

import type { ArgToken } from './parser.ts'

/**
 * An argument schema
 * This schema is similar to the schema of the `node:utils`.
 * difference is that:
 * - `required` property and `description` property are added
 * - `type` is not only 'string' and 'boolean', but also 'number', 'enum', 'positional', 'custom' too.
 * - `default` property type, not support multiple types
 */
export interface ArgSchema {
  /**
   * Type of argument.
   */
  type: 'string' | 'boolean' | 'number' | 'enum' | 'positional' | 'custom'
  /**
   * A single character alias for the argument.
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
   * Whether the argument allow multiple values or not.
   */
  multiple?: true
  /**
   * Whether the negatable option for `boolean` type
   */
  negatable?: boolean
  /**
   * The allowed values of the argument, and string only. This property is only used when the type is 'enum'.
   */
  choices?: string[] | readonly string[]
  /**
   * The default value of the argument.
   * if the type is 'enum', the default value must be one of the allowed values.
   */
  default?: string | boolean | number
  /**
   * Whether to convert the argument name to kebab-case.
   */
  toKebab?: true
  /**
   * A function to parse the value of the argument. if the type is 'custom', this function is required.
   * If argument value will be invalid, this function have to throw an error.
   * @param value
   * @returns Parsed value
   * @throws An Error, If the value is invalid. Error type should be `Error` or extends it
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  parse?: (value: string) => any
}

/**
 * An object that contains {@link ArgSchema | argument schema}.
 */
export interface Args {
  [option: string]: ArgSchema
}

/**
 * An object that contains the values of the arguments.
 */
export type ArgValues<T> = T extends Args
  ? ResolveArgValues<
      T,
      {
        [Arg in keyof T]: ExtractOptionValue<T[Arg]>
      }
    >
  : {
      [option: string]: string | boolean | number | (string | boolean | number)[] | undefined
    }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type IsFunction<T> = T extends (...args: any[]) => any ? true : false

/**
 * @internal
 */
export type ExtractOptionValue<A extends ArgSchema> = A['type'] extends 'string'
  ? ResolveOptionValue<A, string>
  : A['type'] extends 'boolean'
    ? ResolveOptionValue<A, boolean>
    : A['type'] extends 'number'
      ? ResolveOptionValue<A, number>
      : A['type'] extends 'positional'
        ? ResolveOptionValue<A, string>
        : A['type'] extends 'enum'
          ? A['choices'] extends string[] | readonly string[]
            ? ResolveOptionValue<A, A['choices'][number]>
            : never
          : A['type'] extends 'custom'
            ? IsFunction<A['parse']> extends true
              ? ResolveOptionValue<A, ReturnType<NonNullable<A['parse']>>>
              : never
            : ResolveOptionValue<A, string | boolean | number>

type ResolveOptionValue<A extends ArgSchema, T> = A['multiple'] extends true ? T[] : T

/**
 * @internal
 */
export type ResolveArgValues<A extends Args, V extends Record<keyof A, unknown>> = {
  -readonly [Arg in keyof A]?: V[Arg]
} & FilterArgs<A, V, 'default'> &
  FilterArgs<A, V, 'required'> &
  FilterPositionalArgs<A, V> extends infer P
  ? { [K in keyof P]: P[K] }
  : never

/**
 * @internal
 */
export type FilterArgs<
  A extends Args,
  V extends Record<keyof A, unknown>,
  K extends keyof ArgSchema
> = {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  [Arg in keyof A as A[Arg][K] extends {} ? Arg : never]: V[Arg]
}

/**
 * @internal
 */
export type FilterPositionalArgs<A extends Args, V extends Record<keyof A, unknown>> = {
  [Arg in keyof A as A[Arg]['type'] extends 'positional' ? Arg : never]: V[Arg]
}

/**
 * An arguments for {@link resolveArgs | resolve arguments}.
 */
export interface ResolveArgs {
  /**
   * Whether to group short arguments.
   * @default false
   * @see guideline 5 in https://pubs.opengroup.org/onlinepubs/9799919799/basedefs/V1_chap12.html
   */
  shortGrouping?: boolean
  /**
   * Skip positional arguments index.
   * @default -1
   */
  skipPositional?: number
  /**
   * Whether to convert the argument name to kebab-case. This option is applied to all arguments as `toKebab: true`, if set to `true`.
   * @default false
   */
  toKebab?: boolean
}

const SKIP_POSITIONAL_DEFAULT = -1

/**
 * Tracks which arguments were explicitly provided by the user.
 *
 * Each property indicates whether the corresponding argument was explicitly
 * provided (true) or is using a default value or not provided (false).
 */
export type ArgExplicitlyProvided<A extends Args> = {
  [K in keyof A]: boolean
}

/**
 * Resolve command line arguments.
 * @param args - An arguments that contains {@link ArgSchema | arguments schema}.
 * @param tokens - An array of {@link ArgToken | tokens}.
 * @param resolveArgs - An arguments that contains {@link ResolveArgs | resolve arguments}.
 * @returns An object that contains the values of the arguments, positional arguments, rest arguments, {@link AggregateError | validation errors}, and explicit provision status.
 *
 * @example
 * ```typescript
 * // passed tokens: --port 3000
 *
 * const { values, explicit } = resolveArgs({
 *   port: {
 *     type: 'number',
 *     default: 8080
 *   },
 *   host: {
 *     type: 'string',
 *     default: 'localhost'
 *   }
 * }, parsedTokens)
 *
 * values.port // 3000
 * values.host // 'localhost'
 *
 * explicit.port // true (explicitly provided)
 * explicit.host // false (not provided, fallback to default)
 * ```
 */
export function resolveArgs<A extends Args>(
  args: A,
  tokens: ArgToken[],
  {
    shortGrouping = false,
    skipPositional = SKIP_POSITIONAL_DEFAULT,
    toKebab = false
  }: ResolveArgs = {}
): {
  values: ArgValues<A>
  positionals: string[]
  rest: string[]
  error: AggregateError | undefined
  explicit: ArgExplicitlyProvided<A>
} {
  const skipPositionalIndex =
    typeof skipPositional === 'number'
      ? Math.max(skipPositional, SKIP_POSITIONAL_DEFAULT)
      : SKIP_POSITIONAL_DEFAULT

  const rest = [] as string[]

  const optionTokens: ArgToken[] = []
  const positionalTokens: ArgToken[] = []

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
      optionTokens.push({ ...currentLongOption })
      currentLongOption = undefined
    }
  }

  function applyShortOptionValue(value: string | undefined = undefined): void {
    if (currentShortOption) {
      currentShortOption.value = value || toShortValue()
      optionTokens.push({ ...currentShortOption })
      currentShortOption = undefined
    }
  }

  /**
   * analyze phase to resolve value
   * separate tokens into positionals, long and short options, after that resolve values
   */

  const schemas = Object.values(args)
  let terminated = false

  // eslint-disable-next-line unicorn/no-for-loop
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]
    if (token.kind === 'positional') {
      // if the option-terminator is found, the rest of the tokens are positional arguments
      if (terminated && token.value) {
        rest.push(token.value)
        continue
      }
      if (currentShortOption) {
        const found = schemas.find(
          schema => schema.short === currentShortOption!.name && schema.type === 'boolean'
        )
        if (found) {
          positionalTokens.push({ ...token })
        }
      } else if (currentLongOption) {
        const found = args[currentLongOption.name!]?.type === 'boolean'
        if (found) {
          positionalTokens.push({ ...token })
        }
      } else {
        positionalTokens.push({ ...token })
      }
      // check if previous option is not resolved
      applyLongOptionValue(token.value)
      applyShortOptionValue(token.value)
    } else if (token.kind === 'option') {
      if (token.rawName) {
        if (hasLongOptionPrefix(token.rawName)) {
          // check if previous long option is not resolved
          applyLongOptionValue()
          if (token.inlineValue) {
            optionTokens.push({ ...token })
          } else {
            currentLongOption = { ...token }
          }
          // check if previous short option is not resolved
          applyShortOptionValue()
        } else if (isShortOption(token.rawName)) {
          if (currentShortOption) {
            if (currentShortOption.index === token.index) {
              if (shortGrouping) {
                currentShortOption.value = token.value
                optionTokens.push({ ...currentShortOption })
                currentShortOption = { ...token }
              } else {
                expandableShortOptions.push({ ...token })
              }
            } else {
              currentShortOption.value = toShortValue()
              optionTokens.push({ ...currentShortOption })
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
          optionTokens.push({ ...currentShortOption })
          currentShortOption = undefined
        }
        // check if previous long option is not resolved
        applyLongOptionValue()
      }
    } else {
      if (token.kind === 'option-terminator') {
        terminated = true
      }
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

  const values = Object.create(null) as ArgValues<A>
  const errors: Error[] = []
  const explicit = Object.create(null) as ArgExplicitlyProvided<A>

  function checkTokenName(option: string, schema: ArgSchema, token: ArgToken): boolean {
    return (
      token.name ===
      (schema.type === 'boolean'
        ? schema.negatable && token.name?.startsWith('no-')
          ? `no-${option}`
          : option
        : option)
    )
  }

  const positionalItemCount = tokens.filter(token => token.kind === 'positional').length
  function getPositionalSkipIndex() {
    return Math.min(skipPositionalIndex, positionalItemCount)
  }

  let positionalsCount = 0
  for (const [rawArg, schema] of Object.entries(args)) {
    const arg = toKebab || schema.toKebab ? kebabnize(rawArg) : rawArg

    // Initialize explicit state for all options
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(explicit as any)[rawArg] = false

    if (schema.required) {
      const found = optionTokens.find(token => {
        return (
          (schema.short && token.name === schema.short) ||
          (token.rawName && hasLongOptionPrefix(token.rawName) && token.name === arg)
        )
      })
      if (!found) {
        errors.push(createRequireError(arg, schema))
        continue
      }
    }

    if (schema.type === 'positional') {
      if (skipPositionalIndex > SKIP_POSITIONAL_DEFAULT) {
        while (positionalsCount <= getPositionalSkipIndex()) {
          positionalsCount++
        }
      }
      const positional = positionalTokens[positionalsCount]
      // eslint-disable-next-line unicorn/no-null, unicorn/no-negated-condition
      if (positional != null) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(values as any)[rawArg] = positional.value!
      } else {
        errors.push(createRequireError(arg, schema))
      }
      positionalsCount++
      continue
    }

    // eslint-disable-next-line unicorn/no-for-loop
    for (let i = 0; i < optionTokens.length; i++) {
      const token = optionTokens[i]

      if (
        (checkTokenName(arg, schema, token) &&
          token.rawName != undefined &&
          hasLongOptionPrefix(token.rawName)) ||
        (schema.short === token.name && token.rawName != undefined && isShortOption(token.rawName))
      ) {
        const invalid = validateRequire(token, arg, schema)
        if (invalid) {
          errors.push(invalid)
          continue
        }

        // Mark as explicitly set when we find a matching token
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(explicit as any)[rawArg] = true

        if (schema.type === 'boolean') {
          // NOTE(kazupon): re-set value to undefined, because long boolean type option is set on analyze phase
          token.value = undefined
        }

        const [parsedValue, error] = parse(token, arg, schema)
        if (error) {
          errors.push(error)
        } else {
          if (schema.multiple) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ;(values as any)[rawArg] ||= []
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ;(values as any)[rawArg].push(parsedValue)
          } else {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ;(values as any)[rawArg] = parsedValue
          }
        }
      }
    }

    // eslint-disable-next-line unicorn/no-null
    if (values[rawArg] == null && schema.default != null) {
      // check if the default value is in values
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(values as any)[rawArg] = schema.default
    }
  }

  return {
    values,
    positionals: positionalTokens.map(token => token.value!),
    rest,
    // eslint-disable-next-line unicorn/error-message
    error: errors.length > 0 ? new AggregateError(errors) : undefined,
    explicit
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parse(token: ArgToken, option: string, schema: ArgSchema): [any, Error | undefined] {
  switch (schema.type) {
    case 'string': {
      // prettier-ignore
      return typeof token.value === 'string'
        ? [token.value || schema.default, undefined]
        : [undefined, createTypeError(option, schema)];
    }
    case 'boolean': {
      // prettier-ignore
      return token.value
        ? [token.value || schema.default, undefined]
        : [!(schema.negatable && token.name!.startsWith('no-')), undefined]
    }
    case 'number': {
      if (!isNumeric(token.value!)) {
        return [undefined, createTypeError(option, schema)]
      }
      return token.value ? [+token.value, undefined] : [+(schema.default || ''), undefined]
    }
    case 'enum': {
      if (schema.choices && !schema.choices.includes(token.value!)) {
        return [
          undefined,
          new ArgResolveError(
            // prettier-ignore
            `Optional argument '--${option}' ${schema.short
              ? `or '-${schema.short}' `
              : ''}should be chosen from '${schema.type}' [${schema.choices.map(c => JSON.stringify(c)).join(', ')}] values`,
            option,
            'type',
            schema
          )
        ]
      }
      return [token.value || schema.default, undefined]
    }
    case 'custom': {
      if (typeof schema.parse !== 'function') {
        throw new TypeError(`argument '${option}' should have a 'parse' function`)
      }
      try {
        return [schema.parse(token.value || String(schema.default || '')), undefined]
      } catch (error) {
        return [undefined, error as Error]
      }
    }
    default: {
      throw new Error(`Unsupported argument type '${schema.type}' for option '${option}'`)
    }
  }
}

function createRequireError(option: string, schema: ArgSchema): ArgResolveError {
  const message =
    schema.type === 'positional'
      ? `Positional argument '${option}' is required`
      : `Optional argument '--${option}' ${schema.short ? `or '-${schema.short}' ` : ''}is required`
  return new ArgResolveError(message, option, 'required', schema)
}

/**
 * An error type for {@link ArgResolveError}.
 */
export type ArgResolveErrorType = 'type' | 'required'

/**
 * An error that occurs when resolving arguments.
 * This error is thrown when the argument is not valid.
 */
export class ArgResolveError extends Error {
  override name: string
  schema: ArgSchema
  type: ArgResolveErrorType
  constructor(message: string, name: string, type: ArgResolveErrorType, schema: ArgSchema) {
    super(message)
    this.name = name
    this.type = type
    this.schema = schema
  }
}

function validateRequire(token: ArgToken, option: string, schema: ArgSchema): Error | undefined {
  if (schema.required && schema.type !== 'boolean' && !token.value) {
    return createRequireError(option, schema)
  }
}

function isNumeric(str: string): boolean {
  // @ts-ignore
  // eslint-disable-next-line unicorn/prefer-number-properties
  return str.trim() !== '' && !isNaN(str)
}

function createTypeError(option: string, schema: ArgSchema): TypeError {
  return new ArgResolveError(
    `Optional argument '--${option}' ${schema.short ? `or '-${schema.short}' ` : ''}should be '${schema.type}'`,
    option,
    'type',
    schema
  )
}
