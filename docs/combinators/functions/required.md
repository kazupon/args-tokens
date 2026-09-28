# Function: required()

Mark a combinator schema as required.

The original schema is not modified.
Other modifiers on `schema` (for example [multiple](/docs/combinators/functions/multiple.md)) are kept.

## Signature

```ts
export function required<S extends CombinatorSchema<unknown>>(
  schema: S
): Modified<S, CombinatorRequired>
```

## Parameters

| Name     | Type | Description                 |
| -------- | ---- | --------------------------- |
| `schema` | `S`  | The base combinator schema. |

## Returns

`Modified<S, CombinatorRequired>` — A copy of `schema` with `required: true`.

## Examples

```ts
const args = {
  name: required(string())
}
```

## Tags

- `@typeParam` — S - The input combinator schema.
