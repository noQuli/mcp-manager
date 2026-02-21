/**
 * Runs automatically via the `version` npm lifecycle hook (after `npm version`
 * bumps package.json but before the git commit is made).
 *
 * What it does:
 *   - Reads the new version from package.json (already bumped by npm version).
 *   - Replaces the `## [Unreleased]` heading in CHANGELOG.md with
 *     `## [x.y.z] - YYYY-MM-DD` and inserts a fresh `## [Unreleased]` above it.
 */

import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf-8'))
const version = pkg.version
const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD

const changelogPath = resolve(root, 'CHANGELOG.md')
let changelog = readFileSync(changelogPath, 'utf-8')

const unreleasedHeading = '## [Unreleased]'

if (!changelog.includes(unreleasedHeading)) {
  console.error('[update-changelog] No "## [Unreleased]" section found in CHANGELOG.md — skipping.')
  process.exit(0)
}

const newVersionHeading = `## [${version}] - ${today}`
const replacement = `${unreleasedHeading}\n\n${newVersionHeading}`

changelog = changelog.replace(unreleasedHeading, replacement)

writeFileSync(changelogPath, changelog, 'utf-8')
console.log(`[update-changelog] Updated CHANGELOG.md: added ${newVersionHeading}`)
