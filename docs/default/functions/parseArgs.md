[**args-tokens**](../../index.md)

---

[args-tokens](../../index.md) / [default](../index.md) / parseArgs

# Function: parseArgs()

```ts
function parseArgs(args, options?): ArgToken[]
```

Parse command line arguments.

## Parameters

| Parameter | Type                                              | Description                                                                      |
| --------- | ------------------------------------------------- | -------------------------------------------------------------------------------- |
| `args`    | `string`[]                                        | command line arguments                                                           |
| `options` | [`ParserOptions`](../interfaces/ParserOptions.md) | parse options, about details see [ParserOptions](../interfaces/ParserOptions.md) |

## Returns

[`ArgToken`](../interfaces/ArgToken.md)[]

Argument tokens.

## Example

```js
import { parseArgs } from 'args-tokens' // for Node.js and Bun
// import { parseArgs } from 'jsr:@kazupon/args-tokens' // for Deno

const tokens = parseArgs(['--foo', 'bar', '-x', '--bar=baz'])
// do something with using tokens
// ...
console.log('tokens:', tokens)
```
