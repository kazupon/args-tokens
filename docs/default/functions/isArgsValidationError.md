# Function: isArgsValidationError()

Check whether the given value is an [ArgsValidationError](/docs/default/classes/ArgsValidationError.md).

This guard also recognizes errors created by another bundled copy of `args-tokens`,
where `instanceof` does not match, by checking the brand keyed by
`Symbol.for('args-tokens.ArgsValidationError')`. It does not rely on `error.name`, so
subclasses such as [ArgResolveError](/docs/default/classes/ArgResolveError.md) that override `name` are still recognized.

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
