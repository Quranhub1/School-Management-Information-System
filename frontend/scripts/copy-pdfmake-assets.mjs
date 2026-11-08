import { copyFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const source = resolve(root, 'node_modules', 'pdfmake', 'build')
const target = resolve(root, 'public', 'assets', 'pdfmake')
mkdirSync(target, { recursive: true })

for (const file of ['pdfmake.min.js', 'vfs_fonts.js']) {
  copyFileSync(resolve(source, file), resolve(target, file))
}
console.log('Local PDFMake browser assets copied for offline document templates.')
