namespace SchoolManagement.Domain.Academic;

public sealed class CoursePrerequisite
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid CourseId { get; init; }
    public Guid PrerequisiteCourseId { get; init; }
    public bool IsMandatory { get; set; } = true;
    public string? MinimumGrade { get; set; }
}
