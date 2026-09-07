namespace SchoolManagement.Domain.Finance;

public sealed class FinanceAuditEvent
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public DateTimeOffset OccurredAt { get; init; } = DateTimeOffset.UtcNow;
    public required string Action { get; init; }
    public required string EntityType { get; init; }
    public required Guid EntityId { get; init; }
    public required string PerformedBy { get; init; }
    public string? Reason { get; init; }
    public Guid? SourceJournalEntryId { get; init; }
    public string? Metadata { get; init; }
}
