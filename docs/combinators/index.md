# combinators

> [!WARNING]
> This module is experimental and may change in future versions.

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

## Functions

| Function                                                  | Description                                                                 |
| --------------------------------------------------------- | --------------------------------------------------------------------------- |
| [args](/docs/combinators/functions/args.md)               | Type-safe schema factory.                                                   |
| [boolean](/docs/combinators/functions/boolean.md)         | Create a boolean argument schema.                                           |
| [choice](/docs/combinators/functions/choice.md)           | Create an enum-like argument schema with literal type inference.            |
| [combinator](/docs/combinators/functions/combinator.md)   | Create a custom argument schema with a user-defined parse function.         |
| [describe](/docs/combinators/functions/describe.md)       | Set a description on a combinator schema for help text generation.          |
| [extend](/docs/combinators/functions/extend.md)           | Extend a schema by overriding or adding fields.                             |
| [float](/docs/combinators/functions/float.md)             | Create a floating-point argument schema with optional range validation.     |
| [integer](/docs/combinators/functions/integer.md)         | Create an integer argument schema with optional range validation.           |
| [map](/docs/combinators/functions/map.md)                 | Transform the output of a combinator schema.                                |
| [merge](/docs/combinators/functions/merge.md)             | Compose multiple [Args](/docs/default/interfaces/Args.md) schemas into one. |
| [multiple](/docs/combinators/functions/multiple.md)       | Mark a combinator schema as accepting multiple values.                      |
| [number](/docs/combinators/functions/number.md)           | Create a number argument schema with optional range validation.             |
| [positional](/docs/combinators/functions/positional.md)   | Create a positional argument schema.                                        |
| [required](/docs/combinators/functions/required.md)       | Mark a combinator schema as required.                                       |
| [short](/docs/combinators/functions/short.md)             | Set a short alias on a combinator schema.                                   |
| [string](/docs/combinators/functions/string.md)           | Create a string argument schema with optional validation.                   |
| [unrequired](/docs/combinators/functions/unrequired.md)   | Mark a combinator schema as not required.                                   |
| [withDefault](/docs/combinators/functions/withDefault.md) | Set a default value on a combinator schema.                                 |

## Interfaces

| Interface                                                              | Description                                                                               |
| ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| [BaseOptions](/docs/combinators/interfaces/BaseOptions.md)             | Common options shared by all base combinators.                                            |
| [BooleanOptions](/docs/combinators/interfaces/BooleanOptions.md)       | Options for the [boolean](/docs/combinators/functions/boolean.md) combinator.             |
| [CombinatorOptions](/docs/combinators/interfaces/CombinatorOptions.md) | Options for the [combinator](/docs/combinators/functions/combinator.md) factory function. |
| [FloatOptions](/docs/combinators/interfaces/FloatOptions.md)           | Options for the [float](/docs/combinators/functions/float.md) combinator.                 |
| [IntegerOptions](/docs/combinators/interfaces/IntegerOptions.md)       | Options for the [integer](/docs/combinators/functions/integer.md) combinator.             |
| [NumberOptions](/docs/combinators/interfaces/NumberOptions.md)         | Options for the [number](/docs/combinators/functions/number.md) combinator.               |
| [StringOptions](/docs/combinators/interfaces/StringOptions.md)         | Options for the [string](/docs/combinators/functions/string.md) combinator.               |

## Type Aliases

| Type Alias                                                             | Description                                                                                                                                |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| [Combinator](/docs/combinators/type-aliases/Combinator.md)             | A combinator produced by combinator factory functions.                                                                                     |
| [CombinatorSchema](/docs/combinators/type-aliases/CombinatorSchema.md) | A schema produced by combinator factory functions. Any [ArgSchema](/docs/default/interfaces/ArgSchema.md) with a parse function qualifies. |
