using SchoolManagement.Domain.Finance;

namespace SchoolManagement.Application.Finance;

public sealed record FeeDto(
    Guid Id,
    Guid StudentId,
    Guid? FeeStructureId,
    string InvoiceNumber,
    string FeeType,
    decimal Amount,
    decimal PaidAmount,
    decimal Balance,
    string Currency,
    string Status,
    DateTimeOffset IssuedAt)
{
    public static FeeDto FromDomain(StudentInvoice invoice) => new(
        invoice.Id,
        invoice.StudentId,
        invoice.FeeStructureId,
        invoice.InvoiceNumber,
        invoice.FeeType,
        invoice.Amount,
        invoice.PaidAmount,
        Math.Max(0m, invoice.OutstandingAmount),
        invoice.Currency,
        invoice.Status,
        invoice.IssuedAt);
}
