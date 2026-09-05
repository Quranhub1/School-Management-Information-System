using SchoolManagement.Domain.Finance;

namespace SchoolManagement.Application.Finance;

public sealed record FinanceInvoiceDto(
    Guid Id,
    Guid StudentId,
    Guid? FeeStructureId,
    string InvoiceNumber,
    decimal Amount,
    decimal PaidAmount,
    decimal Balance,
    string Currency,
    string Status,
    DateTimeOffset IssuedAt)
{
    public static FinanceInvoiceDto FromDomain(StudentInvoice invoice) => new(invoice.Id, invoice.StudentId, invoice.FeeStructureId, invoice.InvoiceNumber, invoice.Amount, invoice.PaidAmount, Math.Max(0, invoice.Amount - invoice.PaidAmount), invoice.Currency, invoice.Status, invoice.IssuedAt);
}

public sealed record FinancePaymentDto(
    Guid Id,
    Guid StudentId,
    Guid? StudentInvoiceId,
    string ReceiptNumber,
    decimal Amount,
    decimal AllocatedAmount,
    decimal UnallocatedAmount,
    string Currency,
    string PaymentMethod,
    string? Reference,
    DateTimeOffset PaidAt)
{
    public static FinancePaymentDto FromDomain(Payment payment) => new(payment.Id, payment.StudentId, payment.StudentInvoiceId, payment.ReceiptNumber, payment.Amount, payment.AllocatedAmount, payment.UnallocatedAmount, payment.Currency, payment.PaymentMethod, payment.Reference, payment.PaidAt);
}

public sealed record FinanceLedgerEntryDto(
    Guid Id,
    Guid StudentId,
    Guid? StudentInvoiceId,
    Guid? PaymentId,
    string EntryType,
    string Description,
    decimal Amount,
    string Currency,
    string? Reference,
    DateTimeOffset EntryDate)
{
    public static FinanceLedgerEntryDto FromDomain(PaymentLedgerEntry entry) => new(entry.Id, entry.StudentId, entry.StudentInvoiceId, entry.PaymentId, entry.EntryType, entry.Description, entry.Amount, entry.Currency, entry.Reference, entry.EntryDate);
}
