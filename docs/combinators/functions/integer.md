# Function: integer()

## Call Signature

```ts
export function integer<const R extends boolean>(
  opts: IntegerOptions & { required: R }
): WithRequiredOption<CombinatorSchema<number>, R>
```

Create an integer argument schema with optional range validation.

Only accepts integer values (no decimals).

### Parameters

| Name   | Type                                                                                                                                | Description    |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| `opts` | [`IntegerOptions`](/docs/combinators/interfaces/IntegerOptions.md) & { [`required`](/docs/combinators/functions/required.md): `R` } | Range options. |

### Returns

`WithRequiredOption`\<[`CombinatorSchema`](/docs/combinators/type-aliases/CombinatorSchema.md)\<`number`\>, `R`\> — A combinator schema that resolves to number (integer).

### Examples

```ts
const args = {
  retries: integer({ min: 0, max: 10 })
}
```

### Tags

- `@typeParam` — R - The type of `required` in the options, which the schema keeps.

## Call Signature

```ts
export function integer<const R extends boolean | undefined = boolean | undefined>(
  opts?: IntegerOptions & { required?: R }
): WithUnrequiredOption<CombinatorSchema<number>, R>
```

Create an integer argument schema with optional range validation.

Only accepts integer values (no decimals).

### Parameters

| Name   | Type                                                                                                                                 | Description                 |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------ | --------------------------- |
| `opts` | [`IntegerOptions`](/docs/combinators/interfaces/IntegerOptions.md) & { [`required`](/docs/combinators/functions/required.md)?: `R` } | Range options. _(optional)_ |

### Returns

`WithUnrequiredOption`\<[`CombinatorSchema`](/docs/combinators/type-aliases/CombinatorSchema.md)\<`number`\>, `R`\> — A combinator schema that resolves to number (integer).

### Examples

```ts
const args = {
  retries: integer({ min: 0, max: 10 })
}
```

### Tags

- `@typeParam` — R - The type of `required` in the options, which the schema keeps when it may be `false` but not `true`, as for `optional ? { required: false } : {}`, so that a positional argument with it is optional.

## Call Signature

```ts
export function integer(opts?: IntegerOptions): CombinatorSchema<number>
```

Create an integer argument schema with optional range validation.

Only accepts integer values (no decimals).

### Parameters

| Name   | Type                                                               | Description                 |
| ------ | ------------------------------------------------------------------ | --------------------------- |
| `opts` | [`IntegerOptions`](/docs/combinators/interfaces/IntegerOptions.md) | Range options. _(optional)_ |

### Returns

[`CombinatorSchema`](/docs/combinators/type-aliases/CombinatorSchema.md)\<`number`\> — A combinator schema that resolves to number (integer).

### Examples

```ts
const args = {
  retries: integer({ min: 0, max: 10 })
}
```
