import { barplot, bench, run } from 'mitata'
import * as lib from '../lib/index.js'
import { suites } from './suites.js'

barplot(() => {
  suites.positionals.register(bench, lib)
})

await run()
