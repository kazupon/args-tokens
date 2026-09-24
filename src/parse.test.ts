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
