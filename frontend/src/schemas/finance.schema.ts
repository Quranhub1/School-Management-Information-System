import { z } from "zod";
import { identifierSchema, isoDateSchema, positiveMoneyAmountSchema, requiredTextSchema } from "./common.schema";

export const paymentEntrySchema = z.object({
  studentId: identifierSchema,
  accountId: identifierSchema,
  amount: positiveMoneyAmountSchema,
  paymentDate: isoDateSchema,
  paymentMethod: z.enum(["Cash", "Bank", "MobileMoney", "SchoolPay", "Other"]),
  reference: requiredTextSchema,
});
export const expenseEntrySchema = z.object({
  accountId: identifierSchema,
  categoryId: identifierSchema,
  amount: positiveMoneyAmountSchema,
  expenseDate: isoDateSchema,
  description: requiredTextSchema.min(3),
  reference: z.string().trim().optional(),
});
export type PaymentEntryInput = z.infer<typeof paymentEntrySchema>;
export type ExpenseEntryInput = z.infer<typeof expenseEntrySchema>;
export const paymentListSchema = z.array(z.object({
  id: z.string().optional(),
  receiptNumber: z.string().optional(),
  amount: z.number(),
  paymentMethod: z.string().optional(),
  paymentSource: z.string().optional(),
  sourceChannel: z.string().optional(),
  providerTransactionId: z.string().optional(),
  reference: z.string().optional(),
  paidAt: z.string(),
  studentName: z.string().optional(),
  invoiceNumber: z.string().optional(),
}));
