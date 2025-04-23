import { expect, test } from 'vitest'
import { parse } from './parse.ts'
import { parseArgs } from './parser.ts'

import type { ArgOptions } from './resolver.ts'

const options = {
  help: {
    type: 'boolean',
    short: 'h'
  },
  version: {
    type: 'boolean',
    short: 'v'
  },
  port: {
    type: 'number',
    short: 'p',
    default: 8080
  },
  mode: {
    type: 'string',
    short: 'm'
  },
  silent: {
    type: 'boolean'
  },
  host: {
    type: 'string',
    short: 'o',
    required: true
  }
} as const satisfies ArgOptions

test('parse', () => {
  const args = [
    'dev',
    '-p9131',
    '--host',
    'example.com',
    'foo',
    '-m=production',
    '--no-silent',
    '-h',
    '--version',
    'bar',
    'baz',
    '--',
    '--help',
    '--version',
    '--port',
    '8080'
  ]
  const { values, positionals, rest, tokens } = parse(args, { options, allowNegative: true })
  expect(values).toEqual({
    port: 9131,
    host: 'example.com',
    mode: 'production',
    help: true,
    silent: false,
    version: true
  })
  expect(positionals).toEqual(['dev', 'foo', 'bar', 'baz'])
  expect(rest).toEqual(['--help', '--version', '--port', '8080'])
  expect(tokens).toEqual(parseArgs(args))
})
