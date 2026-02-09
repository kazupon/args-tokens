[**args-tokens**](../../index.md)

---

[args-tokens](../../index.md) / [default](../index.md) / ArgToken

# Interface: ArgToken

Argument token.

## Properties

| Property                                         | Type           | Description                                                                                                                                                             |
| ------------------------------------------------ | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="property-index"></a> `index`              | `number`       | Argument token index, e.g `--foo bar` => `--foo` index is 0, `bar` index is 1.                                                                                          |
| <a id="property-inlinevalue"></a> `inlineValue?` | `boolean`      | Inline value, e.g. `--foo=bar` => `true`, `-x=bar` => `true`.                                                                                                           |
| <a id="property-kind"></a> `kind`                | `ArgTokenKind` | Argument token kind.                                                                                                                                                    |
| <a id="property-name"></a> `name?`               | `string`       | Option name, e.g. `--foo` => `foo`, `-x` => `x`.                                                                                                                        |
| <a id="property-rawname"></a> `rawName?`         | `string`       | Raw option name, e.g. `--foo` => `--foo`, `-x` => `-x`.                                                                                                                 |
| <a id="property-value"></a> `value?`             | `string`       | Option value, e.g. `--foo=bar` => `bar`, `-x=bar` => `bar`. If the `allowCompatible` option is `true`, short option value will be same as Node.js `parseArgs` behavior. |
