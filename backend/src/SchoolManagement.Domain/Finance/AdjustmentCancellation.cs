namespace SchoolManagement.Domain.Finance;

public sealed class AdjustmentCancellation
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid AdjustmentId { get; init; }
    public required string Reason { get; init; }
    public required string CancelledBy { get; init; }
    public DateTimeOffset CancelledAt { get; init; } = DateTimeOffset.UtcNow;
    public Guid? ReversalJournalEntryId { get; init; }
}
