# Function: parse()

## Call Signature

```ts
export function parse<A extends Args>(
  args: string[],
  options?: ParseOptions<A> & { passthrough?: false }
): ParsedArgs<A>
```

Parse command line arguments.

This function is a convenient API, that is used [parseArgs](/docs/default/functions/parseArgs.md) and [resolveArgs](/docs/default/functions/resolveArgs.md) in internal.

### Type Parameters

| Name                                                     | Description                                                                                                       |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `A` _extends_ [`Args`](/docs/default/interfaces/Args.md) | [Arguments schema](/docs/default/interfaces/Args.md), which is an object that defines the command line arguments. |

### Parameters

| Name      | Type                                                                                            | Description                                                                                            |
| --------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `args`    | `string[]`                                                                                      | command line arguments                                                                                 |
| `options` | [`ParseOptions`](/docs/default/interfaces/ParseOptions.md)\<`A`\> & { `passthrough`?: `false` } | parse options, about details see [ParseOptions](/docs/default/interfaces/ParseOptions.md) _(optional)_ |

### Returns

[`ParsedArgs`](/docs/default/type-aliases/ParsedArgs.md)\<`A`\> — An object that contains the values of the arguments, positional arguments, rest arguments, validation errors, explicit provision status, and [argument tokens](/docs/default/interfaces/ArgToken.md).

### Examples

```js
import { parse } from 'args-tokens'

const { values, positionals } = parse(process.argv.slice(2))
console.log('values', values)
console.log('positionals', positionals)
```

## Call Signature

```ts
export function parse<A extends Args>(
  args: string[],
  options: ParseOptions<A> & { passthrough: true }
): ParsedArgs<A> & {
  /**
   * The indexes of the arguments that the schema does not take, same as `passthroughIndices` in
   * {@link resolveArgs}.
   */
  passthroughIndices: number[]
  /**
   * The arguments that the schema does not take, as they were given and in their order: the
   * arguments at `passthroughIndices`. See {@link ResolveArgs.passthrough} for which arguments they
   * are.
   */
  passthrough: string[]
}
```

Parse command line arguments, and give the arguments that the schema does not take, with
[passthrough](/docs/default/interfaces/ResolveArgs.md#property-passthrough).

### Type Parameters

| Name                                                     | Description                                                                                                       |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `A` _extends_ [`Args`](/docs/default/interfaces/Args.md) | [Arguments schema](/docs/default/interfaces/Args.md), which is an object that defines the command line arguments. |

### Parameters

| Name      | Type                                                                                          | Description                                                                                                        |
| --------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `args`    | `string[]`                                                                                    | command line arguments                                                                                             |
| `options` | [`ParseOptions`](/docs/default/interfaces/ParseOptions.md)\<`A`\> & { `passthrough`: `true` } | parse options with `passthrough: true`, about details see [ParseOptions](/docs/default/interfaces/ParseOptions.md) |

### Returns

[`ParsedArgs`](/docs/default/type-aliases/ParsedArgs.md)\<`A`\> & { `passthroughIndices`: `number`\[\]; `passthrough`: `string`\[\] } — An object that contains the values of the arguments, positional arguments, rest arguments, validation errors, explicit provision status, [argument tokens](/docs/default/interfaces/ArgToken.md), and the arguments that the schema does not take and their indexes.

### Examples

```js
import { spawnSync } from 'node:child_process'
import { parse } from 'args-tokens'

// mytool test --reporter=dot src
const { passthrough } = parse(process.argv.slice(2), {
  args: { command: { type: 'positional' } },
  passthrough: true
})
// passthrough: ['--reporter=dot', 'src']
spawnSync('vitest', ['run', ...passthrough])
```

## Call Signature

```ts
export function parse<A extends Args>(
  args: string[],
  options?: ParseOptions<A>
): ParsedArgs<A> & {
  /**
   * Only with {@link ResolveArgs.passthrough | passthrough}.
   */
  passthroughIndices?: number[]
  /**
   * Only with {@link ResolveArgs.passthrough | passthrough}.
   */
  passthrough?: string[]
}
```

Parse command line arguments, with `passthrough` that may be `true` or not, such as a `boolean`.

### Type Parameters

| Name                                                     | Description                                                                                                       |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `A` _extends_ [`Args`](/docs/default/interfaces/Args.md) | [Arguments schema](/docs/default/interfaces/Args.md), which is an object that defines the command line arguments. |

### Parameters

| Name      | Type                                                              | Description                                                                                            |
| --------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `args`    | `string[]`                                                        | command line arguments                                                                                 |
| `options` | [`ParseOptions`](/docs/default/interfaces/ParseOptions.md)\<`A`\> | parse options, about details see [ParseOptions](/docs/default/interfaces/ParseOptions.md) _(optional)_ |

### Returns

[`ParsedArgs`](/docs/default/type-aliases/ParsedArgs.md)\<`A`\> & { `passthroughIndices`?: `number`\[\]; `passthrough`?: `string`\[\] } — The result of one of the overloads above, by whether `passthrough` is `true`.
