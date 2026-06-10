# Interface: ParseOptions

Parse options for [parse](/docs/default/functions/parse.md) function.

## Extends

- [`ParserOptions`](/docs/default/interfaces/ParserOptions.md)
- [`ResolveArgs`](/docs/default/interfaces/ResolveArgs.md)

## Signature

```ts
export interface ParseOptions<A extends Args> extends ParserOptions, ResolveArgs
```

## Properties

| Name                | Type | Description             |
| ------------------- | ---- | ----------------------- |
| `args` _(optional)_ | `A`  | Command line arguments. |

## Tags

- `@typeParam` — A - [Arguments schema](/docs/default/interfaces/Args.md), which is an object that defines the command line arguments.
