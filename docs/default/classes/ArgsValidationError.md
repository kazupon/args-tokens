# Class: ArgsValidationError

An error that contains structured metadata for argument validation failures.

The `message` remains the English fallback message. Renderers can use `code`
and `values` to localize the error, falling back to `message` when localization
is unavailable.

Each instance carries a non-enumerable brand keyed by
`Symbol.for('args-tokens.ArgsValidationError')`, which [isArgsValidationError](/docs/default/functions/isArgsValidationError.md)
uses to recognize instances created by another bundled copy of `args-tokens`.

## Extends

- `Error`

## Signature

```ts
export class ArgsValidationError extends Error
```

## Constructors

### Constructor

```ts
new ArgsValidationError(message: string, options: {
      code?: ArgsValidationErrorCode
      values?: Record<string, unknown>
      cause?: unknown
    } = {}): ArgsValidationError;
```

Create an `ArgsValidationError` instance.

#### Parameters

| Name              | Type                                                                                                                                                             | Description                                              |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `message`         | `string`                                                                                                                                                         | fallback error message                                   |
| `options`         | { `code`?: [`ArgsValidationErrorCode`](/docs/default/type-aliases/ArgsValidationErrorCode.md); `values`?: `Record`\<`string`, `unknown`\>; `cause`?: `unknown` } | structured validation metadata _(optional, default: {})_ |
| `options.code?`   | [`ArgsValidationErrorCode`](/docs/default/type-aliases/ArgsValidationErrorCode.md)                                                                               | _optional_                                               |
| `options.values?` | `Record<string, unknown>`                                                                                                                                        | _optional_                                               |
| `options.cause?`  | `unknown`                                                                                                                                                        | _optional_                                               |

#### Returns

[`ArgsValidationError`](/docs/default/classes/ArgsValidationError.md)

## Properties

| Name                          | Type                                                                               | Description                                                                                                  |
| ----------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `code` _(optional, readonly)_ | [`ArgsValidationErrorCode`](/docs/default/type-aliases/ArgsValidationErrorCode.md) | Machine-readable error code for this validation failure. This code can also be used as an i18n resource key. |
| `values` _(readonly)_         | `Record<string, unknown>`                                                          | Interpolation values for `code`.                                                                             |
