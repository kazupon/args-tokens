# Function: map()

## Call Signature

```ts
export function map<T, U, S extends CombinatorSchema<T> = CombinatorSchema<T>>(
  schema: S & CombinatorSchema<T>,
  transform: (value: T) => U
): WithFlag<S, Combinator<U>>
```

> [!WARNING]
> This API is experimental and may change in future versions.

Transform the output of a combinator schema.

Creates a new schema that applies `transform` to the result of `schema.parse`.
The original schema is not modified.
Other modifiers on `schema` (for example [multiple](/docs/combinators/functions/multiple.md)) are kept, and `transform` is applied
to each value of a `multiple` schema.

A default set on `schema` is kept, but it does not go through `transform`: when it is used, the
value is the default as is, although it is typed as `U`. Set the default after `map()`, with a
transformed value.

A union of schemas of different types, such as `strict ? integer() : string()`, matches the
last overload, whose `transform` takes a value of any of their types.

### Parameters

| Name        | Type                                                                                  | Description                  |
| ----------- | ------------------------------------------------------------------------------------- | ---------------------------- |
| `schema`    | `S` & [`CombinatorSchema`](/docs/combinators/type-aliases/CombinatorSchema.md)\<`T`\> | The base combinator schema.  |
| `transform` | `(value: T) => U`                                                                     | The transformation function. |

### Returns

`WithFlag`\<`S`, [`Combinator`](/docs/combinators/type-aliases/Combinator.md)\<`U`\>\> — A new combinator schema that resolves to the transformed type.

### Examples

```ts
const args = {
  doubled: map(integer(), n => n * 2)
}
```

### Tags

- `@typeParam` — T - The input schema's parsed type.

## Call Signature

```ts
export function map<T, U, S extends CombinatorSchema<T> = CombinatorSchema<T>>(
  schema: S & Combinator<T>,
  transform: (value: T) => U
): WithFlag<S, Combinator<U>>
```

> [!WARNING]
> This API is experimental and may change in future versions.

Transform the output of a combinator schema, as the first overload does, for a schema that fits
the first overload but that TypeScript does not match with it at first, such as
`positional(integer())`, a class instance or a schema typed by an interface. This overload keeps
such a schema from matching the overload for a union of schemas of different types.

Creates a new schema that applies `transform` to the result of `schema.parse`.
The original schema is not modified.
Other modifiers on `schema` (for example [multiple](/docs/combinators/functions/multiple.md)) are kept, and `transform` is applied
to each value of a `multiple` schema.

A default set on `schema` is kept, but it does not go through `transform`: when it is used, the
value is the default as is, although it is typed as `U`. Set the default after `map()`, with a
transformed value.

### Parameters

| Name        | Type                                                                      | Description                  |
| ----------- | ------------------------------------------------------------------------- | ---------------------------- |
| `schema`    | `S` & [`Combinator`](/docs/combinators/type-aliases/Combinator.md)\<`T`\> | The base combinator schema.  |
| `transform` | `(value: T) => U`                                                         | The transformation function. |

### Returns

`WithFlag`\<`S`, [`Combinator`](/docs/combinators/type-aliases/Combinator.md)\<`U`\>\> — A new combinator schema that resolves to the transformed type.

### Examples

```ts
const args = {
  doubled: map(positional(integer()), n => n * 2)
}
```

### Tags

- `@typeParam` — T - The input schema's parsed type.

## Call Signature

```ts
export function map<S extends CombinatorSchema<unknown>, U>(
  schema: S,
  transform: (value: ParsedType<S>) => U
): WithFlag<S, Combinator<U>>
```

> [!WARNING]
> This API is experimental and may change in future versions.

Transform the output of a union of combinator schemas of different types, such as
`strict ? integer() : string()`.

Creates a new schema that applies `transform` to the result of `schema.parse`, which is a value
of any of their types: a number or a string for `strict ? integer() : string()`.
The original schema is not modified.
Other modifiers on `schema` (for example [multiple](/docs/combinators/functions/multiple.md)) are kept, and `transform` is applied
to each value of a `multiple` schema.

A default set on `schema` is kept, but it does not go through `transform`: when it is used, the
value is the default as is, although it is typed as `U`. Set the default after `map()`, with a
transformed value.

### Parameters

| Name        | Type                          | Description                                                                                                  |
| ----------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `schema`    | `S`                           | The base combinator schema.                                                                                  |
| `transform` | `(value: ParsedType<S>) => U` | The transformation function, which takes a value of any of the types that the schemas of the union parse to. |

### Returns

`WithFlag`\<`S`, [`Combinator`](/docs/combinators/type-aliases/Combinator.md)\<`U`\>\> — A new combinator schema that resolves to the transformed type.

### Examples

```ts
const strict = process.argv.includes('--strict')
const args = {
  // `value` is a number or a string
  timeout: map(strict ? integer({ min: 0 }) : string(), value => String(value))
}
```

### Tags

- `@typeParam` — S - The input combinator schema, inferred from `schema`: a union of schemas of different types. Its other modifiers are kept.
