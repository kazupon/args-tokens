import { parseArgs as parseArgsNode } from 'node:util'
import { describe, test } from 'vite-plus/test'
import { parse as libParse, parseArgs as libParseArgs } from '../lib/index.js'

// Vitest's module runner turns each imported binding into a getter: call the functions through
// local constants, so that the benchmarks do not measure the getter
const parse = libParse
const parseArgs = libParseArgs

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
  test('util.parseArgs and args-tokens parse', async ({ bench }) => {
    await bench.compare(
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
      }),
      bench('args-tokens parse', () => {
        parse(args, {
          args: {
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
    )
  })
})

describe('parseArgs', () => {
  test('node:util and args-tokens', async ({ bench }) => {
    await bench.compare(
      bench('node:util', () => {
        parseArgsNode({
          allowPositionals: true,
          strict: false,
          args,
          tokens: true
        })
      }),
      bench('args-tokens', () => {
        parseArgs(args)
      })
    )
  })
})
