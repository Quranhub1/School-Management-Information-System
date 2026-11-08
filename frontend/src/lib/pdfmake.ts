import * as pdfMakeModule from 'pdfmake/build/pdfmake'
import * as pdfFonts from 'pdfmake/build/vfs_fonts'

type PdfDocumentDefinition = Record<string, unknown>
type PdfMakeEngine = {
  addVirtualFileSystem?: (fonts: unknown) => void
  vfs?: Record<string, string>
  createPdf?: (definition: PdfDocumentDefinition) => {
    download: (filename?: string) => void
    print: () => void
    open: () => void
  }
}

export interface InstitutionalPdfOptions {
  title: string
  content: unknown[]
  filename?: string
  institutionName?: string
  motto?: string | null
  contactLines?: string[]
  accentColor?: string | null
  orientation?: 'portrait' | 'landscape'
  pageSize?: 'A4' | 'A3' | 'LETTER'
}

const pdfMake = (((pdfMakeModule as unknown as { default?: unknown }).default ?? pdfMakeModule) as unknown) as PdfMakeEngine
const fontBundle = ((pdfFonts as unknown as { default?: unknown }).default ?? pdfFonts) as unknown
let fontsRegistered = false

// Initialize only when a user requests a document. A PDF bundle issue must not
// prevent the dashboard or other workspaces from mounting.
function ensurePdfMakeReady() {
  if (fontsRegistered) return

  if (typeof pdfMake.addVirtualFileSystem === 'function') {
    pdfMake.addVirtualFileSystem(fontBundle)
  } else {
    const legacyVfs = (fontBundle as { pdfMake?: { vfs?: Record<string, string> }; vfs?: Record<string, string> }).pdfMake?.vfs
      ?? (fontBundle as { vfs?: Record<string, string> }).vfs
    if (!legacyVfs) throw new Error('The bundled PDFMake virtual font system is unavailable.')
    pdfMake.vfs = legacyVfs
  }

  if (typeof pdfMake.createPdf !== 'function') throw new Error('The bundled PDFMake document engine is unavailable.')
  fontsRegistered = true
}

function buildDefinition(options: InstitutionalPdfOptions): PdfDocumentDefinition {
  const accent = /^#[0-9a-f]{6}$/i.test(options.accentColor ?? '')
    ? options.accentColor as string
    : '#166534'
  const heading: unknown[] = []

  if (options.institutionName?.trim()) {
    heading.push({ text: options.institutionName.trim(), style: 'institutionName', alignment: 'center' })
  }
  if (options.motto?.trim()) {
    heading.push({ text: options.motto.trim(), style: 'institutionMotto', alignment: 'center' })
  }
  for (const line of options.contactLines ?? []) {
    if (line.trim()) heading.push({ text: line.trim(), style: 'institutionContact', alignment: 'center' })
  }
  if (heading.length) heading.push({ text: '', margin: [0, 0, 0, 8] })
  heading.push({ text: options.title, style: 'documentTitle', alignment: 'center', margin: [0, 4, 0, 14] })

  return {
    pageSize: options.pageSize ?? 'A4',
    pageOrientation: options.orientation ?? 'portrait',
    pageMargins: [36, 36, 36, 48],
    content: [...heading, ...options.content],
    defaultStyle: { font: 'Roboto', fontSize: 9, color: '#202124', lineHeight: 1.25 },
    styles: {
      institutionName: { fontSize: 15, bold: true, color: accent },
      institutionMotto: { fontSize: 9, italics: true, color: '#5f6368', margin: [0, 3, 0, 2] },
      institutionContact: { fontSize: 8, color: '#5f6368' },
      documentTitle: { fontSize: 13, bold: true, color: '#202124' },
      sectionHeading: { fontSize: 10, bold: true, color: accent, margin: [0, 10, 0, 5] },
      tableHeader: { bold: true, color: '#ffffff', fillColor: accent },
      muted: { fontSize: 8, color: '#6b7280' },
    },
    footer: (currentPage: number, pageCount: number) => ({
      text: `${options.institutionName?.trim() || 'School Management Information System'} · Page ${currentPage} of ${pageCount}`,
      alignment: 'center',
      fontSize: 8,
      color: '#6b7280',
      margin: [0, 16, 0, 0],
    }),
    info: { title: options.title, author: options.institutionName || 'School Management Information System', subject: options.title },
  }
}

function safeFilename(filename: string | undefined, title: string): string {
  const base = (filename || title).replace(/\.pdf$/i, '').replace(/[^a-z0-9-_]+/gi, '-').replace(/^-+|-+$/g, '')
  return `${base || 'smis-document'}.pdf`
}

export function downloadInstitutionalPdf(options: InstitutionalPdfOptions): void {
  ensurePdfMakeReady()
  pdfMake.createPdf!(buildDefinition(options)).download(safeFilename(options.filename, options.title))
}

export function printInstitutionalPdf(options: InstitutionalPdfOptions): void {
  ensurePdfMakeReady()
  pdfMake.createPdf!(buildDefinition(options)).print()
}

export function openInstitutionalPdf(options: InstitutionalPdfOptions): void {
  ensurePdfMakeReady()
  pdfMake.createPdf!(buildDefinition(options)).open()
  pdfMake.createPdf(buildDefinition(options)).download(safeFilename(options.filename, options.title))
}

export function printInstitutionalPdf(options: InstitutionalPdfOptions): void {
  pdfMake.createPdf(buildDefinition(options)).print()
}

export function openInstitutionalPdf(options: InstitutionalPdfOptions): void {
  pdfMake.createPdf(buildDefinition(options)).open()
}
