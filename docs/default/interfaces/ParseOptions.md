# Interface: ParseOptions

Parse options for [parse](/docs/default/functions/parse.md) function.

The options of [parseArgs](/docs/default/functions/parseArgs.md) and [resolveArgs](/docs/default/functions/resolveArgs.md) work as they do there:
`parse(argv, { args, allowCompatible, shortGrouping })` gives the `tokens` of
`parseArgs(argv, { allowCompatible })` and what `resolveArgs(args, tokens, { shortGrouping })`
gives with them.

## Extends

- [`ParserOptions`](/docs/default/interfaces/ParserOptions.md)
- [`ResolveArgs`](/docs/default/interfaces/ResolveArgs.md)

## Signature

```ts
export interface ParseOptions<A extends Args> extends ParserOptions, ResolveArgs
```

## Properties

| Name                | Type | Description                                                                                     |
| ------------------- | ---- | ----------------------------------------------------------------------------------------------- |
| `args` _(optional)_ | `A`  | [Arguments schema](/docs/default/interfaces/Args.md), which defines the command line arguments. |

## Tags

- `@typeParam` — A - [Arguments schema](/docs/default/interfaces/Args.md), which is an object that defines the command line arguments.
