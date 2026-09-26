# Function: float()

> [!WARNING]
> This API is experimental and may change in future versions.

Create a floating-point argument schema with optional range validation.

Rejects `NaN` and `Infinity` values.

## Signature

```ts
export function float<O extends FloatOptions = {}>(
  opts?: O
): WithRequiredOption<CombinatorSchema<number>, O>
```

## Parameters

| Name   | Type | Description                 |
| ------ | ---- | --------------------------- |
| `opts` | `O`  | Range options. _(optional)_ |

## Returns

`WithRequiredOption`\<[`CombinatorSchema`](/docs/combinators/type-aliases/CombinatorSchema.md)\<`number`\>, `O`\> — A combinator schema that resolves to number (float).

## Examples

```ts
const args = {
  ratio: float({ min: 0, max: 1 })
}
```

## Tags

- `@typeParam` — O - The type of the options, whose literal `required` the schema keeps.
