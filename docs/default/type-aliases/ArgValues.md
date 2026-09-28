# Type Alias: ArgValues&lt;T&gt;

An object that contains the values of the arguments.

The value of an argument whose schema is a union, such as
`strict ? multiple(integer()) : string()` with the combinators, is typed as a value of any of its
schemas: `number[] | string`. The argument is typed as present only when each schema of the
union gives it a value, with a default, with `required: true` or as a required positional
argument.

When the type of one schema covers that of the other, as the type of `integer()` covers that of
`multiple(integer())`, TypeScript types a `?:` expression of them as the covering schema alone:
the value of `strict ? multiple(integer()) : integer()` is typed without the array, and
`strict ? multiple(positional()) : positional()` as present, although it may be missing. Give
each schema its own argument instead, or give the expression the type of both schemas with `as`,
as in `(strict ? many : one) as typeof many | typeof one` for `const many = multiple(integer())`
and `const one = integer()`.

## Signature

```ts
export type ArgValues<T> = T extends Args
  ? ResolveArgValues<T, { [Arg in keyof T]: ExtractOptionValue<T[Arg]> }>
  : { [option: string]: string | boolean | number | (string | boolean | number)[] | undefined }
```

## Type Parameters

| Name | Description                                                                                               |
| ---- | --------------------------------------------------------------------------------------------------------- |
| `T`  | [Arguments](/docs/default/interfaces/Args.md) which is an object that defines the command line arguments. |
