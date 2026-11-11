namespace SchoolManagement.Domain.Academic;

/// <summary>
/// A subject or unit taught within a programme.
/// Maps to a course but with programme-specific context (year, period, elective group).
/// </summary>
public sealed class Subject
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid ProgrammeId { get; set; }
    public Guid CourseId { get; set; }
    public int YearOfStudy { get; set; }
    public int? PeriodSequence { get; set; }
    public bool IsCompulsory { get; set; } = true;
    public string? ElectiveGroup { get; set; }
    public bool IsActive { get; set; } = true;
}
