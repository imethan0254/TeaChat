#!/usr/bin/env node
// scripts/create-app.mjs — bootstrap a new product app from apps/template/
//
// Usage: npm run create-app <kebab-case-name>
//
// Copies apps/template/ → apps/<name>/ + patches package.json name + index.html title.

import { cpSync, existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

const name = process.argv[2]
if (!name) {
  console.error('Usage: npm run create-app <kebab-case-name>')
  console.error('Example: npm run create-app order-dashboard')
  process.exit(1)
}
if (!/^[a-z][a-z0-9-]*$/.test(name)) {
  console.error(`Name must be kebab-case lowercase: ${name}`)
  process.exit(1)
}

const src = join(REPO_ROOT, 'apps/template')
const dest = join(REPO_ROOT, 'apps', name)

if (existsSync(dest)) {
  console.error(`apps/${name}/ already exists`)
  process.exit(1)
}

cpSync(src, dest, { recursive: true })

// Patch package.json name
const pkgPath = join(dest, 'package.json')
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))
pkg.name = `@product/${name}`
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n')

// Patch index.html title
const htmlPath = join(dest, 'index.html')
const html = readFileSync(htmlPath, 'utf8').replace(
  /<title>Template<\/title>/,
  `<title>${name}</title>`,
)
writeFileSync(htmlPath, html)

console.log(`✓ Created apps/${name}/`)
console.log(``)
console.log(`Next steps:`)
console.log(`  npm install            # install workspace deps`)
console.log(`  cd apps/${name}`)
console.log(`  npm run dev            # start dev server`)
