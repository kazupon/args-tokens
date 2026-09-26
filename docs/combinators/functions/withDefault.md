# Function: withDefault()

> [!WARNING]
> This API is experimental and may change in future versions.

Set a default value on a combinator schema.

The original schema is not modified. The default must be a value of the schema's parsed type:
`T` is inferred from `schema` only, so `withDefault(choice(['auto', 'always']), 'awlays')` is a
type error instead of adding `'awlays'` to the type. The parsed type must be a string, number or
boolean, since the default is one of them and does not go through `parse`: a schema that parses
to another type, such as a `Date`, cannot have a default.
Other modifiers on `schema` (for example [multiple](/docs/combinators/functions/multiple.md)) are kept. The default of a `multiple`
schema is one value of the parsed type, which becomes the only element of the array.

## Signature

```ts
export function withDefault<
  T extends string | boolean | number,
  D extends T = T,
  S extends CombinatorSchema<T> = CombinatorSchema<T>
>(schema: S & CombinatorSchema<T>, defaultValue: D): WithFlag<S, CombinatorWithDefault<T>>
```

## Parameters

| Name           | Type                                                                                  | Description                                             |
| -------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `schema`       | `S` & [`CombinatorSchema`](/docs/combinators/type-aliases/CombinatorSchema.md)\<`T`\> | The base combinator schema.                             |
| `defaultValue` | `D`                                                                                   | The default value, a value of the schema's parsed type. |

## Returns

`WithFlag<S, CombinatorWithDefault<T>>` — A new schema with the default value set.

## Examples

```ts
const args = {
  port: withDefault(integer({ min: 1, max: 65535 }), 8080)
}
```

## Tags

- `@typeParam` — T - The schema's parsed type.
