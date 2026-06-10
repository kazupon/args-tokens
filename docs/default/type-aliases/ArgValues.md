# Type Alias: ArgValues

An object that contains the values of the arguments.

## Signature

```ts
export type ArgValues<T> = T extends Args
  ? ResolveArgValues<T, { [Arg in keyof T]: ExtractOptionValue<T[Arg]> }>
  : { [option: string]: string | boolean | number | (string | boolean | number)[] | undefined }
```

## Tags

- `@typeParam` — T - [Arguments](/docs/default/interfaces/Args.md) which is an object that defines the command line arguments.
