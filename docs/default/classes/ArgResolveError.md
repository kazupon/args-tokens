[**args-tokens**](../../index.md)

---

[args-tokens](../../index.md) / [default](../index.md) / ArgResolveError

# Class: ArgResolveError

An error that occurs when resolving arguments.
This error is thrown when the argument is not valid.

## Extends

- `Error`

## Constructors

### Constructor

```ts
new ArgResolveError(
   message,
   name,
   type,
   schema): ArgResolveError;
```

Create an `ArgResolveError` instance.

#### Parameters

| Parameter | Type                                                            | Description                                        |
| --------- | --------------------------------------------------------------- | -------------------------------------------------- |
| `message` | `string`                                                        | the error message                                  |
| `name`    | `string`                                                        | the name of the argument                           |
| `type`    | [`ArgResolveErrorType`](../type-aliases/ArgResolveErrorType.md) | the type of the error, either 'type' or 'required' |
| `schema`  | [`ArgSchema`](../interfaces/ArgSchema.md)                       | the argument schema that caused the error          |

#### Returns

`ArgResolveError`

#### Overrides

```ts
Error.constructor
```

## Methods

### captureStackTrace()

```ts
static captureStackTrace(targetObject, constructorOpt?): void;
```

Creates a `.stack` property on `targetObject`, which when accessed returns
a string representing the location in the code at which
`Error.captureStackTrace()` was called.

```js
const myObject = {}
Error.captureStackTrace(myObject)
myObject.stack // Similar to `new Error().stack`
```

The first line of the trace will be prefixed with
`${myObject.name}: ${myObject.message}`.

The optional `constructorOpt` argument accepts a function. If given, all frames
above `constructorOpt`, including `constructorOpt`, will be omitted from the
generated stack trace.

The `constructorOpt` argument is useful for hiding implementation
details of error generation from the user. For instance:

```js
function a() {
  b()
}

function b() {
  c()
}

function c() {
  // Create an error without stack trace to avoid calculating the stack trace twice.
  const { stackTraceLimit } = Error
  Error.stackTraceLimit = 0
  const error = new Error()
  Error.stackTraceLimit = stackTraceLimit

  // Capture the stack trace above function b
  Error.captureStackTrace(error, b) // Neither function c, nor b is included in the stack trace
  throw error
}

a()
```

#### Parameters

| Parameter         | Type       |
| ----------------- | ---------- |
| `targetObject`    | `object`   |
| `constructorOpt?` | `Function` |

#### Returns

`void`

#### Inherited from

```ts
Error.captureStackTrace
```

---

### isError()

```ts
static isError(error): error is Error;
```

Indicates whether the argument provided is a built-in Error instance or not.

#### Parameters

| Parameter | Type      |
| --------- | --------- |
| `error`   | `unknown` |

#### Returns

`error is Error`

#### Inherited from

```ts
Error.isError
```

---

### prepareStackTrace()

```ts
static prepareStackTrace(err, stackTraces): any;
```

#### Parameters

| Parameter     | Type         |
| ------------- | ------------ |
| `err`         | `Error`      |
| `stackTraces` | `CallSite`[] |

#### Returns

`any`

#### See

https://v8.dev/docs/stack-trace-api#customizing-stack-traces

#### Inherited from

```ts
Error.prepareStackTrace
```

## Properties

| Property                                                | Modifier | Type                                                            | Description                                                                                                                                                                                                                                                                                                                                                                                                                                       | Overrides    | Inherited from          |
| ------------------------------------------------------- | -------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | ----------------------- |
| <a id="property-cause"></a> `cause?`                    | `public` | `unknown`                                                       | -                                                                                                                                                                                                                                                                                                                                                                                                                                                 | -            | `Error.cause`           |
| <a id="property-message"></a> `message`                 | `public` | `string`                                                        | -                                                                                                                                                                                                                                                                                                                                                                                                                                                 | -            | `Error.message`         |
| <a id="property-name"></a> `name`                       | `public` | `string`                                                        | -                                                                                                                                                                                                                                                                                                                                                                                                                                                 | `Error.name` | -                       |
| <a id="property-schema"></a> `schema`                   | `public` | [`ArgSchema`](../interfaces/ArgSchema.md)                       | -                                                                                                                                                                                                                                                                                                                                                                                                                                                 | -            | -                       |
| <a id="property-stack"></a> `stack?`                    | `public` | `string`                                                        | -                                                                                                                                                                                                                                                                                                                                                                                                                                                 | -            | `Error.stack`           |
| <a id="property-type"></a> `type`                       | `public` | [`ArgResolveErrorType`](../type-aliases/ArgResolveErrorType.md) | -                                                                                                                                                                                                                                                                                                                                                                                                                                                 | -            | -                       |
| <a id="property-stacktracelimit"></a> `stackTraceLimit` | `static` | `number`                                                        | The `Error.stackTraceLimit` property specifies the number of stack frames collected by a stack trace (whether generated by `new Error().stack` or `Error.captureStackTrace(obj)`). The default value is `10` but may be set to any valid JavaScript number. Changes will affect any stack trace captured _after_ the value has been changed. If set to a non-number value, or set to a negative number, stack traces will not capture any frames. | -            | `Error.stackTraceLimit` |
