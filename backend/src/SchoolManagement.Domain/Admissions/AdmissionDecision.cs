namespace SchoolManagement.Domain.Admissions;

public sealed class AdmissionDecision
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid AdmissionId { get; init; }
    public required string Decision { get; init; }
    public string? Reason { get; init; }
    public string? DecidedBy { get; init; }
    public DateTimeOffset DecidedAt { get; init; } = DateTimeOffset.UtcNow;
}
