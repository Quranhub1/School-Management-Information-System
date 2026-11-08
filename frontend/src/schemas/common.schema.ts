import { z } from "zod";

/** Shared primitives. Keep these formats aligned with the .NET API contracts. */
export const requiredTextSchema = z.string().trim().min(1, "This field is required.");
export const optionalTextSchema = z.string().trim().optional();
export const identifierSchema = requiredTextSchema;
export const ugxAmountSchema = z.number().int("UGX amounts must be whole shillings.").nonnegative("Amount cannot be negative.");
export const positiveUgxAmountSchema = ugxAmountSchema.positive("Amount must be greater than zero.");
export const nonNegativeQuantitySchema = z.number().int("Quantity must be a whole number.").nonnegative("Quantity cannot be negative.");
export const isoDateSchema = z.iso.date();
export const phoneSchema = z.string().trim().regex(/^\+?[0-9\s()-]{7,20}$/, "Enter a valid phone number.").optional().or(z.literal(""));
export const emailSchema = z.email("Enter a valid email address.").optional().or(z.literal(""));
export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().min(1).max(500).default(25),
});
