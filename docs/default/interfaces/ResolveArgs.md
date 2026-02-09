[**args-tokens**](../../index.md)

---

[args-tokens](../../index.md) / [default](../index.md) / ResolveArgs

# Interface: ResolveArgs

An arguments for [resolve arguments](../functions/resolveArgs.md).

## Extended by

- [`ParseOptions`](ParseOptions.md)

## Properties

| Property                                               | Type      | Description                                                                                                                                           |
| ------------------------------------------------------ | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="property-shortgrouping"></a> `shortGrouping?`   | `boolean` | Whether to group short arguments. **See** guideline 5 in https://pubs.opengroup.org/onlinepubs/9799919799/basedefs/V1_chap12.html **Default** `false` |
| <a id="property-skippositional"></a> `skipPositional?` | `number`  | Skip positional arguments index. **Default** `-1`                                                                                                     |
| <a id="property-tokebab"></a> `toKebab?`               | `boolean` | Whether to convert the argument name to kebab-case. This option is applied to all arguments as `toKebab: true`, if set to `true`. **Default** `false` |
