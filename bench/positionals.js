import { barplot, bench, run } from 'mitata'
import { parseArgs, resolveArgs } from '../lib/index.js'

const cases = [
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

for (const testCase of cases) {
  testCase.tokens = parseArgs(testCase.argv)
}

barplot(() => {
  for (const testCase of cases) {
    bench(testCase.name, () => {
      resolveArgs(testCase.schema, testCase.tokens)
    })
  }
})

await run()
