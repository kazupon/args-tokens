# args-tokens

[![Version][npm-version-src]][npm-version-href]
[![CI][ci-src]][ci-href]

> [`parseArgs` tokens](https://nodejs.org/api/util.html#parseargs-tokens) compatibility and more high-performance parser

> [!WARNING]
> WIP, please don't use still this package.

## 🐱 Motivation

- Although Node.js's [`parseArgs`](https://nodejs.org/api/util.html#utilparseargsconfig) can return tokens, tokens that the shot options are not in the format I expect. Of course, I know the background of [this issue](https://github.com/pkgjs/parseargs/issues/78).
- `parseArgs` gives the command line args parser a useful util, so the resolution of the options values and the parsing of the tokens are tightly coupled. As a result, Performance is sacrificed. Of course, I know that's a trade-off.

## ⏱️ Benchmark

```
pnpm bench

> args-tokens@0.0.0 bench /path/to/projects/args-tokens
> node --expose-gc bench/index.mjs

clk: ~2.87 GHz
cpu: Apple M1 Max
runtime: node 18.19.1 (arm64-darwin)

benchmark                   avg (min … max) p75 / p99    (min … top 1%)
------------------------------------------- -------------------------------
node:util parseArgs            4.69 µs/iter   4.76 µs      ▂     ▂  █
                        (4.49 µs … 4.93 µs)   4.86 µs    ▅▅█▅ ▅  █ ▅█▅ ▅▅ ▅
                    (  1.32 kb …   1.48 kb)   1.33 kb ▇▇▇████▁█▁▇█▁███▁██▁█

args-tokens parseArgs        832.79 ns/iter 867.22 ns          ▆  █▂
                    (727.04 ns … 955.02 ns) 934.01 ns      ██▇██▅▆███▅▇▂
                    (  3.02 kb …   3.32 kb)   3.05 kb ▃▆▄▇██████████████▃▂▄

                             ┌                                            ┐
         node:util parseArgs ┤■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ 4.69 µs
       args-tokens parseArgs ┤ 832.79 ns
                             └                                            ┘
```

## 🚀 Usage

TODO:

## 🙌 Contributing guidelines

TODO:

## 💖 Credits

This project is inspired by:

- [`utils.parseArgs`](https://nodejs.org/api/util.html#utilparseargsconfig), created by Node.js contributors and [OpenJS Foundation](https://openjsf.org/)
- [`pkgjs/parseargs`](https://github.com/pkgjs/parseargs), created by Node.js CLI package maintainers and Node.js community.

## ©️ License

[MIT](http://opensource.org/licenses/MIT)

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/args-tokens?style=flat
[npm-version-href]: https://npmjs.com/package/args-tokens
[ci-src]: https://github.com/kazupon/args-tokens/actions/workflows/ci.yml/badge.svg
[ci-href]: https://github.com/kazupon/args-tokens/actions/workflows/ci.yml
