# Function: string()

> [!WARNING]
> This API is experimental and may change in future versions.

Create a string argument schema with optional validation.

## Signature

```ts
export function string(opts?: StringOptions): CombinatorSchema<string>
```

## Parameters

| Name   | Type                                                             | Description                      |
| ------ | ---------------------------------------------------------------- | -------------------------------- |
| `opts` | [`StringOptions`](/docs/combinators/interfaces/StringOptions.md) | Validation options. _(optional)_ |

## Returns

[`CombinatorSchema`](/docs/combinators/type-aliases/CombinatorSchema.md)\<`string`\> — A combinator schema that resolves to string.

## Examples

```ts
const args = {
  name: string({ minLength: 1, maxLength: 50 })
}
```
