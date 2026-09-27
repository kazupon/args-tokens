import { expectTypeOf, test } from 'vite-plus/test'
import {
  describe,
  integer,
  map,
  multiple,
  positional,
  required,
  short,
  withDefault
} from './combinators.ts'

import type { CombinatorSchema } from './combinators.ts'
import type { ArgSchema, ArgValues } from './resolver.ts'

test('the modifiers on a schema typed by a type parameter give a combinator schema', () => {
  interface PortSchema {
    type: 'custom'
    parse: (value: string) => number
    description?: string
  }
  const alias = <S extends CombinatorSchema<number>>(schema: S) =>
    short(schema, 'a') satisfies CombinatorSchema<number>
  const note = <S extends CombinatorSchema<number>>(schema: S) =>
    describe(schema, 'Note') satisfies CombinatorSchema<number>
  const count = <S extends CombinatorSchema<number>>(schema: S) =>
    describe(short(schema, 'c'), 'Count') satisfies CombinatorSchema<number>
  const port = <S extends CombinatorSchema<number>>(schema: S) =>
    withDefault(describe(short(schema, 'p'), 'Port'), 8080) satisfies CombinatorSchema<number>
  const ids = <S extends CombinatorSchema<number>>(schema: S) =>
    required(multiple(schema)) satisfies CombinatorSchema<number>
  const label = <S extends CombinatorSchema<number>>(schema: S) =>
    map(describe(schema, 'Label'), n => `#${n}`) satisfies CombinatorSchema<string>
  const file = <S extends CombinatorSchema<number>>(schema: S) =>
    positional(schema) satisfies ArgSchema
  const size = <S extends CombinatorSchema<number>>(schema: S) =>
    withDefault(positional(schema), 1) satisfies CombinatorSchema<number>
  const doubled = <S extends PortSchema>(schema: S) =>
    withDefault(
      map(schema, n => n * 2),
      1
    ) satisfies CombinatorSchema<number>

  const portSchema: PortSchema = { type: 'custom', parse: Number }
  const args = {
    alias: alias(integer()),
    note: note(integer()),
    count: count(integer()),
    port: port(integer()),
    ids: ids(integer()),
    label: label(integer()),
    file: file(integer()),
    size: size(integer()),
    doubled: doubled(portSchema)
  }
  expectTypeOf<ArgValues<typeof args>>().toEqualTypeOf<{
    alias?: number
    note?: number
    count?: number
    port: number
    ids: number[]
    label?: string
    file: number
    size: number
    doubled: number
  }>()
})
