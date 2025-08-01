# args-tokens

[![Version][npm-version-src]][npm-version-href]
[![JSR][jsr-src]][jsr-href]
[![InstallSize][install-size-src]][install-size-src]
[![CI][ci-src]][ci-href]

> [`parseArgs` tokens](https://nodejs.org/api/util.html#parseargs-tokens) compatibility and more high-performance parser

## ✨ Features

- ✅ High performance
- ✅ `util.parseArgs` token compatibility
- ✅ ES Modules and modern JavaScript
- ✅ Type safe
- ✅ Zero dependencies
- ✅ Universal runtime

## 🐱 Motivation

- Although Node.js [`parseArgs`](https://nodejs.org/api/util.html#utilparseargsconfig) can return tokens, that the short options are not in the format I expect. Of course, I recoginize the background of [this issue](https://github.com/pkgjs/parseargs/issues/78).
- `parseArgs` gives the command line args parser a useful util, so the resolution of the options values and the parsing of the tokens are tightly coupled. As a result, Performance is sacrificed. Of course, I recoginize that's the trade-off.

## ⏱️ Benchmark

With [mitata](https://github.com/evanwashere/mitata):

```sh
pnpm bench:mitata

> args-tokens@0.0.0 bench:mitata /path/to/projects/args-tokens
> node --expose-gc bench/mitata.js

clk: ~2.87 GHz
cpu: Apple M1 Max
runtime: node 18.19.1 (arm64-darwin)

benchmark                                       avg (min … max) p75 / p99    (min … top 1%)
--------------------------------------------------------------- -------------------------------
util.parseArgs                                     4.16 µs/iter   4.20 µs █
                                            (4.09 µs … 4.29 µs)   4.28 µs ██ ▅▅▅       ▅
                                        (  1.36 kb …   1.52 kb)   1.37 kb ██▁████▅▅█▅▁██▁▁▅▁█▅█

args-tokens parse (equivalent to util.parseArgs)   1.65 µs/iter   1.66 µs    █
                                            (1.61 µs … 1.80 µs)   1.79 µs ▅▃ █▂ ▄
                                        (  1.95 kb …   2.66 kb)   1.97 kb █████▆█▄▃▃▅▃▁▃▃▁▄▁▁▁▂

args-tokens parseArgs                            729.56 ns/iter 734.11 ns         █
                                        (697.43 ns … 797.08 ns) 774.93 ns        ▂█▅▂
                                        (  2.87 kb …   3.54 kb)   3.11 kb ▂▂▃▇▆▅▆████▃▃▄▂▂▂▂▂▁▂

args-tokens resolveArgs                          886.78 ns/iter 887.70 ns       █
                                        (853.96 ns … 978.89 ns) 957.24 ns       █
                                        (  2.51 kb …   2.87 kb)   2.79 kb ▂▃█▃▄▅█▄▃▂▂▃▃▂▂▂▂▂▁▁▁

                                                 ┌                                            ┐
                                  util.parseArgs ┤■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ 4.16 µs
args-tokens parse (equivalent to util.parseArgs) ┤■■■■■■■■■ 1.65 µs
                           args-tokens parseArgs ┤ 729.56 ns
                         args-tokens resolveArgs ┤■■ 886.78 ns
                                                 └                                            ┘
```

With [vitest](https://vitest.dev/guide/features.html#benchmarking):

```sh
pnpm bench:vitest

> args-tokens@0.0.0 bench:vitest /path/to/projects/args-tokens
> vitest bench --run

Benchmarking is an experimental feature.
Breaking changes might not follow SemVer, please pin Vitest's version when using it.

 RUN  v3.0.5 /path/to/projects/args-tokens


 ✓ bench/vitest.bench.js > parse and resolve 1350ms
     name                       hz     min     max    mean     p75     p99    p995    p999     rme  samples
   · util.parseArgs     221,285.36  0.0041  0.2700  0.0045  0.0044  0.0054  0.0063  0.0629  ±0.38%   110643
   · args-tokens parse  527,127.11  0.0017  0.2153  0.0019  0.0019  0.0023  0.0027  0.0055  ±0.38%   263564   fastest

 ✓ bench/vitest.bench.js > parseArgs 1434ms
     name                   hz     min     max    mean     p75     p99    p995    p999     rme  samples
   · node:util      235,217.05  0.0039  0.2665  0.0043  0.0042  0.0048  0.0058  0.0139  ±0.43%   117609
   · args-tokens  1,307,135.24  0.0006  0.1737  0.0008  0.0008  0.0009  0.0010  0.0016  ±0.43%   653568   fastest

 BENCH  Summary

  args-tokens parse - bench/vitest.bench.js > parse and resolve
    2.38x faster than util.parseArgs

  args-tokens - bench/vitest.bench.js > parseArgs
    5.56x faster than node:util

```

## ❓ What's different about parseArgs tokens?

The token output for the short option `-x=v` is different:

```js
import { parseArgs as parseArgsNode } from 'node:util'
import { parseArgs } from 'args-tokens'

// Node.js parseArgs tokens
const { tokens: tokensNode } = parseArgsNode({
  allowPositionals: true,
  strict: false,
  args: ['-a=1'],
  tokens: true
})
console.log(tokensNode)

//   ({
//     kind: 'option',
//     name: 'a',
//     rawName: '-a',
//     index: 0,
//     value: undefined,
//     inlineValue: undefined
//   },
//   {
//     kind: 'option',
//     name: '=',
//     rawName: '-=',
//     index: 0,
//     value: undefined,
//     inlineValue: undefined
//   },
//   {
//     kind: 'option',
//     name: '1',
//     rawName: '-1',
//     index: 0,
//     value: undefined,
//     inlineValue: undefined
//   })
// ]

// args-tokens parseArgs tokens
const tokens = parseArgs(['-a=1'])
console.log(tokens)

// [
//   {
//     kind: 'option',
//     name: 'a',
//     rawName: '-a',
//     index: 0,
//     value: undefined,
//     inlineValue: undefined
//   },
//   { kind: 'option', index: 0, value: '1', inlineValue: true }
// ]
```

## 💿 Installation

```sh
# npm
npm install --save args-tokens

## yarn
yarn add args-tokens

## pnpm
pnpm add args-tokens
```

### 🦕 Deno

```sh
deno add jsr:@kazupon/args-tokens
```

### 🥟 Bun

```sh
bun add args-tokens
```

## 🚀 Usage

### Parse args to tokens

`parseArgs` will transform arguments into tokens. This function is useful if you want to analyze arguments yourself based on the tokens. It's faster than `node:util` parseArgs because it only focuses on token transformation.

```js
import { parseArgs } from 'args-tokens' // for Node.js and Bun
// import { parseArgs } from 'jsr:@kazupon/args-tokens' // for Deno

const tokens = parseArgs(['--foo', 'bar', '-x', '--bar=baz'])
// do something with using tokens
// ...
console.log('tokens:', tokens)
```

## Resolve args values with tokens and arg option schema

`resolveArgs` is a useful function when you want to resolve values from the tokens obtained by `parseArgs`.

```js
import { parseArgs, resolveArgs } from 'args-tokens' // for Node.js and Bun
// import { parseArgs, resolveArgs } from 'jsr:@kazupon/args-tokens' // for Deno

const args = ['dev', '-p=9131', '--host=example.com', '--mode=production']
const tokens = parseArgs(args)
const { values, positionals } = resolveArgs(
  {
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
    host: {
      type: 'string',
      short: 'o',
      required: true
    }
  },
  tokens
)
console.log('values:', values)
console.log('positionals:', positionals)
```

## Convenient argument parsing

Using the `parse,` you can transform the arguments into tokens and resolve the argument values once:

```js
import { parse } from 'args-tokens' // for Node.js and Bun
// import { parse } from 'jsr:@kazupon/args-tokens' // for Deno

const args = ['dev', '-p=9131', '--host=example.com', '--mode=production']
const { values, positionals } = parse(args, {
  options: {
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
    host: {
      type: 'string',
      short: 'o',
      required: true
    }
  }
})
console.log('values:', values)
console.log('positionals:', positionals)
```

## Node.js `parseArgs` tokens compatible

If you want to use the same short options tokens as returned Node.js `parseArgs`, you can use `allowCompatible` parse option on `parseArgs`:

```js
import { parseArgs as parseArgsNode } from 'node:util'
import { parseArgs } from 'args-tokens'
import { deepStrictEqual } from 'node:assert'

const args = ['-a=1', '2']

// Node.js parseArgs tokens
const { tokens: tokensNode } = parseArgsNode({
  allowPositionals: true,
  strict: false,
  args,
  tokens: true
})

// args-tokens parseArgs tokens
const tokens = parseArgs(['-a=1'], { allowCompatible: true }) // add `allowCompatible` option

// validate
deepStrictEqual(tokensNode, tokens)
```

## ArgSchema Reference

The `ArgSchema` interface defines the configuration for command-line arguments. This schema is similar to Node.js `util.parseArgs` but with extended features.

### Schema Properties

#### `type` (required)

Type of the argument value:

- `'string'`: Text value (default if not specified)
- `'boolean'`: True/false flag (can be negatable with `--no-` prefix)
- `'number'`: Numeric value (parsed as integer or float)
- `'enum'`: One of predefined string values (requires `choices` property)
- `'positional'`: Non-option argument by position
- `'custom'`: Custom parsing with user-defined `parse` function

<!-- eslint-skip -->

```js
{
  name: { type: 'string' },        // --name value
  verbose: { type: 'boolean' },     // --verbose or --no-verbose
  port: { type: 'number' },         // --port 3000
  level: { type: 'enum', choices: ['debug', 'info'] },
  file: { type: 'positional' },     // first positional arg
  config: { type: 'custom', parse: JSON.parse }
}
```

#### `short` (optional)

Single character alias for the long option name. Allows users to use `-x` instead of `--extended-option`.

<!-- eslint-skip -->

```js
{
  verbose: {
    type: 'boolean',
    short: 'v'  // Enables both --verbose and -v
  },
  port: {
    type: 'number',
    short: 'p'  // Enables both --port 3000 and -p 3000
  }
}
```

#### `description` (optional)

Human-readable description used for help text generation and documentation.

<!-- eslint-skip -->

```js
{
  config: {
    type: 'string',
    description: 'Path to configuration file'
  },
  timeout: {
    type: 'number',
    description: 'Request timeout in milliseconds'
  }
}
```

#### `required` (optional)

Marks the argument as required. When `true`, the argument must be provided or an `ArgResolveError` will be thrown.

<!-- eslint-skip -->

```js
{
  input: {
    type: 'string',
    required: true,  // Must be provided: --input file.txt
    description: 'Input file path'
  },
  source: {
    type: 'positional',
    required: true   // First positional argument must exist
  }
}
```

#### `multiple` (optional)

Allows the argument to accept multiple values. The resolved value becomes an array.

- For options: can be specified multiple times (`--tag foo --tag bar`)
- For positional: collects remaining positional arguments

<!-- eslint-skip -->

```js
{
  tags: {
    type: 'string',
    multiple: true,  // --tags foo --tags bar → ['foo', 'bar']
    description: 'Tags to apply'
  },
  files: {
    type: 'positional',
    multiple: true   // Collects all remaining positional args
  }
}
```

#### `negatable` (optional)

Enables negation for boolean arguments using `--no-` prefix. Only applicable to `type: 'boolean'`.

<!-- eslint-skip -->

```js
{
  color: {
    type: 'boolean',
    negatable: true,
    default: true,
    description: 'Enable colorized output'
  }
  // Usage: --color (true), --no-color (false)
}
```

#### `choices` (optional)

Array of allowed string values for enum-type arguments. Required when `type: 'enum'`.

<!-- eslint-skip -->

```js
{
  logLevel: {
    type: 'enum',
    choices: ['debug', 'info', 'warn', 'error'],
    default: 'info',
    description: 'Logging verbosity level'
  },
  format: {
    type: 'enum',
    choices: ['json', 'yaml', 'toml'],
    description: 'Output format'
  }
}
```

#### `default` (optional)

Default value used when the argument is not provided. The type must match the argument's `type` property.

<!-- eslint-skip -->

```js
{
  host: {
    type: 'string',
    default: 'localhost'  // string default
  },
  verbose: {
    type: 'boolean',
    default: false        // boolean default
  },
  port: {
    type: 'number',
    default: 8080         // number default
  },
  level: {
    type: 'enum',
    choices: ['low', 'high'],
    default: 'low'        // must be in choices
  }
}
```

#### `toKebab` (optional)

Converts the argument name from camelCase to kebab-case for CLI usage. A property like `maxCount` becomes available as `--max-count`.

<!-- eslint-skip -->

```js
{
  maxRetries: {
    type: 'number',
    toKebab: true,        // Accessible as --max-retries
    description: 'Maximum retry attempts'
  },
  enableLogging: {
    type: 'boolean',
    toKebab: true         // Accessible as --enable-logging
  }
}
```

#### `parse` (optional)

Custom parsing function for `type: 'custom'` arguments. Required when `type: 'custom'`. Should throw an Error if parsing fails.

<!-- eslint-skip -->

```js
{
  config: {
    type: 'custom',
    parse: (value) => {
      try {
        return JSON.parse(value)  // Parse JSON config
      } catch {
        throw new Error('Invalid JSON configuration')
      }
    },
    description: 'JSON configuration object'
  },
  date: {
    type: 'custom',
    parse: (value) => {
      const date = new Date(value)
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date format')
      }
      return date
    }
  }
}
```

## 🙌 Contributing guidelines

If you are interested in contributing to `args-tokens`, I highly recommend checking out [the contributing guidelines](/CONTRIBUTING.md) here. You'll find all the relevant information such as [how to make a PR](/CONTRIBUTING.md#pull-request-guidelines), [how to setup development](/CONTRIBUTING.md#development-setup)) etc., there.

## 💖 Credits

This project is inspired by:

- [`util.parseArgs`](https://nodejs.org/api/util.html#utilparseargsconfig), created by Node.js contributors and [OpenJS Foundation](https://openjsf.org/)
- [`pkgjs/parseargs`](https://github.com/pkgjs/parseargs), created by Node.js CLI package maintainers and Node.js community.

## 🤝 Sponsors

The development of Gunish is supported by my OSS sponsors!

<p align="center">
  <a href="https://cdn.jsdelivr.net/gh/kazupon/sponsors/sponsors.svg">
    <img alt="sponsor src='https://cdn.jsdelivr.net/gh/kazupon/sponsors/sponsors.svg'/>
  </a>
</p>

## ©️ License

[MIT](http://opensource.org/licenses/MIT)

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/args-tokens?style=flat
[npm-version-href]: https://npmjs.com/package/args-tokens
[jsr-src]: https://jsr.io/badges/@kazupon/args-tokens
[jsr-href]: https://jsr.io/@kazupon/args-tokens
[install-size-src]: https://pkg-size.dev/badge/install/35082
[install-size-href]: https://pkg-size.dev/args-tokens
[ci-src]: https://github.com/kazupon/args-tokens/actions/workflows/ci.yml/badge.svg
[ci-href]: https://github.com/kazupon/args-tokens/actions/workflows/ci.yml
