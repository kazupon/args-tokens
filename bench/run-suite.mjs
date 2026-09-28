/**
 * Run one suite of `bench/suites.js` against one build of args-tokens, and print the results as JSON
 * (for each benchmark, the times per iteration in nanoseconds and the heap per iteration in bytes):
 * `node --expose-gc bench/run-suite.mjs <lib directory> <suite> [--check]`.
 * With `--check`, print what each input resolves to instead of measuring. A benchmark that throws
 * fails the run.
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
  const { benchmarks } = await run({ format: 'quiet', throw: true })
  const results = {}
  for (const b of benchmarks) {
    for (const r of b.runs) {
      const { avg, p50, p99, heap } = r.stats
      results[r.name] = { avg, p50, p99, heap: heap?.avg ?? null }
    }
  }
  console.log(JSON.stringify(results))
}
