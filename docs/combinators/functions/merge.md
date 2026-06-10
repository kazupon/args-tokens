# Function: merge()

## Call Signature

```ts
export function merge<A extends Args, B extends Args>(a: A, b: B): Omit<A, keyof B> & B
```

> [!WARNING]
> This API is experimental and may change in future versions.

Compose multiple [Args](/docs/default/interfaces/Args.md) schemas into one.

On key conflicts the later schema wins (last-write-wins).

### Parameters

| Name | Type | Description    |
| ---- | ---- | -------------- |
| `a`  | `A`  | First schema.  |
| `b`  | `B`  | Second schema. |

### Returns

`Omit<A, keyof B> & B` — A merged schema containing all fields.

### Examples

```ts
const common = args({ verbose: boolean() })
const network = args({ host: required(string()), port: withDefault(integer(), 8080) })
const schema = merge(common, network)
```

### Tags

- `@typeParam` — A - First schema type.

## Call Signature

```ts
export function merge<A extends Args, B extends Args, C extends Args>(
  a: A,
  b: B,
  c: C
): Omit<Omit<A, keyof B | keyof C> & Omit<B, keyof C>, never> & C
```

> [!WARNING]
> This API is experimental and may change in future versions.

Compose multiple [Args](/docs/default/interfaces/Args.md) schemas into one.

### Parameters

| Name | Type | Description    |
| ---- | ---- | -------------- |
| `a`  | `A`  | First schema.  |
| `b`  | `B`  | Second schema. |
| `c`  | `C`  | Third schema.  |

### Returns

`Omit<Omit<A, keyof B | keyof C> & Omit<B, keyof C>, never> & C` — A merged schema containing all fields.

## Call Signature

```ts
export function merge<A extends Args, B extends Args, C extends Args, D extends Args>(
  a: A,
  b: B,
  c: C,
  d: D
): MergeArgs<[A, B, C, D]>
```

> [!WARNING]
> This API is experimental and may change in future versions.

Compose multiple [Args](/docs/default/interfaces/Args.md) schemas into one.

### Parameters

| Name | Type | Description    |
| ---- | ---- | -------------- |
| `a`  | `A`  | First schema.  |
| `b`  | `B`  | Second schema. |
| `c`  | `C`  | Third schema.  |
| `d`  | `D`  | Fourth schema. |

### Returns

`MergeArgs<[A, B, C, D]>` — A merged schema containing all fields.

## Call Signature

```ts
export function merge<T extends Args[]>(...schemas: T): MergeArgs<T>
```

> [!WARNING]
> This API is experimental and may change in future versions.

Compose multiple [Args](/docs/default/interfaces/Args.md) schemas into one.

### Parameters

| Name      | Type | Description           |
| --------- | ---- | --------------------- |
| `schemas` | `T`  | The schemas to merge. |

### Returns

`MergeArgs<T>` — A merged schema containing all fields.
