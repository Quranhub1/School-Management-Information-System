namespace SchoolManagement.Domain.Finance;

public sealed class StudentInvoiceLine
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid StudentInvoiceId { get; init; }
    public required string Code { get; init; }
    public required string Description { get; init; }
    public decimal Amount { get; init; }
    public string Currency { get; init; } = "UGX";
    public Guid? IncomeAccountId { get; init; }
    public int SortOrder { get; init; }
}
