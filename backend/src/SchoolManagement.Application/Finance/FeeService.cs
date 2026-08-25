using SchoolManagement.Application.Abstractions;
using SchoolManagement.Domain.Finance;

namespace SchoolManagement.Application.Finance;

public sealed class FeeService(IFeeRepository repository)
{
    public async Task<StudentInvoice> CreateInvoiceAsync(
        Guid studentId,
        Guid? feeStructureId,
        string invoiceNumber,
        decimal amount,
        string currency = "UGX",
        CancellationToken cancellationToken = default)
    {
        if (studentId == Guid.Empty) throw new ArgumentException("Student is required.", nameof(studentId));
        if (string.IsNullOrWhiteSpace(invoiceNumber)) throw new ArgumentException("Invoice number is required.", nameof(invoiceNumber));
        if (amount <= 0) throw new ArgumentOutOfRangeException(nameof(amount));

        var invoice = new StudentInvoice
        {
            StudentId = studentId,
            FeeStructureId = feeStructureId,
            InvoiceNumber = invoiceNumber.Trim(),
            Amount = amount,
            Currency = currency.Trim().ToUpperInvariant(),
            Status = "Outstanding"
        };

        await repository.AddInvoiceAsync(invoice, cancellationToken);
        await repository.SaveChangesAsync(cancellationToken);
        return invoice;
    }

    public async Task<Payment> RecordPaymentAsync(
        Guid invoiceId,
        string receiptNumber,
        decimal amount,
        string paymentMethod,
        string? reference = null,
        CancellationToken cancellationToken = default)
    {
        if (amount <= 0) throw new ArgumentOutOfRangeException(nameof(amount));
        var invoice = await repository.GetInvoiceAsync(invoiceId, cancellationToken)
            ?? throw new KeyNotFoundException("Invoice was not found.");

        var balance = invoice.Amount - invoice.PaidAmount;
        if (amount > balance) throw new InvalidOperationException("Payment exceeds the outstanding invoice balance.");

        var payment = new Payment
        {
            StudentInvoiceId = invoiceId,
            ReceiptNumber = receiptNumber.Trim(),
            Amount = amount,
            Currency = invoice.Currency,
            PaymentMethod = paymentMethod.Trim(),
            Reference = string.IsNullOrWhiteSpace(reference) ? null : reference.Trim()
        };

        invoice.PaidAmount += amount;
        invoice.Status = invoice.PaidAmount >= invoice.Amount ? "Paid" : "PartiallyPaid";

        await repository.AddPaymentAsync(payment, cancellationToken);
        await repository.SaveChangesAsync(cancellationToken);
        return payment;
    }
}
