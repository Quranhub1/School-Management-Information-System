import { describe, expect, it } from "vitest";
import { bulkImportRequestSchema, createInvoiceRequestSchema, expenseEntrySchema, inventoryItemSchema, inventoryGridRowSchema, inventoryRegisterSaveRequestSchema, libraryLoanSchema, paymentEntrySchema, sendSmsRequestSchema, studentAdmissionSchema, studentCreateRequestSchema, timetableEntrySchema } from "./index";
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
    expect(paymentEntrySchema.safeParse({ ...base, amount: 10.5 }).success).toBe(false);
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

  it("rejects empty SMS recipients and malformed inventory row values", () => {
    expect(sendSmsRequestSchema.safeParse({ message: "Notice", recipientIds: [] }).success).toBe(false);
    expect(inventoryRegisterSaveRequestSchema.safeParse({
      columns: [{ id: "name", label: "Item" }],
      rows: [{ id: "row-1", values: { name: 123 } }],
    }).success).toBe(false);
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
