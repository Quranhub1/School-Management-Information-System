import { z } from "zod";

/** Shared primitives. Keep these formats aligned with the .NET API contracts. */
export const requiredTextSchema = z.string().trim().min(1, "This field is required.");
export const optionalTextSchema = z.string().trim().optional();
export const identifierSchema = requiredTextSchema;
export const moneyAmountSchema = z.number().finite("Enter a valid amount.").nonnegative("Amount cannot be negative.");
export const positiveMoneyAmountSchema = moneyAmountSchema.positive("Amount must be greater than zero.");
/** @deprecated Use currency-aware moneyAmountSchema; fractional digits depend on ISO currency. */
export const ugxAmountSchema = moneyAmountSchema;
/** @deprecated Use positiveMoneyAmountSchema; fractional digits depend on ISO currency. */
export const positiveUgxAmountSchema = positiveMoneyAmountSchema;
export const nonNegativeQuantitySchema = z.number().int("Quantity must be a whole number.").nonnegative("Quantity cannot be negative.");
export const isoDateSchema = z.iso.date();
export const phoneSchema = z.string().trim().regex(/^\+?[0-9\s()-]{7,20}$/, "Enter a valid phone number.").optional().or(z.literal(""));
export const emailSchema = z.email("Enter a valid email address.").optional().or(z.literal(""));
export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().min(1).max(500).default(25),
});
