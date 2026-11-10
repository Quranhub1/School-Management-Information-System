/**
 * Formats a person's display name in the institution's required order:
 * surname, first name, then other/given names.
 *
 * Stored/API fields remain unchanged; this helper is for presentation only.
 */
export function formatPersonName(
  surname?: string | null,
  firstName?: string | null,
  otherNames?: string | null,
): string {
  return [surname, firstName, otherNames]
    .map(value => value?.trim())
    .filter((value): value is string => Boolean(value))
    .join(' ')
}
