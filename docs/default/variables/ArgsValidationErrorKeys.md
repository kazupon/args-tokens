# Variable: ArgsValidationErrorKeys

Error codes for [ArgsValidationError](/docs/default/classes/ArgsValidationError.md).

Each value is also an i18n resource key for argument validation errors.

## Signature

```ts
export const ArgsValidationErrorKeys = {
  requiredOption: 'err:arg:required-option',
  requiredPositional: 'err:arg:required-positional',
  invalidType: 'err:arg:invalid-type',
  invalidChoice: 'err:arg:invalid-choice',
  customParse: 'err:arg:custom-parse',
  unknownOption: 'err:arg:unknown-option'
} as const
```
