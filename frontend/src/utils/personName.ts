/**
 * Formats a person's display name as SURNAME, FIRSTNAME OTHER NAMES.
 *
 * This is presentation-only: it never changes the stored/API name fields.
 * Applying it in the shared helper also corrects the display of existing
 * records whenever they are loaded from the API.
 */
export function formatPersonName(
  surname?: string | null,
  firstName?: string | null,
  otherNames?: string | null,
): string {
  const familyName = surname?.trim()
  const givenNames = [firstName, otherNames]
    .map(value => value?.trim())
    .filter((value): value is string => Boolean(value))
    .join(' ')

  if (familyName && givenNames) {
    return `${familyName}, ${givenNames}`.toUpperCase()
  }

  return (familyName || givenNames).toUpperCase()
}
