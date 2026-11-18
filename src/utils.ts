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
  if (typeof str !== 'string') {
    // as before, for a value of another type
    return (str as string).replace(
      /[A-Z]/g,
      (match, offset) => (offset > 0 ? '-' : '') + match.toLowerCase()
    )
  }
  // a loop over the characters is faster than a regular expression with a function: each `A`-`Z`
  // becomes `-` and its lower case letter, without `-` at the start
  let result = ''
  let start = 0
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i)
    if (code >= 65 && code <= 90) {
      result += `${str.slice(start, i)}${i > 0 ? '-' : ''}${String.fromCharCode(code + 32)}`
      start = i + 1
    }
  }
  return start === 0 ? str : result + str.slice(start)
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
