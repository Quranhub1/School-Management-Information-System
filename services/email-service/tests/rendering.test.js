import test from "node:test";
import assert from "node:assert/strict";
import { createReceiptPdf, renderReceiptHtml } from "../src/receipt-email.js";

const payload = {
  institutionName: "KSHS <script>alert(1)</script>",
  institutionEmail: "info@kshs.example",
  recipient: "student@example.test",
  receipt: {
    studentName: "NAKIBUULE ALICE MARIA",
    studentNumber: "KSHS/001",
    receiptNumber: "RCPT-001",
    transactionReference: "SP-001",
    amount: 150000,
    currency: "UGX",
    balance: 0,
    channel: "SchoolPay / Mobile Money",
    paidAt: "2026-11-10T12:00:00+03:00"
  }
};

test("EJS receipt template escapes institution-supplied HTML", async () => {
  const html = await renderReceiptHtml(payload);
  assert.match(html, /KSHS &lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.doesNotMatch(html, /<script>alert\(1\)<\/script>/);
  assert.match(html, /RCPT-001/);
  assert.match(html, /UGX/);
});

test("PDFKit generates a valid PDF receipt buffer", async () => {
  const pdf = await createReceiptPdf(payload.institutionName, payload.receipt);
  assert.ok(Buffer.isBuffer(pdf));
  assert.equal(pdf.subarray(0, 5).toString("ascii"), "%PDF-");
  assert.ok(pdf.length > 1000);
});
