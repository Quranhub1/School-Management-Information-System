/**
 * Formats a person's display name as SURNAME FIRSTNAME OTHER NAMES.
 *
 * This is presentation-only: stored/API name fields remain unchanged.
 * The shared helper keeps existing and newly fetched records consistent
 * across the staff registry and other screens.
 */
export function formatPersonName(
  surname?: string | null,
  firstName?: string | null,
  otherNames?: string | null,
): string {
  return [surname, firstName, otherNames]
    .map(value => value?.trim().replace(/\\s+/g, ' '))
    .filter((value): value is string => Boolean(value))
    .join(' ')
    .toLocaleUpperCase('en')
}
