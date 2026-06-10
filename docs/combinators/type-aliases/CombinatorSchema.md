# Type Alias: CombinatorSchema

> [!WARNING]
> This API is experimental and may change in future versions.

A schema produced by combinator factory functions.
Any [ArgSchema](/docs/default/interfaces/ArgSchema.md) with a parse function qualifies.

## Signature

```ts
export type CombinatorSchema<T> = ArgSchema & Combinator<T>
```

## Tags

- `@typeParam` — T - The parsed value type.
