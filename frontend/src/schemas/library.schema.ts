import { z } from "zod";
import { identifierSchema, isoDateSchema } from "./common.schema";

// Keep the legacy export name while sharing the exact create contract used by library.ts.
export { libraryBookCreateRequestSchema as libraryBookSchema } from "./api-contracts.schema";
export const libraryLoanSchema = z.object({
  bookId: identifierSchema,
  borrowerId: identifierSchema,
  borrowedAt: isoDateSchema,
  dueAt: isoDateSchema,
}).refine((value) => value.dueAt >= value.borrowedAt, {
  path: ["dueAt"],
  message: "Due date cannot be before the borrowing date.",
});
