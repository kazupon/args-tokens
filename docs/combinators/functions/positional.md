[**args-tokens**](../../index.md)

---

[args-tokens](../../index.md) / [combinators](../index.md) / positional

# Function: positional()

## Call Signature

```ts
function positional(): ArgSchema & ArgSchemaPositionalType
```

**`Experimental`**

Create a positional argument schema.

Without a parser, resolves to string.
With a parser (e.g., `positional(integer())`), resolves to the parser's return type.

### Returns

[`ArgSchema`](../../default/interfaces/ArgSchema.md) & `ArgSchemaPositionalType`

A positional argument schema resolving to string.

### Example

```ts
const args = {
  command: positional(), // resolves to string
  port: positional(integer()) // resolves to number
}
```

## Call Signature

```ts
function positional<T>(parser): ArgSchema & Combinator<T> & ArgSchemaPositionalType
```

**`Experimental`**

Create a positional argument schema.

Without a parser, resolves to string.
With a parser (e.g., `positional(integer())`), resolves to the parser's return type.

### Type Parameters

| Type Parameter | Description                 |
| -------------- | --------------------------- |
| `T`            | The parser's resolved type. |

### Parameters

| Parameter | Type                                                             | Description                   |
| --------- | ---------------------------------------------------------------- | ----------------------------- |
| `parser`  | [`CombinatorSchema`](../type-aliases/CombinatorSchema.md)\<`T`\> | The parser combinator schema. |

### Returns

[`ArgSchema`](../../default/interfaces/ArgSchema.md) & [`Combinator`](../type-aliases/Combinator.md)\<`T`\> & `ArgSchemaPositionalType`

A positional argument schema resolving to string.

### Example

```ts
const args = {
  command: positional(), // resolves to string
  port: positional(integer()) // resolves to number
}
```
