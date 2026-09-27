# Type Alias: ArgValues

An object that contains the values of the arguments.

The value of an argument whose schema is a union, such as
`strict ? multiple(integer()) : string()` with the combinators, is typed as a value of any of its
schemas: `number[] | string`. The argument is typed as present only when each schema of the
union gives it a value, with a default, with `required: true` or as a required positional
argument.

TypeScript types a `?:` expression of `multiple(schema)` and `schema`, such as
`strict ? multiple(integer()) : integer()`, as `schema` alone, since the type of `schema` covers
that of `multiple(schema)`, so its value is typed without the array: give each schema its own
argument instead, or check the value with `Array.isArray()`.

## Signature

```ts
export type ArgValues<T> = T extends Args
  ? ResolveArgValues<T, { [Arg in keyof T]: ExtractOptionValue<T[Arg]> }>
  : { [option: string]: string | boolean | number | (string | boolean | number)[] | undefined }
```

## Tags

- `@typeParam` — T - [Arguments](/docs/default/interfaces/Args.md) which is an object that defines the command line arguments.
