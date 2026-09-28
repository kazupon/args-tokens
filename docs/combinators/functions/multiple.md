# Function: multiple()

Mark a combinator schema as accepting multiple values.

The resolved value becomes an array. The original schema is not modified.
Other modifiers on `schema` (for example [required](/docs/combinators/functions/required.md)) are kept.

## Signature

```ts
export function multiple<S extends CombinatorSchema<unknown>>(
  schema: S
): Modified<S, CombinatorMultiple>
```

## Type Parameters

| Name                                                                                                | Description                  |
| --------------------------------------------------------------------------------------------------- | ---------------------------- |
| `S` _extends_ [`CombinatorSchema`](/docs/combinators/type-aliases/CombinatorSchema.md)\<`unknown`\> | The input combinator schema. |

## Parameters

| Name     | Type | Description                 |
| -------- | ---- | --------------------------- |
| `schema` | `S`  | The base combinator schema. |

## Returns

`Modified<S, CombinatorMultiple>` — A copy of `schema` with `multiple: true`.

## Examples

```ts
const args = {
  tags: multiple(string())
}
// typeof values.tags === string[]
```
