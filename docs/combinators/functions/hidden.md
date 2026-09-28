# Function: hidden()

Hide a combinator schema from generated help or usage output.

The original schema is not modified. This only marks renderer metadata and
does not change parsing, validation, defaults, conflicts, or resolved values.
For a union of schemas, such as `strict ? integer() : string()`, each schema gets `hidden: true`.

## Signature

```ts
export function hidden<T extends ArgSchema>(
  schema: T
): T extends unknown ? WithFlag<T, CombinatorHidden> & Omit<T, 'hidden'> : never
```

## Type Parameters

| Name                                                               | Description      |
| ------------------------------------------------------------------ | ---------------- |
| `T` _extends_ [`ArgSchema`](/docs/default/interfaces/ArgSchema.md) | The schema type. |

## Parameters

| Name     | Type | Description                 |
| -------- | ---- | --------------------------- |
| `schema` | `T`  | The base combinator schema. |

## Returns

`T extends unknown ? WithFlag<T, CombinatorHidden> & Omit<T, 'hidden'> : never` — A new schema with `hidden: true`.

## Examples

```ts
const args = {
  legacy: hidden(string())
}
```
