# args-tokens

[![Version][npm-version-src]][npm-version-href]
[![JSR][jsr-src]][jsr-href]
[![CI][ci-src]][ci-href]

> [`parseArgs` tokens](https://nodejs.org/api/util.html#parseargs-tokens) compatibility and more high-performance parser

## 🐱 Motivation

- Although Node.js [`parseArgs`](https://nodejs.org/api/util.html#utilparseargsconfig) can return tokens, that the short options are not in the format I expect. Of course, I recoginize the background of [this issue](https://github.com/pkgjs/parseargs/issues/78).
- `parseArgs` gives the command line args parser a useful util, so the resolution of the options values and the parsing of the tokens are tightly coupled. As a result, Performance is sacrificed. Of course, I recoginize that's the trade-off.

## ⏱️ Benchmark

With [mitata](https://github.com/evanwashere/mitata):

```
pnpm bench:mitata

> args-tokens@0.0.0 bench:mitata /path/to/projects/args-tokens
> node --expose-gc bench/index.mjs

clk: ~2.87 GHz
cpu: Apple M1 Max
runtime: node 18.19.1 (arm64-darwin)

benchmark                   avg (min … max) p75 / p99    (min … top 1%)
------------------------------------------- -------------------------------
node:util parseArgs            4.69 µs/iter   4.78 µs      █ █     ██
                        (4.49 µs … 4.91 µs)   4.85 µs    █ █ ██ █  ██  ███
                    (  1.32 kb …   1.49 kb)   1.33 kb █▁██▁██████▁█████████

args-tokens parseArgs        842.98 ns/iter 882.65 ns     ▄▄▄▇▃ ▄▃ █
                    (734.10 ns … 984.32 ns) 966.06 ns   ▂▄█████▄████▅▅▄
                    (  3.11 kb …   3.41 kb)   3.12 kb █▂███████████████▆▆▆▂

                             ┌                                            ┐
         node:util parseArgs ┤■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ 4.69 µs
       args-tokens parseArgs ┤ 842.98 ns
                             └                                            ┘
```

With [vitest](https://vitest.dev/guide/features.html#benchmarking):

```
pnpm bench:vitest

> args-tokens@0.0.0 bench:vitest /path/to/projects/args-tokens
> vitest bench --run

Benchmarking is an experimental feature.
Breaking changes might not follow SemVer, please pin Vitest's version when using it.

 RUN  v3.0.5 /path/to/projects/args-tokens


 ✓ bench/vitest.bench.mjs > parseArgs 1466ms
     name                   hz     min     max    mean     p75     p99    p995    p999     rme  samples
   · node:util      194,911.34  0.0042  0.6821  0.0051  0.0046  0.0151  0.0292  0.1079  ±0.82%    97456
   · args-tokens  1,101,845.21  0.0007  0.1883  0.0009  0.0009  0.0012  0.0031  0.0140  ±0.32%   550923   fastest

 BENCH  Summary

  args-tokens - bench/vitest.bench.mjs > parseArgs
    5.65x faster than node:util
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

## 🙌 Contributing guidelines

If you are interested in contributing to `args-tokens`, I highly recommend checking out [the contributing guidelines](/CONTRIBUTING.md) here. You'll find all the relevant information such as [how to make a PR](/CONTRIBUTING.md#pull-request-guidelines), [how to setup development](/CONTRIBUTING.md#development-setup)) etc., there.

## 💖 Credits

This project is inspired by:

- [`util.parseArgs`](https://nodejs.org/api/util.html#utilparseargsconfig), created by Node.js contributors and [OpenJS Foundation](https://openjsf.org/)
- [`pkgjs/parseargs`](https://github.com/pkgjs/parseargs), created by Node.js CLI package maintainers and Node.js community.

## ©️ License

[MIT](http://opensource.org/licenses/MIT)

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/args-tokens?style=flat
[npm-version-href]: https://npmjs.com/package/args-tokens
[jsr-src]: https://jsr.io/badges/@kazupon/args-tokens
[jsr-href]: https://jsr.io/@kazupon/args-tokens
[ci-src]: https://github.com/kazupon/args-tokens/actions/workflows/ci.yml/badge.svg
[ci-href]: https://github.com/kazupon/args-tokens/actions/workflows/ci.yml
