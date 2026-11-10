# SchoolPay webhook operations

## Configuration

Configure the SchoolPay API password as a server-side secret. Do not commit it to source control:

- Environment variable: `SchoolPay__ApiPassword`
- Configuration key: `SchoolPay:ApiPassword`

If this value is absent, the webhook returns HTTP 503 and does not post a payment.

## Webhook endpoint

Register the public HTTPS endpoint:

`POST /api/schoolpay/webhook`

The endpoint accepts SchoolPay's signed nested webhook payloads for `SCHOOL_FEES` and `OTHER_FEES`.

Before posting, SMIS verifies the documented SchoolPay signature:

`lowercase-hex(SHA256(apiPassword + payment.schoolpayReceiptNumber))`

The comparison is performed in constant time. Only `transactionCompletionStatus = Completed` is accepted for posting. Other statuses are acknowledged as ignored.

## Student matching

The webhook's `studentPaymentCode` and `studentRegistrationNumber` are matched against the SMIS `Students.StudentNumber`. The callback is rejected unless the values identify exactly one active student. This is deliberately fail-closed; do not map a payment to a student by name or phone number.

Before enabling the webhook, confirm with SchoolPay that the payment code/registration number supplied in its payload matches the student number stored in SMIS. If SchoolPay uses a different code namespace, a dedicated mapping field/import must be added before production activation.

## Central finance posting

All provider transactions are stored with:

- SMIS payment method: `SchoolPay`
- SchoolPay source channel: `sourcePaymentChannel`
- Provider transaction ID: `sourceChannelTransactionId`
- Provider receipt: `schoolpayReceiptNumber`
- Raw signed payload and provider completion status

SchoolPay collections post to the SchoolPay clearing account. If a student is identified but no invoice is supplied by the webhook, SMIS records an unallocated student payment and applies it FIFO to outstanding invoices in the same database save. Any remaining amount stays unapplied for later allocation.

Manual receipts remain a separate SMIS payment method. Manual tender details are retained as the payment source channel.

## Operational limitation

SchoolPay's documentation states that webhook notifications are sent only once. A successful webhook is therefore not a substitute for reconciliation. Before production sign-off, enable a scheduled reconciliation using SchoolPay's authenticated Sync/Range Transactions API, compare provider transaction IDs and receipts against SMIS, and surface unmatched or amount-mismatched transactions for finance review.

The webhook currently rejects payloads whose student payment code cannot be matched. Do not bypass that check or manually post an unverified SchoolPay callback.
