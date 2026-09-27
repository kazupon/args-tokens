# Function: hidden()

> [!WARNING]
> This API is experimental and may change in future versions.

Hide a combinator schema from generated help or usage output.

The original schema is not modified. This only marks renderer metadata and
does not change parsing, validation, defaults, conflicts, or resolved values.

## Signature

```ts
export function hidden<T extends ArgSchema>(
  schema: T
): WithFlag<T, CombinatorHidden> & Omit<T, 'hidden'>
```

## Parameters

| Name     | Type | Description                 |
| -------- | ---- | --------------------------- |
| `schema` | `T`  | The base combinator schema. |

## Returns

`WithFlag<T, CombinatorHidden> & Omit<T, 'hidden'>` — A new schema with `hidden: true`.

## Examples

```ts
const args = {
  legacy: hidden(string())
}
```

## Tags

- `@typeParam` — T - The schema type.
