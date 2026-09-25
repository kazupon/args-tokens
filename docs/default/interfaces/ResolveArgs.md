# Interface: ResolveArgs

An arguments for [resolve arguments](/docs/default/functions/resolveArgs.md).

## Signature

```ts
export interface ResolveArgs
```

## Properties

| Name                          | Type      | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ----------------------------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `shortGrouping` _(optional)_  | `boolean` | Whether to group short arguments. When `true`, each letter of a short option group is an option, and a value goes to the last one: `-vp 5` is `-v` and `-p` with `5`. When `false`, the other letters of a group are the value of its first option, which then does not take the next argument: `-p5 file` is `-p` with `5` and the positional `file`, and `-nfoo=bar` is `-n` with `foo=bar`. A boolean first option ignores the other letters, so `-vs` is only `-v`. **Default:** `false` |
| `skipPositional` _(optional)_ | `number`  | Skip positional arguments index. **Default:** `-1`                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `toKebab` _(optional)_        | `boolean` | Whether to convert the argument name to kebab-case. This option is applied to all arguments as `toKebab: true`, if set to `true`. **Default:** `false`                                                                                                                                                                                                                                                                                                                                       |
