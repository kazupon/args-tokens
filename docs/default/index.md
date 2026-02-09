[**args-tokens**](../index.md)

---

[args-tokens](../index.md) / default

# default

Main entry point of `args-tokens`.

## Functions

| Function                                | Description                     |
| --------------------------------------- | ------------------------------- |
| [parse](functions/parse.md)             | Parse command line arguments.   |
| [parseArgs](functions/parseArgs.md)     | Parse command line arguments.   |
| [resolveArgs](functions/resolveArgs.md) | Resolve command line arguments. |

## Classes

| Class                                         | Description                                                                                         |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| [ArgResolveError](classes/ArgResolveError.md) | An error that occurs when resolving arguments. This error is thrown when the argument is not valid. |

## Interfaces

| Interface                                    | Description                                                         |
| -------------------------------------------- | ------------------------------------------------------------------- |
| [Args](interfaces/Args.md)                   | An object that contains [argument schema](interfaces/ArgSchema.md). |
| [ArgSchema](interfaces/ArgSchema.md)         | An argument schema definition for command-line argument parsing.    |
| [ArgToken](interfaces/ArgToken.md)           | Argument token.                                                     |
| [ParseOptions](interfaces/ParseOptions.md)   | Parse options for [parse](functions/parse.md) function.             |
| [ParserOptions](interfaces/ParserOptions.md) | Parser Options.                                                     |
| [ResolveArgs](interfaces/ResolveArgs.md)     | An arguments for [resolve arguments](functions/resolveArgs.md).     |

## Type Aliases

| Type Alias                                                     | Description                                                      |
| -------------------------------------------------------------- | ---------------------------------------------------------------- |
| [ArgExplicitlyProvided](type-aliases/ArgExplicitlyProvided.md) | Tracks which arguments were explicitly provided by the user.     |
| [ArgResolveErrorType](type-aliases/ArgResolveErrorType.md)     | An error type for [ArgResolveError](classes/ArgResolveError.md). |
| [ArgValues](type-aliases/ArgValues.md)                         | An object that contains the values of the arguments.             |
| [ParsedArgs](type-aliases/ParsedArgs.md)                       | Parsed command line arguments.                                   |
