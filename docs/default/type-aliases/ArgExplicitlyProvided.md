# Type Alias: ArgExplicitlyProvided

Tracks which arguments were explicitly provided by the user.

Each property is `true` when the argument is given on the command line, and `false` when it is
not, whether it has a default or not. An option is given when one of its forms is, such as
`--port`, `-p` or `--no-color`, even if its value is missing or rejected: the error is reported,
and its default, if any, fills in the value, as when the option is not given. A positional
argument is given when a positional value is used for it, even if `parse` rejects the value.

## Signature

```ts
export type ArgExplicitlyProvided<A extends Args> = { [K in keyof A]: boolean }
```

## Tags

- `@typeParam` — A - [Arguments](/docs/default/interfaces/Args.md), which is an object that defines the command line arguments.
