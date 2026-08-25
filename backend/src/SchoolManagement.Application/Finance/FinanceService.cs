using SchoolManagement.Application.Abstractions;
using SchoolManagement.Domain.Finance;

namespace SchoolManagement.Application.Finance;

public sealed class FinanceService(IFinanceRepository finance)
{
    public Task<IReadOnlyList<StudentInvoice>> GetStudentInvoicesAsync(Guid studentId, CancellationToken cancellationToken) =>
        finance.GetStudentInvoicesAsync(studentId, cancellationToken);

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

        await finance.AddPaymentAsync(payment, cancellationToken);
        await finance.SaveChangesAsync(cancellationToken);
        return payment;
    }

    public Task<IReadOnlyList<Payment>> GetPaymentsAsync(string? receiptNumber = null, string? paymentMethod = null, DateOnly? from = null, DateOnly? to = null, CancellationToken cancellationToken = default) =>
        finance.GetPaymentsAsync(receiptNumber, paymentMethod, from, to, cancellationToken);
}