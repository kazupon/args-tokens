# Function: string()

## Call Signature

```ts
export function string<const R extends boolean>(
  opts: StringOptions & { required: R }
): WithRequiredOption<CombinatorSchema<string>, R>
```

Create a string argument schema with optional validation.

### Type Parameters

| Name                    | Description                                                    |
| ----------------------- | -------------------------------------------------------------- |
| `R` _extends_ `boolean` | The type of `required` in the options, which the schema keeps. |

### Parameters

| Name   | Type                                                                                   | Description         |
| ------ | -------------------------------------------------------------------------------------- | ------------------- |
| `opts` | [`StringOptions`](/docs/combinators/interfaces/StringOptions.md) & { `required`: `R` } | Validation options. |

### Returns

`WithRequiredOption`\<[`CombinatorSchema`](/docs/combinators/type-aliases/CombinatorSchema.md)\<`string`\>, `R`\> — A combinator schema that resolves to string.

### Examples

```ts
const args = {
  name: string({ minLength: 1, maxLength: 50 })
}
```

## Call Signature

```ts
export function string<const R extends boolean | undefined = boolean | undefined>(
  opts?: StringOptions & { required?: R }
): WithUnrequiredOption<CombinatorSchema<string>, R>
```

Create a string argument schema with optional validation.

### Type Parameters

| Name                                                          | Description                                                                                                                                                                                           |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `R` _extends_ `boolean \| undefined` = `boolean \| undefined` | The type of `required` in the options, which the schema keeps when it may be `false` but not `true`, as for `optional ? { required: false } : {}`, so that a positional argument with it is optional. |

### Parameters

| Name   | Type                                                                                    | Description                      |
| ------ | --------------------------------------------------------------------------------------- | -------------------------------- |
| `opts` | [`StringOptions`](/docs/combinators/interfaces/StringOptions.md) & { `required`?: `R` } | Validation options. _(optional)_ |

### Returns

`WithUnrequiredOption`\<[`CombinatorSchema`](/docs/combinators/type-aliases/CombinatorSchema.md)\<`string`\>, `R`\> — A combinator schema that resolves to string.

### Examples

```ts
const args = {
  name: string({ minLength: 1, maxLength: 50 })
}
```

## Call Signature

```ts
export function string(opts?: StringOptions): CombinatorSchema<string>
```

Create a string argument schema with optional validation.

### Parameters

| Name   | Type                                                             | Description                      |
| ------ | ---------------------------------------------------------------- | -------------------------------- |
| `opts` | [`StringOptions`](/docs/combinators/interfaces/StringOptions.md) | Validation options. _(optional)_ |

### Returns

[`CombinatorSchema`](/docs/combinators/type-aliases/CombinatorSchema.md)\<`string`\> — A combinator schema that resolves to string.

### Examples

```ts
const args = {
  name: string({ minLength: 1, maxLength: 50 })
}
```
