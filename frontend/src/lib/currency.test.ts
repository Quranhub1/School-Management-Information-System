import { describe, expect, it } from "vitest";
import {
  SYSTEM_CURRENCY,
  SYSTEM_LOCALE,
  configureSystemCurrency,
  addMoney,
  formatCurrency,
  fromMinorUnits,
  subtractMoney,
  toMinorUnits,
} from "./currency";

describe("currency formatting", () => {
  it("keeps UGX as the system default", () => {
    expect(SYSTEM_CURRENCY).toBe("UGX");
    expect(SYSTEM_LOCALE).toBe("en-UG");
  });

  it("uses the server-configured system currency as the default formatter currency", () => {
    configureSystemCurrency("USD", "en-US");
    expect(SYSTEM_CURRENCY).toBe("USD");
    expect(SYSTEM_LOCALE).toBe("en-US");
    expect(formatCurrency(1250)).toContain("USD");
    configureSystemCurrency("UGX", "en-UG");
  });

  it("formats currencies using their ISO fraction-digit rules", () => {
    expect(formatCurrency(125000)).toContain("UGX");
    expect(formatCurrency(125000)).toContain("125,000");
    expect(formatCurrency("150.50", "USD", "en-US")).toContain("150.50");
    expect(formatCurrency("25000", "KES", "en-KE")).toContain("25,000");
    expect(formatCurrency("12.345", "KWD", "en-US")).toContain("12.345");
  });

  it("handles missing and invalid numeric amounts without NaN output", () => {
    expect(formatCurrency(null)).toContain("0");
    expect(formatCurrency(undefined)).toContain("0");
    expect(formatCurrency("not-a-number")).toContain("0");
  });

  it("formats large bigint amounts without converting through Number", () => {
    expect(formatCurrency(900719925474099312345n, "UGX")).toContain("900,719,925,474,099,312,345");
  });

  it("rejects malformed ISO currency codes", () => {
    expect(() => formatCurrency(10, "US")).toThrow(RangeError);
  });
});

describe("exact minor-unit arithmetic", () => {
  it("converts decimal strings without binary floating-point errors", () => {
    expect(toMinorUnits("0.10", 2) + toMinorUnits("0.20", 2)).toBe(30n);
    expect(fromMinorUnits(30n, 2)).toBe("0.30");
  });

  it("supports currencies with zero and three fraction digits", () => {
    expect(toMinorUnits("500000", 0)).toBe(500000n);
    expect(toMinorUnits("1.234", 3)).toBe(1234n);
  });

  it("rounds half away from zero at the minor-unit boundary", () => {
    expect(toMinorUnits("1.235", 2)).toBe(124n);
    expect(toMinorUnits("-1.235", 2)).toBe(-124n);
  });

  it("adds and subtracts integer minor units exactly", () => {
    expect(addMoney(10n, 20n)).toBe(30n);
    expect(subtractMoney(30n, 10n)).toBe(20n);
  });

  it("rejects malformed amounts and unsupported scales", () => {
    expect(() => toMinorUnits("1.2.3", 2)).toThrow(TypeError);
    expect(() => toMinorUnits("1.00", 7)).toThrow(RangeError);
  });
});
