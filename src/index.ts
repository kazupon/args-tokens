// SPDX-License-Identifier: MIT
// Modifier: kazuya kawaguchi (a.k.a. kazupon)

export { parse } from './parse.ts'
export { parseArgs } from './parser.ts'
export { OptionResolveError, resolveArgs } from './resolver.ts'

export type { ParsedArgs, ParseOptions } from './parse.ts'
export type { ArgToken, ParserOptions } from './parser.ts'
export type { ArgOptions, ArgOptionSchema, ArgValues } from './resolver.ts'
