namespace SchoolManagement.Domain.Regulatory;

public sealed class ContinuousAssessment
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid StudentId { get; init; }
    public Guid AssessmentId { get; init; }
    public required string AssessmentType { get; init; }
    public required string Title { get; init; }
    public decimal Score { get; init; }
    public decimal MaxScore { get; init; }
    public string? AssessorRemarks { get; init; }
    public string? LogbookReference { get; init; }
    public string? ReportReference { get; init; }
    public DateOnly? SubmissionDate { get; init; }
    public string Status { get; init; } = "Pending";
    public DateTimeOffset CreatedAt { get; init; } = DateTimeOffset.UtcNow;
}
