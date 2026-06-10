# Interface: ResolveArgs

An arguments for [resolve arguments](/docs/default/functions/resolveArgs.md).

## Signature

```ts
export interface ResolveArgs
```

## Properties

| Name                          | Type      | Description                                                                                                                                            |
| ----------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `shortGrouping` _(optional)_  | `boolean` | Whether to group short arguments. **Default:** `false`                                                                                                 |
| `skipPositional` _(optional)_ | `number`  | Skip positional arguments index. **Default:** `-1`                                                                                                     |
| `toKebab` _(optional)_        | `boolean` | Whether to convert the argument name to kebab-case. This option is applied to all arguments as `toKebab: true`, if set to `true`. **Default:** `false` |
