import { parseArgs as parseArgsNode } from 'node:util'
import { bench, describe } from 'vitest'
import { parse, parseArgs } from '../lib/index.js'

const args = [
  '-x',
  '--foo',
  '1',
  '-y',
  '2',
  '--bar=3',
  '-z=4',
  '--baz',
  '-abcfFILE',
  '5',
  'false',
  '--',
  '6',
  '7',
  '8',
  '9',
  '10'
]

describe('parse and resolve', () => {
  bench('util.parseArgs', () => {
    parseArgsNode({
      allowPositionals: true,
      strict: false,
      args,
      options: {
        foo: {
          type: 'boolean',
          short: 'f'
        },
        bar: {
          type: 'string',
          short: 'b'
        }
      },
      tokens: true
    })
  })

  bench('args-tokens parse', () => {
    parse(args, {
      options: {
        foo: {
          type: 'boolean',
          short: 'f'
        },
        bar: {
          type: 'number',
          short: 'b',
          required: true
        }
      }
    })
  })
})

describe('parseArgs', () => {
  bench('node:util', () => {
    parseArgsNode({
      allowPositionals: true,
      strict: false,
      args,
      tokens: true
    })
  })
  bench('args-tokens', () => {
    parseArgs(args)
  })
})
