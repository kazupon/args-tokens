# Class: ArgResolveError

An error that occurs when resolving arguments.
This error is thrown when the argument is not valid.

## Extends

- `Error`

## Signature

```ts
export class ArgResolveError extends Error
```

## Constructors

### Constructor

```ts
new ArgResolveError(message: string, name: string, type: ArgResolveErrorType, schema: ArgSchema): ArgResolveError;
```

Create an `ArgResolveError` instance.

#### Parameters

| Name      | Type                                                                       | Description                                        |
| --------- | -------------------------------------------------------------------------- | -------------------------------------------------- |
| `message` | `string`                                                                   | the error message                                  |
| `name`    | `string`                                                                   | the name of the argument                           |
| `type`    | [`ArgResolveErrorType`](/docs/default/type-aliases/ArgResolveErrorType.md) | the type of the error, either 'type' or 'required' |
| `schema`  | [`ArgSchema`](/docs/default/interfaces/ArgSchema.md)                       | the argument schema that caused the error          |

#### Returns

[`ArgResolveError`](/docs/default/classes/ArgResolveError.md)

## Properties

| Name     | Type                                                                       | Description |
| -------- | -------------------------------------------------------------------------- | ----------- |
| `name`   | `string`                                                                   |             |
| `schema` | [`ArgSchema`](/docs/default/interfaces/ArgSchema.md)                       |             |
| `type`   | [`ArgResolveErrorType`](/docs/default/type-aliases/ArgResolveErrorType.md) |             |
