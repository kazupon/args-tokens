# Function: short()

> [!WARNING]
> This API is experimental and may change in future versions.

Set a short alias on a combinator schema.

The original schema is not modified.
Other modifiers on `schema` (for example [multiple](/docs/combinators/functions/multiple.md)) are kept.

## Signature

```ts
export function short<T, A extends string, S extends CombinatorSchema<T> = CombinatorSchema<T>>(
  schema: S,
  alias: A
): WithFlag<S, CombinatorShort<A>>
```

## Parameters

| Name     | Type | Description                   |
| -------- | ---- | ----------------------------- |
| `schema` | `S`  | The base combinator schema.   |
| `alias`  | `A`  | Single character short alias. |

## Returns

`WithFlag<S, CombinatorShort<A>>` — A new schema with the short alias set.

## Examples

```ts
const args = {
  verbose: short(boolean(), 'v')
}
// Usage: -v or --verbose
```

## Tags

- `@typeParam` — T - The schema's parsed type, when type arguments are given explicitly. It is not inferred, so that `schema` can be a union of schemas of different types.
