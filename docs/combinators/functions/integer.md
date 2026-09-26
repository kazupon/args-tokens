# Function: integer()

## Call Signature

```ts
export function integer<const R extends boolean>(
  opts: IntegerOptions & { required: R }
): WithRequiredOption<CombinatorSchema<number>, R>
```

> [!WARNING]
> This API is experimental and may change in future versions.

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

- `@typeParam` — R - The type of `required` in the options, which the schema keeps when it is `true` or `false`.

## Call Signature

```ts
export function integer(opts?: IntegerOptions): CombinatorSchema<number>
```

> [!WARNING]
> This API is experimental and may change in future versions.

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
