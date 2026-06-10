# default

Main entry point of `args-tokens`.

## Functions

| Function                                              | Description                     |
| ----------------------------------------------------- | ------------------------------- |
| [parse](/docs/default/functions/parse.md)             | Parse command line arguments.   |
| [parseArgs](/docs/default/functions/parseArgs.md)     | Parse command line arguments.   |
| [resolveArgs](/docs/default/functions/resolveArgs.md) | Resolve command line arguments. |

## Classes

| Class                                                       | Description                                                                                         |
| ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| [ArgResolveError](/docs/default/classes/ArgResolveError.md) | An error that occurs when resolving arguments. This error is thrown when the argument is not valid. |

## Interfaces

| Interface                                                  | Description                                                                       |
| ---------------------------------------------------------- | --------------------------------------------------------------------------------- |
| [Args](/docs/default/interfaces/Args.md)                   | An object that contains [argument schema](/docs/default/interfaces/ArgSchema.md). |
| [ArgSchema](/docs/default/interfaces/ArgSchema.md)         | An argument schema definition for command-line argument parsing.                  |
| [ArgToken](/docs/default/interfaces/ArgToken.md)           | Argument token.                                                                   |
| [ParseOptions](/docs/default/interfaces/ParseOptions.md)   | Parse options for [parse](/docs/default/functions/parse.md) function.             |
| [ParserOptions](/docs/default/interfaces/ParserOptions.md) | Parser Options.                                                                   |
| [ResolveArgs](/docs/default/interfaces/ResolveArgs.md)     | An arguments for [resolve arguments](/docs/default/functions/resolveArgs.md).     |

## Type Aliases

| Type Alias                                                                   | Description                                                                    |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| [ArgExplicitlyProvided](/docs/default/type-aliases/ArgExplicitlyProvided.md) | Tracks which arguments were explicitly provided by the user.                   |
| [ArgResolveErrorType](/docs/default/type-aliases/ArgResolveErrorType.md)     | An error type for [ArgResolveError](/docs/default/classes/ArgResolveError.md). |
| [ArgValues](/docs/default/type-aliases/ArgValues.md)                         | An object that contains the values of the arguments.                           |
| [ParsedArgs](/docs/default/type-aliases/ParsedArgs.md)                       | Parsed command line arguments.                                                 |
