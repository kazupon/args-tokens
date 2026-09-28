/**
 * Run one suite of `bench/suites.js` against one build of args-tokens, and print the result as JSON:
 * `node --expose-gc bench/run-suite.mjs <lib directory> <suite> [--check]`.
 * With `--check`, print what each input resolves to instead of measuring.
 */

import { bench, run } from 'mitata'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { suites } from './suites.js'

const [libDir, suiteName, flag] = process.argv.slice(2)
const suite = suites[suiteName]
if (!libDir || !suite) {
  console.error('usage: node --expose-gc bench/run-suite.mjs <lib directory> <suite> [--check]')
  process.exit(2)
}
const lib = await import(pathToFileURL(path.resolve(libDir, 'index.js')).href)

if (flag === '--check') {
  console.log(JSON.stringify(suite.check(lib)))
} else {
  suite.register(bench, lib)
  const { benchmarks } = await run({ format: 'quiet' })
  const results = {}
  for (const b of benchmarks) {
    for (const r of b.runs) {
      results[r.name] = r.stats
        ? { avg: r.stats.avg, p50: r.stats.p50, p99: r.stats.p99, heap: r.stats.heap?.avg ?? null }
        : { error: String(r.error) }
    }
  }
  console.log(JSON.stringify(results))
}
