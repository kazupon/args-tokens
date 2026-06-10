/**
 * @author kazuya kawaguchi (a.k.a. kazupon)
 * @license MIT
 */

import { execFileSync } from 'node:child_process'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { generateOxContentApiDocs } from 'vitepress-api-references'

import config from '../api-docs.config.mjs'

const result = await generateOxContentApiDocs({
  ...config,
  write: false
})
const files = normalizeGeneratedFiles(result.files)

await rm(result.resolvedOptions.outDir, { recursive: true, force: true })

for (const [filePath, content] of Object.entries(files)) {
  const outputPath = path.join(result.resolvedOptions.outDir, filePath)
  await mkdir(path.dirname(outputPath), { recursive: true })
  await writeFile(outputPath, content)
}

formatGeneratedFiles(result.resolvedOptions.outDir)

for (const diagnostic of result.diagnostics) {
  console.warn(diagnostic)
}

if (result.diagnostics.length > 0) {
  process.exitCode = 1
}

console.log(`Generated ${Object.keys(files).length} files`)

function normalizeGeneratedFiles(files) {
  const sourceModuleFiles = new Set(
    Object.keys(files).filter(filePath => filePath.includes('/modules/'))
  )
  const linkReplacements = createModuleLinkReplacements(files)
  const normalized = {}

  for (const [filePath, content] of Object.entries(files)) {
    if (sourceModuleFiles.has(filePath)) {
      continue
    }

    normalized[filePath] = replaceModuleLinks(
      filePath.endsWith('/index.md') ? removeModulesSection(content) : content,
      linkReplacements
    )
  }

  return normalized
}

function createModuleLinkReplacements(files) {
  const replacements = new Map()

  for (const filePath of Object.keys(files)) {
    const match = filePath.match(
      /^(?<module>.+)\/(?:functions|classes|interfaces|type-aliases)\/(?<name>[^/]+)\.md$/
    )
    if (!match?.groups) {
      continue
    }

    replacements.set(`/${match.groups.module}/modules/${match.groups.name}.md`, `/${filePath}`)
  }

  return replacements
}

function replaceModuleLinks(content, replacements) {
  let next = content
  for (const [from, to] of replacements) {
    next = next.replaceAll(from, to)
  }
  return next
}

function removeModulesSection(content) {
  const sectionStart = content.indexOf('\n## Modules\n')
  if (sectionStart === -1) {
    return content
  }

  const nextSectionStart = content.indexOf('\n## ', sectionStart + 1)
  if (nextSectionStart === -1) {
    return `${content.slice(0, sectionStart).trimEnd()}\n`
  }

  return `${content.slice(0, sectionStart).trimEnd()}\n${content.slice(nextSectionStart)}`
}

function formatGeneratedFiles(outDir) {
  const binaryName = process.platform === 'win32' ? 'oxfmt.cmd' : 'oxfmt'
  const oxfmt = path.join(process.cwd(), 'node_modules', '.bin', binaryName)

  execFileSync(
    oxfmt,
    [
      outDir,
      '--config',
      './node_modules/@kazupon/prettier-config/index.json',
      '--no-error-on-unmatched-pattern'
    ],
    { stdio: 'inherit' }
  )
}
