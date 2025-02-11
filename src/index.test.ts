import { parseArgs as parseArgsNode } from 'node:util'
import { describe, expect, test } from 'vitest'
import { parseArgs } from './index'

describe.only('short options', () => {
  test('-a', () => {
    const { tokens } = parseArgsNode({
      allowPositionals: true,
      strict: false,
      args: ['-a'],
      tokens: true
    })
    console.log('node', tokens)

    const ret = parseArgs(['-a'])
    console.log('jts', ret)
    expect(1).toEqual(1)
  })

  test('-xFILES', () => {
    const { tokens } = parseArgsNode({
      allowPositionals: true,
      strict: false,
      args: ['-xFILES'],
      tokens: true
    })
    console.log('node', tokens)

    const ret = parseArgs(['-xFILES'])
    console.log('jts', ret)
    expect(1).toEqual(1)
  })

  test('-a 1', () => {
    const { tokens } = parseArgsNode({
      allowPositionals: true,
      strict: false,
      args: ['-a', '1'],
      tokens: true
    })
    console.log('node', tokens)

    const ret = parseArgs(['-a', '1'])
    console.log('jts', ret)
    expect(1).toEqual(1)
  })

  test('-abc=1 1', () => {
    const { tokens } = parseArgsNode({
      allowPositionals: true,
      strict: false,
      args: ['-abc=1', '1'],
      tokens: true
    })
    console.log('node', tokens)

    const ret = parseArgs(['-abc=1', '1'])
    console.log('jts', ret)
    expect(1).toEqual(1)
  })

  test.skip('-x-japan=kurenai 1', () => {
    const args = ['-x-japan=kurenai', '1']
    const { tokens } = parseArgsNode({
      allowPositionals: true,
      strict: false,
      args,
      tokens: true
    })
    console.log('node', tokens)

    const ret = parseArgs(args)
    console.log('jts', ret)
    expect(1).toEqual(1)
  })
})

describe.only('long options', () => {
  test('--a', () => {
    const { tokens } = parseArgsNode({
      allowPositionals: true,
      strict: false,
      args: ['--a'],
      tokens: true
    })
    console.log('node', tokens)

    const ret = parseArgs(['--a'])
    console.log('jts', ret)
    expect(1).toEqual(1)
  })

  test('--a 1', () => {
    const { tokens } = parseArgsNode({
      allowPositionals: true,
      strict: false,
      args: ['--a', '1'],
      tokens: true
    })
    console.log('node', tokens)

    const ret = parseArgs(['--a', '1'])
    console.log('jts', ret)
    expect(1).toEqual(1)
  })

  test('--abc=1 1', () => {
    const { tokens } = parseArgsNode({
      allowPositionals: true,
      strict: false,
      args: ['--abc=1', '1'],
      tokens: true
    })
    console.log('node', tokens)

    const ret = parseArgs(['--abc=1', '1'])
    console.log('jts', ret)
    expect(1).toEqual(1)
  })

  test('--no-color 1', () => {
    const args = ['--no-color', '1']
    const { tokens } = parseArgsNode({
      allowPositionals: true,
      allowNegative: true,
      strict: false,
      args,
      tokens: true
    })
    console.log('node', tokens)

    const ret = parseArgs(args)
    console.log('jts', ret)
    expect(1).toEqual(1)
  })
})

test.skip('positional arguments', () => {
  const { tokens } = parseArgsNode({
    allowPositionals: true,
    strict: false,
    args: ['1', '2', '3'],
    tokens: true
  })
  console.log('node', tokens)

  const ret = parseArgs(['1', '2', '3'])
  console.log('jts', ret)
  expect(1).toEqual(1)
})

test.skip('short and long options', () => {
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
    'false'
  ]
  const { tokens } = parseArgsNode({
    allowPositionals: true,
    strict: false,
    args,
    tokens: true
  })
  console.log('node', tokens)

  const ret = parseArgs(args)
  console.log('jts', ret)
  expect(1).toEqual(1)
})

test.skip('option terminator', () => {
  const { tokens } = parseArgsNode({
    allowPositionals: true,
    strict: false,
    args: ['--a', '--', '--x', '1', '-a'],
    tokens: true
  })
  console.log('node', tokens)

  const ret = parseArgs(['--a', '--', '--x', '1', '-a'])
  console.log('jts', ret)
  expect(1).toEqual(1)
})
