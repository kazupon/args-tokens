# Function: describe()

Set a description on a combinator schema for help text generation.

The original schema is not modified.
Other modifiers on `schema` (for example [required](/docs/combinators/functions/required.md)) are kept.

## Signature

```ts
export function describe<T, D extends string, S extends CombinatorSchema<T> = CombinatorSchema<T>>(
  schema: S,
  text: D
): Modified<S, CombinatorDescribe<D>>
```

## Type Parameters

| Name                                                                                                                                                                            | Description                                                                                                                                                                                                                                                       |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `T`                                                                                                                                                                             | The schema's parsed type, when type arguments are given explicitly. It is not inferred, so that `schema` can be a union of schemas of different types.                                                                                                            |
| `D` _extends_ `string`                                                                                                                                                          | The description string literal type.                                                                                                                                                                                                                              |
| `S` _extends_ [`CombinatorSchema`](/docs/combinators/type-aliases/CombinatorSchema.md)\<`T`\> = [`CombinatorSchema`](/docs/combinators/type-aliases/CombinatorSchema.md)\<`T`\> | The input combinator schema, inferred from `schema`. Its other modifiers are kept. If type arguments are given explicitly without `S`, `S` is `CombinatorSchema<T>`, and the type of the result lacks the other modifiers, although the returned object has them. |

## Parameters

| Name     | Type | Description                 |
| -------- | ---- | --------------------------- |
| `schema` | `S`  | The base combinator schema. |
| `text`   | `D`  | Human-readable description. |

## Returns

`Modified<S, CombinatorDescribe<D>>` — A new schema with the description set.

## Examples

```ts
const args = {
  port: describe(integer(), 'Port number to listen on')
}
```
