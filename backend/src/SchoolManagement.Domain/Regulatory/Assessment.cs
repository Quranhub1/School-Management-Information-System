namespace SchoolManagement.Domain.Regulatory;

public sealed class Assessment
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public required string AssessmentCode { get; init; }
    public required string Title { get; init; }
    public required string RegulatoryBody { get; init; }
    public required string ProgrammeCode { get; init; }
    public required string AssessmentType { get; init; }
    public DateOnly? StartDate { get; init; }
    public DateOnly? EndDate { get; init; }
    public int DurationMinutes { get; init; }
    public decimal PassMark { get; init; }
    public decimal TotalMarks { get; init; }
    public string Status { get; init; } = "Scheduled";
    public DateTimeOffset CreatedAt { get; init; } = DateTimeOffset.UtcNow;
}
