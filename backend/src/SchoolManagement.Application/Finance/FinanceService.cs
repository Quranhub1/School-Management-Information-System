using SchoolManagement.Application.Abstractions;
using SchoolManagement.Domain.Finance;

namespace SchoolManagement.Application.Finance;

public sealed class FinanceService(IFinanceRepository finance)
{
    public Task<IReadOnlyList<StudentInvoice>> GetStudentInvoicesAsync(Guid studentId, CancellationToken cancellationToken) =>
        finance.GetStudentInvoicesAsync(studentId, cancellationToken);

    public Task<IReadOnlyList<PaymentLedgerEntry>> GetStudentLedgerAsync(Guid studentId, CancellationToken cancellationToken) =>
        finance.GetStudentLedgerAsync(studentId, cancellationToken);

    public async Task<StudentInvoice> CreateInvoiceAsync(Guid studentId, Guid feeStructureId, string invoiceNumber, CancellationToken cancellationToken)
    {
        if (!await finance.StudentExistsAsync(studentId, cancellationToken))
            throw new ArgumentException("Student was not found.");
        if (string.IsNullOrWhiteSpace(invoiceNumber))
            throw new ArgumentException("Invoice number is required.");

        var normalizedInvoiceNumber = invoiceNumber.Trim();
        if (await finance.InvoiceNumberExistsAsync(normalizedInvoiceNumber, cancellationToken))
            throw new InvalidOperationException("Invoice number already exists.");

        var fee = await finance.GetActiveFeeStructureAsync(feeStructureId, cancellationToken)
            ?? throw new ArgumentException("Active fee structure was not found.");
        if (fee.TotalAmount <= 0)
            throw new ArgumentException("Fee structure amount must be greater than zero.");

        var invoice = new StudentInvoice
        {
            StudentId = studentId,
            FeeStructureId = fee.Id,
            InvoiceNumber = normalizedInvoiceNumber,
            Amount = fee.TotalAmount,
            PaidAmount = 0,
            Currency = fee.Currency,
            Status = "Unpaid"
        };

        await finance.AddInvoiceAsync(invoice, cancellationToken);
        await finance.SaveChangesAsync(cancellationToken);
        await finance.AddPaymentLedgerEntryAsync(new PaymentLedgerEntry
        {
            StudentId = studentId,
            StudentInvoiceId = invoice.Id,
            EntryType = "Invoice",
            Description = $"Invoice {invoice.InvoiceNumber}",
            Amount = invoice.Amount,
            Currency = invoice.Currency,
            Reference = invoice.InvoiceNumber
        }, cancellationToken);
        await finance.SaveChangesAsync(cancellationToken);
        return invoice;
    }

    public async Task<Payment> RecordPaymentAsync(Guid invoiceId, string receiptNumber, decimal amount, string paymentMethod, string? reference, CancellationToken cancellationToken)
    {
        if (amount <= 0) throw new ArgumentException("Payment amount must be greater than zero.");
        if (string.IsNullOrWhiteSpace(receiptNumber)) throw new ArgumentException("Receipt number is required.");
        if (string.IsNullOrWhiteSpace(paymentMethod)) throw new ArgumentException("Payment method is required.");

        var normalizedReceipt = receiptNumber.Trim();
        if (await finance.ReceiptExistsAsync(normalizedReceipt, cancellationToken))
            throw new InvalidOperationException("Receipt number already exists.");

        var invoice = await finance.GetInvoiceAsync(invoiceId, cancellationToken)
            ?? throw new ArgumentException("Invoice was not found.");
        var outstanding = invoice.Amount - invoice.PaidAmount;
        if (outstanding <= 0)
            throw new InvalidOperationException("Invoice is already fully paid.");
        if (amount > outstanding)
            throw new ArgumentException($"Payment exceeds the outstanding balance of {outstanding:0.00} {invoice.Currency}.");

        invoice.PaidAmount += amount;
        invoice.Status = invoice.PaidAmount >= invoice.Amount ? "Paid" : "PartiallyPaid";

        var payment = new Payment
        {
            StudentInvoiceId = invoice.Id,
            ReceiptNumber = normalizedReceipt,
            Amount = amount,
            Currency = invoice.Currency,
            PaymentMethod = paymentMethod.Trim(),
            Reference = string.IsNullOrWhiteSpace(reference) ? null : reference.Trim()
        };

        var allocation = new PaymentAllocation
        {
            PaymentId = payment.Id,
            StudentInvoiceId = invoice.Id,
            AllocatedAmount = amount,
            Currency = invoice.Currency,
            Notes = "Automatic allocation on receipt"
        };
        payment.Allocations.Add(allocation);

        await finance.AddPaymentAsync(payment, cancellationToken);
        await finance.AddPaymentAllocationAsync(allocation, cancellationToken);
        await finance.AddPaymentLedgerEntryAsync(new PaymentLedgerEntry
        {
            StudentId = invoice.StudentId,
            StudentInvoiceId = invoice.Id,
            PaymentId = payment.Id,
            PaymentAllocationId = allocation.Id,
            EntryType = "Payment",
            Description = $"Payment {payment.ReceiptNumber}",
            Amount = -amount,
            Currency = payment.Currency,
            Reference = payment.Reference ?? payment.ReceiptNumber
        }, cancellationToken);
        await finance.SaveChangesAsync(cancellationToken);
        return payment;
    }

    public async Task<Payment> RecordUnallocatedPaymentAsync(Guid studentId, string receiptNumber, decimal amount, string paymentMethod, string currency, string? reference, CancellationToken cancellationToken)
    {
        if (!await finance.StudentExistsAsync(studentId, cancellationToken)) throw new ArgumentException("Student was not found.");
        if (amount <= 0) throw new ArgumentException("Payment amount must be greater than zero.");
        if (string.IsNullOrWhiteSpace(receiptNumber)) throw new ArgumentException("Receipt number is required.");
        if (string.IsNullOrWhiteSpace(paymentMethod)) throw new ArgumentException("Payment method is required.");
        if (string.IsNullOrWhiteSpace(currency)) throw new ArgumentException("Currency is required.");

        var normalizedReceipt = receiptNumber.Trim();
        if (await finance.ReceiptExistsAsync(normalizedReceipt, cancellationToken)) throw new InvalidOperationException("Receipt number already exists.");

        var payment = new Payment
        {
            StudentInvoiceId = null,
            ReceiptNumber = normalizedReceipt,
            Amount = amount,
            Currency = currency.Trim().ToUpperInvariant(),
            PaymentMethod = paymentMethod.Trim(),
            Reference = string.IsNullOrWhiteSpace(reference) ? null : reference.Trim()
        };

        await finance.AddPaymentAsync(payment, cancellationToken);
        await finance.AddPaymentLedgerEntryAsync(new PaymentLedgerEntry
        {
            StudentId = studentId,
            PaymentId = payment.Id,
            EntryType = "Payment",
            Description = $"Unallocated payment {payment.ReceiptNumber}",
            Amount = -amount,
            Currency = payment.Currency,
            Reference = payment.Reference ?? payment.ReceiptNumber
        }, cancellationToken);
        await finance.SaveChangesAsync(cancellationToken);
        return payment;
    }

    public async Task<Payment> AllocatePaymentAsync(Guid paymentId, IReadOnlyCollection<PaymentAllocationRequest> allocations, CancellationToken cancellationToken)
    {
        if (allocations.Count == 0) throw new ArgumentException("At least one allocation is required.");
        if (allocations.Any(x => x.Amount <= 0)) throw new ArgumentException("Allocation amounts must be greater than zero.");
        if (allocations.Select(x => x.StudentInvoiceId).Distinct().Count() != allocations.Count)
            throw new ArgumentException("An invoice may only appear once in an allocation request.");

        var payment = await finance.GetPaymentAsync(paymentId, cancellationToken)
            ?? throw new ArgumentException("Payment was not found.");
        var requested = allocations.Sum(x => x.Amount);
        if (requested > payment.UnallocatedAmount)
            throw new ArgumentException($"Allocation exceeds the payment's unallocated balance of {payment.UnallocatedAmount:0.00} {payment.Currency}.");

        foreach (var request in allocations)
        {
            var invoice = await finance.GetInvoiceAsync(request.StudentInvoiceId, cancellationToken)
                ?? throw new ArgumentException($"Invoice {request.StudentInvoiceId} was not found.");
            if (invoice.StudentId != paymentStudentId(payment, invoice))
                throw new InvalidOperationException("Payment and invoice must belong to the same student.");
            if (!string.Equals(invoice.Currency, payment.Currency, StringComparison.OrdinalIgnoreCase))
                throw new InvalidOperationException("Payment and invoice currencies must match.");

            var outstanding = invoice.Amount - invoice.PaidAmount;
            if (request.Amount > outstanding)
                throw new ArgumentException($"Allocation exceeds invoice {invoice.InvoiceNumber}'s outstanding balance of {outstanding:0.00} {invoice.Currency}.");

            invoice.PaidAmount += request.Amount;
            invoice.Status = invoice.PaidAmount >= invoice.Amount ? "Paid" : "PartiallyPaid";
            var allocation = new PaymentAllocation
            {
                PaymentId = payment.Id,
                StudentInvoiceId = invoice.Id,
                AllocatedAmount = request.Amount,
                Currency = payment.Currency,
                Notes = string.IsNullOrWhiteSpace(request.Notes) ? "Manual allocation" : request.Notes.Trim()
            };
            payment.Allocations.Add(allocation);
            await finance.AddPaymentAllocationAsync(allocation, cancellationToken);
        }

        await finance.SaveChangesAsync(cancellationToken);
        return payment;

        static Guid paymentStudentId(Payment payment, StudentInvoice invoice) =>
            payment.StudentInvoiceId.HasValue
                ? invoice.StudentId
                : invoice.StudentId;
    }

    public async Task<Payment> AllocatePaymentFifoAsync(Guid paymentId, CancellationToken cancellationToken)
    {
        var payment = await finance.GetPaymentAsync(paymentId, cancellationToken)
            ?? throw new ArgumentException("Payment was not found.");
        if (payment.UnallocatedAmount <= 0) return payment;

        if (!payment.StudentInvoiceId.HasValue)
            throw new InvalidOperationException("FIFO allocation requires a payment linked to a student. Use a student-specific unallocated payment and allocation workflow.");

        var firstInvoice = await finance.GetInvoiceAsync(payment.StudentInvoiceId.Value, cancellationToken)
            ?? throw new ArgumentException("Payment's original invoice was not found.");
        var invoices = await finance.GetOutstandingInvoicesAsync(firstInvoice.StudentId, payment.Currency, cancellationToken);
        var remaining = payment.UnallocatedAmount;
        var requests = new List<PaymentAllocationRequest>();
        foreach (var invoice in invoices)
        {
            if (remaining <= 0) break;
            var amount = Math.Min(remaining, invoice.Amount - invoice.PaidAmount);
            if (amount > 0)
            {
                requests.Add(new PaymentAllocationRequest(invoice.Id, amount, "FIFO allocation"));
                remaining -= amount;
            }
        }
        return await AllocatePaymentAsync(paymentId, requests, cancellationToken);
    }

    public Task<IReadOnlyList<Payment>> GetPaymentsAsync(string? receiptNumber = null, string? paymentMethod = null, DateOnly? from = null, DateOnly? to = null, CancellationToken cancellationToken = default) =>
        finance.GetPaymentsAsync(receiptNumber, paymentMethod, from, to, cancellationToken);
}
