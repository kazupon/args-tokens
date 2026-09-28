# Function: short()

Set a short alias on a combinator schema.

The original schema is not modified.
Other modifiers on `schema` (for example [multiple](/docs/combinators/functions/multiple.md)) are kept.

## Signature

```ts
export function short<T, A extends string, S extends CombinatorSchema<T> = CombinatorSchema<T>>(
  schema: S,
  alias: A
): Modified<S, CombinatorShort<A>>
```

## Type Parameters

| Name                                                                                                                                                                            | Description                                                                                                                                                                                                                                                       |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `T`                                                                                                                                                                             | The schema's parsed type, when type arguments are given explicitly. It is not inferred, so that `schema` can be a union of schemas of different types.                                                                                                            |
| `A` _extends_ `string`                                                                                                                                                          | The short alias string literal type.                                                                                                                                                                                                                              |
| `S` _extends_ [`CombinatorSchema`](/docs/combinators/type-aliases/CombinatorSchema.md)\<`T`\> = [`CombinatorSchema`](/docs/combinators/type-aliases/CombinatorSchema.md)\<`T`\> | The input combinator schema, inferred from `schema`. Its other modifiers are kept. If type arguments are given explicitly without `S`, `S` is `CombinatorSchema<T>`, and the type of the result lacks the other modifiers, although the returned object has them. |

## Parameters

| Name     | Type | Description                   |
| -------- | ---- | ----------------------------- |
| `schema` | `S`  | The base combinator schema.   |
| `alias`  | `A`  | Single character short alias. |

## Returns

`Modified<S, CombinatorShort<A>>` — A new schema with the short alias set.

## Examples

```ts
const args = {
  verbose: short(boolean(), 'v')
}
// Usage: -v or --verbose
```
