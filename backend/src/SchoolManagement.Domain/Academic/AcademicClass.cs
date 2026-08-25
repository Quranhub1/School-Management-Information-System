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
    public required string Code { get; init; }
    public string? Name { get; init; }
    public int YearOfStudy { get; init; }
    public int? MaxEnrolment { get; init; }
    public ClassStatus Status { get; set; } = ClassStatus.Active;
    public DateTimeOffset CreatedAtUtc { get; init; } = DateTimeOffset.UtcNow;
}

public enum ClassStatus
{
    Active = 0,
    Closed = 1,
    Cancelled = 2
}
