# Function: boolean()

## Call Signature

```ts
export function boolean<const R extends boolean>(
  opts: BooleanOptions & { required: R }
): WithRequiredOption<CombinatorSchema<boolean>, R>
```

> [!WARNING]
> This API is experimental and may change in future versions.

Create a boolean argument schema.

Boolean arguments are existence-based. The resolver passes `"true"` or `"false"`
to the parse function based on the presence or negation of the flag, or on an explicit
`=true` / `=false` value. Other inline values are rejected before the parse function is called.

### Parameters

| Name   | Type                                                                                                                                | Description      |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| `opts` | [`BooleanOptions`](/docs/combinators/interfaces/BooleanOptions.md) & { [`required`](/docs/combinators/functions/required.md): `R` } | Boolean options. |

### Returns

`WithRequiredOption`\<[`CombinatorSchema`](/docs/combinators/type-aliases/CombinatorSchema.md)\<`boolean`\>, `R`\> — A combinator schema for boolean flags.

### Examples

```ts
const args = {
  color: boolean({ negatable: true })
}
// Usage: --color (true), --no-color (false)
```

### Tags

- `@typeParam` — R - The type of `required` in the options, which the schema keeps when it is `true` or `false`.

## Call Signature

```ts
export function boolean(opts?: BooleanOptions): CombinatorSchema<boolean>
```

> [!WARNING]
> This API is experimental and may change in future versions.

Create a boolean argument schema.

Boolean arguments are existence-based. The resolver passes `"true"` or `"false"`
to the parse function based on the presence or negation of the flag, or on an explicit
`=true` / `=false` value. Other inline values are rejected before the parse function is called.

### Parameters

| Name   | Type                                                               | Description                   |
| ------ | ------------------------------------------------------------------ | ----------------------------- |
| `opts` | [`BooleanOptions`](/docs/combinators/interfaces/BooleanOptions.md) | Boolean options. _(optional)_ |

### Returns

[`CombinatorSchema`](/docs/combinators/type-aliases/CombinatorSchema.md)\<`boolean`\> — A combinator schema for boolean flags.

### Examples

```ts
const args = {
  color: boolean({ negatable: true })
}
// Usage: --color (true), --no-color (false)
```
