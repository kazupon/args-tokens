[**args-tokens**](../../index.md)

---

[args-tokens](../../index.md) / [default](../index.md) / ArgExplicitlyProvided

# Type Alias: ArgExplicitlyProvided\<A\>

```ts
type ArgExplicitlyProvided<A> = { [K in keyof A]: boolean }
```

Tracks which arguments were explicitly provided by the user.

Each property indicates whether the corresponding argument was explicitly
provided (true) or is using a default value or not provided (false).

## Type Parameters

| Type Parameter                                | Description                                                                                     |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `A` _extends_ [`Args`](../interfaces/Args.md) | [Arguments](../interfaces/Args.md), which is an object that defines the command line arguments. |
