import { barplot, bench, run } from 'mitata'
import { parseArgs as parseArgsNode } from 'node:util'
import { parseArgs, resolveArgs } from '../lib/esm/index.js'

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
console.log('benchmark arguments:', args)

const tokens = parseArgs(args)

barplot(() => {
  bench('node:util parseArgs', () => {
    parseArgsNode({
      allowPositionals: true,
      strict: false,
      args,
      tokens: true
    })
  })
  bench('args-tokens parseArgs', () => {
    parseArgs(args)
  })
  bench('args-tokens resolveArgs', () => {
    resolveArgs(
      {
        foo: {
          type: 'boolean',
          short: 'f'
        },
        bar: {
          type: 'number',
          short: 'b',
          required: true
        }
      },
      tokens
    )
  })

  bench('args-tokens parseArgs + resolveArgs', () => {
    const tokens = parseArgs(args)
    resolveArgs(
      {
        foo: {
          type: 'boolean',
          short: 'f'
        },
        bar: {
          type: 'number',
          short: 'b',
          required: true
        }
      },
      tokens
    )
  })
})

await run()
