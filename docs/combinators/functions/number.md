# Function: number()

## Call Signature

```ts
export function number<const R extends boolean>(
  opts: NumberOptions & { required: R }
): WithRequiredOption<CombinatorSchema<number>, R>
```

> [!WARNING]
> This API is experimental and may change in future versions.

Create a number argument schema with optional range validation.

Accepts any numeric value (integer or float).

### Parameters

| Name   | Type                                                                                                                              | Description    |
| ------ | --------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| `opts` | [`NumberOptions`](/docs/combinators/interfaces/NumberOptions.md) & { [`required`](/docs/combinators/functions/required.md): `R` } | Range options. |

### Returns

`WithRequiredOption`\<[`CombinatorSchema`](/docs/combinators/type-aliases/CombinatorSchema.md)\<`number`\>, `R`\> — A combinator schema that resolves to number.

### Examples

```ts
const args = {
  timeout: number({ min: 0, max: 30000 })
}
```

### Tags

- `@typeParam` — R - The type of `required` in the options, which the schema keeps when it is `true` or `false`.

## Call Signature

```ts
export function number(opts?: NumberOptions): CombinatorSchema<number>
```

> [!WARNING]
> This API is experimental and may change in future versions.

Create a number argument schema with optional range validation.

Accepts any numeric value (integer or float).

### Parameters

| Name   | Type                                                             | Description                 |
| ------ | ---------------------------------------------------------------- | --------------------------- |
| `opts` | [`NumberOptions`](/docs/combinators/interfaces/NumberOptions.md) | Range options. _(optional)_ |

### Returns

[`CombinatorSchema`](/docs/combinators/type-aliases/CombinatorSchema.md)\<`number`\> — A combinator schema that resolves to number.

### Examples

```ts
const args = {
  timeout: number({ min: 0, max: 30000 })
}
```
