import { z } from "zod";
import { identifierSchema, requiredTextSchema } from "./common.schema";
import { isValidIsbn, normalizeIsbnDigits } from "../lib/isbn";
import { LEAVE_TYPE_VALUES } from "../constants/referenceEnums";

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
  currency: z.string().length(3).default("UGX"),
  paymentDate: z.string().nullable(),
  status: requiredTextSchema,
  paymentMethod: z.string().nullable().optional(),
  reference: z.string().nullable().optional(),
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
  sourceChannel: z.string().trim().optional(),
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
  staffType: z.enum(['Teaching', 'NonTeaching']),
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
  leaveType: z.enum(LEAVE_TYPE_VALUES),
  startDate: z.iso.date(),
  endDate: z.iso.date(),
  reason: requiredTextSchema.min(5),
}).refine((value) => value.endDate >= value.startDate, {
  path: ["endDate"],
  message: "End date cannot be before start date.",
});

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
});
export const inventoryRegisterResponseSchema = z.looseObject({
  sectionId: identifierSchema,
  columns: z.array(z.object({ id: identifierSchema, label: requiredTextSchema })),
  // Read contracts stay shape-only so legacy/incomplete records remain viewable.
  rows: z.array(z.object({ id: identifierSchema, values: z.record(z.string(), z.string()) })),
  updatedAtUtc: z.string(),
});

export const libraryBookCreateRequestSchema = z.object({
  isbn: requiredTextSchema
    .transform(value => normalizeIsbnDigits(value))
    .refine(value => isValidIsbn(value), "Enter a valid ISBN-10 or ISBN-13, including its correct check digit."),
  title: requiredTextSchema,
  author: requiredTextSchema,
  publisher: z.string().trim().optional(),
  totalCopies: z.number().int().positive(),
});
export const libraryLoanCreateRequestSchema = z.object({
  bookId: identifierSchema,
  memberId: identifierSchema,
  memberType: z.enum(["Student", "Staff"]),
  issuedAtUtc: z.string().min(1),
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

export const createProgrammeRequestSchema = z.object({
  programmeId: identifierSchema.optional(),
  programmeNumber: requiredTextSchema,
  programmeName: requiredTextSchema,
  awardType: requiredTextSchema,
  durationYears: z.number().int().positive(),
  durationUnit: requiredTextSchema,
  programmeType: z.number().int().min(0).max(1),
  departmentId: identifierSchema.optional(),
  campusId: identifierSchema.optional(),
});
export const programmeResponseSchema = z.looseObject({
  id: identifierSchema,
  programmeNumber: requiredTextSchema,
  programmeName: requiredTextSchema,
  awardType: requiredTextSchema,
  durationYears: z.number().int().positive(),
  durationUnit: requiredTextSchema,
  programmeType: z.number().int().min(0).max(1),
  departmentId: identifierSchema.optional(),
  campusId: identifierSchema.optional(),
  isActive: z.boolean(),
  isReferenceOnly: z.boolean().optional(),
  approvalStatus: requiredTextSchema,
});

export const createCourseRequestSchema = z.object({
  courseNumber: requiredTextSchema,
  courseName: requiredTextSchema,
  creditUnits: z.number().int().nonnegative(),
  courseType: requiredTextSchema.optional(),
  description: z.string().trim().optional(),
});
export const courseResponseSchema = z.looseObject({
  id: identifierSchema,
  courseNumber: requiredTextSchema,
  courseName: requiredTextSchema,
  creditUnits: z.number().int().nonnegative(),
  courseType: requiredTextSchema.optional(),
  description: z.string().trim().optional().nullable(),
  isActive: z.boolean(),
});

export const createCurriculumRequestSchema = z.object({
  programmeId: identifierSchema,
  version: requiredTextSchema,
  title: requiredTextSchema,
  minimumCredits: z.number().int().nonnegative(),
  effectiveFrom: z.iso.date(),
  effectiveTo: z.iso.date().optional().nullable(),
  programmeType: z.number().int().min(0).max(1),
});
export const curriculumResponseSchema = z.looseObject({
  id: identifierSchema,
  programmeId: identifierSchema,
  version: requiredTextSchema,
  title: requiredTextSchema,
  minimumCredits: z.number().int().nonnegative(),
  effectiveFrom: z.string(),
  effectiveTo: z.string().optional().nullable(),
  programmeType: z.number().int().min(0).max(1),
  status: requiredTextSchema,
  isActive: z.boolean(),
});

export const createCurriculumCourseRequestSchema = z.object({
  curriculumId: identifierSchema,
  courseId: identifierSchema,
  yearOfStudy: z.number().int().positive(),
  semesterNumber: z.number().int().positive(),
  isCore: z.boolean(),
});
export const curriculumCourseResponseSchema = z.looseObject({
  id: identifierSchema,
  curriculumId: identifierSchema,
  courseId: identifierSchema,
  yearOfStudy: z.number().int().positive(),
  semesterNumber: z.number().int().positive(),
  isCore: z.boolean(),
  courseLabel: requiredTextSchema.optional(),
});

export const createSemesterRequestSchema = z.object({
  academicYearId: identifierSchema,
  name: requiredTextSchema,
  sequence: z.number().int().positive(),
  startDate: z.iso.date(),
  endDate: z.iso.date(),
});
export const semesterResponseSchema = z.looseObject({
  id: identifierSchema,
  academicYearId: identifierSchema,
  name: requiredTextSchema,
  sequence: z.number().int().positive(),
  startDate: z.string(),
  endDate: z.string(),
  isCurrent: z.boolean(),
  isActive: z.boolean(),
});

// Attendance schemas
export const attendanceMarkRequestSchema = z.object({
  studentId: identifierSchema,
  status: z.enum(['Present', 'Absent', 'Late', 'Excused']),
  remarks: z.string().trim().optional(),
});
export const attendanceBulkMarkRequestSchema = z.object({
  marks: z.array(z.object({
    studentId: identifierSchema,
    status: z.enum(['Present', 'Absent', 'Late', 'Excused']),
    remarks: z.string().trim().optional(),
  })).min(1, "Select at least one student."),
});
export const attendanceEligibleStudentSchema = z.looseObject({
  studentId: identifierSchema,
  studentNumber: requiredTextSchema,
  firstName: requiredTextSchema,
  lastName: requiredTextSchema,
  otherNames: z.string().nullable().optional(),
  displayName: requiredTextSchema,
  campusId: z.string().optional(),
  alreadyMarked: z.boolean(),
});
export const attendanceSessionSummarySchema = z.looseObject({
  sessionId: identifierSchema,
  timetableEntryId: identifierSchema,
  sessionDate: z.string(),
  status: requiredTextSchema,
  totalEnrolled: z.number().int().nonnegative(),
  markedPresent: z.number().int().nonnegative(),
  markedAbsent: z.number().int().nonnegative(),
  markedLate: z.number().int().nonnegative(),
  markedExcused: z.number().int().nonnegative(),
  unmarked: z.number().int().nonnegative(),
  attendancePercentage: z.number().nonnegative(),
});
export const staffCheckEventSchema = z.looseObject({
  id: identifierSchema,
  staffMemberId: identifierSchema,
  staffName: requiredTextSchema,
  staffNumber: requiredTextSchema,
  eventType: requiredTextSchema,
  recordedAtUtc: z.string(),
  confirmation: requiredTextSchema,
});


export const budgetLineCreateRequestSchema = z.object({
  accountId: identifierSchema,
  category: requiredTextSchema.max(100),
  allocatedAmount: z.number().finite().nonnegative(),
  notes: z.string().trim().max(500).nullable().optional(),
});

export const createBudgetRequestSchema = z.object({
  departmentId: identifierSchema,
  academicYearId: identifierSchema,
  name: requiredTextSchema.max(150),
  currency: z.string().trim().max(3).nullable().optional(),
  startDate: z.iso.datetime({ offset: true }),
  endDate: z.iso.datetime({ offset: true }),
  lines: z.array(budgetLineCreateRequestSchema).min(1).max(200),
}).refine(value => Date.parse(value.endDate) >= Date.parse(value.startDate), {
  message: "Budget end date cannot be before the start date.",
  path: ["endDate"],
});

export const createBankReconciliationRequestSchema = z.object({
  bankAccountId: identifierSchema,
  statementDate: z.iso.datetime({ offset: true }),
  statementBalance: z.number().finite(),
  bookBalance: z.number().finite(),
  reconciledAmount: z.number().finite(),
  notes: z.string().trim().max(1000).nullable().optional(),
});

export const addBankStatementLineRequestSchema = z.object({
  transactionDate: z.iso.datetime({ offset: true }),
  amount: z.number().finite().positive(),
  transactionType: z.enum(["Credit", "Debit"]),
  description: z.string().trim().max(500).nullable().optional(),
  reference: z.string().trim().max(100).nullable().optional(),
});

export const matchBankStatementLineRequestSchema = z.object({
  journalEntryId: identifierSchema,
});


export const openingBalanceLineRequestSchema = z.object({
  accountId: identifierSchema,
  debit: z.number().finite().nonnegative(),
  credit: z.number().finite().nonnegative(),
  description: z.string().trim().max(500).nullable().optional(),
  campusId: identifierSchema.optional(),
  facultyId: identifierSchema.optional(),
  departmentId: identifierSchema.optional(),
  programmeId: identifierSchema.optional(),
}).refine(line => (line.debit > 0) !== (line.credit > 0), {
  message: "Each opening-balance line must contain either a debit or a credit, but not both.",
  path: ["debit"],
});

export const createOpeningBalanceRequestSchema = z.object({
  fiscalPeriodId: identifierSchema,
  currency: z.string().trim().regex(/^[A-Za-z]{3}$/).optional(),
  lines: z.array(openingBalanceLineRequestSchema).min(2).max(500),
}).refine(value => {
  const debit = value.lines.reduce((sum, line) => sum + line.debit, 0);
  const credit = value.lines.reduce((sum, line) => sum + line.credit, 0);
  return debit === credit;
}, {
  message: "Opening balances must balance: total debits must equal total credits.",
  path: ["lines"],
});

export const createFiscalPeriodRequestSchema = z.object({
  name: requiredTextSchema.max(100),
  startDate: z.iso.date(),
  endDate: z.iso.date(),
}).refine(value => value.endDate >= value.startDate, {
  message: "Fiscal period end date cannot be before its start date.",
  path: ["endDate"],
});

export const closeFiscalPeriodRequestSchema = z.object({
  fiscalPeriodId: identifierSchema,
  retainedEarningsAccountId: identifierSchema,
});


export const assessmentPlanCreateRequestSchema = z.object({
  courseId: identifierSchema,
  name: requiredTextSchema.max(160),
  assessmentType: requiredTextSchema.max(80),
  weightPercentage: z.number().finite().min(0).max(100),
  isCompetencyBased: z.boolean(),
});

export const recordAssessmentRequestSchema = z.object({
  studentId: identifierSchema,
  courseRegistrationId: identifierSchema,
  assessmentPlanId: identifierSchema,
  score: z.number().finite().nonnegative(),
  maximumScore: z.number().finite().positive(),
  competencyLevel: z.string().trim().max(120).optional(),
}).refine(value => value.score <= value.maximumScore, {
  path: ["score"],
  message: "Score cannot exceed the maximum score.",
});


export const academicYearRequestSchema = z.object({
  name: requiredTextSchema.max(100),
  startDate: z.iso.date(),
  endDate: z.iso.date(),
}).refine(value => value.endDate >= value.startDate, {
  path: ["endDate"],
  message: "Academic year end date cannot be before its start date.",
});

export const academicPeriodRequestSchema = z.object({
  academicYearId: identifierSchema,
  name: requiredTextSchema.max(100),
  sequence: z.number().int().positive(),
  startDate: z.iso.date(),
  endDate: z.iso.date(),
}).refine(value => value.endDate >= value.startDate, {
  path: ["endDate"],
  message: "Academic period end date cannot be before its start date.",
});

export const academicPeriodUpdateRequestSchema = academicPeriodRequestSchema.omit({ academicYearId: true });


export const createUserRequestSchema = z.object({
  username: requiredTextSchema.max(100),
  password: z.string().min(8).max(256),
  firstName: requiredTextSchema.max(100),
  lastName: requiredTextSchema.max(100),
  email: z.email().optional().or(z.literal("")),
  roles: z.array(requiredTextSchema.max(100)).min(1).max(100),
}).refine(value => new Set(value.roles.map(role => role.toLowerCase())).size === value.roles.length, {
  path: ["roles"],
  message: "Roles must not contain duplicates.",
});

export const updateUserRequestSchema = z.object({
  firstName: requiredTextSchema.max(100),
  lastName: requiredTextSchema.max(100),
  email: z.email().nullable().optional().or(z.literal("")),
  roles: z.array(requiredTextSchema.max(100)).min(1).max(100),
}).refine(value => new Set(value.roles.map(role => role.toLowerCase())).size === value.roles.length, {
  path: ["roles"],
  message: "Roles must not contain duplicates.",
});

export const resetUserPasswordRequestSchema = z.object({
  newPassword: z.string().min(8).max(256),
});

export const setUserActiveRequestSchema = z.object({
  active: z.boolean(),
});

export const permissionCodesRequestSchema = z.object({
  permissionCodes: z.array(requiredTextSchema.max(160)).max(500),
}).refine(value => new Set(value.permissionCodes.map(code => code.toLowerCase())).size === value.permissionCodes.length, {
  path: ["permissionCodes"],
  message: "Permission codes must not contain duplicates.",
});


export const calendarEventCreateRequestSchema = z.object({
  title: requiredTextSchema.max(160),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  eventType: requiredTextSchema.max(80),
  startDate: z.iso.date(),
  endDate: z.iso.date(),
  location: z.string().trim().max(200).optional().or(z.literal("")),
}).refine(value => value.endDate >= value.startDate, {
  path: ["endDate"],
  message: "Event end date cannot be before its start date.",
});

export const calendarReminderCreateRequestSchema = z.object({
  recipientType: z.enum(["All", "Student", "Staff"]),
  recipientId: z.string().trim().max(100).optional().or(z.literal("")),
  message: requiredTextSchema.max(1000),
  remindOnUtc: z.iso.date(),
  channel: z.enum(["InApp", "SMS", "Email"]),
});


export const createCurriculumRequestSchema = z.object({
  programmeId: identifierSchema,
  version: requiredTextSchema.max(40),
  title: requiredTextSchema.max(160),
  minimumCredits: z.number().finite().nonnegative(),
  effectiveFrom: z.iso.date(),
  effectiveTo: z.iso.date().nullable().optional(),
  programmeType: z.number().int().min(0).max(1),
});

export const createCourseRequestSchema = z.object({
  authorityCode: requiredTextSchema.max(40),
  code: requiredTextSchema.max(40),
  name: requiredTextSchema.max(160),
  creditUnits: z.number().int().nonnegative(),
  description: z.string().trim().max(1000).nullable().optional(),
  courseType: z.string().trim().max(80).nullable().optional(),
});

export const curriculumCourseMappingRequestSchema = z.object({
  courseId: identifierSchema,
  yearOfStudy: z.number().int().positive(),
  semesterNumber: z.number().int().positive(),
  isCore: z.boolean(),
});

export const bulkCurriculumCourseMappingRequestSchema = z.object({
  courseIds: z.array(identifierSchema).min(1).max(500),
  yearOfStudy: z.number().int().positive(),
  semesterNumber: z.number().int().positive(),
  isCore: z.boolean(),
}).refine(value => new Set(value.courseIds).size === value.courseIds.length, {
  path: ["courseIds"],
  message: "A course may only be selected once in a bulk mapping.",
});

export const updateCourseRequestSchema = createCourseRequestSchema.extend({
  isActive: z.boolean(),
});

export const updateCurriculumRequestSchema = z.object({
  version: requiredTextSchema.max(40),
  title: requiredTextSchema.max(160),
  minimumCredits: z.number().finite().nonnegative(),
  effectiveFrom: z.iso.date(),
  effectiveTo: z.iso.date().nullable().optional(),
  programmeType: z.number().int().min(0).max(1),
  isActive: z.boolean(),
});

export const logbookRequirementRequestSchema = z.object({
  title: requiredTextSchema.max(160),
  description: z.string().trim().max(1000).optional(),
  yearOfStudy: z.number().int().positive(),
  semesterNumber: z.number().int().positive(),
  requiredQuantity: z.number().int().positive(),
  isMandatory: z.boolean(),
});

export const logbookCompetencyRequestSchema = z.object({
  code: requiredTextSchema.max(40),
  name: requiredTextSchema.max(160),
  requiredCount: z.number().int().positive(),
  isMandatory: z.boolean(),
});

export const studentLogbookCompetencyAssessmentRequestSchema = z.object({
  outcome: requiredTextSchema.max(80),
  assessedOn: z.iso.date().nullable().optional(),
  assessorName: z.string().trim().max(160).optional(),
  assessorRole: z.string().trim().max(100).optional(),
  studentPlacementId: identifierSchema.nullable().optional(),
  evidenceReference: z.string().trim().max(500).optional(),
  remarks: z.string().trim().max(1000).optional(),
});
