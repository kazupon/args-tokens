[**args-tokens**](../../index.md)

---

[args-tokens](../../index.md) / [default](../index.md) / ParseOptions

# Interface: ParseOptions\<A\>

Parse options for [parse](../functions/parse.md) function.

## Extends

- [`ParserOptions`](ParserOptions.md).[`ResolveArgs`](ResolveArgs.md)

## Type Parameters

| Type Parameter                  | Description                                                                              |
| ------------------------------- | ---------------------------------------------------------------------------------------- |
| `A` _extends_ [`Args`](Args.md) | [Arguments schema](Args.md), which is an object that defines the command line arguments. |

## Properties

| Property                                                 | Type      | Description                                                                                                                                           | Inherited from                                                                                     |
| -------------------------------------------------------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| <a id="property-allowcompatible"></a> `allowCompatible?` | `boolean` | [Node.js parseArgs](https://nodejs.org/api/util.html#parseargs-tokens) tokens compatible mode. **Default** `false`                                    | [`ParserOptions`](ParserOptions.md).[`allowCompatible`](ParserOptions.md#property-allowcompatible) |
| <a id="property-args"></a> `args?`                       | `A`       | Command line arguments.                                                                                                                               | -                                                                                                  |
| <a id="property-shortgrouping"></a> `shortGrouping?`     | `boolean` | Whether to group short arguments. **See** guideline 5 in https://pubs.opengroup.org/onlinepubs/9799919799/basedefs/V1_chap12.html **Default** `false` | [`ResolveArgs`](ResolveArgs.md).[`shortGrouping`](ResolveArgs.md#property-shortgrouping)           |
| <a id="property-skippositional"></a> `skipPositional?`   | `number`  | Skip positional arguments index. **Default** `-1`                                                                                                     | [`ResolveArgs`](ResolveArgs.md).[`skipPositional`](ResolveArgs.md#property-skippositional)         |
| <a id="property-tokebab"></a> `toKebab?`                 | `boolean` | Whether to convert the argument name to kebab-case. This option is applied to all arguments as `toKebab: true`, if set to `true`. **Default** `false` | [`ResolveArgs`](ResolveArgs.md).[`toKebab`](ResolveArgs.md#property-tokebab)                       |
