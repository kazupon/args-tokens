# Function: positional()

## Call Signature

```ts
export function positional<T>(
  parser: CombinatorSchema<T>
): CombinatorSchema<T> & ArgSchemaPositionalType
```

> [!WARNING]
> This API is experimental and may change in future versions.

Create a positional argument schema.

Without a parser, resolves to string.
With a parser (e.g., `positional(integer())`), resolves to the parser's return type.

### Parameters

| Name     | Type                                                                            | Description                   |
| -------- | ------------------------------------------------------------------------------- | ----------------------------- |
| `parser` | [`CombinatorSchema`](/docs/combinators/type-aliases/CombinatorSchema.md)\<`T`\> | The parser combinator schema. |

### Returns

[`CombinatorSchema`](/docs/combinators/type-aliases/CombinatorSchema.md)\<`T`\> & `ArgSchemaPositionalType` — A positional argument schema resolving to the parser's type.

### Examples

```ts
const args = {
  command: positional(), // resolves to string
  port: positional(integer()) // resolves to number
}
```

### Tags

- `@typeParam` — T - The parser's resolved type.

## Call Signature

```ts
export function positional(parser?: BaseOptions): ArgSchema & ArgSchemaPositionalType
```

> [!WARNING]
> This API is experimental and may change in future versions.

Create a positional argument schema.

Without a parser, resolves to string.
With a parser (e.g., `positional(integer())`), resolves to the parser's return type.

### Parameters

| Name     | Type                                                         | Description                                                        |
| -------- | ------------------------------------------------------------ | ------------------------------------------------------------------ |
| `parser` | [`BaseOptions`](/docs/combinators/interfaces/BaseOptions.md) | Optional base options (description, short, required). _(optional)_ |

### Returns

[`ArgSchema`](/docs/default/interfaces/ArgSchema.md) & `ArgSchemaPositionalType` — A positional argument schema resolving to string.

### Examples

```ts
const args = {
  command: positional(), // resolves to string
  port: positional(integer()) // resolves to number
}
```
