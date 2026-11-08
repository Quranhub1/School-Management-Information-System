import { z } from "zod";
import { identifierSchema, isoDateSchema, requiredTextSchema } from "./common.schema";

export const libraryBookSchema = z.object({
  title: requiredTextSchema,
  author: requiredTextSchema,
  isbn: z.string().trim().min(10).max(17).optional().or(z.literal("")),
  categoryId: identifierSchema,
  copies: z.number().int().nonnegative(),
});
export const libraryLoanSchema = z.object({
  bookId: identifierSchema,
  borrowerId: identifierSchema,
  borrowedAt: isoDateSchema,
  dueAt: isoDateSchema,
}).refine((value) => value.dueAt >= value.borrowedAt, {
  path: ["dueAt"],
  message: "Due date cannot be before the borrowing date.",
});
