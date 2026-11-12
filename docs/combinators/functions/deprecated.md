# Function: deprecated()

Mark a combinator schema as deprecated: `true`, or the text that tells what to use instead.

The original schema is not modified. Like [hidden](/docs/combinators/functions/hidden.md), this only marks metadata for the tools
that read the schema, such as a CLI framework that warns when the argument is given and leaves it
out of the help. It does not change parsing, validation, required checks, defaults, conflicts,
or resolved values. For a union of schemas, such as `strict ? integer() : string()`, each schema
gets `deprecated`.

## Signature

```ts
export function deprecated<T extends ArgSchema, M extends string | undefined = undefined>(
  schema: T,
  message?: M
): T extends unknown
  ? WithFlag<T, CombinatorDeprecated<M extends string ? string : true>> & Omit<T, 'deprecated'>
  : never
```

## Type Parameters

| Name                                                               | Description                                                                           |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| `T` _extends_ [`ArgSchema`](/docs/default/interfaces/ArgSchema.md) | The schema type.                                                                      |
| `M` _extends_ `string \| undefined` = `undefined`                  | The type of `message`: `deprecated` is typed `string` with it, and `true` without it. |

## Parameters

| Name      | Type | Description                                                                                                          |
| --------- | ---- | -------------------------------------------------------------------------------------------------------------------- |
| `schema`  | `T`  | The base combinator schema.                                                                                          |
| `message` | `M`  | The text that tells what to use instead, such as `'Use --output.'`. Without it, `deprecated` is `true`. _(optional)_ |

## Returns

`T extends unknown ? WithFlag<T, CombinatorDeprecated<M extends string ? string : true>> & Omit<T, 'deprecated'> : never` — A new schema with `deprecated` set to `message`, or to `true`.

## Examples

```ts
const args = {
  output: string(),
  format: deprecated(string(), 'Use --output.')
}
```
