namespace SchoolManagement.Domain.Academic;

public sealed class Admission
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid? ApplicantId { get; init; }
    public Guid StudentId { get; init; }
    public Guid ProgrammeId { get; init; }
    public Guid IntakeId { get; init; }
    public Guid? AcademicYearId { get; init; }
    public required string AdmissionNumber { get; init; }
    public required string AdmissionType { get; init; }
    public string Status { get; set; } = "Pending";
    public DateTimeOffset AppliedAt { get; init; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? AdmittedAt { get; set; }
    public DateOnly? ReportingDate { get; init; }
    public string? DecisionReference { get; init; }
}
