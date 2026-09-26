# Function: boolean()

> [!WARNING]
> This API is experimental and may change in future versions.

Create a boolean argument schema.

Boolean arguments are existence-based. The resolver passes `"true"` or `"false"`
to the parse function based on the presence or negation of the flag, or on an explicit
`=true` / `=false` value. Other inline values are rejected before the parse function is called.

## Signature

```ts
export function boolean<O extends BooleanOptions = {}>(
  opts?: O
): WithRequiredOption<CombinatorSchema<boolean>, O>
```

## Parameters

| Name   | Type | Description                   |
| ------ | ---- | ----------------------------- |
| `opts` | `O`  | Boolean options. _(optional)_ |

## Returns

`WithRequiredOption`\<[`CombinatorSchema`](/docs/combinators/type-aliases/CombinatorSchema.md)\<`boolean`\>, `O`\> — A combinator schema for boolean flags.

## Examples

```ts
const args = {
  color: boolean({ negatable: true })
}
// Usage: --color (true), --no-color (false)
```

## Tags

- `@typeParam` — O - The type of the options, whose literal `required` the schema keeps.
