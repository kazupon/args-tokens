/**
 * Parser combinator factory functions for composable argument schema construction.
 *
 * @example
 * ```ts
 * import { parseArgs, resolveArgs } from 'args-tokens'
 * import {
 *   args,
 *   string,
 *   integer,
 *   boolean,
 *   positional,
 *   choice,
 *   withDefault,
 *   multiple,
 *   required,
 *   short,
 *   map,
 *   merge,
 *   extend
 * } from 'args-tokens/combinators'
 *
 * // Define reusable schema groups with args()
 * const common = args({
 *   help: short(boolean(), 'h'),
 *   verbose: boolean()
 * })
 *
 * const network = args({
 *   port: short(withDefault(integer({ min: 1, max: 65535 }), 8080), 'p'),
 *   host: required(short(string({ minLength: 1 }), 'o'))
 * })
 *
 * // Compose schemas with merge()
 * const schema = merge(
 *   common,
 *   network,
 *   args({
 *     command: positional()
 *   })
 * )
 *
 * const argv = ['dev', '--port', '9131', '--host', 'example.com', '--verbose']
 * const tokens = parseArgs(argv)
 * const { values } = resolveArgs(schema, tokens)
 * ```
 *
 * @experimental This module is experimental and may change in future versions.
 *
 * @module
 */

/**
 * @author kazuya kawaguchi (a.k.a. kazupon)
 * @license MIT
 */

import type { Args, ArgSchema } from './resolver.ts'

/**
 * A combinator produced by combinator factory functions.
 *
 * @typeParam T - The parsed value type.
 *
 * @experimental
 */
export type Combinator<T> = {
  /**
   * The parse function that converts a string to the desired type.
   *
   * @param value - The input string value.
   * @returns The parsed value of type T.
   */
  parse: (value: string) => T
}

/**
 * A schema produced by combinator factory functions.
 * Any {@link ArgSchema} with a parse function qualifies.
 *
 * @typeParam T - The parsed value type.
 *
 * @experimental
 */
export type CombinatorSchema<T> = ArgSchema & Combinator<T>

// ------------------------------------------------------------------------------------------------
// Base Combinators
// ------------------------------------------------------------------------------------------------

/**
 * Common options shared by all base combinators.
 *
 * @experimental
 */
export interface BaseOptions {
  /**
   * Human-readable description for help text generation.
   */
  description?: string
  /**
   * Single character short alias.
   */
  short?: string
  /**
   * Mark as required.
   */
  required?: boolean
}

/**
 * Options for the {@link string} combinator.
 *
 * @experimental
 */
export interface StringOptions extends BaseOptions {
  /**
   * Minimum string length.
   */
  minLength?: number
  /**
   * Maximum string length.
   */
  maxLength?: number
  /**
   * Regular expression pattern the value must match.
   */
  pattern?: RegExp
}

/**
 * Create a string argument schema with optional validation.
 *
 * @param opts - Validation options.
 * @returns A combinator schema that resolves to string.
 *
 * @example
 * ```ts
 * const args = {
 *   name: string({ minLength: 1, maxLength: 50 })
 * }
 * ```
 *
 * @experimental
 */
export function string(opts?: StringOptions): CombinatorSchema<string> {
  return {
    type: 'string',
    metavar: 'string',
    ...(opts?.description != null ? { description: opts.description } : {}),
    ...(opts?.short != null ? { short: opts.short } : {}),
    ...(opts?.required != null ? { required: opts.required } : {}),
    parse(value: string): string {
      if (opts?.minLength != null && value.length < opts.minLength) {
        throw new RangeError(`String must be at least ${opts.minLength} characters`)
      }
      if (opts?.maxLength != null && value.length > opts.maxLength) {
        throw new RangeError(`String must be at most ${opts.maxLength} characters`)
      }
      if (opts?.pattern != null && !opts.pattern.test(value)) {
        throw new Error(`String must match pattern ${opts.pattern}`)
      }
      return value
    }
  }
}

/**
 * Options for the {@link number} combinator.
 *
 * @experimental
 */
export interface NumberOptions extends BaseOptions {
  /**
   * Minimum value (inclusive).
   */
  min?: number
  /**
   * Maximum value (inclusive).
   */
  max?: number
}

/**
 * Create a number argument schema with optional range validation.
 *
 * Accepts any numeric value (integer or float).
 *
 * @param opts - Range options.
 * @returns A combinator schema that resolves to number.
 *
 * @example
 * ```ts
 * const args = {
 *   timeout: number({ min: 0, max: 30000 })
 * }
 * ```
 *
 * @experimental
 */
export function number(opts?: NumberOptions): CombinatorSchema<number> {
  return {
    type: 'number',
    metavar: 'number',
    ...(opts?.description != null ? { description: opts.description } : {}),
    ...(opts?.short != null ? { short: opts.short } : {}),
    ...(opts?.required != null ? { required: opts.required } : {}),
    parse(value: string): number {
      const n = Number(value)
      if (value.trim() === '' || isNaN(n)) {
        throw new TypeError(`Expected a number, got '${value}'`)
      }
      if (opts?.min != null && n < opts.min) {
        throw new RangeError(`Number must be >= ${opts.min}, got ${n}`)
      }
      if (opts?.max != null && n > opts.max) {
        throw new RangeError(`Number must be <= ${opts.max}, got ${n}`)
      }
      return n
    }
  }
}

/**
 * Options for the {@link integer} combinator.
 *
 * @experimental
 */
export interface IntegerOptions extends BaseOptions {
  /**
   * Minimum value (inclusive).
   */
  min?: number
  /**
   * Maximum value (inclusive).
   */
  max?: number
}

/**
 * Create an integer argument schema with optional range validation.
 *
 * Only accepts integer values (no decimals).
 *
 * @param opts - Range options.
 * @returns A combinator schema that resolves to number (integer).
 *
 * @example
 * ```ts
 * const args = {
 *   retries: integer({ min: 0, max: 10 })
 * }
 * ```
 *
 * @experimental
 */
export function integer(opts?: IntegerOptions): CombinatorSchema<number> {
  return {
    type: 'custom',
    metavar: 'integer',
    ...(opts?.description != null ? { description: opts.description } : {}),
    ...(opts?.short != null ? { short: opts.short } : {}),
    ...(opts?.required != null ? { required: opts.required } : {}),
    parse(value: string): number {
      if (!/^-?\d+$/.test(value)) {
        throw new TypeError(`Expected an integer, got '${value}'`)
      }
      const n = Number.parseInt(value, 10)
      if (isNaN(n)) {
        throw new TypeError(`Expected an integer, got '${value}'`)
      }
      if (opts?.min != null && n < opts.min) {
        throw new RangeError(`Integer must be >= ${opts.min}, got ${n}`)
      }
      if (opts?.max != null && n > opts.max) {
        throw new RangeError(`Integer must be <= ${opts.max}, got ${n}`)
      }
      return n
    }
  }
}

/**
 * Options for the {@link float} combinator.
 *
 * @experimental
 */
export interface FloatOptions extends BaseOptions {
  /**
   * Minimum value (inclusive).
   */
  min?: number
  /**
   * Maximum value (inclusive).
   */
  max?: number
}

/**
 * Create a floating-point argument schema with optional range validation.
 *
 * Rejects `NaN` and `Infinity` values.
 *
 * @param opts - Range options.
 * @returns A combinator schema that resolves to number (float).
 *
 * @example
 * ```ts
 * const args = {
 *   ratio: float({ min: 0, max: 1 })
 * }
 * ```
 *
 * @experimental
 */
export function float(opts?: FloatOptions): CombinatorSchema<number> {
  return {
    type: 'custom',
    metavar: 'float',
    ...(opts?.description != null ? { description: opts.description } : {}),
    ...(opts?.short != null ? { short: opts.short } : {}),
    ...(opts?.required != null ? { required: opts.required } : {}),
    parse(value: string): number {
      const trimmed = value.trim()
      if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(trimmed)) {
        throw new TypeError(`Expected a finite float, got '${value}'`)
      }
      const n = Number.parseFloat(trimmed)
      if (isNaN(n) || !isFinite(n)) {
        throw new TypeError(`Expected a finite float, got '${value}'`)
      }
      if (opts?.min != null && n < opts.min) {
        throw new RangeError(`Float must be >= ${opts.min}, got ${n}`)
      }
      if (opts?.max != null && n > opts.max) {
        throw new RangeError(`Float must be <= ${opts.max}, got ${n}`)
      }
      return n
    }
  }
}

/**
 * Options for the {@link boolean} combinator.
 *
 * @experimental
 */
export interface BooleanOptions extends BaseOptions {
  /**
   * Enable negation with `--no-` prefix.
   */
  negatable?: boolean
}

/**
 * Create a boolean argument schema.
 *
 * Boolean arguments are existence-based. The resolver passes `"true"` or `"false"`
 * to the parse function based on the presence or negation of the flag.
 *
 * @param opts - Boolean options.
 * @returns A combinator schema for boolean flags.
 *
 * @example
 * ```ts
 * const args = {
 *   color: boolean({ negatable: true })
 * }
 * // Usage: --color (true), --no-color (false)
 * ```
 *
 * @experimental
 */
export function boolean(opts?: BooleanOptions): CombinatorSchema<boolean> {
  return {
    type: 'boolean',
    ...(opts?.negatable != null ? { negatable: opts.negatable } : {}),
    metavar: 'boolean',
    ...(opts?.description != null ? { description: opts.description } : {}),
    ...(opts?.short != null ? { short: opts.short } : {}),
    ...(opts?.required != null ? { required: opts.required } : {}),
    parse(value: string): boolean {
      return value === 'true'
    }
  }
}

/**
 * Positional argument schema type.
 */
type ArgSchemaPositionalType = { type: 'positional' }

/**
 * Create a positional argument schema.
 *
 * Without a parser, resolves to string.
 * With a parser (e.g., `positional(integer())`), resolves to the parser's return type.
 *
 * @typeParam T - The parser's resolved type.
 *
 * @param parser - The parser combinator schema.
 * @returns A positional argument schema resolving to the parser's type.
 *
 * @example
 * ```ts
 * const args = {
 *   command: positional(),           // resolves to string
 *   port: positional(integer()),     // resolves to number
 * }
 * ```
 *
 * @experimental
 */
export function positional<T>(
  parser: CombinatorSchema<T>
): CombinatorSchema<T> & ArgSchemaPositionalType

/**
 * Create a positional argument schema.
 *
 * Without a parser, resolves to string.
 * With a parser (e.g., `positional(integer())`), resolves to the parser's return type.
 *
 * @param parser - Optional base options (description, short, required).
 * @returns A positional argument schema resolving to string.
 *
 * @example
 * ```ts
 * const args = {
 *   command: positional(),           // resolves to string
 *   port: positional(integer()),     // resolves to number
 * }
 * ```
 *
 * @experimental
 */
export function positional(parser?: BaseOptions): ArgSchema & ArgSchemaPositionalType
export function positional<T>(
  parser?: CombinatorSchema<T> | BaseOptions
): ArgSchema & ArgSchemaPositionalType {
  if (parser && 'parse' in parser) {
    return {
      type: 'positional',
      parse: parser.parse,
      metavar: parser.metavar
    }
  }
  const opts = parser
  return {
    type: 'positional',
    ...(opts?.description != null ? { description: opts.description } : {}),
    ...(opts?.short != null ? { short: opts.short } : {}),
    ...(opts?.required != null ? { required: opts.required } : {})
  }
}

/**
 * Create an enum-like argument schema with literal type inference.
 *
 * Uses `const T` generic to infer literal union types from the values array.
 *
 * @typeParam T - The readonly array of allowed string values.
 *
 * @param values - Allowed values.
 * @param opts - Common options (description, short, required).
 * @returns A combinator schema that resolves to a union of the allowed values.
 *
 * @example
 * ```ts
 * const args = {
 *   level: choice(['debug', 'info', 'warn', 'error'] as const)
 * }
 * // typeof values.level === 'debug' | 'info' | 'warn' | 'error'
 * ```
 *
 * @experimental
 */
export function choice<const T extends readonly string[]>(
  values: T,
  opts?: BaseOptions
): CombinatorSchema<T[number]> {
  return {
    type: 'custom',
    metavar: values.join('|'),
    ...(opts?.description != null ? { description: opts.description } : {}),
    ...(opts?.short != null ? { short: opts.short } : {}),
    ...(opts?.required != null ? { required: opts.required } : {}),
    parse(value: string): T[number] {
      if (!(values as readonly string[]).includes(value)) {
        throw new Error(`Value must be one of: ${values.join(', ')}`)
      }
      return value as T[number]
    }
  }
}

// ------------------------------------------------------------------------------------------------
// Custom Combinators
// ------------------------------------------------------------------------------------------------

/**
 * Options for the {@link combinator} factory function.
 *
 * @typeParam T - The parsed value type.
 *
 * @experimental
 */
export interface CombinatorOptions<T> extends BaseOptions {
  /**
   * The parse function that converts a string to the desired type.
   *
   * @param value - The input string value.
   * @returns The parsed value of type T.
   */
  parse: (value: string) => T
  /**
   * Display name hint for help text generation.
   *
   * @default 'custom'
   */
  metavar?: string
}

/**
 * Create a custom argument schema with a user-defined parse function.
 *
 * This is the most general custom combinator. Use it when none of the built-in
 * base combinators ({@link string}, {@link number}, {@link integer},
 * {@link float}, {@link boolean}, {@link choice}) fit your needs.
 *
 * The returned schema has `type: 'custom'`.
 *
 * @typeParam T - The parsed value type.
 *
 * @param config - Configuration with a parse function and optional metavar.
 * @returns A combinator schema that resolves to the parse function's return type.
 *
 * @example
 * ```ts
 * const date = combinator({
 *   parse: (value) => {
 *     const d = new Date(value)
 *     if (isNaN(d.getTime())) {
 *       throw new Error('Invalid date format')
 *     }
 *     return d
 *   },
 *   metavar: 'date'
 * })
 * ```
 *
 * @experimental
 */
export function combinator<T>(config: CombinatorOptions<T>): CombinatorSchema<T> {
  return {
    type: 'custom',
    metavar: config.metavar ?? 'custom',
    ...(config.description != null ? { description: config.description } : {}),
    ...(config.short != null ? { short: config.short } : {}),
    ...(config.required != null ? { required: config.required } : {}),
    parse: config.parse
  }
}

// ------------------------------------------------------------------------------------------------
// Modifier Combinators
// ------------------------------------------------------------------------------------------------

/**
 * Transform the output of a combinator schema.
 *
 * Creates a new schema that applies `transform` to the result of `schema.parse`.
 * The original schema is not modified.
 *
 * @typeParam T - The input schema's parsed type.
 * @typeParam U - The transformed type.
 *
 * @param schema - The base combinator schema.
 * @param transform - The transformation function.
 * @returns A new combinator schema that resolves to the transformed type.
 *
 * @example
 * ```ts
 * const args = {
 *   doubled: map(integer(), n => n * 2)
 * }
 * ```
 *
 * @experimental
 */
export function map<T, U>(
  schema: CombinatorSchema<T>,
  transform: (value: T) => U
): CombinatorSchema<U> {
  const baseParse: (value: string) => T = schema.parse
  return {
    ...schema,
    parse(value: string): U {
      return transform(baseParse(value))
    }
  }
}

/**
 * Options for the {@link withDefault} combinator.
 */
type CombinatorWithDefault<T> = { default: T }

/**
 * Set a default value on a combinator schema.
 *
 * The original schema is not modified.
 *
 * @typeParam T - The schema's parsed type.
 *
 * @param schema - The base combinator schema.
 * @param defaultValue - The default value.
 * @returns A new schema with the default value set.
 *
 * @example
 * ```ts
 * const args = {
 *   port: withDefault(integer({ min: 1, max: 65535 }), 8080)
 * }
 * ```
 *
 * @experimental
 */
export function withDefault<T extends string | boolean | number>(
  schema: CombinatorSchema<T>,
  defaultValue: T
): CombinatorSchema<T> & CombinatorWithDefault<T> {
  return {
    ...schema,
    default: defaultValue
  }
}

/**
 * Options for the {@link multiple} combinator.
 */
type CombinatorMultiple = { multiple: true }

/**
 * Mark a combinator schema as accepting multiple values.
 *
 * The resolved value becomes an array. The original schema is not modified.
 *
 * @typeParam T - The schema's parsed type.
 * @param schema - The base combinator schema.
 * @returns A new schema with `multiple: true`.
 *
 * @example
 * ```ts
 * const args = {
 *   tags: multiple(string())
 * }
 * // typeof values.tags === string[]
 * ```
 *
 * @experimental
 */
export function multiple<T>(schema: CombinatorSchema<T>): CombinatorSchema<T> & CombinatorMultiple {
  return {
    ...schema,
    multiple: true
  }
}

/**
 * Options for the {@link required} combinator.
 */
type CombinatorRequired = { required: true }

/**
 * Mark a combinator schema as required.
 *
 * The original schema is not modified.
 *
 * @typeParam T - The schema's parsed type.
 *
 * @param schema - The base combinator schema.
 * @returns A new schema with `required: true`.
 *
 * @example
 * ```ts
 * const args = {
 *   name: required(string())
 * }
 * ```
 *
 * @experimental
 */
export function required<T>(schema: CombinatorSchema<T>): CombinatorSchema<T> & CombinatorRequired {
  return {
    ...schema,
    required: true
  }
}

/**
 * Options for the {@link short} combinator.
 */
type CombinatorShort<S extends string> = { short: S }

/**
 * Set a short alias on a combinator schema.
 *
 * The original schema is not modified.
 *
 * @typeParam T - The schema's parsed type.
 * @typeParam S - The short alias string literal type.
 *
 * @param schema - The base combinator schema.
 * @param alias - Single character short alias.
 * @returns A new schema with the short alias set.
 *
 * @example
 * ```ts
 * const args = {
 *   verbose: short(boolean(), 'v')
 * }
 * // Usage: -v or --verbose
 * ```
 *
 * @experimental
 */
export function short<T, S extends string>(
  schema: CombinatorSchema<T>,
  alias: S
): CombinatorSchema<T> & CombinatorShort<S> {
  return {
    ...schema,
    short: alias
  }
}

/**
 * Options for the {@link describe} combinator.
 */
type CombinatorDescribe<D extends string> = { description: D }

/**
 * Set a description on a combinator schema for help text generation.
 *
 * The original schema is not modified.
 *
 * @typeParam T - The schema's parsed type.
 * @typeParam D - The description string literal type.
 *
 * @param schema - The base combinator schema.
 * @param text - Human-readable description.
 * @returns A new schema with the description set.
 *
 * @example
 * ```ts
 * const args = {
 *   port: describe(integer(), 'Port number to listen on')
 * }
 * ```
 *
 * @experimental
 */
export function describe<T, D extends string>(
  schema: CombinatorSchema<T>,
  text: D
): CombinatorSchema<T> & CombinatorDescribe<D> {
  return {
    ...schema,
    description: text
  }
}

/**
 * Options for the {@link unrequired} combinator.
 */
type CombinatorUnrequired = { required: false }

/**
 * Mark a combinator schema as not required.
 *
 * Useful for overriding a base combinator that was created with `required: true`.
 * The original schema is not modified.
 *
 * @typeParam T - The schema's parsed type.
 *
 * @param schema - The base combinator schema.
 * @returns A new schema with `required: false`.
 *
 * @example
 * ```ts
 * const args = {
 *   name: unrequired(string({ required: true }))
 * }
 * ```
 *
 * @experimental
 */
export function unrequired<T>(
  schema: CombinatorSchema<T>
): CombinatorSchema<T> & CombinatorUnrequired {
  return {
    ...schema,
    required: false
  }
}

// ------------------------------------------------------------------------------------------------
// Schema Combinators
// ------------------------------------------------------------------------------------------------

/**
 * Recursively merge a tuple of {@link Args} types.
 * Later types override earlier ones on key conflicts.
 *
 * @internal
 */
type MergeArgs<T extends Args[]> = T extends [infer Only extends Args]
  ? Only
  : T extends [infer First extends Args, ...infer Rest extends Args[]]
    ? Omit<First, keyof MergeArgs<Rest>> & MergeArgs<Rest>
    : never

/**
 * Type-safe schema factory.
 *
 * Returns the input unchanged at runtime, but provides type inference
 * so that `satisfies Args` is not needed.
 *
 * @typeParam T - The exact schema type.
 *
 * @param fields - The argument schema object.
 * @returns The same schema object with its type inferred.
 *
 * @example
 * ```ts
 * const common = args({
 *   verbose: boolean(),
 *   help: short(boolean(), 'h')
 * })
 * ```
 *
 * @experimental
 */
export function args<T extends Args>(fields: T): T {
  return fields
}

/**
 * Compose multiple {@link Args} schemas into one.
 *
 * On key conflicts the later schema wins (last-write-wins).
 *
 * @typeParam A - First schema type.
 * @typeParam B - Second schema type.
 *
 * @param a - First schema.
 * @param b - Second schema.
 * @returns A merged schema containing all fields.
 *
 * @example
 * ```ts
 * const common = args({ verbose: boolean() })
 * const network = args({ host: required(string()), port: withDefault(integer(), 8080) })
 * const schema = merge(common, network)
 * ```
 *
 * @experimental
 */
export function merge<A extends Args, B extends Args>(a: A, b: B): Omit<A, keyof B> & B
/**
 * Compose multiple {@link Args} schemas into one.
 *
 * @param a - First schema.
 * @param b - Second schema.
 * @param c - Third schema.
 * @returns A merged schema containing all fields.
 *
 * @experimental
 */
export function merge<A extends Args, B extends Args, C extends Args>(
  a: A,
  b: B,
  c: C
): Omit<Omit<A, keyof B | keyof C> & Omit<B, keyof C>, never> & C
/**
 * Compose multiple {@link Args} schemas into one.
 *
 * @param a - First schema.
 * @param b - Second schema.
 * @param c - Third schema.
 * @param d - Fourth schema.
 * @returns A merged schema containing all fields.
 *
 * @experimental
 */
export function merge<A extends Args, B extends Args, C extends Args, D extends Args>(
  a: A,
  b: B,
  c: C,
  d: D
): MergeArgs<[A, B, C, D]>
/**
 * Compose multiple {@link Args} schemas into one.
 *
 * @param schemas - The schemas to merge.
 * @returns A merged schema containing all fields.
 *
 * @experimental
 */
export function merge<T extends Args[]>(...schemas: T): MergeArgs<T>
export function merge(...schemas: Args[]): Args {
  const result = Object.create(null) as Record<string, ArgSchema>
  for (const schema of schemas) {
    for (const key of Object.keys(schema)) {
      result[key] = schema[key]
    }
  }
  return result
}

/**
 * Extend a schema by overriding or adding fields.
 *
 * Equivalent to `merge(base, overrides)` but communicates the intent of
 * intentional overrides rather than general composition.
 *
 * @typeParam T - Base schema type.
 * @typeParam U - Overrides schema type.
 *
 * @param base - The base schema to extend.
 * @param overrides - Fields to override or add.
 * @returns A new schema with overrides applied.
 *
 * @example
 * ```ts
 * const base = args({ port: withDefault(integer(), 8080) })
 * const strict = extend(base, { port: required(integer({ min: 1, max: 65535 })) })
 * ```
 *
 * @experimental
 */
export function extend<T extends Args, U extends Args>(
  base: T,
  overrides: U
): Omit<T, keyof U> & U {
  const result = Object.create(null) as Record<string, ArgSchema>
  for (const key of Object.keys(base)) {
    result[key] = base[key]
  }
  for (const key of Object.keys(overrides)) {
    result[key] = overrides[key]
  }
  return result as Omit<T, keyof U> & U
}
