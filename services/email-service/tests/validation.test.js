import test from "node:test";
import assert from "node:assert/strict";
import { constantTimeApiKeyMatch, receiptEmailSchema, testEmailSchema } from "../src/validation.js";

const smtp = { host: "smtp.example.test", port: 587, secureMode: "StartTls", username: "smis@example.test", password: "test-password" };
const sender = { address: "smis@example.test", name: "KSHS SMIS" };

test("API key comparison accepts an exact key and rejects a mismatch", () => {
  assert.equal(constantTimeApiKeyMatch("a".repeat(40), "a".repeat(40)), true);
  assert.equal(constantTimeApiKeyMatch("a".repeat(40), "b".repeat(40)), false);
  assert.equal(constantTimeApiKeyMatch("", "a".repeat(40)), false);
});

test("receipt schema accepts a complete UGX receipt", () => {
  const parsed = receiptEmailSchema.safeParse({
    smtp, sender, recipient: "student@example.test", institutionName: "Kampala School of Health Sciences",
    institutionEmail: "info@example.test",
    receipt: {
      studentName: "NAKIBUULE ALICE MARIA", studentNumber: "KSHS/001", receiptNumber: "RCPT-001",
      transactionReference: "SP-001", amount: 150000, currency: "ugx", balance: 0,
      channel: "SchoolPay / Mobile Money", paidAt: "2026-11-10T12:00:00+03:00"
    }
  });
  assert.equal(parsed.success, true);
  if (parsed.success) assert.equal(parsed.data.receipt.currency, "UGX");
});

test("receipt schema rejects malformed recipient and non-positive amount", () => {
  const parsed = receiptEmailSchema.safeParse({
    smtp, sender, recipient: "not-an-email", institutionName: "KSHS",
    receipt: {
      studentName: "STUDENT", studentNumber: "KSHS/001", receiptNumber: "RCPT-001",
      amount: 0, currency: "UGX", balance: 0, channel: "Manual", paidAt: "2026-11-10T12:00:00Z"
    }
  });
  assert.equal(parsed.success, false);
});

test("test email schema validates sender and SMTP settings", () => {
  assert.equal(testEmailSchema.safeParse({ smtp, sender, recipient: "admin@example.test", institutionName: "KSHS" }).success, true);
  assert.equal(testEmailSchema.safeParse({ smtp: { ...smtp, port: 0 }, sender, recipient: "admin@example.test", institutionName: "KSHS" }).success, false);
});
