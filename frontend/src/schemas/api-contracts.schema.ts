import { z } from "zod";
import { identifierSchema, requiredTextSchema } from "./common.schema";

/**
 * Boundary schemas for API modules migrated to runtime validation.
 * Loose objects preserve additive server fields while checking required contract fields.
 */
export const admissionResponseSchema = z.looseObject({
  id: identifierSchema,
  applicantId: identifierSchema,
  programmeId: identifierSchema,
  academicYearId: identifierSchema,
  intakeId: identifierSchema,
  status: requiredTextSchema,
  decidedAt: z.string().nullable().optional(),
});
export const admissionDecisionResponseSchema = z.looseObject({
  id: identifierSchema,
  admissionId: identifierSchema,
  decision: requiredTextSchema,
  reason: z.string().nullable().optional(),
  decidedBy: z.string().nullable().optional(),
});
export const createAdmissionRequestSchema = z.object({
  applicantId: identifierSchema,
  programmeId: identifierSchema,
  academicYearId: identifierSchema,
  intakeId: identifierSchema,
});
export const updateAdmissionRequestSchema = z.object({
  id: identifierSchema,
  status: requiredTextSchema.optional(),
});
export const admissionDecisionRequestSchema = z.object({
  decision: requiredTextSchema,
  reason: z.string().trim().optional(),
  decidedBy: z.string().trim().optional(),
});

export const payrollGenerateRequestSchema = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000).max(2100),
});
export const payrollPaymentRequestSchema = z.object({
  paymentMethod: requiredTextSchema.optional(),
});
export const payrollAdjustmentRequestSchema = z.object({
  allowances: z.number().int().nonnegative(),
  deductions: z.number().int().nonnegative(),
});

export const streamCreateRequestSchema = z.object({
  academicClassId: identifierSchema,
  code: requiredTextSchema,
  name: z.string().trim().optional(),
  capacity: z.number().int().positive().optional(),
});
export const streamResponseSchema = z.looseObject({
  id: identifierSchema,
  academicClassId: identifierSchema,
  code: requiredTextSchema,
  name: z.string().nullable().optional(),
  capacity: z.number().int().nullable().optional(),
  isActive: z.boolean(),
});

export const sendSmsRequestSchema = z.object({
  subject: z.string().trim().optional(),
  message: requiredTextSchema,
  recipientType: z.string().trim().optional(),
  recipientIds: z.array(identifierSchema).min(1, "Select at least one recipient."),
  templateName: z.string().trim().optional(),
});
export const sendBulkSmsRequestSchema = z.object({
  subject: z.string().trim().optional(),
  message: requiredTextSchema,
  recipientType: requiredTextSchema,
  classFilter: z.string().trim().optional(),
  templateName: z.string().trim().optional(),
});
export const smsSendResponseSchema = z.looseObject({
  success: z.boolean(),
  message: z.string(),
  count: z.number().int().nonnegative(),
});
