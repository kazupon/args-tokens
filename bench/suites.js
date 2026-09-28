/**
 * The benchmark suites shared by `bench/mitata.js`, `bench/positionals.js`, `bench/run-suite.mjs`
 * and `bench/compare.mjs`.
 *
 * Each suite registers its benchmarks for a build of args-tokens (`lib`), so that the same suites
 * can measure the build of a pull request and the build of its base.
 */

import { parseArgs as parseArgsNode } from 'node:util'

export const args = [
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

// the schema of the parse suite, for its check: its benchmarks write the schema inline, as
// bench/mitata.js always did, so that each iteration creates it
const schema = {
  foo: { type: 'boolean', short: 'f' },
  bar: { type: 'number', short: 'b', required: true }
}

// the arguments and the schema of the benchmark with toKebab, which names each option in kebab case
const kebabArgs = ['--dry-run', '--out-dir', 'dist', '--max-workers=8']
const kebabSchema = {
  dryRun: { type: 'boolean', short: 'n' },
  outDir: { type: 'string', short: 'o' },
  logLevel: { type: 'enum', choices: ['info', 'debug'], default: 'info' },
  maxWorkers: { type: 'number', default: 4 },
  configFile: { type: 'string' }
}

export const positionalCases = [
  {
    name: 'options only',
    argv: ['dev', '--foo', '--bar=3', '-b=4', 'left', 'right'],
    schema: {
      foo: { type: 'boolean', short: 'f' },
      bar: { type: 'number', short: 'b', required: true }
    }
  },
  {
    name: 'one required positional',
    argv: ['build', '--foo', '--bar=3', 'extra'],
    schema: {
      command: { type: 'positional' },
      foo: { type: 'boolean', short: 'f' },
      bar: { type: 'number', short: 'b', required: true }
    }
  },
  {
    name: 'optional trailing missing',
    argv: ['--help'],
    schema: {
      query: { type: 'positional', required: false },
      help: { type: 'boolean', short: 'h' }
    }
  },
  {
    name: 'optional before required',
    argv: ['users'],
    schema: {
      query: { type: 'positional', required: false },
      table: { type: 'positional' }
    }
  },
  {
    name: 'optional before required full',
    argv: ['select *', 'users'],
    schema: {
      query: { type: 'positional', required: false },
      table: { type: 'positional' }
    }
  },
  {
    name: 'multiple before required',
    argv: ['a.ts', 'b.ts', 'c.ts', 'out.js'],
    schema: {
      files: { type: 'positional', multiple: true },
      output: { type: 'positional' }
    }
  },
  {
    name: 'long positional chain',
    argv: ['ns', 'query', 'users', 'json', 'pretty'],
    schema: {
      namespace: { type: 'positional', required: false },
      query: { type: 'positional', required: false },
      table: { type: 'positional' },
      format: { type: 'positional', required: false },
      style: { type: 'positional', required: false }
    }
  }
]

/**
 * The suites: `register(bench, lib)` adds the benchmarks, `check(lib)` returns what each input
 * resolves to, so that a comparison can tell when two builds do different work.
 * `control` names a benchmark that does not use args-tokens, whose ratio between two builds shows
 * the noise of the machine (`null` when a suite has none).
 */
export const suites = {
  parse: {
    control: 'util.parseArgs',
    register(bench, { parse, parseArgs, resolveArgs }) {
      const tokens = parseArgs(args)
      bench('util.parseArgs', () => {
        parseArgsNode({ allowPositionals: true, strict: false, args, tokens: true })
      })
      bench('args-tokens parse (equivalent to util.parseArgs)', () => {
        parse(args, {
          args: {
            foo: { type: 'boolean', short: 'f' },
            bar: { type: 'number', short: 'b', required: true }
          }
        })
      })
      bench('args-tokens parseArgs', () => {
        parseArgs(args)
      })
      bench('args-tokens resolveArgs', () => {
        resolveArgs(
          {
            foo: { type: 'boolean', short: 'f' },
            bar: { type: 'number', short: 'b', required: true }
          },
          tokens
        )
      })
      const kebabTokens = parseArgs(kebabArgs)
      bench('args-tokens resolveArgs with toKebab', () => {
        resolveArgs(
          {
            dryRun: { type: 'boolean', short: 'n' },
            outDir: { type: 'string', short: 'o' },
            logLevel: { type: 'enum', choices: ['info', 'debug'], default: 'info' },
            maxWorkers: { type: 'number', default: 4 },
            configFile: { type: 'string' }
          },
          kebabTokens,
          { toKebab: true }
        )
      })
    },
    check({ parse, parseArgs, resolveArgs }) {
      return {
        args: summarize(parse(args, { args: schema })),
        toKebab: summarize(resolveArgs(kebabSchema, parseArgs(kebabArgs), { toKebab: true }))
      }
    }
  },
  positionals: {
    control: null,
    register(bench, { parseArgs, resolveArgs }) {
      for (const c of positionalCases) {
        const tokens = parseArgs(c.argv)
        bench(c.name, () => {
          resolveArgs(c.schema, tokens)
        })
      }
    },
    check({ parseArgs, resolveArgs }) {
      return Object.fromEntries(
        positionalCases.map(c => [c.name, summarize(resolveArgs(c.schema, parseArgs(c.argv)))])
      )
    }
  }
}

function summarize(result) {
  return {
    values: result.values,
    positionals: result.positionals,
    rest: result.rest,
    errors: result.error ? result.error.errors.map(e => e.code ?? e.name) : []
  }
}
