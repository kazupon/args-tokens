# Function: isArgsValidationError()

Check whether the given value is an [ArgsValidationError](/docs/default/classes/ArgsValidationError.md).

This guard also recognizes errors created by another bundled copy of `args-tokens`
(0.29.0 or later), where `instanceof` does not match. Such an error must have an own brand
keyed by `Symbol.for('args-tokens.ArgsValidationError')` set to `true`, and a `values` object.
The guard does not rely on `error.name`, so subclasses such as [ArgResolveError](/docs/default/classes/ArgResolveError.md) that
override `name` are still recognized.

The guard narrows to `ArgsValidationError` only. Across bundled copies,
`instanceof ArgResolveError` still does not match.

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
