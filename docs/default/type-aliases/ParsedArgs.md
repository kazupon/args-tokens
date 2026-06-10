# Type Alias: ParsedArgs

Parsed command line arguments.

## Signature

```ts
export type ParsedArgs<A extends Args> = {
  values: ArgValues<A>
  positionals: string[]
  rest: string[]
  error: AggregateError | undefined
  tokens: ArgToken[]
  explicit: ArgExplicitlyProvided<A>
}
```

## Properties

| Name          | Type                                                                                  | Description                                                                                                                                                                         |
| ------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `error`       | `AggregateError \| undefined`                                                         | Validation errors, same as `errors` in [resolveArgs](/docs/default/functions/resolveArgs.md).                                                                                       |
| `explicit`    | [`ArgExplicitlyProvided`](/docs/default/type-aliases/ArgExplicitlyProvided.md)\<`A`\> | Explicit provision status, same as `explicit` in [resolveArgs](/docs/default/functions/resolveArgs.md). Indicates which arguments were explicitly provided vs using default values. |
| `positionals` | `string[]`                                                                            | Positional arguments, same as `positionals` in [resolveArgs](/docs/default/functions/resolveArgs.md).                                                                               |
| `rest`        | `string[]`                                                                            | Rest arguments, same as `rest` in [resolveArgs](/docs/default/functions/resolveArgs.md).                                                                                            |
| `tokens`      | [`ArgToken`](/docs/default/interfaces/ArgToken.md)\[\]                                | Argument tokens, same as `tokens` which is parsed by [parseArgs](/docs/default/functions/parseArgs.md).                                                                             |
| `values`      | [`ArgValues`](/docs/default/type-aliases/ArgValues.md)\<`A`\>                         | Parsed values, same as `values` in [resolveArgs](/docs/default/functions/resolveArgs.md).                                                                                           |

## Tags

- `@typeParam` — A - [Arguments schema](/docs/default/interfaces/Args.md), which is an object that defines the command line arguments.
