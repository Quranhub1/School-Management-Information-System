namespace SchoolManagement.Domain.Students;

/// <summary>
/// Immutable audit trail for changes to a student's academic registration status.
/// </summary>
public sealed class RegistrationStatusHistory
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid RegistrationId { get; init; }
    public required string FromStatus { get; init; }
    public required string ToStatus { get; init; }
    public DateTimeOffset ChangedAt { get; init; } = DateTimeOffset.UtcNow;
    public string? Reason { get; init; }
    public Guid? ChangedByUserId { get; init; }
}
