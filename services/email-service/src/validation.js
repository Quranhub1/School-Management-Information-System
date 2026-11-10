import { timingSafeEqual } from "node:crypto";
import { z } from "zod";

const smtpSchema = z.object({
  host: z.string().trim().min(1).max(255),
  port: z.number().int().min(1).max(65535),
  secureMode: z.enum(["SslOnConnect", "StartTls", "StartTlsWhenAvailable"]),
  username: z.string().trim().min(1).max(255),
  password: z.string().min(1).max(4096)
});

const senderSchema = z.object({
  address: z.string().trim().email().max(254),
  name: z.string().trim().min(1).max(200)
});

export const receiptEmailSchema = z.object({
  smtp: smtpSchema,
  sender: senderSchema,
  recipient: z.string().trim().email().max(254),
  institutionName: z.string().trim().min(1).max(200),
  institutionEmail: z.string().trim().max(254).optional().default(""),
  receipt: z.object({
    studentName: z.string().trim().min(1).max(200),
    studentNumber: z.string().trim().min(1).max(80),
    receiptNumber: z.string().trim().min(1).max(100),
    transactionReference: z.string().trim().max(160).default(""),
    amount: z.number().positive().finite(),
    currency: z.string().trim().length(3).transform(value => value.toUpperCase()),
    balance: z.number().finite().min(0),
    channel: z.string().trim().min(1).max(80),
    paidAt: z.string().datetime({ offset: true })
  })
});

export const testEmailSchema = z.object({
  smtp: smtpSchema,
  sender: senderSchema,
  recipient: z.string().trim().email().max(254),
  institutionName: z.string().trim().min(1).max(200)
});

export function constantTimeApiKeyMatch(provided, expected) {
  if (typeof provided !== "string" || typeof expected !== "string" || !expected) return false;
  const left = Buffer.from(provided, "utf8");
  const right = Buffer.from(expected, "utf8");
  return left.length === right.length && timingSafeEqual(left, right);
}
