[**args-tokens**](../../index.md)

---

[args-tokens](../../index.md) / [default](../index.md) / ArgValues

# Type Alias: ArgValues\<T\>

```ts
type ArgValues<T> = T extends Args
  ? ResolveArgValues<T, { [Arg in keyof T]: ExtractOptionValue<T[Arg]> }>
  : object
```

An object that contains the values of the arguments.

## Type Parameters

| Type Parameter | Description                                                                                    |
| -------------- | ---------------------------------------------------------------------------------------------- |
| `T`            | [Arguments](../interfaces/Args.md) which is an object that defines the command line arguments. |
