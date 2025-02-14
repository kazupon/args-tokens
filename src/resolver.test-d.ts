import { expectTypeOf, test } from 'vitest'
import type { ArgValues } from './resolver'

test('ArgValues', () => {
  type Options = {
    help: {
      type: 'boolean'
      short: 'h'
    }
    version: {
      type: 'boolean'
      short: 'v'
    }
    port: {
      type: 'number'
      short: 'n'
      default: 8080
    }
    host: {
      type: 'string'
      short: 'o'
      required: true
    }
  }

  expectTypeOf<ArgValues<Options>>().toEqualTypeOf<{
    help?: boolean
    version?: boolean
    port: number
    host: string
  }>()
})
