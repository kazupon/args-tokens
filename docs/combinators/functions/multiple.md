# Function: multiple()

> [!WARNING]
> This API is experimental and may change in future versions.

Mark a combinator schema as accepting multiple values.

The resolved value becomes an array. The original schema is not modified.
Other modifiers on `schema` (for example [required](/docs/combinators/functions/required.md)) are kept.

## Signature

```ts
export function multiple<S extends CombinatorSchema<unknown>>(
  schema: S
): WithFlag<S, CombinatorMultiple>
```

## Parameters

| Name     | Type | Description                 |
| -------- | ---- | --------------------------- |
| `schema` | `S`  | The base combinator schema. |

## Returns

`WithFlag<S, CombinatorMultiple>` — A copy of `schema` with `multiple: true`.

## Examples

```ts
const args = {
  tags: multiple(string())
}
// typeof values.tags === string[]
```

## Tags

- `@typeParam` — S - The input combinator schema.
