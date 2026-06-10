# Type Alias: Combinator

> [!WARNING]
> This API is experimental and may change in future versions.

A combinator produced by combinator factory functions.

## Signature

```ts
export type Combinator<T> = { parse: (value: string) => T }
```

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

## Tags

- `@typeParam` — T - The parsed value type.
