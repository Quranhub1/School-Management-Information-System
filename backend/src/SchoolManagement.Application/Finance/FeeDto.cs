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
    string Status
);
