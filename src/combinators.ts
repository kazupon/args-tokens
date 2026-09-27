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

import { PURE_PARSE } from './internal.ts'
import { ArgsValidationError, ArgsValidationErrorKeys } from './resolver.ts'
import { formatChoices } from './utils.ts'

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
 * Any {@link ArgSchema} whose parse function returns `T` qualifies. The `parse` of
 * {@link ArgSchema}, which returns `any`, is left out, so that a schema fits only where the values
 * that it parses do: `integer()` is not a `CombinatorSchema<string>`.
 *
 * @typeParam T - The parsed value type.
 *
 * @experimental
 */
export type CombinatorSchema<T> = Omit<ArgSchema, 'parse'> & Combinator<T>

/**
 * How {@link short}, {@link describe}, {@link withDefault}, {@link required}, {@link multiple},
 * {@link hidden}, {@link unrequired} and {@link positional} read a schema typed as `any`: its value
 * is typed `unknown`, and the `parse` of {@link ArgSchema}, which returns `any`, is kept, so that
 * the result still fits any {@link CombinatorSchema}, as the schema typed as `any` does.
 *
 * For a schema typed by a type parameter, whether it is `any` is not known, so the result is built
 * from the properties of the type parameter, which TypeScript reads through its constraint.
 */
type UntypedCombinatorSchema = ArgSchema & Combinator<unknown>

/**
 * The type that a combinator schema `S` parses to, for each schema of a union:
 * `string | number` for `CombinatorSchema<string> | CombinatorSchema<number>`.
 */
type ParsedType<S> = S extends Combinator<infer T> ? T : never

function createInvalidTypeError(
  message: string,
  expected: string,
  actual: string
): ArgsValidationError {
  return new ArgsValidationError(message, {
    code: ArgsValidationErrorKeys.invalidType,
    values: {
      expected,
      actual
    }
  })
}

function createInvalidChoiceError(
  message: string,
  choices: readonly string[],
  actual: string
): ArgsValidationError {
  return new ArgsValidationError(message, {
    code: ArgsValidationErrorKeys.invalidChoice,
    values: {
      expected: 'enum',
      choices: formatChoices(choices),
      choiceValues: [...choices],
      actual
    }
  })
}

/**
 * Mark the `parse` function of a schema as free of side effects, so that the resolver may call it
 * to check a value before suggesting it.
 *
 * @typeParam S - The schema type.
 *
 * @param schema - A schema whose `parse` function has no side effects.
 * @returns The same schema.
 */
function pureParse<S extends Combinator<unknown>>(schema: S): S {
  Object.defineProperty(schema.parse, PURE_PARSE, { value: true })
  return schema
}

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
   * Hide from generated help or usage output.
   */
  hidden?: boolean
  /**
   * Single character short alias.
   */
  short?: string
  /**
   * Mark as required.
   *
   * A literal `true` or `false` is kept in the type of the schema: `true` types the value as
   * present, as {@link required} does, and `false` makes a positional argument optional. So does a
   * `required` that may be `false`: one of type `boolean` that the options always have, or a
   * `false` that they have only in some cases, with no `required` in the others, such as
   * `optional ? { required: false } : {}`. A `true` that the options have only in some cases, such
   * as `strict ? { required: true } : {}`, is not kept.
   *
   * TypeScript widens a `required: true` to `boolean` in options written apart from the call, such
   * as `const options = { required: true }`, which makes a positional argument optional, as a
   * `required` typed as `any` does: write such options `as const`.
   *
   * Options whose type only says that `required` is a `boolean` that may be missing, as the type of
   * this property does, keep a positional argument typed as present, as options without `required`
   * do. So do `optional ? { required: flag } : {}`, and the options that a generic helper takes as
   * a type parameter, such as `T extends IntegerOptions`, whose `required` TypeScript reads from
   * the constraint. Use {@link unrequired} for such a positional argument when it may be missing.
   */
  required?: boolean
}

/**
 * The schema `S` with the type `R` of `required` in the options: `true` types the value as present,
 * and `false` or `boolean` makes a positional argument optional. `any` is kept as `boolean`, which
 * it may be, so that an option with it stays optional.
 */
type WithRequiredOption<S, R extends boolean> = WithFlag<
  S,
  { required: unknown extends R ? boolean : R }
>

/**
 * The schema `S` with an optional `required: false`, when the type `R` of `required` in options
 * that may not have it may be `false` but not `true`, as for `optional ? { required: false } : {}`,
 * so that a positional argument with it is optional. The property is optional, instead of
 * `false | undefined`, so that the schema fits {@link ArgSchema} with `exactOptionalPropertyTypes`.
 * `S` stays as is otherwise, such as when `R` is `boolean` or `boolean | undefined`, as for options
 * without `required`.
 */
type WithUnrequiredOption<S, R extends boolean | undefined> = false extends R
  ? true extends R
    ? S
    : WithFlag<S, { required?: false }>
  : S

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
 * @typeParam R - The type of `required` in the options, which the schema keeps.
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
export function string<const R extends boolean>(
  opts: StringOptions & { required: R }
): WithRequiredOption<CombinatorSchema<string>, R>

/**
 * Create a string argument schema with optional validation.
 *
 * @typeParam R - The type of `required` in the options, which the schema keeps when it may be
 *   `false` but not `true`, as for `optional ? { required: false } : {}`, so that a positional
 *   argument with it is optional.
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
export function string<const R extends boolean | undefined = boolean | undefined>(
  opts?: StringOptions & { required?: R }
): WithUnrequiredOption<CombinatorSchema<string>, R>

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
export function string(opts?: StringOptions): CombinatorSchema<string>
// @__NO_SIDE_EFFECTS__
export function string(opts?: StringOptions): CombinatorSchema<string> {
  const schema: CombinatorSchema<string> = {
    type: 'string',
    metavar: 'string',
    ...(opts?.description != null ? { description: opts.description } : {}),
    ...(opts?.hidden != null ? { hidden: opts.hidden } : {}),
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
  // `test` with a `g` or `y` pattern moves its `lastIndex`, so that `parse` has a side effect.
  // `parse` reads `opts.pattern` when it is called, so the brand is read from it at that time too
  Object.defineProperty(schema.parse, PURE_PARSE, {
    get: () => !opts?.pattern?.global && !opts?.pattern?.sticky
  })
  return schema
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
 * @typeParam R - The type of `required` in the options, which the schema keeps.
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
export function number<const R extends boolean>(
  opts: NumberOptions & { required: R }
): WithRequiredOption<CombinatorSchema<number>, R>

/**
 * Create a number argument schema with optional range validation.
 *
 * Accepts any numeric value (integer or float).
 *
 * @typeParam R - The type of `required` in the options, which the schema keeps when it may be
 *   `false` but not `true`, as for `optional ? { required: false } : {}`, so that a positional
 *   argument with it is optional.
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
export function number<const R extends boolean | undefined = boolean | undefined>(
  opts?: NumberOptions & { required?: R }
): WithUnrequiredOption<CombinatorSchema<number>, R>

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
export function number(opts?: NumberOptions): CombinatorSchema<number>
// @__NO_SIDE_EFFECTS__
export function number(opts?: NumberOptions): CombinatorSchema<number> {
  return pureParse({
    type: 'number',
    metavar: 'number',
    ...(opts?.description != null ? { description: opts.description } : {}),
    ...(opts?.hidden != null ? { hidden: opts.hidden } : {}),
    ...(opts?.short != null ? { short: opts.short } : {}),
    ...(opts?.required != null ? { required: opts.required } : {}),
    parse(value: string): number {
      const n = Number(value)
      if (value.trim() === '' || isNaN(n)) {
        throw createInvalidTypeError(`Expected a number, got '${value}'`, 'number', value)
      }
      if (opts?.min != null && n < opts.min) {
        throw new RangeError(`Number must be >= ${opts.min}, got ${n}`)
      }
      if (opts?.max != null && n > opts.max) {
        throw new RangeError(`Number must be <= ${opts.max}, got ${n}`)
      }
      return n
    }
  })
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
 * @typeParam R - The type of `required` in the options, which the schema keeps.
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
export function integer<const R extends boolean>(
  opts: IntegerOptions & { required: R }
): WithRequiredOption<CombinatorSchema<number>, R>

/**
 * Create an integer argument schema with optional range validation.
 *
 * Only accepts integer values (no decimals).
 *
 * @typeParam R - The type of `required` in the options, which the schema keeps when it may be
 *   `false` but not `true`, as for `optional ? { required: false } : {}`, so that a positional
 *   argument with it is optional.
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
export function integer<const R extends boolean | undefined = boolean | undefined>(
  opts?: IntegerOptions & { required?: R }
): WithUnrequiredOption<CombinatorSchema<number>, R>

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
export function integer(opts?: IntegerOptions): CombinatorSchema<number>
// @__NO_SIDE_EFFECTS__
export function integer(opts?: IntegerOptions): CombinatorSchema<number> {
  return pureParse({
    type: 'custom',
    metavar: 'integer',
    ...(opts?.description != null ? { description: opts.description } : {}),
    ...(opts?.hidden != null ? { hidden: opts.hidden } : {}),
    ...(opts?.short != null ? { short: opts.short } : {}),
    ...(opts?.required != null ? { required: opts.required } : {}),
    parse(value: string): number {
      if (!/^-?\d+$/.test(value)) {
        throw createInvalidTypeError(`Expected an integer, got '${value}'`, 'integer', value)
      }
      const n = Number.parseInt(value, 10)
      if (isNaN(n)) {
        throw createInvalidTypeError(`Expected an integer, got '${value}'`, 'integer', value)
      }
      if (opts?.min != null && n < opts.min) {
        throw new RangeError(`Integer must be >= ${opts.min}, got ${n}`)
      }
      if (opts?.max != null && n > opts.max) {
        throw new RangeError(`Integer must be <= ${opts.max}, got ${n}`)
      }
      return n
    }
  })
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
 * @typeParam R - The type of `required` in the options, which the schema keeps.
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
export function float<const R extends boolean>(
  opts: FloatOptions & { required: R }
): WithRequiredOption<CombinatorSchema<number>, R>

/**
 * Create a floating-point argument schema with optional range validation.
 *
 * Rejects `NaN` and `Infinity` values.
 *
 * @typeParam R - The type of `required` in the options, which the schema keeps when it may be
 *   `false` but not `true`, as for `optional ? { required: false } : {}`, so that a positional
 *   argument with it is optional.
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
export function float<const R extends boolean | undefined = boolean | undefined>(
  opts?: FloatOptions & { required?: R }
): WithUnrequiredOption<CombinatorSchema<number>, R>

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
export function float(opts?: FloatOptions): CombinatorSchema<number>
// @__NO_SIDE_EFFECTS__
export function float(opts?: FloatOptions): CombinatorSchema<number> {
  return pureParse({
    type: 'custom',
    metavar: 'float',
    ...(opts?.description != null ? { description: opts.description } : {}),
    ...(opts?.hidden != null ? { hidden: opts.hidden } : {}),
    ...(opts?.short != null ? { short: opts.short } : {}),
    ...(opts?.required != null ? { required: opts.required } : {}),
    parse(value: string): number {
      const trimmed = value.trim()
      if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(trimmed)) {
        throw createInvalidTypeError(`Expected a finite float, got '${value}'`, 'float', value)
      }
      const n = Number.parseFloat(trimmed)
      if (isNaN(n) || !isFinite(n)) {
        throw createInvalidTypeError(`Expected a finite float, got '${value}'`, 'float', value)
      }
      if (opts?.min != null && n < opts.min) {
        throw new RangeError(`Float must be >= ${opts.min}, got ${n}`)
      }
      if (opts?.max != null && n > opts.max) {
        throw new RangeError(`Float must be <= ${opts.max}, got ${n}`)
      }
      return n
    }
  })
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
 * to the parse function based on the presence or negation of the flag, or on an explicit
 * `=true` / `=false` value. Other inline values are rejected before the parse function is called.
 *
 * @typeParam R - The type of `required` in the options, which the schema keeps.
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
export function boolean<const R extends boolean>(
  opts: BooleanOptions & { required: R }
): WithRequiredOption<CombinatorSchema<boolean>, R>

/**
 * Create a boolean argument schema.
 *
 * Boolean arguments are existence-based. The resolver passes `"true"` or `"false"`
 * to the parse function based on the presence or negation of the flag, or on an explicit
 * `=true` / `=false` value. Other inline values are rejected before the parse function is called.
 *
 * @typeParam R - The type of `required` in the options, which the schema keeps when it may be
 *   `false` but not `true`, as for `optional ? { required: false } : {}`, so that a positional
 *   argument with it is optional.
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
export function boolean<const R extends boolean | undefined = boolean | undefined>(
  opts?: BooleanOptions & { required?: R }
): WithUnrequiredOption<CombinatorSchema<boolean>, R>

/**
 * Create a boolean argument schema.
 *
 * Boolean arguments are existence-based. The resolver passes `"true"` or `"false"`
 * to the parse function based on the presence or negation of the flag, or on an explicit
 * `=true` / `=false` value. Other inline values are rejected before the parse function is called.
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
export function boolean(opts?: BooleanOptions): CombinatorSchema<boolean>
// @__NO_SIDE_EFFECTS__
export function boolean(opts?: BooleanOptions): CombinatorSchema<boolean> {
  return {
    type: 'boolean',
    ...(opts?.negatable != null ? { negatable: opts.negatable } : {}),
    metavar: 'boolean',
    ...(opts?.description != null ? { description: opts.description } : {}),
    ...(opts?.hidden != null ? { hidden: opts.hidden } : {}),
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
 * The properties of a parser that {@link positional} keeps.
 */
type PositionalParserKey =
  | 'parse'
  | 'metavar'
  | 'description'
  | 'hidden'
  | 'required'
  | 'default'
  | 'multiple'

/**
 * The positional argument schema that {@link positional} builds from a parser: the properties it
 * keeps, with their types, as `type: 'positional'`. A parser of type `any` is read as
 * {@link UntypedCombinatorSchema}.
 *
 * As in {@link WithFlag}, it maps the properties of the parser itself, and reads `any` in a part of
 * its own, so that TypeScript still sees them for a parser typed by a type parameter.
 */
type PositionalWithParser<S> = {
  [K in keyof S as K extends PositionalParserKey ? K : never]: S[K]
} & ArgSchemaPositionalType &
  (0 extends 1 & S ? Pick<UntypedCombinatorSchema, PositionalParserKey> : unknown)

/**
 * The positional argument schema that {@link positional} returns for a parser `S`:
 * {@link PositionalWithParser} for each schema of a union. For a parser typed by a type parameter,
 * TypeScript keeps this type unresolved, and relates it as {@link PositionalWithParser} of the
 * constraint of the type parameter, as for {@link Modified}.
 */
type PositionalOf<S> = S extends unknown ? PositionalWithParser<S> : never

/**
 * Create a positional argument schema.
 *
 * Without a parser, resolves to string.
 * With a parser (e.g., `positional(integer())`), resolves to the parser's return type.
 *
 * The positional argument keeps `required`, `default` and `multiple` of the parser, with their
 * types: `positional(unrequired(integer()))` is optional, and `positional(multiple(integer()))`
 * resolves to an array, as `multiple(positional(integer()))` does.
 *
 * @typeParam T - The parser's resolved type.
 * @typeParam S - The type of the parser, inferred from `parser`, whose `required`, `default`,
 *   `multiple`, `description`, `hidden` and `metavar` the positional argument keeps. If type
 *   arguments are given explicitly without `S`, `S` is `CombinatorSchema<T>`, and the type of the
 *   result lacks them, although the returned object has them.
 *
 * @param parser - The parser combinator schema.
 * @returns A positional argument schema resolving to the parser's type.
 *
 * @example
 * ```ts
 * const args = {
 *   command: positional(),           // resolves to string
 *   port: positional(integer()),     // resolves to number
 *   query: unrequired(positional())  // optional positional
 * }
 * ```
 *
 * @experimental
 */
export function positional<T, S extends CombinatorSchema<T> = CombinatorSchema<T>>(
  parser: S & CombinatorSchema<T>
): PositionalOf<S>

/**
 * Create a positional argument schema.
 *
 * Without a parser, resolves to string.
 * With a parser (e.g., `positional(integer())`), resolves to the parser's return type.
 *
 * Without a parser, the schema has a `parse` function that returns the value as is, so that the
 * modifiers, such as {@link multiple} and {@link withDefault}, take it: `multiple(positional())`
 * collects the values as strings.
 *
 * With `required: false` in the options, the positional argument is optional, in its type too. A
 * `required` of type `boolean`, which may be `false`, types it as optional as well.
 *
 * @typeParam R - The type of `required` in the options, which the positional argument keeps.
 *
 * @param parser - Base options (description, short, required).
 * @returns A positional argument schema resolving to string.
 *
 * @example
 * ```ts
 * const args = {
 *   command: positional(),           // resolves to string
 *   port: positional(integer()),     // resolves to number
 *   query: unrequired(positional())  // optional positional
 * }
 * ```
 *
 * @experimental
 */
export function positional<const R extends boolean>(
  parser: BaseOptions & { required: R }
): WithRequiredOption<Omit<CombinatorSchema<string>, 'type'> & ArgSchemaPositionalType, R>

/**
 * Create a positional argument schema.
 *
 * Without a parser, resolves to string.
 * With a parser (e.g., `positional(integer())`), resolves to the parser's return type.
 *
 * Without a parser, the schema has a `parse` function that returns the value as is, so that the
 * modifiers, such as {@link multiple} and {@link withDefault}, take it: `multiple(positional())`
 * collects the values as strings.
 *
 * With a `required: false` that the options have only in some cases, with no `required` in the
 * others, such as `optional ? { required: false } : {}`, the positional argument is optional, in
 * its type too.
 *
 * @typeParam R - The type of `required` in the options, which the positional argument keeps when it
 *   may be `false` but not `true`, as for `optional ? { required: false } : {}`.
 *
 * @param parser - Optional base options (description, short, required).
 * @returns A positional argument schema resolving to string.
 *
 * @example
 * ```ts
 * const args = {
 *   command: positional(),           // resolves to string
 *   port: positional(integer()),     // resolves to number
 *   query: unrequired(positional())  // optional positional
 * }
 * ```
 *
 * @experimental
 */
export function positional<const R extends boolean | undefined = boolean | undefined>(
  parser?: BaseOptions & { required?: R }
): WithUnrequiredOption<Omit<CombinatorSchema<string>, 'type'> & ArgSchemaPositionalType, R>

/**
 * Create a positional argument schema.
 *
 * Without a parser, resolves to string.
 * With a parser (e.g., `positional(integer())`), resolves to the parser's return type.
 *
 * Without a parser, the schema has a `parse` function that returns the value as is, so that the
 * modifiers, such as {@link multiple} and {@link withDefault}, take it: `multiple(positional())`
 * collects the values as strings.
 *
 * @param parser - Optional base options (description, short, required).
 * @returns A positional argument schema resolving to string.
 *
 * @example
 * ```ts
 * const args = {
 *   command: positional(),           // resolves to string
 *   port: positional(integer()),     // resolves to number
 *   query: unrequired(positional())  // optional positional
 * }
 * ```
 *
 * @experimental
 */
export function positional(
  parser?: BaseOptions
): Omit<CombinatorSchema<string>, 'type'> & ArgSchemaPositionalType
// @__NO_SIDE_EFFECTS__
export function positional<T>(
  parser?: CombinatorSchema<T> | BaseOptions
): ArgSchema & ArgSchemaPositionalType {
  if (parser && 'parse' in parser) {
    return {
      type: 'positional',
      parse: parser.parse,
      metavar: parser.metavar,
      ...(parser.description != null ? { description: parser.description } : {}),
      ...(parser.hidden != null ? { hidden: parser.hidden } : {}),
      ...(parser.required != null ? { required: parser.required } : {}),
      ...(parser.default != null ? { default: parser.default } : {}),
      ...(parser.multiple != null ? { multiple: parser.multiple } : {})
    }
  }
  const opts = parser
  const schema: CombinatorSchema<string> & ArgSchemaPositionalType = {
    type: 'positional',
    ...(opts?.description != null ? { description: opts.description } : {}),
    ...(opts?.hidden != null ? { hidden: opts.hidden } : {}),
    ...(opts?.short != null ? { short: opts.short } : {}),
    ...(opts?.required != null ? { required: opts.required } : {}),
    parse(value: string): string {
      return value
    }
  }
  return pureParse(schema)
}

/**
 * Create an enum-like argument schema with literal type inference.
 *
 * Uses `const T` generic to infer literal union types from the values array.
 *
 * @typeParam T - The readonly array of allowed string values.
 * @typeParam R - The type of `required` in the options, which the schema keeps.
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
export function choice<const T extends readonly string[], const R extends boolean>(
  values: T,
  opts: BaseOptions & { required: R }
): WithRequiredOption<CombinatorSchema<T[number]>, R>

/**
 * Create an enum-like argument schema with literal type inference.
 *
 * Uses `const T` generic to infer literal union types from the values array.
 *
 * @typeParam T - The readonly array of allowed string values.
 * @typeParam R - The type of `required` in the options, which the schema keeps when it may be
 *   `false` but not `true`, as for `optional ? { required: false } : {}`, so that a positional
 *   argument with it is optional.
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
export function choice<
  const T extends readonly string[],
  const R extends boolean | undefined = boolean | undefined
>(
  values: T,
  opts?: BaseOptions & { required?: R }
): WithUnrequiredOption<CombinatorSchema<T[number]>, R>

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
): CombinatorSchema<T[number]>
// @__NO_SIDE_EFFECTS__
export function choice<const T extends readonly string[]>(
  values: T,
  opts?: BaseOptions
): CombinatorSchema<T[number]> {
  return pureParse({
    type: 'enum',
    metavar: values.join('|'),
    choices: values,
    ...(opts?.description != null ? { description: opts.description } : {}),
    ...(opts?.hidden != null ? { hidden: opts.hidden } : {}),
    ...(opts?.short != null ? { short: opts.short } : {}),
    ...(opts?.required != null ? { required: opts.required } : {}),
    parse(value: string): T[number] {
      if (!(values as readonly string[]).includes(value)) {
        throw createInvalidChoiceError(`Value must be one of: ${values.join(', ')}`, values, value)
      }
      return value
    }
  })
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
   * It is called synchronously, as {@link ArgSchema}.parse is: a promise that it returns becomes
   * the value as is, and its rejection is not reported as an error.
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
 * @typeParam R - The type of `required` in the configuration, which the schema keeps.
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
export function combinator<T, const R extends boolean>(
  config: CombinatorOptions<T> & { required: R }
): WithRequiredOption<CombinatorSchema<T>, R>

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
 * @typeParam R - The type of `required` in the configuration, which the schema keeps when it may be
 *   `false` but not `true`, as for `optional ? { required: false } : {}`, so that a positional
 *   argument with it is optional.
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
export function combinator<T, const R extends boolean | undefined = boolean | undefined>(
  config: CombinatorOptions<T> & { required?: R }
): WithUnrequiredOption<CombinatorSchema<T>, R>

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
export function combinator<T>(config: CombinatorOptions<T>): CombinatorSchema<T>
// @__NO_SIDE_EFFECTS__
export function combinator<T>(config: CombinatorOptions<T>): CombinatorSchema<T> {
  return {
    type: 'custom',
    metavar: config.metavar ?? 'custom',
    ...(config.description != null ? { description: config.description } : {}),
    ...(config.hidden != null ? { hidden: config.hidden } : {}),
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
 * Other modifiers on `schema` (for example {@link multiple}) are kept, and `transform` is applied
 * to each value of a `multiple` schema.
 *
 * A default set on `schema` is kept, but it does not go through `transform`: when it is used, the
 * value is the default as is, although it is typed as `U`. Set the default after `map()`, with a
 * transformed value.
 *
 * A union of schemas of different types, such as `strict ? integer() : string()`, matches the
 * last overload, whose `transform` takes a value of any of their types.
 *
 * @typeParam T - The input schema's parsed type.
 * @typeParam U - The transformed type.
 * @typeParam S - The input combinator schema, inferred from `schema`. Its other modifiers are kept.
 *   If type arguments are given explicitly without `S`, `S` is `CombinatorSchema<T>`, and the type
 *   of the result lacks the other modifiers, although the returned object has them.
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
export function map<T, U, S extends CombinatorSchema<T> = CombinatorSchema<T>>(
  schema: S & CombinatorSchema<T>,
  transform: (value: T) => U
): Modified<S, Combinator<U>>

/**
 * Transform the output of a combinator schema, as the first overload does, for a schema that fits
 * the first overload but that TypeScript does not match with it at first, such as
 * `positional(integer())`, a class instance or a schema typed by an interface. This overload keeps
 * such a schema from matching the overload for a union of schemas of different types.
 *
 * Creates a new schema that applies `transform` to the result of `schema.parse`.
 * The original schema is not modified.
 * Other modifiers on `schema` (for example {@link multiple}) are kept, and `transform` is applied
 * to each value of a `multiple` schema.
 *
 * A default set on `schema` is kept, but it does not go through `transform`: when it is used, the
 * value is the default as is, although it is typed as `U`. Set the default after `map()`, with a
 * transformed value.
 *
 * @typeParam T - The input schema's parsed type.
 * @typeParam U - The transformed type.
 * @typeParam S - The input combinator schema, inferred from `schema`. Its other modifiers are kept.
 *
 * @param schema - The base combinator schema.
 * @param transform - The transformation function.
 * @returns A new combinator schema that resolves to the transformed type.
 *
 * @example
 * ```ts
 * const args = {
 *   doubled: map(positional(integer()), n => n * 2)
 * }
 * ```
 *
 * @experimental
 */
export function map<T, U, S extends CombinatorSchema<T> = CombinatorSchema<T>>(
  schema: S & Combinator<T>,
  transform: (value: T) => U
): Modified<S, Combinator<U>>

/**
 * Transform the output of a union of combinator schemas of different types, such as
 * `strict ? integer() : string()`.
 *
 * Creates a new schema that applies `transform` to the result of `schema.parse`, which is a value
 * of any of their types: a number or a string for `strict ? integer() : string()`.
 * The original schema is not modified.
 * Other modifiers on `schema` (for example {@link multiple}) are kept, and `transform` is applied
 * to each value of a `multiple` schema.
 *
 * A default set on `schema` is kept, but it does not go through `transform`: when it is used, the
 * value is the default as is, although it is typed as `U`. Set the default after `map()`, with a
 * transformed value.
 *
 * @typeParam S - The input combinator schema, inferred from `schema`: a union of schemas of
 *   different types. Its other modifiers are kept.
 * @typeParam U - The transformed type.
 *
 * @param schema - The base combinator schema.
 * @param transform - The transformation function, which takes a value of any of the types that the
 *   schemas of the union parse to.
 * @returns A new combinator schema that resolves to the transformed type.
 *
 * @example
 * ```ts
 * const strict = process.argv.includes('--strict')
 * const args = {
 *   // `value` is a number or a string
 *   timeout: map(strict ? integer({ min: 0 }) : string(), value => String(value))
 * }
 * ```
 *
 * @experimental
 */
export function map<S extends CombinatorSchema<unknown>, U>(
  schema: S,
  transform: (value: ParsedType<S>) => U
): Modified<S, Combinator<U>>
// @__NO_SIDE_EFFECTS__
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
 * The original schema is not modified. The default must be a value of the schema's parsed type:
 * `T` is inferred from `schema` only, so `withDefault(choice(['auto', 'always']), 'awlays')` is a
 * type error instead of adding `'awlays'` to the type. The schema must parse to a string, number or
 * boolean, since the default can only be one of them and does not go through `parse`: a schema that
 * parses to another type, such as a `Date`, or whose `parse` can return `null` or `undefined`,
 * cannot have a default, and giving it one is a type error.
 * Other modifiers on `schema` (for example {@link multiple}) are kept. The default of a `multiple`
 * schema is one value of the parsed type, which becomes the only element of the array.
 *
 * A union of schemas of different types, such as `strict ? integer() : string()`, matches the
 * last overload, whose default may be a value of any of their types.
 *
 * @typeParam T - The schema's parsed type.
 * @typeParam D - The type of the default value, which must be assignable to `T`.
 * @typeParam S - The input combinator schema, inferred from `schema`. Its other modifiers are kept.
 *   If type arguments are given explicitly without `S`, `S` is `CombinatorSchema<T>`, and the type
 *   of the result lacks the other modifiers, although the returned object has them.
 *
 * @param schema - The base combinator schema.
 * @param defaultValue - The default value, a value of the schema's parsed type.
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
export function withDefault<
  T extends string | boolean | number,
  D extends T = T,
  S extends CombinatorSchema<T> = CombinatorSchema<T>
>(schema: S & CombinatorSchema<T>, defaultValue: D): Modified<S, CombinatorWithDefault<T>>

/**
 * Set a default value on a combinator schema, as the first overload does, for a schema that fits
 * the first overload but that TypeScript does not match with it at first, such as
 * `positional(integer())`, a class instance or a schema typed by an interface. This overload keeps
 * such a schema from matching the overload for a union of schemas of different types.
 *
 * The original schema is not modified. The default must be a value of the schema's parsed type. The
 * schema must parse to a string, number or boolean, since the default can only be one of them and
 * does not go through `parse`.
 * Other modifiers on `schema` (for example {@link multiple}) are kept. The default of a `multiple`
 * schema is one value of the parsed type, which becomes the only element of the array.
 *
 * @typeParam T - The schema's parsed type.
 * @typeParam D - The type of the default value, which must be assignable to `T`.
 * @typeParam S - The input combinator schema, inferred from `schema`. Its other modifiers are kept.
 *
 * @param schema - The base combinator schema.
 * @param defaultValue - The default value, a value of the schema's parsed type.
 * @returns A new schema with the default value set.
 *
 * @example
 * ```ts
 * const args = {
 *   port: withDefault(positional(integer()), 8080)
 * }
 * ```
 *
 * @experimental
 */
export function withDefault<
  T extends string | boolean | number,
  D extends T = T,
  S extends CombinatorSchema<T> = CombinatorSchema<T>
>(schema: S & Combinator<T>, defaultValue: D): Modified<S, CombinatorWithDefault<T>>

/**
 * Set a default value on a union of combinator schemas of different types, such as
 * `strict ? integer() : string()`.
 *
 * The original schema is not modified. The default must be a value of one of the types that the
 * schemas of the union parse to: a number or a string for `strict ? integer() : string()`. They
 * must parse to a string, number or boolean, since the default can only be one of them and does
 * not go through `parse`. A schema typed as `any` matches the first overload instead.
 * Other modifiers on `schema` (for example {@link multiple}) are kept. The default of a `multiple`
 * schema is one value, which becomes the only element of the array.
 * Since the default is used for whichever schema of the union is in use, the `parse` of each schema
 * is typed as returning a value of any of the types that the schemas parse to:
 * `withDefault(strict ? multiple(integer()) : string(), 'none')` resolves to
 * `(number | string)[] | number | string`.
 *
 * @typeParam S - The input combinator schema, inferred from `schema`: a union of schemas of
 *   different types. Its other modifiers are kept.
 *
 * @param schema - The base combinator schema.
 * @param defaultValue - The default value, a value of one of the types that the schemas of the
 *   union parse to.
 * @returns A new schema with the default value set.
 *
 * @example
 * ```ts
 * const strict = process.argv.includes('--strict')
 * const args = {
 *   timeout: withDefault(strict ? integer({ min: 0 }) : string(), 'none')
 * }
 * // typeof values.timeout === number | string
 * ```
 *
 * @experimental
 */
export function withDefault<S extends CombinatorSchema<string | boolean | number>>(
  schema: S,
  defaultValue: unknown extends ParsedType<S> ? never : ParsedType<S>
): Modified<S, CombinatorWithDefault<ParsedType<S>> & Combinator<ParsedType<S>>>
// @__NO_SIDE_EFFECTS__
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
 * Overlay the properties of `F` onto a combinator schema without dropping its other properties.
 *
 * Drops the keys of `F` from `S` first, so that what `F` sets replaces what `S` has, instead of
 * making an intersection with it (`'A' & 'B'`, that is `never`, for a description set twice).
 * The properties of `S` stay visible when `S` is a type parameter, also through other modifiers,
 * and each schema of a union gets `F` on its own.
 * A schema typed as `any`, such as one from untyped code, is taken as
 * {@link UntypedCombinatorSchema}, so that the result is still an argument schema, and still fits
 * any {@link CombinatorSchema}, unless `F` sets `parse`, as {@link map} does.
 */
type WithFlag<S, F> = Without<S, keyof F> & F & UntypedFlag<S, F>

/**
 * The schema that {@link short}, {@link describe}, {@link required}, {@link multiple}, {@link map}
 * and {@link withDefault} return: {@link WithFlag} for each schema of a union.
 *
 * For a schema typed by a type parameter, TypeScript keeps this type unresolved, and relates it as
 * {@link WithFlag} of the constraint of the type parameter, for each schema of a union constraint:
 * the result fits where the modifier on the constraint fits. {@link WithFlag} alone copies each
 * property `P` of the type parameter as `S[P]`, which TypeScript reads through the constraint:
 * `S['description']` as `string | undefined`, which `description?: string` does not take with
 * `exactOptionalPropertyTypes`, and, for a union constraint, `S['parse']` as the union of the
 * `parse` of its schemas, which fits none of them.
 *
 * A property read on this type is typed by the constraint as well: for a schema typed by a type
 * parameter `S`, `short(schema, 'x').parse` is the `parse` of the constraint, while `schema.parse`
 * keeps the type `S['parse']`.
 */
type Modified<S, F> = S extends unknown ? WithFlag<S, F> : never

/**
 * The properties of `S` without the keys `K` and without index signatures: the same properties as
 * `Omit<S, K>` for a combinator schema that is not a union, and `{}` for `any`.
 *
 * It maps the properties of `S` itself, so that TypeScript still sees them when `S` is a type
 * parameter with other modifiers on it, and it maps each schema of a union on its own.
 * For a type parameter, TypeScript does not take it for `Omit<S, K>`, so {@link hidden} and
 * {@link unrequired}, whose results were typed `Omit<S, K>` with their flag, return that type too.
 */
type Without<S, K> = { [P in keyof S as P extends K ? never : NamedKey<P>]: S[P] }

/**
 * `K` for a property name, and `never` for the `string`, `number` or `symbol` key of an index
 * signature, such as those of `any`.
 */
type NamedKey<K> = string extends K
  ? never
  : number extends K
    ? never
    : symbol extends K
      ? never
      : K

/**
 * {@link UntypedCombinatorSchema} without the keys of `F` for a schema typed as `any`, and
 * `unknown`, which adds nothing, for any other schema. For a schema typed by a type parameter,
 * TypeScript leaves it unresolved, and the properties come from {@link Without}.
 */
type UntypedFlag<S, F> = 0 extends 1 & S ? Omit<UntypedCombinatorSchema, keyof F> : unknown

/**
 * Options for the {@link multiple} combinator.
 */
type CombinatorMultiple = { multiple: true }

/**
 * Mark a combinator schema as accepting multiple values.
 *
 * The resolved value becomes an array. The original schema is not modified.
 * Other modifiers on `schema` (for example {@link required}) are kept.
 *
 * @typeParam S - The input combinator schema.
 * @param schema - The base combinator schema.
 * @returns A copy of `schema` with `multiple: true`.
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
export function multiple<S extends CombinatorSchema<unknown>>(
  schema: S
): Modified<S, CombinatorMultiple>
// @__NO_SIDE_EFFECTS__
export function multiple(
  schema: CombinatorSchema<unknown>
): CombinatorSchema<unknown> & CombinatorMultiple {
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
 * Other modifiers on `schema` (for example {@link multiple}) are kept.
 *
 * @typeParam S - The input combinator schema.
 *
 * @param schema - The base combinator schema.
 * @returns A copy of `schema` with `required: true`.
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
export function required<S extends CombinatorSchema<unknown>>(
  schema: S
): Modified<S, CombinatorRequired>
// @__NO_SIDE_EFFECTS__
export function required(
  schema: CombinatorSchema<unknown>
): CombinatorSchema<unknown> & CombinatorRequired {
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
 * Other modifiers on `schema` (for example {@link multiple}) are kept.
 *
 * @typeParam T - The schema's parsed type, when type arguments are given explicitly. It is not
 *   inferred, so that `schema` can be a union of schemas of different types.
 * @typeParam A - The short alias string literal type.
 * @typeParam S - The input combinator schema, inferred from `schema`. Its other modifiers are kept.
 *   If type arguments are given explicitly without `S`, `S` is `CombinatorSchema<T>`, and the type
 *   of the result lacks the other modifiers, although the returned object has them.
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
export function short<T, A extends string, S extends CombinatorSchema<T> = CombinatorSchema<T>>(
  schema: S,
  alias: A
): Modified<S, CombinatorShort<A>>
// @__NO_SIDE_EFFECTS__
export function short(
  schema: CombinatorSchema<unknown>,
  alias: string
): CombinatorSchema<unknown> & CombinatorShort<string> {
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
 * Other modifiers on `schema` (for example {@link required}) are kept.
 *
 * @typeParam T - The schema's parsed type, when type arguments are given explicitly. It is not
 *   inferred, so that `schema` can be a union of schemas of different types.
 * @typeParam D - The description string literal type.
 * @typeParam S - The input combinator schema, inferred from `schema`. Its other modifiers are kept.
 *   If type arguments are given explicitly without `S`, `S` is `CombinatorSchema<T>`, and the type
 *   of the result lacks the other modifiers, although the returned object has them.
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
export function describe<T, D extends string, S extends CombinatorSchema<T> = CombinatorSchema<T>>(
  schema: S,
  text: D
): Modified<S, CombinatorDescribe<D>>
// @__NO_SIDE_EFFECTS__
export function describe(
  schema: CombinatorSchema<unknown>,
  text: string
): CombinatorSchema<unknown> & CombinatorDescribe<string> {
  return {
    ...schema,
    description: text
  }
}

/**
 * Options for the {@link hidden} combinator.
 */
type CombinatorHidden = { hidden: true }

/**
 * Hide a combinator schema from generated help or usage output.
 *
 * The original schema is not modified. This only marks renderer metadata and
 * does not change parsing, validation, defaults, conflicts, or resolved values.
 * For a union of schemas, such as `strict ? integer() : string()`, each schema gets `hidden: true`.
 *
 * @typeParam T - The schema type.
 *
 * @param schema - The base combinator schema.
 * @returns A new schema with `hidden: true`.
 *
 * @example
 * ```ts
 * const args = {
 *   legacy: hidden(string())
 * }
 * ```
 *
 * @experimental
 */
export function hidden<T extends ArgSchema>(
  schema: T
): T extends unknown ? WithFlag<T, CombinatorHidden> & Omit<T, 'hidden'> : never
// @__NO_SIDE_EFFECTS__
export function hidden(schema: ArgSchema): ArgSchema & CombinatorHidden {
  return {
    ...schema,
    hidden: true
  }
}

/**
 * Options for the {@link unrequired} combinator.
 */
type CombinatorUnrequired = { required: false }

/**
 * Mark a combinator schema as not required.
 *
 * Useful for overriding a base combinator that was created with `required: true`,
 * or for making a positional argument explicitly optional.
 * The original schema is not modified.
 * For a union of schemas, such as `strict ? integer() : string()`, each schema gets
 * `required: false`.
 *
 * @typeParam T - The schema type.
 *
 * @param schema - The base combinator schema.
 * @returns A new schema with `required: false`.
 *
 * @example
 * ```ts
 * const args = {
 *   name: unrequired(string({ required: true })),
 *   query: unrequired(positional())
 * }
 * ```
 *
 * @experimental
 */
export function unrequired<T extends ArgSchema>(
  schema: T
): T extends unknown ? WithFlag<T, CombinatorUnrequired> & Omit<T, 'required'> : never
// @__NO_SIDE_EFFECTS__
export function unrequired(schema: ArgSchema): ArgSchema & CombinatorUnrequired {
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
// @__NO_SIDE_EFFECTS__
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
// @__NO_SIDE_EFFECTS__
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
// @__NO_SIDE_EFFECTS__
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
