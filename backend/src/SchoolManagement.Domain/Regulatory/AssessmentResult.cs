namespace SchoolManagement.Domain.Regulatory;

public sealed class AssessmentResult
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid StudentId { get; init; }
    public Guid AssessmentId { get; init; }
    public required string RegulatoryBody { get; init; }
    public decimal Score { get; init; }
    public string Grade { get; init; } = string.Empty;
    public bool Passed { get; init; }
    public string? Remarks { get; init; }
    public DateTimeOffset? ReleasedAt { get; init; }
    public string Status { get; init; } = "Draft";
}
