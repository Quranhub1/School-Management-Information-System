namespace SchoolManagement.Domain.Academic;

/// <summary>
/// A scheduled class instance for a programme in an academic period.
/// Represents a group of students taking a set of courses together.
/// </summary>
public sealed class AcademicClass
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid ProgrammeId { get; init; }
    public Guid AcademicPeriodId { get; init; }
    public required string Code { get; set; }
    public string? Name { get; set; }
    public int YearOfStudy { get; set; }
    public int? MaxEnrolment { get; set; }
    public ClassStatus Status { get; set; } = ClassStatus.Active;
    public DateTimeOffset CreatedAtUtc { get; init; } = DateTimeOffset.UtcNow;
}

public enum ClassStatus
{
    Active = 0,
    Closed = 1,
    Cancelled = 2
}
