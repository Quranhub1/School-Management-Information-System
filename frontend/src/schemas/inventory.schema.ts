import { z } from "zod";
import { identifierSchema, isoDateSchema, nonNegativeQuantitySchema, requiredTextSchema } from "./common.schema";

export const inventoryItemSchema = z.object({
  itemName: requiredTextSchema.min(2),
  description: z.string().trim().optional(),
  quantity: nonNegativeQuantitySchema,
  condition: z.enum(["New", "Good", "Fair", "Poor", "Damaged", "Unserviceable"]),
  location: requiredTextSchema,
  lowStockThreshold: nonNegativeQuantitySchema.optional(),
});
export const stockMovementSchema = z.object({
  itemId: identifierSchema,
  movementType: z.enum(["Receipt", "Issue", "Return", "Adjustment"]),
  quantity: z.number().int().positive("Movement quantity must be greater than zero."),
  movementDate: isoDateSchema,
  reason: requiredTextSchema.min(3),
}).refine((value) => value.movementType !== "Adjustment" || value.reason.length >= 5, {
  path: ["reason"],
  message: "Stock adjustments require a detailed reason.",
});
export type InventoryItemInput = z.infer<typeof inventoryItemSchema>;
export type StockMovementInput = z.infer<typeof stockMovementSchema>;
