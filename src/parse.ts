import { parseArgs } from './parser.js'
import { resolveArgs } from './resolver.js'

import type { ParserOptions } from './parser'
import type { ArgOptions, ArgValues } from './resolver'

/**
 * Parse options for {@link parse} function
 */
interface ParseOptions<O extends ArgOptions> extends ParserOptions {
  /**
   * Command line options, about details see {@link ArgOptions}
   */
  options?: O
}

/**
 * Parsed command line arguments
 */
type ParsedArgs<T extends ArgOptions> = {
  /**
   * Parsed values, same as `values` in {@link resolveArgs}
   */
  values: ArgValues<T>
  /**
   * Positional arguments, same as `positionals` in {@link resolveArgs}
   */
  positionals: string[]
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
 * Parse command line arguments
 * @description This function is a convenient API, that is used {@link parseArgs} and {@link resolveArgs} in internal.
 * @example
 * ```js
 * import { parse } from 'args-tokens'
 *
 * const { values, positionals } = parse(process.argv.slice(2))
 * console.log('values', values)
 * console.log('positionals', positionals)
 * ```
 * @param args command line arguments
 * @param options parse options, about details see {@link ParseOptions}
 * @returns parsed values
 */
export function parse<O extends ArgOptions>(
  args: string[],
  options: ParseOptions<O> = {}
): ParsedArgs<O> {
  const { options: argOptions, allowCompatible = false } = options
  const tokens = parseArgs(args, { allowCompatible })
  return resolveArgs<O>((argOptions as O) || DEFAULT_OPTIONS, tokens)
}
