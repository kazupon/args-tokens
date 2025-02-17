import { expect, test } from 'vitest'
import { parse } from './parse.js'

import type { ArgOptions } from './resolver'

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
    '-h',
    '--version',
    'bar',
    'baz'
  ]
  const { values, positionals } = parse(args, { options })
  expect(values).toEqual({
    port: 9131,
    host: 'example.com',
    mode: 'production',
    help: true,
    version: true
  })
  expect(positionals).toEqual(['dev', 'example.com', 'foo', 'bar', 'baz'])
})
