# Variable: ArgsValidationErrorKeys

Machine-readable error codes for [ArgsValidationError](/docs/default/classes/ArgsValidationError.md).

Each code identifies a validation failure category and is also suitable as an
i18n resource key for localized rendering.

A value that breaks a constraint of the options of a combinator is reported with a code of its
own: `tooSmall` and `tooLarge` for `min` and `max` of `number()`, `integer()` and `float()`,
`tooShort` and `tooLong` for `minLength` and `maxLength` of `string()`, and `patternMismatch` for
its `pattern`. What a `parse` function of your own throws is reported as `customParse`.

[resolveArgs](/docs/default/functions/resolveArgs.md) and `parse()` do not report `unknownOption` or `unexpectedPositional`: a caller
that knows what a command takes, such as a CLI framework, reports them. An option that is not in the
schema takes the argument after it as its value, unless that argument is an option, and the value
is dropped: with no `foo` in the schema, `--foo bar` gives no positional argument. A positional
argument that the schema does not take stays in `positionals`, as the other positional arguments do.

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
  invalidDefault: 'err:arg:invalid-default',
  unexpectedPositional: 'err:arg:unexpected-positional',
  tooSmall: 'err:arg:too-small',
  tooLarge: 'err:arg:too-large',
  tooShort: 'err:arg:too-short',
  tooLong: 'err:arg:too-long',
  patternMismatch: 'err:arg:pattern-mismatch'
} as const
```
