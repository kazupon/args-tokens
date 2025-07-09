/**
 * @author kazuya kawaguchi (a.k.a. kazupon)
 * @license MIT
 */

import { parseArgs } from './parser.ts'
import { resolveArgs } from './resolver.ts'

import type { ArgToken, ParserOptions } from './parser.ts'
import type { ArgExplicitlyProvided, Args, ArgValues, ResolveArgs } from './resolver.ts'

/**
 * Parse options for {@link parse} function.
 */
export interface ParseOptions<A extends Args> extends ParserOptions, ResolveArgs {
  /**
   * Command line arguments, about details see {@link Args}.
   */
  args?: A
}

/**
 * Parsed command line arguments.
 */
export type ParsedArgs<A extends Args> = {
  /**
   * Parsed values, same as `values` in {@link resolveArgs}.
   */
  values: ArgValues<A>
  /**
   * Positional arguments, same as `positionals` in {@link resolveArgs}.
   */
  positionals: string[]
  /**
   * Rest arguments, same as `rest` in {@link resolveArgs}.
   */
  rest: string[]
  /**
   * Validation errors, same as `errors` in {@link resolveArgs}.
   */
  error: AggregateError | undefined
  /**
   * Argument tokens, same as `tokens` which is parsed by {@link parseArgs}.
   */
  tokens: ArgToken[]
  /**
   * Explicit provision status, same as `explicit` in {@link resolveArgs}.
   * Indicates which arguments were explicitly provided vs using default values.
   */
  explicit: ArgExplicitlyProvided<A>
}

const DEFAULT_OPTIONS = {
  help: {
    type: 'boolean',
    short: 'h'
  },
  version: {
    type: 'boolean',
    short: 'v'
  }
} as const satisfies Args

/**
 * Parse command line arguments.
 * This function is a convenient API, that is used {@link parseArgs} and {@link resolveArgs} in internal.
 * @example
 * ```js
 * import { parse } from 'args-tokens'
 *
 * const { values, positionals } = parse(process.argv.slice(2))
 * console.log('values', values)
 * console.log('positionals', positionals)
 * ```
 * @param args - command line arguments
 * @param options - parse options, about details see {@link ParseOptions}
 * @returns An object that contains the values of the arguments, positional arguments, {@link AggregateError | validation errors}, and {@link ArgToken | argument tokens}.
 */
export function parse<A extends Args>(
  args: string[],
  options: ParseOptions<A> = {}
): ParsedArgs<A> {
  const { args: _args, allowCompatible = false } = options
  const tokens = parseArgs(args, { allowCompatible })
  return Object.assign(
    Object.create(null),
    resolveArgs<A>((_args as A) || DEFAULT_OPTIONS, tokens),
    { tokens }
  )
}
