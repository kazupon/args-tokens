# Function: describe()

> [!WARNING]
> This API is experimental and may change in future versions.

Set a description on a combinator schema for help text generation.

The original schema is not modified.

## Signature

```ts
export function describe<T, D extends string>(
  schema: CombinatorSchema<T>,
  text: D
): CombinatorSchema<T> & CombinatorDescribe<D>
```

## Parameters

| Name     | Type                                                                            | Description                 |
| -------- | ------------------------------------------------------------------------------- | --------------------------- |
| `schema` | [`CombinatorSchema`](/docs/combinators/type-aliases/CombinatorSchema.md)\<`T`\> | The base combinator schema. |
| `text`   | `D`                                                                             | Human-readable description. |

## Returns

[`CombinatorSchema`](/docs/combinators/type-aliases/CombinatorSchema.md)\<`T`\> & `CombinatorDescribe`\<`D`\> — A new schema with the description set.

## Examples

```ts
const args = {
  port: describe(integer(), 'Port number to listen on')
}
```

## Tags

- `@typeParam` — T - The schema's parsed type.
