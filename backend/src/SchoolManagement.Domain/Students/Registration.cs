namespace SchoolManagement.Domain.Students;

/// <summary>
/// Academic registration of a student for an academic year and semester.
/// </summary>
public sealed class Registration
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid StudentId { get; init; }
    public Guid AcademicYearId { get; init; }
    public Guid SemesterId { get; init; }
    public Guid ProgrammeId { get; init; }
    public required string RegistrationNumber { get; init; }
    public string Status { get; set; } = "Pending";
    public DateOnly RegistrationDate { get; init; }
    public DateTimeOffset? ConfirmedAt { get; set; }
}
