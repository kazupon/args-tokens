/**
 * Compare two builds of args-tokens with the suites of `bench/suites.js`:
 * `node bench/compare.mjs --base <lib directory> --head <lib directory> [--rounds 5]
 *   [--suites parse,positionals] [--threshold 0.1] [--base-label <name>] [--head-label <name>]
 *   [--json out.json] [--markdown out.md]`, or `vp run bench:compare --base … --head …`.
 *
 * Each round runs every suite once for each build, in a new process each time, and alternates which
 * build goes first. A benchmark is compared by the ratio of the head to the base in each round, and
 * reported with the median of the ratios. It is marked slower (faster) when the median ratio is at
 * least 1 + threshold (at most 1 - threshold) and every round agrees. The control benchmark
 * (`util.parseArgs`, which does not use args-tokens) shows how noisy the machine is: its ratio
 * should be 1. Before measuring, each input is resolved with both builds, and the inputs whose
 * results differ are listed, since the builds then do different work.
 */

import { execFileSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'
import { suites } from './suites.js'

const argv = process.argv.slice(2)
// `vp run bench:compare -- --base …` passes the `--` on
if (argv[0] === '--') {
  argv.shift()
}
const { values: options } = parseArgs({
  args: argv,
  options: {
    base: { type: 'string' },
    head: { type: 'string' },
    rounds: { type: 'string', default: '5' },
    suites: { type: 'string', default: Object.keys(suites).join(',') },
    threshold: { type: 'string', default: '0.1' },
    'base-label': { type: 'string' },
    'head-label': { type: 'string' },
    json: { type: 'string' },
    markdown: { type: 'string' }
  }
})
const rounds = Number(options.rounds)
const threshold = Number(options.threshold)
const suiteNames = options.suites.split(',')
if (!options.base || !options.head) {
  fail('--base and --head take the lib directories of the two builds')
}
if (!Number.isInteger(rounds) || rounds < 1) {
  fail('--rounds takes a positive integer')
}
if (!(threshold > 0 && threshold < 1)) {
  fail('--threshold takes a number between 0 and 1')
}
const unknownSuites = suiteNames.filter(name => !Object.hasOwn(suites, name))
if (unknownSuites.length > 0) {
  fail(
    `unknown suites: ${unknownSuites.join(', ')} (the suites: ${Object.keys(suites).join(', ')})`
  )
}
const runner = path.join(path.dirname(fileURLToPath(import.meta.url)), 'run-suite.mjs')
const targets = { base: options.base, head: options.head }

function fail(message) {
  console.error(message)
  console.error('usage: node bench/compare.mjs --base <lib directory> --head <lib directory> [...]')
  process.exit(2)
}

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

// JSON with the keys of each object sorted, so that another order of the keys is no difference
const stringify = value =>
  JSON.stringify(value, (_, v) =>
    v && typeof v === 'object' && !Array.isArray(v)
      ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)))
      : v
  )

// what each input resolves to, for each build
const differences = {}
for (const suite of suiteNames) {
  const base = runSuite(targets.base, suite, '--check')
  const head = runSuite(targets.head, suite, '--check')
  for (const key of Object.keys(head)) {
    const [b, h] = [stringify(base[key]), stringify(head[key])]
    if (b !== h) {
      differences[`${suite} / ${key}`] = { base: b, head: h }
    }
  }
}

// the measurements, interleaved
const samples = {} // suite -> name -> { base: [], head: [], heap: { base: [], head: [] } }
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

const report = {
  rounds,
  threshold,
  baseLabel: options['base-label'] ?? null,
  headLabel: options['head-label'] ?? null,
  suites: {},
  differences
}
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
const pct = v => {
  const p = ((v - 1) * 100).toFixed(1)
  return p === '0.0' || p === '-0.0' ? '0.0%' : `${Number(p) > 0 ? '+' : ''}${p}%`
}
const mark = { slower: '⚠️ slower', faster: '🚀 faster', same: '', control: 'control' }

let md = '### Benchmarks\n\n'
const labels = [
  options['base-label'] && `Base: \`${options['base-label']}\`.`,
  options['head-label'] && `Head: \`${options['head-label']}\`.`
].filter(Boolean)
if (labels.length > 0) {
  md += `${labels.join(' ')}\n\n`
}
md += '| Suite | Benchmark | Base | Head | Change (range) | Heap per iteration (base → head) | |\n'
md += '| --- | --- | --- | --- | --- | --- | --- |\n'
for (const r of rows) {
  md += `| ${r.suite} | ${r.name} | ${ns(r.base)} | ${ns(r.head)} | ${pct(r.ratio)} (${pct(r.min)} … ${pct(r.max)}) | ${kb(r.heapBase)} → ${kb(r.heapHead)} | ${mark[r.verdict]} |\n`
}
md += `\nBase and Head: the time per iteration, the median of ${rounds} ${rounds === 1 ? 'round' : 'rounds'}. `
md +=
  'Change: the median of the ratios head / base in each round, with their range; + means that the '
md += `head is slower. ⚠️ slower / 🚀 faster: ${Math.round(threshold * 100)}% or more, in the same `
md += 'direction in every round.'
if (report.noise != null) {
  md += ` Noise: the control, \`util.parseArgs\`, which does not use args-tokens, moved by up to ${(report.noise * 100).toFixed(1)}%.`
}
md += '\n'
if (Object.keys(differences).length > 0) {
  md += '\nThe base and the head resolve these inputs differently, so they do different work, and '
  md += 'their times are not directly comparable:\n\n'
  for (const [key, d] of Object.entries(differences)) {
    md += `- ${key}\n  - base: \`${d.base}\`\n  - head: \`${d.head}\`\n`
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
  // the message of a workflow command: `%`, CR and LF are escaped
  const escape = s => s.replaceAll('%', '%25').replaceAll('\r', '%0D').replaceAll('\n', '%0A')
  for (const r of rows.filter(r => r.verdict === 'slower')) {
    console.log(
      `::warning title=Benchmark::${escape(`${r.suite} / ${r.name}: ${pct(r.ratio)} (${pct(r.min)} … ${pct(r.max)})`)}`
    )
  }
}
