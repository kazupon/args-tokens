# Variable: ArgsValidationErrorKeys

Machine-readable error codes for [ArgsValidationError](/docs/default/classes/ArgsValidationError.md).

Each code identifies a validation failure category and is also suitable as an
i18n resource key for localized rendering.

## Signature

```ts
export const ArgsValidationErrorKeys = {
  requiredOption: 'err:arg:required-option',
  requiredPositional: 'err:arg:required-positional',
  invalidType: 'err:arg:invalid-type',
  invalidChoice: 'err:arg:invalid-choice',
  customParse: 'err:arg:custom-parse',
  unknownOption: 'err:arg:unknown-option',
  unexpectedValue: 'err:arg:unexpected-value',
  missingValue: 'err:arg:missing-value',
  conflict: 'err:arg:conflict',
  invalidDefault: 'err:arg:invalid-default'
} as const
```
