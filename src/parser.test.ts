import { parseArgs as parseArgsNode } from 'node:util'
import { describe, expect, test } from 'vite-plus/test'
import { parseArgs } from './parser.ts'

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

  describe('value after =', () => {
    test.each([
      { arg: '-p=-5', value: '-5' },
      { arg: '-n=-foo', value: '-foo' },
      { arg: '-n=--foo', value: '--foo' },
      { arg: '-n=--', value: '--' },
      { arg: '-n=-', value: '-' }
    ])('$arg keeps the value $value', ({ arg, value }) => {
      const name = arg.charAt(1)
      expect(parseArgs([arg])).toEqual([
        { kind: 'option', name, rawName: `-${name}`, index: 0 },
        { kind: 'option', index: 0, value, inlineValue: true }
      ])
    })

    test('the value goes to the last option of the group', () => {
      expect(parseArgs(['-ab=-1'])).toEqual([
        { kind: 'option', name: 'a', rawName: '-a', index: 0 },
        { kind: 'option', name: 'b', rawName: '-b', index: 0 },
        { kind: 'option', index: 0, value: '-1', inlineValue: true }
      ])
    })

    test.each([
      { argv: ['-n=', '-av'] },
      { argv: ['-n=-', '-av'] },
      { argv: ['-p=-5', '-av', 'x'] },
      { argv: ['-=5', '-av'] }
    ])('$argv does not change how the next argument is read', ({ argv }) => {
      expect(parseArgs(argv).filter(token => token.index === 1)).toEqual([
        { kind: 'option', name: 'a', rawName: '-a', index: 1 },
        { kind: 'option', name: 'v', rawName: '-v', index: 1 }
      ])
    })

    test.each(['-5', '-5.5', '--', '--foo', '---', '-', '-a=b', '-é', ' '])(
      'a value %s is read like any other value',
      value => {
        for (const group of ['-p', '-ab']) {
          const tokens = parseArgs([`${group}=${value}`, '-av'])
          const other = parseArgs([`${group}=q`, '-av'])
          expect(tokens).toEqual(
            other.map(token => (token.rawName == null ? { ...token, value } : token))
          )
        }
      }
    )

    test.each([
      { arg: '-n=a=b', value: 'a=b' },
      { arg: '-n==', value: '=' }
    ])('$arg keeps the value $value', ({ arg, value }) => {
      expect(parseArgs([arg])).toEqual([
        { kind: 'option', name: 'n', rawName: '-n', index: 0 },
        { kind: 'option', index: 0, value, inlineValue: true }
      ])
    })

    test('an empty value after = is a value too', () => {
      expect(parseArgs(['-n='])).toEqual([
        { kind: 'option', name: 'n', rawName: '-n', index: 0 },
        { kind: 'option', index: 0, value: '', inlineValue: true }
      ])
      expect(parseArgs(['-ab='])).toEqual([
        { kind: 'option', name: 'a', rawName: '-a', index: 0 },
        { kind: 'option', name: 'b', rawName: '-b', index: 0 },
        { kind: 'option', index: 0, value: '', inlineValue: true }
      ])
    })

    test('an empty value after = does not take the next argument', () => {
      expect(parseArgs(['-n=', 'x'])).toEqual([
        { kind: 'option', name: 'n', rawName: '-n', index: 0 },
        { kind: 'option', index: 0, value: '', inlineValue: true },
        { kind: 'positional', index: 1, value: 'x' }
      ])
    })

    test('a value without an option before = is read as another argument', () => {
      expect(parseArgs(['-=5'])).toEqual([{ kind: 'positional', index: 0, value: '5' }])
      // no option takes the value, so `-abc` is read as short options
      expect(parseArgs(['-=-abc'])).toEqual([
        { kind: 'option', name: 'a', rawName: '-a', index: 0 },
        { kind: 'option', name: 'b', rawName: '-b', index: 0 },
        { kind: 'option', name: 'c', rawName: '-c', index: 0 }
      ])
    })

    test('allowCompatible keeps the node:util tokens', () => {
      const args = ['-p=-5']
      const { tokens } = parseArgsNode({
        allowPositionals: true,
        strict: false,
        args,
        tokens: true
      })
      expect(parseArgs(args, { allowCompatible: true })).toEqual(tokens)
    })

    test('allowCompatible keeps the node:util tokens of an empty value after =', () => {
      const args = ['-n=', 'x']
      const { tokens } = parseArgsNode({
        allowPositionals: true,
        strict: false,
        args,
        tokens: true
      })
      expect(parseArgs(args, { allowCompatible: true })).toEqual(tokens)
    })
  })

  describe('value after -', () => {
    test.each([
      { arg: '-o-', value: '-' },
      { arg: '-p-5', value: '-5' },
      { arg: '-n-foo', value: '-foo' },
      { arg: '-n--', value: '--' },
      { arg: '-n--foo', value: '--foo' }
    ])('$arg gives the option the value $value from the -', ({ arg, value }) => {
      const name = arg.charAt(1)
      expect(parseArgs([arg])).toEqual([
        { kind: 'option', name, rawName: `-${name}`, index: 0 },
        { kind: 'option', index: 0, value, inlineValue: false }
      ])
    })

    test('the value goes to the last option of the group', () => {
      expect(parseArgs(['-ab-c'])).toEqual([
        { kind: 'option', name: 'a', rawName: '-a', index: 0 },
        { kind: 'option', name: 'b', rawName: '-b', index: 0 },
        { kind: 'option', index: 0, value: '-c', inlineValue: false }
      ])
      // `=` after the `-` is part of the value
      expect(parseArgs(['-a-b=5'])).toEqual([
        { kind: 'option', name: 'a', rawName: '-a', index: 0 },
        { kind: 'option', index: 0, value: '-b=5', inlineValue: false }
      ])
    })

    test('the arguments after the group keep their index', () => {
      expect(parseArgs(['-n-foo', '--verbose', 'file'])).toEqual([
        { kind: 'option', name: 'n', rawName: '-n', index: 0 },
        { kind: 'option', index: 0, value: '-foo', inlineValue: false },
        { kind: 'option', name: 'verbose', rawName: '--verbose', index: 1 },
        { kind: 'positional', index: 2, value: 'file' }
      ])
    })

    test('the value after a leading =, read as another argument, is read the same way', () => {
      expect(parseArgs(['-=-v-'])).toEqual([
        { kind: 'option', name: 'v', rawName: '-v', index: 0 },
        { kind: 'option', index: 0, value: '-', inlineValue: false }
      ])
    })
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

test('long option followed by value containing "--" (e.g. --custom-property)', () => {
  const args = ['--foo', 'include double hyphen e.g. --custom-property']
  const { tokens: expectTokens } = parseArgsNode({
    allowPositionals: true,
    strict: false,
    args,
    tokens: true
  })

  const actualTokens = parseArgs(args)
  expect(actualTokens).toEqual(expectTokens)
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
