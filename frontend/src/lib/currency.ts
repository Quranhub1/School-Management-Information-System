/**
 * Canonical school-system currency formatting.
 *
 * The system operates in Uganda Shillings (UGX). Monetary values are
 * represented as numeric amounts in UGX; this helper is the single frontend
 * formatting entry point so screens and reports do not silently introduce
 * another currency.
 */
export const SYSTEM_CURRENCY = "UGX" as const;
export const SYSTEM_LOCALE = "en-UG" as const;

const formatter = new Intl.NumberFormat(SYSTEM_LOCALE, {
  style: "currency",
  currency: SYSTEM_CURRENCY,
  currencyDisplay: "code",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function formatCurrency(amount: number | string | null | undefined): string {
  const value = typeof amount === "string" ? Number(amount) : amount;
  if (value == null || !Number.isFinite(value)) return `UGX 0`;
  return formatter.format(value);
}
