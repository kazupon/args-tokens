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
export function positional<const R extends boolean>(
  parser: BaseOptions & { required: R }
): WithRequiredOption<Omit<CombinatorSchema<string>, 'type'> & ArgSchemaPositionalType, R>
```

> [!WARNING]
> This API is experimental and may change in future versions.

Create a positional argument schema.

Without a parser, resolves to string.
With a parser (e.g., `positional(integer())`), resolves to the parser's return type.

Without a parser, the schema has a `parse` function that returns the value as is, so that the
modifiers, such as [multiple](/docs/combinators/functions/multiple.md) and [withDefault](/docs/combinators/functions/withDefault.md), take it: `multiple(positional())`
collects the values as strings.

With `required: false` in the options, the positional argument is optional, in its type too.

### Parameters

| Name     | Type                                                                                                                          | Description                                  |
| -------- | ----------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| `parser` | [`BaseOptions`](/docs/combinators/interfaces/BaseOptions.md) & { [`required`](/docs/combinators/functions/required.md): `R` } | Base options (description, short, required). |

### Returns

`WithRequiredOption`\<`Omit`\<[`CombinatorSchema`](/docs/combinators/type-aliases/CombinatorSchema.md)\<`string`\>, 'type'\> & `ArgSchemaPositionalType`, `R`\> — A positional argument schema resolving to string.

### Examples

```ts
const args = {
  command: positional(), // resolves to string
  port: positional(integer()), // resolves to number
  query: unrequired(positional()) // optional positional
}
```

### Tags

- `@typeParam` — R - The type of `required` in the options, which the positional argument keeps when it is `true` or `false`.

## Call Signature

```ts
export function positional(
  parser?: BaseOptions
): Omit<CombinatorSchema<string>, 'type'> & ArgSchemaPositionalType
```

> [!WARNING]
> This API is experimental and may change in future versions.

Create a positional argument schema.

Without a parser, resolves to string.
With a parser (e.g., `positional(integer())`), resolves to the parser's return type.

Without a parser, the schema has a `parse` function that returns the value as is, so that the
modifiers, such as [multiple](/docs/combinators/functions/multiple.md) and [withDefault](/docs/combinators/functions/withDefault.md), take it: `multiple(positional())`
collects the values as strings.

### Parameters

| Name     | Type                                                         | Description                                                        |
| -------- | ------------------------------------------------------------ | ------------------------------------------------------------------ |
| `parser` | [`BaseOptions`](/docs/combinators/interfaces/BaseOptions.md) | Optional base options (description, short, required). _(optional)_ |

### Returns

`Omit`\<[`CombinatorSchema`](/docs/combinators/type-aliases/CombinatorSchema.md)\<`string`\>, 'type'\> & `ArgSchemaPositionalType` — A positional argument schema resolving to string.

### Examples

```ts
const args = {
  command: positional(), // resolves to string
  port: positional(integer()), // resolves to number
  query: unrequired(positional()) // optional positional
}
```
