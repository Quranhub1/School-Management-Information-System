using SchoolManagement.Domain.Finance;

namespace SchoolManagement.Application.Finance;

public sealed record FeeDto(
    Guid Id,
    Guid StudentId,
    Guid? FeeStructureId,
    string InvoiceNumber,
    decimal Amount,
    decimal PaidAmount,
    decimal Balance,
    string Currency,
    string Status)
{
    public static FeeDto FromDomain(StudentInvoice invoice) => new(
        invoice.Id,
        invoice.StudentId,
        invoice.FeeStructureId,
        invoice.InvoiceNumber,
        invoice.Amount,
        invoice.PaidAmount,
        Math.Max(0m, invoice.Amount - invoice.PaidAmount),
        invoice.Currency,
        invoice.Status);
}
