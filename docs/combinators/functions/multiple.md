# Function: multiple()

> [!WARNING]
> This API is experimental and may change in future versions.

Mark a combinator schema as accepting multiple values.

The resolved value becomes an array. The original schema is not modified.

## Signature

```ts
export function multiple<T>(schema: CombinatorSchema<T>): CombinatorSchema<T> & CombinatorMultiple
```

## Parameters

| Name     | Type                                                                            | Description                 |
| -------- | ------------------------------------------------------------------------------- | --------------------------- |
| `schema` | [`CombinatorSchema`](/docs/combinators/type-aliases/CombinatorSchema.md)\<`T`\> | The base combinator schema. |

## Returns

[`CombinatorSchema`](/docs/combinators/type-aliases/CombinatorSchema.md)\<`T`\> & `CombinatorMultiple` — A new schema with `multiple: true`.

## Examples

```ts
const args = {
  tags: multiple(string())
}
// typeof values.tags === string[]
```

## Tags

- `@typeParam` — T - The schema's parsed type.
