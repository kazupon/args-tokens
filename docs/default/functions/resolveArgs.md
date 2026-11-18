# Function: resolveArgs()

## Call Signature

```ts
export function resolveArgs<A extends Args>(
  args: A,
  tokens: ArgToken[],
  resolveArgs?: ResolveArgs & { passthrough?: false }
): {
  values: ArgValues<A>
  positionals: string[]
  rest: string[]
  error: AggregateError | undefined
  explicit: ArgExplicitlyProvided<A>
}
```

Resolve command line arguments.

### Type Parameters

| Name                                                     | Description                                                                                                |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `A` _extends_ [`Args`](/docs/default/interfaces/Args.md) | [Arguments](/docs/default/interfaces/Args.md), which is an object that defines the command line arguments. |

### Parameters

| Name          | Type                                                                                   | Description                                                                                           |
| ------------- | -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `args`        | `A`                                                                                    | An arguments that contains [arguments schema](/docs/default/interfaces/ArgSchema.md).                 |
| `tokens`      | [`ArgToken`](/docs/default/interfaces/ArgToken.md)\[\]                                 | An array of [tokens](/docs/default/interfaces/ArgToken.md).                                           |
| `resolveArgs` | [`ResolveArgs`](/docs/default/interfaces/ResolveArgs.md) & { `passthrough`?: `false` } | An arguments that contains [resolve arguments](/docs/default/interfaces/ResolveArgs.md). _(optional)_ |

### Returns

`object` — An object that contains the values of the arguments, positional arguments, rest arguments, validation errors, and explicit provision status.

#### error

```ts
error: AggregateError | undefined
```

#### explicit

```ts
explicit: ArgExplicitlyProvided<A>
```

#### positionals

```ts
positionals: string[];
```

#### rest

```ts
rest: string[];
```

#### values

```ts
values: ArgValues<A>
```

### Examples

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

## Call Signature

```ts
export function resolveArgs<A extends Args>(
  args: A,
  tokens: ArgToken[],
  resolveArgs: ResolveArgs & { passthrough: true }
): {
  values: ArgValues<A>
  positionals: string[]
  rest: string[]
  error: AggregateError | undefined
  explicit: ArgExplicitlyProvided<A>
  /**
   * The indexes, in the arguments given to `parseArgs()`, of the arguments that the schema does not
   * take, in ascending order. See {@link ResolveArgs.passthrough} for which arguments they are.
   */
  passthroughIndices: number[]
}
```

Resolve command line arguments, and give the indexes of the arguments that the schema does not
take, with [passthrough](/docs/default/interfaces/ResolveArgs.md#property-passthrough).

### Type Parameters

| Name                                                     | Description                                                                                                |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `A` _extends_ [`Args`](/docs/default/interfaces/Args.md) | [Arguments](/docs/default/interfaces/Args.md), which is an object that defines the command line arguments. |

### Parameters

| Name          | Type                                                                                 | Description                                                                                                        |
| ------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `args`        | `A`                                                                                  | An arguments that contains [arguments schema](/docs/default/interfaces/ArgSchema.md).                              |
| `tokens`      | [`ArgToken`](/docs/default/interfaces/ArgToken.md)\[\]                               | An array of [tokens](/docs/default/interfaces/ArgToken.md).                                                        |
| `resolveArgs` | [`ResolveArgs`](/docs/default/interfaces/ResolveArgs.md) & { `passthrough`: `true` } | An arguments that contains [resolve arguments](/docs/default/interfaces/ResolveArgs.md), with `passthrough: true`. |

### Returns

`object` — An object that contains the values of the arguments, positional arguments, rest arguments, validation errors, explicit provision status, and the indexes of the arguments that the schema does not take.

#### error

```ts
error: AggregateError | undefined
```

#### explicit

```ts
explicit: ArgExplicitlyProvided<A>
```

#### passthroughIndices

```ts
passthroughIndices: number[];
```

The indexes, in the arguments given to `parseArgs()`, of the arguments that the schema does not take, in ascending order. See [ResolveArgs.passthrough](/docs/default/interfaces/ResolveArgs.md#property-passthrough) for which arguments they are.

#### positionals

```ts
positionals: string[];
```

#### rest

```ts
rest: string[];
```

#### values

```ts
values: ArgValues<A>
```

### Examples

```typescript
// passed tokens: exec run.js --watch src

const { values, passthroughIndices } = resolveArgs(
  { script: { type: 'positional' } },
  parsedTokens,
  { skipPositional: 0, passthrough: true }
)

values.script // 'run.js'
passthroughIndices // [2, 3], the indexes of `--watch` and `src`
```

## Call Signature

```ts
export function resolveArgs<A extends Args>(
  args: A,
  tokens: ArgToken[],
  resolveArgs?: ResolveArgs
): {
  values: ArgValues<A>
  positionals: string[]
  rest: string[]
  error: AggregateError | undefined
  explicit: ArgExplicitlyProvided<A>
  /**
   * Only with {@link ResolveArgs.passthrough | passthrough}.
   */
  passthroughIndices?: number[]
}
```

Resolve command line arguments, with `passthrough` that may be `true` or not, such as a `boolean`.

### Type Parameters

| Name                                                     | Description                                                                                                |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `A` _extends_ [`Args`](/docs/default/interfaces/Args.md) | [Arguments](/docs/default/interfaces/Args.md), which is an object that defines the command line arguments. |

### Parameters

| Name          | Type                                                     | Description                                                                                           |
| ------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `args`        | `A`                                                      | An arguments that contains [arguments schema](/docs/default/interfaces/ArgSchema.md).                 |
| `tokens`      | [`ArgToken`](/docs/default/interfaces/ArgToken.md)\[\]   | An array of [tokens](/docs/default/interfaces/ArgToken.md).                                           |
| `resolveArgs` | [`ResolveArgs`](/docs/default/interfaces/ResolveArgs.md) | An arguments that contains [resolve arguments](/docs/default/interfaces/ResolveArgs.md). _(optional)_ |

### Returns

`object` — The result of one of the overloads above, by whether `passthrough` is `true`.

#### error

```ts
error: AggregateError | undefined
```

#### explicit

```ts
explicit: ArgExplicitlyProvided<A>
```

#### passthroughIndices

```ts
passthroughIndices?: number[];
```

Only with [passthrough](/docs/default/interfaces/ResolveArgs.md#property-passthrough).

#### positionals

```ts
positionals: string[];
```

#### rest

```ts
rest: string[];
```

#### values

```ts
values: ArgValues<A>
```
