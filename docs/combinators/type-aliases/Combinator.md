# Type Alias: Combinator&lt;T&gt;

A combinator produced by combinator factory functions.

## Signature

```ts
export type Combinator<T> = { parse: (value: string) => T }
```

## Type Parameters

| Name | Description            |
| ---- | ---------------------- |
| `T`  | The parsed value type. |

## Properties

| Name    | Type                   | Description                                                    |
| ------- | ---------------------- | -------------------------------------------------------------- |
| `parse` | `(value: string) => T` | The parse function that converts a string to the desired type. |

### parse Parameters

| Name    | Type     | Description             |
| ------- | -------- | ----------------------- |
| `value` | `string` | The input string value. |

### parse Returns

`T` — The parsed value of type T.
