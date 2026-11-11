namespace SchoolManagement.Domain.Academic;

public sealed class CurriculumCourse
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid CurriculumId { get; init; }
    public Guid CourseId { get; init; }
    public int YearOfStudy { get; set; }
    public int SemesterNumber { get; set; }
    public bool IsCore { get; set; }
}
