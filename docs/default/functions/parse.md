[**args-tokens**](../../index.md)

---

[args-tokens](../../index.md) / [default](../index.md) / parse

# Function: parse()

```ts
function parse<A>(args, options?): ParsedArgs<A>
```

Parse command line arguments.

This function is a convenient API, that is used [parseArgs](parseArgs.md) and [resolveArgs](resolveArgs.md) in internal.

## Type Parameters

| Type Parameter                                | Description                                                                                            |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `A` _extends_ [`Args`](../interfaces/Args.md) | [Arguments schema](../interfaces/Args.md), which is an object that defines the command line arguments. |

## Parameters

| Parameter | Type                                                   | Description                                                                    |
| --------- | ------------------------------------------------------ | ------------------------------------------------------------------------------ |
| `args`    | `string`[]                                             | command line arguments                                                         |
| `options` | [`ParseOptions`](../interfaces/ParseOptions.md)\<`A`\> | parse options, about details see [ParseOptions](../interfaces/ParseOptions.md) |

## Returns

[`ParsedArgs`](../type-aliases/ParsedArgs.md)\<`A`\>

An object that contains the values of the arguments, positional arguments, AggregateError \| validation errors, and [argument tokens](../interfaces/ArgToken.md).

## Example

```js
import { parse } from 'args-tokens'

const { values, positionals } = parse(process.argv.slice(2))
console.log('values', values)
console.log('positionals', positionals)
```
