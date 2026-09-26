# Function: string()

> [!WARNING]
> This API is experimental and may change in future versions.

Create a string argument schema with optional validation.

## Signature

```ts
export function string<const R extends boolean | undefined = boolean | undefined>(
  opts?: StringOptions & { required?: R }
): WithRequiredOption<CombinatorSchema<string>, R>
```

## Parameters

| Name   | Type                                                                                                                               | Description                      |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| `opts` | [`StringOptions`](/docs/combinators/interfaces/StringOptions.md) & { [`required`](/docs/combinators/functions/required.md)?: `R` } | Validation options. _(optional)_ |

## Returns

`WithRequiredOption`\<[`CombinatorSchema`](/docs/combinators/type-aliases/CombinatorSchema.md)\<`string`\>, `R`\> — A combinator schema that resolves to string.

## Examples

```ts
const args = {
  name: string({ minLength: 1, maxLength: 50 })
}
```

## Tags

- `@typeParam` — R - The type of `required` in the options, which the schema keeps when it is `true` or `false`.
