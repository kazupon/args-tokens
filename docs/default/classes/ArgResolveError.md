# Class: ArgResolveError

An error that occurs when resolving arguments.
This error is thrown when the argument is not valid.

## Extends

- [`ArgsValidationError`](/docs/default/classes/ArgsValidationError.md)

## Signature

```ts
export class ArgResolveError extends ArgsValidationError
```

## Constructors

### Constructor

```ts
new ArgResolveError(message: string, name: string, type: ArgResolveErrorType, schema: ArgSchema, options: {
      code?: ArgsValidationErrorCode
      values?: Record<string, unknown>
      cause?: unknown
    } = {}): ArgResolveError;
```

Create an `ArgResolveError` instance.

#### Parameters

| Name              | Type                                                                                                                                                             | Description                                              |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `message`         | `string`                                                                                                                                                         | the error message                                        |
| `name`            | `string`                                                                                                                                                         | the name of the argument                                 |
| `type`            | [`ArgResolveErrorType`](/docs/default/type-aliases/ArgResolveErrorType.md)                                                                                       | the type of the error: 'type', 'required', or 'conflict' |
| `schema`          | [`ArgSchema`](/docs/default/interfaces/ArgSchema.md)                                                                                                             | the argument schema that caused the error                |
| `options`         | { `code`?: [`ArgsValidationErrorCode`](/docs/default/type-aliases/ArgsValidationErrorCode.md); `values`?: `Record`\<`string`, `unknown`\>; `cause`?: `unknown` } | structured validation metadata _(optional, default: {})_ |
| `options.code?`   | [`ArgsValidationErrorCode`](/docs/default/type-aliases/ArgsValidationErrorCode.md)                                                                               | _optional_                                               |
| `options.values?` | `Record<string, unknown>`                                                                                                                                        | _optional_                                               |
| `options.cause?`  | `unknown`                                                                                                                                                        | _optional_                                               |

#### Returns

[`ArgResolveError`](/docs/default/classes/ArgResolveError.md)

## Properties

| Name     | Type                                                                       | Description |
| -------- | -------------------------------------------------------------------------- | ----------- |
| `name`   | `string`                                                                   |             |
| `schema` | [`ArgSchema`](/docs/default/interfaces/ArgSchema.md)                       |             |
| `type`   | [`ArgResolveErrorType`](/docs/default/type-aliases/ArgResolveErrorType.md) |             |
