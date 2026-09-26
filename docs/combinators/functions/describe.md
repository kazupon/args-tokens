# Function: describe()

> [!WARNING]
> This API is experimental and may change in future versions.

Set a description on a combinator schema for help text generation.

The original schema is not modified.
Other modifiers on `schema` (for example [required](/docs/combinators/functions/required.md)) are kept.

## Signature

```ts
export function describe<T, D extends string, S extends CombinatorSchema<T> = CombinatorSchema<T>>(
  schema: S,
  text: D
): WithFlag<S, CombinatorDescribe<D>>
```

## Parameters

| Name     | Type | Description                 |
| -------- | ---- | --------------------------- |
| `schema` | `S`  | The base combinator schema. |
| `text`   | `D`  | Human-readable description. |

## Returns

`WithFlag<S, CombinatorDescribe<D>>` — A new schema with the description set.

## Examples

```ts
const args = {
  port: describe(integer(), 'Port number to listen on')
}
```

## Tags

- `@typeParam` — T - The schema's parsed type, when type arguments are given explicitly. It is not inferred, so that `schema` can be a union of schemas of different types.
