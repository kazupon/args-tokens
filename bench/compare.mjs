/**
 * Compare two builds of args-tokens with the suites of `bench/suites.js`:
 * `node bench/compare.mjs --base <lib directory> --head <lib directory> [--rounds 5]
 *   [--suites parse,positionals] [--threshold 0.1] [--json out.json] [--markdown out.md]`.
 *
 * Each round runs every suite once for each build, in a new process each time, and alternates which
 * build goes first. A benchmark is compared by the ratio of the head to the base in each round, and
 * reported with the median of the ratios. The control benchmark (`util.parseArgs`, which does not use
 * args-tokens) shows how noisy the machine is: its ratio should be 1.
 */

import { execFileSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'
import { suites } from './suites.js'

const { values: options } = parseArgs({
  options: {
    base: { type: 'string' },
    head: { type: 'string' },
    rounds: { type: 'string', default: '5' },
    suites: { type: 'string', default: Object.keys(suites).join(',') },
    threshold: { type: 'string', default: '0.1' },
    json: { type: 'string' },
    markdown: { type: 'string' }
  }
})
if (!options.base || !options.head) {
  console.error('usage: node bench/compare.mjs --base <lib directory> --head <lib directory> [...]')
  process.exit(2)
}
const rounds = Number(options.rounds)
const threshold = Number(options.threshold)
const suiteNames = options.suites.split(',')
const runner = path.join(path.dirname(fileURLToPath(import.meta.url)), 'run-suite.mjs')
const targets = { base: options.base, head: options.head }

function runSuite(libDir, suite, ...flags) {
  const out = execFileSync(process.execPath, ['--expose-gc', runner, libDir, suite, ...flags], {
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024
  })
  return JSON.parse(out)
}

const median = xs => {
  const s = [...xs].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

// what each input resolves to, for each build
const differences = {}
for (const suite of suiteNames) {
  const base = runSuite(targets.base, suite, '--check')
  const head = runSuite(targets.head, suite, '--check')
  for (const key of Object.keys(head)) {
    if (JSON.stringify(base[key]) !== JSON.stringify(head[key])) {
      differences[`${suite}: ${key}`] = { base: base[key], head: head[key] }
    }
  }
}

// the measurements, interleaved
const samples = {} // suite -> name -> { base: [], head: [] }
for (let round = 0; round < rounds; round++) {
  const order = round % 2 === 0 ? ['base', 'head'] : ['head', 'base']
  for (const suite of suiteNames) {
    for (const target of order) {
      const results = runSuite(targets[target], suite)
      for (const [name, r] of Object.entries(results)) {
        const entry = ((samples[suite] ??= {})[name] ??= {
          base: [],
          head: [],
          heap: { base: [], head: [] }
        })
        entry[target].push(r.avg)
        if (r.heap != null) {
          entry.heap[target].push(r.heap)
        }
      }
    }
  }
  console.error(`round ${round + 1}/${rounds} done`)
}

const report = { rounds, threshold, suites: {}, differences }
const rows = []
for (const suite of suiteNames) {
  const control = suites[suite].control
  report.suites[suite] = {}
  for (const [name, entry] of Object.entries(samples[suite])) {
    const ratios = entry.head.map((h, i) => h / entry.base[i])
    const summary = {
      base: median(entry.base),
      head: median(entry.head),
      ratio: median(ratios),
      min: Math.min(...ratios),
      max: Math.max(...ratios),
      heapBase: entry.heap.base.length ? median(entry.heap.base) : null,
      heapHead: entry.heap.head.length ? median(entry.heap.head) : null,
      control: name === control
    }
    summary.verdict = summary.control
      ? 'control'
      : summary.ratio >= 1 + threshold && summary.min > 1
        ? 'slower'
        : summary.ratio <= 1 - threshold && summary.max < 1
          ? 'faster'
          : 'same'
    report.suites[suite][name] = summary
    rows.push({ suite, name, ...summary })
  }
}
const controls = rows.filter(r => r.control)
report.noise = controls.length
  ? Math.max(...controls.map(r => Math.max(Math.abs(r.min - 1), Math.abs(r.max - 1))))
  : null

const ns = v => (v >= 1000 ? `${(v / 1000).toFixed(2)} µs` : `${v.toFixed(1)} ns`)
const kb = v => (v == null ? '—' : `${(v / 1024).toFixed(2)} KB`)
const pct = v => `${v >= 1 ? '+' : ''}${((v - 1) * 100).toFixed(1)}%`
const mark = { slower: '⚠️ slower', faster: '🚀 faster', same: '', control: 'control' }
let md = `### Benchmarks\n\n${rounds} rounds, head / base as the median of the ratios in each round (range in parentheses).`
if (report.noise != null) {
  md += ` Noise (the control): up to ${(report.noise * 100).toFixed(1)}%.`
}
md +=
  '\n\n| Suite | Benchmark | Base | Head | Head / base | Heap (base → head) | |\n| --- | --- | --- | --- | --- | --- | --- |\n'
for (const r of rows) {
  md += `| ${r.suite} | ${r.name} | ${ns(r.base)} | ${ns(r.head)} | ${pct(r.ratio)} (${pct(r.min)} … ${pct(r.max)}) | ${kb(r.heapBase)} → ${kb(r.heapHead)} | ${mark[r.verdict]} |\n`
}
if (Object.keys(differences).length) {
  md += `\nThe builds resolve these inputs differently, so they do different work:\n\n`
  for (const [key, d] of Object.entries(differences)) {
    md += `- ${key}: base \`${JSON.stringify(d.base)}\`, head \`${JSON.stringify(d.head)}\`\n`
  }
}
if (options.json) {
  writeFileSync(options.json, JSON.stringify(report, null, 2))
}
if (options.markdown) {
  writeFileSync(options.markdown, md)
}
console.log(md)
if (process.env.GITHUB_ACTIONS) {
  for (const r of rows.filter(r => r.verdict === 'slower')) {
    console.log(
      `::warning title=Benchmark::${r.suite} / ${r.name}: ${pct(r.ratio)} (${pct(r.min)} … ${pct(r.max)})`
    )
  }
}
