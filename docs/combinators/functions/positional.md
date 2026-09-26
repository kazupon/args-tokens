# Function: positional()

## Call Signature

```ts
export function positional<T, S extends CombinatorSchema<T> = CombinatorSchema<T>>(
  parser: S & CombinatorSchema<T>
): PositionalWithParser<S>
```

> [!WARNING]
> This API is experimental and may change in future versions.

Create a positional argument schema.

Without a parser, resolves to string.
With a parser (e.g., `positional(integer())`), resolves to the parser's return type.

The positional argument keeps `required`, `default` and `multiple` of the parser, with their
types: `positional(unrequired(integer()))` is optional, and `positional(multiple(integer()))`
resolves to an array, as `multiple(positional(integer()))` does.

### Parameters

| Name     | Type                                                                                  | Description                   |
| -------- | ------------------------------------------------------------------------------------- | ----------------------------- |
| `parser` | `S` & [`CombinatorSchema`](/docs/combinators/type-aliases/CombinatorSchema.md)\<`T`\> | The parser combinator schema. |

### Returns

`PositionalWithParser<S>` — A positional argument schema resolving to the parser's type.

### Examples

```ts
const args = {
  command: positional(), // resolves to string
  port: positional(integer()), // resolves to number
  query: unrequired(positional()) // optional positional
}
```

### Tags

- `@typeParam` — T - The parser's resolved type.

## Call Signature

```ts
export function positional<O extends BaseOptions = {}>(
  parser?: O
): WithRequiredOption<ArgSchema & ArgSchemaPositionalType, O>
```

> [!WARNING]
> This API is experimental and may change in future versions.

Create a positional argument schema.

Without a parser, resolves to string.
With a parser (e.g., `positional(integer())`), resolves to the parser's return type.

With `required: false` in the options, the positional argument is optional, in its type too.

### Parameters

| Name     | Type | Description                                                        |
| -------- | ---- | ------------------------------------------------------------------ |
| `parser` | `O`  | Optional base options (description, short, required). _(optional)_ |

### Returns

`WithRequiredOption`\<[`ArgSchema`](/docs/default/interfaces/ArgSchema.md) & `ArgSchemaPositionalType`, `O`\> — A positional argument schema resolving to string.

### Examples

```ts
const args = {
  command: positional(), // resolves to string
  port: positional(integer()), // resolves to number
  query: unrequired(positional()) // optional positional
}
```

### Tags

- `@typeParam` — O - The type of the options, whose literal `required` the positional argument keeps.
