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
 * @returns An object that contains the values of the arguments, positional arguments, rest arguments, {@link AggregateError | validation errors}, explicit provision status, and {@link ArgToken | argument tokens}.
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
  options?: ParseOptions<A> & { passthrough?: false }
): ParsedArgs<A>
/**
 * Parse command line arguments, and give the arguments that the schema does not take, with
 * {@link ResolveArgs.passthrough | passthrough}.
 *
 * @typeParam A - {@link Args | Arguments schema}, which is an object that defines the command line arguments.
 *
 * @param args - command line arguments
 * @param options - parse options with `passthrough: true`, about details see {@link ParseOptions}
 * @returns An object that contains the values of the arguments, positional arguments, rest arguments, {@link AggregateError | validation errors}, explicit provision status, {@link ArgToken | argument tokens}, and the arguments that the schema does not take and their indexes.
 *
 * @example
 * ```js
 * import { spawnSync } from 'node:child_process'
 * import { parse } from 'args-tokens'
 *
 * // mytool test --reporter=dot src
 * const { passthrough } = parse(process.argv.slice(2), {
 *   args: { command: { type: 'positional' } },
 *   passthrough: true
 * })
 * // passthrough: ['--reporter=dot', 'src']
 * spawnSync('vitest', ['run', ...passthrough])
 * ```
 */
export function parse<A extends Args>(
  args: string[],
  options: ParseOptions<A> & { passthrough: true }
): ParsedArgs<A> & {
  /**
   * The indexes of the arguments that the schema does not take, same as `passthroughIndices` in
   * {@link resolveArgs}, without the indexes past the last argument. See
   * {@link ResolveArgs.passthrough} for when there are such indexes.
   */
  passthroughIndices: number[]
  /**
   * The arguments that the schema does not take, as they were given and in their order: the
   * arguments at `passthroughIndices`. See {@link ResolveArgs.passthrough} for which arguments they
   * are.
   */
  passthrough: string[]
}
/**
 * Parse command line arguments, with `passthrough` that may be `true` or not, such as a `boolean`.
 *
 * @typeParam A - {@link Args | Arguments schema}, which is an object that defines the command line arguments.
 *
 * @param args - command line arguments
 * @param options - parse options, about details see {@link ParseOptions}
 * @returns The result of one of the overloads above, by whether `passthrough` is `true`.
 */
export function parse<A extends Args>(
  args: string[],
  options?: ParseOptions<A>
): ParsedArgs<A> & {
  /**
   * Only with {@link ResolveArgs.passthrough | passthrough}.
   */
  passthroughIndices?: number[]
  /**
   * Only with {@link ResolveArgs.passthrough | passthrough}.
   */
  passthrough?: string[]
}
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
  // the result has no prototype, so it keeps its keys in a dictionary: the keys are added one by
  // one, in the order of `resolveArgs()` and then `tokens`, which is faster than `Object.assign()`
  const result: Record<string, unknown> = Object.create(null)
  result.values = resolved.values
  result.positionals = resolved.positionals
  result.rest = resolved.rest
  result.error = resolved.error
  result.explicit = resolved.explicit
  const indices = resolved.passthroughIndices
  if (indices === undefined) {
    result.tokens = tokens
    return result as ParsedArgs<A>
  }
  // with `allowCompatible`, the tokens after a short option group with `-` in it, such as `-p-5`,
  // have indexes past the arguments that they come from, as in `parseArgs()` of `node:util`. The
  // indexes in ascending order that are past the last argument are left out, and the others are
  // then those of the arguments after the group
  let count = indices.length
  while (count > 0 && indices[count - 1] >= given.length) {
    count--
  }
  indices.length = count
  const passthrough: string[] = []
  for (let i = 0; i < indices.length; i++) {
    passthrough.push(given[indices[i]])
  }
  result.passthroughIndices = indices
  result.tokens = tokens
  result.passthrough = passthrough
  return result as ParsedArgs<A>
}
