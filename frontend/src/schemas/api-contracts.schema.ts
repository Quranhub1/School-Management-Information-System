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

export const payrollRecordResponseSchema = z.looseObject({
  id: identifierSchema,
  staffMemberId: identifierSchema,
  month: z.number().int().min(1).max(12),
  year: z.number().int(),
  basicSalary: z.number().finite(),
  allowances: z.number().finite(),
  deductions: z.number().finite(),
  netPay: z.number().finite(),
  paymentDate: z.string().nullable(),
  status: requiredTextSchema,
  paymentMethod: z.string().optional(),
  reference: z.string().optional(),
});

export const studentCreateRequestSchema = z.object({
  studentNumber: identifierSchema,
  firstName: requiredTextSchema.min(2),
  lastName: requiredTextSchema.min(2),
  otherNames: z.string().trim().optional(),
  dateOfBirth: z.iso.date().optional(),
  gender: z.string().trim().optional(),
  nationalId: z.string().trim().optional(),
  phoneNumber: z.string().trim().optional(),
  email: z.email().optional().or(z.literal("")),
  campusId: z.string().trim().optional(),
});
export const studentResponseSchema = z.looseObject({
  id: identifierSchema,
  studentNumber: identifierSchema,
  firstName: requiredTextSchema,
  lastName: requiredTextSchema,
  status: requiredTextSchema,
  createdAt: z.string(),
});

export const createInvoiceRequestSchema = z.object({
  studentId: identifierSchema,
  feeStructureId: identifierSchema.optional(),
  invoiceNumber: requiredTextSchema,
  feeType: requiredTextSchema,
  amount: z.number().int().positive().optional(),
  currency: z.string().trim().min(3).max(3).optional(),
});
export const recordPaymentRequestSchema = z.object({
  amount: z.number().int().positive(),
  receiptNumber: requiredTextSchema,
  paymentMethod: requiredTextSchema,
  reference: z.string().trim().optional(),
  currency: z.string().trim().min(3).max(3).optional(),
});
export const invoiceResponseSchema = z.looseObject({
  id: identifierSchema,
  studentId: identifierSchema,
  invoiceNumber: requiredTextSchema,
  feeType: requiredTextSchema,
  amount: z.number().finite(),
  paidAmount: z.number().finite(),
  balance: z.number().finite(),
  currency: requiredTextSchema,
  status: requiredTextSchema,
  issuedAt: z.string(),
});

export const staffCreateRequestSchema = z.object({
  staffNumber: identifierSchema,
  firstName: requiredTextSchema.min(2),
  lastName: requiredTextSchema.min(2),
  employmentType: requiredTextSchema,
  staffType: requiredTextSchema,
  nationalId: z.string().trim().optional(),
  phoneNumber: z.string().trim().optional(),
  email: z.email().optional().or(z.literal("")),
  departmentId: z.string().trim().nullable().optional(),
  jobTitle: z.string().trim().nullable().optional(),
  highestQualification: z.string().trim().nullable().optional(),
  speciality: z.string().trim().nullable().optional(),
  professionalRegistration: z.string().trim().nullable().optional(),
  courseUnitIds: z.array(identifierSchema).optional(),
});
export const leaveRequestSchema = z.object({
  staffMemberId: identifierSchema,
  leaveType: requiredTextSchema,
  startDate: z.iso.date(),
  endDate: z.iso.date(),
  reason: requiredTextSchema.min(5),
}).refine((value) => value.endDate >= value.startDate, {
  path: ["endDate"],
  message: "End date cannot be before start date.",
});

<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> origin/feat/central-zod-validation-v2
export const inventoryGridRowSchema = z.object({
  id: identifierSchema,
  values: z.record(z.string(), z.string()),
}).superRefine((row, context) => {
  const entries = Object.values(row.values);
  const isBlankDraft = entries.every(value => !value.trim());
  if (isBlankDraft) return;
  if (!row.values.name?.trim()) {
    context.addIssue({ code: "custom", path: ["values", "name"], message: "Item name is required." });
  }
  const quantity = row.values.quantity?.trim();
  if (quantity && !/^\d+$/.test(quantity)) {
    context.addIssue({ code: "custom", path: ["values", "quantity"], message: "Quantity must be a whole number of zero or greater." });
  }
});
export const inventoryRegisterSaveRequestSchema = z.object({
  columns: z.array(z.object({ id: identifierSchema, label: requiredTextSchema })),
  rows: z.array(inventoryGridRowSchema),
<<<<<<< HEAD
=======
export const inventoryRegisterSaveRequestSchema = z.object({
  columns: z.array(z.object({ id: identifierSchema, label: requiredTextSchema })),
  rows: z.array(z.object({ id: identifierSchema, values: z.record(z.string(), z.string()) })),
>>>>>>> origin/feat/central-zod-validation
=======
>>>>>>> origin/feat/central-zod-validation-v2
});
export const inventoryRegisterResponseSchema = z.looseObject({
  sectionId: identifierSchema,
  columns: z.array(z.object({ id: identifierSchema, label: requiredTextSchema })),
<<<<<<< HEAD
<<<<<<< HEAD
  // Read contracts stay shape-only so legacy/incomplete records remain viewable.
=======
>>>>>>> origin/feat/central-zod-validation
=======
  // Read contracts stay shape-only so legacy/incomplete records remain viewable.
>>>>>>> origin/feat/central-zod-validation-v2
  rows: z.array(z.object({ id: identifierSchema, values: z.record(z.string(), z.string()) })),
  updatedAtUtc: z.string(),
});

export const libraryBookCreateRequestSchema = z.object({
  isbn: requiredTextSchema.min(10).max(17),
  title: requiredTextSchema,
  author: requiredTextSchema,
  publisher: z.string().trim().optional(),
  totalCopies: z.number().int().positive(),
});
export const libraryLoanCreateRequestSchema = z.object({
  bookId: identifierSchema,
  studentId: identifierSchema,
  dueAtUtc: z.string().min(1),
});

export const bulkImportRequestSchema = z.object({
  entityType: requiredTextSchema,
  csvData: requiredTextSchema,
});
export const bulkImportResultSchema = z.looseObject({
  entityType: requiredTextSchema,
  successCount: z.number().int().nonnegative(),
  errorCount: z.number().int().nonnegative(),
  errors: z.array(z.string()),
  warnings: z.array(z.string()),
});
<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> origin/feat/central-zod-validation-v2

export const studentApplicationSubmissionSchema = z.object({
  studentNumber: identifierSchema,
  academicYear: requiredTextSchema,
  intake: requiredTextSchema,
  course: requiredTextSchema,
  firstName: requiredTextSchema.min(2),
  lastName: requiredTextSchema.min(2),
  dateOfBirth: z.iso.date().optional().or(z.literal("")),
  phone: z.string().trim().regex(/^\+?[0-9\s()-]{7,20}$/, "Enter a valid telephone number."),
  email: z.email().optional().or(z.literal("")),
  declaration: z.literal(true, { error: "The applicant must accept the declaration before submitting." }),
  applicantSignature: requiredTextSchema,
  signatureDate: z.iso.date(),
});

export const mobileMoneyCreateRequestSchema = z.object({
  studentId: identifierSchema,
  studentInvoiceId: identifierSchema.optional(),
  amount: z.number().int().positive(),
  currency: z.string().trim().min(3).max(3).optional(),
  provider: requiredTextSchema,
  phoneNumber: z.string().trim().regex(/^\+?[0-9\s()-]{7,20}$/, "Enter a valid mobile money phone number."),
});
export const bulkPaymentRequestSchema = z.object({
  payments: z.array(z.object({
    studentId: identifierSchema,
    invoiceId: z.string().trim().optional(),
    amount: z.number().int().positive(),
    paymentMethod: requiredTextSchema,
    receiptNumber: requiredTextSchema,
    reference: z.string().trim().optional(),
  })).min(1, "Select at least one student payment."),
});

export const feeStructureItemRequestSchema = z.object({
  code: requiredTextSchema,
  name: requiredTextSchema,
  amount: z.number().int().positive(),
  incomeAccountId: z.string().trim().optional(),
  sortOrder: z.number().int().nonnegative(),
  isOptional: z.boolean(),
});
export const feeStructureCreateRequestSchema = z.object({
  name: requiredTextSchema,
  feeType: requiredTextSchema,
  currency: z.string().trim().min(3).max(3).optional(),
  programmeId: identifierSchema.optional(),
  academicYearId: identifierSchema.optional(),
  items: z.array(feeStructureItemRequestSchema).min(1, "Add at least one fee item."),
});
export const applyFeeStructureRequestSchema = z.object({
  studentIds: z.array(identifierSchema).optional(),
  allActiveStudents: z.boolean().optional(),
}).refine(value => Boolean(value.allActiveStudents) !== Boolean(value.studentIds?.length), {
  message: "Choose either selected students or all active students.",
});
export const creditNoteRequestSchema = z.object({
  amount: z.number().int().positive(),
  reason: requiredTextSchema.min(5),
});
export const staffAdvanceRequestSchema = z.object({
  amount: z.number().int().positive(),
  reason: requiredTextSchema.min(5),
});
export const approveStaffAdvanceRequestSchema = z.object({
  approvedBy: z.string().trim().optional(),
  approved: z.boolean(),
});
export const recoverStaffAdvanceRequestSchema = z.object({
  amount: z.number().int().positive(),
});
export const invoiceNoteRequestSchema = z.object({
  note: requiredTextSchema.min(3),
  createdBy: z.string().trim().optional(),
});
<<<<<<< HEAD
=======
>>>>>>> origin/feat/central-zod-validation
=======
>>>>>>> origin/feat/central-zod-validation-v2
