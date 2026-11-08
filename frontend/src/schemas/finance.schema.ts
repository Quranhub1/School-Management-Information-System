import { z } from "zod";
import { identifierSchema, isoDateSchema, positiveUgxAmountSchema, requiredTextSchema } from "./common.schema";

export const paymentEntrySchema = z.object({
  studentId: identifierSchema,
  accountId: identifierSchema,
  amount: positiveUgxAmountSchema,
  paymentDate: isoDateSchema,
  paymentMethod: z.enum(["Cash", "Bank", "MobileMoney", "SchoolPay", "Other"]),
  reference: requiredTextSchema,
});
export const expenseEntrySchema = z.object({
  accountId: identifierSchema,
  categoryId: identifierSchema,
  amount: positiveUgxAmountSchema,
  expenseDate: isoDateSchema,
  description: requiredTextSchema.min(3),
  reference: z.string().trim().optional(),
});
export type PaymentEntryInput = z.infer<typeof paymentEntrySchema>;
export type ExpenseEntryInput = z.infer<typeof expenseEntrySchema>;
