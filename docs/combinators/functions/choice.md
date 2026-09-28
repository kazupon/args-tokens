# Function: choice()

## Call Signature

```ts
export function choice<const T extends readonly string[], const R extends boolean>(
  values: T,
  opts: BaseOptions & { required: R }
): WithRequiredOption<CombinatorSchema<T[number]>, R>
```

Create an enum-like argument schema with literal type inference.

Uses `const T` generic to infer literal union types from the values array.

### Type Parameters

| Name                              | Description                                                    |
| --------------------------------- | -------------------------------------------------------------- |
| `T` _extends_ `readonly string[]` | The readonly array of allowed string values.                   |
| `R` _extends_ `boolean`           | The type of `required` in the options, which the schema keeps. |

### Parameters

| Name     | Type                                                                                                                          | Description                                            |
| -------- | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `values` | `T`                                                                                                                           | Allowed values.                                        |
| `opts`   | [`BaseOptions`](/docs/combinators/interfaces/BaseOptions.md) & { [`required`](/docs/combinators/functions/required.md): `R` } | Common options (description, short, hidden, required). |

### Returns

`WithRequiredOption`\<[`CombinatorSchema`](/docs/combinators/type-aliases/CombinatorSchema.md)\<`T`\[`number`\]\>, `R`\> — A combinator schema that resolves to a union of the allowed values.

### Examples

```ts
const args = {
  level: choice(['debug', 'info', 'warn', 'error'] as const)
}
// typeof values.level === 'debug' | 'info' | 'warn' | 'error'
```

## Call Signature

```ts
export function choice<
  const T extends readonly string[],
  const R extends boolean | undefined = boolean | undefined
>(
  values: T,
  opts?: BaseOptions & { required?: R }
): WithUnrequiredOption<CombinatorSchema<T[number]>, R>
```

Create an enum-like argument schema with literal type inference.

Uses `const T` generic to infer literal union types from the values array.

### Type Parameters

| Name                                                          | Description                                                                                                                                                                                           |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `T` _extends_ `readonly string[]`                             | The readonly array of allowed string values.                                                                                                                                                          |
| `R` _extends_ `boolean \| undefined` = `boolean \| undefined` | The type of `required` in the options, which the schema keeps when it may be `false` but not `true`, as for `optional ? { required: false } : {}`, so that a positional argument with it is optional. |

### Parameters

| Name     | Type                                                                                                                           | Description                                                         |
| -------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------- |
| `values` | `T`                                                                                                                            | Allowed values.                                                     |
| `opts`   | [`BaseOptions`](/docs/combinators/interfaces/BaseOptions.md) & { [`required`](/docs/combinators/functions/required.md)?: `R` } | Common options (description, short, hidden, required). _(optional)_ |

### Returns

`WithUnrequiredOption`\<[`CombinatorSchema`](/docs/combinators/type-aliases/CombinatorSchema.md)\<`T`\[`number`\]\>, `R`\> — A combinator schema that resolves to a union of the allowed values.

### Examples

```ts
const args = {
  level: choice(['debug', 'info', 'warn', 'error'] as const)
}
// typeof values.level === 'debug' | 'info' | 'warn' | 'error'
```

## Call Signature

```ts
export function choice<const T extends readonly string[]>(
  values: T,
  opts?: BaseOptions
): CombinatorSchema<T[number]>
```

Create an enum-like argument schema with literal type inference.

Uses `const T` generic to infer literal union types from the values array.

### Type Parameters

| Name                              | Description                                  |
| --------------------------------- | -------------------------------------------- |
| `T` _extends_ `readonly string[]` | The readonly array of allowed string values. |

### Parameters

| Name     | Type                                                         | Description                                                         |
| -------- | ------------------------------------------------------------ | ------------------------------------------------------------------- |
| `values` | `T`                                                          | Allowed values.                                                     |
| `opts`   | [`BaseOptions`](/docs/combinators/interfaces/BaseOptions.md) | Common options (description, short, hidden, required). _(optional)_ |

### Returns

[`CombinatorSchema`](/docs/combinators/type-aliases/CombinatorSchema.md)\<`T`\[`number`\]\> — A combinator schema that resolves to a union of the allowed values.

### Examples

```ts
const args = {
  level: choice(['debug', 'info', 'warn', 'error'] as const)
}
// typeof values.level === 'debug' | 'info' | 'warn' | 'error'
```
