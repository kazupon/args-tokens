// SPDX-License-Identifier: MIT
// Modifier: kazuya kawaguchi (a.k.a. kazupon)
// Forked from `nodejs/node` (`pkgjs/parseargs`)
// Repository url: https://github.com/nodejs/node (https://github.com/pkgjs/parseargs)
// Author: Node.js contributors
// Code url: https://github.com/nodejs/node/blob/main/lib/internal/util/parse_args/parse_args.js

type ArgTokenKind = 'option' | 'option-terminator' | 'positional'
export interface ArgToken {
  kind: ArgTokenKind
  index: number
  name?: string
  rawName?: string
  value?: string
  inlineValue?: boolean
}

const HYPHEN_CHAR = '-'
const HYPHEN_CODE = HYPHEN_CHAR.codePointAt(0)!
const EQUAL_CHAR = '='
const EQUAL_CODE = EQUAL_CHAR.codePointAt(0)!
const TERMINATOR = '--'
const SHORT_OPTION_PREFIX = HYPHEN_CHAR
const LONG_OPTION_PREFIX = '--'

/**
 * Parse Options
 */
export interface ParseOptions {
  /**
   * [Node.js parseArgs](https://nodejs.org/api/util.html#parseargs-tokens) tokens compatible mode
   * @default false
   */
  allowCompatible?: boolean
}

/**
 * Parse command line arguments
 * @param args command line arguments
 * @param options parse options
 * @returns argument tokens
 */
export function parseArgs(args: string[], options: ParseOptions = {}): ArgToken[] {
  const { allowCompatible = false } = options

  const tokens: ArgToken[] = []
  const remainings = [...args]
  let index = -1
  let groupCount = 0
  let hasShortValueSeparator = false

  while (remainings.length > 0) {
    const arg = remainings.shift()

    if (arg == undefined) {
      break
    }

    const nextArg = remainings[0]
    if (groupCount > 0) {
      groupCount--
    } else {
      index++
    }

    // check if `arg` is an options terminator.
    // guideline 10 in https://pubs.opengroup.org/onlinepubs/9699919799/basedefs/V1_chap12.html
    if (arg === TERMINATOR) {
      tokens.push({
        kind: 'option-terminator',
        index
      })
      const mapped = remainings.map(arg => {
        return { kind: 'positional', index: ++index, value: arg }
      }) satisfies ArgToken[]
      tokens.push(...mapped)
      break
    }

    if (isShortOption(arg)) {
      const shortOption = arg.charAt(1)
      let value: string | undefined
      let inlineValue: boolean | undefined
      if (groupCount) {
        // e.g. `-abc`
        tokens.push({
          kind: 'option',
          name: shortOption,
          rawName: arg,
          index,
          value,
          inlineValue
        })
        if (groupCount === 1 && hasOptionValue(nextArg)) {
          value = remainings.shift()
          if (hasShortValueSeparator) {
            inlineValue = true
            hasShortValueSeparator = false
          }
          tokens.push({
            kind: 'option',
            index,
            value,
            inlineValue
          })
        }
      } else {
        // e.g. `-a`
        tokens.push({
          kind: 'option',
          name: shortOption,
          rawName: arg,
          index,
          value,
          inlineValue
        })
      }

      // eslint-disable-next-line unicorn/no-null
      if (value != null) {
        ++index
      }
      continue
    }

    if (isShortOptionGroup(arg)) {
      // expend short option group (e.g. `-abc` => `-a -b -c`, `-f=bar` => `-f bar`)
      const expanded = []
      let shortValue = ''
      for (let i = 1; i < arg.length; i++) {
        const shortableOption = arg.charAt(i)
        if (hasShortValueSeparator) {
          shortValue += shortableOption
        } else {
          if (!allowCompatible && shortableOption.codePointAt(0) === EQUAL_CODE) {
            hasShortValueSeparator = true
          } else {
            expanded.push(`${SHORT_OPTION_PREFIX}${shortableOption}`)
          }
        }
      }
      if (shortValue) {
        expanded.push(shortValue)
      }
      remainings.unshift(...expanded)
      groupCount = expanded.length
      continue
    }

    if (isLongOption(arg)) {
      // e.g. `--foo`
      const longOption = arg.slice(2)
      tokens.push({
        kind: 'option',
        name: longOption,
        rawName: arg,
        index,
        value: undefined,
        inlineValue: undefined
      })

      continue
    }

    if (isLongOptionAndValue(arg)) {
      // e.g. `--foo=bar`
      const equalIndex = arg.indexOf(EQUAL_CHAR)
      const longOption = arg.slice(2, equalIndex)
      const value = arg.slice(equalIndex + 1)
      tokens.push({
        kind: 'option',
        name: longOption,
        rawName: `${LONG_OPTION_PREFIX}${longOption}`,
        index,
        value,
        inlineValue: true
      })
      continue
    }

    tokens.push({
      kind: 'positional',
      index,
      value: arg
    })
  }

  return tokens
}

/**
 * Check if `arg` is a short option (e.g. `-f`)
 * @param arg the argument to check
 * @returns whether `arg` is a short option
 */
function isShortOption(arg: string) {
  return (
    arg.length === 2 && arg.codePointAt(0) === HYPHEN_CODE && arg.codePointAt(1) !== HYPHEN_CODE
  )
}

/**
 * Check if `arg` is a short option group (e.g. `-abc`)
 * @param arg the argument to check
 * @returns whether `arg` is a short option group
 */
function isShortOptionGroup(arg: string) {
  if (arg.length <= 2) {
    return false
  }

  if (arg.codePointAt(0) !== HYPHEN_CODE) {
    return false
  }

  if (arg.codePointAt(1) === HYPHEN_CODE) {
    return false
  }

  return true
}

/**
 * Check if `arg` is a long option (e.g. `--foo`)
 * @param arg the argument to check
 * @returns whether `arg` is a long option
 */
function isLongOption(arg: string) {
  return hasLongOptionPrefix(arg) && !arg.includes(EQUAL_CHAR, 3)
}

/**
 * Check if `arg` is a long option with value (e.g. `--foo=bar`)
 * @param arg the argument to check
 * @returns whether `arg` is a long option
 */
function isLongOptionAndValue(arg: string) {
  return hasLongOptionPrefix(arg) && arg.includes(EQUAL_CHAR, 3)
}

/**
 * Check if `arg` is a long option prefix (e.g. `--`)
 * @param arg the argument to check
 * @returns whether `arg` is a long option prefix
 */
function hasLongOptionPrefix(arg: string) {
  return arg.length > 2 && ~arg.indexOf(LONG_OPTION_PREFIX)
}

/**
 * Check if a `value` is an option value
 * @param value a value to check
 * @returns whether a `value` is an option value
 */
function hasOptionValue(value: string | undefined): boolean {
  // eslint-disable-next-line unicorn/no-null
  return !(value == null) && value.codePointAt(0) !== HYPHEN_CODE
}
