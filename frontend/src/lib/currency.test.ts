import { describe, expect, it } from "vitest";
import { formatCurrency, SYSTEM_CURRENCY, SYSTEM_LOCALE } from "./currency";

describe("system currency", () => {
  it("uses UGX and the Uganda locale", () => {
    expect(SYSTEM_CURRENCY).toBe("UGX");
    expect(SYSTEM_LOCALE).toBe("en-UG");
  });

  it("formats monetary values as UGX", () => {
    expect(formatCurrency(125000)).toContain("UGX");
    expect(formatCurrency(125000)).toContain("125,000");
  });

  it("handles invalid or missing amounts safely", () => {
    expect(formatCurrency(null)).toBe("UGX 0");
    expect(formatCurrency(undefined)).toBe("UGX 0");
    expect(formatCurrency("not-a-number")).toBe("UGX 0");
  });
});
