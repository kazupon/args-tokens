# Function: string()

> [!WARNING]
> This API is experimental and may change in future versions.

Create a string argument schema with optional validation.

## Signature

```ts
export function string<O extends StringOptions = {}>(
  opts?: O
): WithRequiredOption<CombinatorSchema<string>, O>
```

## Parameters

| Name   | Type | Description                      |
| ------ | ---- | -------------------------------- |
| `opts` | `O`  | Validation options. _(optional)_ |

## Returns

`WithRequiredOption`\<[`CombinatorSchema`](/docs/combinators/type-aliases/CombinatorSchema.md)\<`string`\>, `O`\> — A combinator schema that resolves to string.

## Examples

```ts
const args = {
  name: string({ minLength: 1, maxLength: 50 })
}
```

## Tags

- `@typeParam` — O - The type of the options, whose literal `required` the schema keeps.
