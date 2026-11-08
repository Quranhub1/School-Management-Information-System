import * as XLSX from 'xlsx'

export const MAX_SPREADSHEET_BYTES = 10 * 1024 * 1024
export const MAX_SPREADSHEET_ROWS = 50_000
export const MAX_SPREADSHEET_COLUMNS = 200
export const MAX_SPREADSHEET_SHEETS = 20

const ALLOWED_EXTENSIONS = new Set(['xlsx', 'xls', 'xlsm', 'xlsb', 'ods', 'csv', 'tsv'])

export interface ParsedSpreadsheet {
  sheetName: string
  sheetNames: string[]
  rows: Record<string, unknown>[]
  csvData: string
}

function extensionOf(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() ?? ''
}

function assertSafeHeaders(headers: unknown[]) {
  const unsafe = new Set(['__proto__', 'prototype', 'constructor'])
  for (const header of headers) {
    if (typeof header === 'string' && unsafe.has(header.trim().toLowerCase())) {
      throw new Error(`The spreadsheet contains a prohibited column name: ${header}`)
    }
  }
}

/** Prevent spreadsheet formula injection when exporting untrusted text values. */
export function sanitizeSpreadsheetRows<T extends object>(rows: T[]): T[] {
  return rows.map(row => Object.fromEntries(
    Object.entries(row).map(([key, value]) => {
      if (typeof value === 'string' && /^\s*[=+@-]/.test(value)) return [key, "'" + value]
      return [key, value]
    }),
  ) as unknown as T)
}

/** Parse a locally selected workbook with strict resource bounds. */
export async function parseSpreadsheetFile(file: File, selectedSheet?: string): Promise<ParsedSpreadsheet> {
  if (!ALLOWED_EXTENSIONS.has(extensionOf(file.name))) {
    throw new Error('Choose an Excel, OpenDocument or CSV/TSV spreadsheet file.')
  }
  if (file.size <= 0 || file.size > MAX_SPREADSHEET_BYTES) {
    throw new Error('The spreadsheet must be between 1 byte and 10 MB.')
  }

  const workbook = XLSX.read(await file.arrayBuffer(), {
    type: 'array',
    cellDates: true,
    dense: true,
    WTF: true,
  })

  if (!workbook.SheetNames.length || workbook.SheetNames.length > MAX_SPREADSHEET_SHEETS) {
    throw new Error(`The workbook must contain between 1 and ${MAX_SPREADSHEET_SHEETS} worksheets.`)
  }

  const sheetName = selectedSheet ?? workbook.SheetNames[0]
  if (!workbook.SheetNames.includes(sheetName)) throw new Error('The selected worksheet does not exist.')
  const worksheet = workbook.Sheets[sheetName]
  if (!worksheet) throw new Error('The selected worksheet is empty.')

  const range = XLSX.utils.decode_range(worksheet['!ref'] ?? 'A1:A1')
  const columnCount = range.e.c - range.s.c + 1
  const rowCount = range.e.r - range.s.r + 1
  if (columnCount > MAX_SPREADSHEET_COLUMNS) throw new Error(`Worksheets may contain at most ${MAX_SPREADSHEET_COLUMNS} columns.`)
  if (rowCount > MAX_SPREADSHEET_ROWS) throw new Error(`Worksheets may contain at most ${MAX_SPREADSHEET_ROWS} rows.`)

  const headers = XLSX.utils.sheet_to_json<unknown[]>(worksheet, { header: 1, blankrows: false, raw: false })[0] ?? []
  assertSafeHeaders(headers)
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: '', raw: false, blankrows: false })
  if (rows.length > MAX_SPREADSHEET_ROWS) throw new Error('The worksheet exceeds the row limit.')

  return { sheetName, sheetNames: [...workbook.SheetNames], rows, csvData: XLSX.utils.sheet_to_csv(worksheet, { blankrows: false }) }
}

export function exportRowsToExcel<T extends object>(rows: T[], filename: string, sheetName = 'Data'): void {
  if (!rows.length) throw new Error('There are no rows to export.')
  const workbook = XLSX.utils.book_new()
  const worksheet = XLSX.utils.json_to_sheet(sanitizeSpreadsheetRows(rows), { skipHeader: false })
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.slice(0, 31) || 'Data')
  XLSX.writeFile(workbook, filename.replace(/\.xlsx$/i, '') + '.xlsx', { bookType: 'xlsx', compression: true })
}
