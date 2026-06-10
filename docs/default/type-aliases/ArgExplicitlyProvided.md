# Type Alias: ArgExplicitlyProvided

Tracks which arguments were explicitly provided by the user.

Each property indicates whether the corresponding argument was explicitly
provided (true) or is using a default value or not provided (false).

## Signature

```ts
export type ArgExplicitlyProvided<A extends Args> = { [K in keyof A]: boolean }
```

## Tags

- `@typeParam` — A - [Arguments](/docs/default/interfaces/Args.md), which is an object that defines the command line arguments.
