/**
 * Main entry point of `args-tokens`.
 * @module default
 */

/**
 * @author kazuya kawaguchi (a.k.a. kazupon)
 * @license MIT
 */

export { parse } from './parse.ts'
export { parseArgs } from './parser.ts'
export { OptionResolveError, resolveArgs } from './resolver.ts'

export type { ParsedArgs, ParseOptions } from './parse.ts'
export type { ArgToken, ParserOptions } from './parser.ts'
export type {
  ArgOptions,
  ArgOptionSchema,
  ArgValues,
  OptionResolveErrorType,
  ResolveArgsOptions
} from './resolver.ts'
