import { describe, expect, it } from "vitest";
import { addBankStatementLineRequestSchema, assessmentPlanCreateRequestSchema, recordAssessmentRequestSchema, applyFeeStructureRequestSchema, closeFiscalPeriodRequestSchema, createFiscalPeriodRequestSchema, createOpeningBalanceRequestSchema, bulkImportRequestSchema, bulkPaymentRequestSchema, createBankReconciliationRequestSchema, createBudgetRequestSchema, createInvoiceRequestSchema, creditNoteRequestSchema, expenseEntrySchema, inventoryItemSchema, inventoryGridRowSchema, inventoryRegisterSaveRequestSchema, feeStructureCreateRequestSchema, libraryLoanSchema, mobileMoneyCreateRequestSchema, paymentEntrySchema, staffAdvanceRequestSchema, sendSmsRequestSchema, studentAdmissionSchema, studentApplicationSubmissionSchema, studentCreateRequestSchema, timetableEntrySchema } from "./index";
import { parseApiInput, parseApiResponse, validateForm } from "../lib/validation";

describe("SMIS Zod domain schemas", () => {
  it("accepts a valid student admission record", () => {
    const result = studentAdmissionSchema.safeParse({
      admissionNumber: "KSHS/2026/001", firstName: "Amina", lastName: "Nabirye",
      dateOfBirth: "2005-03-12", gender: "Female", programmeId: "programme-1",
      admissionYear: 2026, guardianName: "Sarah Nabirye",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing student identity and invalid admission year", () => {
    expect(studentAdmissionSchema.safeParse({ firstName: "A", admissionYear: 1800 }).success).toBe(false);
  });

  it("requires positive whole-shilling payment amounts", () => {
    const base = { studentId: "s1", accountId: "a1", paymentDate: "2026-01-01", paymentMethod: "Cash", reference: "RCPT-1" };
    expect(paymentEntrySchema.safeParse({ ...base, amount: 10000 }).success).toBe(true);
    expect(paymentEntrySchema.safeParse({ ...base, amount: 0 }).success).toBe(false);
    expect(paymentEntrySchema.safeParse({ ...base, amount: 10.5 }).success).toBe(true);
  });

  it("rejects negative stock quantities", () => {
    expect(inventoryItemSchema.safeParse({ itemName: "Gloves", quantity: -1, condition: "Good", location: "Pharmacy" }).success).toBe(false);
  });

  it("rejects expenses without an account/category or positive amount", () => {
    expect(expenseEntrySchema.safeParse({ accountId: "", categoryId: "c1", amount: 1000, expenseDate: "2026-02-01", description: "Stationery" }).success).toBe(false);
  });

  it("rejects timetable entries with an invalid time range", () => {
    const result = timetableEntrySchema.safeParse({ classId: "c1", subjectId: "s1", teacherId: "t1", roomId: "r1", date: "2026-03-01", startTime: "12:00", endTime: "11:00" });
    expect(result.success).toBe(false);
  });

  it("rejects loan due dates before the borrowing date", () => {
    expect(libraryLoanSchema.safeParse({ bookId: "b1", borrowerId: "s1", borrowedAt: "2026-04-02", dueAt: "2026-04-01" }).success).toBe(false);
  });

  it("requires a complete student application and declaration before submit", () => {
    const base = {
      studentNumber: "KSHS/2026/001", academicYear: "2026", intake: "August",
      course: "Diploma in Pharmacy", firstName: "Amina", lastName: "Nabirye",
      dateOfBirth: "2005-03-12", phone: "+256 700 123456", email: "amina@example.com",
      declaration: true, applicantSignature: "Amina Nabirye", signatureDate: "2026-08-01",
    };
    expect(studentApplicationSubmissionSchema.safeParse(base).success).toBe(true);
    expect(studentApplicationSubmissionSchema.safeParse({ ...base, declaration: false }).success).toBe(false);
    expect(studentApplicationSubmissionSchema.safeParse({ ...base, phone: "bad" }).success).toBe(false);
  });

  it("validates actual student API create payloads", () => {
    expect(studentCreateRequestSchema.safeParse({
      studentNumber: "KSHS/2026/001", firstName: "Amina", lastName: "Nabirye",
      dateOfBirth: "2005-03-12", email: "amina@example.com",
    }).success).toBe(true);
    expect(studentCreateRequestSchema.safeParse({ studentNumber: "", firstName: "A", lastName: "" }).success).toBe(false);
  });

  it("rejects invalid finance invoice and bulk import requests before submission", () => {
    expect(createInvoiceRequestSchema.safeParse({
      studentId: "s1", invoiceNumber: "INV-1", feeType: "Tuition", amount: 150000, currency: "UGX",
    }).success).toBe(true);
    expect(createInvoiceRequestSchema.safeParse({
      studentId: "s1", invoiceNumber: "", feeType: "Tuition", amount: -100, currency: "UGX",
    }).success).toBe(false);
    expect(bulkImportRequestSchema.safeParse({ entityType: "students", csvData: "" }).success).toBe(false);
  });

  it("rejects incomplete inventory grid rows and non-numeric or negative quantities", () => {
    expect(inventoryGridRowSchema.safeParse({ id: "r1", values: { name: "Gloves", quantity: "8" } }).success).toBe(true);
    expect(inventoryGridRowSchema.safeParse({ id: "r1", values: { name: "Gloves", quantity: "-2" } }).success).toBe(false);
    expect(inventoryGridRowSchema.safeParse({ id: "r1", values: { quantity: "2" } }).success).toBe(false);
    expect(inventoryGridRowSchema.safeParse({ id: "r1", values: { name: "", quantity: "" } }).success).toBe(true);
  });

  it("validates fee structures, credit notes and staff advances", () => {
    expect(feeStructureCreateRequestSchema.safeParse({
      name: "Semester One", feeType: "Tuition", currency: "UGX",
      items: [{ code: "TUITION", name: "Tuition", amount: 1200000, sortOrder: 0, isOptional: false }],
    }).success).toBe(true);
    expect(feeStructureCreateRequestSchema.safeParse({
      name: "Semester One", feeType: "Tuition", items: [],
    }).success).toBe(false);
    expect(applyFeeStructureRequestSchema.safeParse({ allActiveStudents: true }).success).toBe(true);
    expect(applyFeeStructureRequestSchema.safeParse({ studentIds: ["s1", "s2"] }).success).toBe(true);
    expect(applyFeeStructureRequestSchema.safeParse({}).success).toBe(false);
    expect(creditNoteRequestSchema.safeParse({ amount: 10000, reason: "Approved adjustment" }).success).toBe(true);
    expect(staffAdvanceRequestSchema.safeParse({ amount: -1, reason: "Emergency" }).success).toBe(false);
  });

  it("validates mobile money and bulk finance payment payloads", () => {
    expect(mobileMoneyCreateRequestSchema.safeParse({
      studentId: "student-1", amount: 50000, provider: "MTN", phoneNumber: "+256 700 123456",
    }).success).toBe(true);
    expect(mobileMoneyCreateRequestSchema.safeParse({
      studentId: "student-1", amount: 50000.5, provider: "MTN", phoneNumber: "invalid",
    }).success).toBe(false);
    expect(bulkPaymentRequestSchema.safeParse({ payments: [] }).success).toBe(false);
    expect(bulkPaymentRequestSchema.safeParse({
      payments: [{ studentId: "student-1", invoiceId: "", amount: 10000, paymentMethod: "Cash", receiptNumber: "BLK-001" }],
    }).success).toBe(true);
  });

  it("rejects empty SMS recipients and malformed inventory row values", () => {
    expect(sendSmsRequestSchema.safeParse({ message: "Notice", recipientIds: [] }).success).toBe(false);
    expect(inventoryRegisterSaveRequestSchema.safeParse({
      columns: [{ id: "name", label: "Item" }],
      rows: [{ id: "row-1", values: { name: 123 } }],
    }).success).toBe(false);
  });


  it("validates budget and bank reconciliation API requests", () => {
    const budget = {
      departmentId: "department-1",
      academicYearId: "year-1",
      name: "ICT Equipment",
      currency: "UGX",
      startDate: "2026-01-01T00:00:00Z",
      endDate: "2026-12-31T23:59:59Z",
      lines: [{ accountId: "account-1", category: "Equipment", allocatedAmount: 2500000 }],
    };
    expect(createBudgetRequestSchema.safeParse(budget).success).toBe(true);
    expect(createBudgetRequestSchema.safeParse({ ...budget, endDate: "2025-12-31T23:59:59Z" }).success).toBe(false);
    expect(createBudgetRequestSchema.safeParse({ ...budget, lines: [] }).success).toBe(false);

    expect(createBankReconciliationRequestSchema.safeParse({
      bankAccountId: "bank-1",
      statementDate: "2026-11-20T00:00:00Z",
      statementBalance: 500000,
      bookBalance: 480000,
      reconciledAmount: 480000,
    }).success).toBe(true);
    expect(addBankStatementLineRequestSchema.safeParse({
      transactionDate: "2026-11-20T00:00:00Z",
      amount: -1000,
      transactionType: "Debit",
    }).success).toBe(false);
  });



  it("validates assessment plan weights and assessment score boundaries", () => {
    const plan = {
      courseId: "course-1",
      name: "Final examination",
      assessmentType: "Written",
      weightPercentage: 60,
      isCompetencyBased: false,
    };
    expect(assessmentPlanCreateRequestSchema.safeParse(plan).success).toBe(true);
    expect(assessmentPlanCreateRequestSchema.safeParse({ ...plan, weightPercentage: 101 }).success).toBe(false);

    const mark = {
      studentId: "student-1",
      courseRegistrationId: "registration-1",
      assessmentPlanId: "plan-1",
      score: 75,
      maximumScore: 100,
      competencyLevel: "Competent",
    };
    expect(recordAssessmentRequestSchema.safeParse(mark).success).toBe(true);
    expect(recordAssessmentRequestSchema.safeParse({ ...mark, score: 101 }).success).toBe(false);
    expect(recordAssessmentRequestSchema.safeParse({ ...mark, maximumScore: 0 }).success).toBe(false);
  });

  it("validates opening balances and fiscal period closing requests", () => {
    const openingBalances = {
      fiscalPeriodId: "period-1",
      currency: "UGX",
      lines: [
        { accountId: "cash", debit: 500000, credit: 0 },
        { accountId: "capital", debit: 0, credit: 500000 },
      ],
    };
    expect(createOpeningBalanceRequestSchema.safeParse(openingBalances).success).toBe(true);
    expect(createOpeningBalanceRequestSchema.safeParse({
      ...openingBalances,
      lines: [
        { accountId: "cash", debit: 500000, credit: 0 },
        { accountId: "capital", debit: 0, credit: 400000 },
      ],
    }).success).toBe(false);
    expect(createOpeningBalanceRequestSchema.safeParse({
      ...openingBalances,
      lines: [{ accountId: "cash", debit: 100, credit: 100 }, { accountId: "capital", debit: 0, credit: 0 }],
    }).success).toBe(false);

    expect(createFiscalPeriodRequestSchema.safeParse({
      name: "FY2026", startDate: "2026-01-01", endDate: "2026-12-31",
    }).success).toBe(true);
    expect(createFiscalPeriodRequestSchema.safeParse({
      name: "FY2026", startDate: "2026-12-31", endDate: "2026-01-01",
    }).success).toBe(false);
    expect(closeFiscalPeriodRequestSchema.safeParse({
      fiscalPeriodId: "period-1", retainedEarningsAccountId: "equity-1",
    }).success).toBe(true);
  });

  it("throws a field-addressable error before invalid input reaches an API request", () => {
    expect(() => parseApiInput(createInvoiceRequestSchema, {
      studentId: "", invoiceNumber: "", feeType: "", amount: -1,
    }, "create invoice")).toThrow(/Invalid create invoice input/);
  });

  it("rejects malformed API responses at the response boundary", () => {
    expect(() => parseApiResponse(studentCreateRequestSchema, { studentNumber: "" }, "student")).toThrow(/does not match/);
  });

  it("maps schema failures into field-addressable form errors", () => {
    const result = validateForm(paymentEntrySchema, { amount: -2 });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.errors.amount).toBeTruthy();
  });
});
