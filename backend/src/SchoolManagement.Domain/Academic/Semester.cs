namespace SchoolManagement.Domain.Academic;

public sealed class Semester
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid AcademicYearId { get; init; }
    public required string Name { get; init; }
    public int Sequence { get; init; }
    public DateOnly StartDate { get; init; }
    public DateOnly EndDate { get; init; }
    public bool IsCurrent { get; set; }
    public bool IsActive { get; set; } = true;
}
