namespace SchoolManagement.Domain.Regulatory;

public sealed class AssessmentCentre
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public required string CentreCode { get; init; }
    public required string CentreName { get; init; }
    public required string RegulatoryBody { get; init; }
    public required string Address { get; init; }
    public string? ContactPerson { get; init; }
    public string? Phone { get; init; }
    public string? Email { get; init; }
    public string Status { get; init; } = "Pending";
    public DateTimeOffset? AccreditedAt { get; init; }
    public DateTimeOffset? ExpiresAt { get; init; }
    public DateTimeOffset CreatedAt { get; init; } = DateTimeOffset.UtcNow;
}
