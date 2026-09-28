# args-tokens

[![Version][npm-version-src]][npm-version-href] [![JSR][jsr-src]][jsr-href] [![InstallSize][install-size-src]][install-size-href] [![CI][ci-src]][ci-href]

> [`parseArgs` tokens](https://nodejs.org/api/util.html#parseargs-tokens) compatibility and more high-performance parser

## ✨ Features

- ✅ High performance
- ✅ `util.parseArgs` token compatibility
- ✅ ES Modules and modern JavaScript
- ✅ Type safe
- ✅ Zero dependencies
- ✅ Universal runtime

## 🐱 Motivation

- Although Node.js [`parseArgs`](https://nodejs.org/api/util.html#utilparseargsconfig) can return tokens, the short options are not in the format I expect. Of course, I recognize the background of [this issue](https://github.com/pkgjs/parseargs/issues/78).
- `parseArgs` gives the command line args parser a useful util, so the resolution of the options values and the parsing of the tokens are tightly coupled. As a result, performance is sacrificed. Of course, I recognize that's the trade-off.

## ⏱️ Benchmark

With [mitata](https://github.com/evanwashere/mitata):

```sh
pnpm bench:mitata

> args-tokens@0.28.1 bench:mitata /path/to/projects/args-tokens
> node --expose-gc bench/mitata.js

clk: ~4.43 GHz
cpu: Apple M5
runtime: node 24.21.0 (arm64-darwin)

benchmark                                       avg (min … max) p75 / p99    (min … top 1%)
--------------------------------------------------------------- -------------------------------
util.parseArgs                                     2.50 µs/iter   2.51 µs    █ ▅  █
                                            (2.48 µs … 2.58 µs)   2.53 µs █ ██▆██ █▆▃█▃
                                        (  9.28 kb …  10.86 kb)   9.35 kb █▄███████████▄█▄▄▁▄▁▄

args-tokens parse (equivalent to util.parseArgs)   1.24 µs/iter   1.25 µs      █▄
                                            (1.22 µs … 1.62 µs)   1.29 µs      ██▆▆▃
                                        (  9.09 kb …  11.72 kb)   9.72 kb ▅▆▅███████▇▆▅▃▄▃▃▂▁▁▂

args-tokens parseArgs                            415.76 ns/iter 418.23 ns      █▇
                                        (400.56 ns … 621.51 ns) 454.51 ns  ▆▆████▃
                                        (  2.38 kb …   3.41 kb)   3.11 kb ▄█████████▄▃▄▂▂▂▁▁▁▁▁

args-tokens resolveArgs                          681.50 ns/iter 686.90 ns      ██
                                        (665.58 ns … 721.56 ns) 711.80 ns  ▂▃██████▃▂
                                        (  5.69 kb …   5.70 kb)   5.70 kb ▃███████████▇█▆▃▂▁▁▂▂

                                                 ┌                                            ┐
                                  util.parseArgs ┤■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ 2.50 µs
args-tokens parse (equivalent to util.parseArgs) ┤■■■■■■■■■■■■■■ 1.24 µs
                           args-tokens parseArgs ┤ 415.76 ns
                         args-tokens resolveArgs ┤■■■■ 681.50 ns
                                                 └                                            ┘
```

With [vitest](https://vitest.dev/guide/features.html#benchmarking):

```sh
pnpm bench:vitest

> args-tokens@0.28.1 bench:vitest /path/to/projects/args-tokens
> vitest bench --run

Benchmarking is an experimental feature.
Breaking changes might not follow SemVer, please pin Vitest's version when using it.

 RUN  v4.1.10 /path/to/projects/args-tokens


 ✓ bench/vitest.bench.js > parse and resolve 1317ms
     name                       hz     min     max    mean     p75     p99    p995    p999     rme  samples
   · util.parseArgs     357,054.25  0.0025  4.1868  0.0028  0.0027  0.0047  0.0074  0.0165  ±1.65%   178528
   · args-tokens parse  680,868.68  0.0013  0.5087  0.0015  0.0015  0.0018  0.0020  0.0050  ±0.25%   340435   fastest

 ✓ bench/vitest.bench.js > parseArgs 1472ms
     name                   hz     min     max    mean     p75     p99    p995    p999     rme  samples
   · node:util      378,644.21  0.0023  3.3124  0.0026  0.0026  0.0038  0.0044  0.0113  ±1.30%   189323
   · args-tokens  2,101,754.57  0.0003  5.5610  0.0005  0.0004  0.0012  0.0013  0.0124  ±2.20%  1050878   fastest

 BENCH  Summary

  args-tokens parse - bench/vitest.bench.js > parse and resolve
    1.91x faster than util.parseArgs

  args-tokens - bench/vitest.bench.js > parseArgs
    5.55x faster than node:util

```

## ❓ What's different about `parseArgs` tokens?

A value in a short option group is read differently: for `-a=1`, args-tokens gives the option `-a` and its value `1`, while `node:util` reads `=` and `1` as options.

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

// [
//   {
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
//   }
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

With `allowCompatible: true`, `parseArgs()` gives the same tokens as `parseArgs` of `node:util` gives without option definitions.

<details>
<summary>A value after <code>=</code> in a short option group</summary>

When short options are written with `=`, such as `-p=-5` or `-ab=-1`:

- The rest of the argument is a value token after the last option, even when it starts with `-`: `-n=--` gives `-n` the value `--`, not the option terminator.
- `-p=` gives an empty value, as `--port=` does.
- A `=` at the start of a group has no option before it, so it is an option name, as `-=` alone is: `-=5` gives the options `-=` and `-5`, as `node:util` does, and `-==5` gives `-=` the value `5`.
- With `shortGrouping: true`, `resolveArgs()` gives the value after `=` to the last option.
- With `shortGrouping: false`, the default of `resolveArgs()` and `parse()`, the other letters of the group are the value of its first option, as in `-p5`: `-ab=-1` gives `-a` the value `b=-1`.

</details>

<details>
<summary>A <code>-</code> inside a short option group</summary>

A `-` inside a group, as in `-o-` or `-p-5`, does not end the options:

- The rest of the group from the `-` is the value of the option before it, in a value token with `inlineValue: false`, since no `=` is written. So `-o- input.txt` gives `-o` the value `-`, and `input.txt` is read as usual.
- Unlike `node:util`, where `inlineValue: false` means that the value is the next argument, this value token is in the same argument and has its `index`.
- With `shortGrouping: false`, `resolveArgs()` gives the first option the other letters and that value, as in `-Wno-unused` (`no-unused`) and `-ab-c` (`-a` gets `b-c`). With `shortGrouping: true`, the last option gets it.
- A boolean option ignores such a value, as it ignores `false` in `-sfalse`.
- `allowCompatible: true` keeps the `node:util` tokens, where the `-` becomes the option terminator.

</details>

## 💿 Installation

```sh
# npm
npm install args-tokens

# yarn
yarn add args-tokens

# pnpm
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

`parseArgs` will transform arguments into tokens. This function is useful if you want to analyze arguments yourself based on the tokens. It's faster than `parseArgs` of `node:util` because it only focuses on token transformation.

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

Besides `values` and `positionals`, `resolveArgs` returns `rest`, the arguments after the option terminator `--` (unlike `parseArgs` of `node:util`, they are not in `positionals`), `error`, the validation failures described in “Validation errors” below, and `explicit`, which is `true` for each argument given on the command line.

## Convenient argument parsing

Using the `parse` you can transform the arguments into tokens and resolve the argument values at once:

```js
import { parse } from 'args-tokens' // for Node.js and Bun
// import { parse } from 'jsr:@kazupon/args-tokens' // for Deno

const args = ['dev', '-p=9131', '--host=example.com', '--mode=production']
const { values, positionals } = parse(args, {
  args: {
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

`parse` also takes the options of `parseArgs` and `resolveArgs`, such as `allowCompatible`, `shortGrouping`, `skipPositional` and `toKebab`, and they work as they do there. It returns what `resolveArgs` returns, and the `tokens`. Without `args`, it uses a schema with the `boolean` options `help` (`-h`) and `version` (`-v`).

## Validation errors

`resolveArgs` and `parse` return validation failures as an `AggregateError` in the `error` field. Each argument validation failure is an `ArgsValidationError`, which has an English `message` as a fallback, and a `code` and `values` for localization or custom rendering.

Use `isArgsValidationError()` to narrow individual errors:

```js
import { ArgsValidationErrorKeys, isArgsValidationError, parseArgs, resolveArgs } from 'args-tokens'

const tokens = parseArgs(['--port=abc'])
const { error } = resolveArgs(
  {
    port: {
      type: 'number',
      required: true
    }
  },
  tokens
)

for (const cause of error?.errors ?? []) {
  if (!isArgsValidationError(cause)) {
    continue
  }

  if (cause.code === ArgsValidationErrorKeys.invalidType) {
    console.log(cause.message) // Optional argument '--port' should be 'number'
    console.log(cause.values)
    // {
    //   displayName: "'--port'",
    //   name: 'port',
    //   expected: 'number',
    //   actual: 'abc'
    // }
  }
}
```

The resolver uses stable error codes for required options, required positionals, options given without a value, invalid types, invalid choices, custom parse failures, values given to options that do not take one, arguments that conflict, and defaults of `enum` options that are not one of their choices. The `values` object contains interpolation data such as `name`, `displayName`, `rawName`, `expected`, `actual`, `choices`, `choiceValues`, `reason`, `next`, `suggestion`, `conflictName`, and `conflictDisplayName` depending on the error kind. The `values` of `ArgsValidationErrorKeys.invalidDefault` have the same keys as those of `ArgsValidationErrorKeys.invalidChoice`, with the default as `actual`. An option that is not in the schema is not reported: `resolveArgs` and `parse` never report `ArgsValidationErrorKeys.unknownOption`. It takes the argument after it as its value, unless that argument is an option, and the value is dropped: with no `foo` in the schema, `--foo bar` gives no positional argument.

An option that takes a value reports `ArgsValidationErrorKeys.missingValue` when it is given without one, including a required option. The tokens are made without the schema, as `node:util` `parseArgs` makes them without option definitions, so `--port -5` is read as `--port` followed by the option `-5`, and a value that starts with `-`, other than `-` alone, has to be written with `=` or attached to a short option, such as `--port=-5`, `-p=-5` or `-p-5`.

<details>
<summary>The suggestion for a value that starts with <code>-</code></summary>

When the option ends its argument and the next argument is one long option or a group of short options, such as `-5`, `-5.5` or `--foo`, that are not all in the schema, the error has `next` (`'-5'`) and `suggestion` (`'--port=-5'`) in `values`, and the message suggests that form. The long form is suggested because it passes such a value in every mode, including `allowCompatible: true`, where `-p=-5` and `-p-5` do not. With `shortGrouping: false`, the default of `resolveArgs()` and `parse()`, only the first letter of a group is an option, and the other letters are its value (a boolean ignores them), so a group whose first letter is in the schema, such as `-p5` or `-vfoo`, gets no suggestion. For `--port -5`, with `port: { type: 'number' }`, the message is:

```
Optional argument '--port' requires a value (to pass '-5' as its value, write '--port=-5')
```

`next`, `suggestion` and the hint in the message are given only when the option can take that value, as far as args-tokens can tell. A `number` option gets them only for a numeric value, and an `enum` option with `choices` only for one of the choices, with or without a `parse` function. So `--port -x` gets no suggestion, and neither does `--level -x` for an `enum` option with `choices: ['debug', 'info']`.

The `parse` functions of `string()`, `number()`, `integer()`, `float()` and `choice()` have no side effects, so they are also called with the value to check it: `--count -x` gets no suggestion for `integer()`, `--count -5` does, and `--port -5` gets none for `number({ min: 1 })`. A `parse` function of your own, such as one given to `combinator()`, is never called with a value that the option was not given, and neither is a `map()` transform. An option with such a function is checked by its type or `choices` only: a `number` option or an `enum` option with `choices` gets the suggestion as above, so `--port -5` still gets `--port=-5` for `map(number({ min: 1 }), n => n)`, and any other option gets none. A `string()` whose `pattern` has the `g` or `y` flag is treated the same way, since `test` moves the `lastIndex` of such a pattern.

</details>

<details>
<summary>A <code>parse</code> function that throws</summary>

When a custom `parse` function throws, args-tokens wraps the failure as `ArgsValidationErrorKeys.customParse` and preserves the thrown value as `cause`. If the `parse` function throws an `ArgsValidationError`, it is reused without double wrapping: a missing `name` or `displayName` in its `values` is filled in, and so is a missing `actual` when its `code` is `ArgsValidationErrorKeys.invalidType` or `ArgsValidationErrorKeys.invalidChoice`. When that update fails, for example because its `values` object is frozen, the thrown error is wrapped like any other thrown value.

</details>

<details>
<summary><code>ArgResolveError</code> and conflicts</summary>

`ArgResolveError` extends `ArgsValidationError`, so it has `code` and `values` too, besides its `type` (`'type'`, `'required'` or `'conflict'`) and `schema`. `.name` is the name of the argument on the command line, without the leading dashes and in kebab-case with `toKebab` (`input-file` for the schema key `inputFile`), for every `type` of `ArgResolveError`, `'conflict'` included, while `values.name` is the schema key.

A conflict is reported as `ArgsValidationErrorKeys.conflict`. Its `values` has the `displayName` and `name` of the argument whose `conflicts` names the other one, and the `conflictDisplayName` and `conflictName` of the other one. When both name each other, `name` is the one that comes first in the schema. `displayName` and `conflictDisplayName` show an option as it was written, as in the message: with `short: 'p'` and `short: 's'`, `-p 80 -s /run/app.sock` gives `"'-p'"` and `"'-s'"`. A positional argument is shown by its name, as in its other errors, such as `"'file'"` (in kebab-case with `toKebab`). `name` and `conflictName` are the schema keys.

</details>

<details>
<summary><code>isArgsValidationError()</code> across bundled copies of args-tokens</summary>

Since 0.29.0, `isArgsValidationError()` works across bundled copies of `args-tokens`. Each error instance carries a non-enumerable brand keyed by `Symbol.for('args-tokens.ArgsValidationError')`, so the guard recognizes errors created by another copy of the library, for example when a host and a plugin each bundle `args-tokens`, even though `instanceof` does not match. Every copy involved must be 0.29.0 or later, because older versions neither set nor check the brand. The guard does not depend on `error.name`, which `ArgResolveError` overrides with the argument name. It narrows only to `ArgsValidationError`: across copies, `instanceof ArgResolveError` still fails, so do not rely on `type` or `schema` for errors that may come from another copy.

</details>

## Node.js `parseArgs` tokens compatible

If you want the same tokens as Node.js `parseArgs` returns without option definitions, use the `allowCompatible` option of `parseArgs`:

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
const tokens = parseArgs(args, { allowCompatible: true }) // add `allowCompatible` option

// validate
deepStrictEqual(tokensNode, tokens)
```

## `ArgSchema` Reference

The `ArgSchema` interface defines the configuration for command-line arguments. This schema is similar to Node.js `util.parseArgs` but with extended features.

### Schema Properties

#### `type` (required)

Type of the argument value:

- `'string'`: Text value
- `'boolean'`: True/false flag (can be negatable with `--no-` prefix). `--flag=true` and `--flag=false` set the value explicitly; any other value after `=` is an error with the code `ArgsValidationErrorKeys.invalidType`
- `'number'`: Numeric value (parsed as integer or float)
- `'enum'`: One of predefined string values (requires `choices` property, unless the argument has a `parse` function)
- `'positional'`: Non-option argument by position
- `'custom'`: Custom parsing with user-defined `parse` function

Any other `type`, or no `type`, is a mistake that only untyped code can make: if the argument has no `parse` function, `resolveArgs()` and `parse()` throw an `Error`, whether or not the argument is given.

<!-- eslint-skip -->

```js
{
  name: { type: 'string' },        // --name value
  verbose: { type: 'boolean' },     // --verbose (--no-verbose needs negatable: true)
  port: { type: 'number' },         // --port 3000
  level: { type: 'enum', choices: ['debug', 'info'] },
  file: { type: 'positional' },     // first positional arg
  config: { type: 'custom', parse: JSON.parse }
}
```

#### `short` (optional)

Single character alias for the long option name. Allows users to use `-x` instead of `--extended-option`. It is only for options, not for positional arguments.

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

#### `hidden` (optional)

Hides the argument from generated help or usage output. This is renderer metadata only; parsing, validation, defaults, conflicts, and resolved values are unchanged.

<!-- eslint-skip -->

```js
{
  legacy: {
    type: 'string',
    hidden: true,
    description: 'Deprecated compatibility option'
  },
  internal: {
    type: 'boolean',
    hidden: true,
    description: 'Internal diagnostic flag'
  }
}
```

#### `metavar` (optional)

Display name hint for the value of the argument in help text, such as `integer` in `--port <integer>`. Particularly useful for `type: 'custom'` arguments, where the type name would otherwise be unhelpful. For a `custom` option that is given without a value, it is also the `expected` in the `values` of the `ArgsValidationErrorKeys.missingValue` error, which is `'custom'` without it.

<!-- eslint-skip -->

```js
{
  port: {
    type: 'custom',
    parse: (value) => parseInt(value, 10),
    metavar: 'integer',
    description: 'Port number (1-65535)'
  }
}
```

#### `required` (optional)

Marks the argument as required. When `true`, the argument must be provided. When it is missing, the error is an `ArgResolveError` with `type: 'required'` and the code `ArgsValidationErrorKeys.requiredOption`, or `ArgsValidationErrorKeys.requiredPositional` for a positional argument.

For single-value positional arguments, omitting `required` keeps the argument required for compatibility, unless it has a `default`, which makes it optional. A `multiple` positional argument is optional unless `required: true` is set. Set `required: false` to make a positional argument explicitly optional.

For the `values` of the error, an option given without a value or with an explicit empty value, and how an optional positional argument leaves values for later required ones, see [`ArgSchema`](./docs/default/interfaces/ArgSchema.md#properties) in the API references.

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
  },
  query: {
    type: 'positional',
    required: false  // May be omitted, for example when the command reads stdin
  }
}
```

#### `multiple` (optional)

Allows the argument to accept multiple values. The resolved value becomes an array. When the argument is not given and has no `default`, its value is `undefined`, not an empty array.

- For options: can be specified multiple times (`--tags foo --tags bar`)
- For positional: collects remaining positional arguments after preserving values for later required positional arguments

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
    multiple: true   // a.txt b.txt out.txt → ['a.txt', 'b.txt']
  },
  output: {
    type: 'positional' // a.txt b.txt out.txt → 'out.txt', left for this required argument
  }
}
```

#### `negatable` (optional)

Enables negation for boolean arguments using `--no-` prefix. Only applicable to `type: 'boolean'`. The negated name is always `no-` followed by the full option name. An option named `no-cache` is negated by `--no-no-cache`, and `--no-cache` sets it to `true`. The negated form does not take a value: `--no-color=false` is reported as an error with the code `ArgsValidationErrorKeys.unexpectedValue`.

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

Array of allowed string values for enum-type arguments. Required when `type: 'enum'`, unless the argument has a `parse` function: if `choices` is missing or not an array, `resolveArgs()` and `parse()` throw a `TypeError`, whether or not the argument is given. With a `parse` function and no `choices`, the value is passed to the function as for a `string` argument with a `parse` function.

The value given on the command line is checked before `parse`, so `parse` receives only one of the choices. Any other value is reported as an `ArgResolveError` with `type: 'type'` and the code `ArgsValidationErrorKeys.invalidChoice`.

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

Default value used when the argument is not provided. An option that is given without a value, or with a value that is rejected, also gets its default, along with the error. The type must match the argument's `type` property.

The default is used as is. It does not go through `parse`. The value of a `multiple` argument is an array, so its default becomes the only element of the array: `default: 'latest'` gives `['latest']`.

For an explicit empty value, the default of an `enum` option that is not one of its choices, and the default of a positional argument, see [`ArgSchema`](./docs/default/interfaces/ArgSchema.md#properties) in the API references.

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
  },
  command: {
    type: 'positional',
    default: 'help'       // positional default
  }
}
```

#### `toKebab` (optional)

Converts the argument name from camelCase to kebab-case for CLI usage. A property like `maxCount` becomes available as `--max-count`. `--maxCount` is then an option that is not in the schema, and the key in `values` stays `maxCount`. The `toKebab` option of `resolveArgs()` and `parse()` applies it to all arguments.

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

Custom parsing function. Required when `type: 'custom'`: if it is missing or not a function, `resolveArgs()` and `parse()` throw a `TypeError`, whether or not the argument is given. An argument of another type uses it too, in place of its own parsing. The function should throw an Error if parsing fails.

`parse` receives the value from the command line, or `'true'` / `'false'` for a `boolean` option. It is called synchronously, and what it returns becomes the value, even `undefined` or `null`, so throw to reject a value.

For an `async` function, an option given without a value or with an explicit empty value, and an `enum` option with `choices`, see [`ArgSchema`](./docs/default/interfaces/ArgSchema.md#properties) in the API references.

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

#### `conflicts` (optional)

Specifies other options that cannot be used together with this option. When conflicting options are provided together, the error is an `ArgResolveError` with `type: 'conflict'` and the code `ArgsValidationErrorKeys.conflict`.

Conflicts only need to be defined on one side - if option A defines a conflict with option B, the conflict is automatically detected when both are used. The names in `conflicts` are the schema keys, such as `inputFile`, not the kebab-case names of `toKebab`. The error names first the argument whose `conflicts` names the other one, or, when both name each other, the one that comes first in the schema.

A positional argument can also be on either side, such as `[file]` and `--stdin`. It conflicts when it is given, and the error shows it by its name, in kebab-case with `toKebab`. The message starts with the kind of the argument named first: `Positional argument 'file' conflicts with '--stdin'` or `Optional argument '--stdin' conflicts with 'file'`.

<!-- eslint-skip -->

```js
{
  // Single conflict
  port: {
    type: 'number',
    conflicts: 'socket'  // Cannot use --port with --socket
  },
  socket: {
    type: 'string'
    // No need to define conflicts: 'port' here
  }
}

// Multiple conflicts (mutually exclusive options)
{
  tcp: {
    type: 'number',
    conflicts: ['udp', 'unix']  // Cannot use with --udp or --unix
  },
  udp: {
    type: 'number',
    conflicts: ['tcp', 'unix']
  },
  unix: {
    type: 'string',
    conflicts: ['tcp', 'udp']
  }
}

// A positional argument and an option
{
  file: {
    type: 'positional',
    required: false,
    conflicts: 'stdin'  // Cannot give [file] with --stdin
  },
  stdin: {
    type: 'boolean'
  }
}
```

## 🧪 Parser Combinators

Parser combinators provide composable factory functions that generate `ArgSchema` objects. Instead of writing schema objects manually, you can use combinators for type-safe, composable argument definitions.

### Basic Usage

<!-- eslint-skip -->

```js
import { parseArgs, resolveArgs } from 'args-tokens'
import {
  args,
  string,
  integer,
  boolean,
  positional,
  withDefault,
  required,
  short,
  merge
} from 'args-tokens/combinators'

// Define reusable schema groups with args()
const common = args({
  help: short(boolean(), 'h'),
  verbose: boolean()
})

const network = args({
  port: short(withDefault(integer({ min: 1, max: 65535 }), 8080), 'p'),
  host: required(short(string({ minLength: 1 }), 'o'))
})

// Compose schemas with merge()
const schema = merge(
  common,
  network,
  args({
    command: positional()
  })
)

const argv = ['dev', '--port', '9131', '--host', 'example.com', '--verbose']
const tokens = parseArgs(argv)
const { values } = resolveArgs(schema, tokens)
// values → { verbose: true, port: 9131, host: 'example.com', command: 'dev' }
```

### Available Combinators

#### Base Combinators

- `string(opts?)` — String with optional validation (`minLength`, `maxLength`, `pattern`)
- `number(opts?)` — Number with optional range (`min`, `max`)
- `integer(opts?)` — Integer only, with optional range
- `float(opts?)` — Float with optional range, rejects `NaN`/`Infinity`
- `boolean(opts?)` — Boolean flag, supports `negatable`
- `positional(opts?)` — Positional argument (resolves to string), which the modifiers take, as in `multiple(positional())`
- `positional(parser)` — Typed positional (e.g., `positional(integer())`), which keeps `required`, `default` and `multiple` of the parser
- `unrequired(positional())` — Explicitly optional positional argument
- `choice(values, opts?)` — Enum-like with literal type inference

Each base combinator also takes the common options `description`, `short`, `hidden` and `required` (for `choice()`, in its second argument), which set the same properties as `describe()`, `short()`, `hidden()` and `required()`. `short` has no effect on a positional argument. `combinator()` takes them in its configuration too.

A literal `required: true` or `required: false` in the options is kept in the type: `integer({ required: true })` types the value as present, as `required(integer())` does, and `positional({ required: false })` and `positional(integer({ required: false }))` are optional. So is a positional argument whose `required` may be `false`, such as `positional(integer({ required: flag }))` for a `flag` of type `boolean`, or `positional(string(optional ? { required: false } : {}))`, and so is one with a `required: true` that TypeScript widens to `boolean`, as in `const options = { required: true }`: write such options `as const`. Options whose type only says that `required` is a `boolean` that may be missing, such as `optional ? { required: flag } : {}` or the options that a helper typed `<T extends IntegerOptions>(options: T)` passes on, keep the positional argument typed as present: use `unrequired()` when it may be missing. `positional(multiple(integer()))` resolves to an array, as `multiple(positional(integer()))` does.

#### Modifier Combinators

- `describe(schema, text)` — Set a human-readable description for help text generation
- `short(schema, alias)` — Set a single-character short alias (e.g., `-v` for `--verbose`)
- `hidden(schema)` — Hide from generated help or usage output
- `required(schema)` — Mark as required (error if not provided)
- `unrequired(schema)` — Mark as not required (override `required: true`, or make a positional optional)
- `withDefault(schema, defaultValue)` — Set a default value of the schema's type, which must be a string, number or boolean
- `multiple(schema)` — Accept multiple values (resolves to array)
- `map(schema, transform)` — Transform the parsed value. A default set before `map()` is not transformed, so set it after, as in `withDefault(map(integer(), n => n * 2), 10)`

Each modifier keeps what earlier modifiers set, so `short(multiple(string()), 't')` resolves to an array of strings, as `multiple(short(string(), 't'))` does.

#### Schema Combinators

- `args(fields)` — Type-safe schema factory (no `satisfies Args` needed)
- `merge(...schemas)` — Compose multiple schemas into one, where a later schema wins on a key conflict
- `extend(base, overrides)` — Override or add fields to a schema

#### Custom Combinators

- `combinator(config)` — Custom argument with user-defined `parse` function (uses `type: 'custom'`)

<!-- eslint-skip -->

```js
import { parseArgs, resolveArgs } from 'args-tokens'
import { combinator, required, withDefault, multiple, short, map } from 'args-tokens/combinators'

// Date parser
const date = combinator({
  parse: value => {
    const d = new Date(value)
    if (isNaN(d.getTime())) {
      throw new Error('Invalid date format')
    }
    return d
  },
  metavar: 'date'
})

// JSON parser
const json = combinator({
  parse: value => {
    try {
      return JSON.parse(value)
    } catch {
      throw new Error('Invalid JSON')
    }
  },
  metavar: 'json'
})

// Day of the week of a date in UTC, 0 for Sunday
const weekday = map(date, d => d.getUTCDay())

// Compose with modifier combinators
const schema = {
  since: required(date), // --since 2024-01-15 (required)
  until: date, // --until 2024-12-31 (optional)
  config: short(json, 'c'), // -c '{"key":"value"}' or --config '...'
  timestamps: multiple(date), // --timestamps 2024-01-01 --timestamps 2024-06-01
  days: withDefault(weekday, 0) // --days 2024-01-15 → 1 (Monday), 0 without it
}

const tokens = parseArgs(['--since', '2024-01-15', '--days', '2024-01-15'])
const { values } = resolveArgs(schema, tokens)
// values.since → Date object
// values.days → 1
```

## 📚 API References

See the [API References](./docs/index.md).

## 🙌 Contributing guidelines

If you are interested in contributing to `args-tokens`, I highly recommend checking out [the contributing guidelines](/CONTRIBUTING.md) here. You'll find all the relevant information such as [how to make a PR](/CONTRIBUTING.md#pull-request-guidelines), [how to set up development](/CONTRIBUTING.md#development-setup) etc., there.

## 💖 Credits

This project is inspired by:

- [`util.parseArgs`](https://nodejs.org/api/util.html#utilparseargsconfig), created by Node.js contributors and [OpenJS Foundation](https://openjsf.org/)
- [`pkgjs/parseargs`](https://github.com/pkgjs/parseargs), created by Node.js CLI package maintainers and Node.js community.

## 🤝 Sponsors

The development of `args-tokens` is supported by my OSS sponsors!

<p align="center">
  <a href="https://cdn.jsdelivr.net/gh/kazupon/sponsors/sponsors.svg">
    <img alt="sponsor" src="https://cdn.jsdelivr.net/gh/kazupon/sponsors/sponsors.svg"/>
  </a>
</p>

## ©️ License

[MIT](https://opensource.org/license/MIT)

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/args-tokens?style=flat
[npm-version-href]: https://npmjs.com/package/args-tokens
[jsr-src]: https://jsr.io/badges/@kazupon/args-tokens
[jsr-href]: https://jsr.io/@kazupon/args-tokens
[install-size-src]: https://img.shields.io/npm/unpacked-size/args-tokens?style=flat
[install-size-href]: https://pkg-size.dev/args-tokens
[ci-src]: https://github.com/kazupon/args-tokens/actions/workflows/ci.yml/badge.svg
[ci-href]: https://github.com/kazupon/args-tokens/actions/workflows/ci.yml
