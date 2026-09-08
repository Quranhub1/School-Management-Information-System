namespace SchoolManagement.Domain.Finance;

public sealed class CreditNote
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid StudentInvoiceId { get; init; }
    public required string CreditNoteNumber { get; init; }
    public decimal Amount { get; init; }
    public string Reason { get; init; } = string.Empty;
    public string Status { get; init; } = "Issued";
    public DateTimeOffset IssuedAt { get; init; } = DateTimeOffset.UtcNow;
    public string? IssuedBy { get; init; }
    public DateTimeOffset? AppliedAt { get; init; }
    public DateTimeOffset? CancelledAt { get; init; }
    public string? CancelledBy { get; init; }
    public string? CancellationReason { get; init; }
}
