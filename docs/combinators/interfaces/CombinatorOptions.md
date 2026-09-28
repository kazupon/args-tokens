# Interface: CombinatorOptions&lt;T&gt;

Options for the [combinator](/docs/combinators/functions/combinator.md) factory function.

## Extends

- [`BaseOptions`](/docs/combinators/interfaces/BaseOptions.md)

## Signature

```ts
export interface CombinatorOptions<T> extends BaseOptions
```

## Type Parameters

| Name | Description            |
| ---- | ---------------------- |
| `T`  | The parsed value type. |

## Properties

| Name                   | Type                   | Description                                                                                                                                                                                                                                                  |
| ---------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `metavar` _(optional)_ | `string`               | Display name hint for help text generation. **Default:** `'custom'`                                                                                                                                                                                          |
| `parse`                | `(value: string) => T` | The parse function that converts a string to the desired type. It is called synchronously, as [ArgSchema](/docs/default/interfaces/ArgSchema.md).parse is: a promise that it returns becomes the value as is, and its rejection is not reported as an error. |

### parse Parameters

| Name    | Type     | Description             |
| ------- | -------- | ----------------------- |
| `value` | `string` | The input string value. |

### parse Returns

`T` — The parsed value of type T.
