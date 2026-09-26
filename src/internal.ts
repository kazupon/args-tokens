/**
 * Internal definitions shared by the modules of `args-tokens`.
 *
 * This module is not an entry point: it is not in the `exports` of `package.json` and `jsr.json`,
 * so what it exports is not part of the public API.
 */

/**
 * @author kazuya kawaguchi (a.k.a. kazupon)
 * @license MIT
 */

/**
 * Brand of a `parse` function that has no side effects, set by `string()`, `number()`,
 * `integer()`, `float()`, `choice()` and `positional()` without a parser, so that the resolver may
 * call it with a value that the option was not given, to check the value before suggesting it.
 *
 * The brand is looked up in the global symbol registry with `Symbol.for`, so it stays identical
 * across bundled copies of `args-tokens`, where the resolver and the combinators may come from
 * different copies.
 */
export const PURE_PARSE: unique symbol = Symbol.for('args-tokens.pureParse')
