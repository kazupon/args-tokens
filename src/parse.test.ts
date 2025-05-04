import { expect, test } from 'vitest'
import { parse } from './parse.ts'
import { parseArgs } from './parser.ts'

import type { Args } from './resolver.ts'

const args = {
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
    type: 'boolean',
    negatable: true
  },
  host: {
    type: 'string',
    short: 'o',
    required: true
  }
} as const satisfies Args

test('parse', () => {
  const argv = [
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
  const { values, positionals, rest, tokens } = parse(argv, { args })
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
  expect(tokens).toEqual(parseArgs(argv))
})
