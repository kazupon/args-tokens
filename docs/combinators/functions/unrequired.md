# Function: unrequired()

> [!WARNING]
> This API is experimental and may change in future versions.

Mark a combinator schema as not required.

Useful for overriding a base combinator that was created with `required: true`.
The original schema is not modified.

## Signature

```ts
export function unrequired<T>(
  schema: CombinatorSchema<T>
): CombinatorSchema<T> & CombinatorUnrequired
```

## Parameters

| Name     | Type                                                                            | Description                 |
| -------- | ------------------------------------------------------------------------------- | --------------------------- |
| `schema` | [`CombinatorSchema`](/docs/combinators/type-aliases/CombinatorSchema.md)\<`T`\> | The base combinator schema. |

## Returns

[`CombinatorSchema`](/docs/combinators/type-aliases/CombinatorSchema.md)\<`T`\> & `CombinatorUnrequired` — A new schema with `required: false`.

## Examples

```ts
const args = {
  name: unrequired(string({ required: true }))
}
```

## Tags

- `@typeParam` — T - The schema's parsed type.
