[**args-tokens**](../index.md)

---

[args-tokens](../index.md) / combinators

# combinators

**`Experimental`**

Parser combinator factory functions for composable argument schema construction.

## Example

```ts
import { parseArgs, resolveArgs } from 'args-tokens'
import {
  args,
  string,
  integer,
  boolean,
  positional,
  choice,
  withDefault,
  multiple,
  required,
  short,
  map,
  merge,
  extend
} from 'args-tokens/combinators'

// Define reusable schema groups with args()
const common = args({
  help: short(boolean(), 'h'),
  verbose: boolean()
})

const network = args({
  port: short(withDefault(integer({ min: 1, max: 65535 }), 8080), 'p'),
  host: required(short(string({ minLength: 1 }), 'o'))
})

// Compose schemas with merge()
const schema = merge(
  common,
  network,
  args({
    command: positional()
  })
)

const argv = ['dev', '--port', '9131', '--host', 'example.com', '--verbose']
const tokens = parseArgs(argv)
const { values } = resolveArgs(schema, tokens)
```

This module is experimental and may change in future versions.

## Functions

| Function                                | Description |
| --------------------------------------- | ----------- |
| [args](functions/args.md)               | -           |
| [boolean](functions/boolean.md)         | -           |
| [choice](functions/choice.md)           | -           |
| [combinator](functions/combinator.md)   | -           |
| [describe](functions/describe.md)       | -           |
| [extend](functions/extend.md)           | -           |
| [float](functions/float.md)             | -           |
| [integer](functions/integer.md)         | -           |
| [map](functions/map.md)                 | -           |
| [merge](functions/merge.md)             | -           |
| [multiple](functions/multiple.md)       | -           |
| [number](functions/number.md)           | -           |
| [positional](functions/positional.md)   | -           |
| [required](functions/required.md)       | -           |
| [short](functions/short.md)             | -           |
| [string](functions/string.md)           | -           |
| [unrequired](functions/unrequired.md)   | -           |
| [withDefault](functions/withDefault.md) | -           |

## Interfaces

| Interface                                            | Description                                                             |
| ---------------------------------------------------- | ----------------------------------------------------------------------- |
| [BaseOptions](interfaces/BaseOptions.md)             | Common options shared by all base combinators.                          |
| [BooleanOptions](interfaces/BooleanOptions.md)       | Options for the [boolean](functions/boolean.md) combinator.             |
| [CombinatorOptions](interfaces/CombinatorOptions.md) | Options for the [combinator](functions/combinator.md) factory function. |
| [FloatOptions](interfaces/FloatOptions.md)           | Options for the [float](functions/float.md) combinator.                 |
| [IntegerOptions](interfaces/IntegerOptions.md)       | Options for the [integer](functions/integer.md) combinator.             |
| [NumberOptions](interfaces/NumberOptions.md)         | Options for the [number](functions/number.md) combinator.               |
| [StringOptions](interfaces/StringOptions.md)         | Options for the [string](functions/string.md) combinator.               |

## Type Aliases

| Type Alias                                           | Description                                                                                                                             |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| [Combinator](type-aliases/Combinator.md)             | A combinator produced by combinator factory functions.                                                                                  |
| [CombinatorSchema](type-aliases/CombinatorSchema.md) | A schema produced by combinator factory functions. Any [ArgSchema](../default/interfaces/ArgSchema.md) with a parse function qualifies. |
