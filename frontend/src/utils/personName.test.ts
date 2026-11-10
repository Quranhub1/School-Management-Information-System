import { describe, expect, it } from 'vitest'
import { formatPersonName } from './personName'

describe('formatPersonName', () => {
  it('displays surname, first name and other names in uppercase', () => {
    expect(formatPersonName('Nakibuule', 'Alice', 'Maria')).toBe('NAKIBUULE ALICE MARIA')
  })

  it('omits blank name components without adding extra spaces', () => {
    expect(formatPersonName('  Nakibuule ', ' Alice ', '  ')).toBe('NAKIBUULE ALICE')
  })

  it('returns an empty string when every name component is missing', () => {
    expect(formatPersonName(null, undefined, '  ')).toBe('')
  })
})
