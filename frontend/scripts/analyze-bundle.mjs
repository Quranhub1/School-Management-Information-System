#!/usr/bin/env node
/** Bundle size analysis script for CI */

import fs from 'fs'
import path from 'path'
import { gzipSync } from 'zlib'

const DIST_DIR = path.resolve('dist')
const BUDGETS = {
  totalJS: 250 * 1024, // 250 KB
  totalCSS: 50 * 1024, // 50 KB
  chunks: {
    'vendor-react': 80 * 1024,
    'vendor-router': 20 * 1024,
    'vendor-query': 15 * 1024,
    'vendor-ui': 40 * 1024,
    'vendor-charts': 30 * 1024,
    'vendor-grid': 50 * 1024,
    'vendor-pdf': 25 * 1024,
  },
}

function getGzipSize(filePath: string): number {
  const content = fs.readFileSync(filePath)
  return gzipSync(content).length
}

function formatBytes(bytes: number): string {
  return `${(bytes / 1024).toFixed(1)} KB`
}

function main(): void {
  if (!fs.existsSync(DIST_DIR)) {
    console.error('❌ Dist directory not found. Run build first.')
    process.exit(1)
  }

  const assetsDir = path.join(DIST_DIR, 'assets')
  if (!fs.existsSync(assetsDir)) {
    console.error('❌ Assets directory not found.')
    process.exit(1)
  }

  const files = fs.readdirSync(assetsDir)
  const jsFiles = files.filter(f => f.endsWith('.js'))
  const cssFiles = files.filter(f => f.endsWith('.css'))

  console.log('📦 Bundle Size Analysis\n')

  let totalJS = 0
  let totalCSS = 0
  let hasViolations = false

  // Analyze JS chunks
  console.log('JavaScript Chunks:')
  for (const file of jsFiles) {
    const filePath = path.join(assetsDir, file)
    const size = getGzipSize(filePath)
    totalJS += size
    
    const chunkName = file.replace('.js', '').replace(/-[a-f0-9]{8,}$/, '')
    const budget = BUDGETS.chunks[chunkName as keyof typeof BUDGETS.chunks]
    
    let status = '✅'
    if (budget && size > budget) {
      status = '❌'
      hasViolations = true
      console.log(`  ${status} ${file}: ${formatBytes(size)} (budget: ${formatBytes(budget)}) - EXCEEDED`)
    } else if (budget) {
      const pct = ((size / budget) * 100).toFixed(0)
      console.log(`  ${status} ${file}: ${formatBytes(size)} / ${formatBytes(budget)} (${pct}%)`)
    } else {
      console.log(`  ${status} ${file}: ${formatBytes(size)}`)
    }
  }

  // Analyze CSS chunks
  console.log('\nCSS Chunks:')
  for (const file of cssFiles) {
    const filePath = path.join(assetsDir, file)
    const size = getGzipSize(filePath)
    totalCSS += size
    console.log(`  ✅ ${file}: ${formatBytes(size)}`)
  }

  // Totals
  console.log('\n📊 Totals:')
  console.log(`  Total JS: ${formatBytes(totalJS)} / ${formatBytes(BUDGETS.totalJS)} (${((totalJS / BUDGETS.totalJS) * 100).toFixed(0)}%)`)
  console.log(`  Total CSS: ${formatBytes(totalCSS)} / ${formatBytes(BUDGETS.totalCSS)} (${((totalCSS / BUDGETS.totalCSS) * 100).toFixed(0)}%)`)

  if (totalJS > BUDGETS.totalJS) {
    console.log('  ❌ Total JS budget exceeded!')
    hasViolations = true
  }
  if (totalCSS > BUDGETS.totalCSS) {
    console.log('  ❌ Total CSS budget exceeded!')
    hasViolations = true
  }

  if (hasViolations) {
    console.log('\n❌ Performance budget violations detected!')
    process.exit(1)
  } else {
    console.log('\n✅ All budgets within limits!')
  }
}

main()