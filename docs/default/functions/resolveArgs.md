[**args-tokens**](../../index.md)

---

[args-tokens](../../index.md) / [default](../index.md) / resolveArgs

# Function: resolveArgs()

```ts
function resolveArgs<A>(args, tokens, resolveArgs?): object
```

Resolve command line arguments.

## Type Parameters

| Type Parameter                                | Description                                                                                     |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `A` _extends_ [`Args`](../interfaces/Args.md) | [Arguments](../interfaces/Args.md), which is an object that defines the command line arguments. |

## Parameters

| Parameter     | Type                                          | Description                                                                   |
| ------------- | --------------------------------------------- | ----------------------------------------------------------------------------- |
| `args`        | `A`                                           | An arguments that contains [arguments schema](../interfaces/ArgSchema.md).    |
| `tokens`      | [`ArgToken`](../interfaces/ArgToken.md)[]     | An array of [tokens](../interfaces/ArgToken.md).                              |
| `resolveArgs` | [`ResolveArgs`](../interfaces/ResolveArgs.md) | An arguments that contains [resolve arguments](../interfaces/ResolveArgs.md). |

## Returns

`object`

An object that contains the values of the arguments, positional arguments, rest arguments, AggregateError \| validation errors, and explicit provision status.

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

## Example

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
