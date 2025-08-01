/**
 * Entry point of argument options resolver.
 *
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
 * An argument schema definition for command-line argument parsing.
 *
 * This schema is similar to the schema of Node.js `util.parseArgs` but with extended features:
 * - Additional `required` and `description` properties
 * - Extended `type` support: 'string', 'boolean', 'number', 'enum', 'positional', 'custom'
 * - Simplified `default` property (single type, not union types)
 *
 * @example
 * Basic string argument:
 * ```ts
 * const schema: ArgSchema = {
 *   type: 'string',
 *   description: 'Server hostname',
 *   default: 'localhost'
 * }
 * ```
 *
 * @example
 * Required number argument with alias:
 * ```ts
 * const schema: ArgSchema = {
 *   type: 'number',
 *   short: 'p',
 *   description: 'Port number to listen on',
 *   required: true
 * }
 * ```
 *
 * @example
 * Enum argument with choices:
 * ```ts
 * const schema: ArgSchema = {
 *   type: 'enum',
 *   choices: ['info', 'warn', 'error'],
 *   description: 'Logging level',
 *   default: 'info'
 * }
 * ```
 */
export interface ArgSchema {
  /**
   * Type of the argument value.
   *
   * - `'string'`: Text value (default if not specified)
   * - `'boolean'`: `true`/`false` flag (can be negatable with `--no-` prefix)
   * - `'number'`: Numeric value (parsed as integer or float)
   * - `'enum'`: One of predefined string values (requires `choices` property)
   * - `'positional'`: Non-option argument by position
   * - `'custom'`: Custom parsing with user-defined `parse` function
   *
   * @example
   * Different argument types:
   * ```ts
   * {
   *   name: { type: 'string' },        // --name value
   *   verbose: { type: 'boolean' },     // --verbose or --no-verbose
   *   port: { type: 'number' },         // --port 3000
   *   level: { type: 'enum', choices: ['debug', 'info'] },
   *   file: { type: 'positional' },     // first positional arg
   *   config: { type: 'custom', parse: JSON.parse }
   * }
   * ```
   */
  type: 'string' | 'boolean' | 'number' | 'enum' | 'positional' | 'custom'
  /**
   * Single character alias for the long option name.
   *
   * As example, allows users to use `-x` instead of `--extended-option`.
   * Only valid for non-positional argument types.
   *
   * @example
   * Short alias usage:
   * ```ts
   * {
   *   verbose: {
   *     type: 'boolean',
   *     short: 'v'  // Enables both --verbose and -v
   *   },
   *   port: {
   *     type: 'number',
   *     short: 'p'  // Enables both --port 3000 and -p 3000
   *   }
   * }
   * ```
   */
  short?: string
  /**
   * Human-readable description of the argument's purpose.
   *
   * Used for help text generation and documentation.
   * Should be concise but descriptive enough to understand the argument's role.
   *
   * @example
   * Descriptive help text:
   * ```ts
   * {
   *   config: {
   *     type: 'string',
   *     description: 'Path to configuration file'
   *   },
   *   timeout: {
   *     type: 'number',
   *     description: 'Request timeout in milliseconds'
   *   }
   * }
   * ```
   */
  description?: string
  /**
   * Marks the argument as required.
   *
   * When `true`, the argument must be provided by the user.
   * If missing, an `ArgResolveError` with type 'required' will be thrown.
   *
   * Note: Only `true` is allowed (not `false`) to make intent explicit.
   *
   * @example
   * Required arguments:
   * ```ts
   * {
   *   input: {
   *     type: 'string',
   *     required: true,  // Must be provided: --input file.txt
   *     description: 'Input file path'
   *   },
   *   source: {
   *     type: 'positional',
   *     required: true   // First positional argument must exist
   *   }
   * }
   * ```
   */
  required?: true
  /**
   * Allows the argument to accept multiple values.
   *
   * When `true`, the resolved value becomes an array.
   * For options: can be specified multiple times (--tag foo --tag bar)
   * For positional: collects remaining positional arguments
   *
   * Note: Only `true` is allowed (not `false`) to make intent explicit.
   *
   * @example
   * Multiple values:
   * ```ts
   * {
   *   tags: {
   *     type: 'string',
   *     multiple: true,  // --tags foo --tags bar → ['foo', 'bar']
   *     description: 'Tags to apply'
   *   },
   *   files: {
   *     type: 'positional',
   *     multiple: true   // Collects all remaining positional args
   *   }
   * }
   * ```
   */
  multiple?: true
  /**
   * Enables negation for boolean arguments using `--no-` prefix.
   *
   * When `true`, allows users to explicitly set the boolean to `false`
   * using `--no-option-name`. When `false` or omitted, only positive
   * form is available.
   *
   * Only applicable to `type: 'boolean'` arguments.
   *
   * @example
   * Negatable boolean:
   * ```ts
   * {
   *   color: {
   *     type: 'boolean',
   *     negatable: true,
   *     default: true,
   *     description: 'Enable colorized output'
   *   }
   *   // Usage: --color (true), --no-color (false)
   * }
   * ```
   */
  negatable?: boolean
  /**
   * Array of allowed string values for enum-type arguments.
   *
   * Required when `type: 'enum'`. The argument value must be one of these choices,
   * otherwise an `ArgResolveError` with type 'type' will be thrown.
   *
   * Supports both mutable arrays and readonly arrays for type safety.
   *
   * @example
   * Enum choices:
   * ```ts
   * {
   *   logLevel: {
   *     type: 'enum',
   *     choices: ['debug', 'info', 'warn', 'error'] as const,
   *     default: 'info',
   *     description: 'Logging verbosity level'
   *   },
   *   format: {
   *     type: 'enum',
   *     choices: ['json', 'yaml', 'toml'],
   *     description: 'Output format'
   *   }
   * }
   * ```
   */
  choices?: string[] | readonly string[]
  /**
   * Default value used when the argument is not provided.
   *
   * The type must match the argument's `type` property:
   * - `string` type: string default
   * - `boolean` type: boolean default
   * - `number` type: number default
   * - `enum` type: must be one of the `choices` values
   * - `positional`/`custom` type: any appropriate default
   *
   * @example
   * Default values by type:
   * ```ts
   * {
   *   host: {
   *     type: 'string',
   *     default: 'localhost'  // string default
   *   },
   *   verbose: {
   *     type: 'boolean',
   *     default: false        // boolean default
   *   },
   *   port: {
   *     type: 'number',
   *     default: 8080         // number default
   *   },
   *   level: {
   *     type: 'enum',
   *     choices: ['low', 'high'],
   *     default: 'low'        // must be in choices
   *   }
   * }
   * ```
   */
  default?: string | boolean | number
  /**
   * Converts the argument name from camelCase to kebab-case for CLI usage.
   *
   * When `true`, a property like `maxCount` becomes available as `--max-count`.
   * This allows [CAC](https://github.com/cacjs/cac) user-friendly property names while maintaining CLI conventions.
   *
   * Can be overridden globally with `resolveArgs({ toKebab: true })`.
   *
   * Note: Only `true` is allowed (not `false`) to make intent explicit.
   *
   * @example
   * Kebab-case conversion:
   * ```ts
   * {
   *   maxRetries: {
   *     type: 'number',
   *     toKebab: true,        // Accessible as --max-retries
   *     description: 'Maximum retry attempts'
   *   },
   *   enableLogging: {
   *     type: 'boolean',
   *     toKebab: true         // Accessible as --enable-logging
   *   }
   * }
   * ```
   */
  toKebab?: true
  /**
   * Custom parsing function for `type: 'custom'` arguments.
   *
   * Required when `type: 'custom'`. Receives the raw string value and must
   * return the parsed result. Should throw an Error (or subclass) if parsing fails.
   *
   * The function's return type becomes the resolved argument type.
   *
   * @param value - Raw string value from command line
   * @returns Parsed value of any type
   * @throws Error or subclass when value is invalid
   *
   * @example
   * Custom parsing functions:
   * ```ts
   * {
   *   config: {
   *     type: 'custom',
   *     parse: (value: string) => {
   *       try {
   *         return JSON.parse(value)  // Parse JSON config
   *       } catch {
   *         throw new Error('Invalid JSON configuration')
   *       }
   *     },
   *     description: 'JSON configuration object'
   *   },
   *   date: {
   *     type: 'custom',
   *     parse: (value: string) => {
   *       const date = new Date(value)
   *       if (isNaN(date.getTime())) {
   *         throw new Error('Invalid date format')
   *       }
   *       return date
   *     }
   *   }
   * }
   * ```
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- NOTE(kazupon): Allow any type for custom parse function
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- NOTE(kazupon): Allow any type for function check
type IsFunction<T> = T extends (...args: any[]) => any ? true : false

/**
 * Extracts the value type from the argument schema.
 *
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
 * Resolved argument values.
 *
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
 * Filters the arguments based on their default values.
 *
 * @internal
 */
export type FilterArgs<
  A extends Args,
  V extends Record<keyof A, unknown>,
  K extends keyof ArgSchema
> = {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- NOTE(kazupon): Allow empty object type for filter
  [Arg in keyof A as A[Arg][K] extends {} ? Arg : never]: V[Arg]
}

/**
 * Filters positional arguments from the argument schema.
 *
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
   *
   * @default false
   * @see guideline 5 in https://pubs.opengroup.org/onlinepubs/9799919799/basedefs/V1_chap12.html
   */
  shortGrouping?: boolean
  /**
   * Skip positional arguments index.
   *
   * @default -1
   */
  skipPositional?: number
  /**
   * Whether to convert the argument name to kebab-case. This option is applied to all arguments as `toKebab: true`, if set to `true`.
   *
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
 *
 * @param args - An arguments that contains {@link ArgSchema | arguments schema}.
 * @param tokens - An array of {@link ArgToken | tokens}.
 * @param resolveArgs - An arguments that contains {@link ResolveArgs | resolve arguments}.
 * @param resolveArgs.shortGrouping - Whether to group short arguments, default is `false`.
 * @param resolveArgs.skipPositional - Skip positional arguments index, default is `-1`.
 * @param resolveArgs.toKebab - Whether to convert the argument name to kebab-case, default is `false`.
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

  // eslint-disable-next-line unicorn/no-for-loop -- NOTE(kazupon): Use for loop to iterate tokens, and performance optimization
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
    // keyof explicit is generic and cannot be indexed for settings value.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- NOTE(kazupon): Allow any type for resolving
    ;(explicit as any)[rawArg] = false

    if (schema.type === 'positional') {
      if (skipPositionalIndex > SKIP_POSITIONAL_DEFAULT) {
        while (positionalsCount <= getPositionalSkipIndex()) {
          positionalsCount++
        }
      }

      if (schema.multiple) {
        const remainingPositionals = positionalTokens.slice(positionalsCount)
        if (remainingPositionals.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- NOTE(kazupon): Allow any type for resolving
          ;(values as any)[rawArg] = remainingPositionals.map(p => p.value!)
          positionalsCount += remainingPositionals.length
        } else if (schema.required) {
          errors.push(createRequireError(arg, schema))
        }
      } else {
        const positional = positionalTokens[positionalsCount]
        // eslint-disable-next-line unicorn/no-null, unicorn/no-negated-condition -- NOTE(kazupon): Allow null check for positional value
        if (positional != null) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- NOTE(kazupon): Allow any type for resolving
          ;(values as any)[rawArg] = positional.value!
        } else {
          errors.push(createRequireError(arg, schema))
        }
        positionalsCount++
      }
      continue
    }

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

    // eslint-disable-next-line unicorn/no-for-loop -- NOTE(kazupon): Use for loop to iterate option tokens, and performance optimization
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
        // keyof explicit is generic and cannot be indexed for settings value.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- NOTE(kazupon): Allow any type for resolving
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
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- NOTE(kazupon): Allow any type for resolving
            ;(values as any)[rawArg] ||= []
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- NOTE(kazupon): Allow any type for resolving
            ;(values as any)[rawArg].push(parsedValue)
          } else {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- NOTE(kazupon): Allow any type for resolving
            ;(values as any)[rawArg] = parsedValue
          }
        }
      }
    }

    // eslint-disable-next-line unicorn/no-null -- NOTE(kazupon): Allow null check for values
    if (values[rawArg] == null && schema.default != null) {
      // check if the default value is in values
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- NOTE(kazupon): Allow any type for resolving
      ;(values as any)[rawArg] = schema.default
    }
  }

  return {
    values,
    positionals: positionalTokens.map(token => token.value!),
    rest,
    // eslint-disable-next-line unicorn/error-message -- NOTE(kazupon): Use AggregateError to aggregate error messages
    error: errors.length > 0 ? new AggregateError(errors) : undefined,
    explicit
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- NOTE(kazupon): Allow any type for parsing
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
  /**
   * Create an instance of ArgResolveError.
   *
   * @param message the error message
   * @param name the name of the argument
   * @param type the type of the error, either 'type' or 'required'
   * @param schema the argument schema that caused the error
   */
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
  // eslint-disable-next-line unicorn/prefer-number-properties -- NOTE(kazupon): Allow string check for numeric
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
