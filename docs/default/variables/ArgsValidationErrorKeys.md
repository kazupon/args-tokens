# Variable: ArgsValidationErrorKeys

Machine-readable error codes for [ArgsValidationError](/docs/default/classes/ArgsValidationError.md).

Each code identifies a validation failure category and is also suitable as an
i18n resource key for localized rendering.

[resolveArgs](/docs/default/functions/resolveArgs.md) and `parse()` do not report `unknownOption`. An option that is not in the
schema takes the argument after it as its value, unless that argument is an option, and the value
is dropped: with no `foo` in the schema, `--foo bar` gives no positional argument.

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
