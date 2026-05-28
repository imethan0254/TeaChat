#!/usr/bin/env node
// scripts/create-app.mjs — bootstrap a new product app from apps/template/
//
// Usage: npm run create-app <kebab-case-name>
//
// Copies apps/template/ → apps/<name>/ + patches package.json name + index.html title.

import { cpSync, existsSync, readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs'
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

// Patch story titles `Apps/template/...` → `Apps/<name>/...`(防 Storybook id 撞 collide
// 與 template 的 stories — 否則 build 出 duplicate id warning + 只顯 template,新 product
// 在 sidebar 不可見。anchor 2026-05-28 verify-flow-test e2e test 抓到 4 duplicate ids)
function patchStoryTitles(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const stat = statSync(full)
    if (stat.isDirectory()) {
      patchStoryTitles(full)
    } else if (entry.endsWith('.stories.tsx') || entry.endsWith('.stories.ts') || entry.endsWith('.mdx')) {
      const content = readFileSync(full, 'utf8')
      // Match `title: 'Apps/template/...'` AND `title: "Apps/template/..."`
      const patched = content.replace(
        /(title:\s*['"`])Apps\/template\//g,
        `$1Apps/${name}/`,
      )
      if (patched !== content) {
        writeFileSync(full, patched)
      }
    }
  }
}
patchStoryTitles(join(dest, 'src'))

console.log(`✓ Created apps/${name}/`)
console.log(`✓ Patched story titles → Apps/${name}/...(防 Storybook id 撞 template)`)
console.log(``)
console.log(`Next steps:`)
console.log(`  npm install            # install workspace deps`)
console.log(`  cd apps/${name}`)
console.log(`  npm run dev            # start dev server`)
