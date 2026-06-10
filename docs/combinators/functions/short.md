# Function: short()

> [!WARNING]
> This API is experimental and may change in future versions.

Set a short alias on a combinator schema.

The original schema is not modified.

## Signature

```ts
export function short<T, S extends string>(
  schema: CombinatorSchema<T>,
  alias: S
): CombinatorSchema<T> & CombinatorShort<S>
```

## Parameters

| Name     | Type                                                                            | Description                   |
| -------- | ------------------------------------------------------------------------------- | ----------------------------- |
| `schema` | [`CombinatorSchema`](/docs/combinators/type-aliases/CombinatorSchema.md)\<`T`\> | The base combinator schema.   |
| `alias`  | `S`                                                                             | Single character short alias. |

## Returns

[`CombinatorSchema`](/docs/combinators/type-aliases/CombinatorSchema.md)\<`T`\> & `CombinatorShort`\<`S`\> — A new schema with the short alias set.

## Examples

```ts
const args = {
  verbose: short(boolean(), 'v')
}
// Usage: -v or --verbose
```

## Tags

- `@typeParam` — T - The schema's parsed type.
