# Function: withDefault()

## Call Signature

```ts
export function withDefault<
  T extends string | boolean | number,
  D extends T = T,
  S extends CombinatorSchema<T> = CombinatorSchema<T>
>(schema: S & CombinatorSchema<T>, defaultValue: D): WithFlag<S, CombinatorWithDefault<T>>
```

> [!WARNING]
> This API is experimental and may change in future versions.

Set a default value on a combinator schema.

The original schema is not modified. The default must be a value of the schema's parsed type:
`T` is inferred from `schema` only, so `withDefault(choice(['auto', 'always']), 'awlays')` is a
type error instead of adding `'awlays'` to the type. The schema must parse to a string, number or
boolean, since the default can only be one of them and does not go through `parse`: a schema that
parses to another type, such as a `Date`, or whose `parse` can return `null` or `undefined`,
cannot have a default, and giving it one is a type error.
Other modifiers on `schema` (for example [multiple](/docs/combinators/functions/multiple.md)) are kept. The default of a `multiple`
schema is one value of the parsed type, which becomes the only element of the array.

A union of schemas of different types, such as `strict ? integer() : string()`, matches the
other overload, whose default may be a value of any of their types.

### Parameters

| Name           | Type                                                                                  | Description                                             |
| -------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `schema`       | `S` & [`CombinatorSchema`](/docs/combinators/type-aliases/CombinatorSchema.md)\<`T`\> | The base combinator schema.                             |
| `defaultValue` | `D`                                                                                   | The default value, a value of the schema's parsed type. |

### Returns

`WithFlag<S, CombinatorWithDefault<T>>` — A new schema with the default value set.

### Examples

```ts
const args = {
  port: withDefault(integer({ min: 1, max: 65535 }), 8080)
}
```

### Tags

- `@typeParam` — T - The schema's parsed type.

## Call Signature

```ts
export function withDefault<S extends CombinatorSchema<string | boolean | number>>(
  schema: S,
  defaultValue: unknown extends ParsedType<S> ? never : ParsedType<S>
): WithFlag<S, CombinatorWithDefault<ParsedType<S>>>
```

> [!WARNING]
> This API is experimental and may change in future versions.

Set a default value on a union of combinator schemas of different types, such as
`strict ? integer() : string()`.

The original schema is not modified. The default must be a value of one of the types that the
schemas of the union parse to: a number or a string for `strict ? integer() : string()`. They
must parse to a string, number or boolean, since the default can only be one of them and does
not go through `parse`. A schema typed as `any` matches the other overload instead.
Other modifiers on `schema` (for example [multiple](/docs/combinators/functions/multiple.md)) are kept. The default of a `multiple`
schema is one value, which becomes the only element of the array.

### Parameters

| Name           | Type                                                    | Description                                                                            |
| -------------- | ------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `schema`       | `S`                                                     | The base combinator schema.                                                            |
| `defaultValue` | `unknown extends ParsedType<S> ? never : ParsedType<S>` | The default value, a value of one of the types that the schemas of the union parse to. |

### Returns

`WithFlag<S, CombinatorWithDefault<ParsedType<S>>>` — A new schema with the default value set.

### Examples

```ts
const strict = process.argv.includes('--strict')
const args = {
  timeout: withDefault(strict ? integer({ min: 0 }) : string(), 'none')
}
// typeof values.timeout === number | string
```

### Tags

- `@typeParam` — S - The input combinator schema, inferred from `schema`: a union of schemas of different types. Its other modifiers are kept.
