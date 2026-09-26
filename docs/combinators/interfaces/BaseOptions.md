# Interface: BaseOptions

> [!WARNING]
> This API is experimental and may change in future versions.

Common options shared by all base combinators.

## Signature

```ts
export interface BaseOptions
```

## Properties

| Name                       | Type      | Description                                                                                                                                                                                                                        |
| -------------------------- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `description` _(optional)_ | `string`  | Human-readable description for help text generation.                                                                                                                                                                               |
| `hidden` _(optional)_      | `boolean` | Hide from generated help or usage output.                                                                                                                                                                                          |
| `required` _(optional)_    | `boolean` | Mark as required. A literal `true` or `false` is kept in the type of the schema: `true` types the value as present, as [required](/docs/combinators/functions/required.md) does, and `false` makes a positional argument optional. |
| `short` _(optional)_       | `string`  | Single character short alias.                                                                                                                                                                                                      |
