namespace SchoolManagement.Domain.Academic;

public sealed class Semester
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid AcademicYearId { get; set; }
    public required string Name { get; set; }
    public int Sequence { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public bool IsCurrent { get; set; }
    public bool IsActive { get; set; } = true;
}
