namespace SchoolManagement.Domain.Academic;

/// <summary>
/// Defines how a course/module participates in a specific curriculum.
/// This avoids attaching curriculum rules directly to the reusable course record.
/// </summary>
public sealed class ProgrammeCourse
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid CurriculumId { get; init; }
    public Guid CourseId { get; init; }
    public int YearOfStudy { get; init; }
    public int SemesterNumber { get; init; }
    public bool IsCore { get; init; }
    public bool IsElective { get; init; }
    public int CreditUnits { get; init; }
    public string? CourseType { get; init; }
    public bool IsActive { get; set; } = true;
}
