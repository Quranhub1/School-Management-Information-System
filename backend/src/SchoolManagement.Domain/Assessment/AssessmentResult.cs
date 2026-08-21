namespace SchoolManagement.Domain.Assessment;

/// <summary>
/// Finalized course-level result derived from a student's assessments.
/// </summary>
public sealed class AssessmentResult
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid StudentId { get; init; }
    public Guid CourseRegistrationId { get; init; }
    /// <summary>Course identifier used by result-processing calculations.</summary>
    public Guid CourseId { get; init; }
    public decimal TotalScore { get; set; }
    public string? Grade { get; set; }
    public decimal GradePoint { get; set; }
    public bool IsFinal { get; set; }
    public DateTimeOffset? FinalizedAt { get; set; }
}
