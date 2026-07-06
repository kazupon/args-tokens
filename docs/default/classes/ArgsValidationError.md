# Class: ArgsValidationError

An error that contains structured metadata for argument validation failures.

The `message` remains the English fallback message. Renderers can use
[code](#property-code) and [values](#property-values)
to localize the error, falling back to `message` when localization is unavailable.

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

| Name                          | Type                                                                               | Description                                      |
| ----------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------ |
| `code` _(optional, readonly)_ | [`ArgsValidationErrorCode`](/docs/default/type-aliases/ArgsValidationErrorCode.md) | i18n resource key for this validation error.     |
| `values` _(readonly)_         | `Record<string, unknown>`                                                          | Interpolation values for [code](#property-code). |
