namespace SchoolManagement.Domain.Assessment;

public sealed class LearningOutcome
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid CourseId { get; init; }
    public required string Code { get; init; }
    public required string Description { get; init; }
    public int Sequence { get; init; }
    public bool IsCompetency { get; init; } = true;
}
