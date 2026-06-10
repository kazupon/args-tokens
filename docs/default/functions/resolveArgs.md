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
    toKebab = false
  }: ResolveArgs = {}
): {
  values: ArgValues<A>
  positionals: string[]
  rest: string[]
  error: AggregateError | undefined
  explicit: ArgExplicitlyProvided<A>
}
```

## Parameters

| Name          | Type                                                     | Description                                                                                                        |
| ------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `args`        | `A`                                                      | An arguments that contains [arguments schema](/docs/default/interfaces/ArgSchema.md).                              |
| `tokens`      | [`ArgToken`](/docs/default/interfaces/ArgToken.md)\[\]   | An array of [tokens](/docs/default/interfaces/ArgToken.md).                                                        |
| `resolveArgs` | [`ResolveArgs`](/docs/default/interfaces/ResolveArgs.md) | An arguments that contains [resolve arguments](/docs/default/interfaces/ResolveArgs.md). _(optional, default: {})_ |

## Returns

`object` — An object that contains the values of the arguments, positional arguments, rest arguments, validation errors, and explicit provision status.

### error

```ts
error: AggregateError | undefined
```

### explicit

```ts
explicit: ArgExplicitlyProvided<A>
```

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

## Tags

- `@typeParam` — A - [Arguments](/docs/default/interfaces/Args.md), which is an object that defines the command line arguments.
