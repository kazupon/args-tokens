# Function: args()

Type-safe schema factory.

Returns the input unchanged at runtime, but provides type inference
so that `satisfies Args` is not needed.

## Signature

```ts
export function args<T extends Args>(fields: T): T
```

## Type Parameters

| Name                                                     | Description            |
| -------------------------------------------------------- | ---------------------- |
| `T` _extends_ [`Args`](/docs/default/interfaces/Args.md) | The exact schema type. |

## Parameters

| Name     | Type | Description                 |
| -------- | ---- | --------------------------- |
| `fields` | `T`  | The argument schema object. |

## Returns

`T` — The same schema object with its type inferred.

## Examples

```ts
const common = args({
  verbose: boolean(),
  help: short(boolean(), 'h')
})
```
