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
    public DateTimeOffset RecordedAt { get; init; } = DateTimeOffset.UtcNow;
}
