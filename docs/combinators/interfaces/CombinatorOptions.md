[**args-tokens**](../../index.md)

---

[args-tokens](../../index.md) / [combinators](../index.md) / CombinatorOptions

# Interface: CombinatorOptions\<T\>

**`Experimental`**

Options for the [combinator](../functions/combinator.md) factory function.

## Type Parameters

| Type Parameter | Description            |
| -------------- | ---------------------- |
| `T`            | The parsed value type. |

## Properties

| Property                                 | Type             | Description                                                                           |
| ---------------------------------------- | ---------------- | ------------------------------------------------------------------------------------- |
| <a id="property-metavar"></a> `metavar?` | `string`         | **`Experimental`** Display name hint for help text generation. **Default** `'custom'` |
| <a id="property-parse"></a> `parse`      | (`value`) => `T` | **`Experimental`** The parse function that converts a string to the desired type.     |
