/**
 * @author kazuya kawaguchi (a.k.a. kazupon)
 * @license MIT
 */

import { parseArgs } from './parser.ts'
import { resolveArgs } from './resolver.ts'

import type { ArgToken, ParserOptions } from './parser.ts'
import type { ArgOptions, ArgValues, ResolveArgsOptions } from './resolver.ts'

/**
 * Parse options for {@link parse} function.
 */
export interface ParseOptions<O extends ArgOptions> extends ParserOptions, ResolveArgsOptions {
  /**
   * Command line options, about details see {@link ArgOptions}.
   */
  options?: O
}

/**
 * Parsed command line arguments.
 */
export type ParsedArgs<T extends ArgOptions> = {
  /**
   * Parsed values, same as `values` in {@link resolveArgs}.
   */
  values: ArgValues<T>
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
} as const satisfies ArgOptions

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
export function parse<O extends ArgOptions>(
  args: string[],
  options: ParseOptions<O> = {}
): ParsedArgs<O> {
  const { options: argOptions, allowCompatible = false } = options
  const tokens = parseArgs(args, { allowCompatible })
  return Object.assign(
    Object.create(null),
    resolveArgs<O>((argOptions as O) || DEFAULT_OPTIONS, tokens),
    { tokens }
  )
}
