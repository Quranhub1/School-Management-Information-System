import express from "express";
import helmet from "helmet";
import { sendReceiptEmail, sendTestEmail } from "./receipt-email.js";
import { constantTimeApiKeyMatch, receiptEmailSchema, testEmailSchema } from "./validation.js";

const host = process.env.EMAIL_SERVICE_HOST || "127.0.0.1";
const port = Number(process.env.PORT || 5100);
const apiKey = process.env.EMAIL_SERVICE_API_KEY || "";
if (!apiKey || apiKey.length < 32) {
  throw new Error("EMAIL_SERVICE_API_KEY must be configured with at least 32 characters.");
}

const app = express();
app.disable("x-powered-by");
app.use(helmet());
app.use(express.json({ limit: "64kb" }));

app.get("/health", (_request, response) => response.status(200).json({ status: "healthy" }));

app.use("/internal", (request, response, next) => {
  if (!constantTimeApiKeyMatch(request.get("x-smis-email-service-key"), apiKey)) {
    return response.status(401).json({ message: "Unauthorized." });
  }
  return next();
});

app.post("/internal/receipts/send", async (request, response) => {
  const parsed = receiptEmailSchema.safeParse(request.body);
  if (!parsed.success) return response.status(400).json({ message: "Invalid receipt email payload." });
  try {
    const result = await sendReceiptEmail(parsed.data);
    return response.status(200).json({ sent: true, messageId: result.messageId });
  } catch (error) {
    console.error("Receipt email delivery failed:", error?.name || "Error");
    return response.status(502).json({ message: "Receipt email delivery failed." });
  }
});

app.post("/internal/test", async (request, response) => {
  const parsed = testEmailSchema.safeParse(request.body);
  if (!parsed.success) return response.status(400).json({ message: "Invalid test email payload." });
  try {
    const result = await sendTestEmail(parsed.data);
    return response.status(200).json({ sent: true, messageId: result.messageId });
  } catch {
    return response.status(502).json({ message: "SMTP test failed. Verify server, port, TLS mode and credentials." });
  }
});

const server = app.listen(port, host, () => {
  process.stdout.write(`SMIS email service listening on ${host}:${port}\n`);
});

function shutdown() {
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10000).unref();
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
