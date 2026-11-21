import { staffCreateRequestSchema, studentCreateRequestSchema } from '../schemas/api-contracts.schema'

export type BulkImportEntityType = 'student' | 'staff'
export type BulkImportRow = Record<string, unknown>

function readValue(row: BulkImportRow, name: string): string | undefined {
  const normalizedName = name.toLowerCase().replace(/[^a-z0-9]/g, '')
  const entry = Object.entries(row).find(([key]) => key.toLowerCase().replace(/[^a-z0-9]/g, '') === normalizedName)
  if (!entry || entry[1] === null || entry[1] === undefined) return undefined
  if (entry[1] instanceof Date && !Number.isNaN(entry[1].getTime())) {
    return name.toLowerCase() === 'dateofbirth' ? entry[1].toISOString().slice(0, 10) : entry[1].toISOString()
  }
  const value = String(entry[1]).trim()
  return value.length ? value : undefined
}

function appendIssues(errors: string[], rowNumber: number, issues: { path: PropertyKey[]; message: string }[]) {
  for (const issue of issues) {
    const field = issue.path.length ? issue.path.join('.') : 'row'
    errors.push('Row ' + rowNumber + ', ' + field + ': ' + issue.message)
  }
}

export function validateBulkImportRows(entityType: BulkImportEntityType, rows: BulkImportRow[]): string[] {
  const errors: string[] = []
  const seenIdentifiers = new Set<string>()

  rows.forEach((row, index) => {
    const rowNumber = index + 2
    const identifierField = entityType === 'student' ? 'studentNumber' : 'staffNumber'
    const identifier = readValue(row, identifierField)
    if (identifier) {
      const normalizedIdentifier = identifier.toUpperCase()
      if (seenIdentifiers.has(normalizedIdentifier)) errors.push('Row ' + rowNumber + ', ' + identifierField + ': duplicate value within this import file.')
      else seenIdentifiers.add(normalizedIdentifier)
    }

    if (entityType === 'student') {
      const result = studentCreateRequestSchema.safeParse({
        studentNumber: identifier,
        firstName: readValue(row, 'firstName'),
        lastName: readValue(row, 'lastName'),
        otherNames: readValue(row, 'otherNames'),
        dateOfBirth: readValue(row, 'dateOfBirth'),
        gender: readValue(row, 'gender'),
        phoneNumber: readValue(row, 'phoneNumber'),
        email: readValue(row, 'email'),
      })
      if (!result.success) appendIssues(errors, rowNumber, result.error.issues)
    } else {
      const result = staffCreateRequestSchema.safeParse({
        staffNumber: identifier,
        firstName: readValue(row, 'firstName'),
        lastName: readValue(row, 'lastName'),
        employmentType: readValue(row, 'employmentType'),
        staffType: readValue(row, 'staffType'),
        nationalId: readValue(row, 'nationalId'),
        phoneNumber: readValue(row, 'phoneNumber'),
        email: readValue(row, 'email'),
      })
      if (!result.success) appendIssues(errors, rowNumber, result.error.issues)
    }
  })

  return errors
}