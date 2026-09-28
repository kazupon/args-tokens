import { barplot, bench, run } from 'mitata'
import * as lib from '../lib/index.js'
import { args, suites } from './suites.js'

console.log('benchmark arguments:', args)

barplot(() => {
  suites.parse.register(bench, lib)
})

await run()
