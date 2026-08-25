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
    public static FinanceInvoiceDto FromDomain(StudentInvoice invoice) => new(
        invoice.Id,
        invoice.StudentId,
        invoice.FeeStructureId,
        invoice.InvoiceNumber,
        invoice.Amount,
        invoice.PaidAmount,
        Math.Max(0, invoice.Amount - invoice.PaidAmount),
        invoice.Currency,
        invoice.Status,
        invoice.IssuedAt);
}

public sealed record FinancePaymentDto(
    Guid Id,
    Guid StudentInvoiceId,
    string ReceiptNumber,
    decimal Amount,
    string Currency,
    string PaymentMethod,
    string? Reference,
    DateTimeOffset PaidAt)
{
    public static FinancePaymentDto FromDomain(Payment payment) => new(
        payment.Id,
        payment.StudentInvoiceId,
        payment.ReceiptNumber,
        payment.Amount,
        payment.Currency,
        payment.PaymentMethod,
        payment.Reference,
        payment.PaidAt);
}
