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

/**
 * Convert a string to kebab-case.
 *
 * @param str - A string to convert
 * @returns Converted string into kebab-case.
 */
export function kebabnize(str: string): string {
  return str.replace(/[A-Z]/g, (match, offset) => (offset > 0 ? '-' : '') + match.toLowerCase())
}

/**
 * Format allowed argument choices for validation error values and fallback messages.
 *
 * @param choices - Choice values to format
 * @returns JSON-quoted choices joined with `, `.
 */
export function formatChoices(choices: readonly string[]): string {
  return choices.map(value => JSON.stringify(value)).join(', ')
}
