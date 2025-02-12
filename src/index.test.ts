import { parseArgs as parseArgsNode } from 'node:util'
import { describe, expect, test } from 'vitest'
import { parseArgs } from './index'

describe('short options', () => {
  test.each(['-foo', '-xJAPAN', '-foo 1'])('%s', argv => {
    const args = argv.split(' ')
    const { tokens: expectTokens } = parseArgsNode({
      allowPositionals: true,
      strict: false,
      args,
      tokens: true
    })

    const actualTokens = parseArgs(args)
    expect(actualTokens).toEqual(expectTokens)
  })

  test('value with equal: -abc=1 2', () => {
    const args = ['-abc=1', '2']
    const { tokens: nodeTokens } = parseArgsNode({
      allowPositionals: true,
      strict: false,
      args,
      tokens: true
    })
    expect(nodeTokens).toMatchSnapshot('node:utils parseArgs')
    expect(nodeTokens[3]).toEqual({
      index: 0,
      inlineValue: undefined,
      kind: 'option',
      name: '=',
      rawName: '-=',
      value: undefined
    })
    expect(nodeTokens[4]).toEqual({
      index: 0,
      inlineValue: undefined,
      kind: 'option',
      name: '1',
      rawName: '-1',
      value: undefined
    })

    const tokens = parseArgs(args)
    expect(tokens).toMatchSnapshot('args-tokens parseArgs')
    expect(tokens[3]).toEqual({
      index: 0,
      inlineValue: true,
      kind: 'option',
      value: '1'
    })
  })

  test('value with equal compatible: -abc=1 2', () => {
    const args = ['-abc=1', '2']
    const { tokens: nodeTokens } = parseArgsNode({
      allowPositionals: true,
      strict: false,
      args,
      tokens: true
    })

    const tokens = parseArgs(args, { allowCompatible: true })
    expect(nodeTokens).toEqual(tokens)
  })
})

describe('long options', () => {
  test.each(['--foo', '--foo bar', '--foo=bar', '--foo=bar baz', '--foo-bar=baz qux'])(
    `%s`,
    argv => {
      const args = argv.split(' ')
      const { tokens: expectTokens } = parseArgsNode({
        allowPositionals: true,
        strict: false,
        args,
        tokens: true
      })

      const actualTokens = parseArgs(args)
      expect(actualTokens).toEqual(expectTokens)
    }
  )
})

test('positional arguments', () => {
  const args = ['1', '2', '3']
  const { tokens: expectTokens } = parseArgsNode({
    allowPositionals: true,
    strict: false,
    args,
    tokens: true
  })

  const actualTokens = parseArgs(args)
  expect(actualTokens).toEqual(expectTokens)
})

test('complex options', () => {
  const args = [
    '-x',
    '--foo',
    '1',
    '-y',
    '2',
    '--bar=3',
    // '-z=4',
    '--baz',
    '-abcfFILE',
    '5',
    'false',
    'true',
    '--',
    '--x',
    '6',
    '7',
    '8',
    '9',
    '10'
  ]
  const { tokens: expectTokens } = parseArgsNode({
    allowPositionals: true,
    strict: false,
    args,
    tokens: true
  })

  const actualTokens = parseArgs(args)
  expect(actualTokens).toEqual(expectTokens)
})

test('option terminator', () => {
  const args = ['--a', '--', '--x', '1', '-a']
  const { tokens: expectTokens } = parseArgsNode({
    allowPositionals: true,
    strict: false,
    args,
    tokens: true
  })

  const actualTokens = parseArgs(args)
  expect(actualTokens).toEqual(expectTokens)
})
