# Function: number()

> [!WARNING]
> This API is experimental and may change in future versions.

Create a number argument schema with optional range validation.

Accepts any numeric value (integer or float).

## Signature

```ts
export function number<O extends NumberOptions = {}>(
  opts?: O
): WithRequiredOption<CombinatorSchema<number>, O>
```

## Parameters

| Name   | Type | Description                 |
| ------ | ---- | --------------------------- |
| `opts` | `O`  | Range options. _(optional)_ |

## Returns

`WithRequiredOption`\<[`CombinatorSchema`](/docs/combinators/type-aliases/CombinatorSchema.md)\<`number`\>, `O`\> — A combinator schema that resolves to number.

## Examples

```ts
const args = {
  timeout: number({ min: 0, max: 30000 })
}
```

## Tags

- `@typeParam` — O - The type of the options, whose literal `required` the schema keeps.
