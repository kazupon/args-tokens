# Function: required()

> [!WARNING]
> This API is experimental and may change in future versions.

Mark a combinator schema as required.

The original schema is not modified.

## Signature

```ts
export function required<T>(schema: CombinatorSchema<T>): CombinatorSchema<T> & CombinatorRequired
```

## Parameters

| Name     | Type                                                                            | Description                 |
| -------- | ------------------------------------------------------------------------------- | --------------------------- |
| `schema` | [`CombinatorSchema`](/docs/combinators/type-aliases/CombinatorSchema.md)\<`T`\> | The base combinator schema. |

## Returns

[`CombinatorSchema`](/docs/combinators/type-aliases/CombinatorSchema.md)\<`T`\> & `CombinatorRequired` — A new schema with `required: true`.

## Examples

```ts
const args = {
  name: required(string())
}
```

## Tags

- `@typeParam` — T - The schema's parsed type.
