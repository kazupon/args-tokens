# Function: map()

> [!WARNING]
> This API is experimental and may change in future versions.

Transform the output of a combinator schema.

Creates a new schema that applies `transform` to the result of `schema.parse`.
The original schema is not modified.
Other modifiers on `schema` (for example [multiple](/docs/combinators/functions/multiple.md)) are kept, and `transform` is applied
to each value of a `multiple` schema.

A default set on `schema` is kept as is: it does not go through `transform`. Set the default
after `map()`, with a transformed value.

## Signature

```ts
export function map<T, U, S extends CombinatorSchema<T> = CombinatorSchema<T>>(
  schema: S & CombinatorSchema<T>,
  transform: (value: T) => U
): WithFlag<S, Combinator<U>>
```

## Parameters

| Name        | Type                                                                                  | Description                  |
| ----------- | ------------------------------------------------------------------------------------- | ---------------------------- |
| `schema`    | `S` & [`CombinatorSchema`](/docs/combinators/type-aliases/CombinatorSchema.md)\<`T`\> | The base combinator schema.  |
| `transform` | `(value: T) => U`                                                                     | The transformation function. |

## Returns

`WithFlag`\<`S`, [`Combinator`](/docs/combinators/type-aliases/Combinator.md)\<`U`\>\> — A new combinator schema that resolves to the transformed type.

## Examples

```ts
const args = {
  doubled: map(integer(), n => n * 2)
}
```

## Tags

- `@typeParam` — T - The input schema's parsed type.
