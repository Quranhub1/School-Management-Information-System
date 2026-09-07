namespace SchoolManagement.Domain.Finance;

/// <summary>
/// Append-only finance audit event. Events describe financial mutations without
/// permitting historical ledger records to be edited in place.
/// </summary>
public sealed class FinanceAuditEvent
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public DateTimeOffset OccurredAt { get; init; } = DateTimeOffset.UtcNow;
    public string Action { get; init; } = string.Empty;
    public string EntityType { get; init; } = string.Empty;
    public Guid? EntityId { get; init; }
    public string? SourceType { get; init; }
    public Guid? SourceId { get; init; }
    public string? PerformedBy { get; init; }
    public string? Reason { get; init; }
    public string? MetadataJson { get; init; }
}
