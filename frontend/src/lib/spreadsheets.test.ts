import { describe, expect, it } from 'vitest'
import * as XLSX from 'xlsx'
import { parseSpreadsheetFile, sanitizeSpreadsheetRows } from './spreadsheets'

function workbookFile(sheets: Record<string, unknown[][]>, name = 'import.xlsx'): File {
  const workbook = XLSX.utils.book_new()
  for (const [sheetName, rows] of Object.entries(sheets)) {
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(rows), sheetName)
  }
  const bytes = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer
  return new File([bytes], name, { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
}

describe('spreadsheet export safety', () => {
  it('prefixes formula-like text to prevent spreadsheet formula injection', () => {
    const rows = sanitizeSpreadsheetRows([
      { name: '=HYPERLINK("https://example.invalid","click")', amount: 10 },
      { name: ' +SUM(A1:A2)', amount: 20 },
      { name: '-cmd|\'/C calc\'!A0', amount: 30 },
      { name: 'Ordinary text', amount: 40 },
    ])
    expect(rows.map(row => row.name)).toEqual([
      '\'=HYPERLINK("https://example.invalid","click")',
      "' +SUM(A1:A2)",
      "'-cmd|'/C calc'!A0",
      'Ordinary text',
    ])
  })

  it('does not mutate the original row objects', () => {
    const source = [{ value: '=1+1' }]
    const result = sanitizeSpreadsheetRows(source)
    expect(source[0].value).toBe('=1+1')
    expect(result[0].value).toBe("'=1+1")
  })
})


describe('local workbook parsing', () => {
  it('parses the selected worksheet and exposes available sheets', async () => {
    const file = workbookFile({
      Students: [['StudentNumber', 'FirstName'], ['STU001', 'Ada']],
      Staff: [['StaffNumber', 'FirstName'], ['STF001', 'Grace']],
    })
    const parsed = await parseSpreadsheetFile(file, 'Staff')
    expect(parsed.sheetName).toBe('Staff')
    expect(parsed.sheetNames).toEqual(['Students', 'Staff'])
    expect(parsed.rows).toEqual([{ StaffNumber: 'STF001', FirstName: 'Grace' }])
    expect(parsed.csvData).toContain('STF001')
  })

  it('rejects a worksheet name that is not in the workbook', async () => {
    const file = workbookFile({ Students: [['StudentNumber'], ['STU001']] })
    await expect(parseSpreadsheetFile(file, 'Missing')).rejects.toThrow('selected worksheet does not exist')
  })

  it('rejects prototype-sensitive header names', async () => {
    const file = workbookFile({ Students: [['__proto__', 'StudentNumber'], ['x', 'STU001']] })
    await expect(parseSpreadsheetFile(file)).rejects.toThrow('prohibited column name')
  })

  it('rejects unsupported file extensions before parsing', async () => {
    const file = new File(['not a workbook'], 'students.exe')
    await expect(parseSpreadsheetFile(file)).rejects.toThrow('Choose an Excel')
  })
})
