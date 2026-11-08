import { describe, expect, it } from 'vitest'
import { sanitizeSpreadsheetRows } from './spreadsheets'

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
