import { expect, test } from 'vite-plus/test'
import { parse } from './parse.ts'
import { parseArgs } from './parser.ts'
import { ArgsValidationErrorKeys } from './resolver.ts'

import type { Args, ArgsValidationError } from './resolver.ts'

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

test('boolean option with an explicit value', () => {
  expect(parse(['--help=false']).values.help).toBe(false)

  const { values, error } = parse(['--help=x'])
  expect((error!.errors[0] as ArgsValidationError).code).toBe(ArgsValidationErrorKeys.invalidType)
  expect(values.help).toBeUndefined()
})

test('number option without a value', () => {
  const { values, error } = parse(['--port'], { args: { port: { type: 'number' } } })
  expect((error!.errors[0] as ArgsValidationError).code).toBe(ArgsValidationErrorKeys.missingValue)
  expect(values.port).toBeUndefined()
})

test('short option with its value in the same argument, followed by a positional argument', () => {
  const { values, positionals, error } = parse(['-p5', 'file.txt'], {
    args: { port: { type: 'number', short: 'p' } }
  })
  expect(error).toBeUndefined()
  expect(values.port).toBe(5)
  expect(positionals).toEqual(['file.txt'])
})

test('string option with a default and an explicit empty value', () => {
  const { values, error } = parse(['--name='], {
    args: { name: { type: 'string', default: 'def' } }
  })
  expect(error).toBeUndefined()
  expect(values.name).toBe('')
})

test('long option with = written after the same short option with an attached value', () => {
  const { values, error } = parse(['-sv', '--str=x'], {
    args: { str: { type: 'string', short: 's' } }
  })
  expect(error).toBeUndefined()
  expect(values.str).toBe('x')
})

test('an empty argument after -- goes to rest', () => {
  const { positionals, rest, error } = parse(['x', '--', '', 'y'])
  expect(error).toBeUndefined()
  expect(positionals).toEqual(['x'])
  expect(rest).toEqual(['', 'y'])
})

test('shortGrouping is passed to resolveArgs', () => {
  const { values, positionals, error } = parse(['-vp', '5'], {
    args: {
      verbose: { type: 'boolean', short: 'v' },
      port: { type: 'number', short: 'p' }
    },
    shortGrouping: true
  })
  expect(error).toBeUndefined()
  expect(values).toEqual({ verbose: true, port: 5 })
  expect(positionals).toEqual([])
})

test('skipPositional is passed to resolveArgs', () => {
  const schema = { file: { type: 'positional' } } as const satisfies Args
  const { values, positionals, error } = parse(['build', 'main.ts'], {
    args: schema,
    skipPositional: 0
  })
  expect(error).toBeUndefined()
  expect(values.file).toBe('main.ts')
  expect(positionals).toEqual(['build', 'main.ts'])
  // without skipPositional, the first positional argument is not skipped
  expect(parse(['build', 'main.ts'], { args: schema }).values.file).toBe('build')
})

test('toKebab is passed to resolveArgs', () => {
  const schema = { dryRun: { type: 'boolean' } } as const satisfies Args
  const { values, error } = parse(['--dry-run'], { args: schema, toKebab: true })
  expect(error).toBeUndefined()
  expect(values.dryRun).toBe(true)
  // without toKebab, only the name as it is written in the schema matches
  expect(parse(['--dry-run'], { args: schema }).values.dryRun).toBeUndefined()
  expect(parse(['--dryRun'], { args: schema }).values.dryRun).toBe(true)
})

test('the options are passed to resolveArgs without args too', () => {
  // without args, parse() reads the default `help` (`-h`) and `version` (`-v`) options
  const { values, error } = parse(['-hv'], { shortGrouping: true })
  expect(error).toBeUndefined()
  expect(values).toEqual({ help: true, version: true })
})

test('allowCompatible is passed to parseArgs, and the other options to resolveArgs', () => {
  const argv = ['sub', '-dv', '--log-level=2', 'a.txt', '-o-', 'x']
  const { values, positionals, rest, tokens, error } = parse(argv, {
    args: {
      debug: { type: 'boolean', short: 'd' },
      verbose: { type: 'boolean', short: 'v' },
      logLevel: { type: 'number' },
      output: { type: 'string', short: 'o' },
      file: { type: 'positional' }
    },
    allowCompatible: true,
    shortGrouping: true,
    skipPositional: 0,
    toKebab: true
  })
  // with allowCompatible, the `-` of `-o-` is the option terminator, as with `node:util`
  expect(tokens).toEqual(parseArgs(argv, { allowCompatible: true }))
  expect(values).toEqual({ debug: true, verbose: true, logLevel: 2, file: 'a.txt' })
  expect(positionals).toEqual(['sub', 'a.txt'])
  expect(rest).toEqual(['x'])
  expect(error?.errors.map(e => (e as ArgsValidationError).code)).toEqual([
    ArgsValidationErrorKeys.missingValue
  ])
})

test('a custom argument without parse throws, whether or not it is given', () => {
  const args = { config: { type: 'custom' } } satisfies Args

  expect(() => parse([], { args })).toThrow("argument 'config' should have a 'parse' function")
  expect(() => parse(['--config={}'], { args })).toThrow(
    "argument 'config' should have a 'parse' function"
  )
})
