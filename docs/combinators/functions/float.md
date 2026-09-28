# Function: float()

## Call Signature

```ts
export function float<const R extends boolean>(
  opts: FloatOptions & { required: R }
): WithRequiredOption<CombinatorSchema<number>, R>
```

Create a floating-point argument schema with optional range validation.

Rejects `NaN` and `Infinity` values.

### Parameters

| Name   | Type                                                                                                                            | Description    |
| ------ | ------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| `opts` | [`FloatOptions`](/docs/combinators/interfaces/FloatOptions.md) & { [`required`](/docs/combinators/functions/required.md): `R` } | Range options. |

### Returns

`WithRequiredOption`\<[`CombinatorSchema`](/docs/combinators/type-aliases/CombinatorSchema.md)\<`number`\>, `R`\> — A combinator schema that resolves to number (float).

### Examples

```ts
const args = {
  ratio: float({ min: 0, max: 1 })
}
```

### Tags

- `@typeParam` — R - The type of `required` in the options, which the schema keeps.

## Call Signature

```ts
export function float<const R extends boolean | undefined = boolean | undefined>(
  opts?: FloatOptions & { required?: R }
): WithUnrequiredOption<CombinatorSchema<number>, R>
```

Create a floating-point argument schema with optional range validation.

Rejects `NaN` and `Infinity` values.

### Parameters

| Name   | Type                                                                                                                             | Description                 |
| ------ | -------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| `opts` | [`FloatOptions`](/docs/combinators/interfaces/FloatOptions.md) & { [`required`](/docs/combinators/functions/required.md)?: `R` } | Range options. _(optional)_ |

### Returns

`WithUnrequiredOption`\<[`CombinatorSchema`](/docs/combinators/type-aliases/CombinatorSchema.md)\<`number`\>, `R`\> — A combinator schema that resolves to number (float).

### Examples

```ts
const args = {
  ratio: float({ min: 0, max: 1 })
}
```

### Tags

- `@typeParam` — R - The type of `required` in the options, which the schema keeps when it may be `false` but not `true`, as for `optional ? { required: false } : {}`, so that a positional argument with it is optional.

## Call Signature

```ts
export function float(opts?: FloatOptions): CombinatorSchema<number>
```

Create a floating-point argument schema with optional range validation.

Rejects `NaN` and `Infinity` values.

### Parameters

| Name   | Type                                                           | Description                 |
| ------ | -------------------------------------------------------------- | --------------------------- |
| `opts` | [`FloatOptions`](/docs/combinators/interfaces/FloatOptions.md) | Range options. _(optional)_ |

### Returns

[`CombinatorSchema`](/docs/combinators/type-aliases/CombinatorSchema.md)\<`number`\> — A combinator schema that resolves to number (float).

### Examples

```ts
const args = {
  ratio: float({ min: 0, max: 1 })
}
```
