/**
 * Entry point of utils.
 *
 * Note that this entry point is used by gunshi to import utility functions.
 *
 * @module
 */

/**
 * @author kazuya kawaguchi (a.k.a. kazupon)
 * @license MIT
 */

export function kebabnize(str: string): string {
  // eslint-disable-next-line unicorn/prefer-string-replace-all
  return str.replace(/[A-Z]/g, (match, offset) => (offset > 0 ? '-' : '') + match.toLowerCase())
}
