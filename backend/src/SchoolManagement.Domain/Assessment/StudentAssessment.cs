namespace SchoolManagement.Domain.Assessment;

public sealed class StudentAssessment
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid StudentId { get; init; }
    public Guid CourseRegistrationId { get; init; }
    public Guid AssessmentPlanId { get; init; }
    public decimal Score { get; set; }
    public decimal MaximumScore { get; init; }
    public string? Grade { get; set; }
    public string? CompetencyLevel { get; set; }
    public bool IsFinalized { get; set; }
    /// <summary>Compatibility alias used by assessment-processing callers.</summary>
    public bool IsFinal
    {
        get => IsFinalized;
        set => IsFinalized = value;
    }
    public DateTimeOffset RecordedAt { get; init; } = DateTimeOffset.UtcNow;
}
