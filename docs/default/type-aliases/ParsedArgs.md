[**args-tokens**](../../index.md)

---

[args-tokens](../../index.md) / [default](../index.md) / ParsedArgs

# Type Alias: ParsedArgs\<A\>

```ts
type ParsedArgs<A> = object
```

Parsed command line arguments.

## Type Parameters

| Type Parameter                                | Description                                                                                            |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `A` _extends_ [`Args`](../interfaces/Args.md) | [Arguments schema](../interfaces/Args.md), which is an object that defines the command line arguments. |

## Properties

| Property                                        | Type                                                       | Description                                                                                                                                                              |
| ----------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| <a id="property-error"></a> `error`             | `AggregateError` \| `undefined`                            | Validation errors, same as `errors` in [resolveArgs](../functions/resolveArgs.md).                                                                                       |
| <a id="property-explicit"></a> `explicit`       | [`ArgExplicitlyProvided`](ArgExplicitlyProvided.md)\<`A`\> | Explicit provision status, same as `explicit` in [resolveArgs](../functions/resolveArgs.md). Indicates which arguments were explicitly provided vs using default values. |
| <a id="property-positionals"></a> `positionals` | `string`[]                                                 | Positional arguments, same as `positionals` in [resolveArgs](../functions/resolveArgs.md).                                                                               |
| <a id="property-rest"></a> `rest`               | `string`[]                                                 | Rest arguments, same as `rest` in [resolveArgs](../functions/resolveArgs.md).                                                                                            |
| <a id="property-tokens"></a> `tokens`           | [`ArgToken`](../interfaces/ArgToken.md)[]                  | Argument tokens, same as `tokens` which is parsed by [parseArgs](../functions/parseArgs.md).                                                                             |
| <a id="property-values"></a> `values`           | [`ArgValues`](ArgValues.md)\<`A`\>                         | Parsed values, same as `values` in [resolveArgs](../functions/resolveArgs.md).                                                                                           |
