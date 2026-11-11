/**
 * Shared currency formatting and exact minor-unit helpers.
 *
 * Monetary values remain in their transaction currency. Do not add values
 * carrying different currency codes unless an explicit FX conversion has
 * first been applied and recorded by the backend.
 */
export const SYSTEM_CURRENCY = "UGX" as const;
export const SYSTEM_LOCALE = "en-UG" as const;

const DEFAULT_LOCALES: Record<string, string> = {
  UGX: "en-UG",
  USD: "en-US",
  KES: "en-KE",
  EUR: "en-IE",
  GBP: "en-GB",
  TZS: "sw-TZ",
  RWF: "rw-RW",
  ZAR: "en-ZA",
  AED: "en-AE",
};

const formatterCache = new Map<string, Intl.NumberFormat>();

function normalizeCurrency(currency: string): string {
  const code = currency.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(code)) {
    throw new RangeError(`Invalid ISO 4217 currency code: ${currency}`);
  }
  return code;
}

function getFormatter(currency: string, locale?: string): Intl.NumberFormat {
  const code = normalizeCurrency(currency);
  const resolvedLocale = locale?.trim() || DEFAULT_LOCALES[code] || SYSTEM_LOCALE;
  const key = `${resolvedLocale}:${code}`;
  let formatter = formatterCache.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat(resolvedLocale, {
      style: "currency",
      currency: code,
      currencyDisplay: "code",
    });
    formatterCache.set(key, formatter);
  }
  return formatter;
}

/** Formats a monetary amount using the currency's ISO fraction-digit rules. */
export function formatCurrency(
  amount: number | string | bigint | null | undefined,
  currency = SYSTEM_CURRENCY,
  locale?: string,
): string {
  if (amount == null || amount === "") return getFormatter(currency, locale).format(0);
  const value = typeof amount === "bigint" ? Number(amount) : typeof amount === "string" ? Number(amount.trim()) : amount;
  if (!Number.isFinite(value)) return getFormatter(currency, locale).format(0);
  return getFormatter(currency, locale).format(value);
}

/**
 * Converts a decimal major-unit amount to an integer minor-unit value without
 * using binary floating-point arithmetic. Pass a decimal string for values
 * received from exact financial sources.
 */
export function toMinorUnits(value: string | number, fractionDigits: number): bigint {
  if (!Number.isInteger(fractionDigits) || fractionDigits < 0 || fractionDigits > 6) {
    throw new RangeError("Currency fraction digits must be an integer from 0 to 6.");
  }
  const input = String(value).trim();
  const match = /^([+-]?)(\d+)(?:\.(\d+))?$/.exec(input);
  if (!match) throw new TypeError(`Invalid monetary amount: ${input}`);
  const sign = match[1] === "-" ? -1n : 1n;
  const whole = BigInt(match[2]);
  const fraction = match[3] ?? "";
  const scale = 10n ** BigInt(fractionDigits);
  const kept = fraction.slice(0, fractionDigits).padEnd(fractionDigits, "0");
  let minor = whole * scale + BigInt(kept || "0");
  const discarded = fraction.slice(fractionDigits);
  if (discarded.length > 0 && Number(discarded[0]) >= 5) minor += 1n;
  return sign * minor;
}

export function fromMinorUnits(value: bigint, fractionDigits: number): string {
  if (!Number.isInteger(fractionDigits) || fractionDigits < 0 || fractionDigits > 6) {
    throw new RangeError("Currency fraction digits must be an integer from 0 to 6.");
  }
  const negative = value < 0n;
  const absolute = negative ? -value : value;
  const scale = 10n ** BigInt(fractionDigits);
  const whole = absolute / scale;
  if (fractionDigits === 0) return `${negative ? "-" : ""}${whole}`;
  const fraction = String(absolute % scale).padStart(fractionDigits, "0");
  return `${negative ? "-" : ""}${whole}.${fraction}`;
}

export function addMoney(left: bigint, right: bigint): bigint {
  return left + right;
}

export function subtractMoney(left: bigint, right: bigint): bigint {
  return left - right;
}
