# Function: positional()

## Call Signature

```ts
export function positional<T, S extends CombinatorSchema<T> = CombinatorSchema<T>>(
  parser: S & CombinatorSchema<T>
): PositionalOf<S>
```

> [!WARNING]
> This API is experimental and may change in future versions.

Create a positional argument schema.

Without a parser, resolves to string.
With a parser (e.g., `positional(integer())`), resolves to the parser's return type.

The positional argument keeps `required`, `default` and `multiple` of the parser, with their
types: `positional(unrequired(integer()))` is optional, and `positional(multiple(integer()))`
resolves to an array, as `multiple(positional(integer()))` does.

An instantiation expression with one type argument, such as `typeof positional<number>`, is a
type error, since the overload for a union of schemas and the overloads for options take one
type argument too, which must be a schema for the former and a boolean (the type of `required`)
for the latter: give `S` as well, as in `typeof positional<number, CombinatorSchema<number>>`.

### Parameters

| Name     | Type                                                                                  | Description                   |
| -------- | ------------------------------------------------------------------------------------- | ----------------------------- |
| `parser` | `S` & [`CombinatorSchema`](/docs/combinators/type-aliases/CombinatorSchema.md)\<`T`\> | The parser combinator schema. |

### Returns

`PositionalOf<S>` — A positional argument schema resolving to the parser's type.

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
export function positional<S extends CombinatorSchema<unknown>>(parser: S): PositionalOf<S>
```

> [!WARNING]
> This API is experimental and may change in future versions.

Create a positional argument schema from a union of combinator schemas of different types, such
as `strict ? integer() : string()`.

The positional argument resolves to a value of any of their types: a number or a string for
`strict ? integer() : string()`. Each schema of the union keeps its `required`, `default` and
`multiple`, and the argument is present only when each of them gives it a value:
`positional(strict ? multiple(integer()) : string())` resolves to an array of numbers or a
string, and is optional, since a `multiple` positional argument without `required: true` or a
default may be missing.

### Parameters

| Name     | Type | Description                   |
| -------- | ---- | ----------------------------- |
| `parser` | `S`  | The parser combinator schema. |

### Returns

`PositionalOf<S>` — A positional argument schema resolving to a value of any of the types that the schemas of the union parse to, in an array for a `multiple` schema.

### Examples

```ts
const strict = process.argv.includes('--strict')
const args = {
  // a number or a string
  port: positional(strict ? integer({ min: 1 }) : string())
}
```

### Tags

- `@typeParam` — S - The type of the parser, inferred from `parser`: a union of schemas of different types.

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

With `required: false` in the options, the positional argument is optional, in its type too. A
`required` of type `boolean`, which may be `false`, types it as optional as well.

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

- `@typeParam` — R - The type of `required` in the options, which the positional argument keeps.

## Call Signature

```ts
export function positional<const R extends boolean | undefined = boolean | undefined>(
  parser?: BaseOptions & { required?: R }
): WithUnrequiredOption<Omit<CombinatorSchema<string>, 'type'> & ArgSchemaPositionalType, R>
```

> [!WARNING]
> This API is experimental and may change in future versions.

Create a positional argument schema.

Without a parser, resolves to string.
With a parser (e.g., `positional(integer())`), resolves to the parser's return type.

Without a parser, the schema has a `parse` function that returns the value as is, so that the
modifiers, such as [multiple](/docs/combinators/functions/multiple.md) and [withDefault](/docs/combinators/functions/withDefault.md), take it: `multiple(positional())`
collects the values as strings.

With a `required: false` that the options have only in some cases, with no `required` in the
others, such as `optional ? { required: false } : {}`, the positional argument is optional, in
its type too.

### Parameters

| Name     | Type                                                                                                                           | Description                                                        |
| -------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| `parser` | [`BaseOptions`](/docs/combinators/interfaces/BaseOptions.md) & { [`required`](/docs/combinators/functions/required.md)?: `R` } | Optional base options (description, short, required). _(optional)_ |

### Returns

`WithUnrequiredOption`\<`Omit`\<[`CombinatorSchema`](/docs/combinators/type-aliases/CombinatorSchema.md)\<`string`\>, 'type'\> & `ArgSchemaPositionalType`, `R`\> — A positional argument schema resolving to string.

### Examples

```ts
const args = {
  command: positional(), // resolves to string
  port: positional(integer()), // resolves to number
  query: unrequired(positional()) // optional positional
}
```

### Tags

- `@typeParam` — R - The type of `required` in the options, which the positional argument keeps when it may be `false` but not `true`, as for `optional ? { required: false } : {}`.

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
