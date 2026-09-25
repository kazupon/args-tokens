# Interface: ArgToken

Argument token.

## Signature

```ts
export interface ArgToken
```

## Properties

| Name                       | Type           | Description                                                                                                                                                                                                                                                  |
| -------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `index`                    | `number`       | Argument token index, e.g `--foo bar` => `--foo` index is 0, `bar` index is 1.                                                                                                                                                                               |
| `inlineValue` _(optional)_ | `boolean`      | Inline value, e.g. `--foo=bar` => `true`, `-x=bar` => `true`, `-x-1` => `false`, since no `=` is written. Unlike Node.js `parseArgs`, `false` does not mean that the value is the next argument: the value token of `-x-1` has the `index` of that argument. |
| `kind`                     | `ArgTokenKind` | Argument token kind.                                                                                                                                                                                                                                         |
| `name` _(optional)_        | `string`       | Option name, e.g. `--foo` => `foo`, `-x` => `x`.                                                                                                                                                                                                             |
| `rawName` _(optional)_     | `string`       | Raw option name, e.g. `--foo` => `--foo`, `-x` => `-x`.                                                                                                                                                                                                      |
| `value` _(optional)_       | `string`       | Option value, e.g. `--foo=bar` => `bar`, `-x=bar` => `bar`, `-x=-1` => `-1`, `-x=` => `''`, `-x-1` => `-1`. If the `allowCompatible` option is `true`, short option value will be same as Node.js `parseArgs` behavior.                                      |
