# Function: number()

> [!WARNING]
> This API is experimental and may change in future versions.

Create a number argument schema with optional range validation.

Accepts any numeric value (integer or float).

## Signature

```ts
export function number<const R extends boolean | undefined = boolean | undefined>(
  opts?: NumberOptions & { required?: R }
): WithRequiredOption<CombinatorSchema<number>, R>
```

## Parameters

| Name   | Type                                                                                                                               | Description                 |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| `opts` | [`NumberOptions`](/docs/combinators/interfaces/NumberOptions.md) & { [`required`](/docs/combinators/functions/required.md)?: `R` } | Range options. _(optional)_ |

## Returns

`WithRequiredOption`\<[`CombinatorSchema`](/docs/combinators/type-aliases/CombinatorSchema.md)\<`number`\>, `R`\> — A combinator schema that resolves to number.

## Examples

```ts
const args = {
  timeout: number({ min: 0, max: 30000 })
}
```

## Tags

- `@typeParam` — R - The type of `required` in the options, which the schema keeps when it is `true` or `false`.
