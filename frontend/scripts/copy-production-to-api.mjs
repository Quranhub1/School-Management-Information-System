import { cp, mkdir, rm, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const frontendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const repositoryRoot = path.resolve(frontendRoot, '..')
const source = path.join(frontendRoot, 'dist')
const destination = path.join(repositoryRoot, 'backend', 'src', 'SchoolManagement.Api', 'wwwroot')

try {
  const index = await stat(path.join(source, 'index.html'))
  if (!index.isFile()) throw new Error('frontend/dist/index.html is not a file')
} catch {
  throw new Error('Production frontend is missing. Run "npm run build:lan" from frontend first.')
}

await rm(destination, { recursive: true, force: true })
await mkdir(destination, { recursive: true })
await cp(source, destination, { recursive: true, force: true })
console.log(`Copied production frontend from ${source} to ${destination}`)
