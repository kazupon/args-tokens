# Function: integer()

> [!WARNING]
> This API is experimental and may change in future versions.

Create an integer argument schema with optional range validation.

Only accepts integer values (no decimals).

## Signature

```ts
export function integer<const R extends boolean | undefined = boolean | undefined>(
  opts?: IntegerOptions & { required?: R }
): WithRequiredOption<CombinatorSchema<number>, R>
```

## Parameters

| Name   | Type                                                                                                                                 | Description                 |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------ | --------------------------- |
| `opts` | [`IntegerOptions`](/docs/combinators/interfaces/IntegerOptions.md) & { [`required`](/docs/combinators/functions/required.md)?: `R` } | Range options. _(optional)_ |

## Returns

`WithRequiredOption`\<[`CombinatorSchema`](/docs/combinators/type-aliases/CombinatorSchema.md)\<`number`\>, `R`\> — A combinator schema that resolves to number (integer).

## Examples

```ts
const args = {
  retries: integer({ min: 0, max: 10 })
}
```

## Tags

- `@typeParam` — R - The type of `required` in the options, which the schema keeps when it is `true` or `false`.
