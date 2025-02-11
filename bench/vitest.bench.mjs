import { parseArgs as parseArgsNode } from 'node:util'
import { bench, describe } from 'vitest'
import { parseArgs } from '../lib/esm/index.js'

describe('parseArgs', () => {
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
