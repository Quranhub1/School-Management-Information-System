import { staffCreateRequestSchema, studentCreateRequestSchema } from '../schemas/api-contracts.schema'

export type BulkImportEntityType = 'student' | 'staff'
export type BulkImportRow = Record<string, unknown>

function readValue(row: BulkImportRow, name: string): string | undefined {
  const normalizedName = name.toLowerCase().replace(/[^a-z0-9]/g, '')
  const entry = Object.entries(row).find(([key]) => key.toLowerCase().replace(/[^a-z0-9]/g, '') === normalizedName)
  if (!entry || entry[1] === null || entry[1] === undefined) return undefined
  const value = String(entry[1]).trim()
  return value.length ? value : undefined
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
      if (seenIdentifiers.has(normalizedIdentifier)) {
        errors.push('Row ' + rowNumber + ', ' + identifierField + ': duplicate value within this import file.')
      } else {
        seenIdentifiers.add(normalizedIdentifier)
      }
    }

    const input = entityType === 'student'
      ? {
          studentNumber: identifier,
          firstName: readValue(row, 'firstName'),
          lastName: readValue(row, 'lastName'),
          otherNames: readValue(row, 'otherNames'),
          dateOfBirth: readValue(row, 'dateOfBirth'),
          gender: readValue(row, 'gender'),
          phoneNumber: readValue(row, 'phoneNumber'),
          email: readValue(row, 'email'),
        }
      : {
          staffNumber: identifier,
          firstName: readValue(row, 'firstName'),
          lastName: readValue(row, 'lastName'),
          employmentType: readValue(row, 'employmentType'),
          staffType: readValue(row, 'staffType'),
          nationalId: readValue(row, 'nationalId'),
          phoneNumber: readValue(row, 'phoneNumber'),
          email: readValue(row, 'email'),
        }

    const result = entityType === 'student'
      ? studentCreateRequestSchema.safeParse(input)
      : staffCreateRequestSchema.safeParse(input)

    if (!result.success) {
      for (const issue of result.error.issues) {
        const field = issue.path.length ? issue.path.join('.') : 'row'
        errors.push('Row ' + rowNumber + ', ' + field + ': ' + issue.message)
      }
    }
  })

  return errors
}