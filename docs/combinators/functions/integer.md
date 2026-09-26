# Function: integer()

> [!WARNING]
> This API is experimental and may change in future versions.

Create an integer argument schema with optional range validation.

Only accepts integer values (no decimals).

## Signature

```ts
export function integer<O extends IntegerOptions = {}>(
  opts?: O
): WithRequiredOption<CombinatorSchema<number>, O>
```

## Parameters

| Name   | Type | Description                 |
| ------ | ---- | --------------------------- |
| `opts` | `O`  | Range options. _(optional)_ |

## Returns

`WithRequiredOption`\<[`CombinatorSchema`](/docs/combinators/type-aliases/CombinatorSchema.md)\<`number`\>, `O`\> — A combinator schema that resolves to number (integer).

## Examples

```ts
const args = {
  retries: integer({ min: 0, max: 10 })
}
```

## Tags

- `@typeParam` — O - The type of the options, whose literal `required` the schema keeps.
