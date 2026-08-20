namespace SchoolManagement.Domain.Examinations;

public sealed class Result
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid StudentId { get; init; }
    public Guid CourseId { get; init; }
    public Guid SemesterId { get; init; }
    public decimal Score { get; init; }
    public string? Grade { get; init; }
    public decimal GradePoint { get; init; }
    public bool IsFinal { get; set; }
}
