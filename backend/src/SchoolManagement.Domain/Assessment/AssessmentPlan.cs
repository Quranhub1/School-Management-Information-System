namespace SchoolManagement.Domain.Assessment;

public sealed class AssessmentPlan
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid CourseId { get; init; }
    public required string Name { get; init; }
    public required string AssessmentType { get; init; }
    public decimal WeightPercentage { get; init; }
    public bool IsCompetencyBased { get; init; }
    public bool IsActive { get; set; } = true;
}
