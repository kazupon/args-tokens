# Type Alias: CombinatorSchema

> [!WARNING]
> This API is experimental and may change in future versions.

A schema produced by combinator factory functions.
Any [ArgSchema](/docs/default/interfaces/ArgSchema.md) whose parse function returns `T` qualifies. The `parse` of
[ArgSchema](/docs/default/interfaces/ArgSchema.md), which returns `any`, is left out, so that a schema of one type is not a schema
of another: `integer()` is not a `CombinatorSchema<string>`.

## Signature

```ts
export type CombinatorSchema<T> = Omit<ArgSchema, 'parse'> & Combinator<T>
```

## Tags

- `@typeParam` — T - The parsed value type.
