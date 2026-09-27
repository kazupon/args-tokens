# Function: unrequired()

> [!WARNING]
> This API is experimental and may change in future versions.

Mark a combinator schema as not required.

Useful for overriding a base combinator that was created with `required: true`,
or for making a positional argument explicitly optional.
The original schema is not modified.
For a union of schemas, such as `strict ? integer() : string()`, each schema gets
`required: false`.

## Signature

```ts
export function unrequired<T extends ArgSchema>(
  schema: T
): T extends unknown ? WithFlag<T, CombinatorUnrequired> & Omit<T, 'required'> : never
```

## Parameters

| Name     | Type | Description                 |
| -------- | ---- | --------------------------- |
| `schema` | `T`  | The base combinator schema. |

## Returns

`T extends unknown ? WithFlag<T, CombinatorUnrequired> & Omit<T, 'required'> : never` — A new schema with `required: false`.

## Examples

```ts
const args = {
  name: unrequired(string({ required: true })),
  query: unrequired(positional())
}
```

## Tags

- `@typeParam` — T - The schema type.
