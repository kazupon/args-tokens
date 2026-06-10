# Function: choice()

> [!WARNING]
> This API is experimental and may change in future versions.

Create an enum-like argument schema with literal type inference.

Uses `const T` generic to infer literal union types from the values array.

## Signature

```ts
export function choice<const T extends readonly string[]>(
  values: T,
  opts?: BaseOptions
): CombinatorSchema<T[number]>
```

## Parameters

| Name     | Type                                                         | Description                                                 |
| -------- | ------------------------------------------------------------ | ----------------------------------------------------------- |
| `values` | `T`                                                          | Allowed values.                                             |
| `opts`   | [`BaseOptions`](/docs/combinators/interfaces/BaseOptions.md) | Common options (description, short, required). _(optional)_ |

## Returns

[`CombinatorSchema`](/docs/combinators/type-aliases/CombinatorSchema.md)\<`T`\[`number`\]\> — A combinator schema that resolves to a union of the allowed values.

## Examples

```ts
const args = {
  level: choice(['debug', 'info', 'warn', 'error'] as const)
}
// typeof values.level === 'debug' | 'info' | 'warn' | 'error'
```

## Tags

- `@typeParam` — T - The readonly array of allowed string values.
