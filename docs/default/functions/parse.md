# Function: parse()

Parse command line arguments.

This function is a convenient API, that is used [parseArgs](/docs/default/functions/parseArgs.md) and [resolveArgs](/docs/default/functions/resolveArgs.md) in internal.

## Signature

```ts
export function parse<A extends Args>(args: string[], options: ParseOptions<A> = {}): ParsedArgs<A>
```

## Parameters

| Name      | Type                                                              | Description                                                                                                         |
| --------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `args`    | `string[]`                                                        | command line arguments                                                                                              |
| `options` | [`ParseOptions`](/docs/default/interfaces/ParseOptions.md)\<`A`\> | parse options, about details see [ParseOptions](/docs/default/interfaces/ParseOptions.md) _(optional, default: {})_ |

## Returns

[`ParsedArgs`](/docs/default/type-aliases/ParsedArgs.md)\<`A`\> — An object that contains the values of the arguments, positional arguments, validation errors, and [argument tokens](/docs/default/interfaces/ArgToken.md).

## Examples

```js
import { parse } from 'args-tokens'

const { values, positionals } = parse(process.argv.slice(2))
console.log('values', values)
console.log('positionals', positionals)
```

## Tags

- `@typeParam` — A - [Arguments schema](/docs/default/interfaces/Args.md), which is an object that defines the command line arguments.
