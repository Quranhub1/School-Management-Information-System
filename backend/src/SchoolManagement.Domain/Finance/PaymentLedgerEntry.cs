namespace SchoolManagement.Domain.Finance;

public sealed class PaymentLedgerEntry
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid StudentId { get; init; }
    public Guid? StudentInvoiceId { get; init; }
    public Guid? PaymentId { get; init; }
    public Guid? PaymentAllocationId { get; init; }
    public DateTimeOffset EntryDate { get; init; } = DateTimeOffset.UtcNow;
    public required string EntryType { get; init; }
    public required string Description { get; init; }
    public decimal Amount { get; init; }
    public string Currency { get; init; } = "UGX";
    public string? Reference { get; init; }
}
