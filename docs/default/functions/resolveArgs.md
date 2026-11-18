# Function: resolveArgs()

Resolve command line arguments.

## Signature

```ts
export function resolveArgs<A extends Args>(
  args: A,
  tokens: ArgToken[],
  {
    shortGrouping = false,
    skipPositional = SKIP_POSITIONAL_DEFAULT,
    toKebab = false,
    passthrough = false
  }: ResolveArgs = {}
): {
  values: ArgValues<A>
  positionals: string[]
  rest: string[]
  error: AggregateError | undefined
  explicit: ArgExplicitlyProvided<A>
  /**
   * The indexes, in the arguments given to `parseArgs()`, of the arguments that the schema does not
   * take, in ascending order, with {@link ResolveArgs.passthrough | passthrough}. An empty array
   * without it.
   */
  passthroughIndices: number[]
}
```

## Type Parameters

| Name                                                     | Description                                                                                                |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `A` _extends_ [`Args`](/docs/default/interfaces/Args.md) | [Arguments](/docs/default/interfaces/Args.md), which is an object that defines the command line arguments. |

## Parameters

| Name          | Type                                                     | Description                                                                                                        |
| ------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `args`        | `A`                                                      | An arguments that contains [arguments schema](/docs/default/interfaces/ArgSchema.md).                              |
| `tokens`      | [`ArgToken`](/docs/default/interfaces/ArgToken.md)\[\]   | An array of [tokens](/docs/default/interfaces/ArgToken.md).                                                        |
| `resolveArgs` | [`ResolveArgs`](/docs/default/interfaces/ResolveArgs.md) | An arguments that contains [resolve arguments](/docs/default/interfaces/ResolveArgs.md). _(optional, default: {})_ |

## Returns

`object` — An object that contains the values of the arguments, positional arguments, rest arguments, validation errors, explicit provision status, and the indexes of the arguments that the schema does not take, with [passthrough](/docs/default/interfaces/ResolveArgs.md#property-passthrough).

### error

```ts
error: AggregateError | undefined
```

### explicit

```ts
explicit: ArgExplicitlyProvided<A>
```

### passthroughIndices

```ts
passthroughIndices: number[];
```

The indexes, in the arguments given to `parseArgs()`, of the arguments that the schema does not take, in ascending order, with [passthrough](/docs/default/interfaces/ResolveArgs.md#property-passthrough). An empty array without it.

### positionals

```ts
positionals: string[];
```

### rest

```ts
rest: string[];
```

### values

```ts
values: ArgValues<A>
```

## Examples

```typescript
// passed tokens: --port 3000

const { values, explicit } = resolveArgs(
  {
    port: {
      type: 'number',
      default: 8080
    },
    host: {
      type: 'string',
      default: 'localhost'
    }
  },
  parsedTokens
)

values.port // 3000
values.host // 'localhost'

explicit.port // true (explicitly provided)
explicit.host // false (not provided, fallback to default)
```
