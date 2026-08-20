namespace SchoolManagement.Domain.Academic;

public sealed class CurriculumCourse
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid CurriculumId { get; init; }
    public Guid CourseId { get; init; }
    public int YearOfStudy { get; init; }
    public int SemesterNumber { get; init; }
    public bool IsCore { get; init; }
}
