# Type Alias: ArgsValidationErrorCode

A machine-readable argument validation error code.

Each code is one of [ArgsValidationErrorKeys](/docs/default/variables/ArgsValidationErrorKeys.md) and can also be used as
an i18n resource key.

## Signature

```ts
export type ArgsValidationErrorCode =
  (typeof ArgsValidationErrorKeys)[keyof typeof ArgsValidationErrorKeys]
```
