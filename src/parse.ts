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
 *
 * The options of {@link parseArgs} and {@link resolveArgs} work as they do there:
 * `parse(argv, { args, allowCompatible, shortGrouping })` gives the `tokens` of
 * `parseArgs(argv, { allowCompatible })` and what `resolveArgs(args, tokens, { shortGrouping })`
 * gives with them.
 *
 * @typeParam A - {@link Args | Arguments schema}, which is an object that defines the command line arguments.
 */
export interface ParseOptions<A extends Args> extends ParserOptions, ResolveArgs {
  /**
   * {@link Args | Arguments schema}, which defines the command line arguments.
   *
   * Without it, {@link parse} uses a schema with the `boolean` options `help` (`-h`) and `version`
   * (`-v`).
   */
  args?: A
}

/**
 * Parsed command line arguments.
 *
 * @typeParam A - {@link Args | Arguments schema}, which is an object that defines the command line arguments.
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
   * Validation errors, same as `error` in {@link resolveArgs}.
   */
  error: AggregateError | undefined
  /**
   * Argument tokens, same as `tokens` which is parsed by {@link parseArgs}.
   */
  tokens: ArgToken[]
  /**
   * Explicit provision status, same as `explicit` in {@link resolveArgs}.
   *
   * Indicates which arguments were given on the command line, even if their values are missing or
   * rejected. See {@link ArgExplicitlyProvided}.
   */
  explicit: ArgExplicitlyProvided<A>
  /**
   * The indexes of the arguments that the schema does not take, same as `passthroughIndices` in
   * {@link resolveArgs}. An empty array without the `passthrough` option.
   */
  passthroughIndices: number[]
  /**
   * The arguments that the schema does not take, as they were given and in their order, with the
   * `passthrough` option: the arguments at `passthroughIndices`. An empty array without it. See
   * {@link ResolveArgs.passthrough} for which arguments they are.
   */
  passthrough: string[]
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
 *
 * This function is a convenient API, that is used {@link parseArgs} and {@link resolveArgs} in internal.
 *
 * @typeParam A - {@link Args | Arguments schema}, which is an object that defines the command line arguments.
 *
 * @param args - command line arguments
 * @param options - parse options, about details see {@link ParseOptions}
 * @returns An object that contains the values of the arguments, positional arguments, rest arguments, {@link AggregateError | validation errors}, explicit provision status, {@link ArgToken | argument tokens}, and the arguments that the schema does not take and their indexes, with {@link ResolveArgs.passthrough | passthrough}.
 *
 * @example
 * ```js
 * import { parse } from 'args-tokens'
 *
 * const { values, positionals } = parse(process.argv.slice(2))
 * console.log('values', values)
 * console.log('positionals', positionals)
 * ```
 */
export function parse<A extends Args>(
  args: string[],
  options: ParseOptions<A> = {}
): ParsedArgs<A> {
  const { args: _args, allowCompatible = false } = options
  // with `passthrough`, the indexes are read in the arguments as they are tokenized, even if a
  // `parse` function changes the array
  const given = options.passthrough ? [...args] : args
  const tokens = parseArgs(given, { allowCompatible })
  // the options of `resolveArgs()`, such as `shortGrouping`, are in `options` too
  const resolved = resolveArgs<A>((_args as A) || DEFAULT_OPTIONS, tokens, options)
  const indices = resolved.passthroughIndices
  const passthrough: string[] = []
  for (let i = 0; i < indices.length; i++) {
    passthrough.push(given[indices[i]])
  }
  return Object.assign(Object.create(null), resolved, { tokens, passthrough }) as ParsedArgs<A>
}
