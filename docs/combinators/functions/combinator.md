# Function: combinator()

> [!WARNING]
> This API is experimental and may change in future versions.

Create a custom argument schema with a user-defined parse function.

This is the most general custom combinator. Use it when none of the built-in
base combinators ([string](/docs/combinators/functions/string.md), [number](/docs/combinators/functions/number.md), [integer](/docs/combinators/functions/integer.md),
[float](/docs/combinators/functions/float.md), [boolean](/docs/combinators/functions/boolean.md), [choice](/docs/combinators/functions/choice.md)) fit your needs.

The returned schema has `type: 'custom'`.

## Signature

```ts
export function combinator<T, C extends CombinatorOptions<T> = CombinatorOptions<T>>(
  config: C & CombinatorOptions<T>
): WithRequiredOption<CombinatorSchema<T>, C>
```

## Parameters

| Name     | Type                                                                                  | Description                                               |
| -------- | ------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| `config` | `C` & [`CombinatorOptions`](/docs/combinators/interfaces/CombinatorOptions.md)\<`T`\> | Configuration with a parse function and optional metavar. |

## Returns

`WithRequiredOption`\<[`CombinatorSchema`](/docs/combinators/type-aliases/CombinatorSchema.md)\<`T`\>, `C`\> — A combinator schema that resolves to the parse function's return type.

## Examples

```ts
const date = combinator({
  parse: value => {
    const d = new Date(value)
    if (isNaN(d.getTime())) {
      throw new Error('Invalid date format')
    }
    return d
  },
  metavar: 'date'
})
```

## Tags

- `@typeParam` — T - The parsed value type.
