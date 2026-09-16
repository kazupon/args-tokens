# Function: isArgsValidationError()

Check whether the given value is an [ArgsValidationError](/docs/default/classes/ArgsValidationError.md).

## Signature

```ts
export function isArgsValidationError(error: unknown): error is ArgsValidationError
```

## Parameters

| Name    | Type      | Description    |
| ------- | --------- | -------------- |
| `error` | `unknown` | value to check |

## Returns

`error` `is` [`ArgsValidationError`](/docs/default/classes/ArgsValidationError.md) — `true` when the value is an `ArgsValidationError`
