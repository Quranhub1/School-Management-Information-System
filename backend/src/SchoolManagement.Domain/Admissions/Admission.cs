namespace SchoolManagement.Domain.Admissions;

public sealed class Admission
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid ApplicantId { get; init; }
    public Guid ProgrammeId { get; init; }
    public Guid AcademicYearId { get; init; }
    public Guid IntakeId { get; init; }
    public AdmissionStatus Status { get; set; } = AdmissionStatus.Pending;
    public DateTimeOffset CreatedAt { get; init; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? DecidedAt { get; set; }
}
